---
title: "Серверная часть Nuxt 3: Nitro, API-роуты, middleware, кэширование и деплой"
section: nuxt
description: "Как устроена серверная часть Nuxt 3 на базе Nitro: server/api/, server/routes/, server/middleware/, обработчики defineEventHandler, работа с запросом и ответом, кэширование, пресеты деплоя и лучшие практики."
order: 6
tags: ["nuxt", "nuxt3", "nitro", "server", "api", "middleware", "ssr", "deployment", "cache"]
questions:
  - "Что такое Nitro и какова его роль в Nuxt 3"
  - "Как создать API-роут в Nuxt 3"
  - "Чем server/api/ отличается от server/routes/"
  - "Как работают серверные middleware в Nuxt"
  - "Что такое defineEventHandler и какие аргументы получает"
  - "Как получить query-параметры и тело запроса в Nitro"
  - "Как настроить кэширование серверных роутов"
  - "Что такое пресеты деплоя Nitro"
  - "Как защитить серверные роуты и работать с ошибками"
  - "Как вызывать серверные API из клиентского кода"
---

# Серверная часть Nuxt 3: Nitro, API-роуты, middleware, кэширование и деплой

Nuxt 3 позиционируется как full-stack фреймворк, и серверная часть здесь играет ключевую роль. В отличие от Vue SPA, где бэкенд обычно пишется отдельно, Nuxt предлагает встроенный серверный движок — **Nitro**. Он отвечает за dev-сервер, production-сборку, API-роуты, middleware, кэширование и универсальный деплой на десятки платформ.

В этой статье разберём, как устроена серверная часть Nuxt 3: от создания простого API до кэширования, обработки ошибок и выбора пресета для деплоя.

## Содержание

