# План развития раздела Vue (под Senior Vue / UI Engineer)

Документ фиксирует, какие статьи нужно создать в отдельных сессиях, чтобы раздел
`docs/vue/` полностью закрывал ожидания Senior Vue Developer / UI Engineer.

Этот файл лежит в корне `docs/`, а не в папке раздела, поэтому он **не попадает**
в Astro content collections (каждая коллекция грузится из `../docs/<section>`).

> **Обязательное правило:** каждую статью этого плана агент пишет с прогоном
> skill `article-format` (см. «Порядок работы», п. 4). Статья без `article-format`
> не считается готовой.

## Как читать план

- **Приоритет:** `P0` — критично для Senior-уровня, `P1` — важно, `P2` — nice-to-have.
- **Раздел:** куда положить статью. По сложившейся архитектуре проекта Vue-темы
  распределены по разделам и помечаются `stacks: ["vue"]`, а мок-интервью-пресет
  «Vue-стек» (`site/src/lib/mock-interview/presets.ts`) собирает вопросы из
  `vue + typescript + state-management + api-communication`.
- **Порядок (`order`)** в frontmatter нужно согласовать со статьями раздела —
  после добавления прогнать skill `arrange` по нужному разделу.

## Что уже покрыто (не дублировать)

| Тема | Где лежит |
|---|---|
| Pinia / Vuex | `docs/state-management/pinia.md`, `vuex.md` |
| TypeScript во Vue | `docs/typescript/vue.md` |
| Тестирование Vue | `docs/testing/vue-testing-components.md` |
| Безопасность Vue | `docs/security/vue.md` |
| Паттерны компонентов и структура | `docs/architecture/design-patterns-vue.md` |
| Виртуализация (в т.ч. Vue) | `docs/performance/list-virtualization.md` |
| Data fetching / SSR (Nuxt) | `docs/nuxt/data-fetching.md`, `composables-and-auto-imports.md` |
| SSR/гидратация, режимы рендера | `docs/nuxt/rendering-modes.md`, `docs/performance/hydration.md` |
| Стилизация (общая теория) | `docs/html-css/css-styling-approaches.md` |
| Доступность (общая теория) | `docs/html-css/html-semantics-accessibility.md` |
| Формы (общая теория) | `docs/html-css/html-forms-validation.md` |

## Статьи к созданию

### P0 — критично

#### 1. Кастомные директивы

- **Раздел:** `vue`, файл `docs/vue/custom-directives.md`
- **Почему:** темы нет нигде в проекте (только упоминания в `vue/error-handling.md`
  и `architecture/gof-patterns-frontend.md`). Частый вопрос на позицию UI Engineer.
- **Ключевые вопросы:**
  - Полная форма директивы `{ mounted, updated, beforeUnmount }` и сокращённая `mounted`.
  - Аргументы, значения, модификаторы и объект `binding`.
  - Динамические аргументы `v-example:[arg].modifier="value"`.
  - Регистрация: локально (в `<script setup>` как `vXxx`) и глобально `app.directive`.
  - Когда директива, а когда composable/компонент (сравнение с `useIntersectionObserver`).
  - Примеры: `v-focus`, `v-click-outside`, `v-intersect`, `v-debounce`.
- **Связи (добавить «Смотрите также»):** `vue/composition-api.md`,
  `vue/lifecycle.md`, `vue/vueuse.md`, `architecture/design-patterns-vue.md`.

#### 2. Плагины и app-level API

- **Раздел:** `vue`, файл `docs/vue/plugins-and-app-api.md`
- **Почему:** покрыты только Nuxt-плагины (`nuxt/app-lifecycle.md`), а Vue-плагин
  (`app.use`) и app-level API как тема отсутствуют.
- **Ключевые вопросы:**
  - Создание плагина: функция `install(app, options)`, `app.use(plugin, options)`.
  - Глобальные сущности: `app.component`, `app.directive`, `app.provide`.
  - `app.config`: `errorHandler`, `warnHandler`, `performance`, `globalProperties`,
    `optionMergeStrategies`, `compilerOptions`.
  - `app.mount`, `app.unmount`, несколько приложений на странице.
  - Плагин vs composable vs `provide/inject` — что выбирать.
- **Связи:** `vue/composition-api.md`, `vue/error-handling.md`,
  `build-and-deployment/build-tools-ci-cd.md`, `nuxt/app-lifecycle.md`.

#### 3. Стилизация во Vue

