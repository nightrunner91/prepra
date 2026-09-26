---
title: "Основы Nuxt 3: проект, структура, конфигурация и отличия от Vue SPA"
section: nuxt
description: "Фундамент Nuxt 3 для подготовки к собеседованиям: создание проекта, структура папок, nuxt.config.ts, dev/prod окружения, auto-imports, рендеринг и ключевые отличия от обычного Vue SPA."
order: 1
tags: ["nuxt", "nuxt3", "vue", "ssr", "ssg", "csr", "configuration", "project-structure", "auto-imports"]
questions:
  - "Что такое Nuxt 3 и зачем он нужен поверх Vue 3"
  - "Как создать проект на Nuxt 3 и из каких папок он состоит"
  - "Что конфигурируется в nuxt.config.ts"
  - "Как Nuxt отличается от обычного Vue SPA"
  - "Что такое auto-imports и какие сущности импортируются автоматически"
  - "Какие режимы рендеринга поддерживает Nuxt 3"
  - "Как запустить dev-сервер и собрать production-сборку"
  - "Что такое Nitro и какова его роль в Nuxt 3"
---

# Основы Nuxt 3: проект, структура, конфигурация и отличия от Vue SPA

Nuxt 3 — это full-stack фреймворк на базе Vue 3, который берёт на себя инфраструктуру вокруг приложения: роутинг, серверный рендеринг, сборку, деплой, auto-imports, meta-теги, data fetching и серверную часть. В то время как Vue 3 — это библиотека для UI, Nuxt 3 — это уже полноценная платформа для создания production-приложений.

Эта статья — фундамент раздела `docs/nuxt/`. Мы разберём, как создать проект, как устроены папки, что настраивается в `nuxt.config.ts`, какие режимы рендеринга доступны из коробки и чем Nuxt отличается от обычного Vue SPA. Понимание этих основ необходимо, прежде чем переходить к маршрутизации, data fetching, Nitro, слоям и модулям.

## Содержание

