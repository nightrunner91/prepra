---
title: "Безопасность Nuxt"
section: security
description: "Nuxt: SSR и XSS, серверные маршруты Nitro, `nuxt-security`, `runtimeConfig`, CSRF и CSP."
order: 11
tags: ["nuxt", "security", "nitro", "nuxt-security", "runtime-config", "csrf", "csp"]
questions:
  - "Почему `v-html` в SSR особенно опасен и почему санитизация обязательна и на сервере, и на клиенте"
  - "Чем `runtimeConfig` отличается от `runtimeConfig.public` и как правильно хранить секреты в Nuxt"
  - "Как `nuxt-security` настраивает CSP с nonce, security-заголовки и rate limiting из коробки"
  - "Как валидировать вход и проверять авторизацию в серверных маршрутах Nitro"
  - "Как добавить CSRF-защиту в Nuxt и почему cookie-based auth требует токенов"
  - "Почему параметры маршрутов, передаваемые в `useFetch`, нужно валидировать на сервере"
answers:
  - "При SSR `v-html` встраивает вредоносный HTML прямо в исходный HTML, который сервер отдаёт клиенту: код выполняется мгновенно, ещё до гидратации, и попадает в индекс поисковиков. Поэтому санитизация через DOMPurify обязательна — и на сервере, и на клиенте."
  - "`runtimeConfig` без `public` доступен только на сервере и предназначен для секретов (`apiSecret`), а `runtimeConfig.public` доступен и на клиенте, и на сервере (`apiBase`). Секреты кладут в корневые ключи, публичные значения — в `public`, иначе секрет попадёт в клиентский бандл."
  - "`nuxt-security` генерирует nonce для каждого запроса и встраивает его в скрипты и стили через `'nonce-{{nonce}}'`, а также декларативно настраивает security-заголовки (`xFrameOptions`, `crossOriginEmbedderPolicy`) и rate limiting (`tokensPerInterval`, `interval`) в `nuxt.config.ts`."
  - "В `defineEventHandler` вход валидируется через `readBody` + `schema.safeParse` (Zod) с `createError({ statusCode: 400 })`, а авторизация — через `getUserSession(event)` и 401 при отсутствии сессии. При удалении проверяется владение ресурсом: `post.authorId !== session.user.id` → 403 Forbidden."
  - "Nuxt не имеет встроенной CSRF-защиты: сессионной cookie ставится `sameSite: 'strict'`, а для POST-запросов добавляется middleware, проверяющий заголовок `Origin` против белого списка. Cookie-based auth требует токенов или проверки Origin, потому что браузер автоматически прикрепляет cookie к cross-site запросам."
  - "`useFetch(() => '/api/' + useRoute().params.slug)` подставляет параметр маршрута в URL без проверки, а значение параметра контролирует пользователь. Параметры маршрута нужно валидировать на сервере, а не доверять им на клиенте."
---

# Безопасность Nuxt

В Nuxt добавляется SSR: `v-html` в серверном рендеринге особенно опасен, потому что вредоносный код попадает в исходный HTML ещё до гидратации. Статья разбирает специфику Nuxt: риски SSR, `runtimeConfig` для секретов, `nuxt-security` для CSP и заголовков, серверные маршруты Nitro с валидацией и авторизацией, CSRF и CSP.

## Содержание

1. [SSR и безопасность](#ssr-и-безопасность)
2. [Nuxt Security Module](#nuxt-security-module)
3. [Серверные маршруты Nitro](#серверные-маршруты-nitro)
4. [runtimeConfig и секреты](#runtimeconfig-и-секреты)
5. [CSRF в Nuxt](#csrf-в-nuxt)
6. [CSP в Nuxt](#csp-в-nuxt)
7. [Чек-лист безопасности Nuxt](#чек-лист-безопасности-nuxt)
8. [Терминология](#терминология)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## SSR и безопасность

Nuxt рендерит приложение на сервере. Это добавляет удобства, но и новые риски.

### Universal rendering

В Nuxt 3 компоненты по умолчанию рендерятся на сервере, затем гидратируются на клиенте. Vue-интерполяции экранируются и на сервере, и на клиенте. Но `v-html` в SSR-контексте особенно опасен: вредоносный код попадает в исходный HTML и выполняется мгновенно, до гидратации.

### Правильная обработка пользовательского ввода в SSR

```vue
<script setup>
import DOMPurify from 'dompurify';

const { data: article } = await useFetch('/api/article/1');

const safeContent = computed(() =>
  DOMPurify.sanitize(article.value?.content || '')
);
</script>

<template>
  <article v-html="safeContent"></article>
</template>
```

### Опасность useFetch с пользовательским URL

```vue
<script setup>
// ❌ Опасно: URL из query-параметра без валидации
const { data } = await useFetch(() => `/api/${useRoute().params.slug}`);
</script>
```

Параметры маршрута должны валидироваться на сервере.

---

## Nuxt Security Module

`nuxt-security` — официальный модуль безопасности для Nuxt. Он помогает настроить:

- CSP;
- security-заголовки;
- CORS;
- rate limiting;
- защиту от XSS;
- subresource integrity (SRI);
- и многое другое.

### Базовая настройка

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-security'],
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        'style-src': ["'self'", "'nonce-{{nonce}}'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
      },
      crossOriginEmbedderPolicy: 'require-corp',
      xFrameOptions: 'DENY',
    },
    rateLimiter: {
      tokensPerInterval: 100,
      interval: 'hour',
    },
  },
});
```

Модуль автоматически генерирует nonce для каждого запроса и встраивает его в скрипты.

---

## Серверные маршруты Nitro

Nuxt использует Nitro для серверных маршрутов. Это аналог Route Handlers в Next.js.

### Пример с валидацией

```ts
// server/api/posts.post.ts
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody(event);
  const result = schema.safeParse(body);

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
  }

  await createPost(session.user.id, result.data);

  return { ok: true };
});
```

### Проверка прав

```ts
// server/api/posts/[id].delete.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const id = getRouterParam(event, 'id');

  const post = await getPost(id);

  if (post.authorId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  await deletePost(id);
  return { ok: true };
});
```

---

## runtimeConfig и секреты

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
    },
  },
});
```

