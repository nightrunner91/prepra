---
title: "Изображения, шрифты и медиа: LCP, CLS и загрузка"
section: html-css
description: "Как выбирать srcset и sizes, подключать AVIF/WebP и responsive video, грузить LCP-изображение с fetchpriority, настраивать @font-face и font-display, убирать CLS от шрифтов и аудировать медиа в DevTools."
order: 15
tags: ["images", "responsive-images", "srcset", "sizes", "picture", "avif", "webp", "lcp", "cls", "fetchpriority", "lazy-loading", "fonts", "font-display", "variable-fonts", "size-adjust", "svg", "video", "performance"]
questions:
  - "Как выбрать `srcset` и `sizes` для карточки и hero-изображения?"
  - "Как не словить CLS от веб-шрифта?"
  - "Как ускорить LCP, не ухудшив качество изображения?"
  - "Когда `loading=\"lazy\"` вредит?"
  - "Чем `<picture>` отличается от `srcset` и когда нужен каждый?"
  - "Что такое `font-display` и какое значение выбрать?"
  - "Зачем нужен `preload` и когда он вредит?"
  - "Какой формат изображения выбрать: AVIF, WebP или JPEG?"
  - "Как убрать CLS от изображений, видео и рекламных блоков?"
  - "Как аудировать LCP-изображение и шрифты в DevTools?"
answers:
  - "Для hero задают `srcset` с ширинами 800/1200/1600/2000w и `sizes=\"100vw\"`, потому что изображение занимает всю ширину; для карточки — 320/480/640w и `sizes=\"(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw\"`. Браузер сам выбирает кандидата с учётом DPR и layout-ширины, поэтому `sizes` должен отражать реальный CSS-размер, иначе скачается лишний мегабайт. Для art direction (разные кадры на мобильном и десктопе) используют `<picture>`, для одной и той же картинки в разных разрешениях — `srcset`."
  - "CLS от шрифта возникает, потому что fallback и веб-шрифт имеют разные метрики: высоту строки, ширину глифов, ascent/descent. Лечат комбинацией `size-adjust`, `ascent-override`, `descent-override` и `line-gap-override` для fallback, а также `font-display: optional` там, где сдвиг недопустим. Дополнительно фиксируют `line-height`, резервируют место под текст и не меняют `font-family` после загрузки без необходимости."
  - "Сначала уменьшают TTFB и задержку загрузки: CDN, кэш, ранний `preload` или `fetchpriority=\"high\"` для LCP-изображения, `srcset`, современный формат и сжатие. Затем сокращают время рендера: `width`/`height` или `aspect-ratio`, чтобы не было пересчёта layout, и убирают лишние блокирующие ресурсы. Качество не должно падать: сравнивают визуально на реальных DPR и подбирают quality/format, а не просто жмут в 30%."
  - "`loading=\"lazy\"` вредит LCP-элементу, первому экрану, карусели с видимым первым слайдом и изображениям внутри `content-visibility: auto`. Ленивая загрузка откладывает запрос до приближения к viewport, поэтому LCP растёт на сотни миллисекунд. Всё, что видно без прокрутки, грузят жадно; ленивость — для длинных списков и галерей ниже первого экрана."
  - "`srcset` — это набор кандидатов одного изображения с дескрипторами ширины (`w`) или плотности (`x`); браузер выбирает лучший под layout и DPR. `<picture>` — контейнер с несколькими `<source>` для art direction, разных форматов (AVIF/WebP) или media conditions, а `<img>` внутри остаётся обязательным fallback. `<picture>` не заменяет `srcset`: внутри `<source>` и `<img>` всё равно задают наборы кандидатов."
  - "`font-display` управляет периодом, когда текст может быть невидим или показан fallback: `block` держит текст невидимым до 3 секунд, `swap` сразу показывает fallback и меняет на веб-шрифт, `fallback` даёт короткий block и затем swap, `optional` может вообще не применить веб-шрифт на медленном первом визите. Для основного текста чаще выбирают `swap`, для критичной к сдвигу типографики — `optional`, а `block` оставляют для редких случаев."
  - "`preload` нужен для ресурсов, которые браузер иначе найдёт поздно: LCP-изображения, критичного веб-шрифта, hero-видео. Он повышает приоритет и запускает загрузку раньше, но при ошибке или избытке preload конкурирует с критическим CSS и ухудшает LCP. Preload оправдан, когда ресурс действительно нужен в первом экране и его URL стабилен; для изображений добавляют `imagesrcset`/`imagesizes`, для шрифтов — `crossorigin`."
  - "AVIF даёт лучший размер и качество для фото, но медленнее кодируется и требует fallback; WebP — безопасный универсальный выбор; JPEG остаётся для совместимости и случаев, где важна скорость кодирования; PNG — для прозрачности и графики, но не для фотографий. На практике отдают AVIF через `<source type=\"image/avif\">`, затем WebP, а `<img>` с JPEG/PNG оставляют fallback. Для логотипов и иконок лучше SVG, а не растр."
  - "Изображениям задают `width`/`height` или CSS `aspect-ratio`, видео — `aspect-ratio` и `poster`, рекламным и динамическим блокам резервируют `min-height`. Для шрифтов используют fallback-метрики и `font-display`, для позднего контента — skeleton с фиксированным размером. CLS считают по сдвигам без пользовательского ввода, поэтому важно, чтобы место было зарезервировано до загрузки, а не появлялось вместе с контентом."
  - "В DevTools смотрят Network с приоритетами и размером ресурсов, Performance — время загрузки LCP-элемента и layout shifts, Lighthouse — подсказки по `fetchpriority`, `srcset` и шрифтам. Точную причину даёт `PerformanceObserver` для `largest-contentful-paint` (элемент, `renderTime`, `loadTime`) и `layout-shift` (источники сдвига). Проверяют реальный DPR и throttling, а не только локальный быстрый интернет."
