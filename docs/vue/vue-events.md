---
title: "События во Vue"
section: vue
description: "Обработка событий во Vue 3: директива v-on и модификаторы, компонентные события через emits, нативные события на компонентах, v-model как сахар для пропса + события. Composition API и <script setup>."
order: 6
tags: ["vue", "vue3", "composition-api", "script-setup", "events", "v-on", "emits", "v-model", "modifiers", "native-events"]
questions:
  - "Как работает директива v-on и чем отличается метод-обработчик от inline-выражения"
  - "Как получить объект события в обработчике и что такое $event"
  - "Какие модификаторы событий есть во Vue и как они комбинируются"
  - "Как компонент сообщает родителю о событии через defineEmits"
  - "Почему нельзя мутировать props и как v-model решает задачу двустороннего связывания"
  - "Как подписаться на нативное событие внутри компонента, если оно не объявлено в emits"
  - "Чем обработка событий в Vue отличается от React SyntheticEvent"
  - "Какие антипаттерны встречаются при работе с событиями во Vue"
---

# События во Vue

События — основной способ взаимодействия пользователя с интерфейсом и коммуникации компонентов. Во Vue за обработку событий отвечает директива `v-on`, сокращённо `@`. Она позволяет подписываться на нативные DOM-события, отправлять собственные события между компонентами и использовать декларативные модификаторы для типовых задач.

Эта статья посвящена событиям во Vue 3 с акцентом на Composition API и `<script setup>`. Мы разберём `v-on` и её модификаторы, компонентные события через `emits`, нативные события на компонентах, а также посмотрим, как устроен `v-model` под капотом. Options API упоминается как legacy-вариант, который полезно уметь читать.

## Содержание

