# Шпаргалка: Взаимодействие с API

## REST

- **REST:** архитектурный стиль, не протокол · Филдинг, 2000 · HTTP — транспорт
- **Ограничения:** клиент-сервер, stateless, кэш, uniform interface, слои, code on demand (опц.)
- **Методы:** GET / POST / PUT / PATCH / DELETE → CRUD · PUT (целиком) vs PATCH (частично)
- **Идемпотентность:** GET, PUT, DELETE · POST — нет · safe: GET, HEAD
- **Коды:** часть HTTP, не REST · 2xx / 3xx / 4xx / 5xx · 201, 204, 400 vs 422, 401 vs 403
- **HATEOAS:** ссылки на действия в ответе · без него — HTTP API, не REST
- **Практики:** мн. число, пагинация, версии · ловушки: RPC в URL, 200 на ошибку, GET-мутация
- **REST vs:** SOAP (XML, контракт WSDL), gRPC (protobuf, HTTP/2, стриминг)

## HTTP-клиенты

- **fetch:** нативный, без throw на 4xx/5xx (`response.ok`), без interceptors и timeout
- **axios:** throw на `status >= 400`, interceptors, instance, timeout из коробки
- **ky / ofetch:** обёртки над fetch · ky (retry, hooks), ofetch (изоморфный, Nuxt)
- **Единый клиент:** один instance, baseURL из env, timeout, токен · `VITE_`, `NEXT_PUBLIC_` → бандл

## GraphQL и tRPC

- **Проблемы REST:** over-fetching (лишние поля), under-fetching (N запросов)
- **GraphQL:** единый endpoint, схема, резолверы, query / mutation / subscription
- **Цена GraphQL:** N+1 (DataLoader), сложный HTTP-кэш, сложность запросов
- **Выбор:** REST (CRUD, публичный API) vs GraphQL (вложенные данные, разные клиенты) · BFF
- **tRPC:** end-to-end типы через `typeof` роутера, без codegen, процедуры и роутеры
- **tRPC-механика:** zod на input, context на запрос, middleware (авторизация), `httpBatchLink`
- **tRPC-границы:** только TypeScript-монорепо, не для публичного API · SSR через server caller

## Отмена и ретраи

- **AbortController:** `signal` → fetch / axios / ky, `abort()` · CancelToken устарел
- **Зачем отмена:** race condition (старый ответ поверх нового), unmount, навигация
- **В компонентах:** abort в cleanup `useEffect`, флаг cancelled (запрос не отменяет), debounce
- **AbortError:** отмена, не сбой · не логировать, не ретраить · TanStack Query (`signal`)
- **Что ретраить:** сеть, 408, 429, 5xx vs 400, 401, 403, 404, 422
- **Backoff:** `min(base * 2^attempt, cap)`, jitter (thundering herd), лимит попыток, timeout
- **Retry-After и POST:** 429 / 503 (приоритет над backoff) · POST → `Idempotency-Key`

## Polling и SSE

- **Polling vs long polling:** запрос по интервалу vs сервер держит до данных или timeout (30–60 с)
- **Long polling:** новый запрос сразу после ответа, backoff на ошибках, `visibilitychange`
- **SSE:** сервер → клиент по HTTP, `text/event-stream`, только текст
- **Событие:** `data`, `event`, `id`, `retry` · onmessage vs addEventListener (именованные)
- **EventSource:** авто-reconnect + `Last-Event-ID` · без заголовков (cookies, `withCredentials`)
- **Ограничения SSE:** ~6 соединений на домен (HTTP/1.1), буферизация прокси, serverless

## WebSocket и Socket.IO

- **WebSocket:** full-duplex поверх TCP, HTTP Upgrade handshake, `wss://`, бинарные данные
- **Lifecycle:** открыть в `useEffect` / `onMounted`, закрыть в cleanup, хранить в ref, не в state
- **Надёжность:** reconnect с backoff, очередь сообщений, heartbeat (ping/pong)
- **SSR:** Next.js (только клиент, отдельный сервер) · Nuxt (Nitro `defineWebSocketHandler`)
- **Socket.IO:** свой протокол поверх WS · Engine.IO (long polling → upgrade), auto-reconnect
- **Каналы:** namespaces (`io.of("/chat")`) ⊃ rooms (`io.to(room)`) · emit / broadcast / io.emit
- **Фичи Socket.IO:** acknowledgements (callback), `io.use()` + `handshake.auth`, state recovery
- **Масштабирование:** sticky sessions, Redis Pub/Sub · Socket.IO: Redis adapter
