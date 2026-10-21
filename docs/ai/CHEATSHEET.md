# Шпаргалка: AI и LLM в разработке

## LLM и промптинг

- **Токены:** подсловные фрагменты, output дороже input, русский ~1.5× · лимиты и цена в токенах
- **Контекст:** stateless, lost in the middle → важное в начало (system) и конец (задача)
- **Сэмплинг:** temperature, top-p (крутить одно) · `temperature=0` ≠ воспроизводимость
- **Latency:** TTFT vs total, total = TTFT + output × время на токен, рычаг — длина ответа
- **Паттерны:** zero-shot → one-shot (формат) → few-shot (домен) → CoT → chaining
- **Антипаттерны:** вежливость, противоречия, только запреты, несколько задач, «сделай хорошо»

## Рабочий цикл

- **Цикл:** спецификация → генерация → проверка → итерация, критерии выхода
- **SDD:** спецификация — источник истины, что а не как, верификация тестами
- **Надёжно vs нет:** CRUD, boilerplate, утилиты vs бизнес-логика, архитектура, версии, perf
- **Вайбкодинг:** молчаливые решения (loading, ошибки, cleanup, edge cases) · ок для прототипов
- **Проверка:** тесты по спецификации, не по коду, мутации, генерация + проверка (второй вызов)

## Агенты и контекст

- **Агент:** модель + harness, ReAct (thought → action → observation), код выполняет среда
- **Контроль:** sandbox / permissions / approval, hooks (PreToolUse, PostToolUse)
- **Изоляция:** git worktree на сессию, subagents (чистый контекст, read-only, параллельно)
- **Plan mode и headless:** read-only до одобрения · `-p`, `--allowedTools`, `--max-turns`, ревью PR
- **Context engineering:** AGENTS.md (коротко), skills (progressive disclosure), guides vs sensors
- **Окно:** compaction, очистка `tool_result`, память, Tool Search · agentic search vs RAG
- **MCP:** N×M → N+M, host / client / server, поверх function calling
- **Примитивы MCP:** tools (модель), resources (приложение), prompts (человек) · tool poisoning
- **MCP для фронта:** Figma (Code Connect), DevTools (дебажит, perf), Playwright (водит, тесты)

## Greenfield и легаси

- **Greenfield:** spec-first vs prompt-first, Spec Kit (constitution → spec → plan → tasks)
- **Bootstrap:** AGENTS.md, CI (lint, typecheck, test), хуки · design-to-code = дизайн-система
- **Brownfield:** спецификация — сам код, неявные инварианты, поломка через несколько модулей
- **Characterization-тесты:** до изменений, баги включительно, mutation testing (coverage врёт)
- **Миграция:** codemod (механика) + агент (смысл), инкрементально под feature flag vs big-bang
- **Ревью диффа:** «чего не хватает», маленькие патчи, неизменные goldens

## AI UI

- **Стриминг:** воспринимаемая latency, TTFT, data stream protocol поверх SSE
- **AI SDK:** `useChat`, `status`, `stop`, `regenerate`, сообщение = `parts`, не `content`
- **Tool UI:** input-streaming → input-available → approval → output-available / error / denied
- **Generative UI и HITL:** tool result → компонент · подтверждение необратимых действий
- **Многошаговость:** `stopWhen`, stable keys (`toolCallId`), placeholder, частичный ответ

## AI-фичи в production

- **Evals:** golden set, rule-based vs LLM-as-a-judge (калибровка, bias), quality-gate в CI
- **Стоимость:** prompt caching → semantic caching → routing → бюджеты на ключ
- **Надёжность:** retry vs fallback vs circuit breaker, kill switch, OTel GenAI, версии промптов

## Безопасность

- **Вывод LLM:** недоверенный ввод (XSS, prompt injection), граница — DOM, ключи только на сервере
- **Рендер:** HTML (DOMPurify, allowlist), Markdown (до и после), текст (`textContent`) · mXSS
- **Дыры React:** `dangerouslySetInnerHTML`, `javascript:` в `href`, `innerHTML` через ref
- **Defense in depth:** промпт → серверная чистка → `{}` → DOMPurify → allowlist URL → CSP
- **AI-код:** нет защиты (auth, validation), генератор ≠ валидатор, ревью mega-PR
- **Supply chain:** slopsquatting, Clinejection, Rules File Backdoor, утечка секретов
