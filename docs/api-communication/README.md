# Взаимодействие с API

Раздел сравнивает подходы к коммуникации клиента с сервером: классический REST, гибкий GraphQL, типобезопасный tRPC и real-time через WebSocket, SSE и Long Polling.

## Начни с базы

1. **[REST](./rest.md)** — архитектурный стиль, ресурсы, HTTP-методы, коды ответов, HATEOAS, best practices.
2. **[HTTP-клиенты](./http-clients.md)** — fetch, axios, ky, ofetch: выбор библиотеки, сравнение, паттерн централизованного клиента.
3. **[GraphQL vs REST](./graphql-vs-rest.md)** — сравнение подходов, схемы, запросы, мутации, подписки, когда что выбрать.

## Углубись в детали

- **[Отмена запросов](./request-abortion.md)** — AbortController, предотвращение race conditions, cleanup в React, TanStack Query.
- **[Ретраи и exponential backoff](./retries-backoff.md)** — какие ошибки ретраить, jitter, Retry-After, идемпотентность, ретраи в ky/axios/TanStack Query.
- **[Long Polling](./long-polling.md)** — real-time обновления через обычный HTTP, реализация, обработка ошибок, сравнение с SSE/WebSocket.
- **[SSE: Server-Sent Events](./sse.md)** — односторонний real-time через HTTP, EventSource, авто-переподключение, реализация в React и Next.js.
- **[WebSocket: двусторонний real-time](./websocket.md)** — протокол, переподключения, интеграция с состоянием в React и Vue, сервер в Next.js и Nuxt, масштабирование.
- **[tRPC и типобезопасные API](./trpc.md)** — end-to-end типизация без codegen, zod-валидация, React Query, SSR.

## Не будет лишним

- **[Socket.IO: rooms, namespaces и real-time](./socket-io.md)** — библиотека поверх WebSocket: Engine.IO, fallback, комнаты, namespaces, acknowledgements, масштабирование через Redis adapter.