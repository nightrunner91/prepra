---
title: "Обработка ошибок в Nuxt 3"
section: nuxt
description: "Обработка ошибок в Nuxt 3: error.vue, throwError, showError, vue:error hook, серверные ошибки, error boundary, SSR-safe обработка и логирование."
order: 9
tags: ["nuxt", "nuxt3", "error-handling", "error-page", "throwError", "showError", "ssr"]
questions:
  - "Как создать кастомную страницу ошибки в Nuxt 3"
  - "Чем throwError отличается от showError"
  - "Как перехватывать ошибки на уровне приложения через vue:error"
  - "Как обрабатывать ошибки в серверных API-роутах Nuxt"
  - "Как работает обработка ошибок при SSR в Nuxt"
  - "Как построить error boundary в Nuxt-приложении"
  - "Как логировать ошибки в production в Nuxt"
  - "Какие антипаттерны встречаются при обработке ошибок в Nuxt"
---

# Обработка ошибок в Nuxt 3

Любое Nuxt-приложение рано или поздно сталкивается с ошибками: сбой API, некорректные данные, ошибка рендера на сервере, падение валидации. Nuxt 3 предоставляет несколько встроенных механизмов для обработки ошибок — от кастомной страницы `error.vue` до серверных хуков и глобальных обработчиков.

В отличие от Vue SPA, где ошибки обрабатываются только на клиенте, в Nuxt ошибки могут возникать и на сервере, и на клиенте, и при гидратации. Понимание этих трёх контекстов — ключ к надёжной обработке ошибок.

В этой статье разберём все инструменты обработки ошибок в Nuxt 3: страницу ошибки, `createError`, `showError`/`throwError`, хук `vue:error`, серверные ошибки в Nitro, error boundary паттерн и лучшие практики логирования.

## Содержание

