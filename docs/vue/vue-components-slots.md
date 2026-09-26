---
title: "Компоненты, слоты и композиция"
section: vue
description: "Продвинутая композиция компонентов во Vue 3: слоты (default, named, scoped), render-функции и h(), динамические компоненты, keep-alive и teleport. Composition API и <script setup>."
order: 7
tags: ["vue", "vue3", "composition-api", "script-setup", "slots", "scoped-slots", "render-functions", "h", "keep-alive", "teleport", "dynamic-components"]
questions:
  - "Чем default slot отличается от named slot и как передать несколько слотов"
  - "Что такое scoped slot и зачем передавать данные из дочернего компонента в слот"
  - "Как написать render-функцию в Vue и когда она нужна вместо шаблона"
  - "Чем h() отличается от JSX во Vue и как типизировать render-функцию"
  - "Как работает <component :is> и для чего используются динамические компоненты"
  - "Что делает <KeepAlive> и какие lifecycle-хуки он добавляет"
  - "Когда использовать <Teleport> и какие ограничения у него есть"
  - "Как композиция компонентов во Vue сравнивается с React: children, render props, portals"
---

# Компоненты, слоты и композиция

Vue строит интерфейс из компонентов, но «состоит из компонентов» — ещё не значит «хорошо скомпонован». Настоящая гибкость появляется тогда, когда компонент умеет делегировать часть своей разметки родителю через слоты, менять тип выводимого элемента на лету, сохранять состояние при переключении вкладок или выносить кусок UI за пределы своего DOM-дерева. В этой статье мы разбираем именно эти механизмы композиции: слоты, render-функции, динамические компоненты, `<KeepAlive>` и `<Teleport>`.

Мы будем использовать Composition API и `<script setup>` как основной стиль. Options API упомянем только там, где это нужно для чтения legacy-кода. Каждая тема сопровождается примерами, сравнением с React и практическими советами, которые можно использовать на собеседованиях и в реальных проектах.

## Содержание

