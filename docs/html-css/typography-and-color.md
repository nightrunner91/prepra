---
title: "Типографика, цвет и визуальный ритм"
section: html-css
description: "Как построить типографическую шкалу и spacing-систему, настроить fluid type и переносы, собрать семантическую палитру в oklch, сделать dark mode без FOUC и проверить контраст без потери бренда."
order: 14
tags: ["typography", "type-scale", "fluid-typography", "clamp", "spacing", "vertical-rhythm", "color", "oklch", "color-mix", "light-dark", "dark-mode", "contrast", "wcag", "apca", "design-tokens"]
questions:
  - "Как построить type scale для продукта?"
  - "Как проверить контраст и не сломать бренд?"
  - "Как сделать dark mode без FOUC?"
  - "Чем семантические токены отличаются от primitive?"
  - "Что такое fluid typography и когда `clamp()` вредит?"
  - "Зачем нужны `size-adjust` и fallback-метрики шрифта?"
  - "Что такое `oklch` и зачем он, если есть hex?"
  - "Как сделать состояния hover, active и disabled доступными не только цветом?"
  - "Что такое вертикальный ритм и как его не сломать?"
  - "Когда использовать `text-wrap: balance`, а когда `pretty`?"
answers:
  - "Шкала строится от базового размера и выбранного коэффициента: 1.125–1.2 для плотных интерфейсов, 1.25 для продуктовых лендингов, 1.333–1.5 для выразительной типографики. Размеры фиксируются как токены (`--font-size-100…900`), а не как `h1`/`h2`, чтобы заголовок и текст можно было комбинировать по смыслу. Дополнительно задаются line-height, measure и fluid-вариант через `clamp()`; шкала проверяется на реальных экранах и в обеих темах."
  - "Контраст считают по WCAG: 4.5:1 для обычного текста, 3:1 для крупного и нетекстовых элементов; проверяют все состояния и обе темы, а не только основной текст на белом. Если бренд не проходит, меняют не оттенок вслепую, а lightness в `oklch` или подбирают соседний тон при сохранении chroma и hue. APCA можно использовать как дополнительную проверку, но в WCAG 2.2 она не является нормативным требованием."
  - "Нужно выставить `color-scheme` в HTML/CSS, хранить выбор пользователя в `data-theme` на `<html>` и применить его блокирующим inline-скриптом в `<head>` до первой отрисовки. Тогда CSS получает правильную тему до paint и не показывает вспышку светлой версии; `light-dark()` или токены на `[data-theme]` довершают картину. Отдельно проверяют системную тему, `prefers-color-scheme` и состояние «тема ещё не выбрана»."
  - "Primitive-токены — сырые значения шкалы (`blue-500`, `space-4`, `font-size-300`), semantic — роль в интерфейсе (`text-muted`, `surface-raised`, `border-strong`, `focus-ring`), component — конкретное применение (`button-primary-bg`). Компоненты должны ссылаться на semantic-уровень, иначе смена темы или бренда превращается в поиск hex по всему коду. Primitive остаются внутренней кухней палитры и типографики."
  - "Fluid typography задаёт размер через `clamp(min, preferred, max)`, где preferred обычно смесь `rem` и `vw`, чтобы текст масштабировался с viewport, но не уходил в крайности. Это удобно для заголовков и крупных блоков, но вредит мелкому тексту, таблицам и элементам управления: там нужна предсказуемость, а не текучесть. Кроме того, `vw` без `rem` ломает пользовательское увеличение шрифта, поэтому в формуле всегда должна быть `rem`-составляющая."
  - "`size-adjust`, `ascent-override`, `descent-override` и `line-gap-override` подгоняют метрики fallback-шрифта под веб-шрифт, чтобы при `font-display: swap` текст не прыгал и не менял высоту строки. Это снижает CLS от шрифтов и делает fallback визуально ближе к финальному начертанию. Метрики подбирают инструментом (например, Fontaine или встроенным fallback в `next/font`) и проверяют на реальной паре шрифтов."
  - "`oklch()` описывает цвет через воспринимаемую lightness, chroma и hue, поэтому изменение L ведёт себя предсказуемо и не уводит оттенок в серый или неоновый, как это бывает с HSL. Он удобен для генерации шкал, hover-состояний и `color-mix()`, а также покрывает P3-диапазон. При этом контраст WCAG всё равно считается по sRGB-яркости, поэтому `oklch` не заменяет проверку контраста."
  - "Состояние должно дублироваться формой, иконкой, текстом или паттерном: ошибка — не только красная рамка, но и сообщение с `aria-invalid`; выбранный пункт — не только цвет, но и галочка/жирность; disabled — не только прозрачность, но и `disabled`/`aria-disabled` и понятный курсор. Контраст текста и границ сохраняют и в hover/active, а фокус-индикатор не прячут. Дополнительно проверяют режим `prefers-contrast: more` и forced-colors."
  - "Вертикальный ритм — согласованный шаг между строками, абзацами и блоками, обычно на базе 4 или 8 px и line-height основного текста. Его задают spacing-токенами и `gap`/`margin-block`, а не случайными `margin-top: 13px`; заголовки и медиа выравнивают по ритму с учётом line-height. Ломают ритм произвольные отступы, разные line-height у соседних блоков и «оптическая» подгонка без системы."
  - "`text-wrap: balance` уравнивает строки заголовка и работает для коротких блоков (обычно до 6 строк), поэтому его ставят на `h1–h3`, а не на длинные абзацы. `pretty` борется с висячими словами и «сиротами» в абзацах, но его поддержка новее и эффект мягче; это прогрессивное улучшение. Оба свойства не заменяют нормальный `max-inline-size` и осмысленные переносы."
---

# Типографика, цвет и визуальный ритм

