# Взаимодействие с API

Раздел сравнивает подходы к коммуникации клиента с сервером: классический REST, гибкий GraphQL и двунаправленный WebSocket.

## Начни с базы 📚

1. **[REST](./rest.md)** — архитектурный стиль, ресурсы, HTTP-методы, коды ответов, HATEOAS, best practices.
2. **[HTTP-клиенты](./http-clients.md)** — fetch, axios, ky, ofetch: выбор библиотеки, сравнение, паттерн централизованного клиента.

## Углубись в детали 🔎

- **[GraphQL vs REST](./graphql-vs-rest.md)** — сравнение подходов, схемы, запросы, мутации, подписки, когда что выбрать.
- **[Отмена запросов](./request-abortion.md)** — AbortController, предотвращение race conditions, cleanup в React, TanStack Query.

## Не будет лишним ✍

- **[WebSocket в React и Next.js](./websocket_react_next.md)** — real-time, переподключения, интеграция с состоянием, масштабирование.
- **[Long Polling](./long-polling.md)** — real-time обновления через обычный HTTP, реализация, обработка ошибок, сравнение с SSE/WebSocket.
