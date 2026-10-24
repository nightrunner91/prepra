---
title: "Анимации и motion-система: от CSS до View Transitions"
section: html-css
description: "Как проектировать движение в интерфейсе: motion-токены и easing, CSS-переходы с @starting-style и allow-discrete, FLIP, View Transitions, Web Animations API, GSAP, производительность и prefers-reduced-motion."
order: 12
tags: ["animation", "motion", "motion-tokens", "css-transitions", "css-animations", "starting-style", "web-animations-api", "flip", "view-transitions", "scroll-driven", "gsap", "prefers-reduced-motion", "performance"]
questions:
  - "Почему анимация лагает и как это диагностировать?"
  - "Чем FLIP отличается от View Transitions API?"
  - "Как уважать `prefers-reduced-motion`, не ломая UX?"
  - "Как построить motion-систему для дизайн-системы?"
  - "Чем CSS `transition` отличается от `animation` и когда что выбирать?"
  - "Что такое `@starting-style` и зачем `transition-behavior: allow-discrete`?"
  - "Как анимировать перестановку элементов списка без библиотеки?"
  - "Когда нужен Web Animations API, а когда GSAP?"
  - "Что такое scroll-driven animations и какие у них ограничения?"
  - "Как тестировать анимации и не делать тесты флаки?"
answers:
  - "Анимация лагает, когда она выполняется на main thread и вызывает layout или paint: `width`/`height`/`top`/`margin`, `box-shadow`, дорогой `filter`. Диагностика: DevTools Performance — записать взаимодействие, найти кадры длиннее 16,7 мс (8,3 мс на 120 Гц), длинные задачи и фазы Recalculate Style/Layout/Paint, а Long Animation Frames API покажет длительность кадра и виновные скрипты. Лечение — анимировать `transform`/`opacity`/`translate`, убирать синхронные чтения геометрии, разгружать JS и проверять на CPU throttling."
  - "FLIP — техника: измерить начальную позицию (First), изменить DOM, измерить конечную (Last), применить инвертированный `transform` (Invert) и анимировать его к нулю (Play); она работает с живым DOM и даёт полный контроль из JS. View Transitions API снимает снапшоты старого и нового состояния и анимирует псевдоэлементы `::view-transition-old/new`, включая кросс-документные переходы, но промежуточными состояниями управляет хуже и требует уникальных `view-transition-name`. FLIP выбирают для перестановки элементов внутри страницы, View Transitions — для смены страниц и крупных состояний."
  - "Нужно не отключать всё, а убирать движение: заменить смещение и масштабирование на fade или мгновенную смену, убрать параллакс, автоповторы и большие дистанции, сократить длительность. Смысловые индикаторы — загрузку, прогресс, валидацию — оставляют, иначе интерфейс перестаёт сообщать о состоянии. Токены движения переключают через `@media (prefers-reduced-motion: reduce)`, а глобальный `animation-duration: 0.01ms !important` ломает всё сразу."
  - "В системе три уровня: primitive (duration, easing, distance), semantic (enter, exit, emphasis, stagger) и component. Значения экспортируются в CSS custom properties и в TS, а вместе с ними фиксируются правила: exit быстрее enter, длительность растёт с дистанцией и площадью, на экране один акцент, reduced-motion варианты обязательны. Систему дополняют документацией в Storybook, примерами и линтом, который запрещает `transition: all` и сырые `cubic-bezier` в компонентах."
  - "`transition` интерполирует между двумя computed-состояниями и запускается только при их изменении, а при прерывании умеет плавно разворачиваться; `animation` проигрывает `@keyframes` независимо от состояния и поддерживает циклы, задержки, `fill-mode` и многошаговые сценарии. Для hover, focus, open и других смен состояния берут `transition`, для индикаторов, циклов и хореографии — `animation`."
  - "`@starting-style` задаёт стартовые значения для элемента, который только что появился или вышел из `display: none`: без него браузер не видит предыдущего состояния и переход не запускается. `transition-behavior: allow-discrete` разрешает переход дискретных свойств (`display`, `overlay`, `content-visibility`), поэтому элемент остаётся отрендеренным до конца exit-анимации. `@starting-style` — Baseline 2024, а `allow-discrete` поддержан не везде, поэтому его подключают через `@supports`, иначе невалидной станет вся shorthand-декларация."
  - "Нужно сделать FLIP: измерить позиции до изменения, переставить DOM, измерить после, применить `transform: translate(dx, dy)` и анимировать к нулю через WAAPI. Перед замерами отменяют текущие анимации и читают все `getBoundingClientRect()` до записи, иначе получится layout thrashing; при reduced motion перестановка происходит мгновенно. Во Vue FLIP делает `TransitionGroup`, в React для этого есть layout-анимации в Motion."
  - "WAAPI нужен, когда анимацией управляет код: запуск по событию, пауза, отмена, `finished`, изменение `playbackRate`, синхронизация нескольких анимаций. GSAP берут для сложной хореографии — таймлайны с точными позициями, stagger, ScrollTrigger, Flip, SVG morph и drag; цена — вес бандла и обязательный cleanup. Типовые enter/exit закрывает CSS, простые императивные сценарии — WAAPI."
  - "Scroll-driven animations привязывают прогресс `animation` к прокрутке через `animation-timeline: scroll()` или `view()` и `animation-range`, выполняясь на compositor без scroll-обработчиков. Поддержка на момент статьи неполная, поэтому нужен `@supports` и fallback через IntersectionObserver. Анимировать стоит только compositor-свойства, а при reduced motion эффект отключают."
  - "Скриншоты снимают с `animations: 'disabled'` и `reducedMotion: 'reduce'`, а завершение ждут через `document.getAnimations()` и `animation.finished`, а не через `sleep`. Юнит-тесты проверяют состояние и классы, а не кадры; в Storybook анимацию останавливают в конце. Тайминги на CI нестабильны, поэтому измерения jank выносят в отдельный performance-прогон."
---

# Анимации и motion-система: от CSS до View Transitions

Анимация — это не украшение, а способ объяснить интерфейс: откуда пришёл элемент, что изменилось, куда нажать и почему действие не сработало. Хорошее движение делает продукт понятнее и быстрее, плохое — превращает его в слайд-шоу с задержками, вызывает укачивание и ломает восприятие скорости.

UI Engineer отвечает за движение целиком: от токенов и таймингов до реализации, производительности и доступности. В этой статье разберём, как устроены CSS-переходы и `@starting-style`, зачем нужны FLIP, View Transitions и Web Animations API, когда оправдан GSAP, как не уронить кадры и как выстроить motion-систему, которую команда сможет переиспользовать.

> Смежные темы: базовая физика рендеринга и `transform`/`opacity` — в [Парсинг HTML, критический путь рендеринга и производительность CSS](./html-rendering-pipeline.md), Vue-специфика — в [Transition и TransitionGroup](../vue/transitions.md), доступность движения — в [Доступность: WCAG 2.2](./accessibility-wcag.md).

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

