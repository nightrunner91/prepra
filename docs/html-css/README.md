# HTML и CSS

Раздел закрывает браузерный фундамент, который реально проверяют на собеседованиях: как HTML и CSS работают под капотом, как строится страница, как устроены раскладки и подходы к стилизации в современном вебе.

## Начни с базы

1. **[Основы HTML и CSS](./fundamentals.md)** — структура документа, семантическая разметка, селекторы, box model, display. Точка входа в раздел.
2. **[Каскад и специфичность](./css-cascade-specificity.md)** — cascade, origin, `@layer`, specificity, inheritance, `!important`, современные селекторы `:is`/`:where`/`:has`/`:not`, nesting, logical properties.
3. **[Flexbox и Grid](./css-layout.md)** — оси и распределение пространства в Flexbox, треки и `fr`/`minmax`/`subgrid` в Grid, правила выбора между ними.
4. **[Positioning, stacking context и formatting contexts](./css-positioning-stacking.md)** — позиционирование, z-index, paint order, BFC/IFC/FFC/GFC, containing block, margin collapse.

## Углубись в детали

- **[Адаптивность и container queries](./css-responsive-container-queries.md)** — media queries, container queries, viewport units, `prefers-*`.
- **[Семантический HTML и доступность](./html-semantics-accessibility.md)** — landmarks, default ARIA roles, доступность.
- **[Доступность: WCAG 2.2, дерево доступности и аудит](./accessibility-wcag.md)** — POUR и уровни A/AA/AAA, новые критерии WCAG 2.2, accessibility tree и вычисление accessible name, `aria-hidden` против `inert`, фокус, контраст, reflow, target size, ошибки форм и 30-минутный протокол аудита.
- **[ARIA-паттерны и клавиатурное взаимодействие](./aria-patterns-keyboard.md)** — tabs, dialog, disclosure, menu, combobox, tree и grid; роли, состояния и связи, roving tabindex против `aria-activedescendant`, focus trap и возврат фокуса, live regions, порталы и виртуализация, React/Vue-примеры и code review-чеклист.
- **[Формы и валидация](./html-forms-validation.md)** — Constraint Validation API, `:user-valid`/`:user-invalid`, событие `formdata`, кратко про `ElementInternals`.
- **[Парсинг HTML и производительность CSS](./html-rendering-pipeline.md)** — критический путь рендеринга, Layout/Paint/Composite, анимации через `transform`/`opacity`, `will-change`, `contain`, `content-visibility`.
- **[Анимации и motion-система](./motion-and-animations.md)** — motion-токены (duration/easing/distance) и хореография, CSS-переходы и `@starting-style`, `transition-behavior: allow-discrete`, FLIP, View Transitions API (same-document и cross-document), WAAPI, scroll-driven animations, GSAP с `matchMedia` и cleanup, производительность и диагностика jank, `prefers-reduced-motion`, тестирование анимаций.
- **[Способы применения CSS, токены и архитектура](./css-styling-approaches.md)** — CSS Modules, CSS-in-JS, Tailwind, custom properties, дизайн-токены, BEM/CUBE/ITCSS, `@layer`.
- **[Типографика, цвет и визуальный ритм](./typography-and-color.md)** — type scale и fluid type через `clamp()`, line-height и measure, `text-wrap` и `tabular-nums`, spacing-шкала и вертикальный ритм, `oklch`/`color-mix`/P3, семантические токены, контраст WCAG и APCA, dark mode без FOUC, доступность состояний.
- **[Изображения, шрифты и медиа](./images-and-fonts.md)** — `srcset`/`sizes`, `<picture>` и art direction, AVIF/WebP/JPEG/SVG, `aspect-ratio` и CLS, `loading`/`fetchpriority`/`preload`, `@font-face`, variable fonts, subsetting, `font-display`, fallback-метрики, responsive video, аудит LCP.
- **[Дизайн-токены, темизация и Figma](./design-tokens-and-figma.md)** — уровни токенов primitive/semantic/component, Style Dictionary pipeline, Figma Variables и Tokens Studio, Figma MCP и Code Connect, runtime theming на CSS custom properties, multi-brand, компонентные токены в UI-китах, CI/CD и visual regression.
- **[UI-киты, headless-компоненты и Storybook](./ui-kits-and-component-libraries.md)** — styled vs headless vs shadcn/ui, критерии выбора кита, доступность сложных компонентов, API компонентов (compound, controlled/uncontrolled, `asChild`, cva), `<dialog>` и Popover API, Storybook, иконки, публикация и тестирование библиотеки. Ключевая статья для UI Engineer.

## Не будет лишним

- Shadow DOM и `@scope` (внутри статьи про способы применения CSS) — достаточно уровня «что это и зачем».
- `ElementInternals` (внутри статьи про формы) — нишевый сценарий для библиотек компонентов.