UI Engineer оценивают не только по тому, умеет ли он собрать компонент, но и по тому, выглядит ли интерфейс собранным. Типографика, цвет и отступы — это три слоя, которые определяют восприятие раньше, чем пользователь прочитает первый текст. Плохая шкала делает интерфейс шумным, случайная палитра — неаккуратным, а произвольные отступы — дёшевым, даже если код идеален.

В этой статье разберём, как строить типографическую и spacing-шкалу, как работает fluid type, зачем нужны `text-wrap` и `font-variant-numeric`, как собрать семантическую палитру в `oklch`, сделать dark mode без вспышки и проверить контраст так, чтобы не сломать бренд.

> Смежные темы: токены и их pipeline — в [Дизайн-токены, темизация и Figma](./design-tokens-and-figma.md), архитектура стилей — в [Способы применения CSS](./css-styling-approaches.md), требования доступности — в [Доступность: WCAG 2.2](./accessibility-wcag.md). Загрузка шрифтов и изображений разобрана отдельно в [Изображения, шрифты и медиа](./images-and-fonts.md).

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

### Зачем UI Engineer типографика и цвет

Дизайнер приносит макет, но именно UI Engineer превращает его в систему:

- **Типографическая шкала** определяет иерархию: что читается первым, что вторым, где заголовок, а где подпись.
- **Цветовые роли** связывают бренд с состояниями: поверхность, текст, граница, акцент, ошибка, успех.
- **Отступы** задают ритм и плотность: интерфейс выглядит спокойным или перегруженным в зависимости от шага.
- **Токены** делают всё это переносимым между темами, брендами и платформами.

Без системы появляются симптомы, знакомые каждому:

- заголовки набраны «на глаз», между `h2` и `h3` нет разницы;
- текст растянут на 120 символов и читается как строка новостной ленты;
- на странице пять оттенков серого, каждый из которых введён вручную;
- dark mode — это инверсия цветов, в которой тени исчезли, а контраст упал;
- брендовый цвет не проходит контраст, и его «чинят» чёрной обводкой.

### Type scale: как построить шкалу

**Type scale** — набор размеров шрифта, связанных одним коэффициентом. База обычно 16 px (`1rem`), коэффициент выбирают по плотности интерфейса:

| Коэффициент | Название | Где уместен |
|---|---|---|
| 1.125 | Major second | Плотные SaaS-интерфейсы, дашборды |
| 1.2 | Minor third | Универсальный продуктовый UI |
| 1.25 | Major third | Лендинги, маркетинг, выразительные заголовки |
| 1.333 | Perfect fourth | Редакционный контент, крупные заголовки |
| 1.5 | Perfect fifth | Плакатная типографика, редкие акценты |
| 1.618 | Golden ratio | Смелые системы, требует осторожности |

Практический пример шкалы с коэффициентом 1.2:

```css
:root {
  --font-size-100: 0.75rem;   /* 12px — подписи, meta */
  --font-size-200: 0.875rem;  /* 14px — вспомогательный текст */
  --font-size-300: 1rem;      /* 16px — базовый текст */
  --font-size-400: 1.1875rem; /* 19px — лид */
  --font-size-500: 1.4375rem; /* 23px — h4/h3 */
  --font-size-600: 1.75rem;   /* 28px — h2 */
  --font-size-700: 2.125rem;  /* 34px — h1 */
  --font-size-800: 2.5625rem; /* 41px — display */
}
```

Почему числовые токены, а не `--font-size-h1`:

- **Семантика меняется, значение — нет.** Один и тот же размер может быть `h2` на одной странице и `h1` на другой.
- **Компоненты не привязаны к HTML.** Кнопка, бейдж и карточка используют шкалу, а не теги.
- **Проще считать и проверять.** Видно, что между 300 и 400 есть шаг, а между 500 и 600 — тоже.

Для заголовков дополнительно задают **line-height** и **tracking**:

| Роль | Размер | Line-height | Letter-spacing |
|---|---|---|---|
| Display | 40–56 px | 1.05–1.15 | −0.02em…−0.01em |
| H1 | 32–40 px | 1.15–1.2 | −0.02em |
| H2 | 28–32 px | 1.2–1.3 | −0.01em |
| H3 | 22–24 px | 1.3 | 0 |
| Body | 16–18 px | 1.5–1.7 | 0 |
| Small | 13–14 px | 1.4–1.5 | 0.01em |
| Caption | 12 px | 1.4 | 0.01–0.02em |

Крупный текст требует отрицательного tracking: на 40 px стандартный межбуквенный интервал выглядит разреженным. Мелкий uppercase-текст, наоборот, часто нуждается в небольшом положительном.

**Measure** — длина строки. Комфортный диапазон — **45–75 символов**, для длинных текстов — 60–70. В CSS это удобно задавать в `ch`:

```css
.prose {
  max-inline-size: 68ch;
}

.prose--narrow {
  max-inline-size: 52ch;
}
```

`ch` зависит от шрифта (ширина нуля), поэтому это приблизительная, но полезная мера. Не стоит задавать measure в пикселях: при смене шрифта или масштаба текст станет либо слишком узким, либо слишком широким.

### Fluid typography и clamp()

**Fluid typography** позволяет размеру плавно меняться между минимальным и максимальным значением в зависимости от ширины viewport:

```css
h1 {
  font-size: clamp(2rem, 1.6rem + 2vw, 3rem);
}
```

Формула читается так:

- `2rem` — минимум; меньше не станет даже на узком экране.
- `1.6rem + 2vw` — предпочтительное значение: растёт с шириной.
- `3rem` — максимум; дальше не растёт.

Ключевое правило: **в предпочтительном значении должна быть `rem`-составляющая**. `font-size: clamp(1rem, 4vw, 2rem)` игнорирует пользовательское увеличение шрифта: человек выставил 24 px по умолчанию, а заголовок всё равно считается от `vw`. Комбинация `rem + vw` сохраняет и масштаб пользователя, и адаптивность.

