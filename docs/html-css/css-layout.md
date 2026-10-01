---
title: "Flexbox и Grid: современные механизмы раскладки"
section: html-css
description: "Flexbox и Grid — два основных механизма раскладки в современном CSS. Flexbox работает вдоль одной оси, Grid — по двум. Разбираем алгоритмы распределения пространства, выравнивание и ключевые различия подходов."
order: 3
tags: ["flexbox", "grid", "flex-basis", "minmax", "subgrid", "grid-template-areas"]
questions:
  - "Как `flex-direction` определяет main axis и почему от этого зависит поведение `justify-content` и `align-items`"
  - "Как алгоритм `flex-basis` → `flex-grow` → `flex-shrink` определяет итоговые размеры и чем `flex: 1` отличается от `flex: auto`"
  - "Почему `text-overflow: ellipsis` не работает во flex-элементе без `min-width: 0` и как это связано с минимальным размером контента"
  - "Чем explicit grid отличается от implicit grid и как браузер создаёт неявные треки через `grid-auto-*`"
  - "Почему `fr` распределяет пространство не так, как `%`, и как `minmax()` с `auto-fit`/`auto-fill` создаёт адаптивную сетку без медиа-запросов"
  - "Какие ограничения на форму областей в `grid-template-areas` и какую проблему выравнивания решает subgrid"
  - "Как понять, когда нужен Grid, а когда Flexbox, и что общего у их систем выравнивания"
answers:
  - "`flex-direction` задаёт main axis — направление раскладки flex-элементов; `justify-content` всегда выравнивает по main axis, `align-*` — по cross axis. Это справедливо и для Grid, поэтому в колонке `justify-content: center` центрирует по вертикали, а не по горизонтали."
  - "`flex-basis` задаёт начальный размер до распределения места (для `row` заменяет `width`, для `column` — `height`); если сумма базовых размеров меньше контейнера, `flex-grow` делит только свободное пространство пропорционально коэффициентам, а при переполнении `flex-shrink` сжимает элементы по формуле `flex-basis * flex-shrink`. `flex: 1` — это `1 1 0%` (база нулевая, колонки равны независимо от контента), а `flex: auto` — `1 1 auto` (база по контенту, колонки пропорциональны содержимому)."
  - "По умолчанию flex-элемент имеет `min-width: auto` и не может быть уже минимального размера контента, поэтому текст не сжимается и `text-overflow` не применяется; `min-width: 0` вместе с `overflow: hidden` разрешает сжатие до нуля, и ellipsis начинает работать."
  - "Explicit grid — треки, заданные через `grid-template-columns`/`rows`/`areas`; когда элементов больше явных ячеек или элемент выходит за их границы, браузер автоматически добавляет implicit треки, размер которых управляется `grid-auto-rows`/`grid-auto-columns` (по умолчанию — по контенту)."
  - "`fr` делит только доступное пространство — остаток после вычета фиксированных треков и gap'ов, а не всю ширину контейнера, как `%`; трек при этом уважает минимальный размер контента, поэтому для строгих ограничений используют `minmax(0, 1fr)`. `repeat(auto-fit, minmax(280px, 1fr))` создаёт столько треков, сколько есть элементов, схлопывая пустые до нуля; `auto-fill`, в отличие от `auto-fit`, оставляет пустые треки."
  - "Строки объявляются как ASCII-диаграмма имён областей (`\"header header\"`, `\"sidebar main\"`), элементы подключаются через `grid-area`, а перестроение под мобильные делается только сменой `grid-template-areas` в `@media`; каждая область должна быть сплошным прямоугольником без разрывов, иначе будет ошибка. Без subgrid вложенная сетка имеет собственные треки, поэтому заголовки и цены карточек не выравниваются по общей сетке; `grid-template-columns: subgrid` заставляет вложенную сетку наследовать треки родителя, но требует проверки через `@supports`."
  - "Grid — для двумерных макетов, где важны и строки, и колонки (страничные структуры, карточные сетки); Flexbox — для одномерных распределений вдоль одной оси (панель инструментов, строка с сайдбаром и контентом). Для списка в одну строку или колонку проще Flexbox, для общего макета страницы — Grid."
