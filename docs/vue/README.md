# Vue

Раздел охватывает Vue 3 с упором на Composition API и `<script setup>`: SFC, реактивность, жизненный цикл компонентов, Vue Router, обработку ошибок, оптимизацию производительности, TypeScript и экосистему. Options API рассматривается как legacy, необходимый для чтения чужого кода и миграций.

## Начни с базы

1. **[Основы Vue 3](./vue-fundamentals.md)** — SFC, шаблоны, директивы (`v-if`, `v-for`, `v-bind`, `v-on`, `v-model`), компоненты, `props`, `emits`, условный рендеринг, списки и создание проекта через Vite.
2. **[Реактивность Vue](./vue-reactivity.md)** — `ref`, `reactive`, `computed`, `watch`/`watchEffect`, `toRef`/`toRefs`, реактивность коллекций, Proxy под капотом.
3. **[Composition API и `<script setup>`](./vue-composition-api.md)** — `setup()`, `<script setup>`, composables, `provide`/`inject`, правила организации кода.
4. **[Vue Router](./vue-router.md)** — маршрутизация, guards, lazy loading, `useRoute`/`useRouter`, динамические маршруты.
5. **[Жизненный цикл компонента](./vue-lifecycle.md)** — lifecycle hooks, render → patch, сравнение с React.
6. **[События во Vue](./vue-events.md)** — модификаторы, компонентные события, нативные события, `v-model` под капотом.

## Углубись в детали

- **[Компоненты, слоты и композиция](./vue-components-slots.md)** — default/named/scoped slots, `render()`/`h()`, `<component :is>`, `keep-alive`, `<teleport>`.
- **[Оптимизация производительности](./vue-performance.md)** — `computed`, `v-memo`, `defineAsyncComponent`, `shallowRef`, lazy hydration, сравнение с React.
- **[Suspense и async setup](./vue-suspense.md)** — `<Suspense>`, async `setup()`, fallback, вложенные границы.
- **Обработка ошибок** — `app.config.errorHandler`, `onErrorCaptured`, error boundary pattern.
- **Transition и TransitionGroup** — анимация появления/исчезновения и списков.

## Не будет лишним

- **[Options API vs Composition API](./vue-options-vs-composition.md)** — история, различия, когда что использовать, миграция.
- **TypeScript во Vue** — типизация пропсов, emits, composables, `defineModel`, generics в SFC.
- **[Экосистема VueUse](./vueuse.md)** — обзор готовых composables, когда использовать, а когда писать свой.
- **Создание проекта и структура** — `npm create vue@latest`, Vite, структура папок, dev/prod.

## Смежные материалы

- [Pinia](../state-management/pinia.md) и [Vuex](../state-management/vuex.md) — управление состоянием.
- [Тестирование Vue-компонентов](../testing/testing-vue-components.md) — Vue Test Utils, Vitest.
- [Тестирование Nuxt](../testing/testing-nuxt.md) — компоненты, composables, серверные роуты.
- [Безопасность Vue/Nuxt](../security/security-vue-nuxt.md) — XSS, CSRF, CSP и особенности фреймворка.