Когда fluid type помогает:

- крупные заголовки и display-текст;
- hero-блоки, где важно заполнить ширину;
- секции с большими отступами и типографикой.

Когда вредит:

- мелкий текст, таблицы, подписи, элементы форм — там нужна предсказуемость;
- интерфейсы с фиксированной плотностью (дашборды, IDE);
- случаи, где `clamp()` превращается в «магическую формулу», которую никто не может объяснить.

`clamp()` также удобен для отступов и размеров контейнеров:

```css
.section {
  padding-block: clamp(2rem, 1rem + 4vw, 5rem);
}
```

Но не стоит делать fluid-абсолютно всё: движение каждого размера одновременно лишает макет устойчивости и усложняет визуальную регрессию.

### Переносы, переносы строк и числовые данные

Типографика — это не только размеры. Есть несколько свойств, которые заметно влияют на качество текста.

**`text-wrap: balance`** уравнивает строки в коротком блоке. Идеально для заголовков:

```css
h1, h2, h3 {
  text-wrap: balance;
}
```

Браузер ограничивает число обрабатываемых строк (в Chrome — до шести), поэтому на длинных абзацах эффекта не будет. Это и хорошо: для абзацев есть `pretty`.

**`text-wrap: pretty`** старается избежать «сирот» — одного слова на последней строке — и улучшает разбиение:

```css
p {
  text-wrap: pretty;
}
```

Поддержка `pretty` новее, чем `balance`, поэтому это прогрессивное улучшение: без него текст останется нормальным, просто менее аккуратным.

**`hyphens: auto`** включает переносы, но только при наличии `lang` и поддержки словаря:

```html
<html lang="ru">
```

```css
.prose p {
  hyphens: auto;
}
```

Переносы помогают в узких колонках, но вредят в широких: они замедляют чтение и выглядят неаккуратно при плохом словаре. Для русского языка особенно важно проверять, что браузер корректно переносит составные слова.

**`font-variant-numeric`** — обязательный инструмент для таблиц и финансов:

```css
.table td,
.price {
  font-variant-numeric: tabular-nums;
}

.code {
  font-variant-numeric: slashed-zero;
}
```

`tabular-nums` делает цифры моноширинными, чтобы столбцы не «плясали» при обновлении данных. `slashed-zero` помогает отличить `0` от `O`.

**Обрезка текста.** Однострочная:

```css
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

Многострочная — через `line-clamp`:

```css
.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
```

Важно: обрезанный текст должен оставаться доступным. Если полный текст важен, добавьте `title` или раскрытие, а не прячьте смысл в ellipsis.

**Оптическое выравнивание.** Механическое выравнивание по bounding box часто выглядит неверно:

- иконка рядом с текстом кажется выше, если у неё нет запаса снизу;
- круглая кнопка и квадратная с одинаковым `width` воспринимаются по-разному;
- кавычка в начале абзаца создаёт визуальный отступ, хотя margin равен нулю;
- заголовок с большой `line-height` кажется оторванным от текста.

Лечится небольшими отрицательными margin, `padding` и `transform: translateY()`, но только в компоненте и с комментарием, зачем это сделано. В будущем часть задачи закроет `text-box-trim`, но на момент статьи поддержка ограничена, поэтому нужен fallback.

### Spacing scale и вертикальный ритм

**Spacing scale** — набор отступов, связанных шагом. База почти всегда **4 px**, крупные шаги — кратны **8 px**:

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
}
```

Правила, которые экономят годы:

1. **Не смешивайте 4- и 8-базовые шкалы произвольно.** 12 px и 20 px — нормальные промежуточные шаги, 13 px и 19 px — случайность.
2. **Используйте `gap`, а не margin между элементами.** Гораздо меньше схлопываний и «последний элемент с лишним отступом».
3. **Отступы задавайте логическими свойствами.** `padding-inline`, `margin-block`, `inset-inline-start` — и RTL не потребует переписывать CSS.
4. **Не кодируйте смысл в номер токена.** `--space-6` честнее, чем `--space-large`, потому что «large» меняется от контекста.

**Вертикальный ритм** — это согласованность шага по вертикали. Практически он держится на трёх вещах:

- единый `line-height` основного текста;
- spacing-токены, кратные базовому шагу;
- одинаковые правила для заголовков, списков, цитат, медиа и форм.

```css
.flow > * + * {
  margin-block-start: var(--flow-space, var(--space-4));
}

.prose {
  --flow-space: var(--space-4);
  line-height: 1.6;
}

.prose h2 {
  --flow-space: var(--space-10);
  line-height: 1.25;
  margin-block-end: var(--space-3);
}
```

`line-height` задавайте **безразмерным** (`1.6`, а не `25.6px`): тогда он масштабируется вместе с размером шрифта и не ломается при изменении типа.

Отдельно стоит помнить про **оптический ритм**: математически равные отступы не всегда выглядят равными. Заголовок с большой `line-height` имеет «воздух» внутри строки, поэтому `margin-top` можно уменьшить. Но такие правки должны быть исключением с комментарием, а не способом вести вёрстку.

### Цветовые пространства: sRGB, P3, oklch

Большинство hex-цветов живут в **sRGB** — безопасном, но ограниченном пространстве. Современные экраны умеют **Display P3**, который шире и даёт более насыщенные цвета.

```css
/* Fallback в sRGB */
.brand {
  background: #0b57d0;
}

/* Более насыщенный вариант для P3-экранов */
@media (color-gamut: p3) {
  .brand {
    background: color(display-p3 0.02 0.32 0.85);
  }
}
```

Проблема HSL и hex в том, что они не perceptual: изменение lightness в HSL может неожиданно менять воспринимаемую яркость и насыщенность. **`oklch()`** решает это:

