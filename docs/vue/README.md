# Vue

Раздел охватывает Vue 3 с упором на Composition API и `<script setup>`: SFC, реактивность, жизненный цикл компонентов, Vue Router, обработку ошибок, оптимизацию производительности и экосистему. Вторая половина раздела — Nuxt 3 как full-stack надстройка над Vue.

## Начни с базы

1. **[Основы Vue 3](./fundamentals.md)** — SFC, шаблоны, директивы (`v-if`, `v-for`, `v-bind`, `v-on`, `v-model`), компоненты, `props`, `emits`, условный рендеринг, списки и создание проекта через Vite.
2. **[Реактивность Vue](./reactivity.md)** — `ref`, `reactive`, `computed`, `watch`/`watchEffect`, `toRef`/`toRefs`, реактивность коллекций, Proxy под капотом.
3. **[Composition API и `<script setup>`](./composition-api.md)** — `setup()`, `<script setup>`, composables, `provide`/`inject`, правила организации кода.
4. **[Vue Router](./router.md)** — маршрутизация, guards, lazy loading, `useRoute`/`useRouter`, динамические маршруты.
5. **[Жизненный цикл компонента](./lifecycle.md)** — lifecycle hooks, render → patch, сравнение с React.

## Углубись в детали

- **[События во Vue](./events.md)** — модификаторы, компонентные события, нативные события, `v-model` под капотом.
- **[Компоненты, слоты и композиция](./components-slots.md)** — default/named/scoped slots, `render()`/`h()`, `<component :is>`, `keep-alive`, `<teleport>`.
- **[Формы и валидация](./forms.md)** — `v-model` на нативных элементах, `defineModel`, модификаторы `.lazy`/`.number`/`.trim`, валидация на composables, `vee-validate` + zod, `FormKit` и доступность форм.
- **[Оптимизация производительности](./performance.md)** — `computed`, `v-memo`, `defineAsyncComponent`, `shallowRef`, lazy hydration, сравнение с React.
- **[Suspense и async setup](./suspense.md)** — `<Suspense>`, async `setup()`, fallback, вложенные границы.
- **[Обработка ошибок](./error-handling.md)** — `app.config.errorHandler`, `onErrorCaptured`, error boundary pattern.
- **[Transition и TransitionGroup](./transitions.md)** — анимация появления/исчезновения и списков.
- **[Кастомные директивы](./custom-directives.md)** — хуки и `binding`, регистрация локально и глобально, примеры `v-focus`, `v-click-outside`, `v-intersect`, `v-debounce` и сравнение с composables.
- **[Плагины и app-level API](./plugins-and-app-api.md)** — `install` и `app.use`, глобальные `component`/`directive`/`provide`, `app.config`, `mount`/`unmount`, несколько приложений и сравнение с composables.
- **[Стилизация во Vue](./styling.md)** — `scoped`-стили и data-атрибуты, `:deep()`/`:slotted()`/`:global()`, `v-bind()` в CSS и `useCssVars`, CSS Modules (`<style module>`), динамические классы, темизация через custom properties, порядок каскада.
- **[Доступные компоненты во Vue](./accessibility.md)** — focus management и focus trap для модалок на `<Teleport>`, `aria-live` и `<Transition>`, атрибут `inert`, клавиатурные паттерны tabs/dialog/combobox/disclosure, `prefers-reduced-motion` и тестирование доступности.
- **[Веб-компоненты и UI-киты во Vue](./web-components-and-ui-kits.md)** — `defineCustomElement`, Shadow DOM, стили и слоты через границу, `provide`/`inject` ограничения, UI-киты (Element Plus, Vuetify, PrimeVue), дизайн-системы, поставка в другие фреймворки, тестирование и SSR.

### Управление состоянием

- **[Pinia](./pinia.md)** — официальный стейт-менеджер Vue 3: `defineStore`, геттеры, actions, плагины, `storeToRefs` и миграция с Vuex.
- **[Vuex](./vuex.md)** — классический стейт-менеджер Vue: state, mutations, getters, actions, модули с namespaced и пошаговая миграция на Pinia.

### Nuxt

1. **[Основы Nuxt 3](./nuxt-fundamentals.md)** — создание проекта, структура папок, конфигурация `nuxt.config.ts`, dev/prod, отличия от Vue SPA.
2. **[Файловая маршрутизация](./nuxt-file-based-routing.md)** — `pages/`, динамические и вложенные роуты, `routeParam`, 404, `useRoute`/`useRouter`.
3. **[Режимы рендеринга](./nuxt-rendering-modes.md)** — SSR, SSG, CSR, ISR (`routeRules`, `prerender`, `ssr`), гидратация Vue-приложения.
4. **[Data fetching](./nuxt-data-fetching.md)** — `useFetch`, `useAsyncData`, `$fetch`, обработка ошибок, отмена запросов, SSR-safe fetching.
5. **[Состояние и SEO](./nuxt-state-and-seo.md)** — `useState`, Pinia в Nuxt, `useHead`, `useSeoMeta`, meta-теги и Open Graph.
6. **[Composables и auto-imports](./nuxt-composables-and-auto-imports.md)** — встроенные composables (`useFetch`, `useAsyncData`, `useState`, `useHead`), создание своих, отличие от Vue composables.
7. **[Серверная часть Nitro](./nuxt-nitro-server.md)** — `server/api/`, `server/routes/`, `server/middleware/`, обработчики, пресеты деплоя, кэширование.
8. **[Жизненный цикл приложения](./nuxt-app-lifecycle.md)** — плагины, middleware, hooks (`app:created`, `page:start`, `page:finish`), порядок выполнения.
9. **[Модули и экосистема](./nuxt-modules-ecosystem.md)** — официальные модули (`@nuxt/image`, `@nuxt/content`, `@nuxtjs/tailwindcss`), поиск и выбор сторонних, создание собственных через `defineNuxtModule`.
10. **[Nuxt Layers](./nuxt-layers.md)** — переиспользование конфигурации, компонентов, composables и middleware между проектами.
11. **[Обработка ошибок](./nuxt-error-handling.md)** — `error.vue`, `throwError`, `showError`, `vue:error` hook, логирование.
12. **[Деплой Nuxt 3](../build-and-deployment/nuxt-deployment.md)** — стратегии сборки и развёртывания через Nitro.

## Не будет лишним

- **[Options API vs Composition API](./options-vs-composition.md)** — история, различия, когда что использовать, миграция.
- **[Экосистема VueUse](./vueuse.md)** — обзор готовых composables, когда использовать, а когда писать свой.

## Смежные разделы

Темы уровня Senior Vue / UI Engineer вынесены в соседние разделы:

- **[TypeScript во Vue](../typescript/vue.md)** — типизация пропсов, событий, слотов и composables.
- **[Тестирование Vue](../testing/vue-testing-components.md)** — Vue Test Utils, composables, Pinia, роутер.
- **[Безопасность Vue](../security/vue.md)** — `v-html`, экранирование, токены, XSS.
- **[Дизайн-токены, темизация и Figma](../html-css/design-tokens-and-figma.md)** — дизайн-токены, Figma Variables и MCP, runtime theming на CSS custom properties, multi-brand.
- **[Паттерны компонентов во Vue](../architecture/design-patterns-vue.md)** — композиция и файловая структура.
