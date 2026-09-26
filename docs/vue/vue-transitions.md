---
title: "Transition и TransitionGroup"
section: vue
description: "Анимации переходов во Vue 3: <Transition>, <TransitionGroup>, CSS-классы enter/leave/move, JS-хуки, анимация списков, производительность и сравнение с React."
order: 11
tags: ["vue", "vue3", "transition", "transition-group", "animation", "css-transitions", "js-hooks", "performance", "list-animations"]
questions:
  - "Какие встроенные компоненты для анимаций есть во Vue 3"
  - "Какие CSS-классы добавляет <Transition> на разных этапах enter и leave"
  - "Чем <TransitionGroup> отличается от <Transition> и зачем нужен :key"
  - "Как анимировать появление и исчезновение элемента через CSS-классы"
  - "Какие JS-хуки предоставляет <Transition> и когда они нужны"
  - "Как анимировать перемещение элементов в списке"
  - "Какие проблемы с производительностью возникают при анимациях и как их избежать"
  - "Чем Vue Transition отличается от React Transition Group и Framer Motion"
---

# Transition и TransitionGroup

Интерфейс без анимаций кажется ломаным. Модальное окно, которое появляется мгновенно, список, элементы которого прыгают при сортировке, страница без плавного перехода между состояниями — всё это раздражает пользователя и снижает восприятие качества приложения. Но анимации легко превратить в ад из `setTimeout`, ручного управления классами и рассинхронизированных DOM-манипуляций.

Во Vue 3 есть два встроенных компонента для декларативных переходов: `<Transition>` для анимации появления и исчезновения одного элемента или компонента, и `<TransitionGroup>` для анимации списков — вставки, удаления и перемещения. В статье разберём, как они работают, какие CSS-классы и JS-хуки предоставляют, как анимировать списки и сохранять производительность.

## Содержание

