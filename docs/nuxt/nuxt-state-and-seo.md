---
title: "Состояние и SEO в Nuxt 3: useState, Pinia, useHead и Open Graph"
section: nuxt
description: "Управление состоянием и SEO в Nuxt 3: useState, Pinia, useHead, useSeoMeta, meta-теги, Open Graph, SSR-сериализация и лучшие практики."
order: 8
tags: ["nuxt", "nuxt3", "vue", "useState", "pinia", "useHead", "useSeoMeta", "seo", "open-graph"]
questions:
  - "Чем `useState` отличается от `ref` и когда его использовать"
  - "Как Pinia интегрируется в Nuxt 3"
  - "Как управлять `<head>` документа через `useHead` и `useSeoMeta`"
  - "Что такое `definePageMeta` и зачем он нужен"
  - "Какие Open Graph и Twitter Card теги важны для социальных превью"
  - "Как задать глобальные meta-теги в `nuxt.config.ts`"
  - "Как SEO связано с режимом рендеринга в Nuxt"
  - "Как избежать дублирования и конфликтов meta-тегов"
  - "Когда выбирать `useState`, а когда Pinia"
  - "Как работает SSR-сериализация состояния в Nuxt"
---

# Состояние и SEO в Nuxt 3: useState, Pinia, useHead и Open Graph

Любое приложение нуждается в управлении состоянием и в правильном отображении в поисковиках и социальных сетях. Nuxt 3 предоставляет для этого несколько инструментов: `useState` для разделяемого SSR-safe состояния, Pinia для сложного клиентского стейта, а `useHead`, `useSeoMeta` и `definePageMeta` — для управления `<head>` страницы.

В этой статье разберёмся, как выбирать между `useState` и Pinia, как настраивать SEO и Open Graph, как задавать meta-теги глобально и на уровне страницы, а также как режим рендеринга влияет на индексацию.

## Содержание

