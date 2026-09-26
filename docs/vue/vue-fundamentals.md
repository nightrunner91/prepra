---
title: "Основы Vue 3: SFC, шаблоны, директивы, компоненты"
section: vue
description: "Фундамент Vue 3 для подготовки к собеседованиям: SFC, директивы, компоненты, props, emits, v-model, условный рендеринг, списки и создание проекта через Vite. Основной фокус — Composition API и <script setup>."
order: 1
tags: ["vue", "vue3", "composition-api", "script-setup", "sfc", "directives", "components", "props", "emits", "v-model"]
questions:
  - "Чем Vue отличается от React и почему его называют прогрессивным фреймворком"
  - "Что такое SFC и из каких секций состоит .vue-файл"
  - "Как работают директивы v-bind, v-on, v-model, v-if, v-for, v-show"
  - "Чем v-if отличается от v-show и когда что использовать"
  - "Как передавать данные в дочерний компонент через props и почему props нельзя мутировать"
  - "Как дочерний компонент сообщает родителю о событии через emits"
  - "Что такое v-model и как он устроен под капотом"
  - "Зачем нужен :key при рендеринге списков и почему индекс — плохой выбор"
---

# Основы Vue 3: SFC, шаблоны, директивы, компоненты

Vue 3 — это прогрессивный JavaScript-фреймворк для построения пользовательских интерфейсов. Он сочетает декларативный подход к описанию UI, реактивную систему на основе Proxy и удобный компонентный подход через Single File Components (SFC). В отличие от React, где UI описывается в JSX как JavaScript-код, Vue использует HTML-подобные шаблоны с директивами, что многим разработчикам кажется более близким к классической вёрстке.

Эта статья — фундамент раздела `docs/vue/`. Мы разберём SFC-файлы, основные директивы, компоненты, передачу данных через `props`, события через `emits`, двустороннее связывание `v-model`, условный рендеринг и работу со списками. Основной стиль кода — Composition API с `<script setup>`, как того требует современная разработка на Vue 3. Options API будет показан как legacy-вариант, который всё ещё полезно уметь читать.

## Содержание

