# HTML и CSS

Раздел углубляет понимание браузерного фундамента: как HTML и CSS работают под капотом, как строится страница, как устроены раскладки и современные механизмы стилизации.

## Начни с базы

Если хочешь закрыть пробелы в фундаменте — иди по порядку:

1. **[Основы HTML и CSS](./fundamentals.md)** — семантическая разметка, селекторы, box model, flexbox, grid, позиционирование, адаптивная вёрстка. Самая база для начинающих.
2. **[Каскад и специфичность](./css-cascade-specificity.md)** — cascade, origin, `@layer`, specificity, inheritance, `!important`.
3. **[Flexbox](./css-flexbox.md)** — оси, `flex-basis`, grow/shrink, alignment.
4. **[Grid](./css-grid.md)** — explicit/implicit, `fr`, `minmax`, `auto-fit`/`auto-fill`, subgrid.
5. **[Позиционирование и stacking context](./css-positioning-stacking.md)** — positioning, stacking context, z-index, paint order.

## Углубись в детали

После базы переходи к глубоким и прикладным темам:

- **[Парсинг HTML и критический путь рендеринга](./html-rendering-pipeline.md)** — DOM/CSSOM/Render Tree, Layout/Paint/Composite, preload scanner.
- **[Formatting контексты и блочная модель](./css-layout-formatting-contexts.md)** — BFC/IFC/FFC/GFC, containing block, margin collapse, box-sizing.
- **[Семантический HTML и доступность](./html-semantics-accessibility.md)** — landmarks, default ARIA roles, доступность.
- **[Формы и валидация](./html-forms-validation.md)** — Constraint Validation API, `ElementInternals`, custom elements.
- **[Web Components](./html-web-components.md)** — custom elements, Shadow DOM, slots, lifecycle callbacks.
- **[Адаптивность и container queries](./css-responsive-container-queries.md)** — media queries, container queries, viewport units, `prefers-*`.
- **[Анимации и производительность](./css-animations-performance.md)** — transitions/animations, composite-only свойства, `will-change`, `contain`.
- **[CSS-переменные и архитектура](./css-variables-architecture.md)** — custom properties, theming, BEM/CUBE/layers, CSS Modules vs CSS-in-JS.
- **[Современные селекторы и возможности CSS](./css-modern-selectors.md)** — `:is`/`:where`/`:has`/`:not`, nesting, logical properties, color spaces.
- **[Способы применения CSS в клиентских приложениях](./css-styling-approaches.md)** — разбор подходов применения CSS в современном вебе.

## Не будет лишним

_Нет статей в этой категории — всё перечисленное выше относится к обязательному минимуму раздела._