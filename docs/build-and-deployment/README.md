# Сборка, CI/CD и деплой

Раздел про путь от исходного кода до production: бандлеры, CI/CD, стратегии деплоя, платформы хостинга и zero-downtime.

## Начни с базы

1. **[Сборка и CI/CD](./build-tools-ci-cd.md)** — эволюция бандлеров, Webpack vs Vite, GitHub Actions, Docker, preview deployments.
2. **[Стратегии деплоя](./deployment-strategies.md)** — blue-green, canary, feature flags, rollback, zero-downtime.

## Углубись в детали

- **[Платформы деплоя](./deployment-platforms.md)** — Vercel, Netlify, Railway, Render, Fly.io, Cloudflare, AWS/GCP/Azure. Сравнение, цены, ограничения.

## Смежные разделы

- **[Методы рендеринга, CDN и Edge](../performance/rendering-methods.md)** — CSR/SSR/SSG/ISR/SWR, CDN, Edge, HTTP-кэширование. Реализация в [Next.js](../nextjs/nextjs-rendering-methods.md) и [Nuxt](../nuxt/nuxt-rendering-modes.md).
- **[Оптимизация бандла](../performance/bundle-optimization.md)** — анализ бандла, tree shaking, code splitting, vendor chunks, bundle budget.
- **[Монорепозитории](../architecture/monorepos.md)** — workspaces, Turborepo, Nx, CI/CD в монорепо.
- **[Деплой Next.js](../nextjs/deployment.md)** — `output: 'export'`, SSR/SSG/ISR, Edge Runtime, Vercel, Docker.
- **[PWA в Next.js](../nextjs/pwa.md)** — манифест, Service Workers, офлайн, push.
- **[Деплой Nuxt 3](../nuxt/deployment.md)** — Nitro, presets, `routeRules`, edge-хостинги.
- **[GitLab CI/CD для тестов](../testing/gitlab-ci-cd.md)** — pipeline, cache, artifacts, шардинг, JUnit, Docker.
