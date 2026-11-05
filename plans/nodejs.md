# Node.js — роадмап раздела

Рабочий план наполнения раздела `docs/nodejs/`. Статьи пишутся **по одной за
сессию** по скиллу `article-editor`. Этот файл — источник истины по составу,
порядку и статусу; публичный роадмап — `docs/nodejs/README.md`.

Последнее обновление: 2026-11-05.

## 1. Цель и рамки

Курс для человека, не знакомого с бэкендом: от устройства рантайма до
продвинутой серверной логики. Формат — обучающие статьи + вопросы для
самопроверки, как в остальных разделах PrePra.

В разделе:

- рантайм Node.js, асинхронность, I/O, HTTP и API;
- серверные фреймворки, данные, надёжность, деплой, архитектура.

Не в разделе:

- теория баз данных (индексы, транзакции, изоляция, нормализация) — `docs/databases`;
- протоколы и клиентская часть API (REST, GraphQL, WebSocket) — `docs/api-communication`;
- общая теория auth и XSS/CSRF — `docs/security`;
- CI/CD и платформы деплоя в целом — `docs/build-and-deployment`.

В статьях Node.js — только серверная реализация. На смежные разделы даём
ссылки, но не дублируем теорию.

## 2. Метаданные раздела

| Поле | Значение |
|---|---|
| id | `nodejs` |
| label | `Node.js` |
| icon | `Terminal` (Phosphor) |
| позиция в реестре | после `vue`, перед `architecture` |
| описание | «Рантайм, асинхронность, HTTP-API, данные, надёжность и архитектура Node.js-сервиса» |

## 3. Формат статьи

Канон — `article-editor` (`structure`, затем `focus`):

- frontmatter: `title` (≤ 6 слов), `section: nodejs`, `description` (≤ 160
  символов), `order`, `tags` (3–6), `stacks: []`, `questions` (5–8),
  `answers` (ровно столько же, непустые);
- тело: H1 = `title`, вступление 2–4 предложения, `## Содержание`, 8–14
  секций, `## Ключевые тезисы для интервью` (5–7), `## Заключение`,
  при необходимости `## Полезные ссылки`;
- для статей модулей 3–5 допустим блок `## Практика` (сквозной проект, см. §5)
  и он обязан быть в TOC;
- относительные ссылки — только на существующие файлы;
- `level`/`requires` во frontmatter пока не используем: на 25 статей и 5
  уровней правило «requires не ссылается на тот же уровень» не выполнить.
  Зависимости ниже нужны только для порядка написания.

Порядок статьи в сайт попадает через `order`; `README.md` должен совпадать.

## 4. Состав и порядок статей

Зависимости — на что статья опирается. Писать строго по порядку `order`.

### Модуль 1. Рантайм и экосистема

| № | Файл | Заголовок | Зависит от |
|---|---|---|---|
| 1 | `fundamentals.md` | Node.js: как устроен рантайм | — |
| 2 | `npm.md` | npm и экосистема пакетов | 1 |
| 3 | `modules.md` | Модули: CommonJS и ESM | 1, 2 |
| 4 | `builtin-api.md` | Встроенные модули Node.js | 3 |
| 5 | `event-loop.md` | Event Loop в Node.js | 1, 4 |

### Модуль 2. Асинхронность и ввод-вывод

| № | Файл | Заголовок | Зависит от |
|---|---|---|---|
| 6 | `async.md` | Асинхронность в Node.js | 5 |
| 7 | `event-emitter.md` | EventEmitter и события | 6 |
| 8 | `streams.md` | Стримы и backpressure | 4, 6, 7 |
| 9 | `worker-threads.md` | Worker Threads и cluster | 1, 5 |
| 10 | `http-clients.md` | HTTP-клиенты в Node.js | 6 |

### Модуль 3. HTTP и API

