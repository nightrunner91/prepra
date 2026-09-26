---
title: "Жизненный цикл компонента во Vue"
section: vue
description: "Lifecycle hooks во Vue 3: onMounted, onUpdated, onUnmounted, onBeforeMount, onBeforeUpdate, onBeforeUnmount, onErrorCaptured. Render → patch, порядок вызова в дереве и сравнение с React useEffect / useLayoutEffect."
order: 5
tags: ["vue", "vue3", "lifecycle", "composition-api", "onMounted", "onUpdated", "onUnmounted", "render", "patch"]
questions:
  - "В каком порядке вызываются lifecycle hooks при монтировании и размонтировании"
  - "Чем onMounted отличается от onBeforeMount и когда DOM уже доступен"
  - "Когда срабатывает onUpdated и как избежать бесконечных циклов внутри него"
  - "Как очистить подписки и таймеры при размонтировании компонента"
  - "Какие lifecycle hooks есть только в Options API и как им соответствуют хуки Composition API"
  - "Что происходит на этапах render и patch"
  - "Как работает onErrorCaptured и в чём его отличие от глобального errorHandler"
  - "Чем Vue lifecycle hooks отличаются от React useEffect и useLayoutEffect"
---

# Жизненный цикл компонента во Vue

Любой Vue-компонент проходит через одни и те же стадии: создаётся, монтируется в DOM, обновляется при изменении реактивных зависимостей и, наконец, удаляется. В каждой из этих стадий фреймворк предоставляет точки входа — lifecycle hooks — чтобы разработчик мог выполнить код в нужный момент: инициализировать данные, подписаться на события, измерить DOM или очистить ресурсы.

Эта статья разбирает lifecycle hooks Vue 3 в контексте Composition API и `<script setup>`, потому что это современный стиль. Options API-аналоги упоминаются как legacy для чтения старого кода. Мы также заглянем под капот — посмотрим, что происходит между изменением реактивного состояния и обновлением DOM, — и сравним Vue-подход с React-хуками `useEffect` и `useLayoutEffect`.

## Содержание

