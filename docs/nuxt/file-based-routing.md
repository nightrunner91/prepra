---
title: "Файловая маршрутизация в Nuxt 3"
section: nuxt
description: "Как устроен роутинг в Nuxt 3: файловая маршрутизация в pages/, динамические и вложенные роуты, catch-all и optional catch-all, Route Groups, приоритет маршрутов, 404, useRoute, useRouter, definePageMeta и программная навигация navigateTo."
order: 2
tags: ["nuxt", "nuxt3", "vue", "routing", "vue-router", "useRoute", "useRouter", "pages", "dynamic-routes", "route-groups", "optional-catch-all"]
questions:
  - "Как Nuxt 3 превращает файлы из pages/ в маршруты и что делает index.vue"
  - "Как создать динамический роут [id] и получить параметр через useRoute"
  - "Чем отличаются [id], catch-all [...slug] и optional catch-all [[...slug]]"
  - "Как устроены вложенные маршруты и зачем нужен родительский файл с <NuxtPage />"
  - "Для чего нужны Route Groups и как имя группы доступно в middleware"
  - "Как Nuxt выбирает маршрут при конфликте (приоритет маршрутов)"
  - "Как сделать страницу 404 и валидировать параметры через definePageMeta({ validate })"
  - "В чём разница между useRoute и useRouter и как работает программная навигация navigateTo"
answers:
  - "Nuxt сканирует `pages/` и строит маршруты по именам файлов и папок: `pages/index.vue` → `/`, `pages/about.vue` → `/about`, `pages/users/[id].vue` → `/users/:id`; `index.vue` отвечает за корневой URL своей папки (`pages/users/index.vue` → `/users`), а конфигурация Vue Router генерируется автоматически."
  - "Динамический сегмент обозначается квадратными скобками: `pages/users/[id].vue` → `/users/:id`, параметр читается через `useRoute().params.id`; все параметры — строки, число нужно преобразовывать вручную, несколько сегментов задаются вложенными папками `[category]/[postId]`."
  - "`[id]` — один обязательный сегмент, `[...slug]` — catch-all на один и более сегментов, а `[[...slug]]` — optional catch-all на ноль и более: он срабатывает и для базового пути, где параметр приходит пустым (falsy) значением."
  - "Вложенные маршруты требуют родительского файла с `<NuxtPage />` (например, `pages/users.vue`), внутри которого рендерятся `pages/users/index.vue` и `pages/users/[id].vue`; без него они работают как независимые страницы."
  - "Route Groups — папка в круглых скобках, например `pages/(marketing)/about.vue` → `/about`: имя группы не попадает в URL, но доступно в `route.meta.groups`, поэтому middleware может применять логику ко всей группе."
  - "Nuxt ранжирует маршруты по специфичности: статические сегменты приоритетнее динамических `[param]`, а те — catch-all; отдельно именованный родительский `foo.vue` приоритетнее вложенного `foo/[slug].vue`."
  - "Страницу 404 делают через `pages/[...slug].vue` (или `error.vue` / `throwError`), а параметры валидируют через `definePageMeta({ validate })`: при возврате `false` показывается 404, а возврат `navigateTo` перенаправляет пользователя."
  - "`useRoute()` возвращает текущий маршрут (`path`, `params`, `query`, `name`) для чтения, а `useRouter()` — методы навигации `push`, `replace`, `back`, `forward`, `go`; для переходов предпочтителен `navigateTo`, который SSR-safe и поддерживает внешние URL и `{ replace: true }`."
---

# Файловая маршрутизация в Nuxt 3

Nuxt 3 использует **файловую маршрутизацию** (file-based routing): каждый Vue-файл в папке `pages/` автоматически становится страницей приложения. Это избавляет от ручного описания маршрутов в `router/index.ts` — структура URL повторяет структуру папок и файлов.

В этой статье разберём базовые правила роутинга, динамические и вложенные маршруты, catch-all и optional catch-all, Route Groups, приоритет маршрутов, страницу 404, composables `useRoute` и `useRouter`, `definePageMeta` и программную навигацию `navigateTo`.

