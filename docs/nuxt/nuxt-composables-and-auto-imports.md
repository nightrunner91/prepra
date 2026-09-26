---
title: "Composables и auto-imports в Nuxt 3: useFetch, useAsyncData, useState, useHead и свои composables"
section: nuxt
description: "Как устроены composables и auto-imports в Nuxt 3: встроенные composables useFetch, useAsyncData, useState, useHead, useRoute, useRuntimeConfig; создание своих composables; SSR-safe подход и отличия от Vue composables."
order: 4
tags: ["nuxt", "nuxt3", "vue", "composables", "auto-imports", "useFetch", "useAsyncData", "useState", "useHead", "ssr"]
questions:
  - "Что такое composables в Nuxt 3 и чем они отличаются от обычных функций"
  - "Как работают auto-imports в Nuxt 3"
  - "Когда использовать useFetch, а когда useAsyncData + $fetch"
  - "Для чего нужен useState и чем он отличается от ref"
  - "Как управлять meta-тегами через useHead и useSeoMeta"
  - "Как создать и зарегистрировать свой composable в Nuxt 3"
  - "Какие composables есть в Nuxt 3 для работы с роутом, конфигом и cookies"
  - "Что значит SSR-safe composable и как его написать"
  - "Чем Nuxt composables отличаются от Vue composables"
---

# Composables и auto-imports в Nuxt 3: useFetch, useAsyncData, useState, useHead и свои composables

Nuxt 3 активно использует паттерн composables: небольших функций, инкапсулирующих переиспользуемую логику с доступом к реактивности Vue, lifecycle hooks и инфраструктуре фреймворка. В отличие от Vue SPA, где composables пишутся вручную и импортируются явно, Nuxt предоставляет богатую библиотеку встроенных composables и автоматический импорт для пользовательских.

В этой статье разберём ключевые встроенные composables — `useFetch`, `useAsyncData`, `useState`, `useHead`, `useSeoMeta`, `useRoute`, `useRouter`, `useRuntimeConfig`, `useCookie` — а также научимся создавать свои composables и делать их SSR-safe.

## Содержание

