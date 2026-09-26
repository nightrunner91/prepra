---
title: "Жизненный цикл приложения в Nuxt 3: плагины, middleware, hooks и порядок выполнения"
section: nuxt
description: "Как устроен жизненный цикл Nuxt 3-приложения: плагины, route middleware, runtime hooks, порядок выполнения при старте, SSR и клиентской навигации, типичные ошибки и лучшие практики."
order: 5
tags: ["nuxt", "nuxt3", "vue", "lifecycle", "plugins", "middleware", "hooks", "ssr", "hydration"]
questions:
  - "Как устроен жизненный цикл Nuxt 3-приложения"
  - "Что такое плагины в Nuxt и как их создавать"
  - "Как управлять порядком выполнения плагинов"
  - "Что такое route middleware в Nuxt и какие виды бывают"
  - "В каком порядке выполняются middleware, плагины и hooks"
  - "Какие runtime hooks есть в Nuxt 3"
  - "Как выполнить код только на клиенте или только на сервере"
  - "Чем плагины отличаются от middleware"
  - "Какие ошибки чаще всего допускают в lifecycle Nuxt"
---

# Жизненный цикл приложения в Nuxt 3: плагины, middleware, hooks и порядок выполнения

Nuxt 3 не просто добавляет роутинг и SSR поверх Vue 3 — он определяет собственный жизненный цикл приложения. Понимание этого цикла важно, потому что от него зависят ответы на вопросы: куда положить инициализацию библиотеки, как защитить роут, когда загружать данные и почему код падает на сервере, хотя работает в браузере.

В этой статье разберём три основных механизма расширения жизненного цикла — **плагины**, **middleware** и **hooks**, — а также общий порядок их выполнения при старте приложения, SSR и клиентской навигации.

## Содержание