1. [Директива `v-on`](#директива-v-on)
2. [Объект события и `$event`](#объект-события-и-event)
3. [Модификаторы событий](#модификаторы-событий)
4. [Модификаторы клавиш](#модификаторы-клавиш)
5. [Нативные события на компонентах](#нативные-события-на-компонентах)
6. [Компонентные события через `emits`](#компонентные-события-через-emits)
7. [`v-model` как сахар для события](#v-model-как-сахар-для-события)
8. [Несколько `v-model` и кастомные модификаторы](#несколько-v-model-и-кастомные-модификаторы)
9. [Паттерны коммуникации компонентов](#паттерны-коммуникации-компонентов)
10. [Глобальные события](#глобальные-события)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Сравнение с React](#сравнение-с-react)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

---

## Директива `v-on`

`v-on` подписывается на DOM-события. Полная форма — `v-on:click="handler"`, сокращённая — `@click="handler"`.

### Inline-обработчик

Простые действия можно писать прямо в шаблоне:

```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

Если логика разрастается, лучше вынести её в функцию.

### Метод-обработчик

Если значением атрибута является имя функции, Vue вызовет её с объектом события:

```vue
<script setup>
function greet(event) {
  console.log(event.target); // <button>
}
</script>

<template>
  <button @click="greet">Greet</button>
</template>
```

Важно не вызывать функцию в шаблоне самостоятельно: `@click="greet()"` — это уже inline-вызов, и Vue не передаст объект события без `$event`.

### Аргументы и `$event`

Если нужно передать собственные данные вместе с событием, используется `$event`:

```vue
<script setup>
function submit(item, event) {
  console.log(item.id);
  event.preventDefault();
}
</script>

<template>
  <button @click="submit(product, $event)">Buy</button>
</template>
```

`$event` — это Vue-способ получить DOM-событие внутри inline-выражения. В метод-обработчике событие передаётся автоматически.

### Несколько обработчиков

Несколько действий разделяются точкой с запятой:

```vue
<template>
  <button @click="trackAnalytics(); increment()">Click</button>
</template>
```

---

## Объект события и `$event`

В Vue обработчики нативных событий получают **нативный DOM-объект события**, а не синтетическую обёртку. Это ключевое отличие от React.

```vue
<script setup>
function logEvent(event) {
  console.log(event.type);          // 'click'
  console.log(event.target);        // элемент, инициировавший событие
  console.log(event.currentTarget); // элемент, на котором висит обработчик
}
</script>

<template>
  <button @click="logEvent">Log</button>
</template>
```

### `target` vs `currentTarget`

- `event.target` — элемент, на котором фактически произошло событие.
- `event.currentTarget` — элемент, к которому привязан обработчик.

```vue
<template>
  <button @click="handleClick">
    <span>Click me</span>
  </button>
</template>
```

При клике на `<span>` `target` будет `<span>`, а `currentTarget` — `<button>`.

### `$event` в inline-обработчике

```vue
<template>
  <input @input="text = $event.target.value" />
</template>
```

Это эквивалентно:

```vue
<script setup>
const text = ref('');
function onInput(event) {
  text.value = event.target.value;
}
</script>

<template>
  <input @input="onInput" />
</template>
```

---

## Модификаторы событий

Vue предоставляет декларативные модификаторы для типовых задач.

| Модификатор | Действие |
|---|---|
| `.stop` | `event.stopPropagation()` |
| `.prevent` | `event.preventDefault()` |
| `.capture` | Фаза захвата |
| `.self` | Только если target === currentTarget |
| `.once` | Выполнить один раз |
| `.passive` | Не вызывать `preventDefault` |

Примеры:

```vue
<template>
  <form @submit.prevent="handleSubmit">...</form>
  <div @click="handleOuter">
    <button @click.stop="handleInner">Click</button>
  </div>
  <div @click.capture="handleCapture">
    <button @click="handleTarget">Click</button>
  </div>
  <div @click.self="handleDiv">
    <button>Click me</button>
  </div>
  <button @click.once="trackFirstClick">Track once</button>
  <div @scroll.passive="handleScroll">...</div>
</template>
```

### Цепочки модификаторов

Модификаторы можно комбинировать:

```vue
<template>
  <a @click.stop.prevent="handleLink">Link</a>
</template>
```

Порядок важен: `@click.prevent.self` предотвратит действие по умолчанию только при клике по самому элементу, а `@click.self.prevent` сначала проверит `self`, затем вызовет `preventDefault`.

### Модификаторы кнопок мыши

```vue
<template>
  <div @click.right="showContextMenu">Right click me</div>
</template>
```

---

## Модификаторы клавиш

Для событий клавиатуры Vue предоставляет псевдонимы.

### Встроенные псевдонимы

```vue
<template>
  <input @keyup.enter="submit" />
  <input @keyup.esc="cancel" />
  <input @keyup.tab="nextField" />
</template>
```

Полный список: `.enter`, `.tab`, `.delete` (Delete и Backspace), `.esc`, `.space`, `.up`, `.down`, `.left`, `.right`.

### Системные модификаторы и `.exact`

```vue
<template>
  <input @keyup.ctrl.enter="submit" />
  <button @click.shift="handleShiftClick">Shift + click</button>
  <!-- только Ctrl + click, без других модификаторов -->
  <button @click.ctrl.exact="handleExactCtrl">Exact Ctrl</button>
</template>
```

Системные модификаторы: `.ctrl`, `.alt`, `.shift`, `.meta`.

### Произвольные клавиши

```vue
<template>
  <input @keyup.page-down="nextPage" />
  <input @keyup.arrow-up="moveUp" />
</template>
```

В Vue 3 рекомендуется использовать `KeyboardEvent.key` в kebab-case. Числовые `keyCode` больше не поддерживаются.

---

## Нативные события на компонентах

Когда на компонент вешается слушатель, Vue пытается понять, является ли событие компонентным или нативным.

### `emits` определяет пользовательские события

Если событие объявлено в `defineEmits` или `emits`, Vue считает его компонентным.

```vue
<!-- Child.vue -->
<script setup>
const emit = defineEmits(['submit']);
function handleClick() {
  emit('submit', { id: 1 });
}
</script>

<template>
  <button @click="handleClick">Submit</button>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Child @submit="onChildSubmit" />
</template>
```

`@submit` здесь — компонентное событие, а не нативное `submit` формы.

### Fallthrough-атрибуты

Если событие не объявлено в `emits`, Vue считает его нативным и добавляет слушатель на корневой элемент компонента:

```vue
<!-- BaseButton.vue -->
<template>
  <button>Click me</button>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <BaseButton @click="handleClick" />
</template>
```

`@click` автоматически пробросится на `<button>` внутри `BaseButton`.

### `.native` удалён в Vue 3

Во Vue 2 был модификатор `.native`, который принудительно привязывал событие к корневому DOM-элементу. В Vue 3 он не нужен: необъявленное событие и так считается нативным.

### `inheritAttrs`

Для полного контроля над пробросом атрибутов используется `inheritAttrs: false` и `$attrs`:

```vue
<script setup>
defineOptions({
  inheritAttrs: false,
});
</script>

<template>
  <div>
    <button v-bind="$attrs">Click</button>
  </div>
</template>
```

`$attrs` содержит все fallthrough-атрибуты, включая обработчики нативных событий.

---

## Компонентные события через `emits`

Компонентные события — способ сообщить родителю, что в дочернем компоненте что-то произошло. Это аналог callback-пропсов в React.

### `defineEmits` в `<script setup>`

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue';

const count = ref(0);
const emit = defineEmits(['increment']);

function increment() {
  count.value++;
  emit('increment', count.value);
}
</script>

<template>
  <button @click="increment">+</button>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
function onIncrement(value) {
  console.log('New count:', value);
}
</script>

<template>
  <Counter @increment="onIncrement" />
</template>
```

### Валидация событий

Можно объявлять события массивом строк или объектом с валидаторами:

```vue
<script setup>
const emit = defineEmits({
  submit: (payload) => payload && typeof payload.email === 'string',
  cancel: null,
  change: (value) => typeof value === 'number',
});
</script>
```

Если валидатор вернёт `false`, Vue выведет предупреждение в dev-режиме.

### Options API

В Options API события объявляются через опцию `emits`, а для отправки используется `this.$emit`:

```vue
<script>
export default {
  emits: ['submit'],
  methods: {
    handleSubmit() {
      this.$emit('submit', { id: 1 });
    },
  },
};
</script>
```

### Именование событий

Рекомендуется использовать `kebab-case` для имён событий в шаблонах:

```vue
<template>
  <Child @update-value="handleUpdate" />
</template>
```

---

## `v-model` как сахар для события

`v-model` — синтаксический сахар для связки prop + событие. По умолчанию это `modelValue` и `update:modelValue`.

### Нативный input

```vue
<script setup>
import { ref } from 'vue';
const text = ref('');
</script>

<template>
  <input v-model="text" />
</template>
```

Это эквивалентно:

```vue
<template>
  <input :value="text" @input="text = $event.target.value" />
</template>
```

### `v-model` на компоненте

```vue
<CustomInput v-model="text" />
```

Это то же самое, что:

```vue
<CustomInput
  :modelValue="text"
  @update:modelValue="text = $event"
/>
```

Реализация внутри компонента:

```vue
<!-- CustomInput.vue -->
<script setup>
defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
```

### Не мутируйте props

Следующий код антипаттерн:

```vue
<script setup>
const props = defineProps(['modelValue']);
</script>

<template>
  <!-- ❌ мутируем prop напрямую -->
  <input v-model="props.modelValue" />
</template>
```

Props должны оставаться иммутабельными. Вместо мутации отправляйте событие.

### Computed getter/setter

Удобный паттерн — локальный computed:

```vue
<script setup>
import { computed } from 'vue';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <input v-model="localValue" />
</template>
```

---

## Несколько `v-model` и кастомные модификаторы

### Именованный `v-model`

```vue
<!-- Parent.vue -->
<template>
  <UserForm v-model:first-name="firstName" v-model:last-name="lastName" />
</template>
```

Внутри компонента:

```vue
<!-- UserForm.vue -->
<script setup>
defineProps(['firstName', 'lastName']);
const emit = defineEmits(['update:firstName', 'update:lastName']);
</script>

<template>
  <input :value="firstName" @input="emit('update:firstName', $event.target.value)" />
  <input :value="lastName" @input="emit('update:lastName', $event.target.value)" />
</template>
```

### Встроенные модификаторы

| Модификатор | Действие |
|---|---|
| `.lazy` | Событие `change` вместо `input` |
| `.number` | Приводит значение к числу |
| `.trim` | Обрезает пробелы по краям |

```vue
<template>
  <input v-model.trim="text" />
  <input v-model.number="age" type="number" />
  <input v-model.lazy="description" />
</template>
```

### Кастомные модификаторы

```vue
<!-- MyInput.vue -->
<script setup>
const props = defineProps({
  modelValue: String,
  modelModifiers: { default: () => ({}) },
});

const emit = defineEmits(['update:modelValue']);

function emitValue(event) {
  let value = event.target.value;
  if (props.modelModifiers.capitalize) {
    value = value.charAt(0).toUpperCase() + value.slice(1);
  }
  emit('update:modelValue', value);
}
</script>

<template>
  <input :value="modelValue" @input="emitValue" />
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <MyInput v-model.capitalize="title" />
</template>
```

---

## Паттерны коммуникации компонентов

### Props down, events up

Основной паттерн: родитель передаёт данные вниз через props, ребёнок сообщает о изменениях вверх через события.

```vue
<!-- Parent.vue -->
<script setup>
import { ref } from 'vue';
const isOpen = ref(false);
</script>

<template>
  <Modal :open="isOpen" @close="isOpen = false" />
  <button @click="isOpen = true">Open modal</button>
</template>
```

```vue
<!-- Modal.vue -->
<script setup>
defineProps(['open']);
const emit = defineEmits(['close']);
</script>

<template>
  <div v-if="open" class="modal">
    <button @click="emit('close')">Close</button>
  </div>
</template>
```

### Event bus устарел

Во Vue 2 использовался пустой экземпляр Vue как шина событий. В Vue 3 это не работает, потому что экземпляр приложения больше не реализует паттерн Observer. Альтернативы:

- `provide`/`inject` для зависимостей.
- Внешние библиотеки вроде `mitt`.
- Глобальное состояние через Pinia.

### `mitt`

```js
// eventBus.js
import mitt from 'mitt';
export const emitter = mitt();
```

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { emitter } from './eventBus';

function onNotify(message) {
  console.log(message);
}

onMounted(() => emitter.on('notify', onNotify));
onUnmounted(() => emitter.off('notify', onNotify));
</script>
```

---

## Глобальные события

Для событий `window` или `document` подписывайтесь вручную и отписывайтесь в `onUnmounted`:

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

function onResize() {
  console.log('window resized');
}

onMounted(() => window.addEventListener('resize', onResize));
onUnmounted(() => window.removeEventListener('resize', onResize));
</script>
```

Часто такую логику выносят в composable:

```js
// useEventListener.js
import { onMounted, onUnmounted } from 'vue';

export function useEventListener(target, event, callback) {
  onMounted(() => target.addEventListener(event, callback));
  onUnmounted(() => target.removeEventListener(event, callback));
}
```

```vue
<script setup>
import { useEventListener } from './useEventListener';
useEventListener(window, 'resize', () => console.log('resized'));
</script>
```


---

## Лучшие практики и антипаттерны

- **Всегда объявляйте `emits`.** Это делает контракт компонента понятным и помогает Vue отличать компонентные и нативные события.
- **Не мутируйте props.** Отправляйте событие, чтобы родитель обновил состояние.
- **Не пишите сложную логику в inline-обработчиках.** Выносите её в методы или composables.
- **Используйте модификаторы вместо ручных вызовов.** `@submit.prevent` короче и декларативнее, чем `event.preventDefault()`.
- **Осторожно с event bus.** Он усложняет отслеживание потока данных. Предпочитайте props/emits, `provide`/`inject` или Pinia.
- **Дебаунс и троттлинг.** Для частых событий (`scroll`, `resize`, `input`) используйте дебаунс.
- **Именование событий.** Используйте kebab-case в шаблонах.
- **Отписывайтесь от глобальных событий.** Иначе возможны утечки памяти.


---

## Сравнение с React

### Синтетические vs нативные события

В React обработчики получают `SyntheticEvent`. Во Vue — нативный DOM-объект.

```jsx
// React
function handleClick(e) {
  e.preventDefault();
  console.log(e.nativeEvent);
}
```

```vue
<!-- Vue -->
<script setup>
function handleClick(event) {
  event.preventDefault();
  console.log(event);
}
</script>
```

### Делегирование

React использует делегирование на корневом контейнере. Vue компилирует обработчики непосредственно на элементы.

### Модификаторы

У React нет встроенных модификаторов. Во Vue типовые случаи покрыты декларативно.

### Callback-пропсы vs emits

React: `<Child onUpdate={handleUpdate} />`. Vue: `<Child @update="handleUpdate" />`. Vue строго разделяет входящие данные и исходящие события.

### Controlled inputs

React: `<input value={text} onChange={(e) => setText(e.target.value)} />`.

Vue: `<input v-model="text" />`. Под капотом — prop + событие.

---

## Ключевые тезисы для интервью

1. `v-on` и `@` подписываются на события. Обработчик может быть inline-выражением или методом.
2. Метод-обработчик получает нативное событие; в inline-выражении для доступа к нему используется `$event`.
3. Vue предоставляет модификаторы `.stop`, `.prevent`, `.capture`, `.self`, `.once`, `.passive` и модификаторы клавиш/мыши.
4. Компонентные события объявляются через `defineEmits` в `<script setup>` или `emits` в Options API.
5. Необъявленные события становятся fallthrough-атрибутами и привязываются к корневому DOM-элементу.
6. `v-model` — сахар для `:modelValue` + `@update:modelValue`. Именованные `v-model` используют другие имена.
7. Props нельзя мутировать. Для двустороннего связывания используется событие `update:modelValue`.
8. Валидация `emits` помогает зафиксировать контракт компонента.
9. Во Vue обработчики работают с нативными DOM-событиями, а не SyntheticEvent.
10. Глобальные события на `window`/`document` требуют отписки в `onUnmounted`.

---

## Заключение

События во Vue — лаконичный и декларативный механизм. `v-on` с модификаторами покрывает большинство типовых задач, `emits` делает контракт компонента явным, а `v-model` сокращает паттерн "prop + событие" до одной директивы.

Для собеседований важно понимать разницу между компонентными и нативными событиями, знать, почему props нельзя мутировать, и чем обработка событий в Vue отличается от React.

---

## Полезные ссылки

- [Vue 3 — Event Handling](https://vuejs.org/guide/essentials/event-handling.html)
- [Vue 3 — Component Events](https://vuejs.org/guide/components/events.html)
- [Vue 3 — v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue 3 — Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html)
- [Mitt — tiny event emitter](https://github.com/developit/mitt)
- [VueUse — useEventListener](https://vueuse.org/core/useEventListener/)