1. [Что такое composables](#что-такое-composables)
2. [Auto-imports в Nuxt 3](#auto-imports-в-nuxt-3)
3. [useFetch](#usefetch)
4. [useAsyncData и $fetch](#useasyncdata-и-fetch)
5. [useState](#usestate)
6. [useHead, useSeoMeta и definePageMeta](#usehead-useseometa-и-definepagemeta)
7. [Другие встроенные composables](#другие-встроенные-composables)
8. [Создание своих composables](#создание-своих-composables)
9. [SSR-safe composables](#ssr-safe-composables)
10. [Nuxt composables vs Vue composables](#nuxt-composables-vs-vue-composables)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое composables

Composable — это функция, которая инкапсулирует логику с использованием Vue Composition API: `ref`, `computed`, `watch`, `onMounted` и других. Composable может возвращать реактивные данные, методы и side-effects.

```ts
// composables/useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial);
  const doubled = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return { count, doubled, increment };
}
```

```vue
<!-- pages/index.vue -->
<script setup>
const { count, doubled, increment } = useCounter(10);
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (doubled: {{ doubled }})
  </button>
</template>
```

Основные признаки composable:

- Использует Composition API внутри себя.
- Может вызываться только в синхронном контексте Vue lifecycle (например, в `<script setup>`, другом composable, setup-функции).
- Начинается с префикса `use` — это соглашение, которое помогает Nuxt и инструментам распознавать composables.

---

## Auto-imports в Nuxt 3

Nuxt 3 автоматически импортирует:

- **API Vue 3:** `ref`, `reactive`, `computed`, `watch`, `onMounted` и другие.
- **Встроенные composables Nuxt:** `useFetch`, `useAsyncData`, `useState`, `useHead`, `useRoute` и т.д.
- **Компоненты из `components/`.**
- **Composables из `composables/`.**
- **Утилиты из `utils/`.**
- **Встроенные компоненты Nuxt:** `<NuxtPage />`, `<NuxtLayout />`, `<NuxtLink />`.

Это означает, что в `<script setup>` можно писать:

```vue
<script setup>
const count = ref(0);        // Vue API — auto-import
const route = useRoute();    // Nuxt composable — auto-import
</script>
```

### Как отключить auto-imports

Если нужен явный контроль:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    autoImport: false,
  },
});
```

### Настройка директорий для auto-imports

По умолчанию Nuxt сканирует `composables/` и `utils/`. Можно добавить свои директории:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: [
      'composables',
      'composables/**',
      'utils',
      'shared/composables',
    ],
  },
});
```

### Генерация types для auto-imports

Nuxt генерирует файл `.nuxt/imports.d.ts`, который помогает TypeScript понимать, откуда берутся символы. Если IDE не видит auto-import, перезапустите dev-сервер или выполните `npx nuxi prepare`.

---

## useFetch

`useFetch` — самый простой способ загрузить данные в Nuxt 3. Он объединяет `useAsyncData` и `$fetch`, автоматически разрешая URL, обрабатывая SSR и гидратацию.

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
  lazy: false,       // если true, запрос выполняется после монтирования
  server: true,      // выполнять ли запрос на сервере при SSR
  default: () => [], // значение по умолчанию для data
  transform: (data) => data.map(normalizeUser),
  pick: ['id', 'name'],
  watch: [page],
});
```

### Когда использовать useFetch

- URL известен на этапе setup.
- Нужен SSR-safe data fetching с минимумом boilerplate.
- Не требуется тонкий контроль над логикой запроса.

---

## useAsyncData и $fetch

`useAsyncData` предоставляет больше контроля, чем `useFetch`, потому что принимает произвольную функцию-обработчик. Внутри обычно используется `$fetch` — универсальная HTTP-утилита Nuxt, работающая и на сервере, и на клиенте.

```vue
<script setup>
const { data, pending, error } = await useAsyncData('users', () =>
  $fetch('/api/users')
);
</script>
```

### Первый аргумент — ключ

Ключ (`'users'` в примере) используется для дедупликации запросов, кэширования в payload и гидратации. Если ключ не указан, Nuxt генерирует его автоматически на основе строки функции.

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
- Отмену запросов.
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

---

## useState

`useState` — SSR-safe способ хранить глобальное или разделяемое состояние в Nuxt 3. В отличие от обычного `ref`, `useState` сохраняет значение между сервером и клиентом в процессе гидратации.

```ts
// composables/useSidebar.ts
export function useSidebar() {
  return useState('sidebar.open', () => false);
}
```

```vue
<script setup>
const isOpen = useSidebar();

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>
```

### Ключевые особенности

- Требует уникальный ключ первым аргументом.
- Фабрика вторым аргументом инициализирует значение, если его ещё нет.
- Значение общее для всех вызовов с одним ключом в пределах одного запроса/приложения.
- При SSR значение сериализуется и передаётся клиенту, чтобы избежать двойной инициализации.

### useState vs ref

| | `useState` | `ref` |
|---|---|---|
| Глобальное состояние | Да, при одинаковом ключе | Нет, создаёт новое каждый вызов |
| SSR-safe | Да | Нет, может инициализироваться дважды |
| Ключ | Обязателен | Нет |
| Когда использовать | Разделяемое состояние | Локальное состояние компонента |

### Пример: разделяемое состояние корзины

```ts
// composables/useCart.ts
export function useCart() {
  const items = useState<CartItem[]>('cart.items', () => []);

  function add(item: CartItem) {
    items.value.push(item);
  }

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  );

  return { items, add, total };
}
```

---

## useHead, useSeoMeta и definePageMeta

Nuxt предоставляет несколько способов управлять `<head>` документа.

### useHead

```vue
<script setup>
useHead({
  title: 'Профиль пользователя',
  meta: [
    { name: 'description', content: 'Страница профиля' },
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/profile' },
  ],
});
</script>
```

### useSeoMeta

`useSeoMeta` — удобный composable для SEO и Open Graph с автодополнением полей и TypeScript-поддержкой:

```vue
<script setup>
useSeoMeta({
  title: 'Мой блог',
  description: 'Статьи о фронтенде',
  ogTitle: 'Мой блог',
  ogDescription: 'Статьи о фронтенде',
  ogImage: 'https://example.com/cover.jpg',
  twitterCard: 'summary_large_image',
});
</script>
```

### definePageMeta

Макрос `definePageMeta` задаёт мета-данные страницы: layout, middleware, title и другие. Он работает только в файлах `pages/`.

```vue
<script setup>
definePageMeta({
  title: 'Админ-панель',
  layout: 'admin',
  middleware: 'auth',
});
</script>
```

### Реактивные meta-теги

```vue
<script setup>
const title = ref('Главная');

useHead(() => ({
  title: title.value,
}));
</script>
```

---

## Другие встроенные composables

### useRoute и useRouter

```vue
<script setup>
const route = useRoute();
const router = useRouter();

console.log(route.params.id);
console.log(route.query.tab);

function goHome() {
  router.push('/');
}
</script>
```

### useRuntimeConfig

Доступ к переменным окружения и runtime-конфигурации:

```ts
const config = useRuntimeConfig();
console.log(config.public.apiBase);
console.log(config.apiSecret); // только на сервере
```

### useCookie

Работа с cookies на сервере и клиенте:

```ts
const token = useCookie('token');
token.value = 'abc123';
```

### useRequestEvent и useRequestHeaders

Доступ к серверному событию и заголовкам запроса:

```ts
const event = useRequestEvent();
const headers = useRequestHeaders(['authorization']);
```

### useLazyFetch и useLazyAsyncData

Ленивые версии, которые не блокируют навигацию:

```vue
<script setup>
const { pending, data: posts } = useLazyFetch('/api/posts');
</script>
```

### useError и showError

Управление ошибками приложения:

```ts
const error = useError();
showError({ statusCode: 404, statusMessage: 'Страница не найдена' });
```

### showError vs throwError

| | `showError` | `throwError` |
|---|---|---|
| Назначение | Показать страницу ошибки | Бросить ошибку, которую перехватит Nuxt |
| Когда использовать | В обработчиках событий | В middleware, async setup, API |

---

## Создание своих composables

Пользовательские composables помещаются в папку `composables/` и автоматически доступны во всём приложении.

### Простой composable

```ts
// composables/useDateFormatter.ts
export function useDateFormatter() {
  function format(date: Date | string, locale = 'ru-RU') {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  }

  return { format };
}
```

```vue
<script setup>
const { format } = useDateFormatter();
const today = format(new Date());
</script>
```

### Composable с бизнес-логикой

```ts
// composables/useUserProfile.ts
export function useUserProfile(userId: MaybeRef<string>) {
  const id = toRef(userId);

  const { data: profile, pending, error } = useFetch(() => `/api/users/${id.value}`, {
    watch: [id],
  });

  return { profile, pending, error };
}
```

### Группировка composables

Можно создавать вложенные папки, Nuxt всё равно найдёт файлы:

```
composables/
├── useCounter.ts
├── useDateFormatter.ts
└── api/
    ├── useUsers.ts
    └── usePosts.ts
```

---

## SSR-safe composables

Composables, которые работают корректно и на сервере, и на клиенте, называются SSR-safe. Основные правила:

### 1. Проверяйте процесс выполнения

```ts
export function useWindowWidth() {
  const width = ref(0);

  if (process.client) {
    width.value = window.innerWidth;
    window.addEventListener('resize', () => {
      width.value = window.innerWidth;
    });
  }

  return width;
}
```

### 2. Используйте lifecycle hooks корректно

`onMounted` выполняется только на клиенте, поэтому инициализация клиентских библиотек безопасна внутри него:

```ts
export function useChart(containerRef: Ref<HTMLElement | null>) {
  onMounted(() => {
    if (!containerRef.value) return;
    // инициализация клиентской библиотеки
  });
}
```

### 3. Избегайте случайных значений

`Math.random()` и `Date.now()` на сервере и клиенте дадут разные результаты, что вызовет hydration mismatch:

```ts
// Плохо
const id = Math.random().toString(36);

// Хорошо: инициализировать на клиенте
const id = ref('');
onMounted(() => {
  id.value = Math.random().toString(36);
});
```

### 4. Composables, зависящие от запроса

На сервере composable может использовать `useRequestEvent`, `useRequestHeaders`, `useCookie` — они привязаны к текущему запросу.

---

## Nuxt composables vs Vue composables

| Аспект | Vue composables | Nuxt composables |
|---|---|---|
| Назначение | Переиспользуемая реактивная логика | Логика + интеграция с инфраструктурой Nuxt |
| Примеры | `useMouse`, `useLocalStorage` | `useFetch`, `useAsyncData`, `useRoute`, `useHead` |
| SSR | Зависит от реализации | Часто изначально SSR-safe |
| Auto-import | Нет, нужен явный import | Да, при наличии в `composables/` |
| Доступ к серверу | Нет | Да, через `useRequestEvent`, `useRuntimeConfig` |
| Хранилище состояния | `ref` / `reactive` | `useState` с ключом и SSR-сериализацией |

По сути, Nuxt composables — это надстройка над Vue composables, которая добавляет интеграцию с роутингом, сервером, head-менеджментом и SSR.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Называйте composables с префикса `use`.
- Помещайте переиспользуемую логику в `composables/`.
- Используйте `useFetch` для простых запросов, а `useAsyncData` — для сложной логики.
- Задавайте явные ключи в `useAsyncData` и `useState` для предсказуемого поведения.
- Делайте composables SSR-safe: проверяйте `process.client`, избегайте случайных значений на сервере.
- Используйте `useState` для разделяемого состояния, а `ref` — для локального.
- Оборачивайте клиентские библиотеки в `<ClientOnly>` или `onMounted`.

### ❌ Не делайте

- Не вызывайте composables вне Vue setup-контекста (например, в циклах `for` или после `await` вне composable).
- Не используйте `window`, `document`, `localStorage` на сервере без проверок.
- Не смешивайте логику UI и data fetching в одном огромном composable.
- Не забывайте про hydration mismatch при генерации id, дат и случайных значений.
- Не используйте `useFetch` для вызовов в обработчиках событий — там нужен `$fetch`.

---

## Ключевые тезисы для интервью

- **Composables** — функции, инкапсулирующие реактивную логику с использованием Composition API. Начинаются с `use`.
- **Auto-imports** в Nuxt 3 работают для Vue API, встроенных Nuxt composables, компонентов, composables из `composables/` и утилит из `utils/`.
- **`useFetch`** — обёртка для SSR-safe GET-запросов с минимумом boilerplate. Возвращает `data`, `pending`, `error`, `refresh`.
- **`useAsyncData`** даёт больше контроля: принимает ключ и функцию-обработчик, обычно используется с `$fetch`.
- **`$fetch`** — HTTP-клиент Nuxt на базе `ofetch`, работает на сервере и клиенте.
- **`useState`** — SSR-safe разделяемое состояние с ключом и сериализацией между сервером и клиентом.
- **`useHead`** и **`useSeoMeta`** управляют `<head>` и SEO/meta-тегами из компонентов.
- **Свои composables** помещаются в `composables/` и автоматически импортируются.
- **SSR-safe composables** не используют `window`/`document` на сервере, избегают случайных значений и корректно работают с lifecycle hooks.
- **Nuxt composables** отличаются от Vue composables интеграцией с роутингом, сервером, head-менеджментом и SSR.

---

## Заключение

Composables — это сердце разработки на Nuxt 3. Они позволяют выразить логику приложения компактно, переиспользуемо и SSR-safe. Встроенные composables вроде `useFetch`, `useAsyncData`, `useState`, `useHead` покрывают большинство задач: загрузку данных, состояние, SEO и интеграцию с инфраструктурой фреймворка. А auto-imports избавляют от рутинных импортов и ускоряют разработку.

Понимание разницы между `useFetch` и `useAsyncData`, между `useState` и `ref`, а также умение писать SSR-safe composables — обязательные навыки для работы с Nuxt 3 на production.

Следующие статьи раздела продолжат погружение: жизненный цикл приложения, серверная часть Nitro, data fetching в деталях, состояние и SEO, обработка ошибок.

---

## Полезные ссылки

- [Nuxt 3 Composables](https://nuxt.com/docs/api/composables) — официальная документация по встроенным composables
- [Nuxt Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports) — концепция auto-imports
- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) — документация useFetch
- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) — документация useAsyncData
- [useState](https://nuxt.com/docs/api/composables/use-state) — документация useState
- [useHead](https://nuxt.com/docs/api/composables/use-head) — управление head
- [useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta) — SEO meta-теги
- [ofetch](https://github.com/unjs/ofetch) — HTTP-клиент, лежащий в основе $fetch
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html) — руководство по composables во Vue
