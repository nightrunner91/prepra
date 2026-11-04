# P1 — Бэкенд-ядро (7 недель, 23 статьи + 30 SQL-задач)

Цель: закрыть два самых больших нулевых пробела рынка — Node.js (weight 81,
34.1% вакансий) и PostgreSQL (60, 25.6%). После фазы у платформы есть второй
этаж: фронтендер может пройти путь «API → сервис → база → деплой» внутри PrePra.

Зависимости: P0 выполнен (реестр разделов, группы, redirects).
Блокирует: P2 (System Design без бэкенда — теория без кейсов) и P3 (DevOps/AI).

Итог: разделы `backend` (15 статей) и `databases` (8 статей), SQL-практикум,
2 новых пресета мок-интервью, 2 cheatsheet.

---

## 1. Spine-проект `notes-api`

Один проект, который растёт через все статьи раздела. Живёт **вне** репозитория
PrePra (отдельный git-репозиторий автора), в статьях — код и задачи.

Стек: Node 22, Fastify 5, zod, PostgreSQL 16, Drizzle ORM, Redis (опционально),
Vitest, Docker.

| Шаг | Что появляется | Статья |
|---|---|---|
| 01 | `GET /health`, структура проекта, env | `why-node-for-frontend` |
| 02 | CLI-скрипт, чтение/запись файлов, streams | `node-runtime` |
| 03 | HTTP-сервер на `node:http`, разбор запроса | `http-fundamentals` |
| 04 | Fastify, роутинг, схемы, error handler | `fastify-basics` |
| 05 | слои controller/service/repository, CRUD в памяти | `layered-architecture` |
| 06 | OpenAPI-контракт, коды ответов, пагинация | `rest-api-design` |
| 07 | регистрация, логин, refresh-rotation, роли | `auth-sessions-jwt-oauth` |
| 08 | загрузка аватара, cursor-пагинация, фильтры | `validation-files-pagination` |
| 09 | таймауты, ретраи, graceful shutdown | `errors-and-resilience` |
| 10 | очередь на экспорт заметок, dead letter | `background-jobs` |
| 11 | rate limit, ETag, Idempotency-Key | `rate-limit-cache-idempotency` |
| 12 | pino + request-id + OTel-трейсы | `observability-node` |
| 13 | `/v2`, deprecation-политика | `api-evolution` |
| 14 | переезд модуля на NestJS (сравнение) | `nestjs` |
| 15 | `GET /notes/stream` (SSE) + WS-канал | `realtime-server` |

Правило: в каждой статье блок `## Практика` ссылается на шаг и содержит
3–7 пунктов + критерии готовности.

---

## 2. Раздел `backend` — 15 статей

README: 3 секции («Начни с базы» 1–3, «Углубись в детали» 4–12,
«Не будет лишним» 13–15).

