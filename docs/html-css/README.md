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
- **[Формы и валидация](./html-forms-validation.md)** — Constraint Validation API, `:user-valid`/`:user-invalid`, событие `formdata`, кратко про `ElementInternals`.
- **[Парсинг HTML и производительность CSS](./html-rendering-pipeline.md)** — критический путь рендеринга, Layout/Paint/Composite, анимации через `transform`/`opacity`, `will-change`, `contain`, `content-visibility`.
- **[Способы применения CSS, токены и архитектура](./css-styling-approaches.md)** — CSS Modules, CSS-in-JS, Tailwind, custom properties, дизайн-токены, BEM/CUBE/ITCSS, `@layer`.

## Не будет лишним

- Container queries (внутри статьи про адаптивность) — знать, что это, но вряд ли спросят в деталях.
- Shadow DOM и `@scope` (внутри статьи про способы применения CSS) — достаточно уровня «что это и зачем».
- `ElementInternals` (внутри статьи про формы) — нишевый сценарий для библиотек компонентов.