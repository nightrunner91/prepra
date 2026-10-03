# Сборка, CI/CD и деплой

Раздел про путь от исходного кода до production: бандлеры, CI/CD, стратегии деплоя, платформы хостинга, контейнеризация и конфигурация окружений.

## Начни с базы

1. **[Сборка и CI/CD](./build-tools-ci-cd.md)** — эволюция бандлеров, Webpack vs Vite, GitHub Actions, Docker, preview deployments.
2. **[Переменные окружения и конфигурация](./environment-config.md)** — build-time и runtime, .env файлы, секреты, валидация через zod.
3. **[Стратегии деплоя](./deployment-strategies.md)** — blue-green, canary, feature flags, rollback, zero-downtime.

## Углубись в детали

- **[Docker для фронтенда](./docker-frontend.md)** — multi-stage build, nginx и SPA fallback, runtime-переменные, docker-compose, публикация образа.
- **[Платформы деплоя](./deployment-platforms.md)** — Vercel, Netlify, Railway, Render, Fly.io, Cloudflare, AWS/GCP/Azure. Сравнение, цены, ограничения.
- **[Деплой Next.js](./nextjs-deployment.md)** — `output: 'export'` / `standalone`, SSR/SSG/ISR, Edge Runtime, Vercel, Docker, `NEXT_PUBLIC_`-переменные.
- **[Деплой Nuxt](./nuxt-deployment.md)** — Nitro, presets, `routeRules`, edge-деплой, `runtimeConfig` и переменные окружения.

## Не будет лишним

_Нет статей в этой категории — всё перечисленное выше относится к обязательному минимуму раздела._