### Зачем UI Engineer motion и где он ломается

Движение решает три задачи:

1. **Ориентация.** Пользователь понимает, что элемент появился из кнопки, а не возник из ниоткуда; что панель уехала вправо, потому что её закрыли, а не потерялась.
2. **Обратная связь.** Кнопка нажалась, запрос ушёл, данные загрузились, ошибка появилась — всё это состояние, а не только декор.
3. **Иерархия.** Акцентная анимация показывает, куда смотреть: новый тост, изменившаяся цена, подтверждение действия.

Ломается движение предсказуемо:

- **Долго.** Пользователь ждёт 400–600 мс на каждый hover, и интерфейс кажется медленным, даже если сервер отвечает мгновенно.
- **Дёргано.** Анимация `width`, `top` или `box-shadow` пересчитывает layout и paint на каждом кадре; на слабом ноутбуке это видно сразу.
- **Невпопад.** Все элементы въезжают одновременно, с одинаковым easing и одинаковой задержкой — внимание рассеивается.
- **Недоступно.** Параллакс и масштабирование вызывают тошноту у людей с вестибулярными расстройствами, а `prefers-reduced-motion` игнорируется.
- **Хрупко.** Анимация держится на `setTimeout`, который не совпадает с реальной длительностью, и на классе, который кто-то удалил при рефакторинге.

Поэтому motion — это система, а не набор эффектов: токены длительности и easing, правила хореографии, техника реализации под задачу и проверка на производительность и доступность.

### Timing и easing: как движение воспринимается

Длительность и кривая важнее конкретного эффекта. Ощущение «быстро/плавно/дорого» создают именно они.

**Длительность.**

| Диапазон | Для чего | Риск |
|---|---|---|
| 50–100 мс | Микро-обратная связь: нажатие, смена цвета, focus | Почти не читается как движение |
| 150–250 мс | Стандартные enter/exit, hover, tooltip, dropdown | Оптимальная зона для UI |
| 250–400 мс | Панели, drawers, модальные окна, крупные изменения | Начинает ощущаться медленным |
| 400–700 мс | Полноэкранные переходы, storytelling, onboarding | Требует веской причины |
| > 700 мс | Почти всегда ошибка в продуктовом UI | Пользователь ждёт |

Правила, которые работают в большинстве продуктов:

- **Exit быстрее enter.** Уходить должно быть легче, чем приходить: 150 мс на закрытие против 200–250 мс на открытие.
- **Длительность зависит от дистанции и площади.** Маленький tooltip не должен ехать 400 мс; полноэкранная панель не должна телепортироваться за 100 мс.
- **Одна анимация — один смысл.** Если элемент одновременно едет, вращается и меняет цвет, пользователь не понимает, что именно произошло.
- **Stagger — не больше 30–80 мс на элемент.** Длинная лесенка превращает список в карусель и задерживает последний элемент.
- **Общая хореография — до 500 мс.** Если сценарий длиннее, его стоит разбить на этапы или сократить.

**Easing.** Кривая задаёт характер:

| Токен | Кривая | Где использовать |
|---|---|---|
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Универсальное движение внутри экрана |
| `enter` / decelerate | `cubic-bezier(0, 0, 0, 1)` | Появление: быстро стартует, мягко тормозит |
| `exit` / accelerate | `cubic-bezier(0.3, 0, 1, 1)` | Исчезновение: ускоряется и уходит |
| `emphasize` | `cubic-bezier(0.2, 0, 0, 1.2)` | Небольшой overshoot для акцента |
| `linear` | `linear` | Прогресс, спиннер, scroll-driven |

`ease-in-out` из CSS — не универсальный выбор: он медленно стартует, а интерфейсу обычно нужен быстрый отклик и мягкое торможение. Для сложных кривых с несколькими остановками есть `linear()`:

```css
--ease-bounce: linear(
  0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%,
  0.94 16.4%, 1.02 18.9%, 1.045 21.5%, 1.02 24.9%,
  0.98 28.2%, 0.98 30.8%, 1 34.1%, 1 100%
);
```

Для физики «пружины» в CSS/WEB Animations API используют `linear()` или библиотеку; нативный `spring()` в CSS на момент статьи не является широко доступным. GSAP и Motion дают пружины из коробки.

### Motion-токены: примитивы, роли, reduced-motion

Токены движения строятся по той же логике, что и цветовые: **primitive → semantic → component**. Primitive описывает шкалу, semantic — намерение, component — конкретное применение.

```css
:root {
  /* Primitive */
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0, 1);
  --ease-exit: cubic-bezier(0.3, 0, 1, 1);

  --distance-sm: 4px;
  --distance-md: 8px;
  --distance-lg: 16px;

  /* Semantic */
  --motion-enter-duration: var(--duration-200);
  --motion-enter-ease: var(--ease-enter);
  --motion-exit-duration: var(--duration-150);
  --motion-exit-ease: var(--ease-exit);
  --motion-move-duration: var(--duration-300);
  --motion-move-ease: var(--ease-standard);
  --motion-stagger: 40ms;

  /* Component */
  --dialog-enter-duration: var(--motion-enter-duration);
  --dialog-exit-duration: var(--motion-exit-duration);
  --dialog-shift: var(--distance-md);
}
```

Почему не ограничиться `--duration-200` в компонентах:

- **Смена роли не должна требовать правок в каждом компоненте.** Решили, что exit теперь 120 мс — поменяли один semantic-токен.
- **Reduced motion подключается на уровне ролей.** Компоненту не нужно знать про медиазапрос.
- **Дизайнер и разработчик говорят на одном языке.** «Enter 200, exit 150, stagger 40» — это спецификация, а не вкус.

Reduced-motion вариант — не «выключить всё», а «убрать движение, сохранить обратную связь»:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    /* Движение убираем, прозрачность оставляем */
    --distance-sm: 0px;
    --distance-md: 0px;
    --distance-lg: 0px;

    /* Exit можно сделать мгновенным, enter — коротким fade */
    --motion-enter-duration: var(--duration-100);
    --motion-exit-duration: var(--duration-100);
    --motion-move-duration: var(--duration-100);
    --motion-stagger: 0ms;
  }
}
```

Отдельно стоит решить судьбу **циклических** анимаций: спиннер загрузки нельзя просто отключить, иначе пользователь не поймёт, что запрос выполняется. Его замедляют и делают менее агрессивным, а не убирают.

Токены стоит экспортировать не только в CSS, но и в TypeScript — для WAAPI, GSAP и тестов:

```ts
export const motion = {
  duration: { enter: 200, exit: 150, move: 300 },
  ease: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0, 1)',
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;
```

Если значения живут в двух местах, они разъедутся. Поэтому источником истины обычно делают JSON-файл токенов, из которого генерируются CSS custom properties и TS-константы.

### CSS transitions: правила, которые ломают анимацию

`transition` интерполирует значение между двумя состояниями. Он запускается, когда меняется **computed value** свойства, и только если у свойства есть начальное и конечное значение.

```css
.button {
  background-color: var(--color-surface);
  transition:
    background-color var(--motion-enter-duration) var(--motion-enter-ease),
    transform var(--motion-enter-duration) var(--motion-enter-ease);
}

