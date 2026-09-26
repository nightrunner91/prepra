---
title: "Файловая маршрутизация в Nuxt 3: pages/, динамические роуты, useRoute и useRouter"
section: nuxt
description: "Как устроен роутинг в Nuxt 3: файловая маршрутизация в pages/, динамические и вложенные роуты, catch-all, 404, useRoute, useRouter, definePageMeta и программная навигация navigateTo."
order: 2
tags: ["nuxt", "nuxt3", "vue", "routing", "vue-router", "useRoute", "useRouter", "pages", "dynamic-routes"]
questions:
  - "Как Nuxt 3 превращает файлы из pages/ в маршруты"
  - "Что делает файл index.vue во вложенных папках"
  - "Как создать динамический роут и получить параметр через useRoute"
  - "Чем отличается [id] от [...slug]"
  - "Как сделать страницу 404 в Nuxt 3"
  - "Для чего нужен definePageMeta"
  - "Как осуществить программную навигацию в Nuxt 3"
  - "Как валидировать параметры маршрута"
  - "В чём разница между useRoute и useRouter"
---

# Файловая маршрутизация в Nuxt 3: pages/, динамические роуты, useRoute и useRouter

Nuxt 3 использует **файловую маршрутизацию** (file-based routing): каждый Vue-файл в папке `pages/` автоматически становится страницей приложения. Это избавляет от ручного описания маршрутов в `router/index.ts` — структура URL повторяет структуру папок и файлов.

В этой статье разберём базовые правила роутинга, динамические и вложенные маршруты, catch-all, страницу 404, composables `useRoute` и `useRouter`, `definePageMeta` и программную навигацию `navigateTo`.

## Содержание

