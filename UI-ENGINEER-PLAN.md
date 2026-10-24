# План улучшения PrePra под подготовку к UI Engineer

> Рабочий документ проекта. Основан на анализе 15 разделов и ~176 статей.
> Цель — не переписать проект, а закрыть разрывы между текущим корпусом и требованиями позиции UI Engineer.
> Дата: 2026-10-24.

## TL;DR

- Проект уже силён в CSS-фундаменте, дизайн-системе, тестировании и Vue UI-треке. Начинать с нуля не нужно.
- Главные пробелы: **доступность**, **motion**, **типографика/цвет/медиа**, **i18n/RTL**, **экспертная производительность**, **React UI-specific**.
- Стратегия: **не создавать новый раздел**, а усилить `html-css`, `performance`, `testing`, `architecture` и точечно `react`.
- Сначала закрываем **7 P0-статей**, потом P1/P2. P0 даёт наибольший прирост на собеседовании.
- Обязательные системные улучшения: мок-интервью preset «UI Engineer», практические лабы, обновление README/CHEATSHEET и `answers` для всех новых вопросов.

---

## Статус выполнения

> Обновлено: 2026-10-24.

- ✅ **UE-01 — сделано.** Создана `docs/html-css/accessibility-wcag.md`: 10 вопросов и 10 ответов, 5 практических примеров, антипаттерны, тезисы, 30-минутный протокол аудита и code review-чеклист. Добавлены перекрёстные ссылки из `html-semantics-accessibility.md` и `html-forms-validation.md`.
- ✅ **UE-02 — сделано.** Создана `docs/html-css/aria-patterns-keyboard.md`: 10 вопросов и 10 ответов, 5 практических примеров (tabs на JS и React, нативный dialog, combobox с `aria-activedescendant` и async, menu button, error summary + live region), антипаттерны, тезисы, практическое задание и code review-чеклист. Добавлены перекрёстные ссылки из `accessibility-wcag.md` и `html-semantics-accessibility.md`.
- ✅ **UE-10 — сделано.** Создана `docs/testing/accessibility-testing.md`: 10 вопросов и 10 ответов, 5 примеров (axe в Playwright с артефактами, клавиатурная форма, Storybook addon-a11y, ручной скрипт NVDA/VoiceOver, CI-workflow), антипаттерны, тезисы и чек-лист. Порядок `testing` перенумерован: accessibility — 10, strategy — 11, pitfalls — 12, gitlab-ci-cd — 13, sentry — 14.
- ✅ **Мок-интервью: пресеты UI Engineer.** Добавлены `ui-engineer-vue` и `ui-engineer-react` (по 50 вопросов, основная секция `html-css`), иконки и цвета в `MockInterview.tsx`, текст промо и корневой README обновлены до 11 пресетов.
- ✅ **Порядок `html-css` зафиксирован.** Существующие статьи перенумерованы под целевую таблицу (forms — 9, rendering — 11, styling — 13, tokens — 16, ui-kits — 17); слоты 8, 10, 12, 14, 15 оставлены под UE-02, UE-07, UE-03, UE-04, UE-05. Слот 8 занят UE-02.
- ✅ **README разделов обновлены.** UE-01/UE-02 добавлены в `html-css/README.md`, UE-10 — в `testing/README.md`; корневой README обновлён до 11 пресетов и 179+ статей.
- ✅ **CHEATSHEET обновлены.** В `html-css/CHEATSHEET.md` добавлен блок про APG-виджеты, состояния, roving tabindex, dialog и live regions; в `testing/CHEATSHEET.md` — блок про axe, уровни тестирования, клавиатуру, CI и ручной аудит.
- ✅ **Сборка и мок-интервью проверены.** `npm run build` проходит (196 страниц); `aria-patterns-keyboard` и `accessibility-testing` попадают в индекс мок-интервью (по 10/10 пар questions/answers, дублей нет).
- ⏳ **Следующий шаг:** UE-03 (`motion-and-animations.md`), затем UE-04 (`typography-and-color.md`) и UE-05 (`images-and-fonts.md`). Перед этим — провести первый мок-интервью по a11y-треку (UE-01 + UE-02 + UE-10) и записать слабые места.

---

## 1. Текущее состояние