---

# Изображения, шрифты и медиа: LCP, CLS и загрузка

Изображения и шрифты — самая тяжёлая часть типичного интерфейса и одновременно самая частая причина плохих Core Web Vitals. Hero-картинка на 3 МБ, шрифт без `font-display`, `<img>` без размеров и `loading="lazy"` на первом экране — этого достаточно, чтобы LCP ушёл за 4 секунды, а CLS — за 0.25.

UI Engineer отвечает за это не меньше, чем за компоненты: именно он решает, какие форматы и размеры отдавать, что грузить заранее, как резервировать место и как проверять результат. В этой статье разберём responsive images, современные форматы, приоритеты загрузки, `<picture>`, видео, SVG, `@font-face`, `font-display`, fallback-метрики и практический аудит.

> Смежные темы: метрики и их интерпретация — в [Метрики производительности](../performance/web-performance-metrics.md), критический путь рендеринга — в [Парсинг HTML и производительность CSS](./html-rendering-pipeline.md), токены и типографическая система — в [Типографика, цвет и визуальный ритм](./typography-and-color.md).

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Практические примеры](#практические-примеры)
3. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
4. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
5. [Практическое задание и code review-чеклист](#практическое-задание-и-code-review-чеклист)
6. [Заключение](#заключение)
7. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### Почему медиа — зона ответственности UI Engineer

Картинки и шрифты влияют на три метрики сразу:

- **LCP** — самый большой элемент первого экрана. Чаще всего это изображение, реже — заголовок или видео-постер.
- **CLS** — сдвиги из-за изображений без размеров, поздно подгрузившихся шрифтов, баннеров и динамических блоков.
- **INP** — косвенно: тяжёлые изображения и шрифты конкурируют за сеть и main thread, а синхронный decode может задерживать ввод.

Типичный разбор «медленного сайта» выглядит так:

1. Hero-изображение весит 2.8 МБ и отдаётся в JPEG.
2. У `<img>` нет `width`/`height`, поэтому после загрузки страница дёргается.
3. Шрифт подключён через `@font-face` без `font-display`, текст невидим 3 секунды.
4. Все картинки, включая hero, помечены `loading="lazy"`.
5. Иконки — PNG по 40 КБ каждая.

Каждый пункт лечится отдельно, но вместе они дают кумулятивный эффект. Поэтому медиа — это система: формат, размеры, приоритет, резервирование места, шрифтовая стратегия и аудит.

### Как браузер выбирает изображение из srcset

`srcset` — список кандидатов. Браузер выбирает один из них по **layout-ширине** (из `sizes`) и **плотности пикселей** устройства (DPR).

```html
<img
  src="hero-1200.jpg"
  srcset="
    hero-800.jpg   800w,
    hero-1200.jpg 1200w,
    hero-1600.jpg 1600w,
    hero-2000.jpg 2000w
  "
  sizes="100vw"
  width="2000"
  height="1000"
  alt="Команда на сцене конференции"
>
```

Как это работает:

1. Браузер вычисляет CSS-ширину изображения из `sizes` (здесь `100vw`).
2. Умножает на DPR (например, 2 на Retina) и получает эффективную ширину.
3. Выбирает наименьший кандидат, который покрывает эту ширину, но не меньше.

Если `sizes` не указан, по умолчанию используется `100vw`. Это частая причина, почему карточка 320 px скачивает файл на 2000 px: браузер считает, что она занимает весь экран.

Правильный `sizes` для карточки в сетке:

```html
<img
  src="card-640.jpg"
  srcset="
    card-320.jpg 320w,
    card-480.jpg 480w,
    card-640.jpg 640w,
    card-960.jpg 960w
  "
  sizes="
    (min-width: 1280px) 320px,
    (min-width: 768px) 33vw,
    (min-width: 480px) 45vw,
    90vw
  "
  width="640"
  height="420"
  alt=""
  loading="lazy"
  decoding="async"
>
```

Что важно:

- **`sizes` — это CSS-ширина слота, а не ширина файла.** Она должна совпадать с реальной раскладкой, иначе браузер скачает не тот ресурс.
- **Порядок media conditions важен.** Первое подходящее условие выигрывает; пишите от большего к меньшему.
- **`w`-дескрипторы требуют `sizes`.** `x`-дескрипторы (`1x`, `2x`) используют для фиксированных размеров, например логотипа.
- **`src` остаётся fallback** для браузеров без `srcset` и для случаев, когда ни один кандидат не подошёл.

Для фиксированного логотипа достаточно плотностей:

```html
<img
  src="logo.png"
  srcset="logo.png 1x, logo@2x.png 2x"
  width="120"
  height="32"
  alt="Prepra"
>
```

Но если логотип — векторный, лучше SVG: один файл, любой DPR, меньший вес.

### `<picture>`: art direction и форматы

`<picture>` нужен, когда изображение — не просто «та же картинка в другом разрешении», а **другой ресурс**:

- art direction: на мобильном вертикальный кроп, на десктопе — широкий кадр;
- форматы: AVIF → WebP → JPEG fallback;
- media conditions: тёмная/светлая тема, reduced data, разные пропорции.

```html
<picture>
  <source
    type="image/avif"
    srcset="hero-800.avif 800w, hero-1600.avif 1600w"
    sizes="100vw"
  >
  <source
    type="image/webp"
    srcset="hero-800.webp 800w, hero-1600.webp 1600w"
    sizes="100vw"
  >
  <img
    src="hero-1600.jpg"
    srcset="hero-800.jpg 800w, hero-1600.jpg 1600w"
    sizes="100vw"
    width="1600"
    height="900"
    alt="Команда на сцене"
    fetchpriority="high"
    decoding="async"
  >
</picture>
```

Правила:

1. **`<img>` обязателен.** Это не только fallback, но и элемент, который получает `alt`, размеры и приоритет.
2. **Порядок `<source>` — от лучшего к худшему.** Браузер берёт первый поддерживаемый `type`.
3. **`type` обязателен для форматов.** Без него браузер может выбрать AVIF, который не умеет декодировать.
4. **`srcset`/`sizes` работают и внутри `<source>`.** `<picture>` не отменяет responsive images.
5. **Не дублируйте `alt` в `<source>`.** Он задаётся только на `<img>`.

Для art direction используют `media`:

```html
<picture>
  <source
    media="(min-width: 768px)"
    srcset="hero-wide-1600.jpg 1600w, hero-wide-2000.jpg 2000w"
    sizes="100vw"
  >
  <img
    src="hero-portrait-800.jpg"
    srcset="hero-portrait-800.jpg 800w, hero-portrait-1200.jpg 1200w"
    sizes="100vw"
    width="800"
    height="1200"
    alt="Спикер на сцене"
  >
</picture>
```

Помните: при смене `media` браузер может загрузить новый ресурс. Не стройте на этом анимацию и не используйте art direction без необходимости.

### Форматы: AVIF, WebP, JPEG, PNG, SVG

| Формат | Сильные стороны | Ограничения | Когда использовать |
|---|---|---|---|
| **AVIF** | Лучшее сжатие, HDR, прозрачность | Медленное кодирование, старые браузеры | Фото и hero с fallback |
| **WebP** | Хорошее сжатие, прозрачность, широкая поддержка | Чуть хуже AVIF на фото | Универсальный современный выбор |
| **JPEG** | Быстрое кодирование, совместимость | Нет прозрачности, хуже сжатие | Fallback, простые фото |
| **PNG** | Прозрачность, без потерь | Большой вес на фото | Скриншоты, графика, прозрачность |
| **SVG** | Вектор, масштаб, CSS-стилизация | Не для фото, сложные фильтры | Иконки, логотипы, схемы |

Практическая стратегия:

- **Фото** — AVIF с WebP/JPEG fallback.
- **Иконки и логотипы** — SVG; для сложных иллюстраций допустим AVIF/WebP.
- **Скриншоты и UI-графика** — PNG или WebP без потерь, если важна точность.
- **Анимации** — видео или CSS, а не GIF; GIF тяжёлый и плохо сжимается.

Качество подбирают визуально, а не по универсальной цифре: для AVIF часто достаточно 50–65, для WebP — 70–80, для JPEG — 75–85. Проверяйте на реальном DPR и на тёмных участках, где артефакты заметнее.

### Размеры, aspect-ratio и CLS

Браузер не знает размер изображения, пока не начнёт его загружать. Если размеры не заданы, место под картинку появляется только после загрузки — это layout shift.

Минимальный контракт:

```html
<img src="photo.jpg" width="800" height="600" alt="...">
```

```css
img {
  max-inline-size: 100%;
  block-size: auto;
}
```

Атрибуты `width`/`height` задают **intrinsic aspect ratio**, а CSS `block-size: auto` сохраняет пропорции. Современный эквивалент — `aspect-ratio`:

```css
.media {
  aspect-ratio: 16 / 9;
  inline-size: 100%;
  overflow: hidden;
}

.media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

`object-fit`:

- `cover` — заполняет контейнер с обрезкой (hero, карточки);
- `contain` — вписывает целиком (логотипы, скриншоты);
- `fill` — растягивает (почти всегда ошибка);
- `none` — натуральный размер;
- `scale-down` — меньшее из `none` и `contain`.

Для CLS важно:

- **Резервировать место** под изображение, видео, iframe, рекламу и динамические блоки.
- **Не менять `aspect-ratio` после загрузки.**
- **Не вставлять контент над уже прочитанным текстом.**
- **Использовать `content-visibility: auto` с `contain-intrinsic-size`**, если блоки ниже экрана.

```css
.ad-slot {
  min-block-size: 250px;
  contain-intrinsic-size: auto 250px;
}
```

`min-height` — грубее, но надёжнее: он резервирует место даже до загрузки скрипта. `contain-intrinsic-size` помогает `content-visibility`, но не заменяет резервирование для рекламы.

### Приоритеты: loading, fetchpriority, decoding, preload

У браузера есть очередь загрузки. UI Engineer может влиять на неё четырьмя инструментами.

**`loading`:**

```html
<!-- Первый экран: грузим сразу -->
<img src="hero.jpg" alt="" fetchpriority="high">

<!-- Ниже экрана: лениво -->
<img src="card.jpg" alt="" loading="lazy" decoding="async">
```

- `eager` (по умолчанию) — загрузка начинается сразу.
- `lazy` — браузер откладывает запрос, пока изображение не приблизится к viewport.

`loading="lazy"` **нельзя** ставить на LCP-изображение, первый экран, логотип в хедере и изображения в первом слайде карусели. Браузерный порог «приближения» варьируется, и на медленной сети картинка может загрузиться слишком поздно.

**`fetchpriority`:**

```html
<img src="hero.avif" alt="" fetchpriority="high" decoding="async">
```

- `high` — поднять приоритет (LCP-изображение).
- `low` — понизить (фоновые декорации, карусели ниже экрана).
- `auto` — по умолчанию.

Не ставьте `high` на всё: это обесценивает подсказку и конкурирует с CSS/шрифтами.

**`decoding`:**

- `async` — декодировать вне main thread, не блокируя рендер;
- `sync` — декодировать синхронно (может блокировать);
- `auto` — решение браузера.

Для большинства изображений `async` безопасен. Для LCP-изображения `sync` иногда помогает показать его раньше, но может ухудшить INP; тестируйте.

**`preload`:**

```html
<link
  rel="preload"
  as="image"
  href="hero-1600.avif"
  imagesrcset="hero-800.avif 800w, hero-1600.avif 1600w"
  imagesizes="100vw"
  fetchpriority="high"
>
```

Preload полезен, когда:

- изображение находится в CSS (`background-image`) и браузер не видит его в HTML;
- ресурс обнаружен поздно из-за JS или вложенных компонентов;
- шрифт нужен для первого экрана и без preload загружается после CSS.

Preload вреден, когда:

- ресурсов слишком много и они конкурируют с критическим CSS;
- URL нестабилен и preload промахивается;
- ресурс не нужен на первом экране;
- `preload` дублирует уже существующий `<img>` без `imagesrcset` и скачивает лишний файл.

Для шрифтов preload обязателен с `crossorigin`, даже если шрифт на том же origin:

```html
<link
  rel="preload"
  href="/fonts/inter-cyrillic-var.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
```

Без `crossorigin` браузер скачает шрифт дважды: preload и фактический запрос не совпадут.

### Шрифты: @font-face, variable fonts, subsetting

Базовая схема подключения:

```css
/* Один variable-файл на все веса, но отдельные файлы подсетов */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-cyrillic-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0400-04FF, U+2000-206F;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+2000-206F;
}
```

Что здесь важно:

- **`woff2` — основной формат.** Сжатие лучше, поддержка широкая; `woff`/`ttf` нужны только для очень старых браузеров.
- **Variable font** позволяет один файл на все веса и оси: `font-weight: 100 900`, `font-stretch`, `font-style: oblique 0deg 12deg`.
- **`unicode-range`** работает вместе с отдельными файлами подсетов: латиница, кириллица, пунктуация. Браузер скачивает только те файлы, чьи диапазоны реально нужны странице.
- **`font-display`** управляет поведением до загрузки.
- **`font-style` и `font-weight`** должны соответствовать реальным осям, иначе браузер будет синтезировать начертания.

Variable fonts:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-stretch: 75% 125%;
  font-display: swap;
}

.title {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 650;
  font-optical-sizing: auto;
}
```

`font-optical-sizing: auto` включает ось `opsz`, если она есть: мелкий текст получает более широкие и открытые формы, крупный — более плотные.

Subsetting — обязательная практика для кириллических проектов. Полный Inter с кириллицей и латиницей может весить 100–300 КБ; подсеты по `unicode-range` уменьшают первый запрос в разы. Если используете Google Fonts, подсеты уже настроены; при self-hosting их нужно генерировать (glyphhanger, subfont, fonttools).

### font-display и FOIT/FOUT

Пока шрифт не загружен, браузер выбирает одну из стратегий:

| Значение | Поведение | Риск |
|---|---|---|
| `auto` | Решение браузера (обычно `block`) | Непредсказуемость |
| `block` | Текст невидим до 3 с, затем fallback | FOIT, плохой LCP текста |
| `swap` | Сразу fallback, затем подмена | FOUT и CLS |
| `fallback` | Короткий block (~100 мс), затем fallback и swap | Небольшой FOUT |
| `optional` | Короткий block, затем fallback; на медленной сети шрифт может не примениться | Нет CLS, но возможен другой вид |

Рекомендации:

- **Основной текст** — `swap` или `fallback`, если важна скорость чтения.
- **Крупные заголовки** — `swap` с подобранным fallback, чтобы подмена была незаметной.
- **Критичная к сдвигу типографика** — `optional`; первый визит может пройти на fallback, зато CLS нулевой.
- **Иконки-шрифты** — не использовать; SVG надёжнее.

`block` почти никогда не нужен: три секунды невидимого текста — худший вариант для восприятия и LCP.

### CLS от шрифтов: fallback metrics

Даже с `swap` подмена шрифта вызывает сдвиг, если метрики отличаются. Решение — подогнать fallback:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

/* Подогнанный системный fallback */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif;
}
```

- **`size-adjust`** масштабирует глифы fallback, чтобы ширина строки совпадала.
- **`ascent-override`**, **`descent-override`**, **`line-gap-override`** подгоняют вертикальные метрики, чтобы высота строки не менялась.
- **`local()`** использует установленный шрифт, не добавляя сетевой запрос.

Метрики подбирают автоматически: Fontaine, `next/font` (Next.js), `@nuxt/fonts`, capsize. Вручную это делать долго и легко ошибиться.

Дополнительные меры:

- фиксируйте `line-height` в безразмерных единицах;
- не меняйте `font-size` после загрузки шрифта;
- резервируйте место под заголовки;
- для критичных экранов используйте `font-display: optional`;
- не подключайте пять начертаний, если хватает двух.

### Видео, SVG и иконки

**Видео.** Hero-видео может быть LCP-элементом; тогда важны постер, `preload="metadata"`, `playsinline`, `muted` для автоплея и размеры:

```html
<video
  class="hero-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="hero-poster.avif"
  width="1600"
  height="900"
  aria-hidden="true"
>
  <source src="hero.webm" type="video/webm">
  <source src="hero.mp4" type="video/mp4">
</video>
```

```css
.hero-video {
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
```

Правила:

- **Постер обязателен** — это фактический LCP, пока видео не загрузилось.
- **`preload="metadata"`** для фонового видео; `none` — если видео точно не нужно сразу.
- **`muted` + `playsinline`** нужны для автоплея в мобильных браузерах.
- **Не автоплейте видео с озвучкой** и давайте паузу, если оно длится дольше 5 секунд.
- **Уважайте `prefers-reduced-motion`**: фоновое видео либо не запускается, либо имеет кнопку паузы.
- **`aria-hidden`** для декоративного фона; для контентного видео нужны субтитры и управление.

**SVG.** Для иконок и логотипов SVG лучше растра:

```html
<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
  <use href="#icon-search" />
</svg>
```

- **`viewBox`** обязателен для масштабирования.
- **`currentColor`** позволяет красить иконку через `color` и наследовать тему.
- **Спрайт** уменьшает число запросов; инлайн-спрайт — лучший вариант для критичных иконок.
- **`aria-hidden`** для декоративных иконок; для смысловых — `<title>` или видимая подпись.
- **Оптимизируйте SVG** (SVGO), убирайте лишние метаданные и встроенные растеризации.

**Иконки-компоненты** и их API разобраны в [UI-киты, headless-компоненты и Storybook](./ui-kits-and-component-libraries.md).

### Аудит: Lighthouse, Network и PerformanceObserver

Аудит медиа — это три слоя.

**1. Network.**

- Размер и формат каждого изображения.
- Приоритет запросов: LCP-изображение должно быть `High`, а не `Low`.
- Дубли: preload + `<img>` без совпадения `srcset`.
- Лишние запросы шрифтов: сколько подсетов реально скачалось.
- Кэширование: `cache-control` и хеши в именах.

**2. Performance.**

- LCP-элемент и его subparts: TTFB, load delay, load duration, render delay.
- Layout shifts и их источники.
- Длинные задачи, конкурирующие с загрузкой.

**3. Lighthouse.**

- Подсказки по `fetchpriority`, `srcset`, `font-display`, `preload`.
- Размер изображений и потенциальная экономия.
- `uses-responsive-images`, `modern-image-formats`, `font-display`.

Точную причину даёт PerformanceObserver:

```js
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const last = entries[entries.length - 1];

  console.log('LCP', {
    element: last.element,
    url: last.url,
    renderTime: last.renderTime,
    loadTime: last.loadTime,
    size: last.size,
  });
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue;

    console.log('Layout shift', {
      value: entry.value,
      sources: entry.sources?.map((source) => source.node),
    });
  }
}).observe({ type: 'layout-shift', buffered: true });
```

Что искать:

- LCP-элемент — `<img>` с `loading="lazy"`? Это почти всегда ошибка.
- `url` LCP-изображения весит больше 500 КБ? Пора менять формат и `srcset`.
- `renderTime` намного больше `loadTime`? Проблема в main thread или CSS.
- Источники layout shift — изображения без размеров, шрифты, баннеры.

## Практические примеры

### Пример 1. Hero-изображение: AVIF/WebP, srcset, fetchpriority и preload

```html
<link
  rel="preload"
  as="image"
  href="/img/hero-1600.avif"
  imagesrcset="/img/hero-800.avif 800w, /img/hero-1200.avif 1200w, /img/hero-1600.avif 1600w"
  imagesizes="100vw"
  fetchpriority="high"
