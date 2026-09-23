---
title: "Основы HTML и CSS: разметка, стили, layout"
section: html-css
description: "Фундамент HTML и CSS для начинающих: семантическая разметка, селекторы, каскад, специфичность, box model, flexbox, grid, позиционирование и адаптивная вёрстка. Всё, что нужно знать перед изучением продвинутых тем."
order: 1
tags: ["html-basics", "css-basics", "semantic-html", "selectors", "box-model", "flexbox", "grid", "responsive"]
questions:
  - "Как каскад, специфичность и порядок правил определяют, какой стиль применится к элементу при конфликте"
  - "Как box model рассчитывает размер элемента и почему `box-sizing: border-box` делает вёрстку предсказуемее"
  - "Как алгоритмы распределения пространства в Flexbox и Grid объясняют поведение flex-grow, flex-shrink и grid-template-columns"
  - "Чем отличаются position: relative, absolute, fixed и sticky и как каждое из них влияет на поток документа"
  - "Как mobile-first подход с media queries и относительными единицами (rem, vw, clamp) обеспечивает адаптивность"
  - "Как CSS-переменные позволяют централизованно управлять дизайн-системой и реализовывать темы"
---

# Основы HTML и CSS: разметка, стили, layout

HTML и CSS — это два столпа веб-разработки. HTML определяет **что** на странице (заголовки, параграфы, кнопки, формы), CSS определяет **как** это выглядит (цвета, отступы, расположение). JavaScript добавляет **интерактивность** (реакция на клики, анимации, работа с данными). В этой статье разберём самые основы: семантическую разметку, CSS-селекторы, box model, flexbox, grid, позиционирование и адаптивную вёрстку.

## Содержание