```css
:root {
  --color-accent: oklch(0.55 0.19 255);
  --color-accent-hover: oklch(0.5 0.2 255);
  --color-accent-subtle: oklch(0.95 0.03 255);
}
```

Где:

- `L` — воспринимаемая светлота, 0–1 (или 0%–100%);
- `C` — chroma, насыщенность;
- `H` — hue, угол 0–360.

Преимущества:

- **Предсказуемые шкалы.** Меняя только `L`, вы получаете ряд от светлого к тёмному без скачков оттенка.
- **Удобные состояния.** Hover — это чуть меньше `L`, disabled — меньше `C`, subtle-фон — высокий `L` и низкий `C`.
- **P3-диапазон.** `oklch` может описывать цвета вне sRGB; на неподдерживающих экранах браузер сделает gamut mapping.
- **`color-mix()`** работает в `oklch` и даёт предсказуемые смеси.

```css
.button {
  --button-bg: var(--color-accent);
  background: var(--button-bg);
  color: white;
  transition: background-color 150ms ease;
}

.button:hover {
  --button-bg: color-mix(in oklch, var(--color-accent), black 12%);
}

.button:active {
  --button-bg: color-mix(in oklch, var(--color-accent), black 20%);
}
```

Важно: **`oklch` не гарантирует контраст**. WCAG считает контраст по относительной яркости sRGB, а не по `L` в OKLCH. Два цвета с одинаковой разницей `L` могут иметь разный коэффициент контраста. Поэтому палитру всё равно проверяют инструментом.

`color-mix()` и `oklch()` широко доступны с 2023 года, `color(display-p3 …)` требует проверки через `@media (color-gamut: p3)`. Для старых браузеров всегда оставляйте fallback в sRGB.

### Семантические токены и цветовые роли

Палитра — это не набор красивых значений, а **роли**. Минимальный набор для продукта:

| Роль | Назначение | Пример токена |
|---|---|---|
| Background | Фон страницы | `--color-bg` |
| Surface | Карточки, панели, поповеры | `--color-surface` |
| Surface raised | Модалки, dropdown | `--color-surface-raised` |
| Text | Основной текст | `--color-text` |
| Text muted | Подписи, hints | `--color-text-muted` |
| Border | Границы и разделители | `--color-border` |
| Border strong | Границы полей, фокус | `--color-border-strong` |
| Accent | Основное действие | `--color-accent` |
| Accent hover | Hover/active | `--color-accent-hover` |
| Focus | Фокус-индикатор | `--color-focus` |
| Danger | Ошибки | `--color-danger` |
| Success | Успех | `--color-success` |
| Warning | Предупреждение | `--color-warning` |
| Info | Нейтральная информация | `--color-info` |

Уровни токенов:

```css
:root {
  /* Primitive */
  --blue-500: oklch(0.55 0.19 255);
  --blue-600: oklch(0.5 0.2 255);
  --gray-50: oklch(0.98 0.005 255);
  --gray-900: oklch(0.2 0.01 255);

  /* Semantic */
  --color-bg: var(--gray-50);
  --color-surface: white;
  --color-text: var(--gray-900);
  --color-text-muted: oklch(0.5 0.01 255);
  --color-accent: var(--blue-500);
  --color-accent-hover: var(--blue-600);
  --color-focus: var(--blue-600);

  /* Component */
  --button-primary-bg: var(--color-accent);
  --button-primary-bg-hover: var(--color-accent-hover);
}
```

Почему компоненты не должны ссылаться на primitive напрямую:

- **Тема.** В dark mode `--color-surface` станет тёмным, а `--blue-500` останется тем же — компонент сломается.
- **Бренд.** Смена бренда — это замена primitive и маппинга semantic, а не правка каждого компонента.
- **Смысл.** `--color-danger` читается в code review лучше, чем `--red-500`.

Отдельно про **hover**: в светлой теме hover обычно темнее, в тёмной — светлее. Если считать hover через `color-mix(..., black)`, в dark mode он станет почти невидимым. Поэтому для тем либо задают отдельные semantic-токены, либо используют relative color syntax с условием темы:

```css
:root {
  --color-accent-hover: oklch(from var(--color-accent) calc(l - 0.06) c h);
}

[data-theme='dark'] {
  --color-accent-hover: oklch(from var(--color-accent) calc(l + 0.06) c h);
}
```

Relative color syntax поддержана в свежих браузерах; если нужна широкая поддержка, задайте hover-токены явно для каждой темы.

### Контраст: WCAG, APCA и бренд

**WCAG 2.2** требует:

- обычный текст — **4.5:1**;
- крупный текст (≥24 px или ≥19 px bold) — **3:1**;
- нетекстовые элементы: иконки, границы полей, состояния — **3:1**;
- фокус-индикатор — видимый и контрастный (2.4.7 AA; усиленные требования — 2.4.13 AAA).

Контраст считается по формуле:

```text
(L1 + 0.05) / (L2 + 0.05)
```

где `L` — относительная яркость sRGB-цвета. Поэтому проверять нужно **реальные пары**: текст на фоне, текст на градиенте, текст на изображении, иконку на кнопке, границу поля на фоне.

**APCA** (Accessible Perceptual Contrast Algorithm) — кандидат для WCAG 3. Она учитывает воспринимаемый контраст, размер и вес шрифта, но **не является нормативным требованием WCAG 2.2**. Практический подход: WCAG — обязательный минимум, APCA — дополнительная проверка для крупной типографики и брендовых цветов.

Что делать, если бренд не проходит:

1. **Не менять hue вслепую.** Сначала попробуйте изменить `L` в `oklch` — часто достаточно −0.05…−0.1.
2. **Не добавлять обводку как единственное решение.** Контур вокруг текста ухудшает читаемость и не решает проблему.
3. **Разделить роли.** Яркий брендовый цвет может остаться акцентом для крупных элементов, а текстовая версия — более тёмной.
4. **Проверить состояния.** Hover, active, disabled, focus и visited должны оставаться различимыми.
5. **Проверить обе темы.** Тёмная тема — не инверсия: контраст и насыщенность ведут себя иначе.

