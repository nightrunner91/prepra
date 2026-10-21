# Шпаргалка: Nuxt

## Основы

- **Nuxt vs Vue SPA:** файловый роутинг, SSR, Nitro-сервер, auto-imports из коробки
- **Структура:** `pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `server/`
- **Конфиг:** `runtimeConfig` (секреты + `public`, env) vs `app.config` (публичный)
- **Auto-imports:** Vue API, Nuxt composables, `components/`, `composables/`, `utils/`

## Маршрутизация

- **pages/:** файл → URL, `index.vue`, вложенные (родитель + `<NuxtPage />`)
- **Динамика:** `[id]`, `[...slug]` (1+), `[[...slug]]` (0+) · параметры — строки
- **Приоритет:** статика > `[param]` > catch-all
- **definePageMeta:** layout, middleware, validate (`false` → 404)
- **Навигация:** `useRoute` (чтение) vs `useRouter` (методы) · `navigateTo` (SSR-safe)

## Рендеринг

- **Режимы:** SSR (default), CSR (`ssr: false`), SSG (`nuxi generate`), ISR, SWR
- **routeRules:** гибрид по маршрутам, `prerender`, `isr`, `swr`, `ssr: false`, `redirect`
- **ISR vs SWR:** кэш страницы по TTL vs кэш ответа, оба с фоновым обновлением
- **Гидратация:** серверный HTML → JS → Vue на готовом DOM → обработчики
- **Hydration mismatch:** `Date.now()`, `Math.random()`, `window` → `<ClientOnly>`, `onMounted`
- **Выбор:** SSR (SEO + динамика), SSG (редкие изменения), CSR (админки)

## Данные и состояние

- **Двойной запрос:** `$fetch` в setup (сервер + клиент) vs `useFetch` / `useAsyncData` (payload)
- **useFetch:** ≈ `useAsyncData(key, () => $fetch(url))` · `$fetch` для мутаций
- **Ключи:** дедупликация, общее состояние · автоключ → явный `key`
- **Блокировка:** `await` (навигация), `lazy`, `immediate: false`, `server: false`
- **Реактивность:** computed URL, реактивный `query` · `watch` (перезапуск, не URL)
- **SSR-подвохи:** cookies не прокидываются (`useRequestFetch`) · payload (devalue) vs API (JSON)
- **useState vs ref:** ключ, общая ссылка, сериализация в payload vs локальный
- **Pinia:** `@pinia/nuxt` · useState (простые флаги) vs Pinia (корзина, auth)

## Lifecycle и ошибки

- **Плагины:** `defineNuxtPlugin`, `.client` / `.server`, `provide` → `$name`, `dependsOn`
- **Middleware:** именованный, `*.global.ts`, анонимный · `navigateTo`, `abortNavigation`
- **Плагин vs middleware:** один раз при старте vs перед каждым роутом
- **Порядок (SSR):** server middleware → плагины → route middleware → data fetching → render
- **Hooks:** `app:created`, `page:start` / `page:finish`, `vue:error` · `nuxtApp.hook()`
- **error.vue:** `createError` (сервер → HTTP, клиент → `error.vue`), `clearError`
- **showError vs throwError:** показать vs показать и остановить · `vue:error`, `onErrorCaptured`

## Nitro

- **Nitro:** H3, dev + prod-сервер, пресеты деплоя (node, vercel, cloudflare)
- **Директории:** `server/api/` (`/api`) vs `server/routes/` · `server/middleware/` (каждый запрос)
- **Обработчик:** `defineEventHandler(event)`, `getQuery`, `readBody`, `.get.ts` / `.post.ts`
- **Кэш и защита:** `defineCachedEventHandler`, `routeRules` · `createError`, секреты на сервере

## SEO и расширение

- **useHead / useSeoMeta:** title, meta, `og:*` · глобально `app.head`, `titleTemplate`
- **SEO и рендеринг:** SSR / SSG vs CSR · данные через `useFetch` → серверный HTML
- **Layers:** `extends` (папка, npm, git) · приоритет: проект > `~/layers/` > `extends`
- **Модули:** build-time, `defineNuxtModule` (`meta`, `defaults`, `setup`), `@nuxt/kit`
- **Layers vs модули:** файлы и структура vs программное расширение
