# Node.js

Раздел ведёт от устройства рантайма до продакшн-бэкенда: Event Loop, стримы, HTTP и фреймворки, доступ к данным, надёжность и архитектура сервиса.

## Начни с рантайма

1. **[Node.js: как устроен рантайм](./fundamentals.md)** — V8, libuv, поток выполнения и thread pool, отличия от браузера, когда Node подходит, а когда нет.
2. **[npm и экосистема пакетов](./npm.md)** — `package.json`, semver, lockfile, зависимости, скрипты, `npx`, pnpm и workspaces.
3. **[Модули: CommonJS и ESM](./modules.md)** — `require` и `import`, разрешение модулей, `__dirname` и `import.meta`, dual packages, циклические зависимости.
4. **[Встроенные модули Node.js](./builtin-api.md)** — `process`, `Buffer`, `path`, `fs`, `os`, `url`, `crypto`, таймеры.
5. **[Event Loop в Node.js](./event-loop.md)** — фазы libuv, `nextTick`, microtasks, `setImmediate`, starvation, event loop lag.

## Асинхронность и ввод-вывод

- **[Асинхронность в Node.js](./async.md)** — callback → Promise → async/await, `promisify`, error-first, `unhandledRejection`, `AsyncLocalStorage`.
- **[EventEmitter и события](./event-emitter.md)** — `on`/`once`/`off`, событие `error`, утечки слушателей, паттерн observer.
- **[Стримы и backpressure](./streams.md)** — Readable, Writable, Duplex, Transform, `pipeline`, `highWaterMark`, обработка больших файлов.
- **[Worker Threads и cluster](./worker-threads.md)** — CPU-bound задачи, `worker_threads`, `cluster`, `child_process`, когда что выбирать.
- **[HTTP-клиенты в Node.js](./http-clients.md)** — `fetch` и undici, агенты и keep-alive, таймауты, ретраи, отмена запросов.

## HTTP и API

- **[HTTP-сервер на чистом Node](./http-server.md)** — `http.createServer`, request/response, body, ручной routing, статусы, keep-alive.
- **[Express и middleware](./express.md)** — routing, цепочка middleware, `next()`, error middleware, `Router`, структура проекта.
- **[Fastify и NestJS](./frameworks.md)** — схемы и хуки, плагины, DI и модули, производительность, когда какой фреймворк.
- **[Конфигурация и валидация](./validation-config.md)** — env и 12-factor, `dotenv`, zod, валидация body/query/params, DTO.
- **[Аутентификация в API](./auth.md)** — сессии и cookies, JWT и refresh, хеширование паролей, RBAC, OAuth, CSRF.
- **[WebSocket и SSE на сервере](./realtime-server.md)** — `ws`, socket.io, SSE, комнаты, переподключения, масштабирование.
- **[Логирование и наблюдаемость](./logging-observability.md)** — pino, structured logs, request-id, health checks, метрики, трассировка.

## Данные и интеграции

- **[Доступ к базам данных](./database-access.md)** — `pg`, пул соединений, параметризованные запросы, транзакции, N+1, ORM как слой.
- **[Redis и фоновые задачи](./redis-and-queues.md)** — кеш и rate limit, BullMQ, воркеры, ретраи, идемпотентность, graceful shutdown.

## Прод и архитектура

- **[Тестирование Node-приложений](./testing.md)** — unit, интеграционные и e2e тесты, supertest, моки, testcontainers, покрытие.
- **[Безопасность Node API](./security.md)** — helmet, CORS, rate limiting, инъекции, SSRF, секреты, OWASP API Top 10.
- **[Производительность и память](./performance.md)** — профилирование, `--inspect`, clinic, утечки памяти, event loop lag, нагрузочные тесты.
- **[Таймауты, ретраи и graceful shutdown](./reliability.md)** — таймауты, backoff, circuit breaker, SIGTERM, health checks, идемпотентность.
- **[Docker и деплой Node.js](./deployment.md)** — multi-stage образ, PID 1, лимиты памяти, PM2 и systemd, reverse proxy, zero-downtime.
- **[Архитектура Node-бэкенда](./architecture.md)** — слои, DI, репозитории, модульный монолит и микросервисы, версионирование API.