.button:hover {
  background-color: var(--color-surface-hover);
}

.button:active {
  transform: scale(0.98);
}
```

Что важно знать:

- **`transition: all` — почти всегда ошибка.** Он анимирует всё, включая `width`, `height`, `color`, `box-shadow` и случайные свойства от других состояний; это дорого и непредсказуемо. Перечисляйте свойства явно.
- **Переход не запускается на первом рендере.** Элемент сразу получает конечные стили — отсюда `@starting-style` (см. ниже).
- **Переход не запускается при `display: none → block` без `allow-discrete`.** Элемент появляется мгновенно, потому что браузер не видит предыдущего состояния.
- **Прерывание работает хорошо.** Если убрать hover в середине анимации, transition плавно развернётся; это его сильная сторона.
- **`transition` не умеет циклы, задержки между шагами и `fill-mode`.** Для этого нужен `animation`.

Отдельно про **задержку**. `transition-delay` полезен для hover-intent (не открывать меню при случайном проходе мышью), но вреден для отклика на клик: пользователь не должен ждать 200 мс, чтобы увидеть, что кнопка нажалась.

```css
/* Hover-intent: меню открывается с задержкой, закрывается без */
.menu {
  transition: opacity 150ms var(--ease-exit);
}

.menu-trigger:hover + .menu,
.menu:focus-within {
  opacity: 1;
  transition: opacity 200ms var(--ease-enter) 120ms;
}
```

### @starting-style и дискретные свойства

Долгое время появление элемента из `display: none` анимировали хаками: добавляли класс в `requestAnimationFrame`, форсировали reflow, использовали `setTimeout(0)`. Всё это ломалось при быстром монтировании и в SSR.

**`@starting-style`** решает задачу декларативно: задаёт стили, с которых начнётся переход при первом рендере элемента или при выходе из `display: none`.

```css
.toast {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity var(--motion-exit-duration) var(--ease-exit),
    translate var(--motion-exit-duration) var(--ease-exit);
}

@starting-style {
  .toast {
    opacity: 0;
    translate: 0 var(--distance-md);
  }
}
```

Атрибут `hidden`, `display: none` и появление в DOM теперь анимируются без JS-танцев. `@starting-style` — Baseline с августа 2024 года, но в старых браузерах элемент просто появится сразу: это безопасная деградация.

**Дискретные свойства.** `display`, `overlay`, `content-visibility` не имеют промежуточных значений, поэтому по умолчанию не анимируются. `transition-behavior: allow-discrete` разрешает переход: свойство переключается в определённый момент, а остальные свойства анимируются полноценно.

```css
.dialog {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity 200ms var(--ease-exit),
    translate 200ms var(--ease-exit);
}

@supports (transition-behavior: allow-discrete) {
  .dialog {
    transition:
      opacity 200ms var(--ease-exit),
      translate 200ms var(--ease-exit),
      display 200ms allow-discrete;
  }
}

/* Необязательное усиление: удержать элемент в top layer до конца exit */
@supports (overlay: auto) and (transition-behavior: allow-discrete) {
  .dialog {
    transition:
      opacity 200ms var(--ease-exit),
      translate 200ms var(--ease-exit),
      display 200ms allow-discrete,
      overlay 200ms allow-discrete;
  }
}

.dialog:not([open]) {
  opacity: 0;
  translate: 0 var(--distance-md);
}
```

Что здесь происходит:

- `display` удерживает элемент в рендере, пока идёт exit-анимация, и переключается в `none` в конце.
- `overlay` удерживает элемент в top layer, чтобы он не «провалился» под другие слои во время закрытия; это необязательное усиление, потому что поддержка `overlay` уже, чем у `display`.
- `@supports` обязателен: в браузере без поддержки `allow-discrete` вся shorthand-декларация станет невалидной и отбросится целиком, включая opacity и translate. Изолируйте новые значения в отдельное правило, а `overlay` — в ещё одно, иначе неподдержанное свойство сломает переход целиком.

Для нативного `<dialog>` и Popover API этого достаточно: `showModal()` / `showPopover()` добавляют `open` / `:popover-open`, а CSS делает появление и исчезновение плавными. На момент статьи `transition-behavior` поддержан не во всех браузерах (в Firefox частично), поэтому exit-анимация — прогрессивное улучшение, а не обязательное поведение.

### CSS animations и keyframes

`animation` проигрывает `@keyframes` независимо от изменения состояния. Это инструмент для циклов, индикаторов, многошаговых сценариев и эффектов, которые должны запускаться сами.

```css
@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-skeleton);
  }
}
```

Возможности, которых нет у transition:

- **`animation-iteration-count: infinite`** — спиннеры, skeleton, пульсация.
- **`animation-fill-mode`** — сохранить состояние до/после.
- **Несколько keyframe-шагов** — сложная траектория, вращение с паузой, последовательность.
- **`animation-play-state: paused`** — пауза по действию пользователя.
- **`animation-composition`** — сложение анимаций нескольких источников (`replace`, `add`, `accumulate`).

Ограничения:

- **Прерывание менее предсказуемо.** При смене состояния анимация не «разворачивается», а начинается заново или прыгает.
- **Цикл нужно останавливать вручную.** Бесконечная анимация вне viewport всё равно расходует ресурсы.
- **Синхронизация с JS хрупкая.** Не полагайтесь на `setTimeout` с той же длительностью: используйте `animationend` / `animation.finished` или WAAPI.

Для появления/исчезновения предпочитайте `transition`; для индикаторов и декоративных циклов — `animation`. Смешивать их на одном свойстве — верный способ получить конфликт.

### Web Animations API

WAAPI даёт императивное управление анимацией из JS и при этом использует тот же движок, что CSS: композиторные свойства остаются композиторными, а не переезжают в `requestAnimationFrame`.

```js
const panel = document.querySelector('.panel');

