# Шпаргалка: Nuxt

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