1. [Что такое Nuxt 3](#что-такое-nuxt-3)
2. [Создание проекта](#создание-проекта)
3. [Структура папок](#структура-папок)
4. [Конфигурация `nuxt.config.ts`](#конфигурация-nuxtconfigts)
5. [Dev и production окружения](#dev-и-production-окружения)
6. [Auto-imports](#auto-imports)
7. [Режимы рендеринга](#режимы-рендеринга)
8. [Nitro — серверная часть](#nitro--серверная-часть)
9. [Отличия от Vue SPA](#отличия-от-vue-spa)
10. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)
13. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Nuxt 3

Nuxt 3 — это фреймворк, построенный поверх Vue 3, Vite и Nitro. Он добавляет к Vue 3:

- **Файловую маршрутизацию** — страницы автоматически создаются из файлов в `pages/`.
- **SSR и SSG из коробки** — без ручной настройки Webpack или Vite.
- **Серверную часть Nitro** — обработчики API, middleware, кэширование, пресеты деплоя.
- **Auto-imports** — компоненты, composables, вспомогательные функции и API Vue доступны без явных `import`.
- **Data fetching** — `useFetch`, `useAsyncData`, `$fetch` с учётом SSR и гидратации.
- **SEO и meta-теги** — `useHead`, `useSeoMeta`, `definePageMeta`.
- **Модули и слои** — расширяемая экосистема для интеграции с Tailwind, Content, Image и другими инструментами.

Nuxt позиционируется как "the intuitive Vue framework". Он убирает boilerplate, который обычно пишется вручную при создании Vue SPA: настройку роутера, конфигурацию SSR, организацию API, подключение TypeScript, ESLint и тестов.

### Краткая история

- **Nuxt 2** — построен на Vue 2, Webpack и собственном серверном рендеринге.
- **Nuxt Bridge** — переходный слой для миграции Nuxt 2-проектов на современный инструментарий.
- **Nuxt 3** — полностью переписан на Vue 3, Vite по умолчанию, Nitro в качестве серверного движка.

---

## Создание проекта

### Официальный способ

Nuxt предоставляет scaffolding-инструмент, основанный на `nuxi`:

```bash
# Создать проект
npx nuxi@latest init my-nuxt-app

# Перейти в директорию
cd my-nuxt-app

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

`nuxi` — это CLI-утилита Nuxt 3. Она отвечает за создание проекта, генерацию файлов, запуск dev-сервера, сборку, типизацию и анализ бандла.

### Использование pnpm или yarn

```bash
pnpm dlx nuxi@latest init my-nuxt-app
cd my-nuxt-app
pnpm install
pnpm dev
```

### Что входит в стартовый шаблон

- Vue 3 с Composition API и `<script setup>`.
- Vite как dev-сервер и сборщик (Nuxt 2 использовал Webpack).
- TypeScript из коробки.
- `app.vue` — корневой компонент приложения.
- `nuxt.config.ts` — центральный файл конфигурации.
- `tsconfig.json`, `.gitignore`, `package.json`.

---

## Структура папок

Nuxt использует **соглашение по конфигурации** (convention over configuration). Название папки определяет поведение. Вот ключевые директории:

```
my-nuxt-app/
├── .nuxt/                  # Сгенерированные файлы (не коммитить)
├── .output/                # Результат production-сборки
├── app.vue                 # Корневой компонент приложения
├── nuxt.config.ts          # Конфигурация
├── package.json
├── tsconfig.json
├── components/             # Автоимпортируемые компоненты
├── composables/            # Автоимпортируемые composables
├── layouts/                # Макеты страниц
├── middleware/             # Route middleware
├── pages/                  # Файловая маршрутизация
├── plugins/                # Плагины Nuxt
├── public/                 # Статические файлы
├── server/                 # Серверная часть Nitro
│   ├── api/                # API-роуты
│   ├── routes/             # Серверные роуты
│   └── middleware/         # Серверные middleware
└── utils/                  # Автоимпортируемые утилиты
```

### `app.vue`

Корневой компонент. Если в проекте есть папка `pages/`, обычно используется `<NuxtPage />`:

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

Если папки `pages/` нет, `app.vue` рендерит единственную страницу напрямую.

### `pages/`

Каждый файл в `pages/` становится маршрутом:

```
pages/
├── index.vue       # /
├── about.vue       # /about
└── users/
    ├── [id].vue    # /users/:id
    └── index.vue   # /users
```

Это отличается от Vue SPA, где маршруты обычно описываются вручную в `src/router/index.ts`.

### `components/`

Компоненты из этой папки автоматически импортируются в шаблоны. Например, `components/BaseButton.vue` доступен как `<BaseButton />` без `import`.

### `composables/`

Пользовательские composables автоматически доступны во всех компонентах. Файл `composables/useCounter.ts` становится доступен как `useCounter()`.

### `layouts/`

Макеты страниц. Файл `layouts/default.vue` используется по умолчанию:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <slot />
    <AppFooter />
  </div>
</template>
```

### `server/`

Серверная часть на Nitro. Файлы в `server/api/` становятся API-эндпоинтами, а `server/middleware/` — серверными middleware.

---

## Конфигурация `nuxt.config.ts`

`nuxt.config.ts` — центральное место настройки приложения. Это TypeScript-файл, экспортирующий конфигурацию по умолчанию.

### Базовый пример

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // Включить TypeScript strict mode
  typescript: {
    strict: true,
  },

  // Модули Nuxt
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
  ],

  // CSS, подключаемый глобально
  css: ['~/assets/css/main.css'],

  // Runtime config — доступен на сервере и клиенте
  runtimeConfig: {
    apiSecret: '', // только сервер
    public: {
      apiBase: '/api', // доступен и на клиенте
    },
  },

  // Настройки приложения
  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { name: 'description', content: 'Nuxt 3 application' },
      ],
    },
  },

  // Dev-сервер
  devtools: { enabled: true },
});
```

### Основные поля конфигурации

| Поле | Назначение |
|---|---|
| `modules` | Подключение Nuxt-модулей. |
| `css` | Глобальные CSS-файлы. |
| `runtimeConfig` | Конфигурация времени выполнения, разделённая на серверную и публичную части. |
| `app.head` | Глобальные meta-теги и заголовок страницы. |
| `app.baseURL` | Базовый URL приложения. |
| `nitro` | Настройки Nitro: пресеты, маршруты, кэширование. |
| `routeRules` | Правила для отдельных маршрутов: SSR, SSG, кэш, редиректы. |
| `ssr` | Глобальное включение/выключение SSR (`true` по умолчанию). |
| `devtools` | Включение Nuxt DevTools. |
| `typescript` | Настройки TypeScript. |
| `imports` | Настройка auto-imports: директории, префиксы, отключение. |

### `runtimeConfig` vs `app.config`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: process.env.API_SECRET, // только сервер
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
});
```

```ts
// app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#42b883',
  },
});
```

**Различия:**

- `runtimeConfig` — для секретов и переменных окружения. Серверная часть недоступна на клиенте. Публичная часть доступна везде.
- `app.config` — для публичной конфигурации приложения, не зависящей от окружения.

---

## Dev и production окружения

### Dev-сервер

```bash
npm run dev
```

По умолчанию Nuxt запускает Vite dev-сервер на `http://localhost:3000`. Поддерживает HMR (hot module replacement), TypeScript, source maps и Nuxt DevTools.

### Production-сборка

```bash
npm run build
```

Результат попадает в `.output/`. Внутри находятся:

- `.output/public/` — статические ассеты.
- `.output/server/` — сервер Nitro для SSR/SSR-хостинга.
- `.output/nitro.json` — манифест Nitro.

### Запуск production-сборки локально

```bash
npm run build
node .output/server/index.mjs
```

### Генерация статического сайта (SSG)

```bash
npm run generate
```

Команда `nuxi generate` предварительно рендерит страницы и создаёт статические HTML-файлы в `.output/public/`. Подходит для сайтов, где контент не меняется на каждый запрос.

### Полезные команды nuxi

```bash
npx nuxi dev          # Запуск dev-сервера
npx nuxi build        # Production-сборка
npx nuxi generate     # Статическая генерация
npx nuxi preview      # Предпросмотр production-сборки
npx nuxi typecheck    # Проверка типов TypeScript
npx nuxi analyze      # Анализ размера бандла
```

### Переменные окружения

Nuxt автоматически подхватывает переменные окружения и кладёт их в `runtimeConfig`:

```bash
# .env
API_SECRET=super-secret
NUXT_PUBLIC_API_BASE=https://api.example.com
```

```ts
// В коде
const config = useRuntimeConfig();
console.log(config.apiSecret);        // сервер
console.log(config.public.apiBase);   // клиент и сервер
```

Переменные с префиксом `NUXT_PUBLIC_` попадают в публичную часть `runtimeConfig` и доступны на клиенте.

---

## Auto-imports

Одна из ключевых особенностей Nuxt 3 — автоматический импорт. Это касается:

- **API Vue 3:** `ref`, `reactive`, `computed`, `watch`, `onMounted` и другие.
- **Встроенных composables Nuxt:** `useFetch`, `useAsyncData`, `useState`, `useRoute`, `useRouter`, `useHead`, `useRuntimeConfig`.
- **Компонентов из `components/`.**
- **Composables из `composables/`.**
- **Утилит из `utils/`.**
- **Встроенных компонентов Nuxt:** `<NuxtPage />`, `<NuxtLayout />`, `<NuxtLink />`, `<ClientOnly />`.

### Пример без явных импортов

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <CounterButton />
  </div>
</template>

<script setup>
// ref, onMounted и компонент CounterButton импортируются автоматически
const title = ref('Hello Nuxt');

onMounted(() => {
  console.log('Page mounted');
});
</script>
```

### Как отключить auto-imports

Если нужно явно контролировать импорты:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    autoImport: false,
  },
});
```

### Пользовательские composables

```ts
// composables/useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial);
  const increment = () => count.value++;
  const decrement = () => count.value--;

  return { count, increment, decrement };
}
```

```vue
<!-- pages/index.vue -->
<script setup>
const { count, increment } = useCounter(10);
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

Auto-imports экономят время, но важно понимать, откуда берётся тот или иной символ, чтобы избежать конфликтов имён.

---

## Режимы рендеринга

Nuxt 3 поддерживает несколько стратегий рендеринга, которые можно комбинировать на уровне маршрутов.

### SSR (Server-Side Rendering)

По умолчанию Nuxt рендерит HTML на сервере для каждого запроса. Это улучшает SEO, первоначальную загрузку и работу с социальными сетями.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
});
```

### CSR (Client-Side Rendering)

Если SSR не нужен, его можно отключить глобально:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
});
```

При `ssr: false` приложение работает как обычное Vue SPA: HTML приходит пустым, а рендеринг происходит в браузере.

### SSG (Static Site Generation)

```bash
npx nuxi generate
```

Страницы рендерятся во время сборки. Подходит для документации, блогов, лендингов.

### ISR (Incremental Static Regeneration)

ISR позволяет кэшировать статически сгенерированные страницы и обновлять их в фоне:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/blog/**': { isr: 60 }, // кэш на 60 секунд
  },
});
```

