---
title: "Positioning, stacking context и formatting contexts"
section: html-css
description: "Позиционирование, stacking context и formatting contexts объясняют, как браузер размещает элементы и рисует их слоями. Containing block, BFC, margin collapse и порядок отрисовки — фундамент предсказуемой вёрстки."
order: 4
tags: ["positioning", "stacking-context", "z-index", "bfc", "containing-block", "margin-collapse"]
questions:
  - "Как определяется containing block для `position: absolute` и `position: fixed` и почему `transform` на предке ломает `fixed`"
  - "Что такое stacking context, какие свойства его создают и почему дочерний `z-index` не может перекрыть элемент вне контекста родителя"
  - "В каком порядке браузер рисует элементы внутри stacking context: фон, отрицательный z-index, поток, float, inline, позиционированные"
  - "Почему `position: sticky` может не работать и какие условия нужны для его корректной работы"
  - "Как `z-index` работает в flex/grid-контейнерах без `position` и чем это отличается от обычного потока"
  - "Что такое formatting context и какие виды (BFC, IFC, FFC, GFC) существуют в CSS"
  - "Какие условия создают новый BFC, почему `display: flow-root` предпочтительнее `overflow: hidden` и при каких условиях происходит margin collapse"
answers:
  - "Для `absolute` containing block — ближайший предок с `position` не `static` (или с `transform`/`filter`/`perspective`/`contain: paint/layout`), иначе `<html>`; для `fixed` по умолчанию viewport, но любой предок с `transform` становится containing block'ом, и элемент позиционируется относительно него — это ломает модалки, вложенные в анимированные контейнеры."
  - "Stacking context — изолированная группа слоёв, где элементы рисуются от дальних к ближним; его создают `z-index` у позиционированного элемента, `opacity < 1`, `transform`, `filter`, `isolation: isolate`, `mix-blend-mode`, `will-change`, `contain` и flex/grid-контейнер с `z-index` у детей. Дочерний элемент «заперт» в контексте родителя: `child-a` с `z-index: 9999` не перекроет `.parent-b`, чей контекст выше."
  - "От дальнего к ближнему: фон и border контекста → отрицательный `z-index` → элементы нормального потока → float → inline → позиционированные с `z-index: auto`/без него → положительный `z-index`; поэтому `position: relative` без `z-index` иногда перекрывает float, а иногда нет."
  - "Sticky требует минимум одного порога (`top`/`right`/`bottom`/`left`) и прокручиваемого предка выше в DOM; он не сработает, если у предков `overflow: hidden`/`scroll` без прокрутки или родительский контейнер слишком низкий — нет области для «прилипания»."
  - "Flex/grid-контейнер, у которого дети имеют `z-index` отличный от `auto`, сам становится stacking context'ом, и его дети могут получать `z-index` без `position` — в обычном потоке у `static`-элемента `z-index` не работает."
  - "Formatting context — область документа, где блоки раскладываются по единому набору правил и влияют друг на друга: BFC (блочный, вертикальная раскладка и схлопывание margin'ов), IFC (inline, строки и базовая линия), FFC (flex, оси) и GFC (grid, ячейки сетки)."
  - "Новый BFC создают `float`, `position: absolute/fixed`, `display: inline-block`/`table-cell`/`flow-root`, `overflow` не `visible` и flex/grid-контейнер; `flow-root` делает это без побочных эффектов, тогда как `overflow: hidden` может обрезать контент и тени или создать скроллбар. Внутри BFC вертикальные margin'ы соседних блоков объединяются, margin'ы родителя и крайнего потомка не «выпадают» наружу, а float не обтекается содержимым блока с BFC; схлопываются margin'ы только блочных элементов в одном BFC, а в FFC/GFC margin'ы не схлопываются и `z-index` работает даже без `position`."
---

# Positioning, stacking context и formatting contexts