>

<picture>
  <source
    type="image/avif"
    srcset="/img/hero-800.avif 800w, /img/hero-1200.avif 1200w, /img/hero-1600.avif 1600w"
    sizes="100vw"
  >
  <source
    type="image/webp"
    srcset="/img/hero-800.webp 800w, /img/hero-1200.webp 1200w, /img/hero-1600.webp 1600w"
    sizes="100vw"
  >
  <img
    src="/img/hero-1200.jpg"
    srcset="/img/hero-800.jpg 800w, /img/hero-1200.jpg 1200w, /img/hero-1600.jpg 1600w"
    sizes="100vw"
    width="1600"
    height="900"
    alt="Команда обсуждает дизайн-систему на встрече"
    fetchpriority="high"
    decoding="async"
  >
</picture>
```

Почему так:

- preload с `imagesrcset` и `imagesizes` совпадает с `<img>` и не скачивает лишний файл;
- AVIF первым, WebP вторым, JPEG — fallback;
- `width`/`height` задают пропорции и убирают CLS;
- `fetchpriority="high"` поднимает приоритет LCP-изображения;
- `sizes="100vw"` соответствует полноэкранному hero;
- `decoding="async"` не блокирует main thread.

Что проверить: в DevTools Network у hero должен быть `High` priority, а размер — соответствовать DPR. Если на мобильном скачивается 1600 px, `sizes` или `srcset` настроены неверно.

### Пример 2. Карточка в сетке: sizes, lazy и aspect-ratio

```html
<article class="card">
  <div class="card__media">
    <img
      src="/img/card-640.jpg"
      srcset="
        /img/card-320.jpg 320w,
        /img/card-480.jpg 480w,
        /img/card-640.jpg 640w,
        /img/card-960.jpg 960w
      "
      sizes="
        (min-width: 1280px) 320px,
        (min-width: 768px) 33vw,
        (min-width: 480px) 45vw,
        90vw
      "
      width="640"
      height="420"
      alt=""
      loading="lazy"
      decoding="async"
    >
  </div>
  <h3 class="card__title">Как устроен дизайн-токен</h3>