const animation = panel.animate(
  [
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  {
    duration: 200,
    easing: 'cubic-bezier(0, 0, 0, 1)',
    fill: 'both',
  },
);

animation.pause();
animation.play();
animation.playbackRate = 2;
animation.reverse();

await animation.finished;
```

Ключевые возможности:

- **`Animation` object**: `play()`, `pause()`, `cancel()`, `finish()`, `reverse()`, `updatePlaybackRate()`.
- **`finished`** — промис завершения; `cancel()` отклоняет его, поэтому нужен `catch`.
- **`getAnimations()`** — список активных анимаций элемента или документа; удобно для отмены и тестов.
- **`commitStyles()` + `cancel()`** — «запечь» финальное состояние в inline-стили и освободить анимацию.
- **`persist()`** — сохранить fill-анимацию после удаления из `getAnimations()` (полезно для долгоживущих эффектов).
- **`KeyframeEffect` и `GroupEffect`** — программное построение анимаций; групповые эффекты поддержаны не везде.

WAAPI уместен, когда:

- анимация запускается по событию и должна управляться кодом (пауза, отмена, скорость);
- нужно дождаться завершения и продолжить сценарий;
- анимация строится динамически (координаты, размеры, данные);
- нужно синхронизировать несколько элементов.

Не стоит тащить WAAPI туда, где хватает CSS: декларативный код проще ревьюить, и он работает до загрузки JS.

> `fill: 'both'` оставляет элемент в конечном состоянии, но такая анимация продолжает жить в `getAnimations()`. Если состояние должно остаться навсегда, после `finished` вызовите `commitStyles()` и `cancel()` — иначе легко получить накопление анимаций и конфликт со следующим переходом.

### FLIP: анимация изменений лейаута

FLIP расшифровывается как **First, Last, Invert, Play**:

1. **First** — измерить позиции элементов до изменения.
2. **Last** — изменить DOM и измерить позиции после.
3. **Invert** — вычислить разницу и применить обратный `transform`, чтобы элемент визуально остался на старом месте.
4. **Play** — анимировать `transform` к нулю.

Это единственный способ плавно анимировать перестановку, не анимируя `top`/`left` и не вызывая layout на каждом кадре. FLIP работает с любым изменением: сортировка, фильтрация, смена сетки, переход карточки в детальный вид.

```js
function measure(container) {
  return new Map(
    [...container.children].map((el) => [el, el.getBoundingClientRect()]),
  );
}

function playFlip(container, first, duration = 240) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Отменяем старые анимации до замера: transform влияет на rect
  for (const el of container.children) {
    el.getAnimations().forEach((animation) => animation.cancel());
  }

  const last = measure(container);

  for (const [el, before] of first) {
    const after = last.get(el);
    if (!after) continue;

    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (!dx && !dy) continue;

    if (reduce) continue;

    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    );
  }
}
```

Тонкости, на которых FLIP чаще всего ломается:

- **Читать геометрию нужно до записи.** Сначала все `getBoundingClientRect()`, потом мутации DOM и анимации, иначе получится forced synchronous layout на каждой итерации.
- **Активные анимации искажают замер.** Перед `Last` их отменяют, иначе `rect` учитывает текущий `transform`.
- **Прерывание.** Если пользователь быстро нажимает «вверх» несколько раз, старые анимации нужно отменять, а не накапливать.
- **Удаление и добавление.** Для исчезающих элементов сначала анимируют exit, потом удаляют из DOM; для появляющихся — наоборот.
- **`position: absolute` для уходящего элемента.** Иначе соседи будут ждать, пока он доедет, и сетка дёрнется.
- **Reduced motion.** Перестановка должна происходить мгновенно, без промежуточных кадров.

В Vue `<TransitionGroup>` делает FLIP автоматически через move-класс. В React ту же роль играют layout-анимации Motion (`layout`, `LayoutGroup`, `layoutId`). Писать FLIP руками стоит, когда нужна прозрачная логика без зависимости или нестандартный сценарий.

### View Transitions API

View Transitions API — браузерный механизм, который снимает снапшот старого состояния, применяет DOM-изменение, снимает снапшот нового и анимирует между ними псевдоэлементы. Разработчик не двигает элементы вручную: браузер делает это за него.

**Same-document переходы** запускаются из JS:

```js
async function updateView(update) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduce) {
    await update();
    return;
  }

  const transition = document.startViewTransition(() => update());
  await transition.finished;
}
```

По умолчанию браузер делает cross-fade корневого снапшота. Чтобы анимировать конкретный элемент, ему задают `view-transition-name`:

```css
.card[data-expanded='true'] {
  view-transition-name: card-detail;
}