1. [Что такое Vue и зачем он нужен](#что-такое-vue-и-зачем-он-нужен)
2. [Создание проекта через Vite](#создание-проекта-через-vite)
3. [Single File Component](#single-file-component)
4. [Шаблоны и синтаксис](#шаблоны-и-синтаксис)
5. [Реактивное состояние: ref и reactive](#реактивное-состояние-ref-и-reactive)
6. [Директивы](#директивы)
7. [Компоненты, props и emits](#компоненты-props-и-emits)
8. [Условный рендеринг](#условный-рендеринг)
9. [Рендеринг списков](#рендеринг-списков)
10. [Вычисляемые свойства и watchers](#вычисляемые-свойства-и-watchers)
11. [Подъём состояния и передача данных вверх](#подъём-состояния-и-передача-данных-вверх)
12. [Options API как legacy](#options-api-как-legacy)
13. [Сравнение с React](#сравнение-с-react)
14. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
15. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
16. [Заключение](#заключение)
17. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Vue и зачем он нужен

### Прогрессивный фреймворк

Vue называют **прогрессивным фреймворком**, потому что его можно внедрять постепенно. Можно подключить Vue через CDN для оживления небольшого фрагмента страницы, а можно построить на нём полноценное SPA с роутингом, состоянием и SSR. Это отличает Vue от React, который позиционируется как библиотека для UI и обычно требует сборщика и экосистемы, и от Angular, который является монолитным фреймворком со своим мнением обо всём.

```html
<!-- Подключение Vue через CDN -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<div id="app">{{ message }}</div>
<script>
  const { createApp, ref } = Vue;
  createApp({
    setup() {
      const message = ref('Hello from Vue CDN!');
      return { message };
    }
  }).mount('#app');
</script>
```

### Декларативный UI через шаблоны

Как и React, Vue использует декларативный подход: вы описываете, как UI должен выглядеть при каждом состоянии, а фреймворк сам обновляет DOM. Но если React делает это через JSX-функции, Vue использует HTML-шаблоны с директивами:

```vue
<template>
  <button @click="increment">Count: {{ count }}</button>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
const increment = () => count.value++;
</script>
```

Здесь `{{ count }}` — интерполяция, а `@click` — сокращение для директивы `v-on:click`. Vue компилирует этот шаблон в оптимизированные render-функции, которые отслеживают зависимости и обновляют DOM точечно.

### Ключевые идеи Vue

**1. Реактивность из коробки**

Vue предоставляет `ref`, `reactive`, `computed`, `watch` — весь стек реактивности встроен во фреймворк. В React ту же задачу решают `useState`, `useEffect`, `useMemo`, `useCallback`, которые являются примитивами библиотеки.

**2. SFC — единый файл компонента**

Логика, шаблон и стили компонента живут в одном `.vue`-файле. Это упрощает навигацию по проекту и делает компонент самодостаточным.

**3. Директивы для типовых задач**

Условный рендеринг, циклы, связывание атрибутов и событий решаются через директивы `v-if`, `v-for`, `v-bind`, `v-on`, `v-model`. Это меньше boilerplate, чем в React, где те же задачи пишутся через JavaScript-выражения в JSX.

---

## Создание проекта через Vite

### Рекомендуемый способ

Для новых Vue 3 проектов рекомендуется официальный scaffolding-инструмент, основанный на Vite:

```bash
# Создать проект
npm create vue@latest my-vue-app

# Перейти в директорию
cd my-vue-app

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Интерактивный скрипт предложит выбрать TypeScript, JSX, Vue Router, Pinia, Vitest, ESLint, Prettier и другие опции.

### Альтернатива: Vite напрямую

```bash
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
npm install
npm run dev
```

### Структура проекта

```
my-vue-app/
├── public/                 # Статические файлы
├── src/
│   ├── assets/             # Изображения, шрифты, стили
│   ├── components/         # Переиспользуемые компоненты
│   ├── App.vue             # Корневой компонент
│   └── main.ts             # Точка входа
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Точка входа

```ts
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

Функция `createApp` создаёт экземпляр приложения. Ему можно подключать плагины, глобальные компоненты, директивы и middleware для ошибок.

---

## Single File Component

### Из чего состоит .vue-файл

SFC-файл состоит из трёх необязательных блоков:

```vue
<script setup>
// Логика компонента
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <!-- Разметка -->
  <button @click="count++">Count: {{ count }}</button>
</template>

<style scoped>
/* Стили, ограниченные этим компонентом */
button {
  color: #42b883;
}
</style>
```

**`<script setup>`** — синтаксический сахар для Composition API. Все top-level переменные и функции автоматически становятся доступны в шаблоне. Не нужно возвращать объект из `setup()`.

**`<template>`** — HTML-подобный шаблон с директивами и интерполяцией.

**`<style scoped>`** — стили применяются только к элементам текущего компонента. Vue добавляет уникальный data-атрибут к элементам и селекторам.

### Сравнение с React

В React логика и разметка смешаны в одном JSX-файле:

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

В Vue они разделены на `<script setup>`, `<template>` и `<style>` в одном файле. Это не «разделение технологий», а «разделение ответственности»: каждый блок отвечает за свою задачу.

### Порядок блоков

Официальный стиль: `<script setup>`, затем `<template>`, затем `<style>`. Некоторые команды предпочитают `<template>` первым. Главное — единообразие в проекте.

---

## Шаблоны и синтаксис

### Интерполяция текста

Для вывода текста используются двойные фигурные скобки:

```vue
<template>
  <p>Hello, {{ user.name }}!</p>
  <p>Next year you will be {{ user.age + 1 }}.</p>
</template>

<script setup>
const user = { name: 'Alice', age: 25 };
</script>
```

Внутри `{{ }}` можно использовать любые JavaScript-выражения, но не инструкции (`if`, `for`).

### Привязка атрибутов: v-bind

Для динамических атрибутов используется `v-bind`, сокращённо `:`:

```vue
<template>
  <img :src="imageUrl" :alt="description">
  <a :href="link">Read more</a>
  <button :disabled="isLoading">Submit</button>
</template>

<script setup>
const imageUrl = '/logo.png';
const description = 'Company logo';
const link = 'https://vuejs.org';
const isLoading = true;
</script>
```

Булевы атрибуты (`disabled`, `hidden`) при значении `false` удаляются из DOM.

### Привязка классов и стилей

Vue предоставляет удобный синтаксис для классов и стилей:

```vue
<template>
  <div :class="{ active: isActive, 'text-danger': hasError }">
    Dynamic classes
  </div>

  <div :style="{ color: textColor, fontSize: size + 'px' }">
    Dynamic styles
  </div>
</template>

<script setup>
const isActive = true;
const hasError = false;
const textColor = 'red';
const size = 16;
</script>
```

Можно передавать массив, объект или строку. Это удобнее, чем писать `className` с `clsx` в React.

### Обработка событий: v-on

Директива `v-on` сокращается до `@`:

```vue
<template>
  <button @click="handleClick">Click me</button>
  <input @input="handleInput" @focus="handleFocus">
</template>

<script setup>
const handleClick = () => console.log('clicked');
const handleInput = (event) => console.log(event.target.value);
const handleFocus = () => console.log('focused');
</script>
```

### Модификаторы событий

Vue предлагает модификаторы для частых случаев:

```vue
<template>
  <form @submit.prevent="submitForm">
    <input @keydown.enter="submit">
    <a @click.stop="doSomething">Click</a>
  </form>
</template>
```

- `.prevent` — вызывает `event.preventDefault()`
- `.stop` — вызывает `event.stopPropagation()`
- `.once` — обработчик сработает только один раз
- `.enter`, `.esc`, `.space` — срабатывают только на нужной клавише
- `.capture` — слушает событие на фазе захвата

В React ту же логику пишут вручную внутри обработчика.

---

## Реактивное состояние: ref и reactive

### ref

`ref` создаёт реактивную ссылку на примитивное или объектное значение:

```vue
<template>
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);

const increment = () => {
  count.value++;
};
</script>
```

В шаблоне Vue автоматически разворачивает `.value`, поэтому пишем `{{ count }}`, а не `{{ count.value }}`. Внутри `<script setup>` доступ к значению идёт через `count.value`.

### reactive

`reactive` создаёт реактивный прокси-объект:

```vue
<template>
  <p>{{ user.name }} — {{ user.age }} years old</p>
  <button @click="user.age++">Have birthday</button>
</template>

<script setup>
import { reactive } from 'vue';

const user = reactive({
  name: 'Alice',
  age: 25
});
</script>
```

С `reactive` не нужен `.value`, но есть ограничения: деструктуризация теряет реактивность, замена всего объекта требует `Object.assign`.

### Сравнение с React

| Vue | React |
|---|---|
| `ref(0)` | `useState(0)` |
| `count.value++` | `setCount(c => c + 1)` |
| `reactive({...})` | `useState({...})` с иммутабельным обновлением |

Подробнее реактивность разбирается в статье [Реактивность Vue](./vue-reactivity.md).

---

## Директивы

Директивы — это специальные атрибуты с префиксом `v-`, которые добавляют шаблонам реактивное поведение.

### v-model

`v-model` создаёт двустороннее связывание между состоянием и элементом формы:

```vue
<template>
  <input v-model="message">
  <p>You typed: {{ message }}</p>
</template>

<script setup>
import { ref } from 'vue';

const message = ref('');
</script>
```

Под капотом `v-model` — это сахар для:

```vue
<template>
  <input
    :value="message"
    @input="message = $event.target.value"
  >
</template>
```

#### Модификаторы v-model

```vue
<template>
  <!-- Убирает пробелы по краям -->
  <input v-model.trim="name">

  <!-- Преобразует в число -->
  <input v-model.number="age" type="number">

  <!-- Ленивая синхронизация по событию change -->
  <input v-model.lazy="description">
</template>
```

### v-if, v-else-if, v-else

Условный рендеринг: элементы действительно добавляются и удаляются из DOM:

```vue
<template>
  <div v-if="user.role === 'admin'">
    Admin panel
  </div>
  <div v-else-if="user.role === 'moderator'">
    Moderator tools
  </div>
  <div v-else>
    User dashboard
  </div>
</template>
```

### v-show

`v-show` только переключает CSS-свойство `display`:

```vue
<template>
  <p v-show="isVisible">This text is toggled via display</p>
</template>
```

**Когда что использовать:**
- `v-if` — если элемент редко переключается или тяжёлый при инициализации
- `v-show` — если элемент часто переключается, и его инициализация дорога

### v-for

Для рендеринга списков:

```vue
<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>

<script setup>
const todos = [
  { id: 1, text: 'Learn Vue' },
  { id: 2, text: 'Build app' },
  { id: 3, text: 'Deploy' }
];
</script>
```

Можно получить индекс:

```vue
<li v-for="(todo, index) in todos" :key="todo.id">
  {{ index + 1 }}. {{ todo.text }}
</li>
```

### v-html

Позволяет вставить HTML из строки:

```vue
<template>
  <div v-html="rawHtml"></div>
</template>

<script setup>
const rawHtml = '<strong>Bold text</strong>';
</script>
```

⚠️ **Опасно для XSS.** Используйте только для доверенного контента. Vue по умолчанию экранирует интерполяцию `{{ }}`, но `v-html` отключает эту защиту.

### v-text

Аналог интерполяции, но через директиву:

```vue
<span v-text="message"></span>
<!-- эквивалентно -->
<span>{{ message }}</span>
```

### v-once

Рендерит элемент один раз и пропускает его при последующих обновлениях:

```vue
<template>
  <p v-once>This will never update: {{ message }}</p>
</template>
```

Полезно для статичного контента, который не должен участвовать в реактивном обновлении.

---

## Компоненты, props и emits

### Определение компонента

Компонент — это переиспользуемый блок UI с собственным состоянием, шаблоном и стилями:

```vue
<!-- BaseButton.vue -->
<template>
  <button class="base-button" @click="handleClick">
    <slot>Default text</slot>
  </button>
</template>

<script setup>
const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click');
};
</script>

<style scoped>
.base-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

### Props

Props — это входные данные компонента. Они передаются сверху вниз и не должны мутироваться дочерним компонентом:

```vue
<!-- UserCard.vue -->
<template>
  <div class="user-card">
    <h2>{{ name }}</h2>
    <p>Age: {{ age }}</p>
    <span v-if="isActive">Active</span>
  </div>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    default: 18
  },
  isActive: {
    type: Boolean,
    default: false
  }
});
</script>
```

Использование:

```vue
<template>
  <UserCard name="Alice" :age="25" :is-active="true" />
</template>

<script setup>
import UserCard from './UserCard.vue';
</script>
```

**Важно:** `defineProps` — это макрос, доступный только внутри `<script setup>`. Его не нужно импортировать.

### Emits

Дочерний компонент сообщает родителю о событиях через `emit`:

```vue
<!-- CounterButton.vue -->
<template>
  <button @click="emit('increment', 1)">+1</button>
</template>

<script setup>
const emit = defineEmits(['increment']);
</script>
```

Родитель слушает событие:

```vue
<template>
  <CounterButton @increment="handleIncrement" />
  <p>Count: {{ count }}</p>
</template>

<script setup>
import { ref } from 'vue';
import CounterButton from './CounterButton.vue';

const count = ref(0);

const handleIncrement = (step) => {
  count.value += step;
};
</script>
```

### Валидация emits

```vue
<script setup>
const emit = defineEmits({
  increment: (step) => {
    if (typeof step !== 'number') {
      console.warn('increment payload must be a number');
      return false;
    }
    return true;
  }
});
</script>
```

### Слоты

Слоты позволяют передавать разметку внутрь компонента:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <h2><slot name="title">Default title</slot></h2>
    <div class="content"><slot>Default content</slot></div>
  </div>
</template>
```

```vue
<template>
  <Card>
    <template #title>Custom Title</template>
    <p>This is the main content.</p>
  </Card>
</template>
```

Слоты в Vue похожи на `children` в React, но более мощные: есть именованные слоты, scoped slots и fallback-контент.

---

## Условный рендеринг

### Тернарный оператор и v-if

В шаблоне Vue можно использовать как директивы, так и JavaScript-выражения:

```vue
<template>
  <p>{{ isLoggedIn ? 'Welcome back' : 'Please sign in' }}</p>

  <div v-if="isAdmin">
    <AdminPanel />
  </div>
  <div v-else-if="isModerator">
    <ModeratorPanel />
  </div>
  <div v-else>
    <UserPanel />
  </div>
</template>
```

### Условная группировка с template

Если нужно применить `v-if` к нескольким элементам без обёртки:

```vue
<template>
  <template v-if="isLoaded">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </template>
  <p v-else>Loading...</p>
</template>
```

Элемент `<template>` в Vue — это логическая обёртка, которая не рендерится в DOM, аналогично React Fragment `<>...</>`.

### v-if vs v-show

| | v-if | v-show |
|---|---|---|
| **Работа с DOM** | Монтирует/размонтирует элемент | Переключает `display: none` |
| **Начальная стоимость** | Выше, если изначально false | Выше, если изначально false, но элемент всегда монтируется |
| **Переключения** | Дороже | Дешевле |
| **Использование** | Редкие переключения, тяжёлые компоненты | Частые переключения, простые элементы |

---

## Рендеринг списков

### Базовый список

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
];
</script>
```

### Итерация по объекту

```vue
<template>
  <ul>
    <li v-for="(value, key, index) in user" :key="key">
      {{ index + 1 }}. {{ key }}: {{ value }}
    </li>
  </ul>
</template>

<script setup>
const user = { name: 'Alice', age: 25, role: 'admin' };
</script>
```

### v-for и v-if

Нельзя использовать `v-if` и `v-for` на одном элементе — `v-if` будет иметь более высокий приоритет во Vue 3. Рекомендуется вынести фильтрацию в вычисляемое свойство или обернуть во `<template>`:

```vue
<template>
  <ul>
    <template v-for="todo in visibleTodos" :key="todo.id">
      <li v-if="!todo.done">{{ todo.text }}</li>
    </template>
  </ul>
</template>

<script setup>
import { ref, computed } from 'vue';

const todos = ref([
  { id: 1, text: 'Learn Vue', done: false },
  { id: 2, text: 'Write tests', done: true }
]);

const visibleTodos = computed(() => todos.value.filter(t => !t.done));
</script>
```

### Зачем нужен :key

Атрибут `:key` помогает Vue отследить идентичность элементов в списке. Без него Vue использует in-place patch стратегию, что может приводить к багам с состоянием при добавлении, удалении или сортировке элементов.

```vue
<!-- ❌ Плохо: индекс как ключ -->
<li v-for="(item, index) in items" :key="index">

<!-- ✅ Хорошо: уникальный идентификатор -->
<li v-for="item in items" :key="item.id">
```

**Почему индекс плох:**

Если список изменяется, индексы элементов сдвигаются. Vue может переиспользовать DOM-элементы неправильно, что ломает фокус, анимации и внутреннее состояние input-ов.

---

## Вычисляемые свойства и watchers

### computed

`computed` создаёт кэшируемое производное состояние:

```vue
<template>
  <p>Full name: {{ fullName }}</p>
  <input v-model="firstName">
  <input v-model="lastName">
</template>

<script setup>
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});
</script>
```

`fullName` пересчитывается только при изменении `firstName` или `lastName`. В React аналог — `useMemo`.

### watch

`watch` следит за изменением реактивного значения и выполняет side-эффекты:

```vue
<template>
  <input v-model="searchQuery">
</template>

<script setup>
import { ref, watch } from 'vue';

const searchQuery = ref('');

watch(searchQuery, (newValue, oldValue) => {
  console.log('Search changed:', oldValue, '->', newValue);
});
</script>
```

В React аналог — `useEffect` с зависимостью.

---

## Подъём состояния и передача данных вверх

### Проблема общего состояния

Когда два компонента нуждаются в одних данных, состояние поднимается к ближайшему общему родителю:

```vue
<!-- Parent.vue -->
<template>
  <TemperatureInput v-model="temperature" />
  <TemperatureDisplay :value="temperature" />
</template>

<script setup>
import { ref } from 'vue';
import TemperatureInput from './TemperatureInput.vue';
import TemperatureDisplay from './TemperatureDisplay.vue';

const temperature = ref(20);
</script>
```

```vue
<!-- TemperatureInput.vue -->
<template>
  <input
    type="number"
    :value="modelValue"
    @input="emit('update:modelValue', Number($event.target.value))"
  >
</template>

<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>
```

```vue
<!-- TemperatureDisplay.vue -->
<template>
  <p>Temperature: {{ value }}°C</p>
</template>

<script setup>
const props = defineProps(['value']);
</script>
```

### v-model для компонентов

Предыдущий пример можно записать короче:

```vue
<!-- TemperatureInput.vue -->
<template>
  <input type="number" v-model="value">
</template>

<script setup>
const value = defineModel({ type: Number, default: 0 });
</script>
```

`defineModel` — макрос Vue 3.4+, который автоматически создаёт пропс `modelValue` и событие `update:modelValue`.

---

## Options API как legacy

До Vue 3 компоненты писали через Options API:

```vue
<template>
  <button @click="increment">Count: {{ count }}</button>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  }
};
</script>
```

В Options API логика разбита по опциям: `data`, `methods`, `computed`, `watch`, `props`, `emits`. Это удобно для небольших компонентов, но плохо масштабируется: связанная логика размазывается по разным секциям.

**Когда встречается Options API:**
- Старые проекты на Vue 2
- Библиотеки, которые ещё не перешли на Composition API
- Код, который нужно прочитать при миграции

**Современный подход:** всегда используйте `<script setup>` + Composition API для новых компонентов.

---

## Сравнение с React

| Аспект | Vue 3 | React |
|---|---|---|
| **Синтаксис UI** | HTML-шаблоны + директивы | JSX — JavaScript-выражения |
| **Состояние** | `ref`, `reactive` | `useState`, `useReducer` |
| **Производное состояние** | `computed` | `useMemo` |
| **Side-эффекты** | `watch`, `watchEffect` | `useEffect` |
| **Компоненты** | SFC: `<script>`, `<template>`, `<style>` | JSX-функции в одном файле |
| **События** | `emits` + `v-on` | Callback-пропсы + `onEvent` |
| **Двустороннее связывание** | `v-model` | Контролируемый компонент вручную |
| **Условный рендеринг** | `v-if`, `v-show` | `&&`, `? :`, `if` в JSX |
| **Списки** | `v-for` + `:key` | `.map()` + `key` |
| **Стили** | `<style scoped>` | CSS Modules, CSS-in-JS, Tailwind |

Vue и React решают схожие задачи, но с разными акцентами. Vue делает типовые паттерны более лаконичными за счёт директив и встроенной реактивности. React предоставляет больше гибкости за счёт того, что UI — это чистый JavaScript.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте `<script setup>` и Composition API для новых компонентов.
- Всегда указывайте `:key` при `v-for` с уникальным идентификатором.
- Декомпозируйте логику в composables, начиная с 200–300 строк в компоненте.
- Валидируйте `props` и документируйте их типы.
- Используйте `v-show` для частых переключений, `v-if` для редких.
- Предпочитайте `computed` вместо сложных выражений в шаблоне.

### ❌ Не делайте

- Не мутируйте `props` в дочернем компоненте.
- Не используйте `v-html` для пользовательского контента без санитизации.
- Не ставьте `v-if` и `v-for` на один элемент.
- Не используйте индекс массива как `:key` для изменяемых списков.
- Не смешивайте Options API и Composition API без необходимости.

---

## Ключевые тезисы для интервью

- Vue 3 — прогрессивный фреймворк с декларативными шаблонами, встроенной реактивностью и SFC. Основной API для новых проектов — Composition API с `<script setup>`.
- SFC-файл состоит из `<script setup>`, `<template>` и `<style scoped>`. Логика, разметка и стили компонента живут в одном файле, но разделены по блокам.
- `ref` создаёт реактивную ссылку с доступом через `.value` в скрипте и автоматическим разворачиванием в шаблоне; `reactive` создаёт реактивный прокси-объект.
- Директивы `v-bind` (`:`), `v-on` (`@`), `v-model`, `v-if`/`v-else`, `v-for`, `v-show` решают типовые задачи шаблонизации с минимумом boilerplate.
- `v-model` — синтаксический сахар для пропса `modelValue` + события `update:modelValue`; в компонентах его можно использовать через `defineModel`.
- `props` передаются сверху вниз и иммутабельны; дочерний компонент сообщает родителю о событиях через `defineEmits` и `emit`.
- `v-if` добавляет/удаляет элемент из DOM, `v-show` только переключает `display`. `v-if` дороже при переключении, `v-show` дороже при первой инициализации, если элемент скрыт.
- `:key` в `v-for` нужен для корректного отслеживания элементов при изменении списка; индекс массива подходит только для статичных списков.
- `computed` кэширует производное состояние; `watch` выполняет side-эффекты при изменении зависимости.
- Options API — legacy-подход, который всё ещё встречается в Vue 2 и старых проектах, но новый код пишется на Composition API.

---

## Заключение

Vue 3 предлагает мощный и лаконичный способ строить пользовательские интерфейсы. В этой статье мы разобрали фундамент: SFC, шаблоны, основные директивы, компоненты, `props`, `emits`, `v-model`, условный рендеринг и работу со списками. Это база, без которой невозможно двигаться к продвинутым темам: реактивности, Composition API, роутингу, Suspense и TypeScript.

В следующих статьях раздела мы углубимся в реактивную систему Vue, жизненный цикл компонентов, Vue Router, обработку ошибок и оптимизацию производительности. Но понимание основ, описанных здесь, — обязательный минимум для уверенного прохождения собеседований по Vue.

Создайте тестовый проект через `npm create vue@latest`, поэкспериментируйте с директивами и компонентами. Практика закрепляет теорию гораздо лучше, чем одно чтение.

---

## Полезные ссылки

- [Vue.js Documentation](https://vuejs.org/) — официальная документация Vue 3
- [Vue.js Tutorial](https://vuejs.org/tutorial/) — интерактивный туториал от авторов фреймворка
- [Vue SFC Playground](https://play.vuejs.org/) — онлайн-песочница для Vue SFC
- [Create Vue](https://github.com/vuejs/create-vue) — официальный scaffolding-инструмент
- [Vite](https://vitejs.dev/) — быстрый сборщик, используемый под капотом create-vue
- [Vue Style Guide](https://vuejs.org/style-guide/) — официальные рекомендации по стилю кода