1. [Типы ошибок в Nuxt](#типы-ошибок-в-nuxt)
2. [Кастомная страница ошибки: `error.vue`](#кастомная-страница-ошибки-errorvue)
3. [`createError` — создание ошибок](#createerror--создание-ошибок)
4. [`showError` vs `throwError`](#showerror-vs-throwerror)
5. [Хук `vue:error` — глобальный перехват](#хук-vueerror--глобальный-перехват)
6. [Ошибки в серверных API-роутах](#ошибки-в-серверных-api-роутах)
7. [Ошибки при SSR и гидратации](#ошибки-при-ssr-и-гидратации)
8. [Error Boundary паттерн в Nuxt](#error-boundary-паттерн-в-nuxt)
9. [Обработка ошибок в middleware и плагинах](#обработка-ошибок-в-middleware-и-плагинах)
10. [Логирование и мониторинг](#логирование-и-мониторинг)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Типы ошибок в Nuxt

Прежде чем настраивать обработку, полезно понять, где именно может возникнуть ошибка в Nuxt-приложении:

| Контекст | Пример | Как обрабатывается |
|---|---|---|
| Клиентский рендер | Ошибка в шаблоне компонента | `error.vue`, `vue:error` |
| Серверный рендер (SSR) | Ошибка в `useFetch` на сервере | `error.vue` + серверные логи |
| API-роут | Сбой подключения к БД | `createError` в `defineEventHandler` |
| Middleware | Ошибка валидации токена | `createError` с statusCode |
| Плагин | Ошибка инициализации сервиса | `vue:error` + логирование |
| Гидратация | Несовпадение серверного и клиентского HTML | `vue:error` + предупреждения |
| Навигация | Ошибка в `page:finish` hook | `vue:error` |

Ключевое отличие Nuxt от Vue SPA: ошибки могут возникать на сервере, но проявляться на клиенте. Поэтому важно обрабатывать ошибки в обоих контекстах.

---

## Кастомная страница ошибки: `error.vue`

Самый простой способ показать пользователю понятную ошибку — создать файл `error.vue` в корне проекта. Nuxt автоматически отобразит её вместо стандартной ошибки.

### Базовая реализация

```vue
<!-- error.vue -->
<script setup>
defineProps({
  error: {
    type: Object,
    required: true,
  },
});

function handleError() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="error-page">
    <h1>Ошибка {{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">На главную</button>
  </div>
</template>
```

### Доступные свойства ошибки

Объект `error`, передаваемый в `error.vue`, содержит:

| Свойство | Тип | Описание |
|---|---|---|
| `statusCode` | `number` | HTTP-код ошибки (404, 500 и т.д.) |
| `message` | `string` | Текстовое описание ошибки |
| `fatal` | `boolean` | Фатальная ли ошибка |
| `data` | `any` | Дополнительные данные ошибки |
| `cause` | `Error` | Причина ошибки (если была передана) |

### Обработка 404

Nuxt автоматически перенаправляет на `error.vue` с `statusCode: 404` при переходе на несуществующий маршрут. Можно переиспользовать одну страницу для разных ошибок:

```vue
<script setup>
const props = defineProps({
  error: Object,
});

const title = computed(() => {
  switch (props.error.statusCode) {
    case 404: return 'Страница не найдена';
    case 500: return 'Внутренняя ошибка сервера';
    default: return 'Произошла ошибка';
  }
});
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <p>{{ error.message }}</p>
  </div>
</template>
```

---

## `createError` — создание ошибок

`createError` — универсальная функция для создания объектов ошибок. Она работает как на клиенте, так и на сервере.

### На клиенте — показывает `error.vue`

```ts
// На клиенте showError и createError показывают error.vue
throw createError({
  statusCode: 404,
  statusMessage: 'Страница не найдена',
  message: 'Запрашиваемая страница не существует',
});
```

### На сервере — возвращает HTTP-ответ с ошибкой

```ts
// server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID пользователя обязателен',
    });
  }

  // ... логика получения пользователя
});
```

### Параметры `createError`

```ts
createError({
  statusCode: 500,          // HTTP-код
  statusMessage: 'Error',   // HTTP-статус
  message: 'Что-то пошло не так',  // Текст ошибки
  data: { source: 'api' },  // Дополнительные данные
  cause: originalError,     // Исходная ошибка
  fatal: false,             // Фатальная ли (показать error.vue)
});
```

### `isError` — проверка типа

```ts
import { isError } from 'h3';

if (isError(error)) {
  console.log(error.statusCode, error.message);
}
```

---

## `showError` vs `throwError`

Nuxt предоставляет два хелпера для показа ошибок: `showError` и `throwError`. Оба вызывают `error.vue`, но работают по-разному.

### `showError` — показать без остановки выполнения

```ts
// Не останавливает выполнение скрипта
showError({
  statusCode: 500,
  message: 'Что-то пошло не так',
});
```

`showError` вызывает `error.vue`, но **не прерывает** текущий стек выполнения. Код после `showError` продолжит выполняться. Это полезно, когда нужно показать ошибку, но не падать.

### `throwError` — показать и остановить выполнение

```ts
// Останавливает выполнение и вызывает error.vue
throwError({
  statusCode: 404,
  message: 'Не найдено',
});
```

`throwError` — это фактически `throw createError(...)` в обёртке. Он **останавливает** выполнение текущей функции.

### Когда что использовать

| Ситуация | Рекомендация |
|---|---|
| Нужно показать ошибку и продолжить выполнение | `showError` |
| Нужно показать ошибку и остановить обработку | `throwError` или `throw createError` |
| В серверных обработчиках | `throw createError` |
| В клиентском коде (не в обработчике) | `showError` или `throw createError` |

### `clearError` — сброс ошибки

```ts
// Из error.vue или из любого компонента
clearError({ redirect: '/' });
// или без редиректа:
clearError();
```

`clearError` сбрасывает состояние ошибки и (опционально) перенаправляет пользователя. Это стандартный способ «восстановления» из `error.vue`.

---

## Хук `vue:error` — глобальный перехват

Nuxt добавляет свой хук `vue:error` для глобального перехвата ошибок. Это аналог `app.config.errorHandler` из Vue, но с удобной интеграцией в Nuxt.

### Глобальная обработка ошибок

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('Глобальная ошибка:', err);
    console.error('Компонент:', instance);
    console.error('Контекст:', info);

    // Отправка в Sentry / LogRocket
    // reportError(err, { info });
  };
});
```

### Хук `vue:error` в `app.vue`

```vue
<!-- app.vue -->
<script setup>
onErrorCaptured((err, instance, info) => {
  console.error('Ошибка в поддереве:', err);
  return false; // Остановить всплытие
});
</script>
```

### Отличие от `error.vue`

| Аспект | `error.vue` | `vue:error` / `errorHandler` |
|---|---|---|
| Показывает UI ошибки | Да | Нет (нужен ручной рендер) |
| Перехватывает все ошибки | Да (автоматически) | Только в пределах дерева компонентов |
| Работает на сервере | Ограничен | Да |
| Можно настроить логирование | Нужен отдельный плагин | Внутри обработчика |

---

## Ошибки в серверных API-роутах

В серверных роутах Nuxt ошибки обрабатываются через `createError`. Это возвращает HTTP-ответ с соответствующим кодом.

### Бросание ошибки в API

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
    });
  }

  const user = await getUserById(id);

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }

  return user;
});
```

### Обработка ошибок из клиента

Когда клиент вызывает API через `$fetch` или `useFetch`, ошибки сервера автоматически прокидываются:

```vue
<script setup>
const { data, error } = await useFetch('/api/users/1');

if (error.value) {
  console.error('Ошибка API:', error.value.statusCode, error.value.message);
}
</script>
```

### Кастомные ошибки API

```ts
// server/api/validate.post.ts
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, schema.parse);
    return { success: true, data: body };
  } catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      message: err.message,
      data: { errors: err.errors },
    });
  }
});
```

### `sendError` — альтернатива `createError`

```ts
import { sendError } from 'h3';

export default defineEventHandler((event) => {
  return sendError(event, createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
  }));
});
```

`sendError` полезен, когда нужно отправить ошибку как результат обработчика, а не бросать исключение.

---

## Ошибки при SSR и гидратации

В Nuxt SSR ошибки могут возникать на сервере, но проявляться на клиенте. Это создаёт дополнительные сложности.

### Ошибка на сервере

```ts
// composables/useUserData.ts
export const useUserData = async (userId) => {
  const { data, error } = await useFetch(`/api/users/${userId}`);

  if (error.value) {
    // На сервере: ошибка логируется, но пользователь увидит fallback
    console.error('[SSR] Ошибка загрузки данных:', error.value);
  }

  return { data, error };
};
```

### Ошибка гидратации

Если сервер отрендерил одну версию страницы, а клиент пытается гидратировать другую, Nuxt показывает предупреждение в консоли:

```
[Vue Hydration] Server-side DOM content doesn't match client-side
```

Решения:

```vue
<script setup>
// Используйте onNuxtReady для кода, который должен выполняться только на клиенте
onNuxtReady(() => {
  // Код только для клиента
});
</script>
```

```vue
<!-- Или<ClientOnly> для компонентов, которые не рендерятся на сервере -->
<ClientOnly>
  <InteractiveWidget />
</ClientOnly>
```

### `routeRules` для управления SSR

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/dashboard/**': { ssr: false },    // Только CSR
    '/blog/**': { prerender: true },     // SSG
    '/api/**': { cors: true },           // CORS для API
  },
});
```

---

## Error Boundary паттерн в Nuxt

Nuxt не имеет встроенного компонента Error Boundary, но его легко создать с помощью `onErrorCaptured`.

### Реализация Error Boundary

```vue
<!-- components/ErrorBoundary.vue -->
<script setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref(null);
const info = ref('');

onErrorCaptured((err, instance, errInfo) => {
  error.value = err;
  info.value = errInfo;

  // Логируем ошибку
  console.error('ErrorBoundary:', err, errInfo);

  // Останавливаем всплытие
  return false;
});

function reset() {
  error.value = null;
  info.value = '';
}
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h2>Что-то пошло не так</h2>
    <p>{{ error.message }}</p>
    <button @click="reset">Попробовать снова</button>
  </div>
  <slot v-else />
</template>
```

### Использование

```vue
<template>
  <ErrorBoundary>
    <RiskyComponent />
  </ErrorBoundary>
</template>
```

### С `key` для принудительного сброса

```vue
<template>
  <ErrorBoundary :key="boundaryKey">
    <RiskyComponent />
  </ErrorBoundary>
  <button @click="boundaryKey++">Сбросить</button>
</template>

<script setup>
const boundaryKey = ref(0);
</script>
```

---

## Обработка ошибок в middleware и плагинах

### Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuth();

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return navigateTo('/login');
  }
});
```

Ошибки в middleware перехватываются через `vue:error` или `error.vue`.

### Плагины

```ts
// plugins/analytics.ts
export default defineNuxtPlugin((nuxtApp) => {
  try {
    initAnalytics();
  } catch (err) {
    console.error('Ошибка инициализации аналитики:', err);
    // Не падаем — аналитика не критична
  }
});
```

### Серверные middleware

```ts
// server/middleware/validate.ts
export default defineEventHandler((event) => {
  const token = getHeader(event, 'authorization');

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});
```

---

## Логирование и мониторинг

### Плагин для логирования ошибок

```ts
// plugins/error-logger.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    const errorData = {
      message: err.message,
      stack: err.stack,
      component: instance?.$options?.name || 'Anonymous',
      info,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Отправка в сервис мониторинга
    if (import.meta.env.PROD) {
      sendToSentry(errorData);
    } else {
      console.error('[Error Logger]', errorData);
    }
  };
});
```

### Интеграция с Sentry

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/sentry',
  ],

  sentry: {
    dsn: 'YOUR_DSN',
    tracing: true,
    browserTracing: true,
    vueRendererOptions: {
      timeout: 10000,
    },
  },
});
```

### Серверное логирование

```ts
// server/utils/logger.ts
export function logServerError(err, context) {
  console.error(`[Server Error] ${new Date().toISOString()}:`, {
    message: err.message,
    stack: err.stack,
    path: context.path,
    method: context.method,
  });
}
```

---

## Лучшие практики и антипаттерны

### Правильно

1. **Всегда создавайте `error.vue`** — как минимум с обработкой 404 и 500.
2. **Используйте `createError` в серверных роутах** — для возврата осмысленных HTTP-ошибок.
3. **Обрабатывайте ошибки в `useFetch`/`useAsyncData`** — проверяйте `error.value`.
4. **Логируйте ошибки в production** — через плагин с `errorHandler`.
5. **Используйте `clearError({ redirect })` для восстановления** — из `error.vue`.
6. **Разделяйте ошибки по серьёзности** — 404 vs 500, фатальные vs нефатальные.
7. **Тестируйте `error.vue`** — убедитесь, что она показывает осмысленный UI.

### Неправильно

1. **Игнорирование ошибок API**

```ts
// Плохо: ошибка молча проглатывается
const { data } = await useFetch('/api/users');
```

2. **Показ сырых ошибок пользователю**

```vue
<!-- Плохо: пользователь видит стектрейс -->
<template>
  <div v-if="error">{{ error.stack }}</div>
</template>
```

3. **Отсутствие `error.vue`**

Без `error.vue` Nuxt покажет стандартную ошибку, которая неинформативна для пользователя.

4. **Бросание ошибок без `statusCode`**

```ts
// Плохо
throw createError({ message: 'Ошибка' });

// Правильно
throw createError({ statusCode: 500, message: 'Ошибка' });
```

5. **Использование `showError` в серверных обработчиках**

```ts
// Плохо: showError не останавливает выполнение
export default defineEventHandler(() => {
  showError({ statusCode: 500 });
  // Код продолжит выполняться!
});

// Правильно
export default defineEventHandler(() => {
  throw createError({ statusCode: 500 });
});
```

---

## Ключевые тезисы для интервью

1. **`error.vue`** — кастомная страница ошибки, отображается автоматически при ошибках рендера и навигации.
2. **`createError`** — создаёт объект ошибки; на сервере возвращает HTTP-ответ, на клиенте показывает `error.vue`.
3. **`showError`** показывает `error.vue` без остановки выполнения; **`throwError`** — показывает и останавливает.
4. **`clearError({ redirect })`** — сбрасывает состояние ошибки и перенаправляет пользователя.
5. **Хук `vue:error`** / `app.config.errorHandler` — глобальный перехват ошибок в компонентах.
6. **Ошибки в серверных API-роутах** обрабатываются через `throw createError` с `statusCode`.
7. **При SSR ошибки могут возникать на сервере, но проявляться на клиенте** — важно согласовывать состояние.
8. **Error Boundary** в Nuxt реализуется через `onErrorCaptured` с показом fallback UI.
9. **Логирование в production** через плагин с `errorHandler` + интеграция с Sentry.
10. **`sendError`** из `h3` — альтернатива `throw createError` для отправки ошибки как результата обработчика.

---

## Заключение

Обработка ошибок в Nuxt 3 строится на нескольких уровнях: `error.vue` для пользовательского UI, `createError`/`showError`/`throwError` для программного управления, `vue:error` для глобального перехвата и серверные ошибки в Nitro.

Ключевое отличие от Vue SPA — необходимость обрабатывать ошибки и на сервере, и на клиенте. SSR-ошибки требуют особого внимания: ошибка на сервере не должна сломать гидратацию на клиенте.

Правильно спроектированная обработка ошибок делает Nuxt-приложение устойчивым: пользователь видит понятное сообщение, разработчик получает диагностику, а критичные части интерфейса продолжают работать даже при сбоях.

---

## Полезные ссылки

- [Nuxt 3 Error Handling](https://nuxt.com/docs/getting-started/error-handling) — официальная документация
- [Nuxt `createError`](https://nuxt.com/docs/api/utils/create-error) — API reference
- [Nuxt `showError`](https://nuxt.com/docs/api/utils/show-error) — API reference
- [Nuxt `clearError`](https://nuxt.com/docs/api/utils/clear-error) — API reference
- [h3 Error Handling](https://h3.unjs.io/guide/error) — обработка ошибок в h3
- [Vue Error Handling](https://vuejs.org/guide/best-practices/error-handling.html) — обработка ошибок в Vue 3