Инструменты: WebAIM Contrast Checker, DevTools color picker (показывает ratio), Polypane, axe, Stark. APCA-калькуляторы — дополнительно.

### Dark mode без FOUC

**FOUC** (flash of unstyled content) в теме выглядит как вспышка светлого экрана перед тёмным. Причины:

1. Тема определяется в JS после первой отрисовки.
2. CSS загружается позже, чем HTML.
3. Тема хранится в `localStorage`, но читается уже после paint.

Правильная схема:

```html
<!doctype html>
<html lang="ru" data-theme="light">
  <head>
    <meta name="color-scheme" content="light dark">
    <script>
      // Блокирующий inline-скрипт: выполняется до первой отрисовки
      (function () {
        try {
          const saved = localStorage.getItem('theme');
          const system = matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          document.documentElement.dataset.theme = saved || system;
        } catch {
          document.documentElement.dataset.theme = 'light';
        }
      })();
    </script>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>...</body>
</html>
```

```css
:root {
  color-scheme: light;
  --color-bg: oklch(0.98 0.005 255);
  --color-surface: white;
  --color-text: oklch(0.2 0.01 255);
}

[data-theme='dark'] {
  color-scheme: dark;
  --color-bg: oklch(0.18 0.01 255);
  --color-surface: oklch(0.23 0.012 255);
  --color-text: oklch(0.94 0.005 255);
}

/* Системная тема — если пользователь ещё не выбрал вручную */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --color-bg: oklch(0.18 0.01 255);
    --color-surface: oklch(0.23 0.012 255);
    --color-text: oklch(0.94 0.005 255);
  }
}
```

Почему `color-scheme` важен:

- браузер сразу рисует правильный фон, скроллбары и контролы форм;
- `light-dark()` начинает работать корректно;
- уменьшается вероятность белой вспышки до применения CSS.

`light-dark()` — удобный способ описать пару цветов без дублирования селекторов:

```css
:root {
  color-scheme: light dark;
  --color-bg: light-dark(oklch(0.98 0.005 255), oklch(0.18 0.01 255));
  --color-text: light-dark(oklch(0.2 0.01 255), oklch(0.94 0.005 255));
}
```

Но у `light-dark()` есть нюанс: он следует **used color scheme**, а не только системной настройке. Если пользователь выбрал тему вручную, переключите `color-scheme` на `dark` или `light` у `[data-theme]` — иначе функция продолжит следовать системе. Поэтому на практике часто комбинируют: `light-dark()` для простых пар, `data-theme` — для ручного выбора и сложных компонентов.

**Тени в dark mode.** Тень на тёмном фоне почти не видна. Elevation строят иначе:

- светлее поверхность (`surface-raised` в dark mode светлее `surface`, а не темнее);
- добавляют тонкую границу;
- уменьшают blur и opacity тени;
- используют `box-shadow` + `border` вместе.

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

[data-theme='dark'] .card {
  border-color: oklch(1 0 0 / 0.08);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
}
```

### Доступность цвета: не только оттенок

Цвет — мощный, но ненадёжный канал: около 8% мужчин имеют ту или иную форму дальтонизма, а на ярком солнце или плохом экране различность падает у всех.

Правила:

1. **Не передавайте смысл только цветом.** Ошибка — текст + иконка + `aria-invalid`, успех — текст + галочка, выбранный пункт — `aria-selected` + визуальный маркер.
2. **Сохраняйте контраст состояний.** Hover и active не должны делать текст нечитаемым; disabled может быть менее контрастным, но оставаться понятным.
3. **Проверяйте границы.** Поля форм, чекбоксы и разделители — 3:1 к фону.
4. **Не полагайтесь на красный/зелёный.** Используйте иконки, паттерны, подписи.
5. **Поддерживайте `prefers-contrast: more`.** Усиливайте границы, убирайте полупрозрачность.
6. **Проверяйте forced-colors.** В Windows High Contrast фоны и тени исчезают; состояния должны держаться на границах и системных цветах.

```css
@media (prefers-contrast: more) {
  :root {
    --color-border: oklch(0.45 0.01 255);
    --color-text-muted: oklch(0.35 0.01 255);
  }

  .card {
    border-width: 2px;
  }
}

@media (forced-colors: active) {
  .badge {
    border: 1px solid CanvasText;
  }
}
```

**Фокус-кольцо** — часть цветовой системы. Оно должно быть видимым на любом фоне:

```css
:root {
  --color-focus: oklch(0.55 0.19 255);
  --focus-ring: 2px solid var(--color-focus);
  --focus-offset: 2px;
}

:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
```

На цветных кнопках иногда нужен двойной индикатор: внутреннее светлое кольцо + внешнее тёмное. Это допустимо, если не превращается в декоративную обводку.

## Практические примеры

### Пример 1. Fluid-шкала, measure и аккуратные переносы

```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-size-100: 0.75rem;
  --font-size-200: 0.875rem;
  --font-size-300: 1rem;
  --font-size-400: 1.125rem;
  --font-size-500: 1.375rem;
  --font-size-600: 1.75rem;
  --font-size-700: 2.125rem;
  --font-size-800: 2.75rem;

  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.6;

  --measure: 68ch;
  --measure-narrow: 52ch;
}

body {
  font-family: var(--font-sans);
  font-size: var(--font-size-300);
  line-height: var(--leading-normal);
  color: var(--color-text);
  background: var(--color-bg);
}

.prose {
  max-inline-size: var(--measure);
  margin-inline: auto;
  padding-inline: var(--space-4);
}

.prose > * + * {
  margin-block-start: var(--space-4);
}

h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 3.25rem);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
  text-wrap: balance;
}