::view-transition-group(card-detail) {
  animation-duration: 240ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

::view-transition-old(card-detail) {
  animation: fade-out 120ms ease-out both;
}

::view-transition-new(card-detail) {
  animation: fade-in 180ms ease-out both;
}
```

Правила, без которых переходы ведут себя странно:

- **Имя уникально в пределах снапшота.** Два элемента с `view-transition-name: card-detail` одновременно — и переход отменяется целиком.
- **Не задавайте имена всему.** Каждый именованный элемент — отдельная группа снапшотов; десятки групп дорого.
- **Имя задаётся только активному элементу.** Для списка карточек имя вешают на ту, которая раскрывается, а не на все сразу.
- **DOM обновляется внутри callback.** Для React нужен `flushSync`, иначе браузер снимет снапшот до применения состояния; для Vue — `await nextTick()`.
- **Уважайте reduced motion.** Встроенная анимация не обязана отключаться сама: либо не вызывайте API, либо обнулите `animation-duration` у псевдоэлементов.

```js
import { flushSync } from 'react-dom';

function openCard(id) {
  if (!document.startViewTransition) {
    setActiveId(id);
    return;
  }

  document.startViewTransition(() => {
    flushSync(() => setActiveId(id));
  });
}
```

**Кросс-документные переходы** включаются декларативно и работают между страницами одного origin:

```css
/* На обеих страницах */
@view-transition {
  navigation: auto;
}
```

Это прогрессивное улучшение по дизайну: браузер без поддержки просто выполнит обычную навигацию. Для SPA тот же эффект даёт `startViewTransition` вокруг смены маршрута.

**Чем View Transitions отличаются от FLIP:**

| Критерий | FLIP | View Transitions |
|---|---|---|
| Что анимируется | Живой DOM | Снапшоты-псевдоэлементы |
| Контроль промежуточных состояний | Полный | Ограничен CSS-псевдоэлементами |
| Перестановка списка | Естественно | Требует уникальных имён на элемент |
| Смена страницы | Нужен роутер и ручная логика | Встроена для same-origin |
| Поддержка | Везде | Свежие браузеры, нужен fallback |
| Стоимость | Зависит от числа элементов | Снапшоты больших областей дороги |

Практическое правило: **FLIP — для микровзаимодействий внутри страницы, View Transitions — для переходов между экранами и крупными состояниями.**

### Scroll-driven animations

Scroll-driven animations привязывают прогресс анимации не ко времени, а к прокрутке. Вместо `scroll`-обработчика, который считает проценты в JS, браузер делает это на compositor.

```css
.reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes reveal {
  from {
    opacity: 0;
    translate: 0 24px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}
```

Два вида таймлайнов:

- **`scroll()`** — прогресс прокрутки контейнера (например, полоса чтения вверху страницы).
- **`view()`** — прогресс появления элемента во viewport.

`animation-range` задаёт, на каком участке начинается и заканчивается эффект (`entry`, `cover`, `exit`, проценты). Именованные таймлайны (`scroll-timeline-name`, `timeline-scope`) позволяют привязать анимацию к другому скроллеру.

Ограничения и подводные камни:

- **Поддержка неполная.** На момент статьи свойство доступно в свежих Chrome, Safari и Firefox, но не во всех используемых версиях. Нужен `@supports (animation-timeline: view())` и fallback.
- **Fallback — не «ничего», а видимый контент.** Если анимация отвечает за появление, при отсутствии поддержки элемент должен быть виден сразу, а не остаться с `opacity: 0`.
- **Только compositor-свойства.** `transform`, `opacity`, `translate`; `height`, `top`, `background-position` сведут выгоду на нет.
- **Reduced motion.** Пользователь с `prefers-reduced-motion: reduce` не должен получать parallax и «проявляющиеся» блоки; отключайте таймлайн или оставляйте конечное состояние.
- **Не заменяйте семантику.** Контент не должен быть доступен только после прокрутки: поиск, скринридер и печать должны видеть его сразу.

Если поддержка критична, альтернатива — `IntersectionObserver` + CSS-класс. Это дешевле `scroll`-обработчика, хотя и не даёт покадрового прогресса.

### GSAP: когда CSS уже не хватает

GSAP — самая зрелая JS-библиотека для анимации. Она оправдана, когда нужна **хореография**, а не отдельный переход:

- таймлайны с точным позиционированием шагов (`tl.to(..., 0.2)`, labels);
- stagger и волновые эффекты;
- ScrollTrigger: pin, scrub, snap, сложные сценарии появления;
- Flip-плагин для перестановок;
- SVG morph, draw, motion path;
- drag, инерция и сложные взаимодействия.

С 2025 года GSAP и его плагины бесплатны для коммерческого использования, включая ранее платные. Это снимает главный юридический вопрос, но не отменяет вес бандла: подключайте только нужные модули и проверяйте размер.

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function mountReveal(root) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      reduced: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const { reduced } = context.conditions;

      if (reduced) {
        gsap.set(root.querySelectorAll('.card'), { clearProps: 'all' });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          once: true,
        },
      });

      timeline.from('.card', {
        y: 24,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
  );

  return () => mm.revert();
}
```

Главные правила работы с GSAP:

- **Cleanup обязателен.** На каждом размонтировании — `ctx.revert()` / `mm.revert()` / `timeline.kill()`. Иначе после смены маршрута остаются десятки ScrollTrigger и утечки.
- **`matchMedia` вместо ручных `resize`-обработчиков.** Он сам переключает наборы анимаций и умеет отдавать cleanup.
- **`gsap.context()`** собирает анимации и селекторы, чтобы откатить их одной командой.
- **React:** `useGSAP()` из `@gsap/react` использует `useLayoutEffect` + context и корректно переживает StrictMode; в `useEffect` без cleanup двойной вызов создаст дубли.
- **Vue:** запускайте в `onMounted`, очищайте в `onBeforeUnmount`; для SSR не импортируйте GSAP в код, который исполняется на сервере без необходимости.
- **Не анимируйте layout-свойства без причины.** GSAP умеет `width`/`height`, но это не делает анимацию дешёвой.

Если сценарий — «показать/скрыть с fade и сдвигом», GSAP не нужен: CSS справится дешевле и надёжнее. Если сценарий — «pin-секция с 12 шагами, scrub и snap», без библиотеки писать её долго и рискованно.

### Производительность: что и почему тормозит

Анимация ломает кадры по трём причинам: **layout**, **paint** и **main thread**.

| Свойство | Что происходит | Стоимость |
|---|---|---|
| `transform`, `opacity`, `translate`, `scale`, `rotate` | Composite (при наличии слоя) | Низкая |
| `filter`, `backdrop-filter` | Paint + composite | Средняя/высокая |
| `color`, `background-color`, `border-color` | Paint | Средняя |
| `box-shadow`, `border-radius`, `clip-path` | Paint | Средняя/высокая |
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | Layout + paint | Высокая |
| CSS-переменная, влияющая на layout-свойство | Layout на каждом кадре | Высокая |

Практические правила:

1. **Анимируйте `transform` и `opacity`.** Остальное — только если эффект действительно требует и вы замерили стоимость.
2. **`will-change` — по триггеру, не глобально.** Каждый слой — память GPU; постоянный `will-change` на сотне карточек хуже, чем кратковременный layout.
3. **Не анимируйте `box-shadow`.** Анимируйте `opacity` псевдоэлемента с тенью.
4. **Не читайте геометрию в цикле анимации.** Запись → чтение → запись даёт layout thrashing.
5. **JS-анимация конкурирует с вводом.** Тяжёлый обработчик в кадре увеличивает INP; длинные задачи (>50 мс) нужно разбивать.
6. **Проверяйте на слабом устройстве.** CPU throttling ×4–×6 в DevTools показывает то, чего не видно на M3.
7. **Отключайте анимации вне экрана.** `content-visibility: auto`, `IntersectionObserver`, остановка бесконечных циклов.
8. **Измеряйте, а не угадывайте.** Performance-профиль, `PerformanceObserver`, Long Animation Frames API.

Диагностика по шагам:

1. Откройте DevTools → Performance и запишите 3–5 секунд взаимодействия.
2. Найдите кадры длиннее 16,7 мс (60 Гц) или 8,3 мс (120 Гц).
3. Посмотрите, какая фаза занимает время: `Recalculate Style`, `Layout`, `Paint`, `Composite Layers`, `Function Call`.
4. Если виноват JS — ищите длинные задачи и синхронные чтения геометрии.
5. Если виноват layout/paint — меняйте свойство или способ анимации.
6. Повторите на throttled CPU и на реальном мобильном устройстве.

Long Animation Frames API (Chrome) даёт более точную картину, чем `requestAnimationFrame`-дельты:

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long animation frame', {
        duration: entry.duration,
        blocking: entry.blockingDuration,
        scripts: entry.scripts?.map((s) => s.invoker),
      });
    }
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

Важно: **анимация может быть плавной, но ощущаться медленной.** 60 fps не спасает, если пользователь ждёт 500 мс до начала движения. Воспринимаемая скорость — это задержка старта и длительность, а не только частота кадров.

### Доступность: prefers-reduced-motion и не только

Движение — триггер вестибулярных расстройств: головокружения, тошноты, мигрени. Особенно опасны параллакс, масштабирование, вращение и движение на большой площади.

WCAG-требования:

