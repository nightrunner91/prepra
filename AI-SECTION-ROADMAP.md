# Roadmap: раздел `docs/ai` — практическая переработка под 2026

Этот документ — исполняемый план постепенной интеграции 8 новых статей в раздел
«AI и LLM в разработке». Он написан так, чтобы агент мог читать его перед каждой
итерацией и **создавать по одной статье за раз**, не теряя контекст.

> **Главное правило: одна итерация — одна статья.** Не писать несколько статей за
> проход. После каждой статьи обновить чек-трекер (раздел 9) и отчитаться списком
> изменённых файлов.

---

## 0. Как пользоваться документом (инструкция агенту)

Перед каждой новой статьёй:

1. **Прочитай этот документ целиком** (он короткий по структуре, но обязательный).
2. **Прочитай спецификацию статьи** из раздела 6 (её `order`, заголовок, описание,
   теги, `questions`, план секций, ключевые факты, источники, анти-дублирование).
3. **Прочитай стандарт формата** раздела:
   - `.agents/skills/article-format/SKILL.md` — обязательный формат.
   - `.agents/skills/article-focus/SKILL.md` — если тезисы/вопросы получились
     «мелкими» или их слишком много.
   - 1–2 соседние статьи раздела (`mental-model.md`, `dev-workflow.md`), чтобы
     держать единый тон, глубину и не повторяться.
4. **Исследуй тему в интернете**, если спецификация этого требует (раздел 6).
   Предпочитай источники 2025–2026 годов. Используй банк источников (раздел 10)
   как отправную точку. **Не выдумывай URL** — бери только реально найденные и
   проверенные ссылки.
5. **Напиши ровно одну статью** по формату.
6. **Самопроверка** (см. раздел 5, пункт «Definition of Done статьи»).
7. **Обнови чек-трекер** (раздел 9): поставь `[x]`.
8. **Если статья заменяет старую** (`streaming-ui.md` / `features-frontend.md`) —
   удали старую **только после** того, как новая написана и прочитана.
9. **Отчитайся**: путь новой статьи, что сделано, какие старые файлы затронуты.

Ограничения проекта (уже действуют):
- **Никакой визуальной/браузерной проверки** UI (см. `.opencode/instructions.md`).
- Все временные артефакты — в `.tmp/`.
- Язык статей — русский. Термины (Claude Code, MCP, eval) не переводить насильно.

---

## 1. Цель

Раздел `docs/ai` сейчас наполовину теоретический. Нужно добавить **актуальные
практические знания на 2026 год** про применение AI во фронтенд-разработке:
агентское программирование, инструменты (Claude Code / Codex / Cursor / OpenCode),
контекст-инжиниринг, MCP, старт новых проектов, рефакторинг легаси, интеграцию и
контроль AI-фич в проде, evals, наблюдаемость, безопасность AI-кода.

Не нужны статьи про «что такое токен» и «как писать промпт» — это уже есть в базе.

---

## 2. Текущее состояние раздела

| order | файл | судьба |
|-------|------|--------|
| 1 | `mental-model.md` | **оставить** |
| 2 | `prompting-patterns.md` | **оставить** |
| 3 | `dev-workflow.md` | **оставить, убрать дубли** (см. 3.3) |
| 4 | `streaming-ui.md` | **удалить** после выхода `ai-ui-patterns.md` |
| 5 | `features-frontend.md` | **удалить** после выхода `ai-features-production.md` |
| 6 | `security.md` | **оставить**, перенумеровать (см. 3.4) |

Раздел маленький (7 файлов), поэтому новые статьи получают `order` 4..12, а
существующий `security.md` перенумеровывается в конец.

---

## 3. Что делать с существующими файлами

### 3.1. `streaming-ui.md` → удалить
Причина: устаревший фокус — только UX текстового чата. Нет tool-calling UI,
generative UI, human-in-the-loop, multi-step агентов, состояний агента.
Замена — `ai-ui-patterns.md` (order 9).
**Удалять только после того, как `ai-ui-patterns.md` написан.**

### 3.2. `features-frontend.md` → удалить
Причина: размытая статья (продуктовая вода + базовая архитектура), дублирует
`streaming-ui` и `security`. Полезное (архитектура клиент→сервер→LLM, критерии
приёмки) переносится в `ai-features-production.md` (order 10).
**Удалять только после того, как `ai-features-production.md` написан.**

### 3.3. `dev-workflow.md` → оставить, убрать дубли
Оставляем как статью про **методологию SDD** (спецификация → генерация →
проверка, Spec-Driven Development, где AI силён/ненадёжен, вайбкодинг).
После выхода `context-engineering.md`:
- Секцию про **AGENTS.md** сократить до короткого указателя: «постоянные
  инструкции агента — отдельная тема, см. `context-engineering.md`».
- Не удалять остальные секции. Цель — убрать дублирование, не сломать статью.