| order | slug | title | L | requires | Что раскрыть |
|---|---|---|---|---|---|
| 1 | `why-node-for-frontend` | Зачем фронтендеру Node.js | 1 | — | BFF, SSR, тулинг, скрипты, cron; где фронт заканчивается и начинается сервер; что спрашивают на интервью; карта раздела |
| 2 | `node-runtime` | Node.js: event loop, модули, streams | 2 | why-node-for-frontend | фазы libuv и почему `setTimeout` врёт; ESM vs CJS и `package.json`; `fs/promises`; streams и backpressure; буферы; `worker_threads` когда нужны |
| 3 | `http-fundamentals` | HTTP изнутри: запрос, ответ, идемпотентность | 2 | node-runtime | жизненный цикл запроса; заголовки и content negotiation; коды и их семантика; safe/idempotent; keep-alive; HTTP/2 и HTTP/3 в двух абзацах |
| 4 | `fastify-basics` | Fastify: роутинг, хуки и валидация | 3 | http-fundamentals | жизненный цикл хуков; схемы и сериализация; плагины и инкапсуляция; error handler; почему не Express (бенчмарк и типы) |
| 5 | `layered-architecture` | Слои в бэкенде: controller, service, repository | 3 | fastify-basics | границы слоёв; DTO и домен; почему ORM не течёт наружу; тестируемость; типичный «сервис на 800 строк» и как его распилить |
| 6 | `rest-api-design` | REST API design и OpenAPI-контракт | 3 | http-fundamentals | ресурсы и именование; формат ошибок (RFC 9457); пагинация; идемпотентность; OpenAPI-first и генерация типов для фронта |
| 7 | `auth-sessions-jwt-oauth` | Аутентификация: сессии, JWT, OAuth 2.0 | 3 | fastify-basics, rest-api-design | cookie vs Authorization; refresh-rotation и отзыв; OIDC и PKCE; RBAC/ABAC; типичные дыры (alg=none, localStorage) |
| 8 | `validation-files-pagination` | Валидация, файлы и пагинация | 3 | fastify-basics | zod на границе; multipart и presigned S3; cursor vs offset; фильтры и сортировка; лимиты размера и MIME |
| 9 | `errors-and-resilience` | Ошибки и отказоустойчивость сервиса | 4 | layered-architecture | таксономия ошибок; таймауты и бюджеты; ретраи с backoff и jitter; circuit breaker; graceful shutdown; health/readiness |
| 10 | `background-jobs` | Очереди и фоновые задачи | 4 | layered-architecture | at-least-once и почему не exactly-once; идемпотентный обработчик; BullMQ; dead letter и ретраи; cron и прогресс |
| 11 | `rate-limit-cache-idempotency` | Rate limiting, кэш и идемпотентность | 4 | rest-api-design, background-jobs | token bucket в Redis; 429 и Retry-After; Cache-Control/ETag; Idempotency-Key; кэш и инвалидация на сервере |
| 12 | `observability-node` | Логи, метрики и трейсы в Node | 4 | errors-and-resilience | structured logs и request-id; RED-метрики; OTel и контекст; что логировать нельзя (PII); как связать фронт и бэк по trace |
| 13 | `api-evolution` | Версионирование и эволюция API | 5 | rest-api-design | breaking changes; expand-contract; deprecation и Sunset; consumer-driven contracts; как не плодить `/v2` |
| 14 | `nestjs` | NestJS: модули, DI и guards | 5 | layered-architecture | когда Nest оправдан; DI и тесты; guards/interceptors/pipes; сравнение с Fastify-плагинами; цена абстракций |
| 15 | `realtime-server` | Real-time на сервере: WS, SSE и стриминг LLM | 5 | http-fundamentals, background-jobs | WS vs SSE vs polling; масштабирование через pub/sub; backpressure; отмена запроса; проксирование LLM-стрима |

Теги: первый тег = главная тема (`fastify`, `auth`, `bullmq`, `opentelemetry`…),
дальше 2–5 связанных терминов. `market`: 34.1 у статей 1 и 6, у остальных можно
не ставить.

---

## 3. Раздел `databases` — 8 статей в P1 (3 остаются на P3)

Пишется после backend-шагов 01–06: схема заметок уже существует.

| order | slug | title | L | requires | Что раскрыть |
|---|---|---|---|---|---|
| 1 | `sql-basics` | SQL за неделю: SELECT, JOIN, GROUP BY | 2 | — | реляционная модель за 5 минут; SELECT/WHERE/ORDER/LIMIT; виды JOIN и когда какой; агрегаты и HAVING; NULL-ловушки |
| 2 | `types-null-constraints` | Типы, NULL и ограничения в PostgreSQL | 2 | sql-basics | числовые/строковые/временные типы; `timestamptz`; NOT NULL, UNIQUE, CHECK, FK; `ON DELETE`; почему constraints — документация схемы |
| 3 | `window-functions` | Оконные функции и аналитика в SQL | 3 | sql-basics | `OVER` и партиции; `row_number/rank/lag/lead`; running total; оконки vs GROUP BY; топ-N в группе |
| 4 | `schema-design` | Схема и нормализация: от требований к таблицам | 3 | types-null-constraints | 1NF–3NF на примере заметок; когда денормализовать; связи many-to-many; soft delete; аудит-поля; нейминг |
| 5 | `indexes` | Индексы: B-tree, составные и частичные | 3 | schema-design | как устроен B-tree; порядок колонок в составном; покрывающий индекс; partial и expression; цена записи; когда индекс не нужен |
| 6 | `explain-analyze` | EXPLAIN ANALYZE: читаем план запроса | 4 | indexes | seq scan vs index scan; rows vs actual rows; buffers; стоимость; как найти медленный запрос; `pg_stat_statements` |
| 7 | `transactions-isolation` | Транзакции и уровни изоляции | 4 | schema-design | ACID без мифов; read committed vs repeatable read vs serializable; аномалии (dirty/non-repeatable/phantom); deadlock и retry; `SELECT FOR UPDATE` |
| 8 | `migrations` | Миграции: Prisma, Drizzle, Knex | 4 | schema-design | миграции как код; forward-only; zero-downtime (expand-contract); откат и бэкапы; drizzle-kit на практике |

P3 добавит: `n-plus-one-and-pooling`, `redis-caching`, `pgvector-and-nosql`.

---

## 4. SQL-практикум (30 задач)

Цель: оживить `/practice`, который сейчас только про базовый JS.

