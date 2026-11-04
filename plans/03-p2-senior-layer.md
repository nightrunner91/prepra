# P2 — Senior-слой: System Design + практики (7 недель, 22 статьи)

Цель: закрыть senior-сигналы, которых у платформы нет вообще:
**code_review 43.9%**, **system_design 19.5%**, **mentoring 18.3%**,
**stakeholder 6.1%**. Это самая дешёвая фаза по словам и самая дорогая по
эффекту на найм.

Зависимости: P1 (кейсы опираются на `notes-api` и понимание БД).
Блокирует: `/tracks` (треки собираются из готовых статей P1+P2).

Итог: `architecture` → 22 статьи (9 существующих + 13 новых),
новый раздел `practices` (9 статей), страница `/tracks`, пресет
`system-design`.

---

## 1. Раздел `architecture` — System Design

### 1.1. Переименование и перенумерация

Label: «Архитектура и System Design». Id и URL **не меняются**.

Существующие 9 статей перенумеровать (меняется только `order`, ссылки не
зависят от него):

| order | файл | L | Куда в README |
|---|---|---|---|
| 1 | `dry-kiss-yagni-frontend.md` | 2 | Начни с базы |
| 2 | `mvc-mvvm-article.md` | 2 | Начни с базы |
| 3 | `solid-frontend.md` | 3 | Углубись в детали |
| 4 | `design-patterns.md` | 3 | Углубись в детали |
| 5 | `gof-patterns-frontend.md` | 3 | Углубись в детали |
| 6 | `design-patterns-vue.md` | 3 | Углубись в детали |
| 7 | `backend-for-frontend.md` | 4 | Углубись в детали |
| 8 | `monorepos.md` | 4 | Не будет лишним |
| 9 | `micro-frontends.md` | 4 | Не будет лишним |

### 1.2. Новые статьи (13)

| order | slug | title | L | requires | Что раскрыть |
|---|---|---|---|---|---|
| 10 | `scaling-basics` | Масштабирование: от одного сервера до CDN | 3 | — | вертикальное vs горизонтальное; stateless и сессии; балансировщик; CDN и edge; что ломается первым при росте ×10 |
| 11 | `caching-layers` | Кэширование: браузер, CDN, приложение, БД | 3 | scaling-basics | где живёт кэш; TTL vs инвалидация; Cache-Control/ETag и `stale-while-revalidate`; кэш в Redis; cache stampede |
| 12 | `queues-and-backpressure` | Очереди, асинхронность и backpressure | 4 | scaling-basics | зачем очередь; at-least-once и идемпотентность; backpressure и буферизация; приоритеты; когда очередь — оверинжиниринг |
| 13 | `consistency-and-idempotency` | Консистентность, идемпотентность и exactly-once | 5 | queues-and-backpressure | strong vs eventual; read-your-writes; идемпотентный ключ; дедупликация; почему exactly-once — миф (минимум два раза) |
| 14 | `rate-limiting-and-overload` | Rate limiting и защита от перегрузки | 4 | scaling-basics | token/leaky bucket и окна; per-user vs per-IP; 429 и Retry-After; load shedding; приоритеты трафика |
| 15 | `realtime-architecture` | Real-time архитектуры: fan-out и выбор транспорта | 4 | scaling-basics | WS vs SSE vs polling; sticky sessions vs pub/sub; fan-out и брокер; presence; порядок сообщений; переподключение |
| 16 | `resilience-patterns` | Отказоустойчивость: таймауты, circuit breaker, деградация | 4 | scaling-basics | бюджеты задержки; retry storm; breaker и half-open; bulkhead; degraded mode; chaos-тест на салфетке |
| 17 | `multi-tenancy` | Multi-tenancy и изоляция данных | 5 | consistency-and-idempotency | shared schema vs schema-per-tenant vs DB-per-tenant; tenant-id в каждом запросе; утечка данных; квоты и шумный сосед |
| 18 | `frontend-system-design` | Frontend system design: состояние, API компонентов, масштаб | 4 | solid-frontend | границы модулей; server state vs client state; контракт компонента; дизайн-система на 200 компонентов; когда монорепо |
| 19 | `case-feed` | Кейс: спроектировать ленту | 5 | caching-layers, queues-and-backpressure | требования и оценки; read-heavy; пагинация и стабильность; кэш и fan-out; что спросят дальше |
| 20 | `case-chat` | Кейс: спроектировать чат | 5 | realtime-architecture, consistency-and-idempotency | порядок сообщений; доставка и подтверждения; offline и синхронизация; presence; история и поиск |
| 21 | `case-metrics-dashboard` | Кейс: дашборд метрик в реальном времени | 5 | caching-layers, frontend-system-design | поток данных; агрегация на сервере vs клиент; окна и downsampling; виртуализация; бюджеты CWV |
| 22 | `case-ai-assistant` | Кейс: AI-ассистент с инструментами | 5 | realtime-architecture, ai/ai-ui-patterns | стриминг; tool-calling; таймауты и отмена; стоимость; guardrails; деградация без модели |

Формат кейсов: «требования → оценки → API → данные → масштаб → отказы →
что спросят дальше». Каждый — 2000–2500 слов, 1 схема (ASCII или mermaid,
если поддерживается рендером), 6–8 вопросов для самопроверки.

`requires` на статьи другого раздела указывать как `section/slug`
(например `ai/ai-ui-patterns`); в схеме поле остаётся массивом строк.

---

## 2. Новый раздел `practices` — 9 статей

