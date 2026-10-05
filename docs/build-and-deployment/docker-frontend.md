---
title: "Docker для фронтенда"
section: build-and-deployment
stacks: []
description: "Docker для фронтенда: multi-stage сборка, nginx для статики и SPA-fallback, переменные окружения, docker-compose, healthcheck и публикация образа в registry."
order: 4
tags: ["docker", "dockerfile", "multi-stage", "nginx", "docker-compose", "containerization"]
questions:
  - "Зачем фронтенд-разработчику Docker"
  - "Что такое image и container и чем они отличаются"
  - "Как multi-stage build уменьшает размер образа"
  - "Как nginx раздаёт статику и почему нужен SPA fallback"
  - "Как прокинуть переменные окружения в контейнер на runtime"
  - "Чем build-time переменные отличаются от runtime"
  - "Зачем нужны .dockerignore и non-root пользователь"
  - "Что такое healthcheck и зачем он оркестратору"
  - "Как docker-compose упрощает локальную разработку"
answers:
  - "Docker даёт одинаковое окружение на всех машинах и в production: устраняет проблему «у меня работает», изолирует версии Node, позволяет деплоить SPA в контейнере с nginx на любую платформу (Kubernetes, Fly.io, Railway, свой сервер) и легко разворачивать preview-окружения для PR."
  - "Image — неизменяемый шаблон с кодом, слоями файловой системы и конфигурацией; container — запущенный экземпляр image с собственной изолированной файловой системой, сетью и процессами. Image можно переиспользовать и публиковать в registry, container — процесс."
  - "Multi-stage делит Dockerfile на этапы: builder (node, npm ci, build) собирает бандл, а production-этап (nginx) копирует только dist/ — финальный образ не содержит node_modules, исходников и инструментов сборки и весит десятки МБ вместо сотен."
  - "nginx раздаёт статику из каталога и кэширует её: location / с root и try_files $uri /index.html перенаправляет несуществующие пути на index.html — это SPA fallback, который заставляет клиентский роутер (React Router/Vue Router) обрабатывать маршрут."
  - "Runtime-переменные прокидываются через ENV в docker run -e VAR=value или в compose через environment, а приложение читает их на клиенте через window.env, потому что бандл уже собран — build-time переменные (VITE_, NEXT_PUBLIC_) вшиваются в код при сборке и меняются только пересборкой образа."
  - "Build-time переменные (ARG/VITE_*/NEXT_PUBLIC_*) подставляются в бандл на этапе сборки и навсегда остаются в коде; runtime-переменные задаются при запуске контейнера через ENV и читаются приложением в момент старта — они позволяют деплоить один образ на разные окружения без пересборки."
  - ".dockerignore исключает node_modules, dist, .git и логи из контекста сборки — быстрее передача контекста и меньше риск копирования мусора в образ; non-root пользователь (USER node) запускает процессы с ограниченными правами и снижает последствия компрометации контейнера."
  - "HEALTHCHECK — команда, которую Docker и оркестратор периодически выполняют в контейнере (например, curl на /healthz): по её результату Docker помечает контейнер healthy/unhealthy, а Kubernetes удаляет нездоровые поды и перезапускает — без healthcheck деплой может подставить пользователям мёртвый под."
  - "docker-compose описывает сервисы одним файлом: фронтенд (build из Dockerfile), API, PostgreSQL — команда docker compose up поднимает всё локально одной командой, прокидывает порты и сети, а переменные окружения и volumes конфигурируются декларативно."
---

# Docker для фронтенда

Docker устраняет главную проблему разработки: окружение у всех разное. Приложение, собранное и запущенное в контейнере, ведёт себя одинаково на ноутбуке, в CI и в production. Разберём, как собрать образ SPA с multi-stage build, раздать статику через nginx и опубликовать образ в registry.

## Содержание