1. [Что такое Nitro](#что-такое-nitro)
2. [server/api/ — API-эндпоинты](#serverapi--api-эндпоинты)
3. [server/routes/ — произвольные серверные роуты](#serverroutes--произвольные-серверные-роуты)
4. [server/middleware/ — серверные middleware](#servermiddleware--серверные-middleware)
5. [Обработчики событий defineEventHandler](#обработчики-событий-defineeventhandler)
6. [Работа с запросом и ответом](#работа-с-запросом-и-ответом)
7. [HTTP-методы и валидация](#http-методы-и-валидация)
8. [Кэширование](#кэширование)
9. [Пресеты деплоя](#пресеты-деплоя)
10. [Вызов API из клиента](#вызов-api-из-клиента)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Nitro

**Nitro** — это серверный движок, разработанный командой UnJS специально для Nuxt 3. Он решает сразу несколько задач:

- Запускает **dev-сервер** с горячей перезагрузкой.
- Собирает **production-сервер** в `.output/server/`.
- Предоставляет универсальную среду выполнения для **API-роутов и middleware**.
- Поддерживает **кэширование** на уровне функций и роутов.
- Генерирует **пресеты деплоя** под разные платформы: Node, Vercel, Netlify, Cloudflare Workers, Deno, AWS Lambda и другие.

Nitro абстрагирует различия между runtime-окружениями. Код обработчика, написанный для dev-сервера Node, будет работать и на Cloudflare Workers без изменений — благодаря унифицированному `H3Event` API.

---

## server/api/ — API-эндпоинты

Файлы в папке `server/api/` автоматически становятся API-эндпоинтами с префиксом `/api`.

```
server/
└── api/
    ├── hello.get.ts      # GET /api/hello
    ├── users.get.ts      # GET /api/users
    └── users.post.ts     # POST /api/users
```

### Простой GET-обработчик

```ts
// server/api/hello.get.ts
export default defineEventHandler((event) => {
  return {
    message: 'Hello from Nitro!',
  };
});
```

Доступен по адресу `/api/hello` и возвращает JSON.

### POST с телом запроса

```ts
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return {
    id: Date.now(),
    name: body.name,
    email: body.email,
  };
});
```

### Динамические параметры

```ts
// server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');

  return {
    id,
    name: `User ${id}`,
  };
});
```

Доступен по `/api/users/42`, где `id` будет `'42'`.

---

## server/routes/ — произвольные серверные роуты

Папка `server/routes/` работает так же, как `server/api/`, но **не добавляет префикс `/api`**.

```
server/
└── routes/
    ├── sitemap.xml.ts   # GET /sitemap.xml
    └── rss.ts           # GET /rss
```

```ts
// server/routes/sitemap.xml.ts
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`;
});
```

Используйте `server/routes/` для путей, которые должны быть доступны напрямую, без `/api`: sitemap, rss, feed, webhooks, OAuth callback.

### catch-all роуты

```ts
// server/routes/[...slug].ts
export default defineEventHandler((event) => {
  const slug = event.context.params?.slug;

  return `Catch-all route: ${slug}`;
});
```

---

## server/middleware/ — серверные middleware

Файлы в `server/middleware/` выполняются **перед каждым серверным запросом**, включая запросы к API, роутам и SSR-страницам.

```
server/
└── middleware/
    ├── log.ts          # логирование всех запросов
    └── auth.ts         # проверка авторизации
```

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${event.method} ${event.path}`);
});
```

### Middleware с условной логикой

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  // Пропускаем публичные роуты
  if (event.path.startsWith('/api/public')) {
    return;
  }

  const token = getHeader(event, 'authorization');

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Декодируем и сохраняем в контекст
  event.context.auth = { userId: '123' };
});
```

### Важные нюансы

- Middleware выполняется **для каждого запроса**, в том числе при SSR-рендеринге страниц.
- Порядок выполнения middleware — **алфавитный** по имени файла.
- Middleware не должны возвращать ответ, если запрос должен продолжить обработку. Возврат ответа из middleware прерывает дальнейшую обработку.

---

## Обработчики событий defineEventHandler

`defineEventHandler` — основной способ объявления серверного обработчика в Nitro. Он принимает функцию с единственным аргументом — `event` типа `H3Event`.

```ts
export default defineEventHandler((event) => {
  // event.node.req — низкоуровневый Node-запрос (там, где доступен)
  // event.context — общий контекст запроса
  // event.method — HTTP-метод
  // event.path — путь запроса
});
```

### Асинхронные обработчики

```ts
export default defineEventHandler(async (event) => {
  const data = await fetchExternalData();
  return data;
});
```

### Типизация

```ts
import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  // ...
});
```

---

## Работа с запросом и ответом

Nitro предоставляет удобные хелперы из `h3` для работы с запросом и формирования ответа.

### Параметры запроса

```ts
// GET /api/search?q=nuxt
export default defineEventHandler((event) => {
  const query = getQuery(event);

  return {
    search: query.q,
  };
});
```

### Тело запроса

```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return body;
});
```

### Заголовки

```ts
// Чтение
const token = getHeader(event, 'authorization');

// Запись
setResponseHeader(event, 'X-Custom-Header', 'value');
setResponseStatus(event, 201);
```

### Cookies

```ts
// Чтение
const sessionId = getCookie(event, 'sessionId');

// Запись
setCookie(event, 'sessionId', 'abc123', {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
});

// Удаление
deleteCookie(event, 'sessionId');
```

### Отправка ошибок

```ts
export default defineEventHandler(() => {
  throw createError({
    statusCode: 404,
    statusMessage: 'Resource not found',
  });
});
```

### sendRedirect

```ts
export default defineEventHandler((event) => {
  return sendRedirect(event, '/login', 302);
});
```

---

## HTTP-методы и валидация

### Суффиксы методов

Nitro позволяет создавать отдельные обработчики для разных HTTP-методов через суффиксы в имени файла:

```
server/api/users.get.ts    # GET /api/users
server/api/users.post.ts   # POST /api/users
server/api/users.put.ts    # PUT /api/users
server/api/users.delete.ts # DELETE /api/users
```

### Универсальный обработчик

Если файл без суффикса, обработчик получает все методы:

```ts
// server/api/users.ts
export default defineEventHandler((event) => {
  if (event.method === 'GET') {
    return getUsers();
  }

  if (event.method === 'POST') {
    return createUser(event);
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed',
  });
});
```

### Валидация с помощью readValidatedBody

```ts
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, userSchema.parse);

  return {
    id: Date.now(),
    name: body.name,
    email: body.email,
  };
});
```

`readValidatedBody` автоматически вернёт ошибку 400, если тело не проходит валидацию.

---

## Кэширование

Nitro предлагает мощные механизмы кэширования как на уровне отдельных функций, так и на уровне роутов.

### cachedEventHandler

```ts
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
  const posts = await $fetch('https://api.example.com/posts');
  return posts;
});
```

```ts
// server/api/posts.get.ts с кэшем
export default defineCachedEventHandler(async (event) => {
  const posts = await $fetch('https://api.example.com/posts');
  return posts;
}, {
  maxAge: 60 * 5, // 5 минут
  name: 'posts',
  getKey: (event) => 'all-posts',
});
```

### cachedFunction

Если нужно закэшировать отдельную функцию, а не весь роут:

```ts
// server/utils/fetchPosts.ts
export const fetchPosts = defineCachedFunction(async () => {
  const posts = await $fetch('https://api.example.com/posts');
  return posts;
}, {
  maxAge: 60 * 5,
  name: 'fetchPosts',
});
```

```ts
// server/api/posts.get.ts
export default defineEventHandler(async () => {
  return await fetchPosts();
});
```

### Кэширование через routeRules

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/posts': { cache: { maxAge: 60 * 5 } },
    '/api/categories': { cache: { maxAge: 60 * 60 } },
  },
});
```

### Параметры кэша

| Параметр | Назначение |
|---|---|
| `maxAge` | Время жизни кэша в секундах. |
| `staleMaxAge` | Время, в течение которого устаревший кэш может отдаваться при обновлении в фоне. |
| `getKey` | Функция для формирования ключа кэша. |
| `swr` | Stale-while-revalidate: отдавать кэш и обновлять в фоне. |
| `varies` | Параметры запроса, от которых зависит кэш. |

---

## Пресеты деплоя

Одна из сильных сторон Nitro — универсальность деплоя. Один и тот же код можно собрать под разные платформы.

### Через переменную окружения

```bash
NITRO_PRESET=node-server npm run build
NITRO_PRESET=vercel npm run build
NITRO_PRESET=netlify npm run build
NITRO_PRESET=cloudflare-pages npm run build
```

### Через nuxt.config.ts

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',
  },
});
```

### Популярные пресеты

| Пресет | Платформа |
|---|---|
| `node-server` | Node.js сервер (по умолчанию) |
| `static` | Статический сайт |
| `vercel` | Vercel |
| `netlify` | Netlify Functions |
| `cloudflare-pages` | Cloudflare Pages |
| `cloudflare-module` | Cloudflare Workers |
| `deno-deploy` | Deno Deploy |
| `aws-lambda` | AWS Lambda |

### Что попадает в .output

```
.output/
├── public/           # Статические ассеты
├── server/
│   ├── index.mjs     # Точка входа сервера
│   └── chunks/       # Разделённые чанки
└── nitro.json        # Манифест Nitro
```

---

## Вызов API из клиента

Серверные API удобно вызывать из Vue-компонентов через `$fetch` или `useFetch`.

### $fetch

```vue
<script setup>
async function createUser() {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: {
      name: 'John',
      email: 'john@example.com',
    },
  });

  console.log(user);
}
</script>
```

### useFetch

```vue
<script setup>
const { data: posts, pending, error } = await useFetch('/api/posts');
</script>
```

### Типизация $fetch

Nuxt автоматически генерирует типы для `server/api/` при использовании TypeScript, поэтому `$fetch('/api/users')` будет типизирован в зависимости от возвращаемого значения обработчика.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Разделяйте API (`server/api/`) и произвольные серверные роуты (`server/routes/`).
- Используйте суффиксы `.get.ts`, `.post.ts` для чёткого разделения методов.
- Применяйте `readValidatedBody` для валидации входных данных.
- Храните секреты в `runtimeConfig` и читайте их только на сервере.
- Кэшируйте тяжёлые или редко меняющиеся запросы через `defineCachedEventHandler` или `routeRules`.
- Используйте `event.context` для передачи данных между middleware и обработчиками.
- Логируйте важные события через серверные middleware.
- Тестируйте API-роуты отдельно от UI.

### ❌ Не делайте

- Не пишите большую бизнес-логику прямо в обработчиках — выносите её в `server/utils/` или `server/services/`.
- Не возвращайте из middleware ответ, если запрос должен дойти до роута.
- Не используйте `window`, `document` и другие браузерные API в серверных обработчиках.
- Не кладите секреты в публичную часть `runtimeConfig`.
- Не забывайте обрабатывать ошибки в асинхронных обработчиках.
- Не кэшируйте роуты с пользовательскими данными без `getKey`, иначе пользователи увидят чужие данные.

---

## Ключевые тезисы для интервью

- **Nitro** — серверный движок Nuxt 3, отвечает за dev-сервер, production-сборку, API-роуты, middleware, кэширование и деплой.
- **`server/api/`** создаёт роуты с префиксом `/api`; **`server/routes/`** — роуты без префикса.
- **`server/middleware/`** выполняется перед каждым серверным запросом, включая SSR.
- **`defineEventHandler`** — основной способ создания обработчика; получает `H3Event` с `method`, `path`, `context`, `node.req`.
- **`getQuery`**, **`readBody`**, **`getHeader`**, **`getCookie`** — хелперы для чтения запроса; **`setResponseHeader`**, **`setResponseStatus`**, **`setCookie`** — для формирования ответа.
- **Кэширование** реализуется через `defineCachedEventHandler`, `defineCachedFunction` или `routeRules` с параметром `cache`.
- **Пресеты деплоя** позволяют собирать один код под Node, Vercel, Netlify, Cloudflare Workers и другие платформы.
- **Секреты** хранятся в серверной части `runtimeConfig` и доступны только в серверных обработчиках.
- **Валидация** входных данных выполняется через `readValidatedBody`.
- **Клиентский вызов API** осуществляется через `$fetch` или `useFetch`, при этом TypeScript-типы генерируются автоматически.

---

## Заключение

Серверная часть Nuxt 3 на базе Nitro превращает фреймворк из инструмента для фронтенда в полноценную full-stack платформу. Встроенные API-роуты, middleware, кэширование и универсальные пресеты деплоя позволяют создавать production-приложения без необходимости поднимать отдельный бэкенд.

Понимание Nitro важно не только для разработки, но и для собеседований: вопросы о `server/api/`, `defineEventHandler`, кэшировании и деплое встречаются регулярно. Осваивайте их последовательно, начиная с простых API-роутов, и переходите к middleware, валидации и кэшированию.

---

## Полезные ссылки

- [Nuxt 3 Server Directory](https://nuxt.com/docs/guide/directory-structure/server) — официальная документация по серверной части
- [Nitro Documentation](https://nitro.unjs.io/) — документация Nitro
- [H3 Helpers](https://www.jsdocs.io/package/h3) — хелперы для работы с запросами и ответами
- [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment) — руководство по деплою
- [Nitro Presets](https://nitro.unjs.io/deploy/) — список пресетов деплоя
- [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config) — работа с runtime config
