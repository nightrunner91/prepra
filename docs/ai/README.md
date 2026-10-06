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

## Углубись в детали

- **[Streaming UI](./streaming-ui.md)** — UX-паттерны чата со стримингом (без протокольных деталей)
- **[AI-фичи на фронте: от задачи к реализации](./features-frontend.md)** — продуктовое определение, выбор SDK, архитектура, критерии приёмки
- **[Безопасность AI-вывода на фронте](./security.md)** — XSS через вывод модели, DOMPurify, валидация URL