1. [Базовая файловая маршрутизация](#базовая-файловая-маршрутизация)
2. [index.vue и корневые маршруты](#indexvue-и-корневые-маршруты)
3. [Динамические параметры [id]](#динамические-параметры-id)
4. [Вложенные маршруты](#вложенные-маршруты)
5. [Catch-all [...slug] и страница 404](#catch-all-slug-и-страница-404)
6. [Валидация параметров validate](#валидация-параметров-validate)
7. [useRoute и useRouter](#useroute-и-userouter)
8. [definePageMeta](#definepagemeta)
9. [Программная навигация navigateTo](#программная-навигация-navigateto)
10. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)
13. [Полезные ссылки](#полезные-ссылки)

---

## Базовая файловая маршрутизация

Папка `pages/` находится рядом с `app.vue`. Nuxt сканирует её содержимое и строит маршруты на основе имён файлов и папок.

```
pages/
├── index.vue      # /
├── about.vue      # /about
├── contact.vue    # /contact
└── users/
    ├── index.vue  # /users
    └── [id].vue   # /users/:id
```

| Файл | URL |
|---|---|
| `pages/index.vue` | `/` |
| `pages/about.vue` | `/about` |
| `pages/users/index.vue` | `/users` |
| `pages/users/[id].vue` | `/users/:id` |

Под капотом Nuxt генерирует конфигурацию Vue Router автоматически. Вручную прописывать маршруты не нужно.

### Включение файловой маршрутизации

Если папка `pages/` существует, Nuxt автоматически использует `<NuxtPage />` в `app.vue`:

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

Компонент `<NuxtPage />` — это аналог `<RouterView />` из Vue Router, но с дополнительной интеграцией в Nuxt: поддержкой transitions, keepalive, layout и других функций фреймворка.

---

## index.vue и корневые маршруты

Файл `index.vue` в любой папке отвечает за корневой маршрут этой папки.

```
pages/
├── index.vue          # /
├── users/
│   ├── index.vue      # /users
│   └── [id].vue       # /users/:id
└── blog/
    ├── index.vue      # /blog
    └── [slug].vue     # /blog/:slug
```

| Файл | URL |
|---|---|
| `pages/users/index.vue` | `/users` |
| `pages/users/[id].vue` | `/users/42` |
| `pages/blog/[slug].vue` | `/blog/my-post` |

Если для `/users` есть одновременно `pages/users.vue` и `pages/users/index.vue`, Nuxt отдаёт приоритет `index.vue` внутри папки. Вложенные маршруты требуют особой структуры (см. следующий раздел).

---

## Динамические параметры [id]

Динамический сегмент URL обозначается квадратными скобками: `[param]`.

```
pages/
└── users/
    └── [id].vue   # /users/:id
```

```vue
<!-- pages/users/[id].vue -->
<template>
  <div>
    <h1>Пользователь {{ userId }}</h1>
  </div>
</template>

<script setup>
const route = useRoute();
const userId = route.params.id;
</script>
```

### Несколько параметров

```
pages/
└── posts/
    └── [category]/
        └── [postId].vue   # /posts/:category/:postId
```

URL `/posts/vue/123` даст `route.params.category === 'vue'` и `route.params.postId === '123'`.

### Типы параметров

Все параметры маршрута — строки. Если нужно число, преобразуйте вручную:

```ts
const route = useRoute();
const userId = Number(route.params.id);
```

---

## Вложенные маршруты

Вложенные маршруты (nested routes) позволяют рендерить дочерние страницы внутри родительского `<NuxtPage />`.

```
pages/
├── users.vue          # родительский layout-маршрут /users
└── users/
    ├── index.vue      # /users
    └── [id].vue       # /users/:id
```

```vue
<!-- pages/users.vue -->
<template>
  <div>
    <h1>Пользователи</h1>
    <NuxtPage />
  </div>
</template>
```

```vue
<!-- pages/users/index.vue -->
<template>
  <p>Список пользователей</p>
</template>
```

```vue
<!-- pages/users/[id].vue -->
<template>
  <p>Профиль пользователя {{ $route.params.id }}</p>
</template>
```

При переходе на `/users` рендерится `pages/users.vue` + `pages/users/index.vue`. При переходе на `/users/42` — `pages/users.vue` + `pages/users/[id].vue`.

### Важно

Для вложенных маршрутов обязательно нужен родительский файл `pages/users.vue` с `<NuxtPage />`. Без него `pages/users/index.vue` и `pages/users/[id].vue` будут работать как независимые страницы.

---

## Catch-all [...slug] и страница 404

### Catch-all маршруты

Файл с тремя точками `[...slug]` ловит любое количество сегментов URL.

```
pages/
├── index.vue
└── [...slug].vue   # /anything, /a/b/c
```

```vue
<!-- pages/[...slug].vue -->
<template>
  <div>
    <h1>Страница: {{ slugPath }}</h1>
  </div>
</template>

<script setup>
const route = useRoute();
const slugPath = route.params.slug; // строка или массив
</script>
```

| URL | `route.params.slug` |
|---|---|
| `/docs` | `'docs'` |
| `/docs/vue` | `['docs', 'vue']` |
| `/a/b/c/d` | `['a', 'b', 'c', 'd']` |

### Страница 404

Создайте `pages/[...slug].vue`, который будет отображать страницу «не найдено»:

```vue
<!-- pages/[...slug].vue -->
<script setup>
const route = useRoute();
</script>

<template>
  <div>
    <h1>404</h1>
    <p>Страница {{ route.path }} не найдена</p>
  </div>
</template>
```

Для более гибкой обработки ошибок используйте `error.vue` в корне проекта или `throwError` / `showError`.

---

## Валидация параметров validate

Nuxt позволяет валидировать параметры маршрута через `definePageMeta` с функцией `validate`:

```vue
<!-- pages/users/[id].vue -->
<script setup>
definePageMeta({
  validate: async (route) => {
    return /^\=+$/.test(route.params.id);
  },
});
</script>
```

Функция `validate` может быть синхронной или асинхронной. Если она возвращает `false`, Nuxt показывает страницу 404.

### Валидация с navigateTo

Можно перенаправить пользователя вместо показа 404:

```vue
<!-- pages/users/[id].vue -->
<script setup>
definePageMeta({
  validate: (route) => {
    const id = Number(route.params.id);
    if (Number.isNaN(id) || id <= 0) {
      return navigateTo('/users');
    }
    return true;
  },
});
</script>
```

---

## useRoute и useRouter

Nuxt предоставляет два ключевых composables для работы с маршрутизацией:

### useRoute

Возвращает текущий маршрут — объект с `path`, `params`, `query`, `name`, `matched` и другими полями Vue Router.

```vue
<script setup>
const route = useRoute();

console.log(route.path);    // /users/42
console.log(route.params);  // { id: '42' }
console.log(route.query);   // { tab: 'settings' }
</script>
```

### useRouter

Возвращает экземпляр Vue Router с методами навигации и управления историей.

```vue
<script setup>
const router = useRouter();

function goBack() {
  router.back();
}

function goHome() {
  router.push('/');
}
</script>
```

| Composable | Назначение |
|---|---|
| `useRoute()` | Текущий маршрут: параметры, query, hash, мета-данные. |
| `useRouter()` | Управление навигацией: `push`, `replace`, `back`, `forward`, `go`. |

---

## definePageMeta

`definePageMeta` — макрос Nuxt для задания мета-данных конкретной страницы:

```vue
<!-- pages/admin.vue -->
<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'Админ-панель',
  keepalive: true,
});
</script>
```

### Распространённые поля

| Поле | Описание |
|---|---|
| `layout` | Имя макета из `layouts/`. |
| `middleware` | Route middleware, выполняемый перед загрузкой страницы. |
| `title` | Заголовок страницы (может использоваться модулями или плагинами). |
| `keepalive` | Включить keep-alive для этой страницы. |
| `validate` | Функция валидации параметров маршрута. |
| `key` | Кастомный ключ для `<NuxtPage />` и transitions. |

Мета-данные страницы доступны через `route.meta` после перехода на маршрут.

---

## Программная навигация navigateTo

`navigateTo` — предпочтительный способ программной навигации в Nuxt 3. Он корректно работает как на сервере (во время SSR), так и на клиенте.

```vue
<script setup>
const router = useRouter();

async function login() {
  await $fetch('/api/login', { method: 'POST' });
  await navigateTo('/dashboard');
}
</script>
```

### navigateTo vs router.push

| | `navigateTo` | `router.push` |
|---|---|---|
| Работает на сервере | Да | Нет |
| Работает на клиенте | Да | Да |
| Поддерживает внешние URL | Да | Нет |
| Рекомендуется в Nuxt | Да | В ограниченных случаях |

```ts
// Внешний редирект
await navigateTo('https://example.com', { external: true });

// Замена текущей записи в истории
await navigateTo('/login', { replace: true });
```

`navigateTo` можно использовать в middleware, плагинах, обработчиках событий и `validate`.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте `useRoute()` для чтения параметров и query в `<script setup>`.
- Используйте `navigateTo` для программной навигации, особенно в SSR-контексте.
- Валидируйте параметры через `definePageMeta({ validate })`.
- Используйте вложенные маршруты, когда дочерние страницы должны рендериться внутри общего layout-файла.
- Давайте файлам понятные имена, соответствующие URL.

### ❌ Не делайте

- Не используйте `window.location` или `history.pushState` напрямую — это ломает SSR и гидратацию.
- Не забывайте, что `route.params` всегда содержит строки, даже для числовых id.
- Не смешивайте в одной папке `users.vue` и `users/index.vue`, если ожидаете вложенные маршруты — разберитесь в приоритетах.
- Не делайте сложную бизнес-логику прямо в `validate`; лучше вынести её в composable или API.

---

## Ключевые тезисы для интервью

- **Файловая маршрутизация** строится автоматически из папки `pages/`. Каждый файл — маршрут.
- `index.vue` в папке отвечает за корневой URL этой папки.
- Динамические параметры обозначаются `[param]`: `pages/users/[id].vue` → `/users/:id`.
- **Catch-all** обозначается `[...slug]` и ловит несколько сегментов URL.
- Для вложенных маршрутов нужен родительский файл с `<NuxtPage />`.
- `useRoute()` возвращает текущий маршрут с `params`, `query`, `path`.
- `useRouter()` предоставляет методы навигации Vue Router.
- `navigateTo` — SSR-safe альтернатива `router.push`, работает на сервере и клиенте.
- `definePageMeta` задаёт мета-данные страницы: layout, middleware, title, keepalive, validate.
- `validate` в `definePageMeta` позволяет валидировать параметры и редиректить при необходимости.
- Страница 404 обычно реализуется через `pages/[...slug].vue` или `error.vue`.

---

## Заключение

Файловая маршрутизация — одно из главных преимуществ Nuxt 3. Она ускоряет разработку, делает структуру проекта предсказуемой и сразу отражает URL-поверхность приложения. Зная правила именования файлов, динамические параметры, вложенные маршруты, `useRoute`, `useRouter`, `definePageMeta` и `navigateTo`, можно уверенно строить навигацию в Nuxt-приложениях любой сложности.

Следующие статьи раздела продолжат погружение: режимы рендеринга, composables Nuxt, жизненный цикл приложения, серверная часть Nitro, data fetching и работа с состоянием.

---

## Полезные ссылки

- [Nuxt 3 Routing](https://nuxt.com/docs/getting-started/routing) — официальная документация по роутингу
- [Vue Router](https://router.vuejs.org/) — документация базового роутера
- [Nuxt Pages](https://nuxt.com/docs/guide/directory-structure/pages) — структура папки pages
- [definePageMeta](https://nuxt.com/docs/api/utils/define-page-meta) — мета-данные страницы
- [navigateTo](https://nuxt.com/docs/api/utils/navigate-to) — программная навигация