</article>
```

```css
.card {
  display: grid;
  gap: var(--space-3);
}

.card__media {
  aspect-ratio: 640 / 420;
  overflow: hidden;
  border-radius: 8px;
}

.card__media img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

Почему так:

- `sizes` описывает реальную ширину карточки на разных breakpoint-ах;
- `loading="lazy"` уместен, потому что карточки обычно ниже первого экрана;
- `aspect-ratio` резервирует место и предотвращает CLS;
- `object-fit: cover` сохраняет кадр без искажений;
- `alt=""` корректен, если изображение декоративное, а смысл передаёт заголовок.

Проверьте: при ширине 375 px и DPR 2 браузер должен выбрать 640–960w, а не 1600w. Если выбрал больше — `sizes` завышен.

### Пример 3. Шрифт: variable, subset, font-display и fallback-метрики

```html
<link
  rel="preload"
  href="/fonts/inter-cyrillic-var.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-cyrillic-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0400-04FF, U+2000-206F;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+2000-206F;
}

@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

:root {
  --font-sans: 'Inter', 'Inter Fallback', system-ui, -apple-system, sans-serif;
}

body {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
}

h1 {
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
```

Почему так:

- один variable-файл на веса, но отдельные файлы для кириллицы и латиницы;
- `unicode-range` подсказывает браузеру, какой подсет нужен, и второй файл не скачивается;
- `font-display: swap` показывает текст сразу;
- fallback с `size-adjust` и overrides уменьшает сдвиг при подмене;
- `crossorigin` обязателен для preload шрифта;
- `line-height` безразмерный, чтобы не ломаться при изменении размера.

