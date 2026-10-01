---
title: "Парсинг HTML, критический путь рендеринга и производительность CSS"
section: html-css
description: "Как браузер превращает байты в пиксели: парсинг HTML, DOM/CSSOM, Render Tree, Layout, Paint, Composite. И как писать анимации через transform/opacity, чтобы не тормозить страницу: will-change, contain, content-visibility, prefers-reduced-motion."
order: 8
tags: ["rendering-pipeline", "critical-rendering-path", "cssom", "compositor", "animations", "will-change"]
questions:
  - "Каковы этапы превращения HTML в пиксели: парсинг, DOM, CSSOM, Render Tree, layout, paint, composite"
  - "Что такое preload scanner и как он ускоряет загрузку ресурсов, пока основной парсер заблокирован"
  - "Почему браузер должен получить весь CSS перед построением Render Tree и как это влияет на критический путь"
  - "Как `defer` и `async` влияют на порядок выполнения скриптов и парсинг DOM"
  - "Чем отличаются layout, paint и composite по стоимости и почему `transform`/`opacity` анимируются плавно, а `width`/`top` вызывают jank"
  - "Что такое forced synchronous layout и почему чтение геометрии после изменения стилей вызывает jank"
  - "Чем `transition` отличается от `animation` с `@keyframes` и когда что использовать"
  - "Что произойдёт, если злоупотребить `will-change`, и как `contain: layout paint` и `content-visibility: auto` помогают ограничить перерисовку"
answers:
  - "HTML токенизируется и строится в DOM, CSS — в CSSOM, из них формируется Render Tree (DOM + CSSOM минус невидимые узлы), затем layout вычисляет геометрию, paint растеризует пиксели, composite собирает слои на GPU; парсинг/layout/paint идут на main thread, а сборка слоёв и анимации `transform`/`opacity` — на compositor thread."
  - "Основной HTML-парсер синхронный: встретив `<script>` без `defer`/`async`, он выполняет его и не продолжает строить DOM; параллельный лёгкий preload scanner бежит вперёд по сырому HTML, находит `<img>`, `<link rel=\"stylesheet\">`, скрипты и запрашивает их заранее, не теряя время на сетевые задержки — при этом он не строит DOM и не выполняет JS."
  - "CSSOM не может быть частичным — одно правило в конце файла может переопределить всё в начале, поэтому `<link rel=\"stylesheet\">` блокирует построение Render Tree; блокирующий CSS и синхронные скрипты — главные ресурсы критического пути, их уменьшение или inline ускоряет First Contentful Paint."
  - "Скрипт без атрибутов блокирует парсинг DOM, пока не выполнится; `async` скачивается параллельно и выполняется сразу по загрузке без сохранения порядка, а `defer` тоже скачивается параллельно, но выполняется после полного парсинга DOM в порядке объявления — для скриптов, не нужных до рендера, предпочтителен `defer`."
  - "Layout (reflow) — самая дорогая фаза: пересчёт геометрии всего зависимого дерева при изменении `width`/`height`/`top`/`font-size`/`display`; paint (repaint) дешевле — растрирование при изменении `color`/`box-shadow`/`border-radius`; composite дешевле всего — сборка готовых слоёв на GPU при изменении `transform`/`opacity`, без layout и paint. Поэтому `transform` и `opacity` остаются плавными даже под нагрузкой JS, а `width` и `top` каждый кадр пересчитывают layout всего зависимого дерева на main thread."
  - "Браузер откладывает пересчёт до конца кадра, но если скрипт читает `offsetWidth`/`getBoundingClientRect()`/`scrollTop` после записи стилей, он вынужден синхронно выполнить layout — в цикле запись+чтение даёт layout на каждой итерации (layout thrashing); решение — сначала прочитать все значения, потом писать."
  - "`transition` интерполирует значение между двумя состояниями только при изменении computed value (если свойство не изменилось — анимации не будет), а `animation` с `@keyframes` описывает многошаговые циклы, управляемые независимо от состояния элемента — для циклических сценариев и fill-mode."
  - "Каждый `will-change` создаёт отдельный compositor layer, расходующий память, поэтому включают его по триггеру и убирают после анимации (`will-change: auto`); `contain: layout paint` изолирует элемент, и перерисовка внутри него не затрагивает соседей. `content-visibility: auto` пропускает layout и paint для элементов вне viewport, ускоряя первичный рендер длинных списков, а `contain-intrinsic-size` задаёт примерный размер плейсхолдера, чтобы скроллбар не прыгал при подгрузке контента."