| № | Файл | Заголовок | Зависит от |
|---|---|---|---|
| 11 | `http-server.md` | HTTP-сервер на чистом Node | 4, 8 |
| 12 | `express.md` | Express и middleware | 11 |
| 13 | `frameworks.md` | Fastify и NestJS | 12 |
| 14 | `validation-config.md` | Конфигурация и валидация | 12 |
| 15 | `auth.md` | Аутентификация в API | 12, 14 |
| 16 | `realtime-server.md` | WebSocket и SSE на сервере | 11, 15 |
| 17 | `logging-observability.md` | Логирование и наблюдаемость | 12, 14 |

### Модуль 4. Данные и интеграции

| № | Файл | Заголовок | Зависит от |
|---|---|---|---|
| 18 | `database-access.md` | Доступ к базам данных | 6, 14 |
| 19 | `redis-and-queues.md` | Redis и фоновые задачи | 17, 18 |

### Модуль 5. Прод и архитектура

| № | Файл | Заголовок | Зависит от |
|---|---|---|---|
| 20 | `testing.md` | Тестирование Node-приложений | 12, 18 |
| 21 | `security.md` | Безопасность Node API | 15, 18 |
| 22 | `performance.md` | Производительность и память | 5, 9 |
| 23 | `reliability.md` | Таймауты, ретраи и graceful shutdown | 10, 17, 19 |
| 24 | `deployment.md` | Docker и деплой Node.js | 23 |
| 25 | `architecture.md` | Архитектура Node-бэкенда | 18, 20, 23 |

## 5. Брифы статей

Коротко: что обязательно раскрыть и какие вопросы собеседования закрыть.
5–8 вопросов во frontmatter выводятся из этого списка.

### 1. `fundamentals.md` — Node.js: как устроен рантайм

- V8 и libuv: что делает каждый, где проходит граница.
- Один поток выполнения + пул libuv (4 потока по умолчанию): какие операции
  уходят в пул, а какие остаются в главном потоке.
- Неблокирующий I/O и миф о «single-threaded».
- `global`, `globalThis`, отсутствие `window`/`document`; отличие от браузера.
- Когда Node уместен (I/O-bound, realtime, API) и когда нет (CPU-bound).
- Вопросы: почему Node быстрый; что произойдёт при `while(true)`; чем
  браузерный рантайм отличается от Node; где выполняется `crypto.pbkdf2`.

### 2. `npm.md` — npm и экосистема пакетов

- `package.json`: `name`, `version`, `type`, `main`/`exports`, `scripts`,
  `engines`.
- semver: `^`, `~`, точная версия; мажор/минор/патч.
- `dependencies` vs `devDependencies` vs `peerDependencies`.
- lockfile: зачем, чем отличаются `package-lock.json` и `pnpm-lock.yaml`.
- `npx`, локальные и глобальные бинарники, `npm ci`.
- pnpm и workspaces: зачем нужны в монорепо.
- Вопросы: почему `^1.2.3` может сломать сборку; зачем lockfile в git;
  чем `npm install` отличается от `npm ci`; что такое peer dependency.

### 3. `modules.md` — Модули: CommonJS и ESM

- `require`/`module.exports` vs `import`/`export`, `type: "module"`.
- Алгоритм разрешения: `node_modules`, `exports`/`imports`, расширения,
  `index.js`.
- `__dirname`/`__filename` vs `import.meta.url`.
- Динамический `import()`, top-level await.
- Dual packages и проблема двойной загрузки; `require(esm)`.
- Циклические зависимости и почему ESM справляется иначе.
- Вопросы: почему `require` синхронный; как Node выбирает файл; что будет
  при цикле; зачем поле `exports`.

### 4. `builtin-api.md` — Встроенные модули Node.js

- `process`: `env`, `argv`, `exitCode`, сигналы, `nextTick`.
- `Buffer`: зачем, отличие от строки, кодировки, `alloc` vs `allocUnsafe`.
- `path`: `join`/`resolve`, `parse`, `sep`, кроссплатформенность.
- `fs`: sync/async/promises, `readFile` vs `createReadStream`.
- `os`, `url` (`URL`, `URLSearchParams`), `crypto` (`randomUUID`,
  `createHash`, `timingSafeEqual`), `timers`.
- Вопросы: чем Buffer отличается от Uint8Array; почему `readFile` опасен для
  больших файлов; чем `path.join` отличается от `path.resolve`.

