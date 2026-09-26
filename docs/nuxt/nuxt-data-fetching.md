---
title: "Data fetching в Nuxt 3: useFetch, useAsyncData, $fetch, ошибки и отмена запросов"
section: nuxt
description: "Как загружать данные в Nuxt 3: useFetch, useAsyncData, $fetch, SSR-safe fetching, обработка ошибок, отмена запросов, ленивые запросы и лучшие практики."
order: 7
tags: ["nuxt", "nuxt3", "vue", "data-fetching", "useFetch", "useAsyncData", "$fetch", "ssr", "abort", "error-handling"]
questions:
  - "Чем useFetch отличается от useAsyncData + $fetch"
  - "Как работает SSR-safe data fetching в Nuxt 3"
  - "Когда данные загружаются на сервере, а когда на клиенте"
  - "Как обработать ошибку при загрузке данных"
  - "Как отменить запрос в Nuxt 3"
  - "Что такое ключ в useAsyncData и зачем он нужен"
  - "Как избежать двойных запросов при SSR"
  - "Когда использовать useLazyFetch"
  - "Как передать заголовки и query-параметры в useFetch"
  - "Как обновить данные повторно"
---

# Data fetching в Nuxt 3: useFetch, useAsyncData, $fetch, ошибки и отмена запросов

Загрузка данных — одна из главных задач full-stack фреймворка. Nuxt 3 предоставляет несколько инструментов для HTTP-запросов, каждый из которых решает свою задачу: `useFetch` для декларативной загрузки в компонентах, `useAsyncData` для сложной логики, `$fetch` для императивных вызовов, а также ленивые версии и механизмы обработки ошибок.

В этой статье разберёмся, как выбирать между этими инструментами, как работает SSR-safe fetching, как избежать двойных запросов, как обрабатывать ошибки и отменять запросы.

## Содержание