| Блок | Что есть | Состояние |
|---|---|---|
| CSS-фундамент | cascade, layout, positioning, rendering | Сильно, но часть тем до 2023–2024 |
| Дизайн-система | `ui-kits`, `design-tokens`, `css-styling` | Сильно, лучшая часть проекта |
| Компонентные паттерны | `design-patterns`, `design-patterns-vue` | Сильно |
| TypeScript для API компонентов | `generics`, `utility-types`, `react`, `vue` | Сильно, кроме полиморфизма |
| Тестирование UI | RTL, Vue Test Utils, Playwright, visual regression | Сильно |
| Доступность | вводная статья, WCAG 2.2, ARIA-паттерны, тестирование a11y, `vue/accessibility` | Сильно |
| Motion | `vue/transitions` + фрагменты в rendering | Слабо |
| Типографика / цвет / визуальный ритм | только дизайн-токены | Слабо |
| Изображения / шрифты / медиа | фрагменты | Нет |
| i18n / RTL | упоминания | Нет |
| Формы | нативный API + Vue | Частично |
| Производительность UI | метрики, bundle, hydration | Частично |
| Browser APIs / кросс-браузерность | фрагменты | Слабо |
| React UI-specific | нет | Пробел |
| Vue UI-specific | styling, a11y, transitions, forms, web components | Сильно |

### Что это значит

- Для Vue UI Engineer проект почти готов: a11y-трек закрыт, не хватает motion/visual-тем.
- Для React UI Engineer проект подготовлен хуже: нет React-статей про стилизацию, формы, a11y и анимации.
- `html-css/README.md`: container queries перенесены в «Углубись» — это обязательная тема для UI Engineer.
- `js-closures.md` исправлен: 9 вопросов / 9 ответов, вопрос больше не выпадает из мок-интервью.

---

## 2. Принципы улучшения

1. **Контент прежде всего.** Не делать редизайн сайта и не добавлять новые разделы, пока не закрыты P0-темы.
2. **Не дублировать.** Общая статья + ссылки на Vue/React-специфику, а не копия.
3. **Каждая статья — под собеседование.** 8–10 вопросов с ответами, 3–5 практических примеров, антипаттерны, code review-чеклист.
4. **Проверять актуальность.** Для CSS/JS-фич сверяться с MDN/Baseline и указывать ограничения поддержки, а не «работает везде».
5. **Одна тема — один файл.** Не раздувать вводные статьи до 10k слов; лучше отдельная глубокая статья.
6. **P0 раньше P1.** Не начинать i18n/DS governance, пока нет a11y-трека.

---

## 3. Бэклог статей

### P0 — закрыть обязательно

#### UE-01. Доступность: WCAG 2.2, дерево доступности и аудит ✅

- **Файл:** `docs/html-css/accessibility-wcag.md`
- **Раздел:** `html-css`
- **Зачем:** a11y — обязательная тема UI Engineer; текущая вводная слишком поверхностна.
- **Ключевые темы:**
  - POUR, уровни A/AA/AAA, conformance.
  - Новые критерии WCAG 2.2: focus not obscured, target size, dragging movements, consistent help, redundant entry, accessible authentication.
  - Accessibility tree, accessible name/description computation, роли/состояния/свойства.
  - `aria-hidden` vs `inert`, скрытие декоративного контента.
  - Контраст, zoom/reflow, target size, focus appearance, reduced motion.
  - Ошибки форм и связь сообщений с полями.
  - Аудит: axe/Lighthouse, ручная клавиатура, NVDA/VoiceOver, чек-лист.
- **Вопросы, на которые статья должна отвечать:**
  - Чем A/AA/AAA отличаются и что требовать от продукта?
  - Как браузер вычисляет accessible name?
  - Почему `aria-hidden` не заменяет `inert`?
  - Как провести a11y-аудит за 30 минут?
- **Практика:** аудит одной страницы клавиатурой + axe; список из 10 найденных проблем.
- **Связи:** `html-semantics-accessibility`, `vue/accessibility`, UE-02, UE-10.
- **Оценка:** 10–14 ч.
- **Готово, когда:** есть чек-лист аудита, 8+ вопросов с ответами, 3 примера кода.
- **Статус:** ✅ Готово (2026-10-24): чек-лист аудита, 10 вопросов с ответами, 5 примеров кода.

#### UE-02. ARIA-паттерны и клавиатурное взаимодействие