Что проверить:

- в Network скачался ровно один файл шрифта, а не пять;
- при медленной сети текст виден сразу;
- CLS от шрифта близок к нулю (Performance → Layout shifts);
- при отключённом шрифте вёрстка не разваливается.

### Пример 4. SVG-иконки и адаптивное видео

```html
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <use href="#icon-search" />
</svg>

<button type="button" class="icon-button" aria-label="Поиск">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <use href="#icon-search" />
  </svg>
</button>
```

```css
.icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-button {
  display: inline-grid;
  place-items: center;
  min-inline-size: 44px;
  min-block-size: 44px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
}

.icon-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

```html
<video
  class="hero-video"
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/img/hero-poster.avif"
  width="1600"
  height="900"
  aria-hidden="true"
>
  <source src="/video/hero.webm" type="video/webm">
  <source src="/video/hero.mp4" type="video/mp4">
</video>
```

Почему так:

- SVG масштабируется без потерь и красится через `currentColor`;
- иконка декоративная, имя кнопки задано на `<button>`;
- touch-цель не меньше 44 px;
- постер видео — фактический LCP, поэтому он в AVIF и с размерами;
- `aria-hidden` корректен для фонового видео, но не для контентного;
- `preload="metadata"` не тянет весь файл.

### Пример 5. Аудит LCP и CLS на странице

```js
const lcp = [];
const shifts = [];