- **Раздел:** `vue`, файл `docs/vue/styling.md`
- **Почему:** сейчас упомянут только `<style scoped>` (`vue/fundamentals.md`).
  Для UI Engineer это обязательный блок; `html-css/css-styling-approaches.md` даёт
  общую теорию, но не Vue-механику.
- **Ключевые вопросы:**
  - `<style scoped>` и как работают data-атрибуты; deep-селекторы `:deep()`, `:slotted()`, `:global()`.
  - `v-bind()` в CSS и `useCssVars` — проброс реактивных значений в стили.
  - CSS Modules в SFC (`<style module>`) и `useCssModule`.
  - Динамические классы/стили, `:class`/`:style` с массивами и объектами.
  - Темизация через CSS custom properties; интеграция с Tailwind/UI-китами.
  - Порядок `<style>` в нескольких SFC и порядок применения.
- **Связи:** `html-css/css-styling-approaches.md`, `vue/transitions.md`,
  `vue/components-slots.md`, `architecture/design-patterns-vue.md`.

### P1 — важно

#### 4. Доступные компоненты во Vue (a11y)

- **Раздел:** `vue`, файл `docs/vue/accessibility.md`
- **Почему:** в разделе одна строка про доступность (`vue/suspense.md`).
  Общая теория есть в `html-css/html-semantics-accessibility.md`, но Vue-механики нет.
- **Ключевые вопросы:**
  - Focus management и focus trap для модалок на `<Teleport>`.
  - `aria-live` в связке с `<Transition>`; инертный фон (`inert`).
  - Клавиатурная навигация, `tabindex`, `role` в переиспользуемых компонентах.
  - Доступные паттерны: combobox, tabs, dialog, disclosure на Vue.
  - Реакция на `prefers-reduced-motion` (пересечение с `vue/transitions.md`).
- **Связи:** `vue/components-slots.md`, `vue/transitions.md`,
  `vue/lifecycle.md`, `html-css/html-semantics-accessibility.md`.

#### 5. i18n во Vue (`vue-i18n`)

- **Раздел:** `vue`, файл `docs/vue/i18n.md`
- **Почему:** интернационализация отсутствует во всём проекте (проверено поиском).
- **Ключевые вопросы:**
  - `createI18n`, `<i18n-t>`, `useI18n`, `$t` в шаблоне.
  - Плюрализация, интерполяция, форматирование чисел/дат, `Intl`.
  - Ленивая загрузка сообщений по locale; интеграция с роутером.
  - SSR-нюансы и Nuxt-модуль `@nuxtjs/i18n` (ссылка на `nuxt/`).
- **Связи:** `nuxt/modules-ecosystem.md`, `vue/router.md`.

#### 6. Data fetching в SPA-Vue

- **Раздел:** `vue` (или `api-communication`), файл `docs/vue/data-fetching.md`
- **Почему:** во Vue-разделе паттернов загрузки данных нет; Nuxt/TanStack покрывают
  частично, но SPA-сценарий (гонки, отмена, кэш, инвалидация) отдельно не разобран.
- **Ключевые вопросы:**
  - `useFetch`-composable своими руками: `data/loading/error`, `AbortController`, race conditions.
  - `watchEffect` + `onCleanup`, отмена при смене параметров/размонтировании.
  - Кэш/дедупликация/инвалидация; когда TanStack Query (`state-management/tanstack-query.md`).
  - Retry/backoff (`api-communication/retries-backoff.md`) и отмена (`request-abortion.md`).
- **Связи:** `vue/error-handling.md`, `vue/suspense.md`, `vue/vueuse.md`,
  `state-management/tanstack-query.md`, `api-communication/request-abortion.md`.

#### 7. Формы и валидация во Vue

- **Раздел:** `vue`, файл `docs/vue/forms.md`
- **Почему:** нет отдельной темы; только базовый `v-model`.
- **Ключевые вопросы:**
  - Контролируемые/неконтролируемые поля, `defineModel` в формах, несколько `v-model`.
  - Модификаторы `.lazy`, `.number`, `.trim` и кастомные `modelModifiers`.
  - Валидация: `vee-validate` + zod/yup, `FormKit`, ручные composables.
  - Доступность форм (`aria-invalid`, `aria-describedby`) — пересечение со статьёй про a11y.
- **Связи:** `vue/events.md`, `vue/components-slots.md`, `html-css/html-forms-validation.md`.

#### 8. Vue 3.5+ API

- **Раздел:** `vue`, файл `docs/vue/vue35-features.md`
- **Почему:** `useTemplateRef` есть в `typescript/vue.md`, но `useId`,
  стабильная реактивная деструктуризация props, `onWatcherCleanup`, `defer` у
  `<Teleport>` в разделе не раскрыты.
