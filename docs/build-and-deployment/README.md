# Сборка, CI/CD и деплой

Раздел про весь путь от исходного кода до production: бандлеры, оптимизация бандла, CI/CD, стратегии деплоя, рендеринг, CDN, Edge и платформы хостинга.

## Начни с базы 📚

1. **[Сборка и CI/CD](./build-tools-ci-cd.md)** — эволюция бандлеров, Webpack vs Vite, code splitting, tree shaking, GitHub Actions, Docker.
2. **[Стратегии деплоя](./deployment-strategies.md)** — blue-green, canary, feature flags, rollback, zero-downtime.
3. **[Стратегии рендеринга, SSG, CDN и Edge](./deployment-rendering-strategies.md)** — CSR, SSR, SSG, ISR, CDN, кэширование и Edge Functions. База, без которой непонятны остальные статьи.

## Углубись в детали 🔎

- **[Продвинутая оптимизация бандла](./advanced-bundle-optimization.md)** — анализ, chunks, lazy loading, compression, bundle budget.
- **[Монорепозитории](./monorepos.md)** — workspaces, Turborepo, Nx, CI/CD в монорепо.
- **[Деплой Next.js](./deployment-nextjs.md)** — `output: 'export'`, SSR/SSG/ISR, Edge Runtime, Image Optimization, Vercel, Docker.
- **[Деплой Nuxt 3](./deployment-nuxt.md)** — Nitro, prerender, SSR, edge-пресеты, `routeRules`, хостинги.

## Не будет лишним ✍

- **[Платформы деплоя](./deployment-platforms.md)** — Vercel, Netlify, Railway, Render, Fly.io, Cloudflare Pages/Workers, AWS/GCP/Azure. Сравнение, цены, ограничения.
