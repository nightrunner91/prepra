# P3 — Инфраструктура, AI и качество (9 недель, 22 статьи)

Цель: довести профиль до «Product Engineer, который ведёт фичу до прода»:
AWS/Docker/наблюдаемость (CI/CD 41.5%, AWS 25.6%, Docker 25.6%), серверный AI
(29.3%), безопасность API и тестирование бэкенда.

Зависимости: P1 (сервис и БД), P2 (кейсы, куда встраивается инфраструктура).
Блокирует: P4 только по времени, не по смыслу.

Итог: 22 статьи в 6 существующих разделах, без новых разделов и миграций.

---

## 1. `build-and-deployment` → DevOps (+7, включая переезд)

Существующие 8 статей (orders 1–8) не трогаем. Переезд и новые:

| order | slug | title | L | Источник |
|---|---|---|---|---|
| 9 | `gitlab-ci-cd` | GitLab CI/CD для frontend-проектов | 3 | перенос из `testing/gitlab-ci-cd.md` |
| 10 | `cloud-basics-aws` | AWS-минимум: IAM, S3, ECS, RDS | 3 | новая |
| 11 | `observability` | Наблюдаемость: логи, метрики, трейсы, SLO | 4 | новая |
| 12 | `sentry-and-error-budget` | Sentry и error budget | 3 | новая |
| 13 | `kubernetes-lite` | Kubernetes: что реально нужно знать | 4 | новая |
| 14 | `secrets-and-environments` | Секреты и окружения в CI/CD | 3 | новая |
| 15 | `infra-cost` | Стоимость инфраструктуры | 4 | новая |

Содержание:
- **10** — IAM-минимум и почему root-ключи нельзя; S3 и presigned URL; ECS
  vs Lambda (когда что); RDS и сети в двух абзацах; что не учить (VPC-пиринг,
  сертификаты).
- **11** — три столпа; SLI/SLO/error budget; RED и USE; трассировка запроса
  от фронта до БД; алерты, которые не шумят.
- **12** — source maps и release health; группировка ошибок; алерты по
  регрессиям; связка с error budget и деплоем.
- **13** — pod/deployment/service; readiness/liveness; когда managed k8s
  оправдан, а когда ECS/Render; почему YAML не цель обучения.
- **14** — матрица окружений; secret manager vs .env; ротация; OIDC вместо
  долгоживущих ключей; секреты в PR и логах.
- **15** — из чего складывается счёт; egress и хранилище; бюджеты и алерты;
  как техническое решение превращается в $500/мес.

После переезда `testing` теряет `gitlab-ci-cd`: обновить README раздела и
cheatsheet, проверить входящие ссылки на этот файл.

---

## 2. `databases` (+3)

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 9 | `n-plus-one-and-pooling` | N+1, пул соединений и репликация | 4 | как N+1 прячется в ORM; eager vs lazy; `EXPLAIN` на 200 запросов; pool sizing; read-replica и lag; когда не нужна реплика |
| 10 | `redis-caching` | Redis и стратегии кэширования | 4 | cache-aside vs write-through; TTL и инвалидация; hot key; stampede и locks; что нельзя класть в кэш; Redis vs in-memory |
| 11 | `pgvector-and-nosql` | pgvector и когда нужен NoSQL | 4 | embeddings в Postgres; HNSW-индекс; hybrid search; когда Mongo документная модель выигрывает; цена денормализации |

---

## 3. `ai` (+5)

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 13 | `llm-server-proxy` | LLM на сервере: прокси, ключи, лимиты | 3 | почему ключ не во фронте; единая точка стриминга; таймауты и отмена; лимиты на пользователя; логирование без PII |
| 14 | `rag-pgvector` | RAG end-to-end на pgvector | 4 | chunking и метаданные; embeddings и стоимость; retrieval и hybrid; ре-ранк; citations и «не знаю»; обновление индекса |
| 15 | `evals` | Evals: как измерять качество AI-фич | 4 | датасет и разметка; метрики (точность, groundedness, latency); LLM-as-judge и его смещения; регрессии в CI; что считать успехом |
| 16 | `agents-tool-calling` | Агенты и tool-calling на сервере | 4 | схема инструментов; цикл вызова и лимит шагов; идемпотентность инструментов; sandbox и права; наблюдаемость трейсов |
| 17 | `ai-cost-latency` | Бюджеты: стоимость и задержка AI-фич | 4 | токены и цены; кэш промптов; стриминг vs ожидание; батчинг; деградация без модели; как считать unit-экономику |