h2 {
  font-size: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  line-height: var(--leading-snug);
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.prose p {
  text-wrap: pretty;
  hyphens: auto;
}

.prose blockquote {
  max-inline-size: var(--measure-narrow);
  margin-inline: 0;
  padding-inline-start: var(--space-4);
  border-inline-start: 3px solid var(--color-border-strong);
  font-size: var(--font-size-400);
  color: var(--color-text-muted);
}
```

Почему так:

- заголовки текучие, но ограничены `rem`-минимумом и максимумом;
- measure задан в `ch`, а не в пикселях;
- `text-wrap: balance` только на заголовках, `pretty` — на абзацах;
- `hyphens: auto` требует корректного `lang` на `<html>`;
- логические свойства (`max-inline-size`, `padding-inline-start`) работают в RTL.

### Пример 2. Семантическая палитра в oklch и color-mix

```css
:root {
  /* Primitive: одна hue-линия для бренда */
  --brand-100: oklch(0.96 0.03 255);
  --brand-300: oklch(0.78 0.11 255);
  --brand-500: oklch(0.58 0.18 255);
  --brand-600: oklch(0.52 0.19 255);
  --brand-700: oklch(0.46 0.18 255);

  /* Neutral */
  --neutral-0: oklch(1 0 0);
  --neutral-50: oklch(0.98 0.004 255);
  --neutral-200: oklch(0.9 0.008 255);
  --neutral-500: oklch(0.55 0.012 255);
  --neutral-800: oklch(0.28 0.012 255);
  --neutral-900: oklch(0.2 0.01 255);

  /* Semantic */
  --color-bg: var(--neutral-50);
  --color-surface: var(--neutral-0);
  --color-surface-raised: var(--neutral-0);
  --color-text: var(--neutral-900);
  --color-text-muted: var(--neutral-500);
  --color-border: var(--neutral-200);
  --color-border-strong: oklch(0.72 0.01 255);

  --color-accent: var(--brand-500);
  --color-accent-hover: var(--brand-600);
  --color-accent-active: var(--brand-700);
  --color-accent-subtle: var(--brand-100);

  --color-focus: var(--brand-600);

  --color-danger: oklch(0.55 0.2 25);
  --color-success: oklch(0.52 0.14 155);
  --color-warning: oklch(0.62 0.14 75);
  --color-info: oklch(0.55 0.14 240);
}

.button--primary {
  background: var(--color-accent);
  color: var(--neutral-0);
  border: 1px solid transparent;
}

.button--primary:hover {
  background: var(--color-accent-hover);
}

.button--primary:active {
  background: var(--color-accent-active);
}

.button--primary:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.badge--danger {
  background: color-mix(in oklch, var(--color-danger), white 88%);
  color: color-mix(in oklch, var(--color-danger), black 35%);
  border: 1px solid color-mix(in oklch, var(--color-danger), white 60%);
}
```

Проверка:

- текстовые пары (`text` на `bg`, `text-muted` на `surface`, белый на `accent`) прогнать через контраст-чекер;
- `badge` — не только цвет: добавить иконку и текст;
- `accent` в качестве фона кнопки должен давать 4.5:1 с белым текстом; если нет — затемнить `brand-500` или использовать тёмный текст;
- hover/active не должны терять контраст.

### Пример 3. Dark mode без FOUC и с ручным переключением

```html
<script>
  (function () {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');

    if (saved === 'light' || saved === 'dark') {
      root.dataset.theme = saved;
      return;
    }

    root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  })();
</script>
```

```js
const root = document.documentElement;

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = theme;
}

document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

// Следим за системной темой, пока пользователь не выбрал вручную
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!localStorage.getItem('theme')) {
    root.dataset.theme = event.matches ? 'dark' : 'light';
  }
});
```

```css
:root {
  color-scheme: light;
  --color-bg: oklch(0.98 0.004 255);
  --color-surface: oklch(1 0 0);
  --color-text: oklch(0.2 0.01 255);
  --color-border: oklch(0.9 0.008 255);
}

[data-theme='dark'] {
  color-scheme: dark;
  --color-bg: oklch(0.18 0.01 255);
  --color-surface: oklch(0.23 0.012 255);
  --color-surface-raised: oklch(0.27 0.014 255);
  --color-text: oklch(0.94 0.005 255);
  --color-border: oklch(0.34 0.012 255);
}

/* Контролы форм и скроллбары получают правильную схему */
input,
select,
textarea {
  color-scheme: inherit;
}
```

Что проверять:

- при первой загрузке нет вспышки светлой темы;
- при `localStorage`, недоступном в приватном режиме, скрипт не падает;
- ручной выбор переживает перезагрузку;
- системная тема подхватывается, пока выбора нет;
- `color-scheme` обновляется вместе с темой, иначе нативные контролы останутся светлыми;
- контраст проверен в обеих темах, а не только в светлой.

### Пример 4. Таблица и числа: tabular-nums, выравнивание и обрезка

```css
.table {
  inline-size: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.table th {
  font-size: var(--font-size-200);
  font-weight: 600;
  text-align: start;
  color: var(--color-text-muted);
  padding-block: var(--space-2);
  border-block-end: 1px solid var(--color-border);
}

.table td {
  padding-block: var(--space-3);
  border-block-end: 1px solid var(--color-border);
}

.table .num {
  text-align: end;
  white-space: nowrap;
}

.table .name {
  max-inline-size: 32ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  font-variant-numeric: tabular-nums slashed-zero;
}

/* В тёмной теме границы должны быть видны */
[data-theme='dark'] .table th,
[data-theme='dark'] .table td {
  border-color: var(--color-border);
}
```

Дополнительно:

- числа выравнивают по правому краю (или по десятичной точке), текст — по левому;
- `tabular-nums` обязателен, если значения обновляются в реальном времени;
- обрезанное имя должно иметь `title` или раскрытие, если оно несёт смысл;
- заголовки таблицы связаны с ячейками через `<th scope>`, а не только визуально;
- на мобильном таблица либо скроллится в контейнере с `overflow-x: auto`, либо превращается в карточки.

### Пример 5. Статусный бейдж, который не держится на цвете

```html
<p class="status status--error" role="status">
  <svg class="status__icon" aria-hidden="true" focusable="false">
    <use href="#icon-error" />
  </svg>
  <span>Не удалось сохранить изменения</span>
</p>
```

```css
.status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid;
  border-radius: 6px;
  font-size: var(--font-size-200);
  line-height: 1.4;
}

