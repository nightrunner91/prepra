# Шпаргалка: Vue

## Основы и шаблоны

- **SFC:** `<script setup>`, `<template>`, `<style scoped>`
- **Директивы:** `:`, `@`, `v-model`, `v-if`, `v-for`, `v-show`, `v-html`, `v-once`
- **v-if vs v-show:** монтирование vs `display`
- **v-for:** стабильный `:key`, индекс только для статики
- **Props / emits:** props down, events up, props иммутабельны
- **События:** нативные (не SyntheticEvent), `$event`, `.stop` / `.prevent` / `.once`
- **Fallthrough:** необъявленные атрибуты → корень, `inheritAttrs`

## Реактивность

- **ref vs reactive:** `.value`, любые типы vs Proxy объекта · деструктуризация → `toRefs`
- **computed:** кэш по зависимостям, чистый, writable (get / set)
- **watch vs watchEffect:** явный источник, old / new vs автотрекинг · `immediate`, `deep`, `flush`
- **Ограничение:** `readonly`, `shallowRef` / `shallowReactive`, `markRaw`
- **Под капотом:** get → `track()`, set → `trigger()`, scheduler, батчинг
- **Vue 2 vs Vue 3:** `Object.defineProperty` vs Proxy (новые ключи, Map, Set)

## Composition API

- **`<script setup>`:** без `this`, `defineProps` / `defineEmits` / `defineExpose` / `defineModel`
- **Composables:** `use*`, состояние + эффекты · vs hooks: нет правил порядка, автотрекинг
- **provide / inject:** без prop drilling, `InjectionKey`
- **Options vs Composition:** по опциям vs по фичам, mixins vs composables, TS
- **VueUse:** tree-shaking, SSR-safe, `useStorage`, `useDebounceFn`

## Жизненный цикл и ошибки

- **Хуки:** setup → `onMounted` → `onUpdated` → `onUnmounted`, `onBefore*`, `onActivated`
- **Порядок:** `onMounted` детей → родителя, батч обновлений → `nextTick`
- **vs React:** `useEffect(fn, [])` ≈ `onMounted` + `onUnmounted`, deps → `watch`
- **Ошибки:** `app.config.errorHandler`, `onErrorCaptured` (`return false`), error boundary
- **Не ловится:** обработчики событий, `setTimeout`, `.then` → try/catch
- **Suspense:** async setup, `defineAsyncComponent`, default / fallback, ошибки не ловит

## Компоненты и формы

- **Слоты:** default, named (`#name`), scoped (≈ render props)
- **Встроенные:** `<component :is>`, `<KeepAlive>` (include / max), `<Teleport>`
- **v-model:** `modelValue` + `update:modelValue` → `defineModel()`, `.lazy` / `.trim`
- **Валидация:** ошибка после blur, vee-validate + zod, сервер обязателен
- **Директивы:** императивный DOM, `mounted` / `unmounted`, binding (value, arg, modifiers)
- **Плагины:** `install(app)`, `app.use` до mount, `app.provide`, `app.config`

## Роутер

- **Vue Router:** `createRouter`, `<router-view>`, lazy `() => import()`, meta (auth)
- **History:** web (настройка сервера), hash, memory (SSR)
- **Параметры:** params vs query (строки), `useRoute` vs `useRouter`
- **Guards:** `beforeEach` → `beforeEnter` → компонентные → `beforeResolve` → `afterEach`

## Стили, a11y, производительность

- **Стили:** scoped (`data-v-hash`), `:deep()`, `:slotted()`, `v-bind()` в CSS, `<style module>`
- **Transition:** `enter-from` / `-active` / `-to`, `mode="out-in"` · Group: `:key`, FLIP
- **a11y:** модалка (фокус, trap, возврат), `inert`, live-регион, `prefers-reduced-motion`
- **Web Components:** `defineCustomElement`, Shadow DOM · UI-кит vs дизайн-система
- **Оптимизация:** `v-once`, `v-memo`, `defineAsyncComponent`, виртуализация, `shallowRef`