### 5. `event-loop.md` — Event Loop в Node.js

- Фазы: timers → pending callbacks → idle/prepare → poll → check → close.
- `process.nextTick` vs microtasks (`Promise`) vs `setImmediate` vs
  `setTimeout(fn, 0)`: порядок и приоритеты.
- Голодание event loop, `nextTick`-рекурсия, блокирующий код.
- Event loop lag: как измерять (`perf_hooks.monitorEventLoopDelay`) и почему
  это метрика здоровья сервиса.
- Отличие от браузерного Event Loop (ссылка на `docs/javascript`).
- Вопросы: в каком порядке выведутся `nextTick`, Promise, `setTimeout`,
  `setImmediate`; почему `setTimeout(0)` не гарантирует 0 мс; что будет при
  синхронном хешировании в обработчике.

### 6. `async.md` — Асинхронность в Node.js

- Error-first callbacks и `util.promisify`.
- Promise, `async/await`, последовательное и параллельное выполнение.
- `unhandledRejection` и `uncaughtException`: чем опасны, что делать.
- Отмена операций через `AbortSignal`.
- `AsyncLocalStorage`: request-scoped контекст, логирование, трассировка.
- Вопросы: почему `uncaughtException` не повод продолжать работу; как
  пробросить request-id через async-вызовы; чем `Promise.all` опасен при
  частичном падении.

### 7. `event-emitter.md` — EventEmitter и события

- `on`, `once`, `off`, `emit`, `removeAllListeners`.
- Событие `error`: почему без слушателя процесс падает.
- `maxListeners` и утечки слушателей; как искать.
- `captureRejections`, асинхронные слушатели.
- Паттерн observer и где он уместен в сервисе.
- Вопросы: что будет при `emit('error')` без слушателя; как async-слушатель
  ломает порядок; почему слушатели в цикле — утечка.

### 8. `streams.md` — Стримы и backpressure

- Readable, Writable, Duplex, Transform; object mode.
- `pipe` vs `pipeline`, обработка ошибок и `finished`.
- Backpressure: `highWaterMark`, `write()` → `false`, `drain`.
- Потоковая обработка больших файлов, CSV, архивы.
- Web Streams и совместимость.
- Вопросы: что произойдёт без backpressure; как работает `pipeline` при
  ошибке в середине; почему `readFile` + `res.end` убивает память.

### 9. `worker-threads.md` — Worker Threads и cluster

- CPU-bound vs I/O-bound: когда пул libuv не помогает.
- `worker_threads`, `MessageChannel`, `SharedArrayBuffer`, `Atomics`.
- `cluster`: форк процессов, общий порт, sticky sessions.
- `child_process`: `spawn`, `exec`, `fork`; когда внешний процесс.
- PM2 и запуск нескольких инстансов.
- Вопросы: чем worker отличается от cluster; почему `cluster` не решает
  CPU-bound внутри одного запроса; как передать данные в worker.

### 10. `http-clients.md` — HTTP-клиенты в Node.js

- `fetch` (undici) и `http.request`: уровни абстракции.
- `Agent`, keep-alive, пул соединений, лимиты.
- Таймауты: connect, headers, body; `AbortController`.
- Ретраи и идемпотентность; где ретраить нельзя.
- Обработка 4xx/5xx, парсинг, стриминг ответа.
- Вопросы: почему `fetch` не бросает на 500; зачем keep-alive; чем опасен
  ретрай POST; как отменить запрос по таймауту.

### 11. `http-server.md` — HTTP-сервер на чистом Node

- `http.createServer`, `req`/`res`, заголовки, статусы.
- Чтение body: чанки, лимиты, `Content-Length`.
- Ручной routing и почему это быстро становится болью.
- Keep-alive, `Connection`, таймауты сокетов.
- HTTPS и терминция TLS.
- Вопросы: что произойдёт, если не вызвать `res.end()`; как защититься от
  огромного body; зачем нужен reverse proxy перед Node.

### 12. `express.md` — Express и middleware