- **Ключевые вопросы:**
  - `useTemplateRef` вместо `ref(null)` для шаблонных ссылок.
  - `useId` для SSR-safe id.
  - Реактивная деструктуризация props и дефолты в `<script setup>`.
  - `onWatcherCleanup`, `defer`-телепорт, улучшения `defineModel`.
- **Связи:** `vue/reactivity.md`, `vue/composition-api.md`, `vue/suspense.md`,
  `typescript/vue.md`.

### P2 — nice-to-have

#### 9. `effectScope` и проектирование composables

- **Раздел:** `vue`, файл `docs/vue/composable-design.md`
- **Почему:** `effectScope` — нишевый, но показательный senior-API; темы нет.
- **Ключевые вопросы:** `effectScope`, `getCurrentScope`, `onScopeDispose`,
  отвязка эффектов, дизайн библиотечных composables, контракты и тестирование.
- **Связи:** `vue/composition-api.md`, `vue/lifecycle.md`, `vue/vueuse.md`.

#### 10. Web Components и `defineCustomElement`

- **Раздел:** `vue`, файл `docs/vue/web-components.md`
- **Почему:** релевантно поставке UI-китов; темы нет.
- **Ключевые вопросы:** `defineCustomElement`, ограничения (provide/inject, слоты),
  стили и Shadow DOM, регистрация в обычном HTML.
- **Связи:** `vue/components-slots.md`, `vue/styling.md`, `html-css/css-styling-approaches.md`.

## Опционально (решить перед стартом)

- **SSR/гидратация во Vue (SPA-level).** Если раздел должен быть самодостаточным без
  Nuxt — добавить `docs/vue/ssr-hydration.md` (hydration mismatch, `ClientOnly`,
  `useId`, `onServerPrefetch`). Сейчас частично покрыто в `performance/hydration.md`
  и `nuxt/rendering-modes.md`.

## Обвязка и инфраструктура

Уже сделано в сессии подготовки:

- **Исправлена навигация по перекрёстным ссылкам.** Ссылки между статьями
  (`../section/slug.md`, `./slug.md`) не разрешались на сайте (глубина URL
  `/{section}/{slug}/`). Добавлен пост-билд шаг
  `site/src/lib/rewrite-relative-links.mjs` (Astro integration
  `astro:build:done`), который переписывает относительные ссылки в абсолютные
  `/{base}/{section}/{slug}`. Rehype-плагин `rehype-markdown-links.mjs` не может
  этого сделать: в content collections `file` не передаётся.
- Исправлена единственная root-absolute внутренняя ссылка
  (`api-communication/websocket.md` → `../vue/lifecycle.md`).
- Добавлен блок «Смотрите также» в 13 статей раздела `vue` и в 8 смежных статей
  (Pinia, TS-Vue, тестирование, безопасность, паттерны, Nuxt routing/data-fetching,
  виртуализация).
- В `docs/vue/README.md` добавлен раздел «Смежные разделы».

Что учесть на будущее:

- **README раздела рендерится на сайте не как Markdown, а через
  `site/src/lib/section-readme.ts`** (только H2-группы и ссылки вида `./slug.md`
  становятся карточками). Ссылки `../...` в README на сайте не отображаются —
  держать их для GitHub/редактора, а кросс-раздел строить внутри статей через
  «Смотрите также».
- После добавления статей обновить `docs/vue/README.md` (группы и порядок) и
  прогнать skill `arrange` для `vue`.
- Проверить, не нужно ли расширить пресет «Vue-стек» в
  `site/src/lib/mock-interview/presets.ts` (например, добавить `performance`).

## Порядок работы

1. P0: `custom-directives`, `plugins-and-app-api`, `styling`.
2. P1: `accessibility`, `i18n`, `data-fetching`, `forms`, `vue35-features`.
3. P2: `composable-design`, `web-components`.
4. **Обязательно: запустить skill `article-format`** при написании каждой статьи
   (по одной статье за раз) — до финализации frontmatter и «Смотрите также».
   Без прогона `article-format` статью считать неготовой.
5. После каждой статьи: frontmatter (`title`, `section`, `description`, `order`,
   `tags`, `stacks: ["vue"]`, `questions`, при необходимости `answers`), блок
   «Смотрите также» с обратными ссылками, запись в `docs/vue/README.md`.
6. Финально: `npm run build` в `site/` и skill `arrange` по разделу `vue`.
