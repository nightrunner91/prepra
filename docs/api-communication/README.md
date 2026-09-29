# Взаимодействие с API

Раздел сравнивает подходы к коммуникации клиента с сервером: классический REST, гибкий GraphQL, типобезопасный tRPC и real-time через WebSocket, SSE и Long Polling.

## Начни с базы

1. **[REST](./rest.md)** — архитектурный стиль, ресурсы, HTTP-методы, коды ответов, HATEOAS, best practices.
2. **[HTTP-клиенты](./http-clients.md)** — fetch, axios, ky, ofetch: выбор библиотеки, сравнение, паттерн централизованного клиента.

## Углубись в детали

- **[GraphQL vs REST](./graphql-vs-rest.md)** — сравнение подходов, схемы, запросы, мутации, подписки, когда что выбрать.
- **[Отмена запросов](./request-abortion.md)** — AbortController, предотвращение race conditions, cleanup в React, TanStack Query.
- **[Ретраи и exponential backoff](./retries-backoff.md)** — какие ошибки ретраить, jitter, Retry-After, идемпотентность, ретраи в ky/axios/TanStack Query.
- **[tRPC и типобезопасные API](./trpc.md)** — end-to-end типизация без codegen, zod-валидация, React Query, SSR.

## Не будет лишним

- **[WebSocket в React и Next.js](./websocket-react-next.md)** — real-time, переподключения, интеграция с состоянием, масштабирование.
- **[Long Polling](./long-polling.md)** — real-time обновления через обычный HTTP, реализация, обработка ошибок, сравнение с SSE/WebSocket.
- **[SSE: Server-Sent Events](./sse.md)** — односторонний real-time через HTTP, EventSource, авто-переподключение, реализация в React и Next.js.

## Смежные разделы

- **[Backend for Frontend](../architecture/backend-for-frontend.md)** — адаптация API под нужды клиента.
- **[TanStack Query](../state-management/tanstack-query.md)** — кэширование и серверное состояние на клиенте.
- **[Аутентификация и авторизация](../security/security-authn-authz.md)** — сессии, JWT, OAuth 2.0, OIDC, PKCE.
- **[Методы рендеринга, CDN и Edge](../performance/rendering-methods.md)** — HTTP-кэширование, CDN, SSR/SSG.
- **[Route Handlers и Server Actions](../nextjs/next-route-handlers-server-actions.md)** — API-роуты и мутации в Next.js.
- **[Конфигурация и окружения](../build-and-deployment/environment-config.md)** — переменные окружения для API-адресов и флагов.