- **2.2.2 Pause, Stop, Hide (A)** — автодвижущийся контент дольше 5 секунд должен иметь паузу.
- **2.3.1 Three Flashes (A)** — не больше трёх вспышек в секунду.
- **2.3.3 Animation from Interactions (AAA)** — анимация от взаимодействия должна отключаться.
- **2.5.4 Motion Actuation (A)** — управление наклоном/встряхиванием требует альтернативы.

Даже если 2.3.3 — AAA, `prefers-reduced-motion` стоит поддерживать по умолчанию.

Как это делать правильно:

```css
/* 1. Убираем движение, оставляем fade */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: opacity 100ms linear;
  }

  .card:hover {
    transform: none;
  }
}

/* 2. Останавливаем декоративные циклы, но не индикаторы */
@media (prefers-reduced-motion: reduce) {
  .decorative-orbit {
    animation: none;
  }

  .spinner {
    animation-duration: 2.4s;
  }
}

/* 3. Отключаем scroll-driven эффекты */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
    opacity: 1;
    translate: none;
  }
}
```

Чего не делать:

- **Глобальный `* { animation: none !important; transition: none !important; }`.** Ломает спиннеры, progress, валидацию, focus-переходы и обратную связь. Это не доступность, а отключение интерфейса.
- **Оставлять parallax и zoom при reduced motion.** Именно они чаще всего вызывают симптомы.
- **Прятать контент до прокрутки.** Если анимация не запустилась, текст должен быть виден.
- **Полагаться только на движение.** Смена состояния должна дублироваться текстом, цветом, `aria-live`.
- **Автоплей без паузы.** Карусель, видео и бегущая строка — с кнопкой остановки.

Проверяйте также **`prefers-contrast`** и **forced-colors mode**: тени и полупрозрачные слои, на которых держится глубина, в High Contrast могут исчезнуть.

### Тестирование анимаций

Анимации тестируют на трёх уровнях: **поведение**, **визуал** и **производительность**.

**Поведение.** Проверяйте состояние, а не кадры: открылся ли диалог, вернулся ли фокус, появился ли класс, вызвался ли cleanup.

```ts
import { test, expect } from '@playwright/test';

test('dialog fades in and returns focus', async ({ page }) => {
  await page.goto('/settings');

  const trigger = page.getByRole('button', { name: /удалить/i });
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: /отмена/i })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // Дождаться завершения всех анимаций перед следующим шагом
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
  );
});
```

**Визуал.** Скриншоты снимают с отключёнными анимациями, иначе тест будет флакать на каждом прогоне:

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    reducedMotion: 'reduce',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
});
```

В Storybook для Chromatic используют `pauseAnimationAtEnd`, чтобы снимок соответствовал финальному состоянию:

```ts
export default {
  parameters: {
    chromatic: {
      pauseAnimationAtEnd: true,
      diffThreshold: 0.05,
    },
  },
};
```

**Производительность.** Замеры jank нестабильны на CI, поэтому их выносят в отдельный прогон или локальный бенчмарк:

- `PerformanceObserver` для long tasks и long animation frames;
- запись DevTools Performance на стабильном сценарии;
- проверка, что при reduced motion анимации действительно отключены;
- проверка, что `getAnimations()` не растёт после повторных открытий/закрытий (утечка).

Частые ошибки в тестах:

- `waitForTimeout(300)` вместо ожидания `finished` — тест либо медленный, либо флакает.
- Проверка конкретного значения `transform` в середине анимации — зависит от машины.
- Скриншот с включёнными анимациями — случайный кадр.
- Тест не эмулирует `prefers-reduced-motion`, хотя это обязательное состояние.
- В jsdom/happy-dom нет полноценного WAAPI: `element.animate` и `getAnimations` нужно мокать или тестировать логику отдельно от рендера.

## Практические примеры

### Пример 1. Motion-токены и карточка с reduced-motion

```css
:root {
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0, 1);
  --ease-exit: cubic-bezier(0.3, 0, 1, 1);

  --motion-enter: var(--duration-200) var(--ease-enter);
  --motion-exit: var(--duration-150) var(--ease-exit);
  --motion-move: var(--duration-300) var(--ease-standard);
  --distance-md: 8px;
}

.card {
  opacity: 1;
  translate: 0 0;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  transition:
    opacity var(--motion-enter),
    translate var(--motion-enter),
    box-shadow var(--motion-enter);
}

.card:hover {
  translate: 0 calc(var(--distance-md) * -0.5);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --distance-md: 0px;
    --motion-enter: var(--duration-100) linear;
    --motion-exit: var(--duration-100) linear;
    --motion-move: var(--duration-100) linear;
  }

  .card:hover {
    translate: none;
  }
}
```

Здесь важно, что компонент не содержит магических чисел: длительности и смещения приходят из токенов, а reduced-motion меняет сами токены. При этом hover остаётся заметным за счёт тени и цвета — движение убрано, обратная связь сохранена.

### Пример 2. Dialog: `@starting-style`, `allow-discrete` и безопасный fallback

```html
<button type="button" id="open-sheet">Открыть настройки</button>

<dialog id="sheet" class="dialog" aria-labelledby="sheet-title">
  <h2 id="sheet-title">Настройки</h2>
  <p>Изменения применяются сразу.</p>
  <form method="dialog">
    <button value="close">Готово</button>
  </form>
</dialog>
```

```css
.dialog {
  opacity: 0;
  translate: 0 var(--distance-md, 8px);
  transition:
    opacity 150ms var(--ease-exit, ease-in),
    translate 150ms var(--ease-exit, ease-in);
}

.dialog[open] {
  opacity: 1;
  translate: 0 0;
  transition-duration: 200ms;
}

@starting-style {
  .dialog[open] {
    opacity: 0;
    translate: 0 var(--distance-md, 8px);
  }
}

/* Дискретные свойства — только там, где есть поддержка */
@supports (transition-behavior: allow-discrete) {
  .dialog {
    transition:
      opacity 150ms var(--ease-exit, ease-in),
      translate 150ms var(--ease-exit, ease-in),
      display 150ms allow-discrete;
  }

  .dialog[open] {
    transition:
      opacity 200ms var(--ease-enter, ease-out),
      translate 200ms var(--ease-enter, ease-out),
      display 200ms allow-discrete;
  }
}

/* В браузерах с overlay элемент остаётся в top layer до конца exit */
@supports (overlay: auto) and (transition-behavior: allow-discrete) {
  .dialog {
    transition:
      opacity 150ms var(--ease-exit, ease-in),
      translate 150ms var(--ease-exit, ease-in),
      display 150ms allow-discrete,
      overlay 150ms allow-discrete;
  }

  .dialog[open] {
    transition:
      opacity 200ms var(--ease-enter, ease-out),
      translate 200ms var(--ease-enter, ease-out),
      display 200ms allow-discrete,
      overlay 200ms allow-discrete;
  }
}
```

```js
const dialog = document.querySelector('#sheet');
const trigger = document.querySelector('#open-sheet');