- Routing, параметры, `Router`.
- Цепочка middleware, `next()`, порядок регистрации.
- Error middleware: 4 аргумента, синхронные и асинхронные ошибки.
- `express.json()` и лимиты; статика.
- Структура проекта: routes → controllers → services.
- Вопросы: почему error middleware идёт последним; что будет без `next()`;
  как поймать ошибку из async-обработчика в Express 4 и 5.

### 13. `frameworks.md` — Fastify и NestJS

- Fastify: схемы, валидация, hooks, плагины, инкапсуляция.
- NestJS: модули, DI, контроллеры, провайдеры, guards/interceptors.
- Производительность и накладные расходы.
- Когда Express, когда Fastify, когда NestJS.
- Вопросы: зачем DI на сервере; чем plugin отличается от middleware; почему
  NestJS тяжелее для маленького сервиса.

### 14. `validation-config.md` — Конфигурация и валидация

- 12-factor, env, `.env`, `dotenv`; секреты не в коде.
- Валидация конфига на старте (fail fast).
- zod/joi: схемы для body, query, params, ответов.
- DTO и преобразование типов; `unknown` vs `any`.
- Вопросы: почему конфиг валидируют при старте; чем опасен `req.query` без
  валидации; где хранить секреты в проде.

### 15. `auth.md` — Аутентификация в API

- Сессии + cookies (`httpOnly`, `secure`, `sameSite`) vs JWT.
- Access/refresh токены, rotation, отзыв.
- Хеширование паролей: argon2/bcrypt, соль, cost.
- RBAC/ABAC, проверка прав на уровне роутов и сервисов.
- OAuth 2.0 / OIDC в общих чертах; CSRF для cookie-сессий.
- Вопросы: почему JWT не отозвать; где хранить токен в SPA; чем
  аутентификация отличается от авторизации; почему `sameSite` не панацея.

### 16. `realtime-server.md` — WebSocket и SSE на сервере

- `ws` и socket.io: протокол, комнаты, acknowledgements.
- SSE на сервере: `text/event-stream`, heartbeat, `Last-Event-ID`.
- Переподключения, буферизация, порядок сообщений.
- Масштабирование: sticky sessions, Redis adapter, pub/sub.
- Вопросы: почему WebSocket требует sticky sessions; чем SSE проще; как
  рассылать событие всем инстансам.

### 17. `logging-observability.md` — Логирование и наблюдаемость

- pino: уровни, structured logs, сериализаторы, redaction.
- request-id и `AsyncLocalStorage`; сквозной контекст.
- Health checks: liveness vs readiness.
- Метрики (RED/USE), `/metrics`, OpenTelemetry-трейсы.
- Вопросы: почему `console.log` плох в проде; чем liveness отличается от
  readiness; как связать логи запроса и ошибки.

### 18. `database-access.md` — Доступ к базам данных

- `pg`: `Pool` vs `Client`, размер пула, `idleTimeout`.
- Параметризованные запросы и SQL-инъекции.
- Транзакции: `BEGIN`/`COMMIT`/`ROLLBACK`, `try/finally`, уровень клиента.
- N+1 и как его увидеть.
- Миграции и ORM как слой (Prisma/Drizzle) — без теории БД.
- Ссылки: `docs/databases` (индексы, изоляция, нормализация).
- Вопросы: почему пул больше числа соединений БД — плохо; что будет при
  ошибке внутри транзакции; как ORM провоцирует N+1.

### 19. `redis-and-queues.md` — Redis и фоновые задачи

- Redis-клиент: подключение, реконнект, таймауты.
- Cache-aside, TTL, инвалидация, thundering herd.
- Rate limit и сессии на Redis.
- BullMQ: producer/worker, ретраи и backoff, идемпотентность, DLQ, cron.
- Graceful shutdown воркера; `waitUntilReady`.
- Ссылки: `docs/databases` (структуры данных Redis, eviction).
- Вопросы: почему кеш без TTL — утечка; как сделать задачу идемпотентной;
  что будет с задачей при падении воркера.

### 20. `testing.md` — Тестирование Node-приложений

