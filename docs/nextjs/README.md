# Next.js

Раздел про full-stack React-фреймворк: App Router, серверные компоненты, загрузку данных, кэширование, Server Actions, Edge Runtime и монолитную архитектуру.

## Начни с базы

1. **[Основы Next.js](./fundamentals.md)** — что такое Next.js, файловый роутинг, SSR/SSG/ISR, серверные и клиентские компоненты, оптимизация. Самая база для начинающих.
2. **[Методы рендеринга](./rendering-methods.md)** — CSR, SSR, SSG, ISR, RSC, Streaming, Static Export, PPR: Route Segment Config, on-demand revalidation.
3. **[Роутинг в App Router](./routing.md)** — маршруты, динамические сегменты, группы, middleware.
4. **[Серверные и клиентские компоненты](./server-client-composition.md)** — правила композиции, interleaving, границы.
5. **[Data Fetching](./data-fetching.md)** — fetch на сервере, клиенте, паттерны загрузки.

## Углубись в детали

- **[Route Handlers и Server Actions](./route-handlers-server-actions.md)** — API-роуты, мутации, optimistic UI, ревалидация.
- **[Кэширование](./caching.md)** — четыре уровня кэша, revalidate, tags.
- **[Next.js Server API](./server-api.md)** — серверные возможности фреймворка.
- **[Оптимизация Next.js](./optimization.md)** — бандл, изображения, метрики, анализ.
- **[Деплой Next.js](../build-and-deployment/nextjs-deployment.md)** — `output: 'export'`, SSR/SSG/ISR, Edge Runtime, Vercel, Docker.

## Не будет лишним

- **[RSC Payload](./rsc-payload.md)** — механизм сериализации серверных компонентов.
- **[Edge Runtime](./edge-runtime.md)** — edge-функции, ограничения, деплой.
- **[PWA в Next.js](./pwa.md)** — манифест, Service Workers, офлайн, push.
- **[Next.js как монолит](./monolith-direct-db.md)** — прямое обращение к базе данных без отдельного API.