1. [Зачем фронтендеру Docker](#зачем-фронтендеру-docker)
2. [Image и container](#image-и-container)
3. [Базовая структура Dockerfile](#базовая-структура-dockerfile)
4. [Multi-stage build](#multi-stage-build)
5. [nginx: раздача статики и SPA fallback](#nginx-раздача-статики-и-spa-fallback)
6. [Переменные окружения](#переменные-окружения)
7. [.dockerignore](#dockerignore)
8. [Non-root и healthcheck](#non-root-и-healthcheck)
9. [docker-compose для разработки](#docker-compose-для-разработки)
10. [Публикация образа в registry](#публикация-образа-в-registry)
11. [Лучшие практики](#лучшие-практики)
12. [Антипаттерны](#антипаттерны)

---

## Зачем фронтендеру Docker

- **Одинаковое окружение.** Версия Node, системные библиотеки, права — всё зафиксировано в образе. «У меня работает» исчезает.
- **Консистентный деплой.** Один образ катится на VPS, Kubernetes, Fly.io, Railway — без пересборки под платформу.
- **Preview для PR.** CI собирает образ каждой ветки и поднимает его — ревьюеры видят изменения в реальном окружении.
- **Изоляция.** Разные версии Node в одном проекте, зависимости не конфликтуют с системой.

Для статического SPA Docker не обязателен — хватит CDN. Он нужен, когда появляются SSR, API-роуты, WebSocket, БД и управляемые окружения.

---

## Image и container

- **Image** — неизменяемый шаблон: слои файловой системы, код, команда запуска. Его можно хранить, передавать и версионировать.
- **Container** — запущенный экземпляр image: изолированный процесс со своей файловой системой и сетью.

Слои image — ключ к скорости: Docker кэширует неизменённые слои и пересобирает только изменившиеся. Поэтому порядок инструкций в Dockerfile критичен (см. ниже).

---

## Базовая структура Dockerfile

Минимальный Dockerfile для SPA:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Что здесь важно:

- `node:20-alpine` — лёгкий образ Node (~50 МБ против ~350 МБ у полного).
- `COPY package*.json` до `COPY .` — слой с зависимостями не пересобирается, пока не меняется `package-lock.json` (кэш слоёв).
- `npm ci` вместо `npm install` — ставит ровно версии из lock-файла, быстрее и воспроизводимо.
- `nginx:1.27-alpine` — финальный образ раздаёт статику, Node в нём нет.

---

## Multi-stage build

Multi-stage позволяет не тащить инструменты сборки в production-образ:

```dockerfile
# Этап 1: сборка
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: production — только результат сборки
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

Результат: финальный образ содержит только собранный `dist/` и nginx. `node_modules`, исходники и инструменты сборки в него не попадают.

**Размер:** builder-этап ~400 МБ, production-образ ~25 МБ. Это быстрее выкатка, меньше поверхность атаки.

---

## nginx: раздача статики и SPA fallback

Голый nginx отдаёт файлы, но SPA с client-side роутингом ломается на прямых переходах: `/about` — это не файл, а маршрут в React Router. Нужен fallback на `index.html`.

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback: несуществующий путь → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэш для статики с хэшем в имени файла
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Практичные дополнения:

```nginx
    # gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    # проксирование API на бэкенд
    location /api/ {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
    }
```

SPA fallback (строка `try_files`) — самая частая причина «работает локально, 404 на деплое».

---

## Переменные окружения

Переменные окружения во фронтенде бывают двух видов.

### Build-time (вшиваются в бандл)

`VITE_*`, `NEXT_PUBLIC_*` подставляются при сборке:

```dockerfile
FROM node:20-alpine AS builder
ARG VITE_API_URL=https://api.example.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

Изменить их можно только пересборкой образа. Это безопасно только для несекретных значений — они попадают в публичный JS.

### Runtime (задаются при запуске контейнера)

```bash
docker run -e API_URL=https://api.example.com -p 8080:80 my-app
```

Приложение читает их через `window.env`, потому что после сборки подставить их в бандл нельзя:

```html
<!-- nginx -->
<script>
  window.env = { API_URL: "${API_URL}" };
</script>
```

```nginx
    # nginx подставляет значение ENV в шаблон
    location /config.js {
        default_type application/javascript;
        set_by_lua $api_url 'return os.getenv("API_URL") or ""';
        return 200 'window.env = { API_URL: "$api_url" };';
    }
```

Плюс runtime-переменных: **один образ деплоится на staging и production без пересборки** — меняются только переменные. Для этого nginx запускается через шаблон с подстановкой (`envsubst` или lua).

---

## .dockerignore

Контекст сборки передаётся в демон Docker целиком. `node_modules` и `dist` в нём — десятки тысяч файлов и гигабайты трафика.

```
node_modules
dist
.git
.gitignore
.env
.env.*
*.log
Dockerfile
.dockerignore
```

Результат: быстрая сборка, меньше мусора в контексте и риск случайного копирования секретов из `.env`.

---

## Non-root и healthcheck

### Non-root пользователь

Процессы в контейнере по умолчанию работают от root — если контейнер скомпрометируют, у атакующего будут root-права в хосте (при плохой изоляции). Правило: запускать приложение от непривилегированного пользователя.

```dockerfile
FROM node:20-alpine AS builder
RUN npm ci && npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# официальный nginx-образ уже запускается от не-root пользователя nginx
EXPOSE 80
```

Для Node-приложений: `USER node` после установки зависимостей и корректных прав на каталоги.

### Healthcheck

`HEALTHCHECK` — команда, которую Docker выполняет периодически. Оркестратор (Kubernetes, Docker Swarm) перезапускает контейнеры, у которых healthcheck не проходит.

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://localhost/healthz || exit 1
```

```nginx
location = /healthz {
    access_log off;
    return 200 "ok";
}
```

Без healthcheck оркестратор не знает, что под мёртв, и будет слать на него трафик.

---

## docker-compose для разработки

`docker-compose.yml` описывает все сервисы проекта одним файлом:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://api:3001

  api:
    build: ./backend
    ports:
      - "3001:3001"

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

Преимущества:

- Одна команда `docker compose up` поднимает фронтенд, API и БД.
- Порт `3000:3000` пробрасывает локальный порт в контейнер.
- Volume `.:/app` монтирует исходники — горячая перезагрузка в dev.
- Сеть между сервисами по имени (`http://api:3001`).

---

## Публикация образа в registry

Собранный образ публикуется в registry (Docker Hub, GHCR, ECR), чтобы его можно было скачать на сервер или в оркестратор.

```bash
# собрать с тегом
docker build -t ghcr.io/myorg/my-app:1.2.0 .

# запустить локально
docker run -p 8080:80 -e API_URL=https://api.example.com ghcr.io/myorg/my-app:1.2.0

# авторизоваться и запушить
docker login ghcr.io -u USERNAME
docker push ghcr.io/myorg/my-app:1.2.0
```

Версионирование:

```bash
docker tag ghcr.io/myorg/my-app:1.2.0 ghcr.io/myorg/my-app:latest
docker push ghcr.io/myorg/my-app:latest
```

`latest` — плавающий тег для быстрых деплоев; для production катится точная версия (`1.2.0`), чтобы можно было откатиться.

---

## Лучшие практики

### 1. Multi-stage build всегда

Production-образ — только результат сборки, без инструментов разработки.

### 2. Порядок COPY в Dockerfile

`package*.json` → `npm ci` → остальной код. Зависимости кэшируются, пока не меняется lock-файл.

### 3. Пиннинг версий

`node:20-alpine` — лучше, чем `node:latest`: образы обновляются, а сборка должна быть воспроизводимой. Полный пиннинг по digest — для критичных систем.

### 4. Runtime-переменные вместо пересборки

Один образ на все окружения, конфигурация — через ENV.

### 5. Non-root пользователь

Запускай процессы от непривилегированного пользователя.

### 6. Healthcheck обязателен

Без него оркестратор не видит, что контейнер мёртв.

### 7. .dockerignore

Не передавай в контекст `node_modules`, `dist`, `.git` и `.env`.

---

## Антипаттерны

### 1. Один этап, всё в одном образе

```dockerfile
# ❌ Плохо: 500 МБ образ с node_modules и исходниками
FROM node:20
COPY . .
RUN npm ci
RUN npm run build
CMD ["npx", "serve", "dist"]
```

### 2. COPY всего до установки зависимостей

```dockerfile
# ❌ Плохо: кэш слоёв не работает, npm ci пересобирается на каждую правку
COPY . .
RUN npm ci
```

### 3. `.env` в контексте сборки

```dockerfile
# ❌ Плохо: секреты попадают в образ и registry
COPY .env .
```

### 4. Запуск от root

```dockerfile
# ❌ Плохо: процесс с максимальными правами
FROM node:20
CMD ["node", "server.js"]
```

### 5. nginx без SPA fallback

```nginx
# ❌ Плохо: прямой переход на /about отдаёт 404
location / { root /usr/share/nginx/html; }
```

### 6. «Плавающий» latest в production

```bash
# ❌ Плохо: нельзя откатиться к конкретной версии
docker run ghcr.io/myorg/my-app:latest
```

---

## Ключевые тезисы для интервью

- Image — шаблон, container — запущенный процесс с изоляцией файловой системы и сети.
- Multi-stage build: builder (node) → production (nginx), в финале только `dist/`.
- `COPY package*.json` до кода — слои кэшируются, пока не меняется lock-файл.
- `npm ci` — воспроизводимая установка из lock-файла.
- SPA fallback в nginx — `try_files $uri $uri/ /index.html`.
- Build-time переменные (`VITE_*`) вшиваются в бандл; runtime — через ENV при старте.
- `.dockerignore` исключает `node_modules`, `dist`, `.git`, `.env` из контекста сборки.
- Non-root пользователь и `HEALTHCHECK` — базовые требования безопасности и оркестрации.
- `docker-compose up` поднимает фронтенд, API и БД одной командой.
- Пиннинг версий и точные теги вместо `latest` — для откатов и воспроизводимости.

## Заключение

Docker для фронтенда — это консистентные окружения и консистентный деплой. Ключевые практики: multi-stage build, кэширование слоёв, runtime-переменные, non-root и healthcheck. Освоив их, вы сможете катить одно и то же приложение на любой платформе без сюрпризов.

Ключевое для Middle+ разработчика:

- Собирать лёгкий production-образ через multi-stage.
- Настраивать nginx: статика, SPA fallback, кэш, прокси API.
- Различать build-time и runtime-переменные.
- Публиковать образы с точными тегами и откатываться.
- Использовать docker-compose для локальной разработки и preview.

## Полезные ссылки

- [Docker: Get started](https://docs.docker.com/get-started/)
- [Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker: Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [nginx: Serving static content](https://nginx.org/en/docs/http/nginx_discussion_upstream.html)