- Встроенный `node:test` vs Vitest/Jest.
- Unit, интеграционные, e2e; что тестировать на каком уровне.
- supertest и поднятие приложения без реального порта.
- Моки: модули, время, внешние HTTP; testcontainers для БД.
- Покрытие и его пределы.
- Вопросы: чем интеграционный тест отличается от e2e; как тестировать
  ошибки БД; почему мок всего подряд делает тесты бесполезными.

### 21. `security.md` — Безопасность Node API

- helmet и security-заголовки; CORS точечно.
- Rate limiting и брутфорс.
- Инъекции: SQL, NoSQL, command injection.
- SSRF, path traversal, небезопасная десериализация.
- Секреты, `npm audit`, supply chain, `--frozen-lockfile`.
- OWASP API Top 10 как чеклист.
- Ссылки: `docs/security`.
- Вопросы: почему `cors()` без настроек опасен; чем SSRF опаснее XSS для
  бэкенда; как валидация входа предотвращает инъекции.

### 22. `performance.md` — Производительность и память

- Профилирование: `--inspect`, `--prof`, clinic, `0x`.
- Утечки памяти: глобальные кеши, слушатели, замыкания, `Buffer`.
- Heap snapshots и сравнение.
- Event loop lag и блокирующие операции.
- Нагрузочное тестирование: autocannon/k6, что мерить.
- Вопросы: как найти утечку памяти в проде; почему кеш без ограничения —
  утечка; что показывает event loop lag.

### 23. `reliability.md` — Таймауты, ретраи и graceful shutdown

- Классификация ошибок: операционные vs программерские.
- Таймауты на всех уровнях; deadline propagation.
- Ретраи, backoff, jitter, идемпотентность.
- Circuit breaker и bulkhead; деградация.
- Graceful shutdown: SIGTERM, `server.close`, дренаж, воркеры.
- Вопросы: почему ретрай без backoff усиливает сбой; что делать при SIGTERM;
  зачем circuit breaker, если есть таймауты.

### 24. `deployment.md` — Docker и деплой Node.js

- Dockerfile: multi-stage, `npm ci --omit=dev`, non-root.
- PID 1 и сигналы; `tini`/`--init`.
- Лимиты памяти и `--max-old-space-size`.
- PM2/systemd, reverse proxy (nginx), TLS.
- Zero-downtime: health checks, rolling deploy.
- Ссылки: `docs/build-and-deployment`.
- Вопросы: почему Node в контейнере не получает SIGTERM; зачем non-root;
  почему `node_modules` не копируют из dev-стадии.

### 25. `architecture.md` — Архитектура Node-бэкенда

- Слои: transport → controller → service → repository.
- DI без фреймворка и с NestJS; тестируемость.
- Границы модулей, общие типы, валидация на границах.
- Модульный монолит vs микросервисы: цена перехода.
- Версионирование API, обратная совместимость.
- Ссылки: `docs/architecture`.
- Вопросы: зачем слой репозитория; когда микросервисы вредят; как менять API
  без ломки клиентов.

## 6. Сквозной проект (опционально)

Чтобы «Практика» была не набором сниппетов, можно вести один проект —
**TaskFlow API** (задачи и проекты). Он растёт по модулям:

| Модуль | Что добавляем |
|---|---|
| 3 | HTTP-сервер → Express → валидация → auth |
| 4 | PostgreSQL, миграции, Redis-кеш, очередь уведомлений |
| 5 | тесты, security-обвязка, метрики, Docker, слоистая структура |

Блок `## Практика` добавляем в статьи 11–25, где есть что запускать. Если
проект не тянем — блок не добавляем, это не обязательное требование канона.

## 7. Протокол одной сессии

1. Открыть этот файл, найти первый неотмеченный пункт в §8.
2. Прочитать `docs/nodejs/README.md` и 1–2 соседние готовые статьи — для
   голоса и структуры. Не читать весь раздел.
3. Прочитать статью-зависимость, если тема новая (см. таблицы §4).
4. Написать статью по канону `article-editor` (`structure`).
5. Прогнать `article-editor` в режиме `check`, исправить замечания.
6. Проверить относительные ссылки: только на существующие файлы. На
   `docs/databases` пока ссылаться нельзя — писать текстом «раздел „Базы
   данных“», ссылку добавить после его появления.