trigger.addEventListener('click', () => {
  dialog.showModal();
});

// Закрытие по клику на backdrop
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
```

Что проверять:

- при открытии фокус уходит внутрь диалога, при закрытии возвращается на триггер;
- `Esc` закрывает диалог, exit-анимация не мешает возврату фокуса;
- без `@starting-style` диалог появляется мгновенно, но интерфейс остаётся рабочим;
- при `prefers-reduced-motion` длительности уходят в минимум, а не в «сломано»;
- клик по backdrop не закрывает диалог, если внутри идёт несохранённый ввод (нужна отдельная логика).

### Пример 3. FLIP для сортируемого списка

```html
<ul data-sortable>
  <li>
    <span>Первый</span>
    <button type="button" data-move="up" aria-label="Переместить выше">↑</button>
    <button type="button" data-move="down" aria-label="Переместить ниже">↓</button>
  </li>
  <li>
    <span>Второй</span>
    <button type="button" data-move="up" aria-label="Переместить выше">↑</button>
    <button type="button" data-move="down" aria-label="Переместить ниже">↓</button>
  </li>
</ul>
```

```js
const list = document.querySelector('[data-sortable]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-move]');
  if (!button) return;

  const item = button.closest('li');

  // 1. First: запоминаем позиции до изменения
  const first = new Map(
    [...list.children].map((el) => [el, el.getBoundingClientRect()]),
  );

  // 2. Last: меняем DOM
  if (button.dataset.move === 'up') {
    item.previousElementSibling?.before(item);
  } else {
    item.nextElementSibling?.after(item);
  }

  // 3. Invert + Play
  if (reduceMotion.matches) return;

  for (const el of list.children) {
    el.getAnimations().forEach((animation) => animation.cancel());

    const before = first.get(el);
    const after = el.getBoundingClientRect();
    if (!before) continue;

    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (!dx && !dy) continue;

    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: 240,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    );
  }
});
```

На что смотреть в code review:

- кнопки перемещения доступны с клавиатуры и имеют имена (не только стрелки);
- после перемещения фокус остаётся на кнопке, а не теряется вместе с DOM-узлом;
- при `prefers-reduced-motion` список переставляется мгновенно;
- быстрые повторные нажатия не накапливают анимации;
- измерение и мутация разделены, нет layout thrashing.

### Пример 4. View Transitions для карточки и навигации

```js
import { flushSync } from 'react-dom';

function useViewTransition() {
  return (update) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || reduce) {
      update();
      return;
    }

    document.startViewTransition(() => {
      flushSync(update);
    });
  };
}
```

```css
/* Карточка получает имя только в раскрытом состоянии */
.card {
  view-transition-name: none;
}

.card[data-expanded='true'] {
  view-transition-name: card-detail;
}