Позиционирование — один из самых частых источников путаницы в CSS. Разработчики знают, что `position: absolute` выводит элемент из потока, но теряются, когда речь заходит о containing block, stacking context’ах и порядке отрисовки. Вторая половина картины — formatting contexts: области, в которых блоки раскладываются по единым правилам. Понимание этих механизмов объясняет большинство «магических» поведений вёрстки: почему margin «выпадает» из родителя, почему `transform` ломает `fixed` и почему `z-index: 9999` не всегда перекрывает соседа.

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Formatting contexts](#formatting-contexts)
3. [Практические примеры](#практические-примеры)
4. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
5. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
6. [Заключение](#заключение)
7. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### Типы позиционирования

CSS предлагает пять значений `position`:

- `static` — значение по умолчанию. Элемент находится в нормальном потоке, свойства смещения (`top`, `right`, `bottom`, `left`, `inset`) игнорируются.
- `relative` — элемент остаётся в потоке, но может смещаться относительно своего нормального положения.
- `absolute` — элемент выводится из потока и позиционируется относительно containing block.
- `fixed` — элемент позиционируется относительно viewport (или containing block, если он создаётся `transform`/`filter`/`perspective`/`contain` у предка).
- `sticky` — гибрид `relative` и `fixed`: элемент ведёт себя как `relative`, пока не достигнет заданного порога в пределах своего ближайшего прокручиваемого предка.

### `position: relative`

**Relative positioning** (относительное позиционирование) смещает элемент, не меняя его место в потоке. Окружающие элементы по-прежнему считают, что он занимает исходную позицию.

```css
.box {
  position: relative;
  top: 20px;
  left: 20px;
}
```

Элемент сдвинется вниз и вправо на 20px, но пространство, которое он занимал, останется пустым. Это удобно для небольших сдвигов, но плохо подходит для раскладки.

### `position: absolute`

**Absolute positioning** (абсолютное позиционирование) полностью выводит элемент из нормального потока. Его размер и местоположение определяются относительно **containing block** (содержащего блока).

Containing block для `absolute` — это ближайший предок, у которого `position` не `static`, либо предок с `transform`, `filter`, `perspective` или `contain: paint/layout`. Если такого нет — containing block станет `<html>`.

```css
.card {
  position: relative;
}

.badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
```

Важные нюансы:

- Абсолютно позиционированный элемент сжимается до ширины контента, если явно не задана ширина.
- `margin: auto` в сочетании с `inset: 0` и фиксированными размерами центрирует элемент в containing block.

### `position: fixed`

**Fixed positioning** (фиксированное позиционирование) похоже на `absolute`, но containing block по умолчанию — viewport. Элемент не прокручивается вместе со страницей.

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
}
```

Исключение: если предок имеет `transform`, `filter`, `perspective` или `contain`, он становится containing block’ом для `fixed`, и элемент начинает позиционироваться относительно него. Это часто ломает модальные окна, вложенные в анимированные контейнеры.

### `position: sticky`

**Sticky positioning** (липкое позиционирование) требует указания хотя бы одного порога (`top`, `right`, `bottom`, `left`). Элемент ведёт себя как `relative`, пока его позиция в прокручиваемом контейнере не достигнет порога. После этого он «прилипает».

```css
.header {
  position: sticky;
  top: 0;
}
```

Условия работы:

- Ближайший предок с прокруткой должен быть выше sticky-элемента в DOM.
- Родительский контейнер должен быть достаточно высоким, чтобы была область для «прилипания».
- Свойство `overflow` у предков может влиять на поведение sticky.

### Stacking context

**Stacking context** (контекст наложения) — это трёхмерная концепция: элементы внутри одного stacking context’а рисуются слоями от дальних к ближним. `z-index` работает только внутри одного stacking context’а и не позволяет элементу «пробить» границу родительского контекста.

Stacking context создаётся:

- Корневой элемент (`<html>`).
- Элемент с `position: absolute`/`relative`/`fixed`/`sticky` и явным `z-index`, отличным от `auto`.
- Элемент с `opacity` меньше 1.
- Элемент с `transform`, `filter`, `perspective`, `clip-path`, `mask`.
- Элемент с `isolation: isolate`.
- Элемент с `mix-blend-mode`, отличным от `normal`.
- Flex/grid-контейнер, у которого дети имеют `z-index`, отличный от `auto`.
- Элемент с `will-change`.
- Элемент с `contain: layout`/`paint`/`strict`/`content`.

### `z-index`

**`z-index`** управляет порядком наложения элементов внутри одного stacking context’а. Большое значение рисуется ближе к пользователю.

```css
.modal {
  position: fixed;
  z-index: 100;
}

.tooltip {
  position: absolute;
  z-index: 10;
}
```

Ключевые моменты:

- `z-index` не работает для `position: static`.
- `z-index: auto` не создаёт нового stacking context’а.
- Дочерний элемент с огромным `z-index` не может выйти за пределы stacking context’а родителя. Если родитель `.tooltip` лежит под `.modal`, дочерний элемент `.tooltip` не перекроет `.modal`, сколько бы `z-index` ему ни задали.

### Порядок отрисовки внутри stacking context

Внутри одного stacking context’а браузер рисует элементы в таком порядке (от дальнего к ближнему):

1. Фон и border контекста.
2. Дочерние элементы с отрицательным `z-index`.
3. Элементы в нормальном потоке (`static`, `relative` без `z-index`).
4. Плавающие элементы (`float`).
5. Строчные элементы (inline).
6. Дочерние элементы с `position` и `z-index: auto` (или без `z-index`).
7. Дочерние элементы с положительным `z-index`.

Это объясняет, почему иногда `position: relative` без `z-index` перекрывает float, а иногда нет: порядок рисования зависит от комбинации факторов.

## Formatting contexts

### Что такое formatting context

**Formatting context** — это область документа, внутри которой блоки раскладываются по единому набору правил. Все элементы внутри одного контекста влияют друг на друга: например, вертикальные margin’ы блоков в нормальном потоке схлопываются, а inline-элементы распределяются по строкам.

Существует четыре основных типа:

- **BFC** — Block Formatting Context.
- **IFC** — Inline Formatting Context.
- **FFC** — Flex Formatting Context.
- **GFC** — Grid Formatting Context.

### Block Formatting Context (BFC)

**BFC** (блочный контекст форматирования) — это область, в которой блочные элементы располагаются вертикально друг под другом, а margin’ы между ними схлопываются.

Элемент создаёт новый BFC, если у него:

- `float` не `none`;
- `position` равно `absolute` или `fixed`;
- `display: inline-block`, `table-cell`, `table-caption`, `flow-root`;
- `overflow` не `visible`;
- `display: flex` или `grid` у самого элемента (для его детей создаётся FFC/GFC, но сам flex/grid-контейнер тоже изолирован).

Самый современный и чистый способ создать BFC — `display: flow-root`:

```css
.bfc {
  display: flow-root;
}
```

`flow-root` создаёт BFC без побочных эффектов вроде скролла или изменения inline-поведения.

Что даёт BFC:

- **Изоляция float.** Элементы внутри BFC не выходят за его границы, и сам BFC не обтекает float-соседей, если он блочный.
- **Предотвращение схлопывания margin’ов** между родителем и первым/последним потомком.
- **Остановка обтекания** float-элементов соседними блоками.

### Inline Formatting Context (IFC)

**IFC** (строчный контекст форматирования) возникает внутри блочного контейнера, когда в нём находятся inline-элементы или текст. Элементы располагаются в строках, переносятся по `white-space` и `word-break`, и выравниваются по базовой линии.

Важные особенности IFC:

- Высота строки определяется `line-height`, а не суммой высот inline-элементов.
- `vertical-align` влияет на положение inline-элемента относительно строки.
- Блочные элементы внутри IFC прерывают его и создают анонимные блочные боксы.

Проблемы с IFC часто возникают, когда inline-элементы с разными `font-size` или `vertical-align` создают «лишнее» пространство под строкой. Это одна из причин, почему изображения внутри ссылок иногда имеют небольшой отступ снизу.

### Flex и Grid Formatting Contexts (FFC, GFC)

**FFC** (flex-контекст форматирования) создаётся элементом с `display: flex` или `display: inline-flex`. Все прямые дети становятся flex-элементами и раскладываются по главной и поперечной осям.

**GFC** (grid-контекст форматирования) создаётся элементом с `display: grid` или `display: inline-grid`. Дети располагаются в ячейках сетки.

Общие особенности FFC и GFC:

- Flex/grid-элементы не обтекают float, `margin` не схлопывается.
- `float` и `clear` у flex-элементов не работают.
- `z-index` работает у flex/grid-элементов даже без `position`.
- Размеры flex-элементов определяются не только `width`/`height`, но и `flex-basis`/`flex-grow`/`flex-shrink`; в grid — треками сетки.

### Containing block

**Containing block** (содержащий блок) — это прямоугольная область, относительно которой вычисляются размеры и позиция элемента. Для элементов в нормальном потоке containing block — это content-box ближайшего блочного предка. Но есть исключения:

- Для элемента с `position: fixed` containing block — viewport.
- Для элемента с `position: absolute` containing block — ближайший позиционированный предок (не `static`).
- Для элемента с `position: absolute`, у которого предок имеет `transform`, `filter`, `perspective` или `contain: paint/layout`, containing block может стать этот предок, даже если у него `position: static`.

```css
.modal {
  position: fixed;
  inset: 0;
  margin: auto;
  width: 400px;
  height: 200px;
}
```

Здесь `inset: 0` растягивает элемент до границ viewport, а `margin: auto` центрирует его по размерам `width`/`height`. containing block — viewport.

### Margin collapse

**Margin collapse** (схлопывание margin’ов) — одно из самых неочевидных поведений BFC. Вертикальные margin’ы соседних блочных элементов в одном BFC объединяются, и остаётся только больший из них.

Схлопываются:

- соседние блочные элементы;
- margin родителя и первого/последнего потомка, если между ними нет padding, border или BFC;
- пустые блочные элементы, если у них нет padding, border, height и min-height.

Не схлопываются:

- горизонтальные margin’ы;
- margin’ы элементов в разных BFC;
- margin’ы flex/grid-элементов;
- margin’ы элементов с `position: absolute`/`fixed`;
- margin’ы, у которых хотя бы один равен `auto`.

```css
/* Без схлопывания благодаря padding */
.card {
  padding-top: 1px;
}

.card h2 {
  margin-top: 24px;
}
```

## Практические примеры

### Пример 1: центрирование через `position: absolute`

```html
<div class="overlay">
  <div class="dialog">Dialog</div>
</div>
```

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.dialog {
  position: absolute;
  inset: 0;
  width: 400px;
  height: 200px;
  margin: auto;
}
```

`inset: 0` растягивает `.dialog` до границ `.overlay`, а `margin: auto` центрирует его по заданным размерам.

### Пример 2: `z-index` не пробивает родительский stacking context

```html
<div class="parent-a">
  <div class="child-a">A child</div>
</div>

<div class="parent-b">
  <div class="child-b">B child</div>
</div>
```

```css
.parent-a,
.parent-b {
  position: relative;
  z-index: 1;
}

.child-a {
  position: absolute;
  z-index: 9999;
}

.child-b {
  position: absolute;
  z-index: 2;
}
```

Если `.parent-b` в DOM идёт после `.parent-a`, он рисуется поверх него. `child-a` с `z-index: 9999` всё равно останется под `.parent-b`, потому что он «заперт» внутри stacking context’а `.parent-a`.

### Пример 3: sticky-шапка таблицы

```html
<table>
  <thead>
    <tr><th>Name</th><th>Value</th></tr>
  </thead>
  <tbody>...</tbody>
</table>
```

```css
thead th {
  position: sticky;
  top: 0;
  background: white;
}
```

Шапка прилипает к верху viewport при прокрутке таблицы. Важно задать фон, иначе содержимое строк будет просвечивать сквозь шапку.

### Пример 4: создание stacking context без побочных эффектов

```css
.dropdown {
  position: relative;
  isolation: isolate;
}

.dropdown-menu {
  position: absolute;
  z-index: 10;
}
```

`isolation: isolate` создаёт новый stacking context, не добавляя трансформаций и не меняя прозрачность. Это полезно для компонентов вроде dropdown: меню будет рисоваться поверх соседей, но не выйдет за пределы своего компонента.

### Пример 5: `fixed` внутри трансформированного контейнера

```html
<div class="transformed">
  <div class="fixed">Fixed</div>
</div>
```

```css
.transformed {
  transform: translateX(0);
}

.fixed {
  position: fixed;
  top: 0;
  left: 0;
}
```

Несмотря на `position: fixed`, элемент `.fixed` будет позиционироваться относительно `.transformed`, а не viewport. Это одна из самых неприятных ловушек при работе с модальными окнами и поповерами.

### Пример 6: BFC предотвращает обтекание float

```html
<div class="media">
  <img class="avatar" src="avatar.png" alt="">
  <div class="content">
    <h3>Title</h3>
    <p>Description</p>
  </div>
</div>
```

```css
.avatar {
  float: left;
  width: 64px;
  height: 64px;
  margin-right: 16px;
}

.content {
  display: flow-root; /* создаёт BFC */
}
```

`.content` образует BFC и перестаёт обтекать float-аватарку. Текст внутри не залезет под изображение.

### Пример 7: схлопывание margin’ов и его предотвращение

```html
<article>
  <h2>Heading</h2>
  <p>Paragraph</p>
</article>
```

```css
article {
  background: #f3f4f6;
}

h2 {
  margin-top: 32px;
}
```

Без padding или border у `article` margin-top `h2` «выпадет» за пределы article, и визуально отступ появится сверху article, а не между article и h2. Решения:

```css
article {
  background: #f3f4f6;
  padding-top: 1px; /* или border-top, или display: flow-root */
}
```

## Типичные ошибки и антипаттерны

- **Большие значения `z-index` как решение всех проблем.** Если элемент не перекрывает соседа, чаще всего дело в stacking context’е, а не в недостаточном `z-index`.
- **Забытое `position: relative` у предка absolute-элемента.** Элемент улетит к ближайшему позиционированному предку или к viewport.
- **Использование `z-index` без позиционирования.** У `position: static` `z-index` не работает.
- **Попытки вынести `fixed`-элемент за пределы трансформированного предка.** Любой предок с `transform`/`filter`/`perspective`/`contain` превращается в containing block для `fixed`.
- **Sticky, который не работает из-за `overflow`.** Если все предки имеют `overflow: hidden` без прокрутки, sticky может не «прилипнуть».
- **Непонимание paint order.** Даже без `z-index` браузер рисует элементы в строгом порядке: фон, отрицательный `z-index`, поток, float, inline, позиционированные элементы, положительный `z-index`.
- **Использование `overflow: hidden` для создания BFC.** Работает, но может обрезать контент и тени. `display: flow-root` — лучший выбор.
- **Непонимание, почему margin «выпадает» из родителя.** Выпадение margin — нормальное поведение BFC, а не баг. Лечится padding, border или `display: flow-root`.
- **Попытка схлопнуть margin’ы в flex/grid.** В flex- и grid-контекстах margin’ы не схлопываются — это ожидаемо.

## Ключевые тезисы для интервью

- `position` бывает `static`, `relative`, `absolute`, `fixed`, `sticky`. Containing block для `absolute` — ближайший не-static предок или предок с `transform`/`filter`/`perspective`/`contain`; для `fixed` — обычно viewport, но `transform` у предка ломает это поведение.
- `position: sticky` требует порога (`top`/`bottom`/`left`/`right`) и прокручиваемого предка; не работает, если предок имеет `overflow: hidden` без прокрутки.
- Stacking context — изолированная группа слоёв; `z-index` работает только внутри одного контекста. Дочерний элемент не может перекрыть элемент за пределами stacking context'а своего родителя, даже с огромным `z-index`. Контекст создают `z-index` у позиционированного, `opacity < 1`, `transform`, `filter`, `isolation: isolate`, flex/grid-контейнер с `z-index` у детей, `contain: paint`, `will-change`.
- Порядок отрисовки внутри stacking context: фон контекста → отрицательный `z-index` → поток → float → inline → позиционированные → положительный `z-index`.
- `isolation: isolate` создаёт stacking context без побочных эффектов — чистый способ изолировать наложение.
- Formatting context — область с едиными правилами раскладки: BFC (блочный), IFC (inline), FFC (flex), GFC (grid). BFC создаётся через `display: flow-root`, `overflow` не `visible`, `float`, `position: absolute/fixed` или flex/grid-контейнер; `flow-root` — современный способ без побочных эффектов.
- Margin collapse работает только в BFC для соседних блоков и между родителем и крайними потомками; в flex/grid-контекстах margin'ы не схлопываются, а `z-index` работает без `position`.

## Заключение

Позиционирование в CSS определяется двумя ортогональными механизмами: containing block задаёт систему координат, а stacking context — порядок наложения. Ошибки с `z-index` почти всегда объясняются не недостаточным значением, а неожиданным stacking context'ом у предка. `transform`/`filter` у родителя ломают `position: fixed`, превращая его в `absolute`. Formatting contexts — основа предсказуемого поведения: BFC изолирует блоки, устраняет обтекание float и предотвращает выпадение margin'ов, а `display: flow-root` — современный способ его создать без побочных эффектов. Понимание порядка отрисовки и margin collapse помогает предсказывать, почему один элемент перекрывает другой и откуда берутся «неожиданные» отступы.

## Полезные ссылки

- [Positioning](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning)
- [The stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- [z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)
- [Block formatting context](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context)
- [Containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block)
- [Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)