---

# Flexbox и Grid: современные механизмы раскладки

Flexbox и Grid — два основных механизма раскладки в современном CSS. Flexbox раскладывает элементы вдоль одной оси, Grid — одновременно по строкам и колонкам. Чтобы не теряться в «магии» раскладки, нужно понимать алгоритмы распределения пространства: в Flexbox это `flex-basis` → `flex-grow` → `flex-shrink`, в Grid — единицы `fr` и функция `minmax`. Понимание этих механизмов и различий между ними — ключ к уверенной вёрстке любых интерфейсов.

## Содержание

1. [Глубокий разбор: Flexbox](#глубокий-разбор-flexbox)
2. [Глубокий разбор: Grid](#глубокий-разбор-grid)
3. [Flexbox vs Grid](#flexbox-vs-grid)
4. [Практические примеры](#практические-примеры)
5. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
6. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
7. [Заключение](#заключение)
8. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор: Flexbox

### Две оси: main axis и cross axis

Каждый flex-контейнер задаёт две оси.

- **Main axis** (главная ось) — направление, вдоль которого располагаются flex-элементы. Задаётся `flex-direction`.
- **Cross axis** (поперечная ось) — перпендикулярно главной.

```css
.flex-row {
  display: flex;
  flex-direction: row; /* main axis слева направо (по умолчанию) */
}

.flex-column {
  display: flex;
  flex-direction: column; /* main axis сверху вниз */
}
```

`flex-direction` принимает значения `row`, `row-reverse`, `column`, `column-reverse`. Вместе с `writing-mode` они определяют, где физическое начало и конец осей. Поэтому важны логические свойства:

- `justify-content` выравнивает по main axis.
- `align-items` выравнивает по cross axis.

Свойства `justify-*` всегда относятся к main axis, `align-*` — к cross axis. Это справедливо и для Grid.

### Flex-элементы: что происходит с детьми

Прямые дети flex-контейнера становятся flex-элементами. При этом:

- `float` и `clear` не работают.
- `vertical-align` игнорируется.
- Margin’ы не схлопываются.
- Анонимные текстовые узлы оборачиваются в анонимные flex-элементы.

По умолчанию каждый flex-элемент:

```css
flex: 0 1 auto;
```

Это означает: не расти (`flex-grow: 0`), сжиматься при необходимости (`flex-shrink: 1`), базовый размер по контенту (`flex-basis: auto`).

### `flex-basis` vs `width`

**`flex-basis`** — это начальный размер flex-элемента до распределения свободного места. Для `flex-direction: row` `flex-basis` заменяет `width`; для `column` — `height`.

```css
.item {
  flex-basis: 200px;
}
```

Ключевые отличия от `width`:

- `flex-basis` работает только во flex-контексте.
- Если заданы и `flex-basis`, и `width` (для row), приоритет у `flex-basis`, кроме значения `auto` у `flex-basis` — тогда используется `width`.
- `flex-basis: content` задаёт размер по контенту, включая возможность переноса строк.

Важный нюанс: `flex-basis` учитывает `box-sizing`. Если у элемента `box-sizing: border-box`, то `flex-basis: 200px` включает padding и border.

### `flex-grow`: как делится лишнее место

**`flex-grow`** определяет, как flex-элемент забирает свободное пространство вдоль main axis. Значение — не процент, а коэффициент.

```css
.container {
  display: flex;
  width: 600px;
}

.a { flex-grow: 1; }
.b { flex-grow: 2; }
```

Если суммарный базовый размер элементов меньше 600px, оставшееся место делится в пропорции 1:2. Важно: делится не вся ширина контейнера, а только **свободное пространство**.

Если `flex-basis: 0`, элемент как будто не имеет собственного размера, и весь контейнер делится пропорционально `flex-grow`.

```css
.equal {
  flex: 1 1 0; /* равные колонки независимо от контента */
}
```

### `flex-shrink`: как сжимается при нехватке места

**`flex-shrink`** определяет, как элемент уменьшается, когда сумма базовых размеров превышает размер контейнера.

```css
.container {
  display: flex;
  width: 400px;
}

.a { flex-basis: 300px; flex-shrink: 1; }
.b { flex-basis: 300px; flex-shrink: 2; }
```

Избыток: 300 + 300 − 400 = 200px. Он распределяется обратно пропорционально `flex-shrink` с учётом базового размера. Элемент `b` сожмётся сильнее, чем `a`, но не ровно вдвое — формула учитывает `flex-basis * flex-shrink`.

Если нужно запретить сжатие:

```css
.item {
  flex-shrink: 0;
}
```

### Shorthand `flex`

Свойство `flex` объединяет `flex-grow`, `flex-shrink` и `flex-basis`. Возможны три ключевых значения:

```css
flex: initial;   /* 0 1 auto — по умолчанию */
flex: auto;      /* 1 1 auto — расти и сжиматься от размера контента */
flex: none;      /* 0 0 auto — фиксированный размер, не сжиматься */
flex: 1;         /* 1 1 0% — занять всё доступное место */
```

Частая ошибка: `flex: 1` устанавливает `flex-basis: 0%`, а не `auto`. Это важно, когда контент элементов сильно различается: с `flex: 1` колонки будут равными, с `flex: auto` — пропорциональными контенту.

### Выравнивание

#### `justify-content` — по main axis

```css
.container {
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;
}
```

- `space-between` — первый и последний элементы у краёв, остальные равномерно.
- `space-around` — равные промежутки с половинками по краям.
- `space-evenly` — все промежутки, включая краевые, равны.

#### `align-items` — по cross axis для всех элементов в строке

```css
.container {
  align-items: stretch | flex-start | flex-end | center | baseline;
}
```

По умолчанию `stretch`: элементы растягиваются на всю высоту строки.

#### `align-self` — переопределение для одного элемента

```css
.item {
  align-self: flex-start;
}
```

#### `align-content` — распределение строк при переносе

Работает только тогда, когда `flex-wrap: wrap` и есть несколько строк. Управляет промежутками между строками по cross axis.

```css
.container {
  flex-wrap: wrap;
  align-content: flex-start | flex-end | center | space-between | space-around | space-evenly | stretch;
}
```

Без `align-content` строки растягиваются и распределяются по умолчанию. Если высота контейнера больше суммы высот строк, `align-content` решает, как заполнить пространство.

### `flex-wrap` и многострочность

По умолчанию `flex-wrap: nowrap` — все элементы в одну строку. Для переноса:

```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
```

При переносе каждая строка становится отдельной линией для выравнивания. `align-items` работает внутри строки, `align-content` — между строками.

### `gap` и `order`

`gap` задаёт расстояние между элементами по main и cross axis:

```css
.container {
  gap: 16px 24px; /* row-gap column-gap */
}
```

`order` меняет визуальный порядок элементов. По умолчанию 0; элементы с меньшим `order` идут раньше.

```css
.first { order: -1; }
```

Важно: `order` меняет только визуальный порядок, не DOM-порядок. Это критично для accessibility: скринридеры и фокус по-прежнему следуют исходному порядку.

### Минимальные размеры и переполнение

По умолчанию flex-элементы не могут быть меньше минимального размера контента (`min-width: auto`). Это часто приводит к тому, что элементы не сжимаются до нуля, даже при `flex-shrink: 1`.

```css
.item {
  min-width: 0; /* разрешить сжатие до нуля */
  overflow: hidden;
}
```

Это особенно важно для текстовых блоков внутри flex-контейнера: без `min-width: 0` текст не будет обрезаться `text-overflow: ellipsis`.

## Глубокий разбор: Grid

### Explicit и implicit grid

**Explicit grid** (явная сетка) — это треки, которые вы задали явно через `grid-template-columns`, `grid-template-rows` или `grid-template-areas`.

**Implicit grid** (неявная сетка) — треки, которые браузер добавляет автоматически, когда элементов больше, чем явных ячеек, или когда элемент выходит за границы явной сетки.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 100px;
}
```

Здесь три колонки заданы явно. Если элементов больше девяти, браузер создаст дополнительные строки высотой 100px — это implicit grid.

Размер implicit-треков управляется `grid-auto-columns` и `grid-auto-rows`. Если они не заданы, implicit треки получают размер по контенту.

### Единица `fr`

**`fr`** (fraction, доля) — это гибкая единица, которая распределяет **доступное** пространство после вычета фиксированных треков и gap’ов.

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 2fr;
}
```

После вычета 200px оставшееся место делится в пропорции 1:2. Важно: `fr` распределяет именно свободное пространство, а не всю ширину. Если контент в `1fr` больше, чем его доля, трек может стать шире — но не шире доступного места.

`fr` нельзя напрямую комбинировать с `auto` в одном выражении, но можно писать `1fr auto 2fr`. В таком случае `auto` сначала займёт место под контент, а `fr` поделит остаток.

### `minmax()`

Функция **`minmax(min, max)`** задаёт диапазон размеров трека. Трек не будет уже `min` и не шире `max`.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
}
```

Каждая колонка занимает равную долю, но не менее 200px. Когда места станет меньше 600px, Grid создаст переполнение, если не задан `auto-fit`/`auto-fill`.

Частое сочетание:

```css
.grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

Это создаёт адаптивную сетку: колонки не уже 280px, а свободное место распределяется поровну.

### `auto-fit` vs `auto-fill`

`repeat()` может принимать `auto-fit` или `auto-fill` вместо фиксированного числа повторений.

- **`auto-fill`** — создаёт столько треков, сколько помещается в контейнер, даже пустых.
- **`auto-fit`** — создаёт столько треков, сколько есть элементов, и схлопывает пустые треки до нуля.

```css
.fill {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.fit {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

Разница заметна, когда элементов меньше, чем может поместиться. В `auto-fill` останутся пустые треки; в `auto-fit` оставшееся место распределится между заполненными.

Для большинства интерфейсов используйте `auto-fit`: оно даёт поведение «растянуть элементы на всю ширину».

### `grid-template-areas`

Именованные области позволяют описывать макет визуально:

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

Преимущества:

- Макет читается как ASCII-арт.
- Перестроение на мобильных делается сменой `grid-template-areas`, а не селекторов.
- Области должны быть прямоугольниками без разрывов.

### Размещение элементов: линии и span

Элемент можно разместить по номерам линий:

```css
.item {
  grid-column: 1 / 3;
  grid-row: 2 / span 2;
}
```

`span 2` означает «занять два трека». Отрицательные номера линий отсчитываются с конца: `grid-column: 1 / -1` растянет элемент на всю ширину.

### Alignment в Grid

В Grid те же свойства, что и в Flexbox, но применяются к двум осям одновременно:

- `justify-items` — выравнивание содержимого ячеек по inline-оси (горизонталь).
- `align-items` — выравнивание по block-оси (вертикаль).
- `justify-content` — выравнивание всей сетки, если она уже контейнера.
- `align-content` — то же по вертикали.
- `justify-self` / `align-self` — переопределение для отдельного элемента.

```css
.grid {
  display: grid;
  place-items: center; /* сокращение для align-items + justify-items */
}
```

### Gap

```css
.grid {
  gap: 16px 24px; /* row-gap column-gap */
}
```

В отличие от margin’ов, gap не схлопывается и не создаёт лишних отступов по краям.

### Subgrid

**Subgrid** позволяет вложенному grid-контейнеру наследовать треки родительской сетки.

```css
.parent {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
}

.child {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
}
```

Элемент `.child` занимает всю ширину родителя и использует его же колонки. Это решает проблему выравивания контента внутри вложенных компонентов по общей сетке.

На момент написания subgrid поддерживается в современных Firefox, Chrome, Edge и Safari. Для продакшена стоит проверять через `@supports`:

```css
.child {
  display: grid;
}

@supports (grid-template-columns: subgrid) {
  .child {
    grid-template-columns: subgrid;
  }
}
```

### Implicit vs explicit placement

Если не задать `grid-column`/`grid-row`, элемент размещается по алгоритму **auto-placement**: слева направо, сверху вниз, заполняя пустые ячейки. Свойство `grid-auto-flow` управляет направлением:

```css
.grid {
  grid-auto-flow: row; /* по умолчанию */
}

.grid-dense {
  grid-auto-flow: row dense; /* заполнять пустоты при наличии */
}
```

`dense` пытается заполнить дырки, оставшиеся от больших элементов, но это может нарушить визуальный порядок.

## Flexbox vs Grid

- **Flexbox** — одномерная раскладка: распределение вдоль одной оси (main axis), перенос на новую строку через `flex-wrap`.
- **Grid** — двумерная раскладка: строки и колонки задаются независимо, элементы размещаются по линиям или именованным областям.
- **Выбор**: для общей структуры страницы (шапка, сайдбар, контент, футер) — Grid; для распределения элементов внутри одной строки или колонки (панель, список кнопок, строка сайдбар+контент) — Flexbox.
- **Выравнивание**: набор свойств `justify-*`/`align-*` общий, но в Flexbox `justify-content` работает вдоль main axis, а в Grid `justify-items` — по inline-оси внутри ячеек.
- **Адаптивность**: и Grid (`auto-fit`/`auto-fill` + `minmax`), и Flexbox (`flex-wrap`) позволяют строить адаптивные раскладки без медиа-запросов, но Grid делает это точнее.
- **Гибкость размера**: `fr` в Grid и `flex-grow`/`flex-shrink` в Flexbox оба распределяют именно свободное пространство, а не всю ширину контейнера.

## Практические примеры

### Пример 1: равные колонки (Flexbox)

```html
<div class="row">
  <div class="col">A</div>
  <div class="col">B</div>
  <div class="col">C</div>
</div>
```

```css
.row {
  display: flex;
  gap: 16px;
}

.col {
  flex: 1 1 0;
}
```

Все три колонки одинаковой ширины независимо от контента, потому что `flex-basis: 0` и `flex-grow` равны.

### Пример 2: фиксированный сайдбар и гибкий контент (Flexbox)

```html
<div class="layout">
  <aside class="sidebar">Sidebar</aside>
  <main class="content">Main content</main>
</div>
```

```css
.layout {
  display: flex;
  gap: 24px;
}

.sidebar {
  flex: 0 0 240px;
}

.content {
  flex: 1 1 auto;
  min-width: 0;
}
```

Сайдбар фиксированной ширины, основной контент занимает оставшееся место. `min-width: 0` позволяет контенту сжиматься.

### Пример 3: адаптивная сетка карточек (Grid)

```html
<div class="cards">
  <div class="card">1</div>
  <div class="card">2</div>
  <div class="card">3</div>
  <div class="card">4</div>
</div>
```

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
```

Карточки растягиваются на всю ширину, но не уже 280px. При уменьшении viewport они переносятся.

### Пример 4: классический layout с областями (Grid)

```html
<div class="layout">
  <header class="header">Header</header>
  <aside class="sidebar">Sidebar</aside>
  <main class="main">Content</main>
  <footer class="footer">Footer</footer>
</div>
```

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
  gap: 16px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    grid-template-areas:
      "header"
      "sidebar"
      "main"
      "footer";
  }
}
```

Перестроение на мобильных достигается только изменением `grid-template-areas`.

### Пример 5: subgrid для вложенных карточек

```html
<div class="products">
  <article class="product">
    <h3>Product A</h3>
    <p>Description</p>
    <span class="price">$10</span>
  </article>
  <article class="product">
    <h3>Product B with longer name</h3>
    <p>Another description</p>
    <span class="price">$20</span>
  </article>
</div>
```

```css
.products {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.product {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
}

@supports (grid-template-rows: subgrid) {
  .product {
    grid-template-rows: subgrid;
    grid-row: span 3;
  }
}
```

С subgrid заголовки, описания и цены разных карточек выравниваются по общей сетке строк.

## Типичные ошибки и антипаттерны

- **Использование Grid там, где достаточно Flexbox.** Grid — для двумерных макетов; Flexbox — для одномерных распределений. Для списка в одну строку часто проще Flexbox.
- **Путаница `flex-basis` и `width`.** `flex-basis` определяет начальный размер до распределения пространства, а `width` — фактический размер только если `flex-basis: auto`. В flex-контексте предпочтительнее управлять размерами через `flex-basis`.
- **Использование `flex: 1` для «одинаковых колонок» без понимания `flex-basis: 0%`.** Это работает, но если нужна пропорциональность контенту, используйте `flex: auto`.
- **Ожидание, что `align-content` работает без `flex-wrap`.** `align-content` влияет только на распределение строк, поэтому без многострочности игнорируется.
- **Забытое `min-width: 0` при переполнении текста.** По умолчанию flex-элемент не может быть уже контента, и `text-overflow` не сработает.
- **Использование `order` для изменения логического порядка.** Визуальный порядок не должен расходиться с порядком в DOM — это ломает accessibility и навигацию с клавиатуры.
- **Путаница `auto-fit` и `auto-fill`.** `auto-fill` оставляет пустые треки; `auto-fit` схлопывает их. В 90% случаев нужен `auto-fit`.
- **Ожидание, что `fr` учитывает контент.** `fr` делит доступное пространство, но треки всё равно уважают минимальный размер контента. Для строгих ограничений используйте `minmax(0, 1fr)`.
- **Переполнение с `minmax(200px, 1fr)` без `auto-fit`/`auto-fill`.** Фиксированное число колонок с `minmax` даст горизонтальный скролл, если места не хватит.
- **Неправильные области в `grid-template-areas`.** Область должна быть сплошным прямоугольником. Разорванная фигура вызовет ошибку.
- **Subgrid без fallback.** Subgrid не везде поддерживается; проверяйте через `@supports`.

## Ключевые тезисы для интервью

- Flexbox раскладывает элементы вдоль main axis (`flex-direction`): `justify-*` выравнивает по main axis, `align-*` — по cross axis; `flex-basis` задаёт начальный размер до распределения пространства.
- `flex-grow` делит только свободное пространство пропорционально коэффициентам, а при переполнении `flex-shrink` сжимает элементы по формуле `flex-basis * flex-shrink`. Шортханды: `flex: 1` = `1 1 0%` (равные колонки), `flex: auto` = `1 1 auto` (пропорционально контенту).
- Flex-элементы по умолчанию имеют `min-width: auto` и не могут стать уже контента, поэтому `text-overflow: ellipsis` работает только после `min-width: 0`; `order` меняет лишь визуальный порядок и при расхождении с DOM ломает доступность.
- Grid раскладывает элементы одновременно по строкам и колонкам; явные треки задаются через `grid-template-*`, а при выходе за границы браузер создаёт implicit треки, управляемые `grid-auto-rows`/`grid-auto-columns`.
- `fr` делит только свободное пространство (остаток после фиксированных треков и gap'ов), а не всю ширину контейнера, как `%`; `repeat(auto-fit, minmax(250px, 1fr))` создаёт адаптивную сетку без медиа-запросов, где `auto-fit` схлопывает пустые треки, а `auto-fill` — оставляет.
- `grid-template-areas` описывает макет ASCII-диаграммой и перестраивается сменой значений в `@media`; области должны быть прямоугольниками. Subgrid позволяет вложенной сетке наследовать треки родителя, выравнивая вложенные компоненты по общей сетке.
- Grid выбирают для двумерных страничных макетов, Flexbox — для одномерных распределений вдоль одной оси (панель инструментов, строка с сайдбаром).

## Заключение

Flexbox и Grid дополняют друг друга. Flexbox решает задачу одномерной раскладки: понимание алгоритма `flex-grow`/`flex-shrink`/`flex-basis` и осей позволяет точно управлять размерами без магических значений. Grid — двумерная система для страничных структур: `fr` с `minmax()` и `auto-fit` создают адаптивные сетки без медиа-запросов, а `grid-template-areas` делает макет читаемым и легко перестраиваемым. Правило выбора простое: общая структура страницы — Grid, распределение по одной оси — Flexbox.

## Полезные ссылки

- [CSS Flexible Box Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)
- [A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [minmax()](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax)
- [Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)
- [A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)