- **Файл:** `docs/html-css/aria-patterns-keyboard.md`
- **Раздел:** `html-css`
- **Зачем:** на практических интервью просят собрать tabs/dialog/combobox; Vue-статья не заменяет общий APG-трек.
- **Ключевые темы:**
  - APG-паттерны: dialog, tabs, accordion, disclosure, menu/menubar, listbox/combobox, tooltip, grid/tree.
  - Роли, состояния и связи: `aria-expanded`, `aria-controls`, `aria-selected`, `aria-activedescendant`, `aria-describedby`.
  - Focus management: focus trap, return focus, roving tabindex, skip links.
  - Live regions: `aria-live`, `role="status"`, `role="alert"`, `aria-atomic`.
  - Сложные случаи: вложенные меню, порталы, виртуализированные списки, мобильные скринридеры.
  - Примеры на React и Vue; чек-лист code review доступного компонента.
- **Вопросы:**
  - Как сделать доступные tabs без библиотеки?
  - Где должен находиться фокус при открытии и закрытии dialog?
  - Чем `aria-activedescendant` отличается от roving tabindex?
  - Как объявить об ошибке формы, не перебивая пользователя?
- **Практика:** собрать Dialog + Tabs + Combobox и проверить клавиатурой.
- **Связи:** UE-01, `ui-kits`, `vue/accessibility`.
- **Оценка:** 12–16 ч.
- **Готово, когда:** есть reference-реализация минимум трёх паттернов и чек-лист.
- **Статус:** ✅ Готово (2026-10-24): 10 вопросов/ответов, tabs (JS + React), dialog, combobox, menu button, error summary + live region, чек-лист code review.

#### UE-03. Анимации и motion-система

- **Файл:** `docs/html-css/motion-and-animations.md`
- **Раздел:** `html-css`
- **Зачем:** motion — обязательная часть UI Engineer; сейчас есть только Vue Transition.
- **Ключевые темы:**
  - Timing/easing, duration, choreography, motion tokens.
  - CSS transitions/keyframes, `@starting-style`, `transition-behavior: allow-discrete`, дискретные свойства.
  - Web Animations API, FLIP, View Transitions API (same-document и cross-document).
  - Scroll-driven animations, `animation-timeline`.
  - GSAP: timeline, ScrollTrigger, Flip, `matchMedia`, интеграция с React/Vue, cleanup.
  - Производительность: compositor-only свойства, jank, `will-change`, `content-visibility`.
  - Доступность: `prefers-reduced-motion`, вестибулярные расстройства, смысловые vs декоративные анимации.
  - Тестирование анимаций: отключение в visual regression, Storybook.
- **Вопросы:**
  - Почему анимация лагает и как это диагностировать?
  - Чем FLIP отличается от View Transitions?
  - Как уважать `prefers-reduced-motion`, не ломая UX?
  - Как построить motion-систему для дизайн-системы?
- **Практика:** анимировать список через FLIP или View Transitions + замерить jank.
- **Связи:** `vue/transitions`, `html-rendering-pipeline`, UE-01.
- **Оценка:** 12–16 ч.
- **Готово, когда:** есть 3 demo (CSS, FLIP/View Transitions, GSAP) и раздел про reduced motion.

#### UE-04. Типографика, цвет и визуальный ритм

- **Файл:** `docs/html-css/typography-and-color.md`
- **Раздел:** `html-css`
- **Зачем:** UI Engineer оценивают по вкусу и умению строить визуальную систему; токены есть, основ нет.
- **Ключевые темы:**
  - Type scale, modular scale, fluid type через `clamp()`, line-height, measure.
  - Spacing scale, vertical rhythm, 8pt grid, оптическое выравнивание.
  - Variable fonts, `font-display`, subsetting, fallback metrics, `size-adjust`.
  - `text-wrap: balance/pretty`, `font-variant-numeric`, truncation, переносы.
  - Цветовые пространства: sRGB, P3, `oklch`, `color-mix`.
  - Контраст WCAG/APCA, семантические роли цвета, состояния, focus rings.
  - Dark mode, `light-dark()`, `color-scheme`, системная тема.
  - Цветовая слепота, доступность состояний, elevation/тени/бордеры.
- **Вопросы:**
  - Как построить type scale для продукта?
  - Как проверить контраст и не сломать бренд?
  - Как сделать dark mode без FOUC?
  - Чем семантические токены отличаются от primitive?
- **Практика:** собрать мини-типографику и палитру для DS, проверить контраст.
- **Связи:** `design-tokens-and-figma`, `css-styling-approaches`, UE-01.
- **Оценка:** 10–14 ч.
- **Готово, когда:** есть готовый type/color scale и чек-лист контраста.

#### UE-05. Изображения, шрифты и медиа