## Содержание

1. [Базовая файловая маршрутизация](#базовая-файловая-маршрутизация)
2. [index.vue и корневые маршруты](#indexvue-и-корневые-маршруты)
3. [Динамические параметры [id]](#динамические-параметры-id)
4. [Вложенные маршруты](#вложенные-маршруты)
5. [Catch-all, optional catch-all и страница 404](#catch-all-optional-catch-all-и-страница-404)
6. [Route Groups](#route-groups)
7. [Приоритет маршрутов](#приоритет-маршрутов)
8. [Валидация параметров validate](#валидация-параметров-validate)
9. [useRoute и useRouter](#useroute-и-userouter)
10. [definePageMeta](#definepagemeta)
11. [Программная навигация navigateTo](#программная-навигация-navigateto)
12. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

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

## Catch-all, optional catch-all и страница 404

### Catch-all маршруты

Файл с тремя точками `[...slug]` ловит одно и более количество сегментов URL.

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

### Optional catch-all

Двойные квадратные скобки `[[...slug]]` делают catch-all необязательным: маршрут срабатывает и для базового пути, и для любого числа сегментов. Без совпавших сегментов параметр равен `undefined`.

```
pages/
├── index.vue
└── shop/
    └── [[...categories]].vue   # /shop, /shop/electronics, /shop/a/b
```

```vue
<!-- pages/shop/[[...categories]].vue -->
<template>
  <div>
    <h1 v-if="!categories">Все товары</h1>
    <h1 v-else>Фильтр: {{ categories.join(' / ') }}</h1>
  </div>
</template>

<script setup>
const route = useRoute();
const categories = route.params.categories; // пусто | строка | массив
</script>
```

| URL | `route.params.categories` |
|---|---|
| `/shop` | пусто (falsy) |
| `/shop/electronics` | `'electronics'` |
| `/shop/electronics/laptops` | `['electronics', 'laptops']` |

Ключевое отличие: `[...slug]` требует минимум один сегмент, а `[[...slug]]` охватывает и корневой путь. Для базового пути параметр приходит пустым (falsy) значением, поэтому проверяйте его через `if (!categories)`, а не через сравнение с конкретным значением. Одиночный опциональный параметр без catch-all обозначается так же, но без точек — `[[slug]]`.

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

## Route Groups

Route Groups (доступны с Nuxt 3.13) позволяют группировать страницы в папки, которые **не попадают в URL**. Папка оборачивается в круглые скобки:

```
pages/
├── index.vue              # /
├── (marketing)/
│   ├── about.vue          # /about
│   └── contact.vue        # /contact
└── (dashboard)/
    ├── settings.vue       # /settings
    └── profile.vue        # /profile
```

Приложение получит маршруты `/`, `/about`, `/contact`, `/settings`, `/profile` — имена `(marketing)` и `(dashboard)` для URL-структуры игнорируются. Это аналог Route Groups из Next.js.

### Зачем нужны

- **Организация кода**: логически близкие страницы лежат рядом, даже если их URL не вложены друг в друга.
- **Общие правила через middleware**: имя группы доступно в `route.meta.groups`, поэтому middleware может применять логику к целой группе.

```vue
<!-- pages/(admin)/users.vue -->
<script setup>
const route = useRoute();

console.log(route.meta.groups); // ['admin']
</script>
```

```ts
// middleware/admin.ts
export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.groups?.includes('admin')) {
    // проверка доступа ко всей группе (admin)
  }
});
```

Группы можно вкладывать: файл `pages/(app)/(admin)/users.vue` даст `route.meta.groups === ['app', 'admin']`.

---

## Приоритет маршрутов

Когда несколько файлов могут совпасть с одним URL, Nuxt (через Vue Router) ранжирует маршруты по специфичности пути:

1. **Статические сегменты** — наивысший приоритет.
2. **Динамические сегменты** (`[param]`).
3. **Catch-all** (`[...slug]`, `[[...slug]]`) — низший приоритет.

```
pages/
├── shop/
│   ├── new.vue            # /shop/new (статический)
│   ├── [category].vue     # /shop/electronics (динамический)
│   └── [...slug].vue      # /shop/a/b/c (catch-all)
```

Запрос `/shop/new` обслужит `new.vue`, потому что статический сегмент приоритетнее динамического `[category].vue`.

### Отдельное правило для вложенных маршрутов

Именованный родительский файл приоритетнее вложенного динамического. Для `/foo/hello` маршрут `pages/foo.vue` выигрывает у `pages/foo/[slug].vue`:

```
pages/
├── foo.vue                # /foo  → имеет приоритет для /foo/hello
└── foo/
    └── [slug].vue         # /foo/:slug
```

Чтобы `/foo` и `/foo/hello` обслуживались разными страницами, используйте пару `pages/foo/index.vue` + `pages/foo/[slug].vue`.

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
- Используйте `[[...slug]]`, когда catch-all должен покрывать и корневой путь, а не только вложенные URL.
- Группируйте страницы через `(group)/`, чтобы организовать код без раздувания URL-иерархии.
- Давайте файлам понятные имена, соответствующие URL.

### ❌ Не делайте

- Не используйте `window.location` или `history.pushState` напрямую — это ломает SSR и гидратацию.
- Не забывайте, что `route.params` всегда содержит строки, даже для числовых id.
- Не смешивайте в одной папке `users.vue` и `users/index.vue`, если ожидаете вложенные маршруты — разберитесь в приоритетах.
- Не делайте сложную бизнес-логику прямо в `validate`; лучше вынести её в composable или API.

---

## Ключевые тезисы для интервью

- **Файловая маршрутизация**: каждый файл/папка в `pages/` задаёт сегмент URL, а `index.vue` отвечает за корень папки; конфигурация Vue Router генерируется автоматически.
- Динамические `[param]` покрывают один обязательный сегмент, `[...slug]` — один и более, `[[...slug]]` — ноль и более (optional catch-all); все параметры приходят строками.
- Вложенные маршруты требуют родительского файла с `<NuxtPage />`, иначе дочерние страницы работают независимо.
- **Route Groups** `(group)/` группируют страницы без влияния на URL, а имя группы доступно в `route.meta.groups`.
- **Приоритет маршрутов**: статические > динамические `[param]` > catch-all; именованный родитель `foo.vue` приоритетнее вложенного `foo/[slug].vue`.
- `useRoute` читает текущий маршрут, `useRouter` управляет навигацией, `navigateTo` — SSR-safe переход; `definePageMeta` задаёт мета-данные (layout, middleware, validate).
- `validate` в `definePageMeta` проверяет параметры (иначе 404 или редирект через `navigateTo`); страницу 404 делают через `[...slug].vue` или `error.vue`.

---

## Заключение

Файловая маршрутизация — одно из главных преимуществ Nuxt 3. Она ускоряет разработку, делает структуру проекта предсказуемой и сразу отражает URL-поверхность приложения. Зная правила именования файлов, динамические параметры, вложенные маршруты, catch-all и optional catch-all, Route Groups, приоритет маршрутов, `useRoute`, `useRouter`, `definePageMeta` и `navigateTo`, можно уверенно строить навигацию в Nuxt-приложениях любой сложности.

Следующие статьи раздела продолжат погружение: режимы рендеринга, composables Nuxt, жизненный цикл приложения, серверная часть Nitro, data fetching и работа с состоянием.

---

## Полезные ссылки

- [Nuxt 3 Routing](https://nuxt.com/docs/getting-started/routing) — официальная документация по роутингу
- [Vue Router](https://router.vuejs.org/) — документация базового роутера
- [Nuxt Pages](https://nuxt.com/docs/guide/directory-structure/pages) — структура папки pages, динамические и catch-all маршруты, Route Groups
- [Nuxt 3.13 — Route Groups](https://nuxt.com/blog/v3-13) — релиз, где появились группы маршрутов
- [definePageMeta](https://nuxt.com/docs/api/utils/define-page-meta) — мета-данные страницы
- [navigateTo](https://nuxt.com/docs/api/utils/navigate-to) — программная навигация