new PerformanceObserver((list) => {
  lcp.push(...list.getEntries());
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((list) => {
  shifts.push(...list.getEntries().filter((entry) => !entry.hadRecentInput));
}).observe({ type: 'layout-shift', buffered: true });

window.addEventListener('load', () => {
  const lastLcp = lcp[lcp.length - 1];

  console.table({
    lcpElement: lastLcp?.element?.tagName,
    lcpUrl: lastLcp?.url,
    renderTime: Math.round(lastLcp?.renderTime ?? 0),
    loadTime: Math.round(lastLcp?.loadTime ?? 0),
    lcpSize: lastLcp?.size,
  });

  console.log(
    'CLS',
    shifts.reduce((sum, entry) => sum + entry.value, 0),
  );

  for (const shift of shifts) {
    for (const source of shift.sources ?? []) {
      console.log('Сдвиг:', source.node, source.previousRect, source.currentRect);
    }
  }
});
```

Порядок аудита:

1. **Network** — размер, формат и приоритет LCP-изображения; количество файлов шрифта.
2. **Performance** — LCP-элемент, subparts, layout shifts, long tasks.
3. **PerformanceObserver** — точный элемент и источник сдвига.
4. **Lighthouse** — сводные подсказки и потенциальная экономия.
5. **Реальное устройство** — throttling ×4–×6 и мобильный DPR.

Что считать хорошим результатом:

- LCP ≤ 2.5 с на p75;
- CLS ≤ 0.1;
- LCP-изображение в современном формате, размер соответствует слоту;
- шрифт загружается одним подсетом, текст виден сразу;
- нет сдвигов от изображений, шрифтов, рекламы и динамических блоков.

## Типичные ошибки и антипаттерны

- **Hero-изображение с `loading="lazy"`.** Откладывает LCP на сотни миллисекунд. Первый экран грузится жадно.
- **`srcset` без `sizes`.** Браузер считает, что изображение занимает `100vw`, и скачивает лишний ресурс.
- **`sizes` не соответствует реальной ширине.** Карточка 320 px получает файл 1600 px.
- **`<img>` без `width`/`height` или `aspect-ratio`.** Layout shift после загрузки.
- **`object-fit: fill`.** Искажает пропорции; используйте `cover` или `contain`.
- **Все изображения в JPEG/PNG.** Теряете десятки процентов веса; нужен AVIF/WebP с fallback.
- **AVIF без fallback.** Старые браузеры не покажут изображение.
- **`<picture>` без `<img>`.** Нет alt, размеров и fallback.
- **`<source>` в неправильном порядке.** Браузер выбирает первый поддерживаемый тип, а не лучший.
- **Preload всего подряд.** Конкуренция с CSS и шрифтами, ухудшение LCP.
- **Preload шрифта без `crossorigin`.** Двойная загрузка.
- **`font-display: block` для основного текста.** FOIT на три секунды.
- **Пять начертаний вместо variable-шрифта.** Лишние запросы и вес.
- **Шрифт без `unicode-range`.** Кириллический пользователь тянет всю латиницу и наоборот.
- **Нет fallback-метрик.** Подмена шрифта двигает текст и ломает CLS.
- **`font-size` в пикселях и фиксированная высота строки.** Ломает масштабирование и ритм.
- **Автоплей видео с озвучкой.** Раздражает и нарушает доступность.
- **Видео без постера.** Пустой прямоугольник до загрузки.
- **Иконки-шрифты.** Хуже рендерятся, ломают доступность и тему.
- **SVG без `viewBox`.** Не масштабируется.
- **Декоративные иконки без `aria-hidden`.** Скринридер читает мусор.
- **Реклама и баннеры без зарезервированного места.** Главный источник CLS на медиасайтах.
- **Аудит только в Lighthouse.** Он не покажет реальный элемент LCP и источник сдвига; нужны Performance и PerformanceObserver.

## Ключевые тезисы для интервью

- **Медиа — это LCP и CLS.** Изображения и шрифты чаще всего определяют обе метрики, поэтому их проектируют, а не «подключают потом».
- **`srcset` + `sizes` — основа responsive images.** `sizes` описывает CSS-ширину слота, а не размер файла; без него браузер берёт `100vw`.
- **`<picture>` — для art direction и форматов.** `<img>` внутри обязателен, `type` у `<source>` обязателен.
- **AVIF → WebP → JPEG.** Лучшее сжатие с безопасным fallback; SVG — для иконок и логотипов.
- **`width`/`height` или `aspect-ratio` обязательны.** Они резервируют место и убирают CLS.
- **LCP-изображение грузится жадно.** `fetchpriority="high"`, без `loading="lazy"`, при необходимости preload с `imagesrcset`.
- **`loading="lazy"` — только ниже первого экрана.** На hero, хедере и первом слайде карусели он вредит.
- **Preload — точечный инструмент.** Только для ресурсов первого экрана; избыток конкурирует с критическим CSS.
- **`font-display` — компромисс между FOIT и FOUT.** `swap` для текста, `optional` для критичного к сдвигу, `block` почти никогда.
- **Fallback-метрики уменьшают CLS.** `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`.
- **Variable fonts и `unicode-range` экономят вес.** Один файл на веса, подсеты по языкам.
- **Preload шрифта требует `crossorigin`.** Иначе браузер скачает его дважды.
- **Видео влияет на LCP через постер.** Постер обязателен, `preload="metadata"`, `muted` + `playsinline` для автоплея.
- **Аудит — это Network + Performance + PerformanceObserver.** Lighthouse даёт подсказки, но не точную причину.
- **Проверять нужно на реальном устройстве и throttling.** Локальный быстрый интернет скрывает проблемы.

## Практическое задание и code review-чеклист

### Задание: ускорить медиа на тестовой странице

Возьмите страницу с hero-изображением, сеткой карточек и одним веб-шрифтом (можно собрать искусственно).

**1. Замер до.**

- Запустите Lighthouse в mobile-режиме с throttling.
- Зафиксируйте LCP, CLS и размер загруженных медиа.
- Найдите LCP-элемент через PerformanceObserver и DevTools Performance.

**2. Изображения.**

- Переведите hero в AVIF + WebP + JPEG fallback.
- Сгенерируйте `srcset` под 800/1200/1600/2000w и корректный `sizes`.
- Добавьте `width`/`height`, `fetchpriority="high"`, `decoding="async"`.
- Уберите `loading="lazy"` с первого экрана.
- Для карточек настройте `srcset` 320/480/640/960w, `sizes` под сетку, `loading="lazy"` и `aspect-ratio`.

**3. Шрифт.**

- Оставьте один variable-файл или два подсета.
- Добавьте `font-display: swap`, `unicode-range`, preload с `crossorigin`.
- Подберите fallback-метрики (`size-adjust` и overrides).
- Проверьте, что текст виден сразу и не дёргается при подмене.

**4. Замер после.**

- Повторите Lighthouse и PerformanceObserver.
- Сравните LCP, CLS и вес медиа.
- Проверьте на throttling ×4 и мобильном DPR.
- Убедитесь, что качество изображения не деградировало визуально.

**Критерии оценки:**

- LCP-изображение имеет `High` priority и корректный `sizes`;
- нет CLS от изображений и шрифта;
- шрифт скачивается одним-двумя файлами;
- есть fallback для AVIF/WebP;
- видео и изображения имеют размеры и постер;
- замеры до/после зафиксированы, а не «стало быстрее на глаз».

### Чек-лист code review

- [ ] У LCP-изображения нет `loading="lazy"`; при необходимости стоит `fetchpriority="high"`.
- [ ] `srcset` и `sizes` соответствуют реальным слотам и breakpoint-ам.
- [ ] У изображений есть `width`/`height` или `aspect-ratio`.
- [ ] Форматы: AVIF/WebP с JPEG/PNG fallback; SVG для иконок.
- [ ] `<picture>` содержит `<img>` с `alt` и размерами.
- [ ] `<source>` идут от лучшего формата к fallback, у каждого указан `type`.
- [ ] Preload используется только для ресурсов первого экрана и совпадает с фактическим запросом.
- [ ] Preload шрифта содержит `as="font"`, `type`, `crossorigin`.
- [ ] Шрифт подключён в `woff2`, по возможности variable и с `unicode-range`.
- [ ] `font-display` выбран осознанно; для основного текста не `block`.
- [ ] Есть fallback-метрики (`size-adjust`, overrides) или использован инструмент их генерации.
- [ ] `line-height` безразмерный, `font-size` в `rem`.
- [ ] Видео имеет постер, размеры, `preload="metadata"` и `playsinline`; автоплей без звука.
- [ ] Иконки декоративные скрыты через `aria-hidden`; смысловые имеют имя.
- [ ] Реклама, iframe и динамические блоки резервируют место.
- [ ] Кэширование статики настроено (`cache-control`, хеши в именах).
- [ ] Аудит проведён в Network, Performance и Lighthouse, а не только по оценке Lighthouse.
- [ ] Проверено на мобильном устройстве и throttling.

## Заключение

Изображения и шрифты — это не «ресурсы, которые кто-то положил в папку», а часть интерфейсной системы. UI Engineer выбирает формат и размер, описывает `srcset`/`sizes`, резервирует место, управляет приоритетом, настраивает `font-display` и fallback-метрики и проверяет результат на реальном устройстве.

Главный принцип простой: **браузер должен знать заранее, что и зачем он грузит**. Если `sizes` отражает реальную ширину, LCP-изображение помечено `fetchpriority`, а шрифт имеет подсет и метрики fallback, интерфейс остаётся быстрым и стабильным без героических оптимизаций. Если нет — никакой Lighthouse-скор не спасёт от прыгающего текста и трёхсекундного ожидания.

Дальше стоит перейти к диагностике Core Web Vitals на уровне приложения — [Метрики производительности](../performance/web-performance-metrics.md). Загрузка и оптимизация на уровне фреймворка разобраны в [Next.js: оптимизация](../nextjs/optimization.md) и [Nuxt: режимы рендеринга](../nuxt/rendering-modes.md).

## Полезные ссылки

- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [MDN: `<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture)
- [MDN: `srcset`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#srcset)
- [MDN: `fetchpriority`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#fetchpriority)
- [MDN: `loading`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#loading)
- [MDN: `@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
- [MDN: `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [MDN: `size-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)
- [web.dev: Optimize LCP](https://web.dev/articles/optimize-lcp)
- [web.dev: Optimize CLS](https://web.dev/articles/optimize-cls)
- [web.dev: Responsive images](https://web.dev/articles/serve-responsive-images)
- [web.dev: Font best practices](https://web.dev/articles/font-best-practices)
- [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets)
- [Fontaine](https://github.com/unjs/fontaine) — генерация fallback-метрик
- [SVGO](https://github.com/svg/svgo) — оптимизация SVG
