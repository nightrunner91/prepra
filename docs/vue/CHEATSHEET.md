# Шпаргалка: Vue

## Основы и шаблоны

- **SFC:** `<script setup>`, `<template>`, `<style scoped>`
- **Директивы:** `:`, `@`, `v-model`, `v-if`, `v-for`, `v-show` · `v-if` (монтаж) vs `v-show`
- **Списки:** `v-for` + стабильный `:key`, индекс только для статики
- **Props / emits:** props down, events up, иммутабельны · `$event`, `.stop` / `.prevent`
- **Слоты:** default / named / scoped · `<component :is>`, `<KeepAlive>`, `<Teleport>`
- **v-model и формы:** `defineModel()`, `.lazy` / `.trim` · vee-validate + zod, blur
- **Расширения:** кастомные директивы (`mounted`, binding) · плагины: `install(app)`, `app.use`

## Реактивность и Composition API

- **ref vs reactive:** `.value`, любые типы vs Proxy · деструктуризация → `toRefs`
- **computed / watch:** кэш vs явный источник · `immediate`, `deep`, `flush`
- **Ограничения:** `readonly`, `shallowRef` / `shallowReactive`, `markRaw`
- **Под капотом:** get → `track()`, set → `trigger()` · Vue 2: defineProperty vs Proxy
- **`<script setup>`:** без `this`, `defineProps` / `defineEmits` / `defineExpose`
- **Composables:** `use*`, состояние + эффекты · provide / inject, `InjectionKey`
- **Options vs Composition:** по опциям vs по фичам · VueUse: `useStorage`, `useDebounceFn`
- **Хуки:** setup → `onMounted` → `onUpdated` → `onUnmounted` · батч → `nextTick`

## Роутер и состояние

- **Vue Router:** `createRouter`, `<router-view>`, lazy `import()`, meta · web / hash / memory
- **Параметры:** params vs query (строки), `useRoute` vs `useRouter`
- **Guards:** `beforeEach` → `beforeEnter` → компонентные → `afterEach`
- **Pinia:** `defineStore`, state / getters / actions, `storeToRefs`, `$patch`
- **Vuex:** state / mutations / getters / actions, namespaced → Pinia

## Nuxt: основа и рендеринг

- **Nuxt vs Vue SPA:** файловый роутинг, SSR, Nitro, auto-imports, composables
- **Структура:** `pages/`, `components/`, `composables/`, `middleware/`, `server/`
- **Конфиг:** `runtimeConfig` (секреты + `public`) vs `app.config`
- **Маршрутизация:** `[id]`, `[...slug]` (1+), `[[...slug]]` (0+), `definePageMeta`
- **Навигация:** `useRoute` / `useRouter`, `navigateTo` (SSR-safe)
- **Режимы:** SSR (default), CSR (`ssr: false`), SSG (`nuxi generate`), ISR, SWR
- **routeRules:** `prerender`, `isr`, `swr` · ISR vs SWR: TTL vs кэш · mismatch → `<ClientOnly>`

## Nuxt: данные и сервер

- **Двойной запрос:** `$fetch` в setup vs `useFetch` / `useAsyncData` (payload)
- **Ключи и SSR:** общий `key`, дедупликация · cookies → `useRequestFetch` · `useState` vs `ref`
- **useHead / useSeoMeta:** title, meta, `og:*` · `titleTemplate`
- **Плагины:** `defineNuxtPlugin`, `.client` / `.server`, `provide` → `$name`
- **Middleware:** именованный, `.global.ts`, `abortNavigation` · SSR: server → plugins → route
- **Hooks:** `app:created`, `page:start` / `page:finish`, `vue:error`
- **Nitro:** H3, `server/api/` (`/api`) vs `server/routes/`, пресеты деплоя
- **Layers:** `extends` (папка, npm, git) · проект > `~/layers/` > `extends`
- **Модули:** build-time, `defineNuxtModule`, `@nuxt/kit` · layers vs модули

## Качество и производительность

- **Ошибки:** `errorHandler`, `onErrorCaptured` · `createError` → `error.vue`, `showError`
- **Suspense / lazy:** async setup, `defineAsyncComponent` · `v-once`, `v-memo`, `shallowRef`
- **Стили:** scoped, `:deep()`, `:slotted()`, `v-bind()` · Transition: `enter-from` / `-to`, FLIP
- **a11y:** фокус, trap, `inert`, live-регион · Web Components: Shadow DOM
