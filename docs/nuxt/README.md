# Nuxt

Раздел посвящён Nuxt 3 — full-stack фреймворку на базе Vue 3. Здесь разбираются ключевые аспекты - от файловой маршрутизации до интеграции с экосистемой Vue.

## Начни с базы

1. **[Основы Nuxt 3](./nuxt-fundamentals.md)** — создание проекта, структура папок, конфигурация `nuxt.config.ts`, dev/prod, отличия от Vue SPA.
2. **[Файловая маршрутизация](./nuxt-file-based-routing.md)** — `pages/`, динамические и вложенные роуты, `routeParam`, 404, `useRoute`/`useRouter`.
3. **[Режимы рендеринга](./nuxt-rendering-modes.md)** — SSR, SSG, CSR, ISR (`routeRules`, `prerender`, `ssr`), гидратация Vue-приложения.
4. **[Composables и auto-imports](./nuxt-composables-and-auto-imports.md)** — встроенные composables (`useFetch`, `useAsyncData`, `useState`, `useHead`), создание своих, отличие от Vue composables.
5. **[Жизненный цикл приложения](./nuxt-app-lifecycle.md)** — плагины, middleware, hooks (`app:created`, `page:start`, `page:finish`), порядок выполнения.

## Углубись в детали

- **[Серверная часть Nitro](./nuxt-nitro-server.md)** — `server/api/`, `server/routes/`, `server/middleware/`, обработчики, пресеты деплоя, кэширование.
- **[Data fetching](./nuxt-data-fetching.md)** — `useFetch`, `useAsyncData`, `$fetch`, обработка ошибок, отмена запросов, SSR-safe fetching.
- **[Состояние и SEO](./nuxt-state-and-seo.md)** — `useState`, Pinia в Nuxt, `useHead`, `useSeoMeta`, meta-теги и Open Graph.
- **[Обработка ошибок](./nuxt-error-handling.md)** — `error.vue`, `throwError`, `showError`, `vue:error` hook, логирование.
- **[Nuxt Layers](./nuxt-layers.md)** — переиспользование конфигурации, компонентов, composables и middleware между проектами.
- **[Модули и экосистема](./nuxt-modules-ecosystem.md)** — официальные модули (`@nuxt/image`, `@nuxt/content`, `@nuxtjs/tailwindcss`), поиск и выбор сторонних, создание собственных через `defineNuxtModule`.

## Смежные материалы

- [Vue 3](../vue/README.md) — реактивность, Composition API, Vue Router, SFC.
- [Pinia](../state-management/pinia.md) — управление состоянием во Vue/Nuxt.
- [Тестирование Nuxt](../testing/testing-nuxt.md) — тесты компонентов, composables и серверных роутов.
- [Безопасность Vue/Nuxt](../security/security-vue-nuxt.md) — XSS, CSRF, CSP и особенности фреймворка.
- [Деплой Nuxt 3](../build-and-deployment/deployment-nuxt.md) — стратегии сборки и развёртывания.