- **Файл:** `docs/html-css/images-and-fonts.md`
- **Раздел:** `html-css`
- **Зачем:** LCP и CLS — зона ответственности UI Engineer; сейчас только упоминания.
- **Ключевые темы:**
  - `srcset`/`sizes`, `<picture>`, AVIF/WebP, art direction.
  - `aspect-ratio`, `width`/`height`, `object-fit`.
  - `fetchpriority`, `loading`, `decoding`, preload LCP-изображения.
  - Responsive video, SVG, иконки (связь с `ui-kits`).
  - `@font-face`, `font-display`, preload, subsetting, variable fonts.
  - Fallback metrics, `size-adjust`, FOIT/FOUT, CLS от шрифтов.
  - Аудит: Lighthouse, DevTools Network, LCP-изображение.
- **Вопросы:**
  - Как выбрать `srcset`/`sizes` для карточки и hero?
  - Как не словить CLS от веб-шрифта?
  - Как ускорить LCP, не ухудшив качество?
  - Когда `loading="lazy"` вредит?
- **Практика:** оптимизировать hero-изображение и шрифт на тестовой странице.
- **Связи:** UE-06, `web-performance-metrics`, `nextjs/optimization`, `nuxt`.
- **Оценка:** 8–12 ч.
- **Готово, когда:** есть before/after замер LCP/CLS.

#### UE-06. LCP и INP: диагностика и оптимизация

- **Файл:** `docs/performance/lcp-inp-deep-dive.md`
- **Раздел:** `performance`
- **Зачем:** текущая статья про метрики — глоссарий, а на интервью спрашивают «как найти и починить».
- **Ключевые темы:**
  - LCP subparts: TTFB, resource load delay, resource load duration, element render delay.
  - Preload scanner, priority hints, `fetchpriority`, streaming, SSR.
  - INP anatomy: input delay, processing, presentation.
  - Long tasks, `scheduler.yield`, `isInputPending`, yielding, React transitions.
  - Third-party scripts, Web Workers, event handler cost.
  - CLS: session windows, dynamic content, fonts, animations.
  - RUM: `web-vitals` attribution, CrUX, p75/p95, field vs lab.
  - DevTools Performance, PerformanceObserver, Long Animation Frames API.
- **Вопросы:**
  - Из каких частей состоит LCP и какую оптимизировать первой?
  - Чем INP отличается от FID и как найти виновника?
  - Что такое long task и как его разбить?
  - Как настроить RUM и не утонуть в данных?
- **Практика:** найти LCP-элемент и long task на реальном сайте, предложить план.
- **Связи:** `web-performance-metrics`, `html-rendering-pipeline`, UE-05.
- **Оценка:** 10–14 ч.
- **Готово, когда:** есть диагностический чек-лист LCP/INP и 2 разобранных кейса.

#### UE-07. Формы: UX, валидация и доступность

- **Файл:** `docs/html-css/forms-ux.md`
- **Раздел:** `html-css`
- **Зачем:** формы — частая практическая задача; сейчас только нативный API и Vue-вариант.
- **Ключевые темы:**
  - Controlled/uncontrolled, React Hook Form + zod, TanStack Form, Vue-аналоги.
  - React 19: actions, `useActionState`, `useFormStatus`, `useOptimistic`.
  - Validation timing: on blur/submit/input, ошибки после взаимодействия.
  - Error summary, `aria-invalid`, `aria-describedby`, фокус на первую ошибку.
  - Autofill, `autocomplete`, input types/`inputmode`, `enterkeyhint`.
  - Multi-step forms, file upload, async validation, optimistic UI.
  - Тестирование форм: RTL/VTU, Playwright, a11y.
- **Вопросы:**
  - Когда валидировать поле и почему?
  - Как связать ошибку с полем для скринридера?
  - Когда использовать controlled, а когда uncontrolled?
  - Как типизировать форму и не дублировать схему?
- **Практика:** собрать форму с RHF/zod, ошибками, autofill и a11y.
- **Если стек React:** дополнительно `docs/react/forms.md` (P2) — RHF/zod, React 19 actions, Server Actions, тесты; `forms-ux.md` остаётся общей теорией.
- **Связи:** `html-forms-validation`, `vue/forms`, UE-01, UE-02.
- **Оценка:** 10–14 ч.
- **Готово, когда:** есть рабочая форма + тесты + чек-лист.

---

### P1 — сильный дифференциатор