Связка: `14` и `16` опираются на `databases/pgvector-and-nosql` и
`backend/layered-architecture`; `17` — на `backend/rate-limit-cache-idempotency`.

---

## 4. `security` (+3)

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 14 | `api-security` | OWASP API Top 10 | 4 | BOLA/BFLA на примерах; mass assignment; excessive data exposure; rate limit; инвентаризация эндпоинтов; тесты на авторизацию |
| 15 | `oauth-oidc-practice` | OAuth 2.0 и OIDC на практике | 4 | authorization code + PKCE; implicit почему мёртв; где хранить токены; refresh-rotation; logout и отзыв; типичные ошибки интеграции |
| 16 | `multi-tenant-isolation` | Multi-tenant изоляция данных | 5 | tenant context в запросе; row-level security; тесты «чужой tenant»; квоты; утечка через кэш и логи |

---

## 5. `testing` (+3, −1)

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 14 | `api-testing` | Тестирование API: fastify.inject и supertest | 3 | тест без сети; тестовая БД и транзакции; фабрики данных; контракт ответа; что не тестировать |
| 15 | `contract-testing` | Контрактные тесты и OpenAPI-diff | 4 | consumer-driven; Pact в двух абзацах; schema-diff в CI; breaking change detection; когда контракты избыточны |
| 16 | `testing-ai-features` | Тестирование AI-фич | 4 | недетерминизм; моки модели; snapshot-подход; evals vs unit-тесты; флаки и как их гасить |

После удаления `gitlab-ci-cd` перенумеровать оставшиеся 13 статей 1–13
(только `order`), затем добавить 14–16.

---

## 6. `performance` (+2)

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 9 | `backend-performance` | Производительность бэкенда | 4 | p95 вместо среднего; N+1 и индексы; кэш и пул; профилирование; k6 и нагрузочный тест; что оптимизировать первым |
| 10 | `performance-budget` | Performance budget в CI | 4 | бюджет на маршрут; Lighthouse CI и пороги; стоимость фичи в КБ; регрессии в PR; как не заблокировать разработку |

---

## 7. Интеграция

1. Обновить README шести разделов: новые статьи в правильные уровни
   («Углубись в детали» / «Не будет лишним»), порядок = `order`.
2. Пересобрать `CHEATSHEET.md` для `build-and-deployment`, `databases`,
   `ai`, `security`, `testing`, `performance` (скилл `generate-cheatsheet`).
3. `presets.ts`:
   - `product-engineer`: добавить `ai`, `build-and-deployment` (если ещё нет);
   - `backend`: добавить `build-and-deployment`;
   - новый `ai-native`: `[ai, backend, databases, security]`, mainSection `ai`.
4. `README.md` проекта: счётчики и описание (249 статей, AWS/AI в стеке).
5. Проверить входящие ссылки на `testing/gitlab-ci-cd.md` → новый путь.

---

## 8. Критерии приёмки P3

- [ ] 22 статьи по `article-spec.md`, `level`/`requires` заполнены
- [ ] `gitlab-ci-cd` переехал, ссылки обновлены, README `testing` без него
- [ ] README шести разделов в порядке `order`
- [ ] CHEATSHEET шести разделов пересобраны
- [ ] пресет `ai-native` собирается
- [ ] `npm run build` зелёный, битых ссылок 0
- [ ] `notes-api` задеплоен (шаги 13–15): S3, алерты, cost-оценка

## 9. Риски

| Риск | Решение |
|---|---|
| AWS-статья превращается в сертификационный курс | только то, что нужно для деплоя сервиса; «что не учить» — обязательная секция |
| AI-статьи устареют быстрее остальных | писать про протоколы и паттерны, не про версии SDK; в шапке — дата проверки |
| 22 статьи за 9 недель плотно | MVP: AWS, observability, llm-proxy, rag, evals, api-security = 6 ключевых |
| Переезд `gitlab-ci-cd` ломает ссылки | grep по `gitlab-ci-cd` перед переносом, redirect не нужен (внутренняя ссылка) |