1. [Обзор инструментов для data fetching](#обзор-инструментов-для-data-fetching)
2. [useFetch](#usefetch)
3. [useAsyncData и $fetch](#useasyncdata-и-fetch)
4. [SSR-safe fetching](#ssr-safe-fetching)
5. [Обработка ошибок](#обработка-ошибок)
6. [Отмена запросов](#отмена-запросов)
7. [Ленивый data fetching](#ленивый-data-fetching)
8. [Запросы на клиенте](#запросы-на-клиенте)
9. [Оптимизация запросов](#оптимизация-запросов)
10. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)
13. [Полезные ссылки](#полезные-ссылки)

---

## Обзор инструментов для data fetching

Nuxt 3 предлагает три основных способа работы с HTTP:

| Инструмент | Назначение | Где использовать |
|---|---|---|
| `useFetch` | Декларативная загрузка данных в `<script setup>` | Страницы и компоненты, простые GET-запросы |
| `useAsyncData` | Обёртка для произвольной асинхронной функции | Сложная логика, несколько источников, кастомный ключ |
| `$fetch` | Императивный HTTP-клиент | Обработчики событий, POST/PUT/DELETE, вызовы API из функций |

Под капотом `useFetch` вызывает `useAsyncData`, а `useAsyncData` использует `$fetch` для выполнения запроса. Поэтому эти инструменты не конкурируют, а дополняют друг друга.

---

## useFetch

`useFetch` — самый простой способ загрузить данные в Nuxt 3. Он объединяет `useAsyncData` и `$fetch`, автоматически разрешая URL, обрабатывая SSR и гидратацию.

### Базовый пример

```vue
<!-- pages/users.vue -->
<script setup>
const { data: users, pending, error, refresh } = await useFetch('/api/users');
</script>

<template>
  <div>
    <p v-if="pending">Загрузка...</p>
    <p v-else-if="error">Ошибка: {{ error.message }}</p>
    <ul v-else>
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>
    <button @click="refresh">Обновить</button>
  </div>
</template>
```

### Возвращаемые поля

| Поле | Описание |
|---|---|
| `data` | Загруженные данные. |
| `pending` | `true`, пока идёт запрос. |
| `error` | Объект ошибки или `null`. |
| `refresh` | Функция для повторного выполнения запроса. |
| `execute` | Запускает запрос, если он отложен (`lazy: true`). |
| `status` | Статус запроса: `idle`, `pending`, `success`, `error`. |

### Ключевые опции

```ts
await useFetch('/api/users', {
  lazy: false,        // true — не блокировать навигацию
  server: true,       // выполнять ли запрос на сервере при SSR
  default: () => [],  // значение по умолчанию для data
  transform: (data) => data.map(normalizeUser),
  pick: ['id', 'name'],
  watch: [page],
});
```

### Реактивные параметры

`useFetch` принимает реактивные URL и опции. Если URL или `watch` меняются, запрос выполняется заново:

```vue
<script setup>
const route = useRoute();
const page = ref(1);

const { data: posts } = await useFetch('/api/posts', {
  query: { page },
  watch: [page],
});

function nextPage() {
  page.value++;
}
</script>
```

### Когда использовать useFetch

- URL известен на этапе setup.
- Нужен SSR-safe data fetching с минимумом boilerplate.
- Не требуется тонкий контроль над логикой запроса.

---

## useAsyncData и $fetch

`useAsyncData` предоставляет больше контроля, чем `useFetch`, потому что принимает произвольную функцию-обработчик. Внутри обычно используется `$fetch`.

### Базовый пример

```vue
<script setup>
const { data, pending, error } = await useAsyncData('users', () =>
  $fetch('/api/users')
);
</script>
```

### Первый аргумент — ключ

Ключ используется для дедупликации запросов, кэширования в payload и гидратации. Если ключ не указан, Nuxt генерирует его автоматически на основе строки функции.

```ts
// Явный ключ важен, когда несколько компонентов могут запрашивать одни данные
const { data } = await useAsyncData('users-list', () =>
  $fetch('/api/users')
);
```

### $fetch vs fetch

`$fetch` — это обёртка над `ofetch` из unjs. Она предоставляет:

- Автоматический парсинг JSON.
- Интерцепторы запросов и ответов.
- Отмену запросов через `AbortController`.
- Работу на сервере и клиенте без разницы в API.

```ts
// $fetch в обработчике события
async function submitForm(values) {
  const result = await $fetch('/api/contact', {
    method: 'POST',
    body: values,
  });
}
```

### Разница между useFetch и useAsyncData

| | `useFetch` | `useAsyncData` |
|---|---|---|
| Синтаксис | `useFetch(url, options)` | `useAsyncData(key, fetcher)` |
| URL | Передаётся первым аргументом | Задаётся внутри функции-обработчика |
| Гибкость | Меньше | Больше: можно комбинировать несколько запросов и логику |
| Когда использовать | Простые GET-запросы | Сложная логика, несколько источников, кастомные ключи |

Важно: `useFetch('/api/users')` под капотом вызывает `useAsyncData` с `$fetch('/api/users')`.

### Комбинирование нескольких запросов

```vue
<script setup>
const { data: dashboard } = await useAsyncData('dashboard', async () => {
  const [users, orders] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/orders'),
  ]);

  return { users, orders };
});
</script>
```

---

## SSR-safe fetching

Одна из сильных сторон Nuxt 3 — загрузка данных работает корректно и на сервере, и на клиенте. Это называется SSR-safe fetching.

### Как работает на сервере

При SSR Nuxt выполняет `useFetch` / `useAsyncData` на сервере, до отправки HTML клиенту:

1. Серверный движок Nitro получает запрос.
2. Vue рендерит компонент и выполняет `useFetch`.
3. `$fetch` на сервере обращается к внутреннему API напрямую, без сетевого запроса.
4. Данные сериализуются и включаются в HTML как часть payload.
5. Клиент получает HTML с уже готовыми данными.
6. При гидратации Vue использует payload вместо повторного запроса.

### Двойные запросы и дедупликация

Если один и тот же `useAsyncData` вызывается в нескольких компонентах с одинаковым ключом, Nuxt выполнит запрос только один раз за рендер. Это важно для избежания лишних запросов при SSR.

```vue
<!-- ComponentA.vue -->
<script setup>
const { data: users } = await useAsyncData('users', () => $fetch('/api/users'));
</script>

<!-- ComponentB.vue -->
<script setup>
// Тот же ключ — повторного запроса не будет
const { data: users } = await useAsyncData('users', () => $fetch('/api/users'));
</script>
```

### Гидратация и payload

Данные, полученные на сервере, попадают в глобальный объект `__NUXT__` в HTML. Клиент читает их из payload, что исключает waterfall-загрузку и ускоряет первую отрисовку.

Если данные на сервере и клиенте различаются, возможен hydration mismatch. Поэтому важно, чтобы логика запроса была детерминированной.

### Когда запрос выполняется на клиенте

- `ssr: false` в `nuxt.config.ts` или `routeRules`.
- Опция `server: false` в `useFetch` / `useAsyncData`.
- Запрос внутри обработчика события, а не в setup.
- Компонент обёрнут в `<ClientOnly>`.

---

## Обработка ошибок

Nuxt предоставляет несколько уровней обработки ошибок при data fetching.

### Локальная обработка через error

```vue
<script setup>
const { data, pending, error } = await useFetch('/api/users');
</script>

<template>
  <div>
    <p v-if="pending">Загрузка...</p>
    <p v-else-if="error">{{ error.statusCode }}: {{ error.statusMessage }}</p>
    <ul v-else>
      <li v-for="user in data" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>
```

### Ошибки на стороне API

В серверных обработчиках используйте `createError`, чтобы передать клиенту осмысленную ошибку:

```ts
// server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');

  const user = findUserById(id);

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден',
    });
  }

  return user;
});
```

### Глобальная обработка ошибок

Интерцепторы `$fetch` позволяют централизованно обрабатывать ошибки, например логировать или показывать уведомления:

```ts
// plugins/fetch.ts
export default defineNuxtPlugin(() => {
  const { $fetch } = useNuxtApp();

  globalThis.$fetch = $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login');
      }
    },
  });
});
```

Для глобальной страницы ошибок используется `error.vue`.

### Показ страницы ошибки

```ts
// В middleware или composable
if (!user) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Страница не найдена',
  });
}
```

---

## Отмена запросов

Отмена запросов нужна, чтобы избежать race condition и лишней работы при быстрой смене фильтров, страниц или уходе со страницы.

### AbortController с $fetch

```vue
<script setup>
let controller;

async function search(query) {
  controller?.abort();
  controller = new AbortController();

  try {
    const results = await $fetch('/api/search', {
      query: { q: query },
      signal: controller.signal,
    });
    // обработка результатов
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    throw error;
  }
}
</script>
```

### Отмена в useFetch и useAsyncData

В отличие от `$fetch`, `useFetch` и `useAsyncData` управляют жизненным циклом запроса сами. При смене реактивных параметров предыдущий запрос отменяется автоматически, если URL или `watch` изменились. Явный `AbortController` внутри `useAsyncData` обычно не требуется.

Если нужно отменить запрос вручную, лучше использовать `$fetch` в обработчике события.

### Интерцепторы

`$fetch` поддерживает интерцепторы на всех этапах:

```ts
await $fetch('/api/data', {
  onRequest({ request, options }) {
    options.headers.authorization = `Bearer ${token}`;
  },
  onRequestError({ request, error }) {
    console.error('Request error', error);
  },
  onResponse({ response }) {
    console.log('Response', response._data);
  },
  onResponseError({ response }) {
    console.error('Response error', response.status);
  },
});
```

---

## Ленивый data fetching

По умолчанию `useFetch` и `useAsyncData` блокируют навигацию до завершения запроса. Это хорошо для SEO и критичных данных, но плохо для второстепенных блоков.

### useLazyFetch и useLazyAsyncData

```vue
<script setup>
const { pending, data: posts } = useLazyFetch('/api/posts');
</script>

<template>
  <div>
    <h1>Блог</h1>
    <p v-if="pending">Загрузка постов...</p>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>
```

При ленивой загрузке страница рендерится сразу, а данные подгружаются после навигации. Это улучшает воспринимаемую производительность.

### Ленивый запрос вручную

```vue
<script setup>
const { data, execute, pending } = await useFetch('/api/report', {
  immediate: false,
});

async function loadReport() {
  await execute();
}
</script>
```

---

## Запросы на клиенте

Не все запросы должны выполняться на сервере. Некоторые сценарии требуют клиентского выполнения.

### $fetch в обработчиках событий

```vue
<script setup>
async function createUser(formData) {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: formData,
  });

  await navigateTo(`/users/${user.id}`);
}
</script>
```

### useFetch с server: false

```vue
<script setup>
const { data } = await useFetch('/api/analytics', {
  server: false,
});
</script>
```

Такой запрос выполнится только в браузере, после гидратации.

### Когда выполнять запросы на клиенте

- Запросы, зависящие от браузерного API: `localStorage`, `navigator.geolocation`.
- Чувствительные данные, которые не должны попадать в SSR-HTML.
- Аналитика, персонализация на основе клиентского состояния.
- POST/PUT/DELETE в ответ на действия пользователя.

---

## Оптимизация запросов

### transform и pick

`transform` позволяет преобразовать данные сразу после получения, а `pick` — выбрать только нужные поля для payload:

```ts
const { data: users } = await useFetch('/api/users', {
  transform: (users) => users.map(u => ({ id: u.id, name: u.name })),
  pick: ['id', 'name'],
});
```

### watch

Повторный запрос при изменении реактивных зависимостей:

```ts
const search = ref('');

const { data } = await useFetch('/api/search', {
  query: { q: search },
  watch: [search],
  debounce: 300,
});
```

### Кэширование на сервере

Для тяжёлых или редко меняющихся данных используйте `defineCachedEventHandler` или `routeRules`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/posts': { cache: { maxAge: 60 * 5 } },
  },
});
```

---

## Лучшие практики и антипаттерны

### Делайте

- Используйте `useFetch` для декларативной загрузки в setup.
- Используйте `useAsyncData`, когда нужна сложная логика или кастомный ключ.
- Используйте `$fetch` в обработчиках событий и для императивных вызовов.
- Задавайте явные ключи в `useAsyncData`, если данные могут запрашиваться из разных мест.
- Обрабатывайте `pending` и `error` состояния в шаблоне.
- Применяйте `useLazyFetch` для второстепенных данных.
- Кэшируйте тяжёлые серверные роуты через `defineCachedEventHandler` или `routeRules`.
- Используйте `server: false`, если данные не нужны в SSR.
- Отменяйте запросы через `AbortController` при быстром вводе или уходе со страницы.

### Не делайте

- Не используйте `$fetch` напрямую в `<script setup>` для начальной загрузки данных — это не SSR-safe и не даст payload.
- Не вызывайте `useFetch` после `await` вне composable — это нарушает контекст Vue lifecycle.
- Не забывайте обрабатывать ошибки: пустой `data` без проверки `error` приведёт к падению.
- Не делайте дублирующие запросы с разными ключами для одних и тех же данных.
- Не используйте `useFetch` для мутаций — для POST/PUT/DELETE используйте `$fetch`.
- Не кэшируйте роуты с пользовательскими данными без корректного `getKey`.

---

## Ключевые тезисы для интервью

- **Data fetching в Nuxt 3** строится вокруг `useFetch`, `useAsyncData` и `$fetch`.
- **`useFetch`** — обёртка для декларативных SSR-safe GET-запросов в `<script setup>`.
- **`useAsyncData`** даёт больше контроля: ключ, произвольная функция-обработчик, комбинирование запросов.
- **`$fetch`** — HTTP-клиент на базе `ofetch`, работает на сервере и клиенте; используется в обработчиках событий.
- **Ключ в `useAsyncData`** нужен для дедупликации, payload и гидратации.
- **SSR-safe fetching** означает, что данные загружаются на сервере, сериализуются в payload и не запрашиваются повторно на клиенте.
- **Ошибки** обрабатываются через поле `error`, `createError` в API, интерцепторы `$fetch` и `error.vue`.
- **Отмена запросов** реализуется через `AbortController` с `$fetch`; `useFetch` отменяет предыдущий запрос при изменении реактивных параметров.
- **`useLazyFetch`** не блокирует навигацию и подходит для второстепенных данных.
- **Клиентские запросы** нужны для браузерных API, мутаций и чувствительных данных.

---

## Заключение

Data fetching — ключевая часть работы с Nuxt 3. Правильный выбор между `useFetch`, `useAsyncData` и `$fetch`, понимание SSR-safe fetching и умение обрабатывать ошибки позволяют строить быстрые и надёжные full-stack приложения.

`useFetch` покрывает большинство сценариев начальной загрузки, `useAsyncData` — сложную логику, а `$fetch` — императивные вызовы и мутации. Важно помнить про hydration, дедупликацию по ключу и отмену запросов, чтобы избежать типичных проблем production-приложений.

Следующие статьи раздела продолжат погружение: состояние и SEO, обработка ошибок, Nuxt Layers, модули и экосистема.

---

## Полезные ссылки

- [Nuxt 3 Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) — официальное руководство по загрузке данных
- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) — документация useFetch
- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) — документация useAsyncData
- [$fetch](https://nuxt.com/docs/api/utils/dollar-fetch) — документация $fetch
- [ofetch](https://github.com/unjs/ofetch) — HTTP-клиент, лежащий в основе $fetch
- [Nuxt Server Directory](https://nuxt.com/docs/guide/directory-structure/server) — серверные роуты и API