| ID | Файл | Зачем | Ключевые темы | Оценка |
|---|---|---|---|---|
| UE-08 | `docs/html-css/i18n-and-rtl.md` | Глобальные продукты | logical properties, `dir=auto`, bidi, text expansion, `Intl`, pluralization, pseudo-localization, RTL-иконки, тестирование | 8–12 ч |
| UE-09 | `docs/architecture/design-system-governance.md` | UI Engineer часто спрашивают «как внедрить и развивать DS» | команда, contribution/RFC, versioning/deprecation, codemods, миграция, adoption-метрики, docs, design QA, SLA, multi-brand | 10–14 ч |
| UE-10 ✅ | `docs/testing/accessibility-testing.md` | Автотесты a11y и ручной аудит — отдельный навык | axe-core, Playwright, Storybook addon-a11y, vitest-axe, keyboard-тесты, screen reader script, CI, false positives | 6–10 ч |
| UE-11 | `docs/html-css/modern-css.md` | «Что нового в CSS» — любимый вопрос | `@scope`, `@property`, style/scroll-state queries, `@starting-style`, anchor positioning, `field-sizing`, `interpolate-size`, scroll-driven, view transitions, `oklch`/`color-mix`, `light-dark()`, subgrid | 8–12 ч |
| UE-12 | `docs/html-css/browser-ui-apis.md` | Мобильные баги и интерактивность | IntersectionObserver, ResizeObserver, `visualViewport`, safe-area, pointer/touch, scroll snap/sticky, scroll anchoring, drag&drop, clipboard, `matchMedia`, rAF/rIC | 8–12 ч |
| UE-13 | `docs/testing/cross-browser-and-device-testing.md` | «Работает везде» — ответственность UI Engineer | Playwright projects (Chromium/Firefox/WebKit), devices, responsive/visual matrix, BrowserStack, feature detection, `@supports`, progressive enhancement, CI cost | 6–10 ч |
| UE-14 | `docs/architecture/ui-system-design.md` | System design раунд для UI/DS | кейс: DS для N продуктов, инвентаризация, токены, API, темизация, a11y, i18n, тесты, docs, публикация, миграция, метрики | 10–14 ч |
| UE-15 | `docs/html-css/ui-engineer-workshop.md` | Практика важнее чтения | 6 лаб: Combobox, Dialog, container-сетка, форма, FLIP/View Transition, LCP-аудит | 12–16 ч |

---

### P2 — по ситуации

| ID | Файл | Когда нужен |
|---|---|---|
| UE-16 | `docs/html-css/data-tables.md` | Если в вакансии есть таблицы/дашборды: TanStack Table, виртуализация, доступная grid-таблица |
| UE-17 | `docs/html-css/design-handoff-and-qa.md` | Если много работы с Figma: спеки, Code Connect, design review, pixel-perfect vs intent |
| UE-18 | `docs/react/styling.md` | Если стек React: CSS Modules, Tailwind, CSS-in-JS, RSC/CSP |
| UE-19 | `docs/react/accessibility.md` | Если стек React: фокус, порталы, RSC, a11y-паттерны |
| UE-20 | `docs/performance/rendering-profiling.md` | Если нужен глубокий debugging: DevTools, layers, paint flashing, jank, React Profiler/Vue DevTools |
| UE-21 | `docs/typescript/polymorphic-components.md` | Если пишешь DS на React: `as`/`asChild`, `ElementType`, Slot typing |
| UE-22 | `docs/html-css/web-components-deep-dive.md` | Если DS кросс-фреймворковая: Shadow DOM, slots, form-associated custom elements, SSR |
| UE-23 | `docs/html-css/email-html.md` | Только если роль в маркетинге/агентстве |
| UE-24 | `docs/react/forms.md` | Если стек React: RHF/zod, React 19 actions, Server Actions, тесты форм |

---

## 4. Что усилить в существующих статьях

