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