### 3.4. `security.md` → оставить
Тема — безопасность **вывода** модели (XSS, DOMPurify, валидация URL). Это
отдельная большая тема, не путать с `ai-code-security.md` (безопасность кода,
сгенерированного моделью: supply chain, slopsquatting, injection в агента).
Перенумеровать `order` 6 → 11. Тело не трогать.

---

## 4. Целевой порядок и финальный состав

После завершения всех итераций `docs/ai` выглядит так:

| order | файл | статус |
|-------|------|--------|
| 1 | `mental-model.md` | существующий |
| 2 | `prompting-patterns.md` | существующий |
| 3 | `dev-workflow.md` | существующий (подрезан) |
| 4 | `agentic-coding-tools.md` | **новая** |
| 5 | `context-engineering.md` | **новая** |
| 6 | `mcp.md` | **новая** |
| 7 | `greenfield-with-ai.md` | **новая** |
| 8 | `legacy-refactoring-with-ai.md` | **новая** |
| 9 | `ai-ui-patterns.md` | **новая** (заменяет `streaming-ui.md`) |
| 10 | `ai-features-production.md` | **новая** (заменяет `features-frontend.md`) |
| 11 | `security.md` | существующий (перенумерован 6 → 11) |
| 12 | `ai-code-security.md` | **новая** |

> Финальную нумерацию можно прогнать через skill `arrange` (`/arrange ai`), если
> после написания покажется, что порядок лучше поменять. Источник истины — поле
> `order` во frontmatter.

Группы для `README.md`:
- **Начни с базы:** 1–3.
- **Агентская разработка:** 4–6.
- **Проекты: с нуля и легаси:** 7–8.
- **AI во фронтенде:** 9–10.
- **Безопасность:** 11–12.

---

## 5. Общие правила для каждой статьи

### Формат (обязательно, по `article-format`)

Frontmatter:

```yaml
---
title: "..."            # ≤ 6 слов, без шаблонных фраз
section: ai
description: "..."      # 1–3 предложения, ≤ ~160 символов, без TOC
order: N                # из раздела 4
tags: [...]             # 3–6 существительных/терминов, первый — главная тема
questions:              # 5–10 вопросов, покрывают всю статью
  - "..."
  - "..."
---
```

Тело:
1. H1 = `title`.
2. Вводная 2–4 предложения (что/зачем/что узнает читатель). Не начинать с
   «X — это...».
3. `## Содержание` — нумерованный список с якорями на `##` + `---`.
4. Основные секции `##` (и `###` внутри) с таблицами, код-блоками, сравнениями.
5. `## Ключевые тезисы для интервью` — 6–12 пунктов, покрывают всю статью.
6. `## Заключение` — 3–7 предложений/пунктов.
7. `## Полезные ссылки` — только реальные проверенные URL.

Поля `questions` и `answers` заполнять обязательно: `answers` — по одному ответу на
каждый вопрос (правила — в skill `generate-answers`). Ответы должны совпадать по
количеству с вопросами и опираться на содержание статьи.

### Тон и глубина
- Как в существующих статьях: практично, с таблицами, «плохо/хорошо», case study,
  чек-листами, тезисами «для интервью».
- Ориентир на реальные собеседования Middle/Senior FE и на то, что реально
  применяется в 2026.
- Не выдумывать факты и API. Всё, что утверждается (названия RFC/спек, версии,
  цифры), должно опираться на найденный источник.

### Анти-дублирование
- Не повторять содержание `mental-model.md` (токены, контекстное окно,
  температура) и `prompting-patterns.md` (few-shot, CoT, chaining) — максимум
  короткая ссылка.
- `context-engineering.md` не дублирует `dev-workflow.md`: там методология, здесь
  устройство контекста агента (rules/skills/hooks/subagents/MCP/compaction).
- `ai-features-production.md` не дублирует `security.md`: там про рендер вывода и
  XSS, здесь про эксплуатацию (стоимость, evals, наблюдаемость, деградация).
- `ai-code-security.md` не дублирует `security.md`: там вывод LLM → DOM, здесь
  AI-сгенерированный код → supply chain / agents / injection.

### Definition of Done статьи
- [ ] Frontmatter валиден, `order` совпадает с разделом 4.
- [ ] Вводная, TOC, секции, тезисы, заключение, ссылки на месте.
- [ ] `questions` 5–10, покрывают статью, без повторов и «точечности».
- [ ] `answers` заполнены, количество совпадает с `questions`, нет пустых ответов.
- [ ] Якоря в TOC совпадают с заголовками.
- [ ] Все внешние ссылки реальные и открыты/проверены.
- [ ] Нет дублирования с соседними статьями раздела.
- [ ] Статья прочитана целиком после написания (вычитка на связность).
- [ ] Чек-трекер (раздел 9) обновлён.

---

## 6. Спецификации статей