1. [useState для разделяемого состояния](#usestate-для-разделяемого-состояния)
2. [Pinia в Nuxt 3](#pinia-в-nuxt-3)
3. [useHead](#usehead)
4. [useSeoMeta](#useseometa)
5. [definePageMeta](#definepagemeta)
6. [Open Graph и Twitter Card](#open-graph-и-twitter-card)
7. [Глобальные meta-теги в `nuxt.config.ts`](#глобальные-meta-теги-в-nuxtconfigts)
8. [SEO и режимы рендеринга](#seo-и-режимы-рендеринга)
9. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
10. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
11. [Заключение](#заключение)
12. [Полезные ссылки](#полезные-ссылки)

---

## useState для разделяемого состояния

`useState` — это встроенный composable Nuxt 3 для хранения разделяемого состояния, которое корректно работает при SSR. В отличие от обычного `ref`, `useState` требует уникальный ключ и сохраняет значение между сервером и клиентом в процессе гидратации.

### Базовый пример

```ts
// composables/useSidebar.ts
export function useSidebar() {
  return useState('sidebar.open', () => false);
}
```

```vue
<!-- components/AppSidebar.vue -->
<script setup>
const isOpen = useSidebar();

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>
```

Все вызовы `useState('sidebar.open')` в пределах одного приложения возвращают одну и ту же реактивную ссылку.

### useState vs ref

| | `useState` | `ref` |
|---|---|---|
| Ключ | Обязателен | Нет |
| Разделяемое состояние | Да, при одинаковом ключе | Нет |
| SSR-safe | Да, сериализуется в payload | Нет |
| Применение | Глобальное/разделяемое состояние | Локальное состояние компонента |

### SSR-сериализация

При SSR значение `useState` попадает в глобальный объект `__NUXT__` в HTML. Клиент использует это значение при гидратации, поэтому состояние не инициализируется дважды.

```ts
// composables/useCart.ts
export interface CartItem {
  id: number;
  name: string;
  price: number;
}

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

### Когда использовать useState

- Разделяемое UI-состояние: sidebar, модалки, тема.
- Простое глобальное состояние, которое должно пережить гидратацию.
- Данные, не требующие сложной логики, actions и DevTools.

### Ограничения

- `useState` не заменяет полноценный стейт-менеджер.
- Нет встроенных actions, геттеров, плагинов и DevTools.
- Для сложных сценариев лучше использовать Pinia.

---

## Pinia в Nuxt 3

Pinia — официальная библиотека управления состоянием для Vue 3. В Nuxt 3 она подключается через модуль `@pinia/nuxt`, который автоматически регистрирует Pinia и добавляет удобные интеграции.

### Установка и настройка

```bash
npm install @pinia/nuxt pinia
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
});
```

Модуль `@pinia/nuxt` автоматически:

- Создаёт и подключает экземпляр Pinia к приложению.
- Автоимпортирует `defineStore`, `storeToRefs`, `acceptHMRUpdate`.
- Автоимпортирует сторы из папки `stores/`.
- Сериализует состояние Pinia при SSR и восстанавливает его на клиенте.

### Базовый стор

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),

  getters: {
    totalItems: (state) => state.items.length,
    totalPrice: (state) =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    addItem(product: CartItem) {
      const existing = this.items.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }
    },

    removeItem(productId: number) {
      this.items = this.items.filter((i) => i.id !== productId);
    },
  },
});
```

```vue
<!-- pages/cart.vue -->
<script setup>
const cart = useCartStore();
const { items, totalPrice } = storeToRefs(cart);
</script>
```

### Pinia vs useState

| | `useState` | Pinia |
|---|---|---|
| Сложность | Простое разделяемое состояние | Полноценный стейт-менеджер |
| Actions / getters | Нет | Да |
| Плагины / DevTools | Нет | Да |
| SSR | Сериализуется автоматически | Сериализуется через `@pinia/nuxt` |
| Когда использовать | Sidebar, тема, простые флаги | Корзина, аутентификация, сложный UI |

Для глубокого изучения Pinia смотрите [отдельную статью](../state-management/pinia.md).

---

## useHead

`useHead` — composable для управления содержимым `<head>` документа. Он принимает объект с полями `title`, `meta`, `link`, `script`, `style`, `htmlAttrs`, `bodyAttrs` и поддерживает реактивные значения.

### Базовый пример

```vue
<script setup>
useHead({
  title: 'Профиль пользователя',
  meta: [
    { name: 'description', content: 'Страница профиля пользователя' },
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/profile' },
  ],
});
</script>
```

### Реактивные значения

Чтобы meta-теги зависели от реактивных данных, передайте функцию:

```vue
<script setup>
const title = ref('Главная страница');

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: `Страница: ${title.value}` },
  ],
}));
</script>
```

### Поддерживаемые поля

| Поле | Назначение |
|---|---|
| `title` | Заголовок страницы |
| `titleTemplate` | Шаблон заголовка, `%s` — заголовок страницы |
| `meta` | Мета-теги |
| `link` | Ссылки: canonical, preload, stylesheet |
| `script` | Скрипты |
| `style` | Встроенные стили |
| `htmlAttrs` | Атрибуты `<html>` |
| `bodyAttrs` | Атрибуты `<body>` |
| `noscript` | Содержимое `<noscript>` |

### Уникальность meta-тегов

Nuxt/Unhead автоматически дедуплицирует теги по `name`, `property` или `charset`. Чтобы принудительно обновить тег с тем же ключом, можно использовать `key`:

```ts
useHead({
  meta: [
    { name: 'description', content: 'Описание', key: 'description' },
  ],
});
```

---

## useSeoMeta

`useSeoMeta` — удобный обёртка над `useHead` для SEO и Open Graph. Она предоставляет TypeScript-подсказки, автоматически генерирует нужные `meta`-теги и защищает от опечаток.

### Базовый пример

```vue
<script setup>
useSeoMeta({
  title: 'Мой блог',
  description: 'Статьи о фронтенде и Nuxt',
  ogTitle: 'Мой блог',
  ogDescription: 'Статьи о фронтенде и Nuxt',
  ogImage: 'https://example.com/cover.jpg',
  ogUrl: 'https://example.com/blog',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Мой блог',
  twitterDescription: 'Статьи о фронтенде и Nuxt',
  twitterImage: 'https://example.com/cover.jpg',
});
</script>
```

Этот код автоматически создаст:

```html
<title>Мой блог</title>
<meta name="description" content="Статьи о фронтенде и Nuxt">
<meta property="og:title" content="Мой блог">
<meta property="og:description" content="Статьи о фронтенде и Nuxt">
<meta property="og:image" content="https://example.com/cover.jpg">
<meta property="og:url" content="https://example.com/blog">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Мой блог">
<meta name="twitter:description" content="Статьи о фронтенде и Nuxt">
<meta name="twitter:image" content="https://example.com/cover.jpg">
```

### Реактивные SEO-мета

```vue
<script setup>
const post = await useFetch('/api/posts/1');

useSeoMeta(() => ({
  title: post.data.value?.title,
  description: post.data.value?.excerpt,
  ogTitle: post.data.value?.title,
  ogImage: post.data.value?.coverImage,
}));
</script>
```

### Когда использовать useSeoMeta

- Любые страницы, которые должны индексироваться.
- Страницы с динамическим контентом: посты, товары, профили.
- Когда важны социальные превью и Open Graph.

---

## definePageMeta

`definePageMeta` — макрос для задания мета-информации страницы. Работает только в файлах `pages/`. Через него обычно настраивают layout, middleware, alias и другие параметры маршрута.

```vue
<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});
</script>
```

### Частые поля

| Поле | Назначение |
|---|---|
| `layout` | Имя макета из `layouts/` |
| `middleware` | Route middleware |
| `alias` | Альтернативный путь к странице |
| `name` | Имя маршрута |
| `keepalive` | Настройки `<KeepAlive>` |
| `title` | Заголовок страницы (используется модулями SEO) |

`definePageMeta` не управляет `<head>` напрямую, но многие SEO-модули читают его поля, например `title`, для генерации meta-тегов.

---

## Open Graph и Twitter Card

Open Graph — протокол разметки страниц для социальных сетей (Facebook, LinkedIn, Telegram, Discord). Twitter Card — аналогичный протокол для Twitter/X. Хотя Twitter понимает `og:*`, явные `twitter:*` теги дают лучший контроль.

### Основные Open Graph теги

| Тег | Назначение |
|---|---|
| `og:title` | Заголовок для соцсетей |
| `og:description` | Описание |
| `og:image` | URL изображения превью |
| `og:url` | Канонический URL страницы |
| `og:type` | Тип страницы: `website`, `article` |
| `og:site_name` | Название сайта |
| `og:locale` | Локаль: `ru_RU`, `en_US` |

### Основные Twitter Card теги

| Тег | Назначение |
|---|---|
| `twitter:card` | Тип карточки: `summary`, `summary_large_image` |
| `twitter:title` | Заголовок |
| `twitter:description` | Описание |
| `twitter:image` | Изображение |
| `twitter:site` | Аккаунт сайта |
| `twitter:creator` | Автор контента |

### Пример настройки превью

```vue
<script setup>
useSeoMeta({
  title: 'Как работает Nuxt 3',
  description: 'Разбираем SSR, SSG и гидратацию в Nuxt 3',
  ogTitle: 'Как работает Nuxt 3',
  ogDescription: 'Разбираем SSR, SSG и гидратацию в Nuxt 3',
  ogImage: 'https://example.com/nuxt-og.png',
  ogType: 'article',
  twitterCard: 'summary_large_image',
});
</script>
```

### Проверка превью

Для проверки Open Graph и Twitter Card используйте:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

---

## Глобальные meta-теги в `nuxt.config.ts`

Для значений по умолчанию на всех страницах используйте `app.head` в `nuxt.config.ts`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s — My Nuxt App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Мой сайт на Nuxt 3' },
        { property: 'og:site_name', content: 'My Nuxt App' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
});
```

### titleTemplate

`%s` заменяется на `title` текущей страницы:

```ts
// nuxt.config.ts
app: {
  head: {
    titleTemplate: '%s — My Nuxt App',
  },
}
```

```vue
<!-- pages/about.vue -->
<script setup>
useHead({ title: 'О нас' });
</script>
```

Результат: `<title>О нас — My Nuxt App</title>`.

### Переопределение на уровне страницы

`useHead` и `useSeoMeta` на странице переопределяют глобальные значения. Если несколько компонентов задают один и тот же тег, побеждает последний по порядку рендера, но Nuxt дедуплицирует по ключам.

---

## SEO и режимы рендеринга

Качество SEO напрямую зависит от того, как рендерится HTML. При SSR и SSG поисковые боты и социальные краулеры получают готовый HTML с заполненными meta-тегами. При чистом CSR HTML изначально пуст, и не все боты выполняют JavaScript.

### Как рендеринг влияет на SEO

| Режим | HTML при первом запросе | SEO |
|---|---|---|
| SSR | Полный | Отлично |
| SSG | Полный | Отлично |
| ISR | Полный из кэша | Хорошо |
| CSR | Пустой или минимальный | Плохо |

### Важные правила

- `useHead` и `useSeoMeta` должны вызываться в `<script setup>` до или во время рендера, а не в обработчиках событий.
- Данные для meta-тегов должны загружаться через `useFetch` / `useAsyncData`, чтобы попасть в серверный HTML.
- Динамические маршруты с важным SEO-контентом должны быть доступны при `nuxi generate` или рендериться на сервере.

### SSR-safe данные для SEO

```vue
<script setup>
const route = useRoute();

const { data: post } = await useFetch(`/api/posts/${route.params.slug}`);

useSeoMeta(() => ({
  title: post.value?.title,
  description: post.value?.description,
  ogTitle: post.value?.title,
  ogImage: post.value?.image,
}));
</script>
```

Такой код выполняется на сервере при SSR, и бот получает корректные meta-теги сразу в HTML.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте `useState` для простого разделяемого состояния, а Pinia — для сложного клиентского.
- Задавайте уникальные ключи в `useState`, чтобы избежать коллизий.
- Используйте `useSeoMeta` вместо ручного `useHead({ meta: [...] })` для SEO.
- Задавайте глобальные meta-теги и `titleTemplate` в `nuxt.config.ts`.
- Делайте SEO-мета реактивными через функцию, если данные приходят из API.
- Генерируйте `og:url` и `canonical` для каждой страницы.
- Проверяйте социальные превью через официальные отладчики.
- Тестируйте production-сборку: именно в ней виден финальный HTML.

### ❌ Не делайте

- Не используйте `useState` для больших или сложных данных — это не замена Pinia.
- Не инициализируйте `useState` значениями из `localStorage` или `window` — это вызовет hydration mismatch.
- Не задавайте `description` и `og:description` статично, если контент динамический.
- Не используйте `useHead` в обработчиках событий — meta-теги не попадут в SSR-HTML.
- Не оставляйте страницы без `title` и `description`.
- Не полагайтесь на CSR для страниц, которые должны индексироваться.

---

## Ключевые тезисы для интервью

- **`useState`** — SSR-safe разделяемое состояние с уникальным ключом; отличается от `ref` тем, что сериализуется в payload и разделяется между компонентами.
- **Pinia в Nuxt 3** подключается через `@pinia/nuxt`, автоматически импортирует сторы и сериализует состояние при SSR.
- **`useState`** подходит для простого UI-состояния, **Pinia** — для сложного клиентского стейта: корзина, аутентификация, настройки.
- **`useHead`** управляет `<head>` документа и поддерживает реактивные значения через функцию.
- **`useSeoMeta`** — удобный composable для SEO и Open Graph с TypeScript-подсказками и автоматической генерацией `meta`-тегов.
- **`definePageMeta`** задаёт мета-информацию страницы: layout, middleware, title; работает только в `pages/`.
- **Open Graph** теги (`og:*`) нужны для социальных превью, **Twitter Card** (`twitter:*`) — для Twitter/X.
- Глобальные meta-теги и `titleTemplate` задаются в `app.head` в `nuxt.config.ts`.
- SEO эффективно только при SSR или SSG; CSR-страницы плохо индексируются.
- Данные для SEO должны загружаться через `useFetch` / `useAsyncData`, чтобы попасть в серверный HTML.

---

## Заключение

Управление состоянием и SEO — две стороны одной медали в full-stack фреймворке. Nuxt 3 даёт удобные инструменты для каждой задачи: `useState` для лёгкого SSR-safe стейта, Pinia для сложного клиентского управления, `useHead` и `useSeoMeta` для meta-тегов, а `definePageMeta` — для мета-информации страницы.

Правильный выбор между `useState` и Pinia, понимание SSR-сериализации и умение настраивать Open Graph позволяют строить быстрые и хорошо индексируемые приложения. Помните: красивый превью и правильные meta-теги работают только тогда, когда сервер отдаёт их в первоначальном HTML.

Попробуйте настроить `app.head` в `nuxt.config.ts`, добавьте `useSeoMeta` на несколько страниц и проверьте результат через отладчики социальных сетей.

---

## Полезные ссылки

- [Nuxt 3 State Management](https://nuxt.com/docs/getting-started/state-management) — официальное руководство по управлению состоянием
- [Pinia Nuxt Module](https://pinia.vuejs.org/ssr/nuxt.html) — интеграция Pinia в Nuxt
- [useHead](https://nuxt.com/docs/api/composables/use-head) — документация useHead
- [useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta) — документация useSeoMeta
- [definePageMeta](https://nuxt.com/docs/api/utils/define-page-meta) — документация definePageMeta
- [Unhead](https://unhead.unjs.io/) — движок управления head, лежащий в основе Nuxt
- [Open Graph Protocol](https://ogp.me/) — спецификация Open Graph