7. Отметить пункт в §8, записать дату.
8. Если раздел ещё не подключён к сайту — выполнить §9 (один раз).

**Definition of done для статьи:** чеклист `article-editor` §10 пройден,
`questions`/`answers` синхронизированы, `order` совпадает с README, ссылки
живые, статус обновлён.

## 8. Статус

Отмечать `[x]` после прохождения `check` и обновления README.

### Каркас

- [x] Решение по id, рамкам и разделению с `docs/databases`
- [x] `docs/nodejs/README.md` с роадмапом
- [ ] Удалить пустую `docs/backend/`
- [x] Подключить раздел к сайту (§9) (2026-11-05)
- [ ] `docs/nodejs/CHEATSHEET.md` (после 10–12 статей)

### Модуль 1. Рантайм и экосистема

- [x] 1. `fundamentals.md` (2026-11-04)
- [x] 2. `npm.md` (2026-11-04)
- [x] 3. `modules.md` (2026-11-05)
- [x] 4. `builtin-api.md` (2026-11-05)
- [x] 5. `event-loop.md` (2026-11-05)

### Модуль 2. Асинхронность и ввод-вывод

- [x] 6. `async.md` (2026-11-05)
- [x] 7. `event-emitter.md` (2026-11-05)
- [x] 8. `streams.md` (2026-11-05)
- [x] 9. `worker-threads.md` (2026-11-05)
- [x] 10. `http-clients.md` (2026-11-05)

### Модуль 3. HTTP и API

- [x] 11. `http-server.md` (2026-11-05)
- [x] 12. `express.md` (2026-11-05)
- [x] 13. `frameworks.md` (2026-11-05)
- [x] 14. `validation-config.md` (2026-11-05)
- [x] 15. `auth.md` (2026-11-05)
- [x] 16. `realtime-server.md` (2026-11-05)
- [x] 17. `logging-observability.md` (2026-11-05)

### Модуль 4. Данные и интеграции

- [x] 18. `database-access.md` (2026-11-05)
- [x] 19. `redis-and-queues.md` (2026-11-05)

### Модуль 5. Прод и архитектура

- [x] 20. `testing.md` (2026-11-05)
- [x] 21. `security.md` (2026-11-05)
- [x] 22. `performance.md` (2026-11-05)
- [x] 23. `reliability.md` (2026-11-05)
- [x] 24. `deployment.md` (2026-11-05)
- [x] 25. `architecture.md` (2026-11-05)

## 9. Подключение к сайту

Выполнить, когда готовы статьи 1–3 (пустой раздел на сайте не нужен).

1. `site/src/content/config.ts`
   - добавить `'nodejs'` в `z.enum` (строки 6–20);
   - добавить `nodejs: articles('nodejs')` в `collections`.
2. `site/src/lib/sections.ts`
   - импортировать `Terminal` из `@phosphor-icons/react`;
   - вставить `{ id: "nodejs", label: "Node.js", icon: Terminal }` после
     `vue`, перед `architecture`.
3. `site/src/pages/[section]/index.astro`
   - добавить `nodejs: "..."` в `sectionDescriptions` (иначе возьмётся
     описание из README — это допустимый фолбэк).
4. Опционально: пресет «Node.js Backend» в
   `site/src/lib/mock-interview/presets.ts` — секции `nodejs`,
   `api-communication`, `security`, `stacks: []`, `mainSection: 'nodejs'`.
5. Проверить `npm run build` в `site/` и что сайдбар, поиск и мок-интервью
   видят раздел.

## 10. Риски

- **Ссылки на `docs/databases` до его появления.** Держим текстовые
  упоминания, ссылки добавляем после создания раздела.
- **Дублирование с `javascript`.** В каждой пересекающейся статье — блок
  «Чем отличается от браузерного/языкового» и ссылка на исходную.
- **Расползание объёма.** Одна статья за сессию, не объединять темы; если
  тема не влезает — выносить в отдельную статью с новым `order` и правкой
  README.
- **Устаревание API.** Express 5, Node 22+ LTS, `fetch`/undici: проверять
  актуальность при написании, не копировать старые примеры.