1. [Общая схема жизненного цикла](#общая-схема-жизненного-цикла)
2. [Composition API lifecycle hooks](#composition-api-lifecycle-hooks)
3. [Options API lifecycle hooks](#options-api-lifecycle-hooks)
4. [setup() и момент входа в жизненный цикл](#setup-и-момент-входа-в-жизненный-цикл)
5. [onBeforeMount и onMounted](#onbeforemount-и-onmounted)
6. [onBeforeUpdate и onUpdated](#onbeforeupdate-и-onupdated)
7. [onBeforeUnmount и onUnmounted](#onbeforeunmount-и-onunmounted)
8. [onErrorCaptured](#onerrorcaptured)
9. [onActivated и onDeactivated (keep-alive)](#onactivated-и-ondeactivated-keep-alive)
10. [onServerPrefetch (SSR)](#onserverprefetch-ssr)
11. [onRenderTracked и onRenderTriggered (dev-only)](#onrendertracked-и-onrendertriggered-dev-only)
12. [Render → patch: что происходит между состоянием и DOM](#render--patch-что-происходит-между-состоянием-и-dom)
13. [Порядок вызова хуков в дереве компонентов](#порядок-вызова-хуков-в-дереве-компонентов)
14. [Практический пример: компонент-обёртка с API](#практический-пример-компонент-обёртка-с-api)
15. [Сравнение с React: useEffect и useLayoutEffect](#сравнение-с-react-useeffect-и-uselayouteffect)
16. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
17. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
18. [Заключение](#заключение)
19. [Полезные ссылки](#полезные-ссылки)

---

## Общая схема жизненного цикла

Жизненный цикл Vue-компонента можно разделить на четыре фазы:

| Фаза | Что происходит | Главные hooks |
|---|---|---|
| **Создание** | Разрешение props, вызов `setup()`, подготовка реактивного контекста | — |
| **Монтирование** | Компиляция шаблона, создание vnode, первый рендер, вставка в DOM | `onBeforeMount`, `onMounted` |
| **Обновление** | Изменение реактивных зависимостей, повторный рендер, patch DOM | `onBeforeUpdate`, `onUpdated` |
| **Размонтирование** | Удаление компонента из DOM, очистка эффектов | `onBeforeUnmount`, `onUnmounted` |

Важно понимать, что lifecycle hooks — это не просто «события», которые висят в воздухе. Каждый hook регистрируется внутри текущего активного экземпляра компонента в момент вызова. Поэтому их нельзя вызывать вне `setup()`, `<script setup>` или другого composable, который выполняется в контексте компонента.

```vue
<script setup>
import { onMounted } from 'vue';

// ✅ Регистрируется в текущем компоненте
onMounted(() => {
  console.log('Компонент смонтирован');
});
</script>
```

Если вызвать `onMounted` в обычной функции, которая вызывается позже — например, в обработчике клика — Vue не найдёт активный экземпляр и выбросит предупреждение.

---

## Composition API lifecycle hooks

В Composition API все lifecycle hooks — это функции с префиксом `on`, импортируемые из `vue`:

```js
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated,
} from 'vue';
```

### Соответствие с Options API

| Composition API | Options API |
|---|---|
| `onBeforeMount` | `beforeMount` |
| `onMounted` | `mounted` |
| `onBeforeUpdate` | `beforeUpdate` |
| `onUpdated` | `updated` |
| `onBeforeUnmount` | `beforeUnmount` |
| `onUnmounted` | `unmounted` |
| `onErrorCaptured` | `errorCaptured` |
| `onRenderTracked` | `renderTracked` |
| `onRenderTriggered` | `renderTriggered` |
| `onActivated` | `activated` |
| `onDeactivated` | `deactivated` |

Названия почти идентичны, но Composition API-версии принимают колбэк и не привязаны к опции `setup()` — их можно вызывать внутри composables.

---

## Options API lifecycle hooks

В Options API lifecycle hooks объявляются как поля объекта компонента:

```vue
<script>
export default {
  beforeCreate() {
    console.log('Экземпляр создаётся');
  },
  created() {
    console.log('Экземпляр создан');
  },
  mounted() {
    console.log('DOM готов');
  },
  unmounted() {
    console.log('Компонент удалён');
  },
};
</script>
```

### `beforeCreate` и `created`

Эти два hooks есть только в Options API:

- `beforeCreate` — вызывается до инициализации реактивности, данных, computed, methods и watch.
- `created` — вызывается после того, как данные, computed, methods и watch настроены, но до монтирования DOM.

В Composition API аналог `created` — само тело `setup()` или `<script setup>`, потому что этот код выполняется после создания реактивного контекста, но до монтирования DOM.

> **На собеседовании:** в Composition API нет `beforeCreate` и `created`, потому что `setup()` и есть точка инициализации. Любой код на верхнем уровне `<script setup>` эквивалентен `created` из Options API.

---

## setup() и момент входа в жизненный цикл

Функция `setup()` вызывается после разрешения `props`, но до создания DOM. Это значит, что внутри неё ещё нельзя обращаться к DOM, но уже можно работать с реактивностью, props, emit и регистрировать lifecycle hooks.

```vue
<script>
export default {
  setup() {
    // Эквивалент created: реактивность готова, DOM ещё нет
    const count = ref(0);

    onMounted(() => {
      // DOM уже существует
      console.log('mounted');
    });

    return { count };
  },
};
</script>
```

В `<script setup>` та же логика выглядит проще:

```vue
<script setup>
import { ref, onMounted } from 'vue';

const count = ref(0);

onMounted(() => {
  console.log('mounted');
});
</script>
```

### Порядок: setup → beforeMount → mounted

Код на верхнем уровне `<script setup>` выполняется синхронно при создании экземпляра. Затем Vue строит виртуальное дерево (vnode) и только потом вызывает `onBeforeMount` и `onMounted`.

---

## onBeforeMount и onMounted

### `onBeforeMount`

Вызывается после компиляции шаблона и создания vnode, но **до** вставки DOM. В этот момент DOM-элементов компонента ещё нет в документе, но реактивные зависимости уже отслеживаются.

```vue
<script setup>
import { onBeforeMount } from 'vue';

onBeforeMount(() => {
  // DOM ещё не доступен
  console.log('before mount');
});
</script>
```

На практике `onBeforeMount` используется редко. Чаще всего нужен `onMounted`, потому что именно там DOM уже существует.

### `onMounted`

Вызывается после того, как компонент вставлен в DOM. Это основное место для:

- загрузки данных;
- подписки на события DOM или внешние источники;
- инициализации сторонних библиотек (карты, графики, редакторы);
- измерения DOM-элементов.

```vue
<script setup>
import { ref, onMounted } from 'vue';

const inputRef = ref(null);

onMounted(() => {
  // DOM-элемент доступен
  inputRef.value?.focus();
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

### Дочерние компоненты

`onMounted` родителя вызывается **после** того, как смонтированы все его дочерние компоненты. Это гарантирует, что когда родитель получает управление, всё его поддерево уже находится в DOM.

```
Parent setup
Child setup
Child onBeforeMount
Child onMounted
Parent onBeforeMount
Parent onMounted
```

Это важно для родительских компонентов, которые измеряют размеры контейнера, включающего детей.

---

## onBeforeUpdate и onUpdated

Эти hooks срабатывают при изменении реактивных зависимостей, которые влияют на рендер компонента.

### `onBeforeUpdate`

Вызывается **до** того, как Vue применит изменения к DOM. В этот момент старый DOM всё ещё актуален. Его можно использовать для последних подготовок или чтения текущего состояния DOM перед обновлением.

```vue
<script setup>
import { ref, onBeforeUpdate } from 'vue';

const list = ref([1, 2, 3]);

onBeforeUpdate(() => {
  // Старый DOM ещё на месте
  console.log('DOM будет обновлён');
});
</script>
```

### `onUpdated`

Вызывается **после** того, как Vue применил изменения к DOM. Новое DOM-дерево уже синхронизировано с состоянием.

```vue
<script setup>
import { ref, onUpdated, nextTick } from 'vue';

const count = ref(0);

onUpdated(() => {
  // DOM уже обновлён
  console.log('DOM обновлён');
});
</script>
```

### Опасность бесконечных циклов

Внутри `onUpdated` нельзя безусловно изменять реактивное состояние, от которого зависит рендер, иначе получится бесконечный цикл:

```vue
<script setup>
import { ref, onUpdated } from 'vue';

const count = ref(0);

// ❌ Бесконечный цикл
onUpdated(() => {
  count.value++;
});
</script>
```

Если нужно реагировать на обновление DOM и изменять состояние, обязательно добавьте условие выхода:

```vue
<script setup>
import { ref, onUpdated } from 'vue';

const count = ref(0);
const elementRef = ref(null);
let lastHeight = 0;

// ✅ Изменяем состояние только при необходимости
onUpdated(() => {
  const height = elementRef.value?.scrollHeight;
  if (height && height !== lastHeight) {
    lastHeight = height;
    // обновляем что-то, связанное с высотой
  }
});
</script>
```

### `onUpdated` и дети

`onUpdated` родителя вызывается **после** обновления всех его дочерних компонентов. Это значит, что когда срабатывает родительский `onUpdated`, всё поддерево уже синхронизировано с новым состоянием.

---

## onBeforeUnmount и onUnmounted

Эти hooks отвечают за корректное завершение работы компонента.

### `onBeforeUnmount`

Вызывается **до** удаления компонента из DOM. DOM-элементы ещё существуют, можно сделать последние синхронные операции с ними.

### `onUnmounted`

Вызывается **после** удаления компонента из DOM. Это основное место для очистки ресурсов:

- отписки от событий;
- остановки таймеров и интервалов;
- закрытия WebSocket;
- отмены запросов через `AbortController`;
- уничтожения экземпляров сторонних библиотек.

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const time = ref(0);
let intervalId;

onMounted(() => {
  intervalId = setInterval(() => {
    time.value++;
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <p>Прошло секунд: {{ time }}</p>
</template>
```

> **Важно:** переменная `intervalId` объявлена на верхнем уровне `<script setup>`, чтобы быть доступной и в `onMounted`, и в `onUnmounted`. Если объявить её внутри `onMounted`, очистка не сможет к ней обратиться.

### Очистка внутри composables

Если побочный эффект создаётся внутри composable, lifecycle hooks регистрируются там же:

```ts
// composables/useEventListener.ts
import { onMounted, onUnmounted } from 'vue';

export function useEventListener(target, event, callback) {
  onMounted(() => {
    target.addEventListener(event, callback);
  });

  onUnmounted(() => {
    target.removeEventListener(event, callback);
  });
}
```

Это один из главных аргументов в пользу Composition API: логика создания и очистки эффекта живёт рядом, в одном composable, а не размазана по разным секциям Options API.

---

## onErrorCaptured

`onErrorCaptured` перехватывает ошибки из дочерних компонентов. Это ближайший аналог error boundary в React.

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue';

const error = ref(null);

onErrorCaptured((err, instance, info) => {
  error.value = err;
  // Возвращаем false, чтобы ошибка не всплывала дальше
  return false;
});
</script>

<template>
  <div v-if="error">
    <p>Произошла ошибка: {{ error.message }}</p>
  </div>
  <slot v-else />
</template>
```

Параметры колбэка:

- `err` — объект ошибки.
- `instance` — компонент, в котором произошла ошибка.
- `info` — строка с информацией о том, где произошла ошибка: например, `render function`, `setup function`, `mounted hook`.

Если колбэк возвращает `false`, ошибка считается обработанной и не всплывает к родителям. Если вернуть что-то другое или ничего не возвращать, ошибка продолжит всплытие.

`onErrorCaptured` ловит ошибки из:

- render-функций дочерних компонентов;
- `setup()` и `<script setup>`;
- lifecycle hooks дочерних компонентов;
- watchers;
- обработчиков событий, вызванных Vue.

Не ловит ошибки из:

- асинхронных колбэков вроде `setTimeout` без `await`;
- нативных DOM-обработчиков, не обёрнутых Vue;
- глобальных ошибок, не связанных с компонентами.

Более подробно обработка ошибок разбирается в отдельной статье `vue-error-handling.md`.

---

## onActivated и onDeactivated (keep-alive)

Компоненты, обёрнутые в `<keep-alive>`, кэшируются вместо полного размонтирования. Для состояний активации и деактивации используются `onActivated` и `onDeactivated`.

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue';

onActivated(() => {
  console.log('Компонент активирован');
});

onDeactivated(() => {
  console.log('Компонент деактивирован');
});
</script>
```

Эти hooks полезны для приостановки таймеров, анимации или подписок при скрытии кэшированного компонента. При первом появлении компонент проходит `onBeforeMount` → `onMounted` → `onActivated`, при последующих переключениях — только `onActivated` / `onDeactivated`.

---

## onServerPrefetch (SSR)

`onServerPrefetch` вызывается на сервере перед рендером компонента в HTML. Внутри него обычно выполняют запросы к API, чтобы клиент получил страницу с готовыми данными.

```vue
<script setup>
import { ref, onServerPrefetch } from 'vue';

const posts = ref([]);

onServerPrefetch(async () => {
  const res = await fetch('https://api.example.com/posts');
  posts.value = await res.json();
});
</script>
```

- Выполняется только на сервере; на клиенте игнорируется.
- Может возвращать Promise; Vue дождётся его завершения перед рендером.
- В Nuxt аналогичная механика реализована через `useAsyncData` и `useFetch`.

---

## onRenderTracked и onRenderTriggered (dev-only)

Эти hooks полезны только для отладки реактивности. Они работают только в dev-режиме и не попадают в production-сборку.

### `onRenderTracked`

Срабатывает, когда рендер-компонента отслеживает реактивную зависимость.

```vue
<script setup>
import { ref, onRenderTracked } from 'vue';

const count = ref(0);

onRenderTracked((event) => {
  console.log('Отслеживается:', event);
});
</script>
```

### `onRenderTriggered`

Срабатывает, когда реактивная зависимость вызывает повторный рендер.

```vue
<script setup>
import { ref, onRenderTriggered } from 'vue';

const count = ref(0);

onRenderTriggered((event) => {
  console.log('Рендер вызван:', event);
});
</script>
```

Эти hooks помогают понять, почему компонент перерисовывается чаще, чем ожидается. В production их не стоит использовать.

---

## Render → patch: что происходит между состоянием и DOM

Когда меняется реактивное состояние, Vue не обновляет DOM сразу. Вместо этого происходит двухэтапный процесс:

1. **Render phase** — вычисление нового виртуального DOM.
2. **Patch phase** — сравнение нового vnode с предыдущим и применение минимальных изменений к реальному DOM.

### Render phase

В этой фазе Vue:

- вызывает render-функцию компонента;
- отслеживает все реактивные зависимости, которые используются в шаблоне;
- строит новое виртуальное дерево (vnode).

Если шаблон использует `count.value`, Vue регистрирует зависимость. При следующем изменении `count` компонент будет добавлен в очередь на обновление.

### Patch phase

После того как новое vnode готово, Vue сравнивает его с предыдущим vnode. Этот процесс называется **reconciliation** или **patch**. Vue пытается минимизировать количество операций с DOM:

- переиспользовать существующие DOM-элементы, если это возможно;
- обновить только изменившиеся атрибуты и текст;
- переместить элементы в списках с помощью алгоритма с ключами.

```
Изменение состояния
        ↓
   Регистрация эффекта в очереди
        ↓
   Асинхронный flush (nextTick)
        ↓
   Render: новое vnode
        ↓
   Patch: diff старого и нового vnode
        ↓
   Мутации DOM
        ↓
   onUpdated / nextTick
```

### `nextTick`

Vue обновляет DOM асинхронно и пакетно. Если изменить несколько реактивных значений подряд, они сгруппируются в одно обновление. Чтобы дождаться завершения этого обновления, используется `nextTick`:

```vue
<script setup>
import { ref, nextTick } from 'vue';

const count = ref(0);
const message = ref('');

async function increment() {
  count.value++;
  message.value = `Count: ${count.value}`;

  // DOM ещё не обновлён
  await nextTick();
  // DOM обновлён
  console.log('DOM синхронизирован');
}
</script>
```

`nextTick` возвращает Promise, который разрешается после завершения всех pending-обновлений DOM.

---

## Порядок вызова хуков в дереве компонентов

Порядок lifecycle hooks в дереве компонентов имеет важные особенности, которые стоит знать на собеседованиях.

### При монтировании

```
Parent setup
  Child setup
  Child onBeforeMount
  Child onMounted
Parent onBeforeMount
Parent onMounted
```

`setup()` вызывается сверху вниз: сначала родитель, потом дети. А вот `onMounted` — снизу вверх: сначала дети, потом родитель. Это гарантирует, что родитель может безопасно работать со всем поддеревом.

### При обновлении

```
Parent onBeforeUpdate
  Child onBeforeUpdate
  Child onUpdated
Parent onUpdated
```

`onBeforeUpdate` родителя срабатывает раньше, чем у детей, а `onUpdated` — позже.

### При размонтировании

```
Parent onBeforeUnmount
  Child onBeforeUnmount
  Child onUnmounted
Parent onUnmounted
```

Очистка ресурсов детей происходит раньше, чем у родителя.

### Сводная таблица

| Событие | setup | onBeforeMount | onMounted | onBeforeUpdate | onUpdated | onBeforeUnmount | onUnmounted |
|---|---|---|---|---|---|---|---|
| Родитель | первый | после детей | после детей | первый | после детей | первый | после детей |
| Ребёнок | после родителя | первый | первый | после родителя | первый | после родителя | первый |

---

## Практический пример: компонент-обёртка с API

Рассмотрим компонент, который загружает данные при монтировании, следит за изменением параметра маршрута и корректно очищает ресурсы.

```vue
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const posts = ref([]);
let controller = null;

async function fetchPosts(category) {
  controller?.abort();
  controller = new AbortController();
  const res = await fetch(`/api/posts?category=${category}`, {
    signal: controller.signal,
  });
  posts.value = await res.json();
}

onMounted(() => fetchPosts(route.params.category));

watch(() => route.params.category, fetchPosts);

onUnmounted(() => controller?.abort());
</script>
```

### Что здесь важно

- `onMounted` запускает начальную загрузку, когда DOM уже готов.
- `watch` отслеживает изменение параметра маршрута и перезапрашивает данные.
- `onUnmounted` отменяет активный запрос, предотвращая утечку и race condition.

---

## Сравнение с React: useEffect и useLayoutEffect

Vue и React решают схожие задачи разным способом. В React большинство побочных эффектов концентрируются в `useEffect` и `useLayoutEffect`. В Vue ответственность распределена между lifecycle hooks и watchers.

### Соответствия

| React | Vue (Composition API) | Примечание |
|---|---|---|
| `useEffect(fn, [])` | `onMounted(fn)` + `onUnmounted(fn)` | Разделение на два хука |
| `useEffect(fn, [a, b])` | `watch([a, b], fn)` или `watchEffect(fn)` | Автоотслеживание в Vue |
| `useEffect(fn)` | `onUpdated(fn)` | После каждого рендера |
| `useLayoutEffect(fn, deps)` | `watch(fn, { flush: 'sync' })` | Синхронно до paint |
| cleanup-функция | `onCleanup` внутри `watch` / `watchEffect` | Или отдельный `onUnmounted` |

### Ключевые различия

**React** использует единый хук `useEffect` с явным массивом зависимостей. Разработчик сам решает, когда эффект перезапускается. Это даёт предсказуемость, но требует дисциплины: пропущенная зависимость приводит к stale closure.

**Vue** разделяет эффекты по смыслу: `onMounted` — для одноразовой инициализации, `onUnmounted` — для очистки, `watch` — для реакции на изменения. Автоматическое отслеживание зависимостей в `watchEffect` уменьшает риск ошибок, но требует понимания реактивности.

### Пример: подписка на resize

React-решение собирает инициализацию, подписку и очистку в одном `useEffect`:

```jsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

Vue-аналог через composable разделяет создание и очистку на разные hooks:

```ts
// composables/useWindowWidth.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useWindowWidth() {
  const width = ref(window.innerWidth);
  const update = () => width.value = window.innerWidth;

  onMounted(() => window.addEventListener('resize', update));
  onUnmounted(() => window.removeEventListener('resize', update));

  return width;
}
```

### onMounted vs useEffect

`onMounted` в Vue ближе всего к `useEffect(fn, [])` в React. Но есть важное отличие: `onMounted` вызывается один раз за жизнь экземпляра компонента и не перезапускается. Если нужно реагировать на изменение зависимости — используется `watch` или `watchEffect`.

---

## Лучшие практики и антипаттерны

### ✅ Лучшие практики

**Создавайте и очищайте ресурсы в паре.**

Если ресурс создаётся в `onMounted`, он должен очищаться в `onUnmounted`:

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

let ws;

onMounted(() => {
  ws = new WebSocket('wss://example.com');
});

onUnmounted(() => {
  ws?.close();
});
</script>
```

**Выносите побочные эффекты в composables.**

Это улучшает читаемость и тестируемость:

```ts
// composables/useWebSocket.ts
export function useWebSocket(url) {
  const message = ref(null);
  let ws;

  onMounted(() => {
    ws = new WebSocket(url);
    ws.onmessage = (event) => {
      message.value = JSON.parse(event.data);
    };
  });

  onUnmounted(() => {
    ws?.close();
  });

  return message;
}
```

**Не полагайтесь на `onUpdated` без условия.**

`onUpdated` легко превратить в источник бесконечных циклов. Всегда проверяйте, действительно ли нужно изменять состояние.

**Используйте `nextTick` для чтения DOM после изменения.**

Если после изменения состояния нужно прочитать размеры или позицию элемента, дождитесь `nextTick`.

**Разделяйте инициализацию и реакцию на изменения.**

Для одноразовой загрузки — `onMounted`. Для реакции на изменение пропса — `watch`. Не пытайтесь всё запихнуть в один `watchEffect`.

### ❌ Антипаттерны

**Изменение состояния внутри `onUpdated` без условия.**

```vue
<script setup>
import { ref, onUpdated } from 'vue';

const count = ref(0);

// ❌ Бесконечный цикл
onUpdated(() => {
  count.value++;
});
</script>
```

**Доступ к DOM в `setup()` или `onBeforeMount`.**

```vue
<script setup>
import { ref } from 'vue';

const el = ref(null);

// ❌ el.value ещё null
console.log(el.value);
</script>
```

**Создание ресурса без очистки.**

```vue
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // ❌ Утечка памяти
  setInterval(() => {}, 1000);
});
</script>
```

**Вызов lifecycle hooks вне `setup()` / composable.**

```js
// ❌ Нет активного экземпляра компонента
function bad() {
  onMounted(() => {});
}
```

**Использование `onUpdated` для вычисления производных данных.**

Если значение можно вычислить из состояния — используйте `computed`, а не lifecycle hook.

---

## Ключевые тезисы для интервью

1. Жизненный цикл Vue-компонента состоит из четырёх фаз: создание, монтирование, обновление, размонтирование.
2. В Composition API lifecycle hooks имеют префикс `on`: `onMounted`, `onUpdated`, `onUnmounted` и др.
3. `setup()` и код `<script setup>` выполняются при создании компонента, до монтирования DOM.
4. `onMounted` — основной hook для работы с DOM и инициализации побочных эффектов.
5. `onUpdated` вызывается после обновления DOM, но изменение в нём состояния без условия приводит к бесконечному циклу.
6. `onUnmounted` используется для очистки: отписки, таймеры, WebSocket, `AbortController`.
7. `onErrorCaptured` перехватывает ошибки из дочерних компонентов и работает как error boundary.
8. `onRenderTracked` и `onRenderTriggered` работают только в dev-режиме и нужны для отладки.
9. Vue обновляет DOM асинхронно и пакетно; `nextTick` позволяет дождаться завершения обновления.
10. `onMounted` родителя вызывается после `onMounted` всех дочерних компонентов.
11. В React `useEffect(fn, [])` соответствует `onMounted` + `onUnmounted`, а `watch`/`watchEffect` заменяют `useEffect` с зависимостями.

---

## Заключение

Lifecycle hooks Vue 3 — это точки входа в чётко определённые стадии жизни компонента. Composition API делает их особенно удобными: логика создания и очистки ресурсов может жить рядом в composables, а не быть размазана по разным секциям Options API.

Для подготовки к собеседованиям важно помнить: `setup()` выполняется до DOM, `onMounted` — после; `onUpdated` опасен бесконечными циклами; `onUnmounted` отвечает за очистку; `onErrorCaptured` ловит ошибки детей. Понимание порядка вызова хуков в дереве и различий с React `useEffect`/`useLayoutEffect` помогает не только писать корректный код, но и уверенно объяснять архитектуру фреймворка.

---

## Полезные ссылки

- [Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html) — официальная документация Vue.
- [Composition API: Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html)
- [Options API: Lifecycle Hooks](https://vuejs.org/api/options-lifecycle.html)
- [nextTick](https://vuejs.org/api/general.html#nexttick)
- [onErrorCaptured](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)
- [React useEffect](https://react.dev/reference/react/useEffect)
- [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