1. [Зачем нужны встроенные Transition-компоненты](#зачем-нужны-встроенные-transition-компоненты)
2. [`<Transition>`: базовое использование](#transition-базовое-использование)
3. [CSS-классы переходов](#css-классы-переходов)
4. [Переходы с `v-if` и `<component :is>`](#переходы-с-v-if-и-component-is)
5. [JS-хуки `<Transition>`](#js-хуки-transition)
6. [`<TransitionGroup>`](#transitiongroup)
7. [Анимация перемещения элементов](#анимация-перемещения-элементов)
8. [Производительность анимаций](#производительность-анимаций)
9. [Сравнение с React](#сравнение-с-react)
10. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)
13. [Полезные ссылки](#полезные-ссылки)

---

## Зачем нужны встроенные Transition-компоненты

Анимация вручную требует решать несколько задач одновременно:

1. **Отследить момент начала и конца изменения.** Компонент появился, исчез или сменился на другой.
2. **Применить и убрать CSS-классы в правильный момент.** Нельзя просто добавить класс и ждать: браузеру нужен reflow, чтобы пересчитать стили.
3. **Дождаться окончания анимации и удалить элемент из DOM.** Если убрать элемент раньше, анимация прервётся; если позже — элемент будет болтаться в DOM и блокировать события.
4. **Обработать прерывание.** Пользователь может уйти со страницы или снова переключить состояние до завершения анимации.

`<Transition>` и `<TransitionGroup>` берут на себя всю эту логику. Разработчик описывает, как должны выглядать начальное, конечное и промежуточные состояния, а Vue управляет классами, событиями и синхронизацией с DOM.

### Что покрывает каждый компонент

| Компонент | Сценарий | Пример |
|---|---|---|
| `<Transition>` | Один элемент или компонент появляется, исчезает или заменяется | Модальное окно, toast, переключение вкладок |
| `<TransitionGroup>` | Список: добавление, удаление, перемещение элементов | Список задач, фильтрованная таблица, чат |

---

## `<Transition>`: базовое использование

`<Transition>` оборачивает один корневой элемент или компонент. При изменении условия рендера Vue автоматически добавляет и удаляет CSS-классы, соответствующие фазам перехода.

```vue
<script setup>
import { ref } from 'vue';

const show = ref(false);
</script>

<template>
  <button @click="show = !show">Переключить</button>

  <Transition name="fade">
    <p v-if="show">Привет, Vue!</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

При нажатии на кнопку:

1. Элемент появляется: Vue добавляет классы `fade-enter-from` и `fade-enter-active`, затем `fade-enter-to`.
2. Элемент исчезает: Vue добавляет `fade-leave-from` и `fade-leave-active`, затем `fade-leave-to`, после чего убирает элемент из DOM.

### Важное ограничение

`<Transition>` может анимировать только **один корневой узел** за раз. Если внутри несколько элементов с `v-if`/`v-else`, Vue понимает их как замену одного элемента другим:

```vue
<Transition name="fade">
  <button v-if="isEditing" key="save">Сохранить</button>
  <button v-else key="edit">Редактировать</button>
</Transition>
```

Атрибут `key` здесь обязателен: без него Vue увидит два одинаковых `<button>` и решит, что это один и тот же элемент, и анимации не будет.

### Режимы переключения

Когда один элемент заменяется другим, можно управлять порядком анимаций через пропс `mode`:

| Режим | Поведение |
|---|---|
| `default` | Новый элемент появляется одновременно с исчезновением старого |
| `out-in` | Старый элемент уходит, затем появляется новый |
| `in-out` | Новый элемент появляется, затем уходит старый |

```vue
<Transition name="fade" mode="out-in">
  <button v-if="isEditing" key="save">Сохранить</button>
  <button v-else key="edit">Редактировать</button>
</Transition>
```

`out-in` чаще всего выглядит аккуратнее, потому что в DOM не бывает двух версий элемента одновременно.

---

## CSS-классы переходов

Каждый переход разбивается на шесть классов. Префикс зависит от значения `name` на `<Transition>`; по умолчанию используется `v-`.

| Класс | Фаза | Когда добавляется |
|---|---|---|
| `v-enter-from` | enter | На один кадр перед началом появления |
| `v-enter-active` | enter | На всё время появления |
| `v-enter-to` | enter | Со второго кадра до конца появления |
| `v-leave-from` | leave | На один кадр перед началом исчезновения |
| `v-leave-active` | leave | На всё время исчезновения |
| `v-leave-to` | leave | Со второго кадра до конца исчезновения |

```vue
<style>
/* Начальное состояние при появлении */
.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

/* Активная фаза: к чему стремимся и как долго */
.fade-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

/* Конечное состояние при появлении */
.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Начальное состояние при исчезновении */
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Активная фаза исчезновения */
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

/* Конечное состояние при исчезновении */
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
```

### Имена классов по умолчанию

Если не указать `name`, используются классы с префиксом `v-`:

```vue
<Transition>
  <p v-if="show">Без имени</p>
</Transition>
```

```css
.v-enter-active { transition: opacity 0.3s; }
.v-enter-from { opacity: 0; }
```

### Пользовательские имена классов

Иногда нужно подключить готовую CSS-библиотеку, например Animate.css. Для этого `<Transition>` позволяет явно задать классы:

```vue
<Transition
  enter-active-class="animate__animated animate__bounceIn"
  leave-active-class="animate__animated animate__bounceOut"
>
  <p v-if="show">Сторонняя анимация</p>
</Transition>
```

| Атрибут | Назначение |
|---|---|
| `enter-from-class` | Начальное состояние enter |
| `enter-active-class` | Классы активной фазы enter |
| `enter-to-class` | Конечное состояние enter |
| `leave-from-class` | Начальное состояние leave |
| `leave-active-class` | Классы активной фазы leave |
| `leave-to-class` | Конечное состояние leave |

---

## Переходы с `v-if` и `<component :is>`

`<Transition>` прекрасно работает не только с `v-if`, но и с динамическими компонентами, и с маршрутами.

### Переключение компонентов

```vue
<script setup>
import { shallowRef } from 'vue';
import TabA from './TabA.vue';
import TabB from './TabB.vue';

const currentTab = shallowRef(TabA);
</script>

<template>
  <div>
    <button @click="currentTab = TabA">A</button>
    <button @click="currentTab = TabB">B</button>

    <Transition name="slide" mode="out-in">
      <component :is="currentTab" />
    </Transition>
  </div>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
```

### Первоначальное появление

По умолчанию `<Transition>` не анимирует элемент, который виден с самого начала. Чтобы включить анимацию при первом рендере, используется пропс `appear`:

```vue
<Transition name="fade" appear>
  <p>Появлюсь с анимацией при загрузке</p>
</Transition>
```

При этом применяются те же классы, но с префиксом `appear-`: `fade-appear-from`, `fade-appear-active`, `fade-appear-to`. Их можно задать явно через `appear-from-class`, `appear-active-class`, `appear-to-class`.

---

## JS-хуки `<Transition>`

Иногда CSS-перехода недостаточно: нужно управлять `requestAnimationFrame`, работать с Web Animations API, GSAP или выполнять логику в конкретный момент перехода. Для этого `<Transition>` предоставляет JS-хуки.

| Хук | Когда вызывается | Типичное использование |
|---|---|---|
| `@before-enter` | Перед добавлением enter-классов | Начальная подготовка |
| `@enter` | После добавления enter-классов | Запуск JS-анимации |
| `@after-enter` | После завершения enter | Очистка |
| `@enter-cancelled` | Если enter был прерван | Отмена |
| `@before-leave` | Перед добавлением leave-классов | Подготовка к уходу |
| `@leave` | После добавления leave-классов | Запуск JS-анимации |
| `@after-leave` | После завершения leave | Удаление из DOM завершено |
| `@leave-cancelled` | Если leave был прерван | Отмена |

### Пример с обратным вызовом `done`

Если JS-хук принимает второй аргумент — `done`, Vue не будет автоматически определять длительность по CSS, а дождётся вызова `done`:

```vue
<script setup>
import gsap from 'gsap';

function onEnter(el, done) {
  gsap.fromTo(el,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, onComplete: done }
  );
}

function onLeave(el, done) {
  gsap.to(el, { opacity: 0, y: -20, duration: 0.3, onComplete: done });
}
</script>

<template>
  <Transition @enter="onEnter" @leave="onLeave">
    <div v-if="show">Анимация через GSAP</div>
  </Transition>
</template>
```

### Только JS-переход

Если CSS не нужен вовсе, используется `type="animation"` или `:css="false"`:

```vue
<Transition :css="false" @enter="onEnter" @leave="onLeave">
  <div v-if="show">Только JS</div>
</Transition>
```

`:css="false"` отключает попытки Vue автоматически определить длительность по CSS и снижает накладные расходы.

### Хуки appear

Если используется `appear`, есть отдельные хуки: `@before-appear`, `@appear`, `@after-appear`, `@appear-cancelled`.

---

## `<TransitionGroup>`

`<TransitionGroup>` предназначен для списков. В отличие от `<Transition>`, он не создаёт собственного DOM-узла: он рендерит переданный элемент — обычно `<ul>`, `<ol>` или `<div>` — и анимирует внутренние элементы при их добавлении, удалении и перемещении.

```vue
<script setup>
import { ref } from 'vue';

const items = ref([
  { id: 1, text: 'Первый' },
  { id: 2, text: 'Второй' },
  { id: 3, text: 'Третий' },
]);

function addItem() {
  items.value.push({ id: Date.now(), text: `Элемент ${items.value.length + 1}` });
}

function removeItem(id) {
  items.value = items.value.filter(item => item.id !== id);
}
</script>

<template>
  <button @click="addItem">Добавить</button>

  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id" class="item">
      {{ item.text }}
      <button @click="removeItem(item.id)">×</button>
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
```

### Особенности `<TransitionGroup>`

1. **Требует `:key` на каждом элементе.** Без ключа Vue не сможет отследить, какой элемент добавился, удалился или переместился.
2. **Пропс `tag`.** Определяет, какой DOM-элемент будет корневым. Если не нужен дополнительный узел, используется `:tag="null"` (или атрибут `tag` не указывается во Vue 3.2+, рендерится как fragment).
3. **Не использует `mode`.** В списке одновременно могут появляться и исчезать элементы.
4. **Поддерживает те же CSS-классы и JS-хуки**, что и `<Transition>`, плюс классы для перемещения.

### Перемещение элементов

Когда элементы меняют позицию в списке, Vue применяет класс `v-move`:

```css
.list-move {
  transition: transform 0.4s ease;
}
```

Vue вычисляет старое и новое положение каждого элемента и применяет `transform`, чтобы плавно сдвинуть их на новые места. Это работает для сортировки, фильтрации, изменения порядка.

---

## Анимация перемещения элементов

Перемещение — самая сложная часть анимации списка. Браузер мгновенно перестраивает DOM, поэтому Vue использует FLIP-технику:

1. **First:** запоминает начальное положение элемента.
2. **Last:** измеряет положение после изменения DOM.
3. **Invert:** применяет `transform`, чтобы визуально вернуть элемент на старое место.
4. **Play:** запускает transition на `transform`, элемент плавно движется к новому месту.

### Пример сортировки с анимацией

```vue
<script setup>
import { ref } from 'vue';

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]);

function shuffle() {
  items.value = [...items.value].sort(() => Math.random() - 0.5);
}
</script>

<template>
  <button @click="shuffle">Перемешать</button>

  <TransitionGroup name="flip" tag="ul">
    <li v-for="item in items" :key="item.id" class="card">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style>
.flip-move {
  transition: transform 0.5s ease;
}

.flip-enter-active,
.flip-leave-active {
  transition: all 0.5s ease;
}

.flip-enter-from,
.flip-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Важно: убираем leaving-элемент из потока, чтобы остальные могли занять его место */
.flip-leave-active {
  position: absolute;
}
</style>
```

### Почему `position: absolute` для leave

Без `position: absolute` удаляемый элемент продолжает занимать место в потоке, и соседние элементы не сдвинутся на его место до завершения анимации. `position: absolute` вырывает элемент из layout, позволяя остальным плавно перетечь через `v-move`.

### Проблема с высотой родителя

Если удаляемый элемент уходит из потока, высота родительского `<ul>` может резко измениться, что выглядит как скачок. Решения:

- Анимировать `height` или `max-height` самого элемента.
- Оборачивать элементы в дополнительный контейнер.
- Использовать JS-библиотеки вроде GSAP Flip, которые умеют анимировать layout.

---

## Производительность анимаций

Анимации — это один из самых быстрых способов сделать интерфейс тяжёлым. Несколько правил помогают держать их плавными.

### Анимируйте только композитные свойства

Браузер рисует страницу в несколько этапов: layout, paint, composite. Самый дешёвый этап — composite, который выполняется на GPU.

| Свойство | Этапы |
|---|---|
| `transform`, `opacity` | Только composite |
| `color`, `background-color` | Paint + composite |
| `width`, `height`, `top`, `left`, `margin` | Layout + paint + composite |

```css
/* Хорошо */
.slide-enter-active {
  transition: transform 0.3s, opacity 0.3s;
}

/* Плохо: вызывает layout */
.slide-enter-active {
  transition: width 0.3s, height 0.3s;
}
```

### Используйте `will-change` с осторожностью

`will-change` подсказывает браузеру подготовиться к анимации, но злоупотребление ими приводит к избыточному потреблению памяти:

```css
.slide-enter-active,
.slide-leave-active {
  will-change: transform, opacity;
}
```

Лучше добавлять `will-change` только на время активной анимации и убирать после.

### Ограничивайте одновременные анимации

Если одновременно анимируется много элементов, особенно на слабых устройствах, появляются пропуски кадров. Стратегии:

- Анимировать не все элементы сразу, а только видимые во viewport.
- Использовать `v-memo` или виртуализацию списков для больших наборов данных.
- Для массовых перемещений рассмотреть CSS-анимации вместо JS.

### Отложенная загрузка анимаций

Тяжёлые JS-анимации, например графики или сложные эффекты, лучше загружать лениво, чтобы не блокировать первоначальный рендер:

```vue
<script setup>
import { defineAsyncComponent } from 'vue';

const HeavyAnimation = defineAsyncComponent(() => import('./HeavyAnimation.vue'));
</script>
```

### `move-class` и кастомизация

`<TransitionGroup>` позволяет задать класс для перемещения явно:

```vue
<TransitionGroup name="list" move-class="list-move-custom">
  ...
</TransitionGroup>
```

Это удобно, когда класс `v-move` по умолчанию конфликтует с другими стилями.

---

## Сравнение с React

В React нет встроенного компонента для анимаций переходов. Обычно используются сторонние библиотеки: `react-transition-group`, `framer-motion`, `react-spring`.

| Аспект | Vue `<Transition>` | React Transition Group | Framer Motion |
|---|---|---|---|
| Встроенность | Да, часть Vue 3 | Сторонняя библиотека | Сторонняя библиотека |
| API | Декларативные CSS-классы и хуки | Классы + колбэки | Декларативные пропсы motion |
| `<TransitionGroup>` | Встроен | `<TransitionGroup>` из react-transition-group | `<AnimatePresence>` + `<Reorder.Group>` |
| Перемещение элементов | Класс `v-move`, FLIP | Требует ручной реализации | Встроено через layout animations |
| JS-анимации | Хуки `@enter`, `@leave` | Колбэки на lifecycle | API animate, useAnimation |
| Размер | Входит в ядро Vue | Небольшой | Большой, особенно с layout |

### Vue vs React Transition Group

React Transition Group работает похоже: компоненты `<CSSTransition>` и `<TransitionGroup>` добавляют классы на основе состояния. Но он не управляет самим рендером элемента и требует больше шаблонного кода.

```jsx
import { CSSTransition } from 'react-transition-group';

<CSSTransition in={show} timeout={300} classNames="fade">
  <div>Появляюсь</div>
</CSSTransition>
```

```css
.fade-enter { opacity: 0; }
.fade-enter-active { opacity: 1; transition: opacity 300ms; }
.fade-exit { opacity: 1; }
.fade-exit-active { opacity: 0; transition: opacity 300ms; }
```

В Vue нет необходимости передавать `in`: компонент сам определяет, появился элемент или исчез.

### Vue vs Framer Motion

Framer Motion предлагает более высокоуровневый API:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

Framer Motion мощнее для сложных gesture-анимаций, shared layout transitions и drag-and-drop. Vue Transition покрывает большинство стандартных задач без дополнительных зависимостей.

---

## Лучшие практики и антипаттерны

### Лучшие практики

1. **Используйте `transform` и `opacity`.**

   Это самые производительные свойства для анимации.

2. **Добавляйте `mode="out-in"` для взаимозаменяемых элементов.**

   Это предотвращает одновременное наличие двух версий элемента в DOM.

3. **Всегда указывайте `:key` в `<TransitionGroup>`.**

   Без ключа анимация списка работать не будет.

4. **Используйте `appear` для первоначальной анимации.**

   ```vue
   <Transition name="fade" appear>
     <AppHero />
   </Transition>
   ```

5. **Для списков добавляйте `position: absolute` на leaving-элемент.**

   Это позволяет остальным элементам плавно занять освободившееся место.

6. **Типизируйте duration при JS-анимациях.**

   Если используется `done`, убедитесь, что он вызывается всегда — иначе Vue не уберёт элемент.

7. **Предпочитайте CSS-анимации JS-анимациям, где это возможно.**

   Они работают на отдельном потоке браузера и не блокируют main thread.

### Антипаттерны

1. **Анимация layout-свойств без необходимости.**

   ```css
   /* Плохо */
   .bad-enter-active {
     transition: width 0.5s, height 0.5s;
   }
   ```

   Такие анимации вызывают layout thrashing.

2. **Отсутствие `:key` в `<TransitionGroup>`.**

   ```vue
   <!-- Плохо -->
   <TransitionGroup name="list" tag="ul">
     <li v-for="item in items">{{ item }}</li>
   </TransitionGroup>
   ```

   Без ключа Vue не сможет отследить изменения.

3. **Забытый вызов `done` в JS-хуках.**

   ```js
   function onEnter(el, done) {
     gsap.to(el, { opacity: 1, duration: 0.5 });
     // done не вызван — элемент не будет удалён/показан корректно
   }
   ```

   Если хук принимает `done`, Vue ждёт его вызова.

4. **Длинные CSS-переходы на мелких интерактивных элементах.**

   Кнопка с transition 1s выглядит вяло. Для микровзаимодействий достаточно 150–300 мс.

5. **Анимация всего списка при каждом обновлении.**

   Если данные обновляются часто, анимация каждого элемента создаёт визуальный шум. Используйте `v-memo` или разделяйте обновляемые и статичные части.

6. **Игнорирование `prefers-reduced-motion`.**

   Для пользователей с вестибулярными нарушениями анимации должны отключаться:

   ```css
   @media (prefers-reduced-motion: reduce) {
     .fade-enter-active,
     .fade-leave-active {
       transition: none;
     }
   }
   ```

---

## Ключевые тезисы для интервью

1. Во Vue 3 есть два встроенных компонента для анимаций: `<Transition>` — для одного элемента, `<TransitionGroup>` — для списков.
2. `<Transition>` добавляет CSS-классы `enter-from`, `enter-active`, `enter-to`, `leave-from`, `leave-active`, `leave-to` в зависимости от фазы.
3. Атрибут `name` на `<Transition>` определяет префикс классов; по умолчанию используется `v-`.
4. `<Transition>` может анимировать только один корневой узел; для замены используется `mode="out-in"` или `mode="in-out"`.
5. `<TransitionGroup>` не создаёт свой DOM-узел, требует `:key` на каждом элементе и поддерживает класс `move` для анимации перемещений.
6. Для перемещения элементов Vue использует FLIP-технику через класс `v-move`.
7. JS-хуки `@enter`, `@leave` и другие позволяют управлять анимацией вручную; если хук принимает `done`, Vue ждёт его вызова.
8. Самые производительные анимируемые свойства — `transform` и `opacity`, потому что они не вызывают layout.
9. Для first-render анимации используется пропс `appear`.
10. Vue Transition нет прямого встроенного аналога в React; ближайшие аналоги — React Transition Group и Framer Motion.
11. Важно учитывать `prefers-reduced-motion` для доступности и не забывать `:key` в `<TransitionGroup>`.

---

## Заключение

`<Transition>` и `<TransitionGroup>` — это мощный, но при этом простой способ добавить анимации в Vue-приложение. Они решают рутинные задачи — применение классов, синхронизацию с DOM, обработку прерываний — и позволяют разработчику сосредоточиться на визуальном эффекте. Для большинства интерфейсов CSS-переходов с `transform` и `opacity` достаточно, а для сложных сценариев есть JS-хуки и интеграция с библиотеками вроде GSAP.

Главное — не увлекаться анимацией ради анимации. Хороший переход помогает пользователю понять, что изменилось в интерфейсе, а плохой — отвлекает и замедляет. Используйте `<Transition>` для модалок, toasts, переключений; `<TransitionGroup>` — для списков и изменения порядка; и всегда проверяйте производительность на реальных устройствах.

---

## Полезные ссылки

- [Vue 3 Docs — Transition](https://vuejs.org/guide/built-ins/transition.html) — официальная документация по `<Transition>`.
- [Vue 3 Docs — TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html) — официальная документация по `<TransitionGroup>`.
- [Vue 3 API — Transition](https://vuejs.org/api/built-in-components.html#transition) — API `<Transition>`.
- [Vue 3 API — TransitionGroup](https://vuejs.org/api/built-in-components.html#transitiongroup) — API `<TransitionGroup>`.
- [MDN — CSS transitions](https://developer.mozilla.org/ru/docs/Web/CSS/CSS_transitions) — основы CSS-переходов.
- [FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/) — статья о FLIP-технике.
- [React Transition Group](https://reactcommunity.org/react-transition-group/) — аналогичная библиотека для React.
- [Framer Motion](https://www.framer.com/motion/) — продвинутая библиотека анимаций для React.
- [GSAP](https://greensock.com/gsap/) — профессиональная JS-библиотека анимаций, которую можно использовать с Vue.
