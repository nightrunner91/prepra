# AI и LLM в разработке

Раздел о применении языковых моделей в работе фронтенд-разработчика. Ориентирован на реальный рабочий цикл (спецификация → агент → проверка) и вопросы, которые действительно задают на Middle/Senior FE-собеседованиях.

## Начни с базы

1. **[Ментальная модель LLM](./mental-model.md)** — токены, контекстное окно, температура, latency
2. **[Паттерны промптинга](./prompting-patterns.md)** — few-shot, CoT, chaining — язык формулирования задач
3. **[AI в рабочем процессе фронтендера](./dev-workflow.md)** — цикл «спецификация → генерация → проверка», Spec-Driven Development, AGENTS.md, когда агент врёт

## Агентская разработка

4. **[Агентские инструменты разработки](./agentic-coding-tools.md)** — цикл агента, инструменты и права, worktrees, subagents, plan mode, headless в CI
5. **[Контекст-инжиниринг агентов](./context-engineering.md)** — rules/AGENTS.md, skills, hooks, subagents, память и compaction
6. **[MCP: Model Context Protocol](./mcp.md)** — host/client/server, tools/resources/prompts, stateless-ядро 2026-07-28, tool poisoning, Figma/DevTools/Playwright MCP

## Проекты: с нуля и легаси

7. **[Старт проекта с AI](./greenfield-with-ai.md)** — Spec-Driven Development и Spec Kit, plan mode, bootstrap репозитория, design-to-code через Figma MCP и v0
8. **[Рефакторинг легаси через AI](./legacy-refactoring-with-ai.md)** — characterization-тесты, гибрид codemod и AI, изоляция worktree и хуки, инкрементальные миграции

## AI во фронтенде

9. **[AI UI: стриминг и generative UI](./ai-ui-patterns.md)** — стриминг, tool-calling UI, generative UI, human-in-the-loop, состояния многошагового агента
10. **[AI-фичи в production](./ai-features-production.md)** — evals и quality-gates, стоимость и латентность, кэш и роутинг, fallback и деградация, наблюдаемость, версионирование

## Безопасность

- **[Безопасность AI-вывода на фронте](./security.md)** — XSS через вывод модели, DOMPurify, валидация URL