Порядок написания = возрастание `order` (4 → 12). Исключение: `security.md`
(order 11) уже есть — его не пишем, только перенумеровываем.

---

### Статья 4. `agentic-coding-tools.md`

- **title (черновик):** `Агентские инструменты разработки`
- **description (черновик):** Устройство агентских кодинг-инструментов —
  Claude Code, Codex, Cursor, OpenCode: agent loop, инструменты, права, песочница,
  worktrees, subagents, plan mode, headless-режим и параллельные агенты.
- **tags:** `["ai-agents", "claude-code", "codex", "cursor", "opencode", "agent-loop"]`
- **questions (черновик):**
  - Как устроен цикл работы агента (ReAct: thought → tool → observation)
  - Чем агент отличается от автодополнения в редакторе
  - Как инструменты и права (permissions/approval) влияют на безопасность
  - Зачем нужны git worktrees и изоляция агентских сессий
  - Что такое subagents и когда их использовать вместо одного диалога
  - Что такое plan mode и почему планирование до кода повышает качество
  - Как запускать агента без человека (headless) в CI и по расписанию
  - Когда выбирать terminal-first инструмент, а когда IDE
  - Как параллельные агенты меняют процесс ревью

- **План секций (##):**
  1. **Цикл агента: thought → tool → observation** — почему это loop, а не один
     запрос; чем отличается от автокомплита и «чата про код».
  2. **Инструменты и права** — tool calling (кто выполняет код: выполняет ваша
     среда, модель лишь эмитит запрос); approval/permissions; sandbox; хуки
     PreToolUse/PostToolUse (форматирование, блокировка опасных команд).
  3. **Контекст и изоляция сессии** — worktrees, отдельные ветки, почему каждый
     агент работает в изолированной копии.
  4. **Subagents и параллельность** — делегирование, свои контексты/права,
     параллельные агенты, «многоагентность = distributed systems».
  5. **Plan mode и постановка задачи** — read-only до approve; «сначала план,
     потом код».
  6. **Headless и CI** — запуск агента в пайплайне, авто-ревью, скрипты.
  7. **Сравнение инструментов** — таблица Claude Code / Codex / Cursor / OpenCode:
     интерфейс (terminal/IDE/cloud), сильные стороны, когда что брать.
  8. **Практики и антипаттерны** — что делегировать агенту, что нет; гигиена
     сессий; стоимость.
  9. **Кейс** — короткий сценарий: задача → план → агент → ревью.
  10. **Ключевые тезисы для интервью**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - ReAct-цикл; модель **не выполняет** код самa — она эмитит structured tool call,
    выполняет ваша среда (важно для интервью).
  - Multi-agent модели Claude Code (subagents / agent view / agent teams /
    manual worktrees) — 4 модели параллелизма.
  - Worktree-изоляция; hooks (auto-format, блок опасных действий).
  - «Agentic search (glob+grep) beats RAG» для навигации по коду.
- **Источники (проверить и открыть перед написанием):** Cursor «Best practices
  for coding with agents» (2026-01), OpenAI Codex docs / prompting guide,
  dev.to «Parallel AI coding agents in 2026», Claude Code docs.
- **Анти-дублирование:** не описывать AGENTS.md/скиллы детально (это статья 5);
  не описывать MCP (статья 6).

---

### Статья 5. `context-engineering.md`

- **title (черновик):** `Контекст-инжиниринг агентов`
- **description (черновик):** Как наполнять контекст AI-агента: rules/AGENTS.md,
  skills, hooks, subagents, memory, compaction и MCP — что где держать и почему
  это важнее формулировки отдельного промпта.
- **tags:** `["context-engineering", "agents-md", "skills", "hooks", "subagents", "mcp"]`
- **questions (черновик):**
  - Чем context engineering отличается от prompt engineering
  - Что такое rules-файл (AGENTS.md/CLAUDE.md) и что в него класть
  - Что такое skills/slash-commands и почему они заменили ручные промпты
  - Зачем нужны hooks и как они автоматизируют проверки
  - Что такое memory и compaction контекста, когда окно переполняется
  - Почему «agentic search» часто лучше RAG по кодовой базе
  - Как разложить постоянное и одноразовое между rules, skills и задачей
  - Какие признаки раздутого AGENTS.md
  - Почему эффект контекст-файлов не гарантирован (данные исследований)

- **План секций (##):**
  1. **От промпта к контексту** — context engineering как управление всей
     информационной средой агента, не одной инструкцией.
  2. **Источники контекста** — таблица: rules-файл, skills, slash-commands,
     hooks, subagents, MCP, memory, открытые файлы. Для каждого: кто загружает,
     когда, зачем.
  3. **Rules / AGENTS.md** — что класть (стек, команды, соглашения, запреты,
     стандарты качества), что не класть; признаки раздутого файла.
  4. **Skills и команды** — переиспользуемые workflow; почему навык ≈ команда.
  5. **Hooks** — детерминированные проверки в цикле агента (auto-format,
     security-scan, блокировка).
  6. **Subagents** — изоляция контекста для подзадач.
  7. **Управление окном** — compaction, «lost in the middle» применительно к
     агенту, что держать в начале/конце.
  8. **Agentic search vs RAG для кода** — почему grep/glob часто выигрывает у
     векторного retrieval в репозитории.
  9. **Не переусердствовать** — данные исследований о том, что контекст-файлы
     не панацея (эффект ≤ 10–15 п.п., разница в эффективности, а не всегда в
     корректности); собирать контекст итеративно.
  10. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - Категории: instructions / guidance (rules) / skills / hooks.
  - Правило «постоянное → rules/skills, одноразовое → задача».
  - Compaction истории; Tool Search Tool у Claude Code (оптимизация контекста).
  - Данные: исследования MSR-2026 и ablation-исследования — эффект контекстных
    файлов неоднозначен; аккуратные формулировки.
- **Источники:** Martin Fowler «Context Engineering for Coding Agents» (01.2026),
  «Harness engineering for coding agent users» (04.2026), arXiv:2510.21413
  (MSR 2026), arXiv:2607.27250 (ablation study, 2026).
- **Анти-дублирование:** методология SDD — в `dev-workflow.md`; детали работы
  конкретных инструментов — в статье 4; MCP как протокол — в статье 6.
- **Доп. действие:** после статьи подрезать секцию AGENTS.md в `dev-workflow.md`
  (см. 3.3).

---

### Статья 6. `mcp.md`

- **title (черновик):** `MCP: Model Context Protocol`
- **description (черновик):** Зачем нужен Model Context Protocol, как устроены
  серверы, клиенты и примитивы (tools, resources, prompts), что изменилось в
  спецификации 2026 и как фронтендер использует MCP (Figma, Playwright, DevTools).
- **tags:** `["mcp", "model-context-protocol", "tool-calling", "figma-mcp", "agent-tools"]`
- **questions (черновик):**
  - Какую проблему решает MCP (N×M интеграций) и чем он отличается от обычного API
  - Что такое host, client и server в MCP
  - Какие примитивы предоставляет сервер: tools, resources, prompts
  - Как работает транспорт (Streamable HTTP) и что такое stateless-ядро протокола
  - Что такое tool poisoning и почему описания инструментов — вектор атаки
  - Как согласие пользователя и права встроены в протокол
  - Как MCP связан с function calling и почему это не одно и то же
  - Где во фронтенд-работе применяются MCP-серверы (Figma, Playwright, DevTools)
  - Что изменилось в спецификации 2026-07-28 (сессии, MRTR, Tasks)

- **План секций (##):**
  1. **Проблема N×M** — до MCP каждый клиент интегрируется с каждым инструментом
     вручную; MCP делает N+M.
  2. **MCP vs обычный API / function calling** — LLM обнаруживает и вызывает
     инструменты в рантайме; API пишут для разработчика.
  3. **Архитектура** — host / client / server; JSON-RPC 2.0.
  4. **Примитивы сервера** — tools (actions), resources (context), prompts
     (templates); клиентские фичи (elicitation, sampling — аккуратно про депрекации).
  5. **Транспорты и эволюция** — stdio, Streamable HTTP; stateless-ядро в
     спецификации 2026-07-28, отказ от session id, `server/discover`, MRTR, Tasks.
  6. **Безопасность** — tool poisoning, prompt injection через описания/ресурсы,
     consent и авторизация, песочница, аудит; MCP как новый supply-chain-узел.
  7. **MCP во фронтенд-работе** — Figma MCP (design→code и code→canvas), браузерные
     MCP (Playwright), Chrome DevTools MCP: где реально ускоряет.
  8. **Как поднять свой MCP-сервер** — 2–3 строки про SDK (TypeScript), идея
     «выставить внутренний сервис как MCP».
  9. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - Примитивы: tools/resources/prompts; JSON-RPC 2.0.
  - Спека 2026-07-28: stateless core, retired `initialize`/`Mcp-Session-Id`,
    Streamable HTTP + заголовки `Mcp-Method`/`Mcp-Name`, Tasks-расширение, MRTR.
  - MCP ≠ замена RAG (RAG — retrieval, MCP — действия).
  - Security: user consent, tool safety, injection через tool descriptions.
- **Источники:** modelcontextprotocol.io (spec 2026-07-28 + blog), Anthropic MCP
  docs, Figma MCP docs, DataCamp «MCP interview questions» (2026).
- **Анти-дублирование:** конкретные кодинг-инструменты — статья 4; skills/hooks —
  статья 5.

---

### Статья 7. `greenfield-with-ai.md`

- **title (черновик):** `Старт проекта с AI`
- **description (черновик):** Как запускать новый проект с AI-агентами:
  Spec-Driven Development на практике (Spec Kit), plan mode, скаффолдинг,
  design-to-code через Figma MCP и v0, настройка правил агента с первого коммита.
- **tags:** `["greenfield", "spec-driven-development", "spec-kit", "scaffolding", "design-to-code"]`
- **questions (черновик):**
  - Как Spec-Driven Development применяется к новому проекту
  - Что такое constitution / spec / plan / tasks в GitHub Spec Kit
  - Почему планирование до генерации кода критично
  - Как агент получает контекст на старте (AGENTS.md с первого коммита)
  - Что можно делегировать агенту при выборе стека и версий, а что нет
  - Как работает design-to-code (Figma MCP, v0) и где он ломается
  - Какие артефакты (спеки, планы, задачи) стоит версионировать
  - Что такое «spec quality = output quality» на практике
  - Какие шаги bootstrap нового репозитория под агента

- **План секций (##):**
  1. **Почему старт проекта — отдельная задача** — greenfield ≠ prompt «сделай
     приложение»; нужен spec-first.
  2. **SDD на практике** — Specify → Plan → Tasks → Implement → Validate;
     constitution как правила проекта.
  3. **Spec Kit** — `constitution.md`, `spec.md` (что), `plan.md` (как),
     `tasks.md` (чеклист); интеграция с разными агентами.
  4. **Plan mode и human-in-the-loop** — ревью плана до генерации кода.
  5. **Bootstrap репозитория** — AGENTS.md, команды, структура каталогов, CI,
     первый набор правил (ссылка на `context-engineering.md`).
  6. **Design-to-code** — Figma MCP (design context, Code Connect, tokens), v0;
     почему качество зависит от порядка в дизайн-системе.
  7. **Стек и версии** — где агент надёжен (типовые стеки, boilerplate), а где
     нужен человек (архитектурные трейдоффы, свежие версии).
  8. **Кейс** — новый проект от конституции до первого PR.
  9. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - SDD-фазы; Spec Kit v1.0 (2026) с интеграциями/расширениями/пресетами.
  - Figma MCP: design tokens, Code Connect, code→canvas; честно про ограничения.
  - «Spec quality = output quality».
- **Источники:** github/spec-kit (history v1.0), Microsoft Learn / Microsoft for
  Developers про SDD & Spec Kit, Figma MCP docs, v0 Figma docs.
- **Анти-дублирование:** методология SDD — `dev-workflow.md` (здесь — именно
  применение к старту); контекст — статья 5; MCP-протокол — статья 6.

---

### Статья 8. `legacy-refactoring-with-ai.md`

- **title (черновик):** `Рефакторинг легаси через AI`
- **description (черновик):** Практика агентного рефакторинга легаси: тесты
  фиксации поведения, связка codemod + AI, инкрементальные миграции, изоляция
  worktree и хуки, где агент надёжен, а где ломает неявные инварианты.
- **tags:** `["legacy", "refactoring", "brownfield", "characterization-tests", "codemod", "migration"]`
- **questions (черновик):**
  - Почему легаси-рефакторинг с AI отличается от greenfield
  - Что такое characterization-тесты и почему они идут первыми
  - Как сочетать codemod и AI в одной миграции
  - Какие инструменты изоляции (worktrees, hooks) защищают кодовую базу
  - Какие виды рефакторинга агент делает надёжно, а какие ломает
  - Почему агент «мусорит» неявные инварианты и как это ловить
  - Как строить инкрементальную миграцию вместо big bang
  - Как оценивать безопасность агентного рефакторинга в PR
  - Какие метрики (LOC, тесты) говорят, что миграция идёт правильно

- **План секций (##):**
  1. **Brownfield ≠ greenfield** — нет тестов, неявные контракты, «скорость без
     корректности = техдолг со скоростью AI».
  2. **Characterization-тесты первыми** — зафиксировать текущее поведение до
     изменений (приём из `dev-workflow`/`mental-model`, но здесь — как шаг
     миграции).
  3. **Гибрид codemod + AI** — детерминированный codemod для механического,
     AI для смыслового; пример пайплайна (анализ → AI-pass → codemod → тесты).
  4. **Изоляция и защита** — worktrees на агентскую сессию, хуки на опасные
     директории (крипто, платежи, миграции), PR-чеклист для агентских диффов.
  5. **Что надёжно, что нет** — таблица: механический/структурный/семантический/
     performance-рефакторинг; локализованность и консервативность агентов.
  6. **Инкрементальность** — миграция по компонентам/модулям, ветка на единицу,
     оценка value vs complexity.
  7. **Ревью агентских диффов** — «смотри, чего не хватает»; размер диффа; тесты
     как страховка.
  8. **Кейс** — миграция компонента (например, Options → Composition API или
     Ember → React): план, стадии, тесты, результат.
  9. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - Агенты склонны к локализованным/консервативным правкам, редко трогают
    дизайн-уровень (данные исследования).
  - Гибрид AI + codemod; тесты как oracle.
  - Worktree + hooks + PR-ревью как операционные паттерны brownfield.
- **Источники:** arXiv:2511.04824 (Agentic Refactoring, 2025), Qonto Medium
  «AI-Driven Refactoring in Large-Scale Migrations», Cisco ThousandEyes (06.2026),
  «Brownfield refactoring with AI agents: patterns» (2026), Red Hat agent-mesh
  (03.2026).
- **Анти-дублирование:** общая методология — `dev-workflow.md`; инструменты —
  статья 4.

---

### Статья 9. `ai-ui-patterns.md` *(заменяет `streaming-ui.md`)*

- **title (черновик):** `AI UI: стриминг и generative UI`
- **description (черновик):** Паттерны интерфейсов AI-продуктов: стриминг,
  tool-calling UI, generative UI, human-in-the-loop подтверждения и состояния
  многошагового агента — на примере Vercel AI SDK.
- **tags:** `["ai-ui", "streaming", "generative-ui", "tool-calling", "human-in-the-loop", "vercel-ai-sdk"]`
- **questions (черновик):**
  - Почему стриминг снижает воспринимаемую latency
  - Какие UX-паттерны обязательны для чата со стримингом
  - Как рендерить вызовы инструментов (tool calls) в интерфейсе
  - Что такое generative UI и чем он отличается от текстового ответа
  - Зачем нужен human-in-the-loop и где его встраивать
  - Как показывать состояние многошагового агента
  - Как обрабатывать ошибки и прерывание генерации
  - Что SDK делает за вас, а что остаётся фронтенду
  - Как избежать «мигания» UI между шагами агента

- **План секций (##):**
  1. **Стриминг: зачем и как ощущается** — воспринимаемая vs реальная latency
     (сжато, без дублирования `mental-model`); курсор/skeleton/статус; «Стоп».
  2. **Что делает SDK** — AI SDK UI: `useChat`, типизированные сообщения,
     `status`, прерывание, ошибки; SSE под капотом.
  3. **Tool-calling UI** — вызов инструмента как часть интерфейса: состояния
     `input-streaming` / `input-available` / `output-available`; рендер своих
     компонентов по `toolName`.
  4. **Generative UI** — рендер React-компонентов из результатов инструментов,
     а не generic-блоков; где это уместно.
  5. **Human-in-the-loop** — подтверждение необратимых действий, approvals,
     прерывание на середине.
  6. **Многошаговый агент в UI** — `stopWhen`/multi-step, состояние шагов,
     синтез ответа после tool calls.
  7. **Ошибки и восстановление** — частичный ответ, retry, деградация; отсылка к
     `ai-features-production.md`.
  8. **Чек-лист AI-интерфейса** — короткий, как в старой `streaming-ui`.
  9. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - AI SDK 5: SSE как стандарт, type-safety, automatic input streaming, tool
    `inputSchema`/`outputSchema`.
  - Agentic loop control: `stopWhen`, `stepCountIs`, `hasToolCall`, `prepareStep`,
    agent-абстракция.
  - Generative UI: состояния tool invocation → свои компоненты.
  - HITL как паттерн для необратимых действий.
- **Источники:** Vercel AI SDK 5/6/7 docs, Vercel Academy «Multi-Step &
  Generative UI», Vercel blog «AI SDK 5».
- **Действие:** после написания **удалить** `streaming-ui.md`.
- **Анти-дублирование:** прод-надёжность/стоимость — статья 10; безопасность
  рендера — `security.md`.

---

### Статья 10. `ai-features-production.md` *(заменяет `features-frontend.md`)*

- **title (черновик):** `AI-фичи в production`
- **description (черновик):** Как довести AI-фичу до прода: evals и quality-gates,
  контроль стоимости и латентности, кэширование и роутинг, fallback и
  деградация, наблюдаемость и версионирование промптов.
- **tags:** `["evals", "llmops", "observability", "cost-control", "reliability", "prompt-versioning"]`
- **questions (черновик):**
  - Почему обычных unit-тестов недостаточно для AI-фичи
  - Что такое eval, golden set и LLM-as-judge
  - Чем rule-based evals отличаются от judge и когда что использовать
  - Как встроить evals в CI как quality-gate
  - Как контролировать стоимость LLM (routing, кэш, бюджеты)
  - Как обеспечить graceful degradation при недоступности модели
  - Что даёт наблюдаемость (traces, токены, стоимость, латентность)
  - Зачем версионировать промпты и модели
  - Когда фичу можно упростить (без RAG и без чата)
  - Как мерять успех AI-фичи измеримыми критериями приёмки

- **План секций (##):**
  1. **Архитектура AI-фичи** — клиент → сервер → LLM API; ключ только на
     сервере; сервер — точка контроля (сжато из старой `features-frontend`).
  2. **Evals: новые unit-тесты** — golden set из реального трафика, rule-based
     (exact) vs LLM-as-judge, калибровка judge против человека, structured output
     судьи.
  3. **Quality-gate в CI** — быстрый прогон на PR, полный — ночью; порог pass-rate;
     блокировка merge при регрессии.
  4. **Online-мониторинг** — production traces, thumbs up/down, edit/regenerate,
     дрейф при смене модели; промоут падений в golden set.
  5. **Стоимость** — prompt caching, semantic caching (hit-rate, инвалидация),
     tiered routing, token-budgets/rate-limit, batch/дешёвые модели.
  6. **Латентность** — TTFT, стриминг, короткие ответы, выбор модели.
  7. **Надёжность** — fallback-цепочки, retry, circuit breaker, feature flags,
     деградация без модели.
  8. **Наблюдаемость** — OpenTelemetry GenAI semantic conventions: spans
     `invoke_agent`/`chat`/`execute_tool`, метрики токенов и стоимости.
  9. **Версионирование** — промпты как код, changelog, ре-эвал на смену модели.
  10. **Критерии приёмки и упрощение** — измеримые метрики; когда RAG/чат не
      нужны.
  11. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - Rule-based vs LLM-judge; калибровка judge (согласие с человеком ~90%);
    LLM-judge bias (verbose/self-style).
  - Semantic caching: hit-rate и сокращение стоимости (реальные кейсы).
  - OTel GenAI атрибуты: `gen_ai.request.model`, `gen_ai.usage.input_tokens`,
    `gen_ai.usage.output_tokens`, `gen_ai.response.finish_reasons`.
  - Offline vs online evals; промоушен прод-падений в датасет.
- **Источники:** LangChain «LLM Evals» (2026), Chrome «AI Evals» (2026),
  «LLM evals in 2026» (devtoollab), Vercel «LLM cost management», OTel GenAI
  observability blog (2026).
- **Действие:** после написания **удалить** `features-frontend.md`.
- **Анти-дублирование:** рендер и XSS — `security.md`; UI-паттерны — статья 9.

---

### Статья 11. `security.md` *(существующая — НЕ писать)*

- Действие: только перенумеровать `order: 6` → `order: 11`. Тело и frontmatter
  не трогать (кроме `order`).
- Убедиться, что перекрёстные ссылки из других статей на `./security.md` не
  сломались.

---

### Статья 12. `ai-code-security.md`

- **title (черновик):** `Безопасность AI-кода`
- **description (черновик):** Риски кода, сгенерированного AI: slopsquatting и
  фейковые зависимости, supply chain, утечки секретов, инъекции в агента и MCP,
  а также как ревьюить AI-код и защищать пайплайн.
- **tags:** `["ai-code-security", "supply-chain", "slopsquatting", "prompt-injection", "code-review"]`
- **questions (черновик):**
  - Почему AI-код несёт риски, которых нет в человеческом
  - Что такое slopsquatting и почему он работает
  - Как проверять зависимости, предложенные агентом
  - Как AI-агент становится новым звеном supply chain
  - Чем опасны инъекции в агента (в т.ч. через issue/CI)
  - Как утекают секреты в AI-коде
  - Почему «mega-PRs» усложняют безопасное ревью
  - Чем ревью AI-кода отличается от ревью человеческого
  - Как встроить проверки в CI/пайплайн (SBOM, policy-as-code)
  - Как связаны безопасность AI-кода и безопасность вывода LLM (см. security.md)

- **План секций (##):**
  1. **Почему AI-код — отдельный риск** — «эхо-камера» обучающих данных,
     скорость генерации обгоняет ревью; AI-код как supply-chain-узел.
  2. **Slopsquatting** — галлюцинации имён пакетов, консистентность повторов,
     реальные инциденты; правило «генератор не может быть валидатором».
  3. **Supply chain агента** — агент выбирает зависимости и запускает билд без
     обычного надзора; SBOM, provenance, policy-as-code, smart upstreams.
  4. **Секреты** — почему модели «помнят» ключи из обучающих данных; сканирование.
  5. **Инъекции в агента** — внешние данные (issue titles, веб, документы) как
     канал; связь с MCP security и prompt injection.
  6. **Ревью AI-кода** — «смотри, чего не хватает, а не что не так»; системные
     границы; traceability (что сгенерировано AI).
  7. **Mega-PRs и размер диффа** — рост LOC/PR, почему большие PR сложнее
     проверять; правила размера.
  8. **Что делать** — чек-лист: верификация пакетов, сканеры, gate в CI, аудит
     агента, ограничение прав.
  9. **Ключевые тезисы**, **Заключение**, **Полезные ссылки**.

- **Обязательно покрыть фактами:**
  - Доля галлюцинированных пакетов (commercial ≈ 5.2%, open-source ≈ 21.7%),
    повторяемость галлюцинаций (43% повторяются).
  - Slopsquatting-инциденты (например, `unused-imports` vs
    `eslint-plugin-unused-imports`).
  - AI-код: больше критичных уязвимостей/логических ошибок; рост cyber-находок;
    рост «mega-PR».
  - Agentic supply chain: MCP-серверы/плагины/скиллы как источник риска.
- **Источники:** USENIX Security 2025 (package hallucinations), CSA research
  notes 2026 (slopsquatting, AI agents as supply-chain node), IBM/CACM 2026,
  OX Security 2026.
- **Анти-дублирование:** рендер вывода и XSS — `security.md` (дать ссылку);
  MCP-протокол — статья 6.

---

## 7. Обновление `README.md` раздела

После того как хотя бы одна новая статья готова, обновлять `docs/ai/README.md`:
- Синхронизировать список и `order` со статьями.
- Группировка:
  - **Начни с базы** — 1–3.
  - **Агентская разработка** — 4–6.
  - **Проекты: с нуля и легаси** — 7–8.
  - **AI во фронтенде** — 9–10.
  - **Безопасность** — 11–12.
- README — производный от `order`; расхождений быть не должно.

---

## 8. Порядок работ (кратко)

1. `agentic-coding-tools.md` (order 4)
2. `context-engineering.md` (order 5) → подрезать `dev-workflow.md`
3. `mcp.md` (order 6)
4. `greenfield-with-ai.md` (order 7)
5. `legacy-refactoring-with-ai.md` (order 8)
6. `ai-ui-patterns.md` (order 9) → удалить `streaming-ui.md`
7. `ai-features-production.md` (order 10) → удалить `features-frontend.md`
8. `security.md` — перенумеровать (order 11)
9. `ai-code-security.md` (order 12)
10. Обновить README; при желании прогнать `/arrange ai`.

Каждая итерация заканчивается обновлением трекера (раздел 9).

---

## 9. Прогресс-трекер

- [x] 4. `agentic-coding-tools.md`
- [x] 5. `context-engineering.md` + подрезка `dev-workflow.md`
- [x] 6. `mcp.md`
- [x] 7. `greenfield-with-ai.md`
- [x] 8. `legacy-refactoring-with-ai.md`
- [ ] 9. `ai-ui-patterns.md` + удалить `streaming-ui.md`
- [ ] 10. `ai-features-production.md` + удалить `features-frontend.md`
- [ ] 11. `security.md` → `order: 11`
- [ ] 12. `ai-code-security.md`
- [ ] README обновлён
- [ ] (опц.) `/arrange ai`

---

## 10. Банк источников (отправные точки, проверить перед использованием)

**Агентская разработка / инструменты**
- Cursor — Best practices for coding with agents (2026-01)
- OpenAI — Codex docs / Codex Prompting Guide / Modernizing your Codebase with Codex
- Claude Code — docs, multi-agent parallelism
- dev.to — «Parallel AI coding agents in 2026»

**Context engineering**
- Martin Fowler — «Context Engineering for Coding Agents» (01.2026)
- Martin Fowler — «Harness engineering for coding agent users» (04.2026)
- arXiv:2510.21413 — Context Engineering for AI Agents in OSS (MSR 2026)
- arXiv:2607.27250 — Do Context Files Help Coding Agents? (2026)

**MCP**
- modelcontextprotocol.io — спецификация 2026-07-28 и blog
- Anthropic — MCP docs
- Figma — Figma MCP docs / Code Connect
- DataCamp — MCP Interview Questions (2026)

**Greenfield / SDD**
- github/spec-kit (history, v1.0 2026)
- Microsoft for Developers / Microsoft Learn — Spec-Driven Development & Spec Kit
- v0 — Figma integration docs

**Legacy / brownfield**
- arXiv:2511.04824 — Agentic Refactoring: Empirical Study (2025)
- Qonto — AI-Driven Refactoring in Large-Scale Migrations
- Cisco ThousandEyes — Using AI to migrate legacy frontend components (06.2026)
- «Brownfield refactoring with AI agents: 8 patterns» (2026)
- Red Hat — agent-mesh legacy modernization (03.2026)

**AI UI**
- Vercel AI SDK 5/6/7 — docs, blog «AI SDK 5»
- Vercel Academy — Multi-Step Conversations & Generative UI

**Production / evals / observability / cost**
- LangChain — LLM Evals (2026)
- Chrome for Developers — AI Evals (introduction / mental model, 2026)
- DevToolLab — LLM Evals in 2026
- Vercel — LLM cost management
- OpenTelemetry — GenAI observability blog (2026) + GenAI semantic conventions

**Безопасность AI-кода**
- USENIX Security 2025 — package hallucinations (slopsquatting)
- Cloud Security Alliance — research notes 2026 (slopsquatting, AI agents supply chain)
- IBM / CACM — vibe coding security risks (2026)
- OX Security — AI code security (2026)