1. [Почему композиция важна](#почему-композиция-важна)
2. [Слоты: default, named и scoped](#слоты-default-named-и-scoped)
3. [Render-функции и `h()`](#render-функции-и-h)
4. [JSX во Vue](#jsx-во-vue)
5. [Динамические компоненты `<component :is>`](#динамические-компоненты-component-is)
6. [`<KeepAlive>` — сохранение состояния](#keepalive--сохранение-состояния)
7. [`<Teleport>` — рендеринг в другой узел DOM](#teleport--рендеринг-в-другой-узел-dom)
8. [Сравнение с React](#сравнение-с-react)
9. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
10. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
11. [Заключение](#заключение)
12. [Полезные ссылки](#полезные-ссылки)

---

## Почему композиция важна

Компонент во Vue — это замыкание, в котором живут данные, шаблон и стили. Но если компонент всё решает сам, он быстро становится монолитом. Хороший компонент декларирует структуру и поведение, но позволяет внешнему коду подставлять содержимое, стилизацию или дочерние элементы.

Vue предоставляет несколько механизмов для такой композиции:

| Механизм | Что делает | Типичный сценарий |
|---|---|---|
| **Slots** | Дочерний компонент получает разметку от родителя | Карточка с настраиваемым заголовком и телом |
| **Scoped slots** | Дочерний компонент передаёт данные в слот родителя | Таблица, список, слайдер, где родитель решает, как отрисовать элемент |
| **Render-функции / `h()`** | Компонент строит VNode вручную | Абстрактные обёртки, высокоуровневые библиотеки, сложная условная логика |
| **`<component :is>`** | Меняет рендеримый компонент по значению | Табы, мастеры, динамические формы |
| **`<KeepAlive>`** | Кэширует экземпляр компонента при размонтировании | Вкладки, многошаговые формы, переключатели представлений |
| **`<Teleport>`** | Рендерит содержимое в другой узел DOM | Модальные окна, тултипы, toast-уведомления |

Все эти инструменты работают вместе и позволяют строить интерфейсы, которые легко расширять без изменения исходного компонента.

---

## Слоты: default, named и scoped

Слоты — это механизм, с помощью которого родительский компонент передаёт дочернему разметку, которую тот вставляет в своём шаблоне. Это аналог `children` в React, но со встроенной поддержкой именованных и scoped-слотов.

### Default slot

Если в дочернем компоненте написать `<slot></slot>`, туда попадёт всё содержимое, переданное между открывающим и закрывающим тегом компонента.

```vue
<!-- BaseCard.vue -->
<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}
</style>
```

```vue
<!-- Parent.vue -->
<template>
  <BaseCard>
    <h3>Заголовок</h3>
    <p>Текст карточки</p>
  </BaseCard>
</template>
```

Всё, что оказалось внутри `<BaseCard>`, будет вставлено вместо `<slot></slot>`.

### Fallback-контент

Слот может иметь содержимое по умолчанию, которое отобразится, если родитель ничего не передал.

```vue
<template>
  <button class="btn">
    <slot>Подтвердить</slot>
  </button>
</template>
```

```vue
<template>
  <BaseButton />                       <!-- "Подтвердить" -->
  <BaseButton>Сохранить</BaseButton>  <!-- "Сохранить" -->
</template>
```

### Named slots

Компонент может иметь несколько слотов с именами. Родитель использует `<template v-slot:name>` или сокращение `#name`.

```vue
<!-- BaseLayout.vue -->
<template>
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <BaseLayout>
    <template #header>
      <h1>Логотип</h1>
    </template>

    <p>Основной контент</p>

    <template #footer>
      <p>© 2026</p>
    </template>
  </BaseLayout>
</template>
```

| Синтаксис | Значение |
|---|---|
| `v-slot:header` | Полная форма для named slot |
| `#header` | Сокращение от `v-slot:header` |
| `v-slot:default` | Явное указание default slot |
| `#default="{ data }"` | Scoped slot с деструктуризацией |

### Scoped slots

Иногда дочерний компонент хочет предоставить родителю не только место для вставки, но и данные, которые родитель может использовать при рендеринге. Это называется scoped slot.

```vue
<!-- UserList.vue -->
<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);

onMounted(async () => {
  const res = await fetch('/api/users');
  users.value = await res.json();
});
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <slot :user="user" :isActive="user.status === 'active'">
        {{ user.name }}
      </slot>
    </li>
  </ul>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <UserList v-slot="{ user, isActive }">
    <span :class="{ active: isActive }">
      {{ user.name }} ({{ user.email }})
    </span>
  </UserList>
</template>
```

В этом примере `UserList` отвечает за загрузку данных и итерацию, а родитель решает, как отрисовывать каждый элемент. Это мощный паттерн разделения ответственности.

### Деструктуризация и переименование

Vue позволяет деструктурировать scoped slot props прямо в шаблоне:

```vue
<template>
  <UserList v-slot="{ user: person, isActive }">
    <span>{{ person.name }}</span>
  </UserList>
</template>
```

Здесь `user` переименован в `person` для локального использования.

### Scoped slot с несколькими слотами

Если в компоненте несколько named слотов, каждый из них может иметь свои scoped props:

```vue
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr>
        <slot name="header" :columns="columns"></slot>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <slot name="row" :row="row"></slot>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <DataTable :columns="columns" :rows="rows">
    <template #header="{ columns }">
      <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
    </template>

    <template #row="{ row }">
      <td>{{ row.name }}</td>
      <td>{{ row.role }}</td>
    </template>
  </DataTable>
</template>
```

### Доступ к слотам из setup

Внутри `<script setup>` слоты доступны через макрос `useSlots()`:

```vue
<script setup>
import { useSlots } from 'vue';

const slots = useSlots();

function hasHeader() {
  return Boolean(slots.header);
}
</script>
```

Это полезно, когда компоненту нужно проверить, передан ли слот, и изменить поведение или классы.

### Слоты и доступ к DOM

Если нужно передать ссылку на DOM-элемент или компонент через слот, используйте template refs в родителе:

```vue
<script setup>
import { ref, onMounted } from 'vue';

const slotContent = ref(null);

onMounted(() => {
  console.log(slotContent.value);
});
</script>

<template>
  <Child>
    <input ref="slotContent" />
  </Child>
</template>
```

---

## Render-функции и `h()`

Шаблоны Vue компилируются в render-функции, которые возвращают виртуальные узлы — VNode. В большинстве случаев шаблон удобнее, но иногда нужна максимальная гибкость: условная логика, динамические теги, создание компонентов на лету, библиотеки UI-китов.

### Функция `h()`

`h()` — это хелпер для создания VNode. Она принимает:

```ts
h(type, props, children);
```

| Аргумент | Тип | Описание |
|---|---|---|
| `type` | `string` \| `Component` \| `VNode` | HTML-тег, Vue-компонент или символ |
| `props` | `object` \| `null` | Атрибуты, пропсы, события, директивы |
| `children` | `string` \| `number` \| `VNode` \| `Array` | Дочерние узлы |

Простой пример:

```vue
<script setup>
import { h } from 'vue';

const vnode = h('div', { class: 'box' }, 'Hello');
// <div class="box">Hello</div>
</script>
```

### Render-функция в компоненте

Компонент может вернуть render-функцию из `setup()`:

```vue
<script>
import { h, ref } from 'vue';

export default {
  setup() {
    const count = ref(0);

    return () => h('button', {
      onClick: () => count.value++,
    }, `Count: ${count.value}`);
  },
};
</script>
```

Важно: возвращаемая функция должна быть стрелочной или обычной функцией, которая вызывается при каждом рендере. Внутри неё можно использовать реактивные значения — Vue отследит зависимости автоматически.

### Render-функция в `<script setup>`

В `<script setup>` нельзя вернуть render-функцию напрямую, потому что нет явного `return`. Но можно использовать экспорт по умолчанию через `defineOptions` или вынести render-функцию в отдельный `.js/.ts` файл. На практике render-функции в `<script setup>` редки — их чаще пишут в обычном `<script>` или в composable.

```vue
<script>
import { h } from 'vue';

export default {
  setup(props, { slots }) {
    return () => h('div', { class: 'wrapper' }, slots.default?.());
  },
};
</script>
```

### Условный рендеринг в render-функциях

Поскольку render-функция — это обычный JavaScript, вся логика пишется через `if`, `switch`, тернарные операторы:

```vue
<script>
import { h, ref } from 'vue';

export default {
  props: ['variant'],
  setup(props) {
    const count = ref(0);

    return () => {
      const tag = props.variant === 'primary' ? 'button' : 'a';
      return h(tag, {
        class: ['btn', `btn--${props.variant}`],
        onClick: () => count.value++,
      }, `Count: ${count.value}`);
    };
  },
};
</script>
```

### События и модификаторы в `h()`

В render-функциях события передаются как обычные обработчики в props. Модификаторы `v-on` из шаблона приходится реализовывать вручную:

```js
h('input', {
  onInput: (event) => {
    const value = event.target.value.trim();
    emit('update:modelValue', value);
  },
});
```

### Работа со слотами в render-функциях

Слоты в render-функциях — это функции, возвращающие VNode:

```vue
<script>
import { h } from 'vue';

export default {
  setup(props, { slots }) {
    return () => h('div', { class: 'panel' }, [
      slots.header ? h('div', { class: 'panel__header' }, slots.header()) : null,
      h('div', { class: 'panel__body' }, slots.default?.()),
      slots.footer ? h('div', { class: 'panel__footer' }, slots.footer()) : null,
    ]);
  },
};
</script>
```

### Scoped slots в render-функциях

Чтобы передать данные в scoped slot, передаём объект в функцию слота:

```vue
<script>
import { h } from 'vue';

export default {
  setup(props, { slots }) {
    const items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

    return () => h('ul', null, items.map(item =>
      h('li', { key: item.id }, slots.item?.({ item }))
    ));
  },
};
</script>
```

Родитель использует это так:

```vue
<template>
  <List :items="items">
    <template #item="{ item }">
      {{ item.name }}
    </template>
  </List>
</template>
```

### Типизация render-функций

При использовании TypeScript можно типизировать `h()` через дженерики компонента:

```ts
import { h, defineComponent } from 'vue';
import type { VNode } from 'vue';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return (): VNode => h('h1', null, props.title);
  },
});
```

---

## JSX во Vue

JSX — это альтернатива шаблонам и `h()`. Vue поддерживает JSX через плагин `@vitejs/plugin-vue-jsx`.

```vue
<script setup lang="tsx">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <button onClick={() => count.value++}>
    Count: { count.value }
  </button>
</template>
```

Или полностью через JSX без `<template>`:

```tsx
import { ref } from 'vue';

export default function Counter() {
  const count = ref(0);

  return () => (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}
```

### Различия JSX Vue и React

| Аспект | Vue JSX | React JSX |
|---|---|---|
| События | `onClick` — нативное событие | `onClick` — SyntheticEvent |
| v-model | Реализуется через `modelValue` + событие | Нет прямого аналога |
| Директивы | Нет `v-if`/`v-for`, используется JS | Нет директив вообще |
| Реактивность | Автоматическое отслеживание | Нет автоматического отслеживания |
| Слоты | Передаются через `v-slots` или `slots` | Через `children` или render props |

В Vue JSX менее распространён, чем в React, потому что шаблоны обычно удобнее и лучше оптимизируются компилятором. JSX полезен для сложных render-функций и интеграции с TypeScript.

---

## Динамические компоненты `<component :is>`

Иногда тип компонента известен только во время выполнения: табы, мастеры, дашборды с виджетами. Для этого Vue предоставляет встроенный компонент `<component>` с атрибутом `:is`.

```vue
<script setup>
import { ref, shallowRef } from 'vue';
import TabA from './TabA.vue';
import TabB from './TabB.vue';
import TabC from './TabC.vue';

const currentTab = shallowRef(TabA);
</script>

<template>
  <div>
    <button @click="currentTab = TabA">Tab A</button>
    <button @click="currentTab = TabB">Tab B</button>
    <button @click="currentTab = TabC">Tab C</button>

    <component :is="currentTab" />
  </div>
</template>
```

### Строковые имена компонентов

Если компонент зарегистрирован глобально, можно передать строку:

```vue
<template>
  <component :is="'MyGlobalComponent'" />
</template>
```

Но в современных приложениях предпочтительнее передавать сам импортированный компонент, чтобы сохранить типизацию и tree-shaking.

### Сохранение состояния

По умолчанию `<component :is>` размонтирует старый компонент и смонтирует новый. Состояние теряется. Чтобы сохранить состояние, оборачиваем в `<KeepAlive>`:

```vue
<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

### Динамические HTML-элементы

`:is` можно использовать и для обычных HTML-элементов:

```vue
<script setup>
import { ref } from 'vue';

const tag = ref('h1');
</script>

<template>
  <component :is="tag">Заголовок</component>
</template>
```

### Ограничения

- Если `:is` — строка и компонент не найден, Vue попытается отрендерить HTML-элемент с таким тегом.
- Динамический компонент не сохраняет состояние без `<KeepAlive>`.
- При использовании с `v-model` нужно убедиться, что все возможные компоненты поддерживают одинаковый интерфейс пропсов и событий.

---

## `<KeepAlive>` — сохранение состояния

`<KeepAlive>` — это встроенный компонент, который кэширует экземпляры дочерних компонентов вместо их уничтожения. Когда компонент снова становится активным, Vue использует сохранённый экземпляр, а не создаёт новый.

```vue
<script setup>
import { ref, shallowRef } from 'vue';
import Editor from './Editor.vue';
import Preview from './Preview.vue';

const current = shallowRef(Editor);
</script>

<template>
  <div>
    <button @click="current = Editor">Редактор</button>
    <button @click="current = Preview">Превью</button>

    <KeepAlive>
      <component :is="current" />
    </KeepAlive>
  </div>
</template>
```

### Lifecycle-хуки KeepAlive

Компонент внутри `<KeepAlive>` получает два дополнительных lifecycle-хука:

| Хук | Когда вызывается |
|---|---|
| `onActivated` | Компонент становится активным после дезактивации |
| `onDeactivated` | Компонент уходит в кэш и перестаёт быть активным |

```vue
<script setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

onMounted(() => {
  console.log('первый монтаж');
});

onActivated(() => {
  console.log('компонент активен');
});

onDeactivated(() => {
  console.log('компонент деактивирован');
});

onUnmounted(() => {
  console.log('компонент уничтожен');
});
</script>
```

Порядок вызова при переключении вкладок:

1. Монтаж: `onMounted` → `onActivated`.
2. Переход на другую вкладку: `onDeactivated`.
3. Возврат: `onActivated`.
4. Размонтирование `<KeepAlive>`: `onDeactivated` → `onUnmounted`.

### Пропсы `<KeepAlive>`

| Пропс | Описание |
|---|---|
| `include` | Массив или регулярка: какие компоненты кэшировать по имени |
| `exclude` | Массив или регулярка: какие компоненты не кэшировать |
| `max` | Максимальное количество кэшируемых экземпляров (LRU) |

```vue
<template>
  <KeepAlive :include="['Editor']" :max="5">
    <component :is="current" />
  </KeepAlive>
</template>
```

### Именованные компоненты

Для `include`/`exclude` компонент должен иметь `name`. В `<script setup>` имя задаётся через `defineOptions`:

```vue
<script setup>
defineOptions({ name: 'Editor' });
</script>
```

### Когда не использовать KeepAlive

`<KeepAlive>` не подходит, если:

- Компонент держит тяжёлые ресурсы, которые лучше освобождать при уходе.
- Состояние должно сбрасываться при каждом открытии.
- Компонент часто меняется и создаёт утечки памяти.

---

## `<Teleport>` — рендеринг в другой узел DOM

`<Teleport>` позволяет render-дереву компонента продолжаться в другом месте реального DOM, не нарушая логическую иерархию компонентов. Это удобно для модалок, тултипов, toast-уведомлений и дропдаунов.

```vue
<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
</script>

<template>
  <button @click="isOpen = true">Открыть модалку</button>

  <Teleport to="body">
    <div v-if="isOpen" class="modal">
      <p>Содержимое модалки</p>
      <button @click="isOpen = false">Закрыть</button>
    </div>
  </Teleport>
</template>
```

Атрибут `to` принимает CSS-селектор или HTMLElement. Содержимое `<Teleport>` рендерится внутри указанного узла, но события и реактивность продолжают работать в контексте исходного компонента.

### Множественные Teleport в один узел

Несколько `<Teleport>` могут рендерить в один и тот же узел. Vue добавит их в порядке монтирования:

```vue
<template>
  <Teleport to="#modals">
    <ModalA />
  </Teleport>

  <Teleport to="#modals">
    <ModalB />
  </Teleport>
</template>
```

### Отключение Teleport

Пропс `disabled` временно отключает телепортацию:

```vue
<template>
  <Teleport to="body" :disabled="!isFullscreen">
    <div>...</div>
  </Teleport>
</template>
```

### Пропсы `<Teleport>`

| Пропс | Тип | Описание |
|---|---|---|
| `to` | `string` \| `HTMLElement` | Целевой узел DOM |
| `disabled` | `boolean` | Отключает телепортацию |
| `defer` | `boolean` | Откладывает монтирование до завершения текущего render-цикла |

### Ограничения

- Целевой узел должен существовать в DOM на момент монтирования.
- `<Teleport>` не перемещает компонент между экземплярами Vue — он только меняет место рендеринга в DOM.
- Стили scoped компонента-источника всё ещё применяются к телепортированным элементам.

### Типичный паттерн: портал для модалок

Часто в `index.html` добавляют пустой контейнер:

```html
<body>
  <div id="app"></div>
  <div id="modals"></div>
</body>
```

А компонент модалки телепортирует своё содержимое туда:

```vue
<template>
  <Teleport to="#modals">
    <div class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
```

---

## Сравнение с React

| Концепция Vue | Аналог в React | Отличия |
|---|---|---|
| `<slot>` | `children` | В Vue слоты декларативны и могут быть именованными |
| Scoped slots | Render props | Vue передаёт данные через слот, React — через пропс-функцию |
| `h()` | `React.createElement` | Похожий API, но Vue использует реактивную систему |
| JSX во Vue | JSX в React | В Vue JSX менее распространён и имеет отличия в событиях |
| `<component :is>` | Условный рендеринг компонентов | В Vue есть встроенный механизм смены типа |
| `<KeepAlive>` | Нет прямого аналога | React требует ручного управления состоянием или сторонних библиотек |
| `<Teleport>` | `createPortal` | Похожая идея, но API отличается |

### Слоты vs children

В React родитель передаёт детей через пропс `children`:

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
```

В Vue то же самое делается через `<slot>`:

```vue
<template>
  <div class="card">
    <slot></slot>
  </div>
</template>
```

Но Vue сразу поддерживает несколько именованных слотов, а в React для этого пришлось бы использовать несколько пропсов.

### Scoped slots vs render props

В React render props выглядят так:

```jsx
<DataList renderItem={(item) => <div>{item.name}</div>} />
```

В Vue scoped slot делает то же самое, но через декларативный шаблон:

```vue
<DataList>
  <template #default="{ item }">
    <div>{{ item.name }}</div>
  </template>
</DataList>
```

Оба подхода разделяют логику и представление, но Vue-вариант лучше вписывается в HTML-подобный стиль шаблонов.

### Teleport vs createPortal

React использует `createPortal(children, domNode)`:

```jsx
import { createPortal } from 'react-dom';

return createPortal(<Modal />, document.getElementById('modals'));
```

Vue использует декларативный `<Teleport to="...">`:

```vue
<Teleport to="#modals">
  <Modal />
</Teleport>
```

Разница в синтаксисе, но суть одна: содержимое рендерится вне иерархии компонента, но сохраняет контекст.

---

## Лучшие практики и антипаттерны

### Практики

**1. Используйте именованные слоты для сложных layout-компонентов**

```vue
<BaseLayout>
  <template #sidebar>...</template>
  <template #main>...</template>
</BaseLayout>
```

Это делает API компонента очевидным и самодокументируемым.

**2. Предоставляйте fallback-контент**

Слот с содержимым по умолчанию работает корректно, даже если родитель ничего не передал.

**3. Используйте scoped slots для списков и таблиц**

Дочерний компонент отвечает за данные, родитель — за представление. Это классическое разделение ответственности.

**4. Используйте `shallowRef` для динамических компонентов**

```js
const currentTab = shallowRef(TabA);
```

Компонент — это объект, и делать его глубоко реактивным избыточно. `shallowRef` дешевле и безопаснее.

**5. Ограничивайте `<KeepAlive>` через `include`/`max`**

Не кэшируйте всё подряд. Указывайте имена компонентов и максимальный размер кэша.

**6. Проверяйте наличие слота через `useSlots`**

```js
const slots = useSlots();
const hasActions = Boolean(slots.actions);
```

Это помогает избежать пустых обёрток в DOM.

### Антипаттерны

**1. Мутация scoped slot props**

```vue
<!-- ❌ Неправильно -->
<template #item="{ item }">
  <input v-model="item.name" />
</template>
```

Scoped slot props могут быть реактивными объектами, но их мутация в родителе нарушает инкапсуляцию. Лучше отправлять событие в дочерний компонент.

**2. Избыточные render-функции**

Не пишите render-функцию там, где справится шаблон. Шаблоны лучше оптимизируются компилятором Vue и проще читаются.

**3. `<KeepAlive>` для компонентов с побочными эффектами**

Если компонент открывает WebSocket, подписку или таймер, `<KeepAlive>` может привести к утечкам, если эффекты не очищаются в `onDeactivated`.

**4. Телепортация в несуществующий узел**

Убедитесь, что целевой элемент существует в DOM. В SSR это особенно важно, так как `document` может быть недоступен.

**5. Пропуск `key` при динамических компонентах**

Если один и тот же компонент рендерится с разными пропсами, используйте `key`, чтобы Vue понимал, что это разные экземпляры:

```vue
<component :is="currentTab" :key="tabId" />
```

---

## Ключевые тезисы для интервью

1. **Слоты** позволяют родителю передавать разметку в дочерний компонент. Бывают default, named и scoped.
2. **Scoped slot** передаёт данные из дочернего компонента в родительский шаблон, что удобно для списков, таблиц и кастомизации.
3. **Render-функции и `h()`** дают полный контроль над VNode. Используются, когда шаблона недостаточно.
4. **JSX во Vue** поддерживается, но менее распространён, чем в React, потому что шаблоны лучше оптимизируются компилятором.
5. **`<component :is>`** меняет рендеримый компонент динамически. Состояние не сохраняется без `<KeepAlive>`.
6. **`<KeepAlive>`** кэширует экземпляры компонентов и добавляет хуки `onActivated`/`onDeactivated`.
7. **`<Teleport>`** рендерит содержимое в другой узел DOM, сохраняя реактивность и контекст компонента.
8. Scoped slots во Vue близки к render props в React, но выражены через декларативный шаблонный синтаксис.
9. Для динамических компонентов лучше использовать `shallowRef`, а не `ref`, чтобы избежать избыточной реактивности.
10. При использовании `<KeepAlive>` важно корректно очищать побочные эффекты в `onDeactivated`, чтобы избежать утечек.

---

## Заключение

Компоненты, слоты, render-функции, динамические компоненты, `<KeepAlive>` и `<Teleport>` — это инструменты, которые превращают Vue из набора изолированных блоков в гибкую систему для построения сложных интерфейсов. Каждый механизм решает свою задачу: слоты отвечают за композицию разметки, render-функции — за низкоуровневый контроль, `<component :is>` — за динамику, `<KeepAlive>` — за сохранение состояния, а `<Teleport>` — за рендеринг вне иерархии DOM.

На собеседованиях важно не только знать синтаксис, но и понимать, когда какой инструмент применять. Шаблоны предпочтительнее render-функций для обычных задач, scoped slots помогают строить универсальные компоненты, а `<KeepAlive>` и `<Teleport>` решают специфические UI-проблемы без костылей.

---

## Полезные ссылки

- [Vue 3: Slots](https://vuejs.org/guide/components/slots.html)
- [Vue 3: Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html)
- [Vue 3: Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components)
- [Vue 3: KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html)
- [Vue 3: Teleport](https://vuejs.org/guide/built-ins/teleport.html)
- [Vue 3: Built-in Special Elements](https://vuejs.org/api/built-in-special-elements.html)