```vue
<script setup>
const config = useRuntimeConfig();

// Только на сервере
console.log(config.apiSecret);

// Доступно на клиенте и сервере
console.log(config.public.apiBase);
</script>
```

**Правило:** секреты всегда в `runtimeConfig` без `public`, публичные значения — в `runtimeConfig.public`.

---

## CSRF в Nuxt

Nuxt не имеет встроенной CSRF-защиты из коробки, но её легко добавить.

### SameSite cookies

```ts
// server/utils/session.ts
export async function setUserSession(event, user) {
  await setCookie(event, 'session', JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  });
}
```

### CSRF-токены

Можно использовать `h3-cors` или встроенные middleware для проверки Origin и CSRF-токенов.

```ts
// server/middleware/csrf.ts
export default defineEventHandler((event) => {
  if (event.method === 'POST') {
    const origin = getHeader(event, 'origin');
    const allowed = ['https://mysite.com'];

    if (!origin || !allowed.includes(origin)) {
      throw createError({ statusCode: 403 });
    }
  }
});
```

---

## CSP в Nuxt

Через `nuxt-security`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-security'],
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{{nonce}}'"],
        'style-src': ["'self'", "'nonce-{{nonce}}'"],
      },
    },
  },
});
```

Без модуля — через Nuxt middleware:

```ts
// server/middleware/csp.ts
export default defineEventHandler((event) => {
  appendResponseHeader(
    event,
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self';"
  );
});
```

---

## Чек-лист безопасности Nuxt

- [ ] Установить `nuxt-security` и настроить CSP.
- [ ] Использовать `runtimeConfig` для секретов.
- [ ] Валидировать входные данные в server routes.
- [ ] Проверять авторизацию в server routes и middleware.
- [ ] Настроить HttpOnly, Secure, SameSite cookies.
- [ ] Передавать клиенту только необходимые данные.

---

## Терминология

| Термин | Значение |
|--------|----------|
| **Nitro** | Серверный движок Nuxt |
| **runtimeConfig** | Конфигурация Nuxt для серверных и публичных значений |
| **nuxt-security** | Модуль безопасности для Nuxt |
| **Universal rendering** | SSR + CSR в одном приложении |
| **getUserSession** | Утилита для получения сессии в Nuxt Auth |

---

## Ключевые тезисы для интервью

- В Nuxt `v-html` в SSR попадает в исходный HTML, который выполняется мгновенно до гидратации — санитизация обязательна и на сервере.
- `runtimeConfig` без `public` — только сервер; `runtimeConfig.public` — клиент и сервер; `nuxt-security` из коробки настраивает CSP с nonce, security-заголовки, rate limiting и SRI.
- Nitro — серверный движок Nuxt; серверные маршруты (`server/api/`) требуют валидации (Zod) и проверки авторизации/владения ресурсом.
- Nuxt не имеет встроенной CSRF-защиты — настраивайте SameSite cookies, проверку Origin и CSRF-токены в middleware.

## Заключение

Nuxt предоставляет хорошую базовую защиту через автоматическое экранирование Vue, но особенности SSR удваивают риски: вредоносный `v-html` попадает в исходный HTML и индексируется поисковиками. Модуль `nuxt-security` закрывает большинство инфраструктурных задач: CSP с nonce, security-заголовки, rate limiting. Для SOC2 и CASA важно показать, что команда понимает различие между клиентом и сервером в Nuxt, использует `runtimeConfig` для секретов, валидирует данные в Nitro и настраивает защиту через `nuxt-security`. Про XSS-базу смотрите [XSS: анатомия атаки](./xss-deep-dive.md), про Vue — [Безопасность Vue](./vue.md).

## Полезные ссылки

- [Nuxt — Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Nuxt Security](https://nuxt-security.vercel.app/)
- [Nitro — Server Engine](https://nitro.unjs.io/)
- [Sidebase Nuxt Auth](https://sidebase.io/nuxt-auth)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Vue.js — Security](https://vuejs.org/guide/best-practices/security.html)