| Файл | Что добавить | Приоритет |
|---|---|---|
| `docs/html-css/html-semantics-accessibility.md` | Оставить как вводную, добавить ссылки на UE-01/UE-02 и краткий a11y tree | P0 |
| `docs/html-css/html-forms-validation.md` | Ссылка на UE-07, краткий блок про ошибки и `aria-invalid` | P0 |
| `docs/performance/web-performance-metrics.md` | Краткий LCP/INP breakdown + ссылка на UE-06 | P0 |
| `docs/html-css/css-responsive-container-queries.md` | style queries, scroll-state queries, containment side effects, mobile viewport, safe-area, touch targets, fluid type | P1 |
| `docs/html-css/css-layout.md` | `aspect-ratio`, scroll snap, anchor positioning, `field-sizing`, `interpolate-size`, writing modes, masonry | P1 |
| `docs/html-css/css-cascade-specificity.md` | `@scope`, `@property`, `revert-layer`, Shadow DOM, style queries | P1 |
| `docs/html-css/css-positioning-stacking.md` | Top layer, `<dialog>`/Popover, containing block от `container-type`, `backdrop-filter` | P1 |
| `docs/html-css/html-rendering-pipeline.md` | `@starting-style`, `transition-behavior`, View Transitions, scroll-driven, `fetchpriority`, `scheduler.yield` | P1 |
| `docs/html-css/design-tokens-and-figma.md` | FOUC/theme flash, `color-scheme`, контраст, версионирование токенов, `@property` | P1 |
| `docs/html-css/ui-kits-and-component-libraries.md` | Полный combobox, state machines, SSR/hydration, RTL/i18n, governance, миграция | P1 |
| `docs/vue/transitions.md` | View Transitions, WAAPI, scroll-driven, motion tokens, ссылка на UE-03 | P1 |
| `docs/vue/accessibility.md` | Ссылки на UE-01/UE-02/UE-10, кросс-фреймворковые заметки | P1 |
| `docs/testing/visual-regression.md` | Матрица состояний DS, RTL, pseudo-states, a11y snapshots, Chromatic TurboSnap | P1 |
| `docs/architecture/design-patterns.md` / `design-patterns-vue.md` | Типизированный полиморфизм, `asChild`, edge cases controlled/uncontrolled, slots vs props | P1 |
| `docs/typescript/react.md` / `vue.md` | `ComponentPropsWithoutRef`, `ElementType`, типизация `asChild`/Slot, variant unions, `satisfies` | P1 |
| `docs/react/README.md` | Добавить формы/стилизацию/a11y, если стек React | P2 |

### Отдельно

- ✅ Пересмотреть `html-css/README.md`: container queries — не «nice-to-have», а обязательная тема (перенесены в «Углубись»).
- ✅ Исправить `docs/javascript/js-closures.md`: 9 вопросов / 9 ответов.
- Проверить, что у всех новых статей есть `answers`, иначе они не попадут в мок-интервью.

---

## 5. Порядок статей и навигация

### 5.1 Целевой порядок `html-css`

| Новый order | Файл | Статус |
|---|---|---|
| 1 | `fundamentals.md` | есть |
| 2 | `css-cascade-specificity.md` | есть |
| 3 | `css-layout.md` | есть |
| 4 | `css-positioning-stacking.md` | есть |
| 5 | `css-responsive-container-queries.md` | есть |
| 6 | `html-semantics-accessibility.md` | есть |
| 7 | `accessibility-wcag.md` | **UE-01** ✅ |
| 8 | `aria-patterns-keyboard.md` | **UE-02** ✅ |
| 9 | `html-forms-validation.md` | есть |
| 10 | `forms-ux.md` | **UE-07** |
| 11 | `html-rendering-pipeline.md` | есть |
| 12 | `motion-and-animations.md` | **UE-03** |
| 13 | `css-styling-approaches.md` | есть |
| 14 | `typography-and-color.md` | **UE-04** |
| 15 | `images-and-fonts.md` | **UE-05** |
| 16 | `design-tokens-and-figma.md` | есть |
| 17 | `ui-kits-and-component-libraries.md` | есть |
| 18 | `modern-css.md` | **UE-11** (P1) |
| 19 | `i18n-and-rtl.md` | **UE-08** (P1) |
| 20 | `browser-ui-apis.md` | **UE-12** (P1) |
| 21 | `ui-engineer-workshop.md` | **UE-15** (P1) |

> Перенумерация существующих статей — механическая правка. URL не меняются, порядок влияет только на сортировку и prev/next. Сделать одним PR.

### 5.2 Другие разделы

| Раздел | Изменения |
|---|---|
| `performance` | `lcp-inp-deep-dive.md` после `web-performance-metrics.md`; при добавлении profiling — в конец |
| `testing` | `accessibility-testing.md` после `visual-regression.md`; `cross-browser-and-device-testing.md` после e2e/visual |
| `architecture` | `design-system-governance.md` и `ui-system-design.md` — в конец или после `design-patterns` |
| `react` | `forms.md` после хуков; при необходимости `styling.md` и `accessibility.md` |

### 5.3 README и CHEATSHEET

