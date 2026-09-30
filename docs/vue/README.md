# Vue

Раздел охватывает Vue 3 с упором на Composition API и `<script setup>`: SFC, реактивность, жизненный цикл компонентов, Vue Router, обработку ошибок, оптимизацию производительности и экосистему.

## Начни с базы

1. **[Основы Vue 3](./fundamentals.md)** — SFC, шаблоны, директивы (`v-if`, `v-for`, `v-bind`, `v-on`, `v-model`), компоненты, `props`, `emits`, условный рендеринг, списки и создание проекта через Vite.
2. **[Реактивность Vue](./reactivity.md)** — `ref`, `reactive`, `computed`, `watch`/`watchEffect`, `toRef`/`toRefs`, реактивность коллекций, Proxy под капотом.
3. **[Composition API и `<script setup>`](./composition-api.md)** — `setup()`, `<script setup>`, composables, `provide`/`inject`, правила организации кода.
4. **[Vue Router](./router.md)** — маршрутизация, guards, lazy loading, `useRoute`/`useRouter`, динамические маршруты.
5. **[Жизненный цикл компонента](./lifecycle.md)** — lifecycle hooks, render → patch, сравнение с React.

## Углубись в детали

- **[События во Vue](./events.md)** — модификаторы, компонентные события, нативные события, `v-model` под капотом.
- **[Компоненты, слоты и композиция](./components-slots.md)** — default/named/scoped slots, `render()`/`h()`, `<component :is>`, `keep-alive`, `<teleport>`.
- **[Оптимизация производительности](./performance.md)** — `computed`, `v-memo`, `defineAsyncComponent`, `shallowRef`, lazy hydration, сравнение с React.
- **[Suspense и async setup](./suspense.md)** — `<Suspense>`, async `setup()`, fallback, вложенные границы.
- **[Обработка ошибок](./error-handling.md)** — `app.config.errorHandler`, `onErrorCaptured`, error boundary pattern.
- **[Transition и TransitionGroup](./transitions.md)** — анимация появления/исчезновения и списков.

## Не будет лишним

- **[Options API vs Composition API](./options-vs-composition.md)** — история, различия, когда что использовать, миграция.
- **[Экосистема VueUse](./vueuse.md)** — обзор готовых composables, когда использовать, а когда писать свой.