1. [Общая схема жизненного цикла](#общая-схема-жизненного-цикла)
2. [Плагины](#плагины)
3. [Route middleware](#route-middleware)
4. [Runtime hooks](#runtime-hooks)
5. [Порядок выполнения](#порядок-выполнения)
6. [SSR, CSR и hydration](#ssr-csr-и-hydration)
7. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Общая схема жизненного цикла

Жизненный цикл Nuxt 3 можно разделить на три фазы:

1. **Инициализация приложения** — создание Vue/Nuxt инстанса, загрузка плагинов, регистрация middleware.
2. **Обработка запроса / навигации** — выполнение middleware, резолвинг роута, загрузка данных, рендеринг страницы.
3. **Runtime hooks** — точки расширения, через которые можно подписаться на события типа `app:created`, `page:start`, `page:finish`.

Ключевой объект во всём этом — `nuxtApp`. Он создаётся один раз при старте приложения и доступен в плагинах, middleware, composables и компонентах через `useNuxtApp()`.

```ts
const nuxtApp = useNuxtApp();
```

`nuxtApp` содержит ссылки на Vue-приложение, роутер, маршрут, runtime config, провайдеры (`$http`, `$dayjs` и т.п.), а также метод `hook()` для подписки на события.

---

## Плагины

Плагины в Nuxt — это способ запустить код при старте приложения: подключить внешнюю библиотеку, настроить HTTP-клиент, инициализировать аналитику, зарегистрировать директивы, добавить провайдеры в `nuxtApp`.

### Где создавать

Файлы плагинов размещаются в папке `plugins/`:

```
plugins/
├── auth.ts              # плагин аутентификации
├── vue-toastify.client.ts
└── sentry.server.ts
```

Nuxt автоматически находит и регистрирует все файлы из `plugins/`.

### Простой плагин

```ts
// plugins/hello.ts
export default defineNuxtPlugin(() => {
  console.log('Hello from plugin');
});
```

Плагин получает `nuxtApp` первым аргументом:

```ts
// plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const $api = $fetch.create({
    baseURL: config.public.apiBase,
  });

  return {
    provide: {
      api: $api,
    },
  };
});
```

После этого `$api` доступен в любом месте:

```vue
<script setup>
const { $api } = useNuxtApp();
const { data } = await useFetch('/posts', { $fetch: $api });
</script>
```

### Режим выполнения плагинов

Плагины могут выполняться на сервере, клиенте или везде. Режим задаётся суффиксом в имени файла:

| Суффикс | Где выполняется |
|---|---|
| `.ts` | И на сервере, и на клиенте (по умолчанию) |
| `.client.ts` | Только в браузере |
| `.server.ts` | Только на сервере |

```ts
// plugins/ga.client.ts — безопасно используем window
export default defineNuxtPlugin(() => {
  if (process.client) {
    // инициализация Google Analytics
  }
});
```

> Совет: суффикс `.client.ts` надёжнее, чем ручная проверка `process.client` внутри универсального плагина. Nuxt просто не включит плагин в серверный бандл.

### Порядок выполнения плагинов

По умолчанию плагины выполняются в алфавитном порядке имён файлов. Чтобы управлять порядком явно, можно:

1. **Переименовать файл** с числовым префиксом:

```
plugins/
├── 01.init.ts
├── 02.api.ts
└── 03.auth.ts
```

2. **Использовать `dependsOn`** в `defineNuxtPlugin`:

```ts
// plugins/auth.ts
export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['api'], // ждёт плагин с name: 'api'
  setup(nuxtApp) {
    // код
  },
});
```

3. **Асинхронные плагины**: если плагин возвращает `Promise`, Nuxt дождётся его выполнения перед запуском следующего плагина.

```ts
export default defineNuxtPlugin(async () => {
  const config = await loadRemoteConfig();
  return { provide: { config } };
});
```

### Что возвращать из плагина

- `provide` — добавляет свойства в `nuxtApp` (доступны как `$name`).
- `hooks` — удобная обёртка для подписки на runtime hooks внутри плагина.
- Ничего — если плагин просто выполняет side-effect.

```ts
export default defineNuxtPlugin({
  setup(nuxtApp) {
    return {
      provide: {
        hello: (msg: string) => `Hello, ${msg}`,
      },
    };
  },
});
```

### Плагин vs Vue plugin

Не путайте Nuxt-плагин (`defineNuxtPlugin`) с Vue-плагином (`app.use(...)`). Первый — это точка входа в инфраструктуру Nuxt, второй — стандартный механизм Vue. Внутри Nuxt-плагина вы можете использовать Vue-плагин:

```ts
// plugins/toast.client.ts
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, { position: 'top-right' });
});
```

---

## Route middleware

Route middleware — это код, который выполняется перед входом на определённый роут. Используется для защиты страниц, редиректов, проверки прав, загрузки предварительных данных.

### Виды middleware

| Вид | Где объявляется | Как подключается |
|---|---|---|
| **Именованная** | `middleware/auth.ts` | `definePageMeta({ middleware: 'auth' })` |
| **Глобальная** | `middleware/auth.global.ts` | Автоматически для всех роутов |
| **Анонимная** | Прямо в странице | `definePageMeta({ middleware: [...] })` |

### Именованный middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});
```

```vue
<!-- pages/admin.vue -->
<script setup>
definePageMeta({
  middleware: 'auth',
});
</script>
```

### Глобальный middleware

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  const publicRoutes = ['/login', '/register'];

  if (!loggedIn.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login');
  }
});
```

Глобальный middleware выполняется при **каждой** навигации, включая первую загрузку страницы.

### Анонимный middleware

```vue
<script setup>
definePageMeta({
  middleware: [
    (to) => {
      if (to.params.id === '0') {
        return navigateTo('/');
      }
    },
  ],
});
</script>
```

Анонимный middleware полезен для разовых проверок, но сложную логику лучше выносить в именованный файл.

### Редирект и ошибка

Внутри middleware используются:

- `navigateTo(path)` — клиентский или серверный редирект.
- `abortNavigation()` — отмена текущей навигации.
- `throw createError({ statusCode: 403 })` — показать страницу ошибки.

```ts
export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещён',
    });
  }
});
```

### Middleware работает на сервере и клиенте

Важно: при SSR middleware выполняется на сервере во время первого запроса. При последующих клиентских переходах — в браузере. Поэтому middleware не должен безусловно использовать `window`, `localStorage`, `document`.

---

## Runtime hooks

Nuxt предоставляет систему runtime hooks — точек расширения, на которые можно подписаться через `nuxtApp.hook()` или декларативно внутри плагина.

### Где подписываться

```ts
// плагин
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    console.log('Страница отрендерена');
  });
});
```

```vue
<!-- компонент -->
<script setup>
const nuxtApp = useNuxtApp();
nuxtApp.hook('page:finish', () => {
  // ...
});
</script>
```

### Основные runtime hooks

| Hook | Когда срабатывает |
|---|---|
| `app:created` | Vue приложение создано, но ещё не смонтировано |
| `app:beforeMount` | Перед монтированием на клиенте |
| `app:mounted` | Приложение смонтировано на клиенте |
| `app:rendered` | После SSR-рендеринга на сервере |
| `app:error` | При возникновении ошибки |
| `app:data:refresh` | При принудительном обновлении данных |
| `page:start` | Перед началом рендеринга страницы |
| `page:finish` | После завершения рендеринга страницы |
| `page:transition:finish` | После завершения transition анимации страницы |
| `link:prefetch` | При prefetch ссылки `<NuxtLink>` |
| `vue:setup` | При вызове setup каждого Vue компонента |
| `vue:error` | При ошибке в Vue (например, в lifecycle hook) |

### Примеры использования

```ts
// плагин аналитики
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    // Отправить событие просмотра страницы
    sendPageView(useRoute().fullPath);
  });
});
```

```ts
// обработка ошибок Vue
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:error', (err) => {
    logError(err);
  });
});
```

### Nitro hooks

На серверной части есть отдельная система hooks Nitro. Они задаются в `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    hooks: {
      'render:response': (response, { event }) => {
        console.log('Response rendered for', event.node.req.url);
      },
    },
  },
});
```

К Nitro hooks относятся `request`, `beforeResponse`, `afterResponse`, `render:response`, `close` и другие. Их используют для логирования, кэширования, модификации ответа.

---

## Порядок выполнения

Понимание порядка execution order помогает решать проблемы вроде «плагин не видит данные» или «middleware срабатывает раньше, чем инициализирована авторизация».

### При первой загрузке страницы (SSR)

1. Nitro получает HTTP-запрос.
2. Выполняются серверные middleware из `server/middleware/`.
3. Создаётся `nuxtApp`.
4. Срабатывает hook `app:created`.
5. Запускаются плагины (в алфавитном порядке / по `dependsOn`), включая `.server.ts` и универсальные.
6. Создаётся Vue приложение и роутер.
7. Выполняется route middleware.
8. Резолвится роут.
9. Запускаются `useAsyncData` / `useFetch` для страницы.
10. Срабатывает hook `page:start`.
11. Происходит SSR-рендеринг страницы.
12. Срабатывают hooks `app:rendered` и `page:finish`.
13. HTML отправляется клиенту.

### Гидратация на клиенте

14. Браузер получает HTML.
15. Выполняются клиентские плагины (`.client.ts` и универсальные на клиенте).
16. Vue гидрирует приложение.
17. Срабатывает hook `app:mounted`.
18. Приложение готово к интеракциям.

### При клиентской навигации

1. Пользователь кликает `<NuxtLink>` или вызывает `navigateTo()`.
2. Выполняется route middleware.
3. Резолвится новый роут.
4. Запускаются `useAsyncData` / `useFetch` новой страницы.
5. Срабатывает hook `page:start`.
6. Рендерится новая страница.
7. Срабатывает hook `page:finish`.
8. Если настроены transitions — `page:transition:finish`.

### Схема в таблице

| Этап | Сервер (первый запрос) | Клиент (навигация) |
|---|---|---|
| HTTP / событие | Nitro + server middleware | `navigateTo` / `<NuxtLink>` |
| Создание nuxtApp | ✅ | уже создан |
| `app:created` | ✅ | — |
| Плагины | ✅ (server + all) | ✅ (client + all) |
| Route middleware | ✅ | ✅ |
| asyncData / useFetch | ✅ | ✅ |
| `page:start` | ✅ | ✅ |
| Рендеринг | SSR | CSR |
| `page:finish` | ✅ | ✅ |
| `app:rendered` | ✅ | — |
| `app:mounted` | — | ✅ (первый раз) |

---

## SSR, CSR и hydration

При SSR код выполняется дважды: сначала на сервере для генерации HTML, затем на клиенте для гидратации. Это влияет на lifecycle.

### Клиент-only код

Если нужно выполнить код только в браузере:

```vue
<script setup>
onMounted(() => {
  // выполняется только на клиенте
  document.title = 'Client only';
});
</script>
```

Или через плагин `.client.ts`:

```ts
// plugins/chart.client.ts
export default defineNuxtPlugin(() => {
  // window гарантированно доступен
});
```

### Server-only код

Для кода, который должен выполняться только на сервере, используйте `.server.ts` плагины или server middleware/API.

### Hydration mismatch

Если состояние, полученное на сервере, отличается от состояния на клиенте, возникает hydration mismatch. Это приводит к ошибкам в консоли и потенциально к некорректному UI.

Причины:

- Использование `Date.now()` или `Math.random()` без `onMounted`.
- Разный контент в зависимости от `process.client` / `process.server` внутри шаблона.
- Разные данные при повторном запросе на клиенте.

Лечение:

- Клиент-only контент оборачивать в `<ClientOnly>` или выводить в `onMounted`.
- Данные для страницы загружать через `useAsyncData` / `useFetch` — Nuxt передаст их с сервера на клиент.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте плагины для инициализации библиотек и добавления провайдеров в `nuxtApp`.
- Управляйте порядком плагинов через префиксы имён или `dependsOn`.
- Используйте `.client.ts` и `.server.ts` суффиксы, чтобы избежать runtime-проверок.
- Помещайте защиту роутов в route middleware, а не в `onMounted` компонента.
- Используйте `navigateTo()` для редиректов в middleware.
- Подписывайтесь на `page:finish` для аналитики и пост-обработки страницы.
- Оборачивайте клиентский код в `onMounted` или `<ClientOnly>`.
- Логируйте ошибки через `vue:error` hook.

### ❌ Не делайте

- Не вызывайте `useNuxtApp()` вне синхронного Vue-контекста (например, в асинхронных колбэках без `callWithNuxt`).
- Не используйте `window` / `document` в универсальных плагинах без проверки.
- Не размещайте тяжёлую бизнес-логику в middleware — middleware должен быть лёгким и синхронным/быстрым.
- Не забывайте, что глобальный middleware срабатывает при каждой навигации, включая первую загрузку.
- Не игнорируйте hydration mismatch — они ломают интерактивность.
- Не путайте Nuxt-плагины и Vue-плагины — если нужно `app.use(...)`, делайте это внутри `defineNuxtPlugin`.

---

## Ключевые тезисы для интервью

- **Жизненный цикл Nuxt 3** включает инициализацию приложения, выполнение плагинов, middleware, data fetching, SSR/рендеринг и runtime hooks.
- **Плагины** — точка входа для инициализации библиотек и провайдеров; находятся в `plugins/`, автоматически регистрируются, могут быть `.client.ts`, `.server.ts` или универсальными.
- **Порядок плагинов** задаётся алфавитно или через `dependsOn` в `defineNuxtPlugin`; асинхронные плагины блокируют запуск следующих.
- **Route middleware** бывает именованным, глобальным (`*.global.ts`) и анонимным; используется для защиты роутов и редиректов.
- **Middleware выполняется** и на сервере при первом запросе, и на клиенте при навигации.
- **Runtime hooks** — `app:created`, `app:mounted`, `app:rendered`, `page:start`, `page:finish`, `vue:error`, `link:prefetch` и другие.
- **Порядок выполнения** при SSR: серверные middleware → `nuxtApp` → `app:created` → плагины → route middleware → asyncData → `page:start` → рендер → `page:finish` / `app:rendered`.
- **При hydration** клиентские плагины запускаются повторно, поэтому side-effects нужно либо защищать, либо размещать в `.client.ts`.
- **Hydration mismatch** возникает, когда клиентское состояние отличается от серверного; лечится через `useAsyncData` / `useFetch` и `<ClientOnly>` / `onMounted`.
- **Nuxt-плагин** — это обёртка вокруг инфраструктуры Nuxt; внутри него можно вызывать Vue-плагины через `nuxtApp.vueApp.use(...)`.

---

## Заключение

Жизненный цикл Nuxt 3 — это набор соглашений и точек расширения, которые делают фреймворк full-stack. Плагины отвечают за инициализацию, middleware — за контроль доступа к роутам, hooks — за подписку на события. Понимание порядка их выполнения помогает избежать типичных ошибок: неработающего SSR, hydration mismatch, неправильного порядка инициализации и утечек клиентского кода на сервер.

Следующие статьи раздела продолжат погружение в Nuxt: серверную часть Nitro, data fetching, состояние, SEO, обработку ошибок, слои и модули.

---

## Полезные ссылки

- [Nuxt 3 Plugins](https://nuxt.com/docs/guide/directory-structure/plugins) — официальная документация по плагинам
- [Nuxt 3 Middleware](https://nuxt.com/docs/guide/directory-structure/middleware) — документация по route middleware
- [Nuxt 3 Runtime Hooks](https://nuxt.com/docs/api/advanced/hooks) — справочник runtime hooks
- [Nuxt 3 Lifecycle](https://nuxt.com/docs/getting-started/lifecycle) — жизненный цикл приложения
- [Nitro Hooks](https://nitro.unjs.io/guide/plugins#hooks) — hooks серверной части Nitro
- [Vue 3 Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html) — жизненный цикл Vue компонентов
