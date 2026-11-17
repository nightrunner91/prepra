# User preferences

## No automatic browser / visual verification

Unless the user explicitly asks for it, do **NOT**:

- Start a browser, Playwright, or any visual verification tool.
- Take screenshots or generate visual previews.
- Start a dev server, static server, or any local server just to look at the UI.
- Use `browser_*` tools for visual checks.

When the user says things like "I will check it myself", "don't verify visually", or expresses frustration about browser automation, stop all browser/visual attempts immediately and do not resume them in the current task.

If visual verification is genuinely needed, ask the user for permission first. Default to trusting the user to verify the result themselves.

## Вёрстка и UI

### Шрифт

- Только ступени шкалы Tailwind: `text-xs` (12px) — минимум, дальше `text-sm`,
  `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`.
- Произвольные значения запрещены: `text-[10px]`, `text-[11.5px]`, `text-[13px]`,
  `text-[0.9em]`, `text-[0.8125rem]`. Нет подходящей ступени — берём ближайшую.
  Своя ступень — только через `theme.extend.fontSize` в `tailwind.config.js`.
- Ниже 12px не набираем ничего: 10–11px ломают читаемость и a11y. Не влезает —
  сокращай текст, `tracking`, отступы, но не кегль.
- Один тип элемента — один размер. Микро-лейбл (eyebrow, badge, мета) везде
  `text-xs` (общий класс `.eyebrow`), а не 10/11/11.5 по вкусу.
- Повторяющийся набор классов (лейбл, чип, кнопка, поле) выносится в
  компонентный класс в `global.css`, а не копипастится по компонентам.
- `style={{ fontSize }}` в разметке запрещён.

### Цвета и размеры

- Только токены темы: `bg-surface`, `text-text-secondary`, `border-border`.
  Хексы в разметке запрещены: новый цвет = переменная в `:root` + `.dark` и
  ключ в `tailwind.config.js`.
- Отступы и размеры — из шкалы Tailwind. `w-[137px]`/`h-[420px]` допустимы только
  для реально уникальной геометрии (полотно, график, `calc`), с комментарием,
  почему.
- Исключение — печать (`@media print`, там `pt`) и относительные `em` внутри
  CSS-компонентов (инлайн-`code`, `kbd`): там это осознанно.

### Если сомневаешься

1. Посмотри, как это уже сделано: `site/src/styles/global.css`,
   `site/tailwind.config.js`, соседние компоненты.
2. Посмотри официальную шкалу и утилиты Tailwind (`text-xs`, `text-sm`, `size-*`,
   `gap-*`, `truncate`, `flex-wrap`).
3. Только потом — своё значение, и это повод спросить, а не придумывать.

Примеры из скиллов (`text-[11px] uppercase tracking-[0.18em]` в
`design-taste-frontend`) — иллюстрация приёма, а не разрешённые значения.

## Temporary artifacts location

When browser_* tools or other MCP servers generate artifacts (logs, snapshots, screenshots, downloads), save them under `.tmp/playwright-mcp/` or another appropriate subdirectory of `.tmp/` instead of the project root. Do not leave transient files in the workspace root. Both `.playwright-mcp/` and `.tmp/` are ignored by Git.

## Project plan

The PrePra rework plan lives in `.opencode/plans/prepra/`. Read its `README.md`
before any structural or content work. Work phase by phase (P0–P4); each phase
file is self-contained and must be kept up to date as work completes.

Articles in `docs/` are normalized with the `article-editor` skill (structure +
focus in one protocol). Do not use separate format/focus passes.
