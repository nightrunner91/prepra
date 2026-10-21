# Шпаргалка: Сборка, CI/CD и деплой

## Сборка

- **Бандлер:** entry → граф зависимостей → трансформация (JSX, TS → JS) → чанки
- **Webpack:** loaders (файлы) / plugins (сборка), весь граф при старте, медленный HMR
- **Vite:** dev без бандла (нативные ESM, по запросу браузера), быстрый HMR · prod — Rollup
- **Tree shaking:** статические ESM-импорты · помехи: CommonJS, side effects, `export *`
- **Code splitting:** `import()` → чанк, `React.lazy` + `Suspense`, разбиение по маршрутам

## CI/CD

- **CI vs CD:** push → lint, тесты, build / автодеплой после зелёного CI
- **GitHub Actions:** workflow → jobs → steps, matrix (версии Node), secrets
- **Кэш зависимостей:** ключ `hashFiles('**/package-lock.json')`, `npm ci` vs `npm install`
- **Preview deployments:** URL на каждый PR, ссылка в комментарии, QA и дизайн до мержа

## Конфигурация окружений

- **12-factor:** конфиг вне кода, один билд → dev / staging / prod
- **Build-time vs runtime:** вшито в бандл (пересборка) / ENV при старте (один образ)
- **Публичные префиксы:** `VITE_`, `NEXT_PUBLIC_`, `NUXT_PUBLIC_` · видно в DevTools → без секретов
- **Порядок .env:** `.env` < `.env.local` < `.env.[mode]` < `.env.[mode].local`
- **Секреты:** платформа, CI secrets, Vault · `.env*` в .gitignore · утечка → перевыпуск
- **Документация и валидация:** `.env.example` в git, zod-схема на старте, fail fast
- **Runtime в SPA:** `window.env` (подстановка nginx / envsubst) или запрос `/api/config`

## Docker

- **Image vs container:** неизменяемый шаблон из слоёв / запущенный изолированный процесс
- **Multi-stage:** builder (node, `npm ci`, build) → nginx + `dist/`, ~500 МБ → ~20 МБ
- **Кэш слоёв:** `COPY package*.json` → install → `COPY` кода
- **nginx:** раздача статики, SPA fallback (`try_files $uri /index.html`)
- **Гигиена:** `.dockerignore` (node_modules, .env), non-root, `HEALTHCHECK`, тег вместо `latest`

## Стратегии деплоя

- **Blue-green:** два окружения, мгновенное переключение на load balancer · ×2 ресурсов
- **Canary:** 1–5% трафика → рост до 100%, метрики (success rate, latency) → auto-rollback
- **Feature flags:** деплой ≠ релиз · release, experiment (A/B), ops (kill switch), permission
- **Rollback:** переключить lb / убрать canary / выключить флаг · БД — сложнее всего
- **Миграции БД:** expand → migrate → contract (совместимость двух версий кода)
- **Zero-downtime:** health checks, graceful shutdown (SIGTERM, дождаться текущих запросов)

## Платформы деплоя

- **Serverless vs контейнер:** по запросу, лимиты, дорого на нагрузке / процесс, WebSocket, БД
- **Ниши:** Vercel (Next.js), Netlify (SSG), Railway / Render (full-stack + БД), Fly.io (регионы)
- **Edge и облака:** Cloudflare (Workers, KV, R2) · AWS / GCP / Azure (контроль, порог входа)
- **Архитектуры:** SSG + CDN, SSR на serverless, full-stack в контейнере, edge-first

## Next.js и Nuxt

- **Next.js output:** default, `standalone` (Docker, self-hosted), `export` (статика, без SSR / ISR)
- **ISR:** нужен сервер или serverless · Vercel, Netlify из коробки · не в export
- **Edge Runtime:** V8 isolate, без `fs` и Node API, лимиты · middleware, лёгкие API
- **next/image:** оптимизация на сервере · export → `unoptimized` или custom loader (CDN)
- **Nitro:** серверный движок Nuxt, preset под платформу (`node-server`, `vercel`, `cloudflare`)
- **build vs generate:** SSR в `.output/` / статика в `.output/public/`
- **routeRules:** `prerender`, `ssr: false`, `isr: 60`, `swr` на уровне маршрутов
- **runtimeConfig:** `NUXT_*` → автомаппинг, `public` (клиент + сервер) vs приватный, без пересборки