- Обновить `docs/html-css/README.md`: группы «Начни с базы» / «Углубись» / «Не будет лишним», ссылки на новые статьи.
- Обновить `docs/performance/README.md`, `docs/testing/README.md`, `docs/architecture/README.md`, `docs/react/README.md`.
- Обновить `docs/html-css/CHEATSHEET.md`: a11y, motion, typography/color, images/fonts. Проверить, что печатается на один A4.
- Обновить корневой `README.md`: количество статей, описание разделов, список пресетов мок-интервью.
- `site/src/content/config.ts` **не трогать**, если не создаём новый раздел.

---

## 6. Мок-интервью

### 6.1 Новые пресеты

Добавить в `site/src/lib/mock-interview/presets.ts`:

```ts
{
  id: 'ui-engineer-vue',
  title: 'UI Engineer (Vue)',
  description: 'HTML/CSS, доступность, DS, тестирование и производительность',
  sections: ['html-css', 'testing', 'performance', 'architecture', 'typescript', 'vue'],
  stacks: ['vue'],
  mainSection: 'html-css',
  count: 50,
},
{
  id: 'ui-engineer-react',
  title: 'UI Engineer (React)',
  description: 'HTML/CSS, доступность, DS, тестирование и производительность',
  sections: ['html-css', 'testing', 'performance', 'architecture', 'typescript', 'react'],
  stacks: ['react'],
  mainSection: 'html-css',
  count: 50,
},
```

### 6.2 Что ещё обновить

- `site/src/components/interview/MockInterview.tsx`: `PRESET_ICONS`, `PRESET_COLORS`, `PRESET_BADGE_CLASSES`.
- `site/src/components/content/MockInterviewPromo.astro`: текст промо.
- Корневой `README.md`: 9 пресетов → 11.
- Проверить, что новые статьи с `answers` попадают в индекс, а без `answers` — нет.

### 6.3 Требование к контенту

Каждая новая статья должна иметь **равное количество questions и answers**. Иначе вопрос не попадёт в мок-интервью. Ответы — 2–4 предложения, конкретные, без воды.

---

## 7. Практический слой

Читать статьи недостаточно. Добавить `docs/html-css/ui-engineer-workshop.md` (UE-15) с шестью лабами:

1. **Accessible Combobox** — клавиатура, async, loading/empty/error, controlled/uncontrolled.
2. **Dialog** — focus trap, return focus, `inert`, Escape, reduced motion.
3. **Responsive Card Grid** — container queries + fluid type + dark mode.
4. **Form** — RHF/zod + ошибки + a11y + optimistic UI.
5. **List Animation** — FLIP или View Transitions + reduced motion + замер jank.
6. **LCP/CLS Audit** — images/fonts, before/after.

Формат каждой лабы: условие → требования → критерии оценки → reference-решение → вопросы интервьюера.

### Портфолио

Собрать мини-дизайн-систему: `Button`, `Tabs`, `Dialog`, токены, Storybook, a11y-тесты, Chromatic. Это не статья в `docs/`, а отдельный pet-project — лучший ответ на «покажите, как вы строите DS».

---

## 8. Фазы работ

| Фаза | Содержание | Результат | Оценка |
|---|---|---|---|
| 0. Подготовка ✅ | Зафиксировать порядок, обновить README-структуру, исправить `js-closures`, выбрать стек (Vue/React) | Чистый backlog, нет расхождений в метаданных | 0,5–1 день |
| 1. A11y ✅ | UE-01, UE-02, UE-10 | A11y-трек из 3 статей + чек-лист аудита | 3–4 дня |
| 2. Motion + Visual | UE-03, UE-04, UE-05 | 3 статьи, 3 практических demo | 4–6 дней |
| 3. Performance + Forms | UE-06, UE-07 | Диагностика CWV + форма | 3–4 дня |
| 4. P1 | UE-08, UE-09, UE-11, UE-12, UE-13, UE-14 | Полный UI-трек | 5–7 дней |
| 5. Практика и система | UE-15, mock-пресеты, CHEATSHEET, портфолио | Готовность к мок-интервью | 3–4 дня |

**MVP:** фазы 0–3 + mock-пресет = 10–14 рабочих дней.
**Полный план:** 4–6 недель при работе над проектом частично.

---

## 9. Definition of Done

### Для каждой статьи