**Изменения типов** (`site/src/lib/practice/types.ts`):
- `TopicId` += `"sql"`;
- `TaskBase` += `language?: "js" | "sql"` (для подсветки) — по умолчанию `"js"`.

**`CodeBlock.tsx`**: проп `language`, отдельный набор SQL-ключевых слов
(`SELECT, FROM, WHERE, JOIN, ON, GROUP, ORDER, LIMIT, INSERT, UPDATE, DELETE,
WITH, OVER, PARTITION, EXPLAIN, ANALYZE, CREATE, INDEX`) и комментарии `--`.
Если это дороже 60 строк — ограничиться меткой «SQL» без подсветки, но
`language` в типе оставить.

**`data/sql.ts`**: 30 задач `kind: "choice"` (проверять результат запроса,
выбор индекса, поведение транзакции). Распределение:

| Тема | Задач | Сложность |
|---|---|---|
| SELECT, фильтры, NULL, ORDER/LIMIT | 4 | junior 4 |
| JOIN (inner/left/full, self) | 5 | junior 2, middle 3 |
| GROUP BY, HAVING, агрегаты | 4 | junior 1, middle 3 |
| Подзапросы, CTE, EXISTS | 3 | middle 2, senior 1 |
| Оконные функции | 3 | middle 1, senior 2 |
| Индексы и EXPLAIN | 4 | middle 2, senior 2 |
| Транзакции и изоляция | 3 | senior 3 |
| Схема и нормализация | 4 | junior 2, middle 2 |

Регистрация: `topics.ts` (id `sql`, label «SQL и PostgreSQL», color `blue`),
`index.ts` (импорт + массив `TASKS`). Валидация id и индексов ответов уже есть
в `validateTasks` — обойти нельзя.

`article` в задаче — ссылка на статью раздела `databases`:
`{ href: "/databases/sql-basics", label: "SQL: SELECT, JOIN, GROUP BY" }`.

---

## 5. Интеграция раздела

Один PR на раздел (или на пару статей, но реестр — сразу):

1. `site/src/content/config.ts`: `backend`, `databases` в enum + collections.
2. `site/src/lib/sections.ts`: добавить в конец `frontend`/`backend` группы
   согласно целевому порядку; иконки `Terminal` и `Database`; `market` 34.1 / 25.6.
3. `site/src/pages/[section]/index.astro`: `getStaticPaths` += 2 раздела с
   label и description.
4. `site/src/lib/mock-interview/presets.ts`:
   - `ALL_SECTION_IDS` += `backend`, `databases`;
   - пресет `backend`: `[backend, databases, api-communication]`,
     mainSection `backend`, count 50;
   - пресет `product-engineer`: `[react, nextjs, backend, databases,
     api-communication, testing]`, mainSection `react`, count 50
     (заменяет `react-fullstack` из P0);
   - README проекта: актуальное число пресетов.
5. `docs/backend/README.md`, `docs/databases/README.md` — по шаблону из
   `article-spec.md` §4.
6. `CHEATSHEET.md` для обоих разделов — скилл `generate-cheatsheet`.
7. `README.md` проекта: разделы, счётчики (статей и вопросов), стек примеров.

---

## 6. Критерии приёмки P1

- [ ] 15 статей `backend` + 8 статей `databases`, все по `article-spec.md`
- [ ] у каждой статьи `level`, `requires`, `project: notes-api`, `questions == answers`
- [ ] README разделов: 3 секции, порядок ссылок = `order`
- [ ] CHEATSHEET обоих разделов сгенерированы и содержат только термины
- [ ] 30 SQL-задач, `npm run build` проходит валидацию (`TopicId` расширен)
- [ ] пресеты `backend` и `product-engineer` собираются в мок-интервью
- [ ] главная показывает 15 разделов и корректные счётчики
- [ ] битых ссылок 0
- [ ] `notes-api` доведён минимум до шага 08, каждый шаг — тег в git

## 7. Риски и решения

| Риск | Решение |
|---|---|
| Статьи расползаются по объёму (5k слов) | жёсткий лимит из `article-spec.md`: L3 2000–2800, L4 2000–2800 |
| SQL-задачи дублируют статьи | задача проверяет один тезис статьи, `explanation` = 1–2 предложения + ссылка |
| `TopicId` ломает сохранённый прогресс | ключи localStorage — id задач, новый topic безопасен; проверить `storage.ts` |
| Раздел `backend` выглядит как «ещё один курс по Node» | держать фокус Product Engineer: каждая статья отвечает «зачем это фронтендеру» |
| Нет времени на 23 статьи | MVP: 10 backend + 6 databases, порядок 1–6 и 1–5; остальное — в P3 |