.status--error {
  --status-color: var(--color-danger);
  color: color-mix(in oklch, var(--status-color), black 30%);
  background: color-mix(in oklch, var(--status-color), white 90%);
  border-color: color-mix(in oklch, var(--status-color), white 60%);
}

.status--success {
  --status-color: var(--color-success);
  color: color-mix(in oklch, var(--status-color), black 32%);
  background: color-mix(in oklch, var(--status-color), white 90%);
  border-color: color-mix(in oklch, var(--status-color), white 60%);
}

.status__icon {
  inline-size: 16px;
  block-size: 16px;
  flex: none;
}

@media (prefers-contrast: more) {
  .status {
    border-width: 2px;
  }

  .status--error,
  .status--success {
    background: var(--color-surface);
    color: var(--color-text);
  }
}
```

Почему так:

- смысл передаётся текстом и иконкой, цвет — только усиливает;
- `role="status"` объявляет изменение скринридеру, если сообщение появляется динамически;
- в `prefers-contrast: more` убирается низкоконтрастный фон;
- цветовая пара проверена в обеих темах;
- иконка декоративная и скрыта от дерева доступности, потому что текст уже всё объясняет.

## Типичные ошибки и антипаттерны

- **Шкала «на глаз».** Размеры 15, 17, 23 и 27 px без системы. Иерархия читается плохо, а поддержка превращается в археологию.
- **`font-size` в пикселях для основного текста.** Ломает пользовательское увеличение шрифта; используйте `rem`.
- **`html { font-size: 62.5% }` как обязательный приём.** Удобно для расчётов, но меняет базу и может конфликтовать с настройками пользователя; современный подход — `1rem = 16px` и `rem`-токены.
- **Fluid type без `rem` в формуле.** `clamp(1rem, 4vw, 2rem)` игнорирует пользовательский размер шрифта.
- **Fluid-абсолютно-всё.** Каждый отступ и размер текут, макет теряет устойчивость, визуальная регрессия шумит.
- **Measure в пикселях.** При смене шрифта строка становится нечитаемой; используйте `ch` и `max-inline-size`.
- **`text-wrap: balance` на длинных абзацах.** Эффект ограничен числом строк и не заменяет нормальную ширину текста.
- **Переносы без `lang`.** `hyphens: auto` не работает или переносит неверно.
- **`line-height` в пикселях.** Не масштабируется и ломает ритм при изменении размера.
- **Случайные отступы.** 13 px, 19 px, 27 px вместо spacing-шкалы; интерфейс выглядит неаккуратно.
- **Margin вместо `gap`.** Схлопывание, лишние отступы у последнего элемента, сложная отладка.
- **Hex на каждом компоненте.** Смена темы или бренда требует правок по всему проекту.
- **Компоненты ссылаются на primitive.** В dark mode `--blue-500` не адаптируется, и кнопка теряет контраст.
- **Dark mode как инверсия.** Тени исчезают, насыщенные цвета «светятся», контраст падает.
- **Тема применяется после paint.** Вспышка светлого экрана — классический FOUC.
- **`light-dark()` без `color-scheme`.** Функция не переключается или следует не той теме.
- **Смысл только цветом.** Красная рамка без текста, зелёная точка без подписи, серый disabled без `disabled`.
- **Проверка контраста только для основного текста.** Hover, placeholder, disabled, границы и фокус остаются вне проверки.
- **APCA как замена WCAG.** APCA — кандидат для WCAG 3, а не действующее требование; для AA нужен WCAG-контраст.
- **`oklch` как гарантия контраста.** Воспринимаемая светлота не равна относительной яркости sRGB.
- **Обводка текста вместо контраста.** Контур ухудшает читаемость и не решает проблему.
- **Глобальный `transition` на цвет.** Может анимировать сотни элементов и мешать `prefers-reduced-motion`; ограничивайте конкретными компонентами.

## Ключевые тезисы для интервью

- **Типографика — это система, а не набор размеров.** База, коэффициент, числовые токены, line-height, tracking и measure.
- **Шкала 1.125–1.25 покрывает большинство UI.** Плотные интерфейсы — меньше шаг, лендинги — больше; display требует отрицательного tracking.
- **Measure 45–75 символов.** Задаётся в `ch` через `max-inline-size`, а не фиксированной шириной.
- **Fluid type — для крупного текста.** `clamp(min, rem + vw, max)` сохраняет пользовательский масштаб и адаптивность; мелкий текст оставляют предсказуемым.
- **`text-wrap: balance` — заголовки, `pretty` — абзацы.** Оба — прогрессивное улучшение, не замена хорошей ширине строки.
- **Spacing-шкала на 4/8 px и `gap`.** Логические свойства, безразмерный `line-height`, единый вертикальный ритм.
- **Семантика важнее primitive.** Компоненты используют `--color-surface`, `--color-text`, `--color-danger`, а не `--blue-500`.
- **`oklch` — perceptual-пространство.** Удобно для шкал, состояний и `color-mix`, но контраст всё равно проверяется по WCAG.
- **WCAG-контраст — обязательный минимум.** 4.5:1 текст, 3:1 крупный текст и нетекстовые элементы; APCA — дополнительная проверка.
- **Dark mode — отдельная палитра.** Светлее поверхности, тоньше границы, аккуратнее тени; `color-scheme` + `data-theme` + inline-скрипт.
- **FOUC лечится до paint.** Блокирующий inline-скрипт, `color-scheme`, правильные токены и отсутствие зависимости от JS-фреймворка.
- **Цвет не единственный канал.** Иконки, текст, паттерны, `aria-*`, `prefers-contrast` и forced-colors.
- **Токены — контракт с дизайном.** Если значение приходится «подбирать» в компоненте, в системе не хватает роли.

## Практическое задание и code review-чеклист

### Задание: мини-типографика и палитра для дизайн-системы

Соберите небольшой набор токенов и проверьте его на реальной странице.

**1. Типографика.**

- Выберите коэффициент (1.125, 1.2 или 1.25) и постройте шкалу от 12 до 48 px.
- Определите line-height и tracking для display, h1–h3, body, small, caption.
- Сделайте fluid-вариант для h1 и h2, но не для body.
- Задайте measure 68ch для статьи и 52ch для цитаты.
- Подключите `text-wrap: balance` для заголовков и `pretty` для абзацев.
- Проверьте страницу при 200% zoom и на ширине 320 px.

**2. Отступы.**

- Постройте spacing-шкалу 4/8/12/16/24/32/48/64.
- Соберите секцию через `gap` и `flow`, без случайных margin.
- Проверьте, что заголовок, список, цитата, таблица и форма выглядят ритмично.

**3. Цвет.**

- Соберите primitive-палитру в `oklch`: brand, neutral, danger, success, warning, info.
- Определите semantic-токены: bg, surface, surface-raised, text, text-muted, border, accent, focus.
- Проверьте контраст всех текстовых пар и границ в светлой и тёмной темах.
- Сделайте hover/active через `color-mix` или отдельные токены.
- Реализуйте dark mode с `data-theme`, `color-scheme` и inline-скриптом без вспышки.
- Проверьте `prefers-contrast: more` и forced-colors.

**4. Компонент.**

- Соберите badge или alert, где смысл передаётся текстом и иконкой, а цвет — вспомогательный.
- Убедитесь, что фокус-кольцо видно на всех фонах.
- Проверьте, что disabled-состояние не держится только на прозрачности.

**Критерии оценки:**

- нет hex и магических размеров в компонентах;
- шкала и отступы объяснимы одним предложением;
- контраст проверен инструментом, а не «на глаз»;
- обе темы выглядят как одна система;
- нет FOUC при первой загрузке;
- на 200% zoom ничего не обрезается и не наезжает.

### Чек-лист code review

- [ ] Размеры шрифта берутся из шкалы, а не вводятся в компоненте.
- [ ] Основной текст в `rem`, пользовательское увеличение не ломается.
- [ ] Line-height безразмерный; measure ограничен 45–75ch.
- [ ] Fluid type использует `clamp()` с `rem` в предпочтительном значении.
- [ ] Заголовки имеют `text-wrap: balance`, абзацы — `pretty` или ничего.
- [ ] `hyphens: auto` используется только при корректном `lang`.
- [ ] Числа в таблицах и ценах — `tabular-nums`.
- [ ] Отступы берутся из spacing-шкалы; между элементами — `gap`.
- [ ] Используются логические свойства (`margin-block`, `padding-inline`).
- [ ] Цветовые токены семантические; компоненты не ссылаются на primitive напрямую.
- [ ] Палитра описана в `oklch` или другом предсказуемом пространстве, есть sRGB-fallback.
- [ ] Контраст текста 4.5:1, крупного текста и границ — 3:1, проверены обе темы.
- [ ] Hover/active/disabled/focus проверены отдельно, а не только базовое состояние.
- [ ] Смысл не передаётся только цветом: есть текст, иконка или паттерн.
- [ ] Фокус-индикатор видим на всех фонах и не перекрывается sticky-элементами.
- [ ] Dark mode использует отдельную палитру, а не инверсию.
- [ ] `color-scheme` выставлен; тема применяется до первой отрисовки.
- [ ] `prefers-contrast: more` и forced-colors не ломают интерфейс.
- [ ] Нет вспышки темы при первой загрузке и при переключении.
- [ ] Визуальная регрессия покрывает светлую и тёмную темы.

## Заключение

Типографика, цвет и ритм — это не «последний полишинг», а фундамент восприятия. Type scale задаёт иерархию, spacing-шкала — спокойствие, палитра — смысл и состояние. Когда эти три слоя описаны токенами и ролями, интерфейс остаётся цельным при смене темы, бренда и платформы, а не разваливается на набор локальных решений.

Для UI Engineer важно уметь объяснить каждое значение: почему заголовок именно такого размера, почему строка ограничена 68ch, почему hover темнее, а в тёмной теме — светлее, почему брендовый цвет не прошёл контраст и что с этим делать. Система, которую можно объяснить, легче поддерживается и убедительнее звучит на собеседовании.

Следующий шаг — [Изображения, шрифты и медиа](./images-and-fonts.md): загрузка шрифтов, `srcset`, LCP и CLS, то есть производительность той самой визуальной системы.

## Полезные ссылки

- [MDN: CSS fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts)
- [MDN: `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [MDN: `text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)
- [MDN: `font-variant-numeric`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)
- [MDN: `<color>` и `oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN: `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [MDN: `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [MDN: `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [web.dev: Color and contrast](https://web.dev/learn/accessibility/color-contrast)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [APCA: описание алгоритма](https://git.apcacontrast.com/documentation/APCAeasyIntro)
- [W3C: WCAG 2.2 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [Practical Typography: Type scale](https://practicaltypography.com/type-scale.html)
- [Utopia: Fluid type scale calculator](https://utopia.fyi/type/calculator/)
- [Modern Font Stacks](https://modernfontstacks.com/)