- [ ] Валидный frontmatter: `title`, `section`, `description`, `order`, `tags`, `questions`, `answers`.
- [ ] 8–10 вопросов, ответов столько же.
- [ ] 3–5 практических примеров с кодом.
- [ ] Раздел «Типичные ошибки и антипаттерны».
- [ ] Раздел «Ключевые тезисы для интервью».
- [ ] Практическое задание или code review-чеклист.
- [ ] Ссылки на смежные статьи, нет дублей.
- [ ] Проверена актуальность CSS/JS-фич (MDN/Baseline).
- [ ] Статья добавлена в README раздела.
- [ ] При необходимости обновлён CHEATSHEET.
- [ ] `npm run build` проходит.
- [ ] Статья видна в мок-интервью (если есть answers).

### Для фазы

- [ ] Все статьи фазы прошли DoD.
- [ ] Нет битых ссылок и ошибок сборки.
- [ ] Обновлены README и навигация.
- [ ] Проведён мок-интервью по новым темам.
- [ ] Записаны 3–5 слабых мест и что читать дальше.

---

## 10. Метрики

### Контент

- 15 новых статей (P0+P1), 3 существующие усилены до уровня роли, 10+ обновлённых.
- 100+ новых вопросов с ответами.
- 0 статей без `answers`.
- 0 дублей тем между общими и Vue/React-статьями.

### Подготовка

- Мок-интервью по UI Engineer: 80%+ ответов «Отлично/Так себе» без провалов.
- Уметь за 30 минут провести a11y-аудит страницы.
- Уметь за 30 минут найти LCP/INP-проблему.
- Уметь собрать доступный компонент с клавиатурой и тестами.
- Уметь объяснить выбор styled/headless/shadcn и структуру DS.

### Проект

- `npm run build` зелёный.
- Lighthouse CI не деградировал.
- CHEATSHEET печатается на A4.
- Мок-интервью содержит 11 пресетов.

---

## 11. Риски и что не делать

| Риск | Митигация |
|---|---|
| Scope creep: 20+ статей | Сначала только P0, P1 — после MVP |
| Дублирование с `vue/accessibility` и `vue/transitions` | Общая статья + ссылки, Vue-статьи оставить как специфику |
| Устаревшие данные о поддержке браузеров | Сверять с MDN/Baseline, писать «на момент статьи» |
| Падение качества при быстром темпе | DoD, code review, практическое задание в каждой статье |
| Перенумерация ломает навигацию | Менять `order` одним PR, проверять `prev/next` и README |
| CHEATSHEET перестаёт влезать на A4 | Добавлять только ключевые термины, проверять печать |
| Статьи без answers не попадают в мок | Проверять пары questions/answers перед коммитом |

### Не делать

- Не создавать отдельный раздел `ui-engineering` — разломает навигацию и будет дублировать `html-css`.
- Не писать ещё одну вводную по HTML/CSS.
- Не углублять AI, бэкенд, деплой, безопасность — низкий ROI для UI Engineer.
- Не делать статьи-списки фич без кода, trade-offs и практики.
- Не добавлять тяжёлые зависимости в сайт ради статей.

---

## 12. Чеклист запуска

- [x] Определить стек: Vue / React / оба. Оба: добавлены пресеты `ui-engineer-vue` и `ui-engineer-react`.
- [x] Зафиксировать целевой порядок `html-css` и перенумеровать.
- [x] Создать UE-01 (`accessibility-wcag.md`) по шаблону проекта.
- [x] Создать UE-02 (`aria-patterns-keyboard.md`).
- [x] Создать UE-10 (`accessibility-testing.md`).
- [x] Обновить `html-css/README.md`, `testing/README.md` и `CHEATSHEET.md`.
- [x] Проверить сборку и попадание статей в мок-интервью (по 10/10 пар questions/answers).
- [ ] Провести первый мок-интервью по a11y-треку.
- [ ] Записать слабые места и перейти к UE-03/UE-04/UE-05.

---

## Приложение: шаблон новой статьи

```md
---
title: "Название"
section: "html-css"
description: "Одно предложение: какую проблему решает статья."
order: 7
tags: ["tag-1", "tag-2"]
questions:
  - "Вопрос 1?"
  - "Вопрос 2?"
answers:
  - "Ответ 1."
  - "Ответ 2."
---

# Название

Вводный абзац: зачем тема UI Engineer и что будет в статье.

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Практические примеры](#практические-примеры)
3. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
4. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
5. [Заключение](#заключение)
6. [Полезные ссылки](#полезные-ссылки)

## Глубокий разбор

...

## Практические примеры

...

## Типичные ошибки и антипаттерны

...

## Ключевые тезисы для интервью

...

## Заключение

...

## Полезные ссылки

...
```