::view-transition-group(card-detail) {
  animation-duration: 240ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

::view-transition-old(card-detail) {
  animation: fade-out 120ms ease-out both;
}

::view-transition-new(card-detail) {
  animation: fade-in 180ms ease-out both;
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}

/* Кросс-документные переходы */
@view-transition {
  navigation: auto;
}

/* Глобальная страховка для reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 1ms !important;
  }
}
```

Что важно:

- `flushSync` гарантирует, что React применит состояние до снятия нового снапшота;
- имя `card-detail` существует только у одного элемента — иначе переход будет отменён;
- при отсутствии API или reduced motion состояние меняется без анимации;
- кросс-документный `@view-transition` работает как прогрессивное улучшение: без поддержки навигация просто происходит;
- exit-анимация не должна задерживать доступность нового экрана: фокус и заголовок обновляются сразу.

### Пример 5. GSAP: timeline, ScrollTrigger, reduced motion и cleanup

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createReveal(root) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      reduced: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const cards = root.querySelectorAll('.card');

      if (context.conditions.reduced) {
        gsap.set(cards, { clearProps: 'all' });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          once: true,
        },
      });

      timeline.from(cards, {
        y: 24,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
  );

  return () => mm.revert();
}
```

```js
// React: правильный жизненный цикл
import { useLayoutEffect, useRef } from 'react';
import { createReveal } from './reveal';

function Section() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const cleanup = createReveal(ref.current);
    return cleanup;
  }, []);

  return <section ref={ref}>...</section>;
}
```

Проверка качества:

- при размонтировании не остаётся ни одного ScrollTrigger (`ScrollTrigger.getAll().length` не растёт);
- `reduced`-ветка не оставляет элементов с `opacity: 0`;
- при ресайзе между breakpoint-ами анимации пересоздаются, а не дублируются;
- в SSR нет обращений к `window`/`document` на этапе рендера;
- вес библиотеки оправдан сценарием: для простого fade хватило бы CSS.

## Типичные ошибки и антипаттерны

- **`transition: all`.** Анимирует случайные свойства, вызывает layout и paint, конфликтует с другими состояниями.
- **Анимация `width`, `height`, `top`, `left`.** Layout на каждом кадре — главный источник jank. Используйте `transform`/`opacity`, для раскрытия — Grid `0fr → 1fr` или `@starting-style`.
- **`@starting-style` без `@supports` для `allow-discrete`.** Невалидная shorthand-декларация отбрасывается целиком, и вместе с ней исчезают рабочие переходы.
- **Ожидание `display: none → block` без `allow-discrete`.** Exit-анимация не успевает начаться, элемент исчезает мгновенно.
- **`will-change` на всех элементах и навсегда.** Лишние слои, память GPU и деградация на слабых устройствах.
- **Анимация `box-shadow` и `filter: blur()` на большой площади.** Дорогой paint; анимируйте opacity псевдоэлемента.
- **`setTimeout` для синхронизации с анимацией.** Не совпадает с реальной длительностью, ломается при throttling вкладки. Используйте `finished` или `transitionend`.
- **Отсутствие cleanup в GSAP/Motion.** Утечки ScrollTrigger, дубли анимаций после смены маршрута, «дёргающийся» интерфейс.
- **Повторяющиеся `view-transition-name`.** Переход отменяется целиком, и это не всегда заметно в логах.
- **FLIP без отмены старых анимаций.** Замеры учитывают текущий `transform`, элементы прыгают.
- **FLIP с чтением и записью в одном цикле.** Layout thrashing на каждом элементе.
- **Глобальное отключение анимаций при reduced motion.** Ломает спиннеры, прогресс и обратную связь.
- **Параллакс и zoom, которые нельзя отключить.** Прямой риск для вестибулярного аппарата.
- **Автоплей карусели без паузы.** Нарушает 2.2.2 и отвлекает.
- **Скрытый до прокрутки контент.** При отключённой анимации или ошибке JS пользователь не увидит текст.
- **`waitForTimeout` в тестах анимаций.** Медленно и флако.
- **Скриншоты с включёнными анимациями.** Нестабильная визуальная регрессия.
- **Анимация ради анимации.** Если движение не объясняет изменение, оно только замедляет интерфейс.

## Ключевые тезисы для интервью

- **Motion — это система.** Токены primitive/semantic/component, правила длительности и easing, reduced-motion варианты и документация важнее отдельных эффектов.
- **Длительность и кривая важнее эффекта.** 150–250 мс для UI, exit быстрее enter, stagger 30–80 мс, общая сцена до 500 мс.
- **`transition` и `animation` решают разные задачи.** Transition — смена двух состояний и плавное прерывание, animation — keyframes, циклы и многошаговые сценарии.
- **`transition: all` — антипаттерн.** Перечисляйте свойства явно, иначе платите за layout и получаете неожиданные переходы.
- **`@starting-style` убирает хаки с первым кадром.** Он задаёт стартовые значения для только что появившегося элемента; Baseline 2024.
- **`allow-discrete` нужен для `display`, а `overlay` — опционально.** Без `display` exit-анимации не существует; `overlay` удерживает top layer и подключается отдельным `@supports`, чтобы не потерять остальные переходы.
- **Анимируйте compositor-свойства.** `transform`/`opacity`/`translate` дешёвые; `width`, `height`, `top`, `box-shadow` — дорогие.
- **FLIP — техника, а не API.** Измерить, изменить DOM, инвертировать, проиграть; требует отмены старых анимаций и разделения чтения/записи.
- **View Transitions — снапшоты, FLIP — живой DOM.** VT хорош для смены экранов и кросс-документных переходов, FLIP — для перестановок внутри страницы.
- **WAAPI — императивное управление, GSAP — хореография.** WAAPI для паузы/отмены/`finished`, GSAP для таймлайнов, ScrollTrigger и сложных сценариев.
- **Scroll-driven animations работают на compositor.** Но поддержка неполная, поэтому нужен `@supports` и видимый fallback.
- **`prefers-reduced-motion` — обязательное состояние.** Убирайте движение, а не обратную связь; не отключайте индикаторы загрузки.
- **Анимации тестируют поведением, а не кадрами.** `animations: 'disabled'` для скриншотов, `animation.finished` вместо sleep, reduced-motion в матрице состояний.

## Практическое задание и code review-чеклист

### Задание: motion-система и список без jank

Соберите мини-проект из трёх частей.

**1. Токены и компоненты.**

- Опишите primitive-шкалу длительностей (100/150/200/300/500) и три easing-кривые.
- Сделайте semantic-токены `enter`, `exit`, `move`, `stagger`.
- Реализуйте `Button`, `Card` и `Dialog` только через токены, без магических чисел.
- Добавьте reduced-motion вариант: движение убрано, feedback сохранён, спиннер работает.

**2. Список.**

- Сделайте список из 8–10 элементов с кнопками «выше/ниже».
- Реализуйте перестановку через FLIP на WAAPI.
- Затем реализуйте тот же сценарий через View Transitions (если браузер поддерживает) и сравните код и поведение.
- Проверьте: быстрые нажатия, reduced motion, клавиатура, сохранение фокуса.

**3. Замер.**

- Запишите Performance-профиль перестановки.
- Найдите кадры длиннее 16,7 мс и объясните, чем они вызваны.
- Замените проблемное свойство и сравните профиль до/после.
- Проверьте, что после 20 циклов открытия/закрытия диалога `document.getAnimations()` не растёт.

**Критерии оценки:**

- нет `transition: all` и хардкода длительностей в компонентах;
- exit короче enter, stagger в разумных пределах;
- reduced motion проверен вручную и в Playwright;
- FLIP не вызывает layout thrashing и корректно прерывается;
- фокус и доступность не ломаются анимацией;
- есть замер до/после, а не «на глаз».

### Чек-лист code review

- [ ] Движение объясняет изменение, а не украшает его.
- [ ] Длительности и easing взяты из токенов, а не из магических чисел.
- [ ] Exit короче enter; stagger не превращает список в карусель.
- [ ] Анимируются `transform`/`opacity`/`translate`, а не layout-свойства.
- [ ] Нет `transition: all`; свойства перечислены явно.
- [ ] Для появления из `display: none` используется `@starting-style`, а не двойной `requestAnimationFrame`.
- [ ] `allow-discrete` обёрнут в `@supports` и не ломает базовые переходы.
- [ ] `prefers-reduced-motion` учтён; движение убрано, обратная связь сохранена.
- [ ] Индикаторы загрузки и прогресса не отключены в reduced motion.
- [ ] Нет автоплея без паузы; параллакс и zoom отключаемы.
- [ ] FLIP отменяет старые анимации и не читает геометрию в цикле записи.
- [ ] `view-transition-name` уникален; при отсутствии API есть fallback.
- [ ] GSAP/Motion/WAAPI очищаются при размонтировании, ScrollTrigger не дублируется.
- [ ] Контент виден без JS и без анимации.
- [ ] Тесты ждут `finished`, а не фиксированный таймаут.
- [ ] Скриншоты снимаются с `animations: 'disabled'` и `reducedMotion: 'reduce'`.
- [ ] Проверены кадры на throttled CPU и реальном мобильном устройстве.

## Заключение

Анимация в UI Engineer — это инженерная дисциплина на стыке дизайна, браузера и доступности. Сначала появляется система: токены длительности и easing, правила хореографии, reduced-motion варианты. Потом выбирается техника: CSS для состояний, `@starting-style` и `allow-discrete` для появления и исчезновения, WAAPI для императивных сценариев, FLIP для перестановок, View Transitions для смены экранов, GSAP для сложной хореографии. И только затем — оптимизация: compositor-свойства, замер кадров, отсутствие layout thrashing и уважение к настройкам пользователя.

Главный критерий качества — не количество эффектов, а предсказуемость. Пользователь должен понимать, что произошло, не ждать лишнего и иметь возможность отключить движение, не теряя функциональность. Если движение отвечает на эти вопросы, оно делает продукт быстрее и понятнее, даже если его почти не заметно.

Дальше логично разобрать визуальную основу движения — [Типографика, цвет и визуальный ритм](./typography-and-color.md): типографическая шкала, ритм, палитра и контраст, на которых держится восприятие анимации.

## Полезные ссылки

- [MDN: CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions)
- [MDN: `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
- [MDN: `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)
- [MDN: Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [MDN: Scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
- [web.dev: View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions)
- [web.dev: Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [web.dev: Animations performance](https://web.dev/articles/animations-guide)
- [CSS-Tricks: FLIP](https://css-tricks.com/animating-layouts-with-the-flip-technique/)
- [GSAP documentation](https://gsap.com/docs/v3/)
- [GSAP: matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia())
- [W3C: WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Chrome: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)