### Гибридный рендеринг через `routeRules`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },              // SSG для главной
    '/admin/**': { ssr: false },           // CSR для админки
    '/api/**': { cors: true },             // CORS для API
    '/blog/**': { isr: 60 },               // ISR
    '/products/**': { swr: 60 },           // stale-while-revalidate
  },
});
```

| Режим | Когда рендерится | Где выполняется |
|---|---|---|
| SSR | На каждый запрос | Сервер |
| SSG | Во время сборки | Сборщик |
| CSR | В браузере | Клиент |
| ISR | При первом запросе + фоновое обновление | Сервер/сборщик |
| SWR | Кэш + фоновое обновление | Сервер |

---

## Nitro — серверная часть

Nitro — это серверный движок Nuxt 3. Он отвечает за:

- Запуск dev-сервера.
- Сборку production-сервера.
- API-роуты и серверные middleware.
- Кэширование и пресеты деплоя.
- Универсальную поддержку хостингов: Node, Vercel, Netlify, Cloudflare Workers, Deno и другие.

### API-роуты

Любой файл в `server/api/` становится API-эндпоинтом:

```ts
// server/api/hello.get.ts
export default defineEventHandler((event) => {
  return {
    message: 'Hello from Nitro!',
  };
});
```

Доступен по адресу `/api/hello`.

### Серверные middleware

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${event.method} ${event.path}`);
});
```

Выполняется для каждого серверного запроса.

### Пресеты деплоя

```bash
NITRO_PRESET=vercel npx nuxi build
NITRO_PRESET=netlify npx nuxi build
NITRO_PRESET=cloudflare-pages npx nuxi build
```

Nitro генерирует output, оптимизированный под конкретную платформу.

---

## Отличия от Vue SPA

| Аспект | Vue SPA | Nuxt 3 |
|---|---|---|
| **Роутинг** | Ручная настройка Vue Router | Файловая маршрутизация в `pages/` |
| **SSR** | Нужно настраивать вручную | Включён по умолчанию |
| **SSG** | Требует дополнительных инструментов | `nuxi generate` из коробки |
| **Сервер** | Отдельный бэкенд | Nitro: `server/api/`, `server/middleware/` |
| **Импорты** | Явные `import` | Auto-imports компонентов и composables |
| **Data fetching** | `fetch`/`axios` в `onMounted` | `useFetch`, `useAsyncData`, SSR-safe fetching |
| **Meta-теги** | Ручное управление через `vue-meta` или плагины | `useHead`, `useSeoMeta`, `definePageMeta` |
| **Сборщик** | Vite/Webpack настраивается отдельно | Vite встроен и настроен |
| **Деплой** | Статические файлы + отдельный сервер для SSR | Универсальные пресеты Nitro |
| **Жизненный цикл** | Vue-компоненты + роутер | Плагины, middleware, hooks, app lifecycle |

### Когда выбирать Vue SPA

- Простое приложение без SEO.
- Полностью динамический контент, который не нужно индексировать.
- Команда хочет максимальной гибкости и сама настраивает инфраструктуру.
- Встраивание Vue в существующий проект или страницу.

### Когда выбирать Nuxt 3

- Нужен SSR или SSG.
- Приложение требует SEO, Open Graph, социальных превью.
- Хочется файловую маршрутизацию и меньше boilerplate.
- Нужна серверная часть для API, middleware, SSR-данных.
- Важна простота деплоя на различные платформы.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте `runtimeConfig` для секретов и переменных окружения, а `app.config` — для публичной конфигурации.
- Разделяйте логику в composables, начиная с роста компонента.
- Используйте `routeRules` для гибкого управления рендерингом.
- Применяйте `useFetch`/`useAsyncData` вместо прямого `fetch` для SSR-safe загрузки данных.
- Храните серверную логику в `server/`, а не в composables или компонентах.
- Включайте `typescript.strict: true` для лучшей типизации.
- Используйте Nuxt DevTools для отладки.

### ❌ Не делайте

- Не кладите секреты в `app.config` или публичную часть `runtimeConfig`.
- Не используйте `window` или `document` в коде, выполняемом на сервере, без проверки `process.client`.
- Не забывайте, что `useFetch` на сервере и клиенте ведёт себя по-разному при гидратации.
- Не смешивайте бизнес-логику API и UI в одном месте.
- Не коммитьте папки `.nuxt/` и `.output/` — они генерируются автоматически.

---

## Ключевые тезисы для интервью

- **Nuxt 3** — full-stack фреймворк на базе Vue 3, Vite и Nitro. Добавляет файловую маршрутизацию, SSR/SSG, серверную часть, auto-imports и data fetching.
- **Проект создаётся через `npx nuxi@latest init`**, dev-сервер запускается через `npm run dev`, production-сборка — через `npm run build`.
- **Ключевые папки:** `pages/` (роуты), `components/` (компоненты), `composables/` (логика), `layouts/` (макеты), `server/` (Nitro API и middleware), `public/` (статика).
- **`nuxt.config.ts`** — центральный файл конфигурации: модули, CSS, runtime config, app head, nitro, route rules, TypeScript.
- **`runtimeConfig`** хранит секреты сервера и публичные переменные окружения; **`app.config`** — публичную конфигурацию приложения.
- **Auto-imports** работают для Vue API, Nuxt composables, компонентов из `components/` и `composables/` — явные импорты не нужны.
- **Режимы рендеринга:** SSR (по умолчанию), CSR (`ssr: false`), SSG (`nuxi generate`), ISR и SWR через `routeRules`.
- **Nitro** — серверный движок Nuxt 3, отвечает за API-роуты, middleware, кэширование и пресеты деплоя.
- **Nuxt vs Vue SPA:** Nuxt даёт готовую инфраструктуру, SSR/SSG, файловый роутинг и сервер; Vue SPA требует ручной настройки этих вещей.

---

## Заключение

Nuxt 3 значительно упрощает создание production-приложений на Vue 3, беря на себя рутинную инфраструктуру. В этой статье мы разобрали создание проекта, структуру папок, конфигурацию `nuxt.config.ts`, dev/prod окружения, auto-imports, режимы рендеринга и роль Nitro. Это база, без которой невозможно уверенно двигаться к файловой маршрутизации, data fetching, серверной части, слоям и модулям.

Следующие статьи раздела продолжат погружение в Nuxt: файловую маршрутизацию, режимы рендеринга, composables, жизненный цикл приложения, Nitro, data fetching, состояние, SEO и обработку ошибок.

Создайте тестовый проект через `npx nuxi@latest init`, поэкспериментируйте со структурой папок и конфигурацией. Практика закрепляет теорию гораздо лучше, чем одно чтение.

---

## Полезные ссылки

- [Nuxt 3 Documentation](https://nuxt.com/docs) — официальная документация Nuxt 3
- [Nuxt Concepts](https://nuxt.com/docs/guide/concepts/auto-imports) — концепции Nuxt 3
- [Nuxt Configuration](https://nuxt.com/docs/api/configuration/nuxt-config) — справочник по nuxt.config.ts
- [Nitro](https://nitro.unjs.io/) — документация серверного движка
- [Nuxt Modules](https://nuxt.com/modules) — каталог модулей
- [Vue 3 Documentation](https://vuejs.org/) — официальная документация Vue 3
