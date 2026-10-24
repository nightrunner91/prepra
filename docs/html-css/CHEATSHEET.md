# Шпаргалка: HTML и CSS

## Селекторы и каскад

- **Селекторы:** `.class`, `#id`, `[attr]`, `:hover`, `::before` · комбинаторы пробел, `>`, `+`, `~`
- **Box model:** content → padding → border → margin, `content-box` vs `border-box`
- **Cascade:** origin + `!important` → `@layer` → specificity → порядок появления
- **Specificity:** (ID, класс / атрибут / псевдокласс, тип) · inline выше всех
- **@layer:** порядок слоёв важнее specificity, правила вне слоёв сильнее
- **:is / :where / :has:** вес max аргумента / 0 / родительский селектор
- **Наследование:** color, font-* · `inherit`, `initial`, `unset`, `revert`

## Flexbox и Grid

- **Flex:** main / cross axis, `justify-*` / `align-*`, basis → grow → shrink
- **flex:** `flex: 1` (`1 1 0%`) vs `flex: auto` · ловушка `min-width: auto` → `min-width: 0`
- **Grid:** explicit vs implicit треки, `fr`, `minmax(0, 1fr)`, `grid-template-areas`
- **auto-fit vs auto-fill:** схлопывает пустые треки vs сохраняет
- **Выбор:** Grid (2D, макет) vs Flexbox (1D, строка) · общий `gap`

## Позиционирование

- **position:** absolute (не-static), fixed (viewport), sticky (`top`, без `overflow: hidden`)
- **Stacking context:** z-index + position, `opacity < 1`, transform, `isolation: isolate`
- **z-index:** только внутри своего контекста, 9999 не пробивает родителя
- **BFC:** `display: flow-root` vs `overflow: hidden` (обрезка)
- **Margin collapse:** соседние блоки, родитель + потомок · нет во flex / grid

## Адаптивность

- **Media vs container queries:** viewport (макет страницы) vs контейнер (компонент)
- **Container queries:** `container-type: inline-size`, `@container`, `cqi`
- **Viewport units:** vw / vh, `svh` / `lvh` / `dvh` (адресная строка)
- **prefers-*:** color-scheme, reduced-motion, contrast

## Семантика, доступность и формы

- **Семантика:** `<button>` / `<a href>` vs `<div onclick>`, скринридер, клавиатура, SEO
- **Landmarks:** header, nav, main, aside, footer · h1–h6 без пропусков
- **WCAG 2.2:** POUR · A / AA (продукт) / AAA · focus obscured 2.4.11, target size 24×24 2.5.8, drag 2.5.7, redundant entry 3.3.7, auth 3.3.8
- **Дерево доступности:** role + name + description + state · скрыты `display:none`, `visibility:hidden`, `hidden`, `aria-hidden` · `opacity: 0` остаётся
- **Имена:** `aria-labelledby` → `aria-label` → `label`/`alt` → содержимое → `title` · placeholder ≠ label · `alt=""` декор
- **ARIA и скрытие:** default roles без дублирования · `aria-hidden` — из дерева, но не из tab · `inert` — из дерева, tab и событий · `aria-live`
- **Фокус:** `:focus-visible` вместо `outline: none`, trap и возврат в модалке, `scroll-padding-top`
- **Валидация:** `required`, `pattern`, `checkValidity`, `setCustomValidity` · сервер обязателен · `aria-invalid` + `aria-describedby`
- **Аудит:** axe/Lighthouse → клавиатура → zoom 400% → скринридер → формы · автотесты не заменяют ручной проход
- **APG-виджеты:** tabs (`tablist`/`tab`/`tabpanel`), dialog, disclosure/accordion, menu/menubar, combobox/listbox, tooltip, tree/grid
- **Состояния:** `aria-expanded` disclosure/menu · `aria-selected` tab/option · `aria-checked` · `aria-pressed` · `aria-activedescendant`
- **Фокус в виджете:** roving tabindex (активный `0`, остальные `-1`) vs `aria-activedescendant` (фокус остаётся в поле)
- **Dialog:** фокус внутрь → trap → `Esc` → возврат на триггер · `showModal()` + `inert` · безопасное действие первым
- **Live regions:** `role="status"` (polite) / `role="alert"` (assertive) · регион заранее · `aria-atomic` · не дублировать фокусом
- **Границы:** `role="menu"` ≠ навигация · tooltip не интерактивен · `role="grid"` для интерактивных таблиц, не для layout

## Рендеринг

- **Pipeline:** DOM + CSSOM → Render Tree → Layout → Paint → Composite
- **Блокировка:** CSS блокирует рендер, критический CSS inline, preload scanner
- **Скрипты:** обычный (блокирует парсинг), `async` (без порядка), `defer` (после DOM, по порядку)
- **Стоимость:** layout (width, top) > paint (color) > composite (transform, opacity)
- **Layout thrashing:** запись → чтение `offsetWidth` → forced sync layout · батчинг
- **Оптимизации:** `will-change`, `contain`, `content-visibility: auto`

## Стилизация и токены

- **Подходы:** глобальный CSS, CSS Modules (0 runtime), Tailwind (utility-first), CSS-in-JS
- **CSS-in-JS:** runtime (SSR, RSC, бандл) vs zero-runtime (Vanilla Extract)
- **Custom properties:** runtime, наследование, scope vs Sass-переменные
- **Методологии:** BEM, ITCSS, `@layer` · инкапсуляция: Shadow DOM, `@scope`
- **Токены:** primitive → semantic → component · темы через `data-theme`
- **Figma и pipeline:** Variables (modes), Tokens Studio → Style Dictionary → платформы
