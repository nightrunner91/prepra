# Nuxt

Раздел посвящён Nuxt 3 — full-stack фреймворку на базе Vue 3. Здесь разбираются ключевые аспекты - от файловой маршрутизации до интеграции с экосистемой Vue.

## Начни с базы

1. **Основы Nuxt 3** — создание проекта, структура папок, конфигурация `nuxt.config.ts`, dev/prod, отличия от Vue SPA.
2. **Файловая маршрутизация** — `pages/`, динамические и вложенные роуты, `routeParam`, 404, `useRoute`/`useRouter`.
3. **Режимы рендеринга** — SSR, SSG, CSR, ISR (`routeRules`, `prerender`, `ssr`), гидратация Vue-приложения.
4. **Composables и auto-imports** — встроенные composables (`useFetch`, `useAsyncData`, `useState`, `useHead`), создание своих, отличие от Vue composables.
5. **Жизненный цикл приложения** — плагины, middleware, hooks (`app:created`, `page:start`, `page:finish`), порядок выполнения.

## Углубись в детали

- **Серверная часть Nitro** — `server/api/`, `server/routes/`, `server/middleware/`, обработчики, пресеты деплоя, кэширование.
- **Data fetching** — `useFetch`, `useAsyncData`, `$fetch`, обработка ошибок, отмена запросов, SSR-safe fetching.
- **Состояние и SEO** — `useState`, Pinia в Nuxt, `useHead`, `useSeoMeta`, meta-теги и Open Graph.
- **Обработка ошибок** — `error.vue`, `throwError`, `showError`, `vue:error` hook, логирование.
- **Nuxt Layers** — переиспользование конфигурации, компонентов, composables и middleware между проектами.
- **Модули и экосистема** — официальные модули (`@nuxt/image`, `@nuxt/content`, `@nuxtjs/tailwindcss`), поиск и выбор сторонних.

## Не будет лишним

- **Миграция с Nuxt 2** — ключевые отличия, bridge, composables vs старые API.

## Смежные материалы

- [Vue 3](../vue/README.md) — реактивность, Composition API, Vue Router, SFC.
- [Pinia](../state-management/pinia.md) — управление состоянием во Vue/Nuxt.
- [Тестирование Nuxt](../testing/testing-nuxt.md) — тесты компонентов, composables и серверных роутов.
- [Безопасность Vue/Nuxt](../security/security-vue-nuxt.md) — XSS, CSRF, CSP и особенности фреймворка.
- [Деплой Nuxt 3](../build-and-deployment/deployment-nuxt.md) — стратегии сборки и развёртывания.
