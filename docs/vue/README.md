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
- **[Кастомные директивы](./custom-directives.md)** — хуки и `binding`, регистрация локально и глобально, примеры `v-focus`, `v-click-outside`, `v-intersect`, `v-debounce` и сравнение с composables.
- **[Плагины и app-level API](./plugins-and-app-api.md)** — `install` и `app.use`, глобальные `component`/`directive`/`provide`, `app.config`, `mount`/`unmount`, несколько приложений и сравнение с composables.
- **[Стилизация во Vue](./styling.md)** — `scoped`-стили и data-атрибуты, `:deep()`/`:slotted()`/`:global()`, `v-bind()` в CSS и `useCssVars`, CSS Modules (`<style module>`), динамические классы, темизация через custom properties, порядок каскада.

## Не будет лишним

- **[Options API vs Composition API](./options-vs-composition.md)** — история, различия, когда что использовать, миграция.
- **[Экосистема VueUse](./vueuse.md)** — обзор готовых composables, когда использовать, а когда писать свой.

## Смежные разделы

Темы уровня Senior Vue / UI Engineer вынесены в соседние разделы:

- **[Pinia и Vuex](../state-management/README.md)** — клиентское состояние приложения.
- **[TypeScript во Vue](../typescript/vue.md)** — типизация пропсов, событий, слотов и composables.
- **[Тестирование Vue](../testing/vue-testing-components.md)** — Vue Test Utils, composables, Pinia, роутер.
- **[Безопасность Vue](../security/vue.md)** — `v-html`, экранирование, токены, XSS.
- **[Паттерны компонентов во Vue](../architecture/design-patterns-vue.md)** — композиция и файловая структура.
- **[Nuxt](../nuxt/README.md)** — full-stack фреймворк на базе Vue.

> Пресет мок-интервью «Vue-стек» собирает вопросы из разделов Vue, TypeScript, Хранилища и API.