1. [HTML: структура веб-страницы](#html-структура-веб-страницы)
2. [Семантическая разметка](#семантическая-разметка)
3. [CSS: стилизация страницы](#css-стилизация-страницы)
4. [CSS-селекторы](#css-селекторы)
5. [Каскад и специфичность](#каскад-и-специфичность)
6. [Box Model](#box-model)
7. [Display: block, inline, inline-block, none](#display-block-inline-inline-block-none)
8. [Позиционирование](#позиционирование)
9. [Flexbox](#flexbox)
10. [Grid](#grid)
11. [Адаптивная вёрстка](#адаптивная-вёрстка)
12. [CSS-переменные](#css-переменные)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

---

## HTML: структура веб-страницы

### Что такое HTML

HTML (HyperText Markup Language) — это язык разметки, который определяет структуру и содержание веб-страницы. HTML состоит из **элементов** (тегов), которые описывают, что находится на странице: заголовки, параграфы, изображения, ссылки, формы и т.д.

### Базовая структура HTML-документа

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Моя первая страница</title>
</head>
<body>
  <h1>Привет, мир!</h1>
  <p>Это моя первая веб-страница.</p>
</body>
</html>
```

**Разбор:**
- `<!DOCTYPE html>` — объявление типа документа (HTML5)
- `<html lang="ru">` — корневой элемент, `lang` указывает язык содержимого
- `<head>` — метаинформация (заголовок, кодировка, подключение стилей и скриптов)
- `<body>` — видимое содержимое страницы

### Основные HTML-элементы

**Заголовки:**
```html
<h1>Главный заголовок страницы (один на страницу)</h1>
<h2>Подзаголовок</h2>
<h3>Подзаголовок третьего уровня</h3>
<!-- h4, h5, h6 — реже -->
```

**Текст:**
```html
<p>Это параграф текста.</p>
<strong>Жирный текст (семантически важный)</strong>
<em>Курсив (семантически выделенный)</em>
<b>Жирный текст (визуально)</b>
<i>Курсив (визуально)</i>
<br> <!-- перенос строки -->
<hr> <!-- горизонтальная линия -->
```

**Ссылки:**
```html
<a href="https://example.com">Внешняя ссылка</a>
<a href="/about.html">Внутренняя ссылка</a>
<a href="#section1">Якорь (переход к элементу с id="section1")</a>
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Ссылка в новой вкладке
</a>
```

**Изображения:**
```html
<img src="photo.jpg" alt="Описание изображения" width="800" height="600">

<!-- С источниками для разных экранов -->
<picture>
  <source media="(min-width: 1200px)" srcset="photo-large.jpg">
  <source media="(min-width: 768px)" srcset="photo-medium.jpg">
  <img src="photo-small.jpg" alt="Описание">
</picture>
```

**Списки:**
```html
<!-- Маркированный список -->
<ul>
  <li>Первый пункт</li>
  <li>Второй пункт</li>
  <li>Третий пункт</li>
</ul>

<!-- Нумерованный список -->
<ol>
  <li>Первый пункт</li>
  <li>Второй пункт</li>
  <li>Третий пункт</li>
</ol>

<!-- Список определений -->
<dl>
  <dt>HTML</dt>
  <dd>Язык разметки для веб-страниц</dd>
  <dt>CSS</dt>
  <dd>Язык стилей для веб-страниц</dd>
</dl>
```

**Формы:**
```html
<form action="/submit" method="POST">
  <label for="name">Имя:</label>
  <input type="text" id="name" name="name" required>
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>
  
  <label for="message">Сообщение:</label>
  <textarea id="message" name="message" rows="4"></textarea>
  
  <label for="country">Страна:</label>
  <select id="country" name="country">
    <option value="ru">Россия</option>
    <option value="us">США</option>
    <option value="de">Германия</option>
  </select>
  
  <label>
    <input type="checkbox" name="agree" required>
    Согласен с условиями
  </label>
  
  <button type="submit">Отправить</button>
</form>
```

**Таблицы:**
```html
<table>
  <thead>
    <tr>
      <th>Имя</th>
      <th>Возраст</th>
      <th>Город</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Алиса</td>
      <td>25</td>
      <td>Москва</td>
    </tr>
    <tr>
      <td>Борис</td>
      <td>30</td>
      <td>Санкт-Петербург</td>
    </tr>
  </tbody>
</table>
```

---

## Семантическая разметка

### Что такое семантическая разметка

Семантические элементы описывают **значение** содержимого, а не только его внешний вид. Вместо `<div>` для всего, используйте элементы, которые описывают, что это: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`.

### Семантические vs несемантические элементы

```html
<!-- ❌ Несемантическая разметка -->
<div class="header">
  <div class="nav">...</div>
</div>
<div class="main">
  <div class="article">...</div>
</div>
<div class="footer">...</div>

<!-- ✅ Семантическая разметка -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
</main>
<footer>...</footer>
```

### Основные семантические элементы

```html
<body>
  <!-- Шапка сайта -->
  <header>
    <h1>Название сайта</h1>
    <nav>
      <ul>
        <li><a href="/">Главная</a></li>
        <li><a href="/about">О нас</a></li>
        <li><a href="/contact">Контакты</a></li>
      </ul>
    </nav>
  </header>
  
  <!-- Основное содержимое страницы -->
  <main>
    <!-- Секция контента -->
    <section>
      <h2>Заголовок секции</h2>
      <p>Содержимое секции...</p>
    </section>
    
    <!-- Статья (самостоятельный контент) -->
    <article>
      <h2>Заголовок статьи</h2>
      <p>Содержимое статьи...</p>
      <footer>
        <p>Автор: Иван Иванов</p>
        <time datetime="2024-01-15">15 января 2024</time>
      </footer>
    </article>
    
    <!-- Боковая панель -->
    <aside>
      <h3>Похожие статьи</h3>
      <ul>
        <li><a href="#">Статья 1</a></li>
        <li><a href="#">Статья 2</a></li>
      </ul>
    </aside>
  </main>
  
  <!-- Подвал сайта -->
  <footer>
    <p>&copy; 2024 Мой сайт</p>
  </footer>
</body>
```

### Почему семантика важна

**1. Доступность (Accessibility)**

Скринридеры для людей с ограниченными возможностями используют семантические элементы для навигации. Пользователь может быстро перейти к `<nav>`, `<main>` или `<article>`.

**2. SEO (Search Engine Optimization)**

Поисковые движки лучше понимают структуру страницы с семантической разметкой. `<article>` явно указывает на самостоятельный контент, `<time>` — на дату, `<nav>` — на навигацию.

**3. Читаемость кода**

Семантическая разметка легче читается и поддерживается. `<header>` понятнее, чем `<div class="header">`.

### Другие полезные семантические элементы

```html
<!-- Детали с раскрывающимся содержимым -->
<details>
  <summary>Нажми, чтобы раскрыть</summary>
  <p>Скрытое содержимое...</p>
</details>

<!-- Прогресс-бар -->
<progress value="70" max="100">70%</progress>

<!-- Измеритель (например, рейтинг) -->
<meter value="0.8" min="0" max="1">80%</meter>

<!-- Цитата -->
<blockquote cite="https://example.com">
  <p>Текст цитаты...</p>
</blockquote>

<!-- Код -->
<pre><code>const x = 10;</code></pre>

<!-- Маркированное время -->
<time datetime="2024-01-15T10:30:00">15 января 2024, 10:30</time>
```

---

## CSS: стилизация страницы

### Что такое CSS

CSS (Cascading Style Sheets) — это язык стилей, который определяет внешний вид HTML-элементов. CSS контролирует цвета, шрифты, отступы, расположение, анимации и многое другое.

### Три способа подключения CSS

**1. Внешний файл (рекомендуется):**
```html
<!-- В <head> -->
<link rel="stylesheet" href="styles.css">
```

**2. Встроенные стили (в `<head>`):**
```html
<style>
  h1 { color: blue; }
  p { font-size: 16px; }
</style>
```

**3. Инлайновые стили (не рекомендуется):**
```html
<h1 style="color: blue; font-size: 24px;">Заголовок</h1>
```

### Базовый синтаксис CSS

```css
/* Селектор { свойство: значение; } */

h1 {
  color: blue;
  font-size: 24px;
  margin-bottom: 16px;
}

p {
  color: #333;
  line-height: 1.6;
}
```

### Основные CSS-свойства

**Цвет и фон:**
```css
.element {
  color: #333;                    /* цвет текста */
  background-color: #f0f0f0;      /* цвет фона */
  background-image: url('bg.jpg'); /* фоновое изображение */
  opacity: 0.8;                   /* прозрачность */
}
```

**Типографика:**
```css
.text {
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.6;
  text-align: center;
  text-decoration: underline;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

**Отступы и размеры:**
```css
.box {
  width: 300px;
  height: 200px;
  margin: 20px;       /* внешний отступ */
  padding: 10px;      /* внутренний отступ */
  border: 1px solid #ccc;
}
```

---

## CSS-селекторы

### Базовые селекторы

```css
/* Универсальный селектор */
* {
  margin: 0;
  padding: 0;
}

/* Селектор по типу элемента */
h1 { color: blue; }
p { font-size: 16px; }

/* Селектор по классу */
.button { background: blue; }
.btn-primary { background: blue; }

/* Селектор по ID */
#header { background: #333; }

/* Селектор по атрибуту */
input[type="text"] { border: 1px solid #ccc; }
a[target="_blank"] { color: green; }
```

### Комбинаторы

```css
/* Потомок (любой уровень вложенности) */
div p {
  color: red;
}

/* Прямой ребёнок (только первый уровень) */
div > p {
  color: blue;
}

/* Следующий сосед (только следующий элемент) */
h1 + p {
  font-weight: bold;
}

/* Все последующие соседи */
h1 ~ p {
  color: gray;
}
```

### Псевдоклассы

```css
/* Состояния ссылок */
a:link { color: blue; }        /* непосещённая ссылка */
a:visited { color: purple; }   /* посещённая ссылка */
a:hover { color: red; }        /* при наведении */
a:active { color: orange; }    /* при клике */

/* Состояния форм */
input:focus { border-color: blue; }
input:disabled { opacity: 0.5; }
input:checked { background: green; }
input:valid { border-color: green; }
input:invalid { border-color: red; }

/* Структурные псевдоклассы */
li:first-child { font-weight: bold; }
li:last-child { border-bottom: none; }
li:nth-child(2n) { background: #f0f0f0; } /* чётные */
li:nth-child(odd) { background: #fff; }   /* нечётные */
p:first-of-type { font-size: 18px; }
```

### Псевдоэлементы

```css
/* ::before и ::after — вставка контента */
.required::before {
  content: "* ";
  color: red;
}

.quote::before {
  content: "«";
}
.quote::after {
  content: "»";
}

/* ::first-line и ::first-letter */
p::first-line {
  font-weight: bold;
}

p::first-letter {
  font-size: 24px;
}

/* ::selection — выделенный текст */
::selection {
  background: yellow;
  color: black;
}

/* ::placeholder — текст-подсказка в input */
input::placeholder {
  color: #999;
}
```

---

## Каскад и специфичность

### Что такое каскад

CSS — каскадный язык стилей. Если к одному элементу применяется несколько правил с одинаковыми свойствами, браузер решает, какое правило использовать, на основе:

1. **Специфичности** селектора
2. **Порядка** в CSS-файле (последнее правило побеждает)
3. **Важности** (`!important`)

### Специфичность

Каждый селектор имеет вес (специфичность). Браузер использует правило с наибольшей специфичностью.

```
Специфичность (от высокой к низкой):

1. !important              — высший приоритет (избегайте!)
2. Инлайновые стили       — 1000
3. ID селекторы           — 100
4. Классы, атрибуты, псевдоклассы — 10
5. Типы элементов, псевдоэлементы — 1
6. Универсальный (*)      — 0
```

**Примеры:**
```css
/* Специфичность: 1 (тип элемента) */
p { color: black; }

/* Специфичность: 10 (класс) */
.text { color: blue; }

/* Специфичность: 100 (ID) */
#content { color: green; }

/* Специфичность: 11 (класс + тип) */
p.text { color: purple; }

/* Специфичность: 110 (ID + класс) */
#content .text { color: orange; }
```

**Практический пример:**
```html
<p id="content" class="text" style="color: red;">Текст</p>
```

```css
p { color: black; }           /* специфичность: 1 */
.text { color: blue; }        /* специфичность: 10 */
#content { color: green; }    /* специфичность: 100 */
/* Инлайновый стиль: color: red; — специфичность: 1000 */
```

Результат: текст будет **красным** (инлайновый стиль имеет высшую специфичность).

### Порядок правил

Если специфичность одинакова, побеждает последнее правило:

```css
.text { color: blue; }
.text { color: red; }  /* текст будет красным */
```

### Наследование

Некоторые CSS-свойства наследуются от родителя к ребёнку:

```css
body {
  font-family: Arial, sans-serif;
  color: #333;
}

/* Все элементы внутри <body> унаследуют font-family и color */
```

**Наследуются:** `color`, `font-family`, `font-size`, `line-height`, `text-align` и другие текстовые свойства.

**Не наследуются:** `margin`, `padding`, `border`, `background`, `width`, `height` и большинство layout-свойств.

### !important

```css
.text {
  color: blue !important;  /* переопределит всё */
}
```

**Избегайте `!important`!** Это нарушает каскад и усложняет поддержку кода. Вместо этого используйте более специфичные селекторы.

---

## Box Model

### Что такое Box Model

Каждый HTML-элемент — это прямоугольник (box). Box Model описывает, как рассчитывается размер этого прямоугольника.

```
┌─────────────────────────────────────┐
│              margin                 │
│  ┌───────────────────────────────┐  │
│  │            border             │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │        padding          │  │  │
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │     content       │  │  │  │
│  │  │  │                   │  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Компоненты:**
- **Content** — содержимое элемента (текст, изображения)
- **Padding** — внутренний отступ (между content и border)
- **Border** — граница элемента
- **Margin** — внешний отступ (между элементом и соседями)

### Расчёт размера

По умолчанию (`box-sizing: content-box`):

```css
.box {
  width: 200px;      /* ширина content */
  padding: 20px;     /* добавляется к width */
  border: 5px solid; /* добавляется к width */
  margin: 10px;      /* не входит в width */
}

/* Итоговая ширина: 200 + 20*2 + 5*2 = 250px */
/* Итоговая высота: зависит от содержимого */
```

### box-sizing: border-box

Современный подход — использовать `border-box`:

```css
* {
  box-sizing: border-box;
}

.box {
  width: 200px;      /* общая ширина (включая padding и border) */
  padding: 20px;     /* входит в width */
  border: 5px solid; /* входит в width */
}

/* Итоговая ширина: 200px (padding и border вычитаются из content) */
/* Content width: 200 - 20*2 - 5*2 = 150px */
```

**Рекомендация:** Всегда используйте `box-sizing: border-box` для всех элементов. Это делает расчёты предсказуемыми.

### Margin collapsing

Вертикальные margin'ы соседних элементов "схлопываются":

```css
h1 { margin-bottom: 20px; }
p  { margin-top: 30px; }
```

```html
<h1>Заголовок</h1>
<p>Параграф</p>
```

Расстояние между элементами будет **30px** (не 50px), а не сумма обоих margin'ов.

---

## Display: block, inline, inline-block, none

### display: block

Элемент занимает всю ширину родителя и начинается с новой строки:

```css
div, p, h1, h2, h3, section, article, header, footer {
  display: block;
}
```

**Особенности:**
- Занимает всю доступную ширину
- Начинается с новой строки
- Можно задавать `width`, `height`, `margin`, `padding`

### display: inline

Элемент занимает только ширину содержимого и находится в строке с другими элементами:

```css
span, a, strong, em {
  display: inline;
}
```

**Особенности:**
- Занимает только ширину содержимого
- Находится в строке с другими элементами
- **Нельзя** задавать `width`, `height`
- Вертикальные `margin` и `padding` не влияют на layout

### display: inline-block

Гибрид `inline` и `block`:

```css
.button {
  display: inline-block;
  padding: 10px 20px;
  background: blue;
  color: white;
}
```

**Особенности:**
- Находится в строке с другими элементами
- Можно задавать `width`, `height`, `margin`, `padding`

### display: none

Полностью скрывает элемент (не занимает места в layout):

```css
.hidden {
  display: none;
}
```

**Отличие от `visibility: hidden`:**
- `display: none` — элемент невидим и не занимает места
- `visibility: hidden` — элемент невидим, но занимает место

---

## Позиционирование

### position: static (по умолчанию)

Элемент находится в обычном потоке документа. `top`, `right`, `bottom`, `left` не работают.

```css
.element {
  position: static;
}
```

### position: relative

Элемент смещается относительно своего нормального положения. Остальное пространство сохраняется.

```css
.element {
  position: relative;
  top: 10px;    /* сместить на 10px вниз */
  left: 20px;   /* сместить на 20px вправо */
}
```

**Особенности:**
- Элемент смещается, но его место в потоке сохраняется
- Служит контейнером для `position: absolute` дочерних элементов

### position: absolute

Элемент вынимается из потока и позиционируется относительно ближайшего `position: relative` (или `absolute`, `fixed`, `sticky`) родителя.

```css
.parent {
  position: relative;
}

.child {
  position: absolute;
  top: 0;
  right: 0;
}
```

**Особенности:**
- Элемент вынимается из потока (не занимает места)
- Позиционируется относительно ближайшего позиционированного родителя
- Если такого родителя нет — относительно `<html>`

### position: fixed

Элемент позиционируется относительно окна браузера и остаётся на месте при прокрутке.

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: white;
}
```

**Особенности:**
- Элемент вынимается из потока
- Позиционируется относительно viewport (окна браузера)
- Остаётся на месте при прокрутке

### position: sticky

Гибрид `relative` и `fixed`. Элемент ведёт себя как `relative`, пока не достигнет определённой позиции при прокрутке, затем становится `fixed`.

```css
.header {
  position: sticky;
  top: 0;
}
```

**Особенности:**
- Работает только внутри родителя
- "Прилипает" к указанной позиции при прокрутке
- Поддерживается всеми современными браузерами

---

## Flexbox

### Что такое Flexbox

Flexbox (Flexible Box Layout) — модель layout для одномерных раскладок (строка или колонка).

```css
.container {
  display: flex;
}
```

### Основные свойства контейнера

```css
.container {
  display: flex;
  
  /* Направление главной оси */
  flex-direction: row;            /* по горизонтали (по умолчанию) */
  flex-direction: column;         /* по вертикали */
  
  /* Перенос элементов */
  flex-wrap: nowrap;              /* без переноса (по умолчанию) */
  flex-wrap: wrap;                /* с переносом */
  
  /* Выравнивание по главной оси */
  justify-content: flex-start;    /* в начало */
  justify-content: center;        /* по центру */
  justify-content: space-between; /* равные промежутки между */
  justify-content: space-around;  /* равные промежутки вокруг */
  
  /* Выравнивание по поперечной оси */
  align-items: stretch;           /* растянуть (по умолчанию) */
  align-items: center;            /* по центру */
  align-items: flex-start;        /* в начало */
  align-items: flex-end;          /* в конец */
}
```

### Основные свойства элементов

```css
.item {
  /* Порядок отображения */
  order: 0;
  
  /* Способность к росту */
  flex-grow: 0;    /* не расти (по умолчанию) */
  flex-grow: 1;    /* расти пропорционально */
  
  /* Способность к сжатию */
  flex-shrink: 1;  /* сжиматься при необходимости (по умолчанию) */
  flex-shrink: 0;  /* не сжиматься */
  
  /* Базовый размер */
  flex-basis: auto;    /* размер содержимого (по умолчанию) */
  flex-basis: 200px;   /* фиксированный размер */
  
  /* Сокращённая запись */
  flex: 1;             /* flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
  flex: 0 0 200px;     /* не расти, не сжиматься, базовый размер 200px */
  
  /* Выравнивание конкретного элемента */
  align-self: center;
}
```

### Практические примеры

**Центрирование элемента:**
```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
```

**Навигация:**
```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

**Карточки в ряд:**
```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.card {
  flex: 1 1 300px; /* расти, сжиматься, базовый размер 300px */
}
```

---

## Grid

### Что такое Grid

CSS Grid — модель layout для двумерных раскладок (строки и колонки одновременно).

```css
.container {
  display: grid;
}
```

### Основные свойства контейнера

```css
.container {
  display: grid;
  
  /* Определение колонок */
  grid-template-columns: 200px 200px 200px;      /* три колонки по 200px */
  grid-template-columns: 1fr 2fr 1fr;            /* три колонки: 1:2:1 */
  grid-template-columns: repeat(3, 1fr);         /* три равные колонки */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* адаптивные колонки */
  
  /* Определение строк */
  grid-template-rows: 100px auto 100px;          /* три строки */
  
  /* Промежутки */
  gap: 20px;                                     /* между строками и колонками */
  row-gap: 20px;
  column-gap: 20px;
  
  /* Выравнивание */
  justify-items: center;                         /* по горизонтали */
  align-items: center;                           /* по вертикали */
  place-items: center;                           /* оба */
}
```

### Основные свойства элементов

```css
.item {
  /* Позиционирование */
  grid-column: 1 / 3;    /* от первой до третьей линии (занимает 2 колонки) */
  grid-row: 1 / 2;       /* от первой до второй линии */
  
  /* Сокращённая запись */
  grid-column: 1 / span 2;  /* начать с 1, занять 2 колонки */
  
  /* Выравнивание конкретного элемента */
  justify-self: center;
  align-self: center;
}
```

### Grid-области

```css
.container {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 200px 1fr 1fr;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

### Практические примеры

**Адаптивная сетка карточек:**
```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
```

**Святой Грааль (header, sidebar, main, footer):**
```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}
```

---

## Адаптивная вёрстка

### Что такое адаптивная вёрстка

Адаптивная вёрстка (Responsive Web Design) — подход, при котором страница подстраивается под размер экрана: десктоп, планшет, мобильный.

### Viewport meta tag

Обязательный тег для адаптивной вёрстки:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Media Queries

```css
/* Базовые стили (mobile-first) */
.container {
  padding: 10px;
}

/* Планшет (768px и выше) */
@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* Десктоп (1024px и выше) */
@media (min-width: 1024px) {
  .container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Mobile-first vs Desktop-first

**Mobile-first (рекомендуется):**
```css
/* Базовые стили для мобильных */
.grid {
  display: grid;
  grid-template-columns: 1fr;
}

/* Для планшетов */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Для десктопов */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Desktop-first:**
```css
/* Базовые стили для десктопов */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* Для планшетов */
@media (max-width: 1023px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Для мобильных */
@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

### Адаптивные единицы измерения

```css
.element {
  /* Относительные единицы */
  width: 50%;           /* процент от родителя */
  width: 50vw;          /* процент от ширины viewport */
  height: 100vh;        /* процент от высоты viewport */
  font-size: 2em;       /* относительно font-size родителя */
  font-size: 2rem;      /* относительно font-size <html> */
  
  /* Адаптивные единицы */
  font-size: clamp(16px, 2vw, 24px); /* от 16px до 24px, предпочтительно 2vw */
  width: min(100%, 800px);           /* минимальное из 100% и 800px */
  width: max(300px, 50%);            /* максимальное из 300px и 50% */
}
```

---

## CSS-переменные

### Что такое CSS-переменные

CSS-переменные (Custom Properties) позволяют хранить значения и переиспользовать их:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --font-size-base: 16px;
  --spacing-unit: 8px;
}

.button {
  background: var(--primary-color);
  font-size: var(--font-size-base);
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
}

.alert {
  background: var(--secondary-color);
}
```

### Преимущества CSS-переменных

**1. Централизованное управление:**
```css
:root {
  --color-primary: #007bff;
}

/* Измените в одном месте — обновится везде */
```

**2. Темы:**
```css
:root {
  --bg-color: #fff;
  --text-color: #333;
}

[data-theme="dark"] {
  --bg-color: #333;
  --text-color: #fff;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
}
```

**3. Переопределение в компонентах:**
```css
:root {
  --button-bg: blue;
}

.button-danger {
  --button-bg: red;
}

.button {
  background: var(--button-bg);
}
```

---

## Ключевые тезисы для интервью

- Семантика (`<header>`, `<nav>`, `<main>`, `<footer>`) лучше `<div>` — доступность, SEO, читаемость.
- Специфичность: `!important` > инлайн (1000) > ID (100) > класс (10) > тег (1); при равенстве — последнее правило.
- Box Model: `border-box` вычитает padding/border из width — предсказуемые размеры; вертикальные margin'ы схлопываются.
- Flexbox — одномерная раскладка (`justify-content`, `align-items`, `flex-grow`); Grid — двумерная (`grid-template-columns/rows`).
- `position`: `static` (поток), `relative` (смещение + контейнер для absolute), `absolute` (вне потока), `fixed` (viewport), `sticky` (прилипает).
- Mobile-first + `min-width` + `rem`/`vw`/`clamp()` — адаптивность; CSS-переменные — темы и централизация.

---

## Заключение

HTML и CSS — это фундамент веб-разработки. В этой статье мы разобрали самые основы: семантическую разметку, CSS-селекторы, каскад и специфичность, box model, flexbox, grid, позиционирование и адаптивную вёрстку. Это фундамент, на котором строятся все более сложные темы.

Следующие статьи раздела углубятся в продвинутые темы: каскад и специфичность в деталях, flexbox и grid в деталях, позиционирование и stacking context, адаптивная вёрстка и container queries, CSS-переменные и архитектура стилей, анимации и производительность. Но без понимания основ, которые мы разобрали здесь, эти темы будут непонятны.

Создайте свою первую HTML-страницу, добавьте стили, поэкспериментируйте с flexbox и grid. Только практика поможет закрепить эти знания.

---

## Полезные ссылки

- [MDN Web Docs — HTML](https://developer.mozilla.org/ru/docs/Web/HTML) — официальная документация HTML
- [MDN Web Docs — CSS](https://developer.mozilla.org/ru/docs/Web/CSS) — официальная документация CSS
- [HTML Reference](https://htmlreference.io/) — справочник по HTML
- [CSS Reference](https://cssreference.io/) — справочник по CSS
- [Flexbox Froggy](https://flexboxfroggy.com/) — игра для изучения flexbox
- [Grid Garden](https://cssgridgarden.com/) — игра для изучения grid
- [Can I Use](https://caniuse.com/) — проверка поддержки CSS-свойств браузерами