---

# Парсинг HTML, критический путь рендеринга и производительность CSS

Эта статья разбирает, как браузер превращает скачанные байты в пиксели на экране. Понимание pipeline нужно не для того, чтобы заучивать термины, а чтобы объяснять, почему одни изменения тормозят страницу, а другие — почти бесплатны, как оптимизировать первую отрисовку и почему анимации через `transform`/`opacity` плавные, а через `width`/`top` — нет.

> Вся описанная ниже работа происходит внутри **Renderer Process** браузера. Парсинг HTML, построение DOM/CSSOM, layout и paint выполняются на **Main Thread**, а финальная сборка и анимация слоёв — на **Compositor Thread** с участием GPU. Подробнее об архитектуре процессов и потоков — в статье [Браузерная архитектура: процессы, потоки, сеть](../performance/browser-architecture.md).

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Анимации и производительность CSS](#анимации-и-производительность-css)
3. [Практические примеры](#практические-примеры)
4. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
5. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
6. [Заключение](#заключение)
7. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### От байтов к DOM: парсинг HTML

Прежде чем HTML начнёт парситься, браузер проходит сетевой путь: парсинг URL, DNS, TCP, TLS и HTTP-запрос. Этот путь разобран в статье [Браузерная архитектура: процессы, потоки, сеть](../performance/browser-architecture.md). Здесь мы начинаем с момента, когда браузер уже получил от сервера поток байтов HTML.

Браузер преобразует байты в символы по `Content-Type`/`charset`, затем токенизирует разметку и строит дерево:

- **Tokenization.** HTML-парсер читает поток и выделяет токены: start tag, end tag, comment, character, DOCTYPE. Спецификация HTML живёт в режиме «исправляй ошибки»: незакрытые теги, неправильная вложенность, `<table>` внутри `<p>` — всё это разрешается по чётким правилам, а не ломает страницу.
- **Tree construction.** Токены превращаются в узлы DOM. Парсер поддерживает стек открытых элементов и при каждом токене решает: добавить ли узел, закрыть предыдущий, переместить элемент или создать "implied" элемент.
- **Speculative parsing / preload scanner.** Основной парсер синхронный: когда он встречает `<script>` без `defer`/`async`, он должен выполнить скрипт, прежде чем продолжить строить DOM. В это время отдельный лёгкий **preload scanner** бежит вперёд по сырому HTML и находит `<img>`, `<link rel="stylesheet">`, `@import`, `<script>` и другие ресурсы, чтобы запросить их заранее. Он не строит DOM и не выполняет JS, но позволяет не терять время на сетевые задержки.

```html
<!-- Скрипт без defer/async блокирует парсинг, но preload scanner всё равно найдёт изображение -->
<script src="heavy.js"></script>
<img src="hero.png" alt="">
```

### DOM, CSSOM, Render Tree

**DOM (Document Object Model)** — дерево объектов, представляющее HTML-документ. К моменту окончания парсинга DOM может быть ещё не финальным: скрипты позже могут добавлять узлы, но браузер уже может рисовать.

**CSSOM (CSS Object Model)** — дерево стилей. Оно строится из:
- встроенных стилей браузера (user agent stylesheet);
- внешних и внутренних `<style>`;
- inline-стилей элементов.

CSSOM не может быть частичным: браузер должен получить **весь** CSS, прежде чем строить Render Tree, потому что одно правило в конце файла может переопределить всё в начале.

**Render Tree** — это DOM + CSSOM, отфильтрованный и обработанный:
- исключены невидимые элементы (`<head>`, `<script>`, `display: none`, элементы с `visibility: hidden` — последние остаются в дереве, но не рисуются);
- для каждого видимого узла вычислены стили (computed styles);
- созданы box-ы, которые пойдут в layout.

### Критический путь рендеринга

Критический путь — это минимальная последовательность шагов, необходимых для первой отрисовки:

```
HTML → DOM
        ↘
         Render Tree → Layout → Paint → Composite
        ↗
CSS → CSSOM
```

Цель оптимизации: уменьшить количество и размер ресурсов на критическом пути, чтобы `First Contentful Paint` наступил раньше.

Что влияет на критический путь:
- синхронные скрипты в `<head>`;
- блокирующие CSS (`<link rel="stylesheet">` в `<head>`);
- шрифты с `font-display: block`;
- тяжёлые изображения в первом экране.

### Layout, Paint, Composite

Это три фазы отрисовки после построения Render Tree.

**Layout (Reflow)** — вычисление геометрии: где каждый box располагается, какие у него размеры, как переносятся строки. Layout затрагивает всё дерево или большую его часть: если изменить `width` у `body`, браузеру придётся пересчитать позиции почти всех потомков.

Свойства, вызывающие layout:
- `width`, `height`, `padding`, `margin`, `border`;
- `top`, `left`, `right`, `bottom`;
- `font-size`, `line-height`;
- `display`, `position`.

**Paint (Repaint)** — растрирование векторных примитивов в пиксели. Paint обычно происходит в нескольких слоях: фон, текст, рамки, тени. Если изменился только цвет или тень, layout не нужен, но paint — нужен.

Свойства, вызывающие paint:
- `color`, `background-color`;
- `box-shadow`, `border-radius`;
- `outline`, `text-decoration`.

**Composite** — сборка готовых слоёв в финальную картинку. Эта фаза выполняется на GPU, если слои уже изолированы. Изменения, затрагивающие только composite, самые дешёвые.

Свойства, вызывающие только composite:
- `transform`;
- `opacity`;
- `filter` (в современных браузерах чаще всего composite-only).

Браузер автоматически продвигает элементы в отдельные слои при анимации `transform`/`opacity`, при 3D-трансформациях, `will-change`, `<video>`, `<canvas>`, fixed-элементах. Но слои стоят памяти: чем их больше, тем выше накладные расходы.

#### Где выполняются фазы

- **Main Thread** — парсинг HTML/CSS, построение DOM/CSSOM/Render Tree, вычисление стилей, layout, paint. Если Main Thread занят тяжёлым JavaScript, первая отрисовка и отклик на ввод задерживаются.
- **Compositor Thread** — композитинг слоёв, скроллинг и анимации свойств, которые можно обработать без пересчёта layout (чаще всего `transform` и `opacity`). Работает независимо от Main Thread, поэтому такие анимации остаются плавными даже при загруженности основного потока.
- **GPU Process** — растеризация слоёв и финальная отрисовка на экран. Подробнее о взаимодействии потоков — в статье [Браузерная архитектура](../performance/browser-architecture.md).

### Жизненный цикл изменения стилей

Когда JS меняет стиль, браузер старается отложить пересчёт до конца текущего кадра. Но если скрипт читает геометрию (`offsetWidth`, `getBoundingClientRect`, `scrollTop`), браузер вынужден синхронно выполнить layout — это называется **forced synchronous layout**.

```js
// Плохо: чтение геометрии между записью стилей вынуждает layout
const boxes = document.querySelectorAll('.box');
boxes.forEach(box => {
  box.style.width = '100px';        // записали стиль
  console.log(box.offsetWidth);     // вынудили layout
});
```

```js
// Лучше: читать и писать отдельно
const widths = Array.from(boxes).map(box => box.offsetWidth);
boxes.forEach((box, i) => {
  box.style.width = widths[i] + 'px';
});
```

## Анимации и производительность CSS

### Transitions

**Transition** (переход) плавно меняет значение CSS-свойства между двумя состояниями при изменении условий. Срабатывает, когда браузер может интерполировать начальное и конечное значение.

```css
.button {
  background: #3b82f6;
  transition: background 0.2s ease, transform 0.2s ease;
}

.button:hover {
  background: #2563eb;
  transform: scale(1.02);
}
```

Ключевые подсвойства:

- `transition-property` — какие свойства анимируются.
- `transition-duration` — длительность.
- `transition-timing-function` — кривая ускорения.
- `transition-delay` — задержка перед стартом.

Transition запускается только на изменении вычисленного значения. Если свойство не изменилось (например, элемент уже имел нужный класс при загрузке), анимации не будет.

### Animations и `@keyframes`

**CSS animations** позволяют описывать многошаговые анимации через `@keyframes` и управлять ими независимо от состояния элемента.

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.badge {
  animation: pulse 2s ease-in-out infinite;
}
```

Ключевые свойства:

- `animation-name` — имя keyframes.
- `animation-duration` — длительность цикла.
- `animation-timing-function` — кривая.
- `animation-delay` — задержка.
- `animation-iteration-count` — количество повторов (`1`, `2`, `infinite`).
- `animation-direction` — направление (`normal`, `reverse`, `alternate`).
- `animation-fill-mode` — как применяются стили до/после анимации (`forwards`, `backwards`, `both`).
- `animation-play-state` — `running` или `paused`.

`animation-fill-mode: forwards` полезна, когда финальное состояние анимации должно остаться после завершения. `both` применяет стили и до старта, и после финиша.

### Как браузер рисует анимацию

Браузер проходит несколько этапов при каждом кадре:

1. **Style** — пересчёт стилей, если что-то изменилось.
2. **Layout** — расчёт геометрии: размеров и положения элементов.
3. **Paint** — отрисовка пикселей: текста, фона, теней, рамок.
4. **Composite** — сборка слоёв в финальную картинку.

Анимации разных свойств затрагивают разные этапы:

| Свойство | Этапы | Производительность |
|----------|-------|-------------------|
| `transform`, `opacity` | Composite | Лучшая |
| `color`, `background-color`, `box-shadow` | Paint | Средняя |
| `width`, `height`, `top`, `left`, `margin` | Layout + Paint + Composite | Худшая |
| `filter` (кроме `opacity` внутри) | Paint/Composite | Зависит от фильтра |

Чем больше этапов задействовано, тем дороже анимация. Layout — самый дорогой, потому что вынуждает пересчитывать геометрию всего дерева, которое зависит от изменившегося элемента.

### Composite-only свойства

**Compositor-only properties** — свойства, которые могут быть обработаны compositor thread без участия main thread. К ним относятся прежде всего:

- `transform` (translate, scale, rotate)
- `opacity`

Compositor thread отвечает за сборку финального кадра из заранее подготовленных слоёв. Анимации на этом потоке не блокируются JavaScript, layout и paint, поэтому они плавные даже под нагрузкой.

```css
/* Хорошо: анимация только compositor */
.card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  opacity: 0.9;
}
```

По возможности анимации перемещения стоит делать через `transform: translateX(...)`, а не `left`/`margin-left`. Изменение `left` вынуждает браузер делать layout на каждом кадре.

### `will-change`

**`will-change`** — подсказка браузеру, что элемент скоро будет анимироваться, и стоит подготовить отдельный слой или другие ресурсы.

```css
.slider-thumb {
  will-change: transform;
}
```

Важные нюансы:

- `will-change` создаёт отдельный compositor layer, что расходует память. Слишком много слоёв может привести к out-of-memory на слабых устройствах.
- Не стоит вешать `will-change` на все элементы заранее. Лучше добавлять перед анимацией и убирать после.
- Значение `will-change: auto` снимает оптимизацию.
- Некоторые свойства вроде `will-change: width` заставляют браузер держать элемент на main thread, поэтому пользы мало.

Рекомендуемый паттерн — включать `will-change` по триггеру, а не держать постоянно:

```css
.card {
  transition: transform 0.3s ease;
}

.card:hover {
  will-change: transform;
  transform: scale(1.02);
}
```

### CSS containment: `contain`

**Containment** (изоляция) ограничивает область влияния элемента, позволяя браузеру оптимизировать рендеринг. Свойство `contain` принимает значения:

- `layout` — внутреннее расположение элементов не влияет наружу, и наоборот.
- `paint` — дети не могут выходить за границы элемента; браузер может рисовать их в отдельный слой.
- `size` — размеры элемента не зависят от детей.
- `style` — счётчики и quote-свойства изолированы.
- `content` — комбинация `layout paint style`.
- `strict` — комбинация `layout paint size style`.

```css
.widget {
  contain: layout paint;
}
```

Для анимаций `contain: paint` особенно полезен: он гарантирует, что перерисовка ограничится элементом и не затронет соседей.

### `content-visibility` для долгих списков

**`content-visibility: auto`** позволяет пропускать layout и paint для элементов, находящихся вне viewport. Это сильно ускоряет первоначальный рендеринг больших списков и страниц.

```css
.card {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}
```

`contain-intrinsic-size` задаёт примерный размер элемента, чтобы скроллбар не прыгал при подгрузке контента.

### `prefers-reduced-motion`

Пользователи могут отключать анимации в системе. Через медиа-запрос `prefers-reduced-motion` можно адаптировать интерфейс:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Но глобальный сброс ломает анимации, которые несут смысл: загрузка, открытие модалки, переключение состояний. Лучше отключать конкретные анимации:

```css
@media (prefers-reduced-motion: reduce) {
  .carousel-slide {
    transition: none;
    animation: none;
  }
}
```

## Практические примеры

### Пример 1: скрипт блокирует отрисовку

```html
<head>
  <link rel="stylesheet" href="styles.css">
  <script src="analytics.js"></script>
</head>
<body>
  <h1>Hello</h1>
</body>
```

Проблемы:
- CSS блокирует Render Tree, пока не загрузится.
- Скрипт без `defer`/`async` блокирует парсинг DOM.
- Пока не выполнится скрипт, браузер не продолжит парсинг и не отрисует `<h1>`.

Решение:

```html
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello</h1>
  <script src="analytics.js" defer></script>
</body>
```

`defer` сохраняет порядок выполнения и запускается после полного парсинга DOM.

### Пример 2: критический CSS

```html
<head>
  <style>
    /* inline-критический CSS для первого экрана */
    body { margin: 0; font-family: system-ui; }
    .hero { display: grid; place-items: center; min-height: 100vh; }
  </style>
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

Критический CSS встраивается inline, чтобы не ждать сети. Основной CSS загружается асинхронно. Это компромисс: первый рендер быстрее, но HTML становится больше.

### Пример 3: анимация, которая не вызывает layout

```css
.card {
  will-change: transform;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-8px);
  opacity: 0.9;
}
```

`transform` и `opacity` анимируются на этапе composite, не трогая layout и paint. Это самый производительный вид анимации.

### Пример 4: перемещение через `transform`

```html
<div class="box"></div>
```

```css
.box {
  width: 100px;
  height: 100px;
  background: #3b82f6;
  transition: transform 0.3s ease;
}

.box:hover {
  transform: translateX(100px);
}
```

Перемещение через `transform` работает на compositor thread и не вызывает layout. В отличие от `left: 100px`, здесь не пересчитывается геометрия соседей.

### Пример 5: правильное использование `will-change`

```css
.modal {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.modal.is-open {
  will-change: transform, opacity;
  opacity: 1;
  transform: translateY(0);
}

.modal.is-open.is-settled {
  will-change: auto;
}
```

После завершения анимации класс `is-settled` убирает `will-change`, освобождая ресурсы compositor layer.

### Пример 6: `content-visibility` для ленты

```css
.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 300px;
}
```

Элементы ленты, находящиеся вне viewport, не участвуют в layout и paint до появления на экране.

## Типичные ошибки и антипаттерны

- **Скрипты в `<head>` без `defer`/`async`/`type="module"`.** Блокируют парсинг DOM и откладывают первую отрисовку. Исключение — скрипты, которые действительно нужны до рендера.
- **Чтение `offsetWidth` в цикле после записи стилей.** Вынуждает браузер делать layout на каждой итерации. Сначала читай, потом пиши.
- **Анимация `width`/`height`/`top`/`left`/`margin` вместо `transform`.** Эти свойства вызывают layout на каждом кадре и часто приводят к dropped frames.
- **Постоянное `will-change` на всех элементах.** Создаёт лишние compositor-слои, жрёт память и может замедлить рендеринг на слабых устройствах.
- **Гигантские CSS-файлы на критическом пути.** Браузер не начнёт рендер, пока не получит весь CSS. Разделяй критический и некритический CSS.
- **Игнорирование `font-display`.** `swap` показывает fallback-шрифт сразу, `block` блокирует текст до 3 секунд. Для контента первого экрана чаще выбирают `swap` или `optional`.
- **Игнорирование `prefers-reduced-motion`.** Для многих пользователей анимации вызывают головокружение; системная настройка должна уважаться. Отключать конкретные анимации, а не все разом.
- **Анимация `box-shadow` на больших площадях.** `box-shadow` рисуется на каждом кадре и часто дорог в paint.
- **Использование `@keyframes` там, где достаточно `transition`.** Animation удобна для циклических или многошаговых сценариев; для простых состояний проще и понятнее transition.
- **Отсутствие `contain-intrinsic-size` с `content-visibility: auto`.** Без него скроллбар может менять размеры при подгрузке элементов.

## Ключевые тезисы для интервью

- Парсер HTML синхронный, но preload scanner асинхронно находит ресурсы впереди, пока основной парсер заблокирован скриптом — это ускоряет загрузку CSS, шрифтов и других скриптов.
- CSSOM строится только после получения всего CSS, поэтому `<link rel="stylesheet">` блокирует Render Tree; Render Tree = DOM + CSSOM минус невидимые узлы. Критический путь рендеринга оптимизируют через `defer`/`async` для скриптов, inline-критический CSS и предзагрузку шрифтов.
- Layout — самая дорогая фаза (пересчёт геометрии), paint — дешевле (заполнение пикселей), composite — дешевле всего (сборка слоёв на GPU). `transform` и `opacity` анимируются на compositor thread, поэтому плавные, а `width`/`top` каждый кадр пересчитывают layout на main thread.
- Чтение геометрии (`offsetWidth`, `getBoundingClientRect()`) после изменения стилей вызывает forced synchronous layout — главный источник jank в JS-анимациях; лечится разделением чтения и записи.
- `transition` интерполирует между двумя состояниями; `animation` с `@keyframes` — для многошаговых и циклических сценариев.
- `will-change` подсказывает браузеру подготовить отдельный слой, но каждый слой расходует память; `contain: layout paint` изолирует область перерисовки, а `content-visibility: auto` пропускает рендеринг вне viewport — все три применяют точечно.
- `prefers-reduced-motion: reduce` нужно уважать: отключать конкретные анимации (transition, animation), а не все эффекты подряд.

## Заключение

Парсинг HTML — синхронный процесс, ускоренный preload scanner'ом. CSS и синхронные скрипты блокируют первую отрисовку: CSSOM требует полного получения CSS, а скрипты без `defer`/`async` — выполнения до продолжения парсинга. Понимание трёх фаз (layout, paint, composite) позволяет писать анимации через `transform`/`opacity`, избегая дорогого layout. `will-change`, `contain` и `content-visibility` помогают браузеру оптимизировать перерисовку, но каждый слой стоит памяти, поэтому их используют точечно. Forced synchronous layout — главная причина jank при DOM-манипуляциях: разделяй чтение и запись геометрии. И уважайте `prefers-reduced-motion` — анимации должны помогать, а не создавать дискомфорт.

Чтобы понять, где физически выполняется весь этот пайплайн — какие процессы и потоки браузера за него отвечают — смотри статью [Браузерная архитектура: процессы, потоки, сеть](../performance/browser-architecture.md).

## Полезные ссылки

- [Браузерная архитектура: процессы, потоки, сеть](../performance/browser-architecture.md) — процессы, Site Isolation, сетевой путь и TTFB.
- [How Browsers Work: Behind the scenes of modern web browsers](https://www.html5rocks.com/en/tutorials/internals/howbrowserswork/)
- [Critical Rendering Path](https://developer.chrome.com/docs/devtools/performance/critical-rendering-path/) (Chrome DevTools)
- [Rendering Performance](https://web.dev/articles/rendering-performance)
- [Avoid forced synchronous layout](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions)
- [Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)
- [will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)
- [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- [CSS Triggers](https://csstriggers.com/)
- [High performance animations](https://web.dev/articles/animations-overview)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)