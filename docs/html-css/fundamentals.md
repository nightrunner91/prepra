---
title: "Основы HTML и CSS: разметка, селекторы, box model"
section: html-css
description: "Фундамент HTML и CSS для начинающих: структура документа, семантическая разметка, базовый синтаксис CSS, селекторы, box model и display. Отсюда — путь к глубоким статьям раздела: каскаду, layout, позиционированию."
order: 1
tags: ["html-basics", "css-basics", "semantic-html", "selectors", "box-model", "display"]
questions:
  - "Из каких частей состоит HTML-документ и какие бывают базовые элементы разметки"
  - "Почему семантические элементы (`<header>`, `<nav>`, `<main>`) лучше `div` и что это даёт"
  - "Какими способами можно подключить CSS к странице и в чём их различия"
  - "Как устроены базовые селекторы, комбинаторы, псевдоклассы и псевдоэлементы"
  - "Как box model рассчитывает размер элемента и почему `box-sizing: border-box` делает вёрстку предсказуемее"
  - "Чем `display: block`, `inline`, `inline-block` и `none` отличаются друг от друга"
answers:
  - "Документ состоит из `<!DOCTYPE html>`, корневого `<html lang>`, `<head>` (метаинформация, стили) и `<body>` (видимое содержимое); базовые элементы — заголовки `h1`–`h6`, текст `p`/`strong`/`em`, ссылки `a`, изображения `img`, списки `ul`/`ol`/`dl`, формы `form`, таблицы `table`."
  - "Семантические элементы описывают значение содержимого, а не только внешний вид: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>` дают скринридерам ориентиры для навигации, помогают поисковикам понимать структуру и делают код читаемее."
  - "Три способа: внешний файл через `<link rel=\"stylesheet\">` (рекомендуется, кешируется), встроенный `<style>` в `<head>` и инлайновый атрибут `style` (не рекомендуется — высокая специфичность, нет псевдоклассов и медиа-запросов)."
  - "Базовые селекторы: универсальный `*`, по типу `h1`, по классу `.button`, по ID `#header`, по атрибуту `input[type=\"text\"]`; комбинаторы: потомок (пробел), ребёнок `>`, сосед `+`, все последующие `~`; псевдоклассы описывают состояния (`:hover`, `:focus`, `:nth-child`), псевдоэлементы — части элемента (`::before`, `::after`, `::placeholder`)."
  - "По умолчанию (`content-box`) `width: 200px` задаёт только контент, а padding и border прибавляются снаружи (итог 200 + 20*2 + 5*2); `border-box` включает padding и border в `width`, поэтому заданная ширина равна реальной ширине элемента — это критично в раскладках с процентными ширинами."
  - "`block` занимает всю ширину родителя и начинается с новой строки (можно задавать размеры); `inline` занимает только ширину контента и не позволяет задавать `width`/`height`; `inline-block` — гибрид: находится в строке, но поддерживает размеры; `none` полностью убирает элемент из layout (в отличие от `visibility: hidden`, который оставляет место)."
---

# Основы HTML и CSS: разметка, селекторы, box model

HTML и CSS — два столпа веб-разработки. HTML определяет **что** на странице (заголовки, параграфы, кнопки, формы), CSS определяет **как** это выглядит (цвета, отступы, расположение). JavaScript добавляет **интерактивность**. Эта статья — точка входа в раздел: структура документа, семантическая разметка, синтаксис CSS, селекторы, box model и display. Глубокие темы — каскад, layout, позиционирование, адаптивность — вынесены в отдельные статьи раздела, ссылки на них даны в конце.

## Содержание

1. [HTML: структура веб-страницы](#html-структура-веб-страницы)
2. [Семантическая разметка](#семантическая-разметка)
3. [CSS: стилизация страницы](#css-стилизация-страницы)
4. [CSS-селекторы](#css-селекторы)
5. [Box Model](#box-model)
6. [Display: block, inline, inline-block, none](#display-block-inline-inline-block-none)
7. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
8. [Заключение](#заключение)
9. [Полезные ссылки](#полезные-ссылки)

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

Подробнее про landmarks, ARIA-роли и доступность — в статье [Семантический HTML, landmarks и доступность](./html-semantics-accessibility.md).

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

Расстояние между элементами будет **30px** (не 50px), а не сумма обоих margin'ов. Подробнее о margin collapse и форматирующих контекстах — в статье [Positioning, stacking context и formatting contexts](./css-positioning-stacking.md).

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

## Ключевые тезисы для интервью

- HTML-документ состоит из `<!DOCTYPE>`, `<html lang>`, `<head>` и `<body>`; семантика (`<header>`, `<nav>`, `<main>`, `<footer>`) лучше `<div>` — доступность, SEO, читаемость.
- CSS подключается внешним файлом (рекомендуется), через `<style>` или инлайновым атрибутом; инлайн имеет высшую специфичность и не поддерживает псевдоклассы.
- Селекторы: тип, класс, ID, атрибут; комбинаторы потомка `div p`, ребёнка `div > p`, соседа `+` и `~`; псевдоклассы — состояния, псевдоэлементы — части элемента.
- Box Model: `content-box` прибавляет padding/border снаружи `width`, `border-box` вычитает их из неё — `border-box` делает размеры предсказуемыми.
- Вертикальные margin'ы соседних блоков схлопываются — остаётся больший из них.
- `block` — вся ширина и новая строка; `inline` — ширина контента без `width`/`height`; `inline-block` — гибрид; `none` убирает из layout, а `visibility: hidden` оставляет место.

---

## Заключение

HTML и CSS — фундамент веб-разработки. В этой статье разобраны основы: структура документа, семантическая разметка, синтаксис CSS, селекторы, box model и display. Это база, на которой строятся более глубокие темы. Каскад и специфичность, Flexbox и Grid, позиционирование, адаптивная вёрстка и способы применения CSS разобраны в профильных статьях раздела — к ним стоит перейти после закрепления основ. Создайте свою первую HTML-страницу, добавьте стили и поэкспериментируйте с селекторами и box model — только практика помогает закрепить эти знания.

## Полезные ссылки

- [MDN Web Docs — HTML](https://developer.mozilla.org/ru/docs/Web/HTML) — официальная документация HTML
- [MDN Web Docs — CSS](https://developer.mozilla.org/ru/docs/Web/CSS) — официальная документация CSS
- [HTML Reference](https://htmlreference.io/) — справочник по HTML
- [CSS Reference](https://cssreference.io/) — справочник по CSS
- [Can I Use](https://caniuse.com/) — проверка поддержки CSS-свойств браузерами