README: «Начни с базы» 1, «Углубись в детали» 2–7, «Не будет лишним» 8–9.

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 1 | `code-review` | Code review: как ревьюить и как получать ревью | 2 | цель ревью; размер PR; чеклист (читаемость, границы, тесты, безопасность); тон комментариев; как просить ревью; антипаттерны (nitpicking, rubber stamp) |
| 2 | `adr-and-rfc` | ADR и RFC: как фиксировать решения | 3 | зачем писать; шаблон ADR; RFC для кросс-командных изменений; где хранить; как не превратить в бюрократию |
| 3 | `estimation-and-decomposition` | Оценка и декомпозиция задач | 3 | почему оценки врут; декомпозиция до ≤1 дня; неопределённость и буферы; story points vs время; как объяснить стейкхолдеру |
| 4 | `mentoring-and-onboarding` | Менторство и онбординг | 4 | рамка «объясни → сделай со мной → смотри → дай самому»; first-week план; обратная связь; как растить middle в senior; менторский кейс для интервью |
| 5 | `debugging-in-production` | Отладка в проде и разбор инцидентов | 4 | сначала стабилизировать, потом причина; гипотезы и бисекция; логи/трейсы/метрики; blameless postmortem; runbook и on-call |
| 6 | `stakeholder-communication` | Стейкхолдеры, требования и ожидания | 4 | как понять задачу до кода; вопросы к продукту; перевод технических рисков на язык бизнеса; письменная коммуникация; эскалация |
| 7 | `tech-debt-strategy` | Технический долг и стратегия рефакторинга | 4 | классификация долга; как измерить; boy scout rule vs big rewrite; strangler fig; как продать рефакторинг |
| 8 | `interviewing` | Как проходить интервью: STAR, live coding, system design | 3 | структура ответа; STAR для опыта; live coding вслух; как вести system design; вопросы работодателю; разбор фидбека |
| 9 | `ai-code-review` | AI-код: правила ревью и границы доверия | 4 | что можно генерировать; обязательная проверка (границы, безопасность, тесты); ответственность автора; политика в команде; метрики качества |

`market`: у `code-review` — 34.1 (weight 84); у остальных — не ставить,
вместо этого в README раздела пометить senior-сигналы.

---

## 3. Страница `/tracks` (кривая обучения как продукт)

### 3.1. Модель данных

`site/src/lib/tracks.ts`:

```ts
export interface TrackStep {
  week: number;
  title: string;
  articles: Array<{ section: string; slug: string }>;
  gate?: { label: string; interviewPreset?: string; practiceTopic?: string };
}
export interface Track {
  id: string;
  title: string;
  weeks: number;
  goal: string;
  market: string;       // «65.9% вакансий на React» и т.п.
  steps: TrackStep[];
}
```

### 3.2. Четыре трека

| id | Название | Недель | Состав |
|---|---|---|---|
| `product-engineer` | React Product Engineer | 12 | JS/TS выборочно → React L1–3 → Next.js → backend 1–8 → databases 1–5 → ai (UI-паттерны, стриминг) → testing → practices/code-review |
| `fullstack` | Full-stack | 20 | трек A + backend 9–15 + databases 6–11 + devops + security |
| `senior` | Senior / System Design | 8 | architecture 1–6 (повтор) → 10–22 + practices 1, 3, 4, 6 |
| `vue-legacy` | Vue (поддержка) | — | не публиковать на первом экране; ссылка на раздел `vue` |

Гейты: после каждого блока — пресет мок-интервью или набор практикума.
Для треков A/B — `product-engineer`, `backend`; для C — `system-design`.

### 3.3. Страница

`site/src/pages/tracks.astro` + пункт в сайдбаре над разделами (после
«Мок-интервью»). v1: статический список шагов с ссылками, бейдж недели,
гейт-блок. Прогресс по треку — **не** в v1; readiness (прочитано × вопросы ×
мок) — отдельная задача после P3.

### 3.4. Пресет `system-design`

`presets.ts`: sections `[architecture, backend, databases, build-and-deployment,
practices]`, mainSection `architecture`, count 50. Кейсы (19–22) дают вопросы
на L5, поэтому `answers` у них обязательны.

---

## 4. Интеграция

1. `config.ts`: += `practices` collection.
2. `sections.ts`: += `practices` (иконка `UsersThree`), группа `product`;
   `architecture` — новый label и `market` 13.4.
3. `[section]/index.astro`: += `practices`; label/description `architecture`.
4. `presets.ts`: += `system-design`; `ALL_SECTION_IDS` += `practices`.
5. `docs/architecture/README.md` — переписать под 22 статьи и три секции.
6. `docs/practices/README.md` + `CHEATSHEET.md`.
7. `README.md` проекта: разделы, счётчики, упоминание `/tracks`.

---

## 5. Критерии приёмки P2

- [ ] 13 новых статей `architecture` + 9 `practices`, все по `article-spec.md`
- [ ] 4 кейса содержат «требования → оценки → API → данные → масштаб → отказы»
- [ ] у кейсов 6–8 вопросов и столько же ответов
- [ ] README `architecture` отражает новую нумерацию 1–22
- [ ] `/tracks` собирается, 3 публичных трека, ссылки валидны
- [ ] пресет `system-design` собирается
- [ ] `npm run build` зелёный, битых ссылок 0
- [ ] `notes-api` доведён до шага 12 (наблюдаемость) — материал для кейсов

## 6. Риски

| Риск | Решение |
|---|---|
| System Design скатывается в теорию | каждый концепт-абзац привязан к `notes-api` или к кейсу |
| 13 статей за 7 недель — плотно | MVP: 6 концепций (10–15) + 2 кейса (19, 20) = 8, остальное в P3 |
| Кейсы дублируют друг друга | разные axis: лента = read-heavy, чат = ordering, дашборд = агрегация, ассистент = streaming+cost |
| `/tracks` расползается в продукт | v1 строго статический список; readiness — не раньше P4 |
