---
title: "Реактивность Vue: ref, reactive, computed, watch и Proxy"
section: vue
description: "Глубокий разбор системы реактивности Vue 3: ref и reactive, computed и watch, toRef/toRefs, readonly, shallow-API, реактивность коллекций и работа Proxy под капотом."
order: 2
tags: ["vue", "vue3", "reactivity", "composition-api", "ref", "reactive", "computed", "watch", "proxy"]
questions:
  - "В чём разница между ref и reactive и когда использовать каждый"
  - "Почему ref требует .value в JavaScript, но не в шаблоне"
  - "Как работает computed и чем он отличается от обычной функции"
  - "В чём разница между watch и watchEffect"
  - "Как сохранить реактивность при деструктуризации reactive-объекта"
  - "Зачем нужны toRef и toRefs"
  - "Как Vue отслеживает зависимости через Proxy"
  - "Какие антипаттерны чаще всего встречаются при работе с реактивностью"
---

# Реактивность Vue: ref, reactive, computed, watch и Proxy

Реактивность — ключевая суперсила Vue. В отличие от React, где обновления UI строятся вокруг явного вызова сеттера состояния и повторного рендера компонента, Vue отслеживает обращения к данным и их изменения автоматически. Это позволяет писать императивный код, который напоминает обычный JavaScript: меняешь значение — шаблон обновляется сам.

В этой статье мы разберём всю реактивную систему Vue 3: от базовых `ref` и `reactive` до `computed`, `watch`, `watchEffect`, `toRef`, `toRefs`, `readonly`, `shallowRef` и `shallowReactive`. Мы посмотрим, как ведут себя коллекции вроде `Map` и `Set`, и заглянем под капот — поймём роль `Proxy` в отслеживании зависимостей. Статья ориентирована на подготовку к собеседованиям, поэтому акцент сделан на «почему так работает», а не только на «как написать».

## Содержание

1. [Что такое реактивность в Vue](#что-такое-реактивность-в-vue)
2. [ref — реактивная обёртка](#ref--реактивная-обёртка)
3. [reactive — реактивный объект](#reactive--реактивный-объект)
4. [computed — вычисляемые свойства](#computed--вычисляемые-свойства)
5. [watch — наблюдение за изменениями](#watch--наблюдение-за-изменениями)
6. [watchEffect — автоматическое отслеживание](#watcheffect--автоматическое-отслеживание)
7. [toRef и toRefs — сохраняем реактивность](#toref-и-torefs--сохраняем-реактивность)
8. [readonly — неизменяемая реактивность](#readonly--неизменяемая-реактивность)
9. [shallowRef и shallowReactive — поверхностная реактивность](#shallowref-и-shallowreactive--поверхностная-реактивность)
10. [Реактивность коллекций](#реактивность-коллекций)
11. [Proxy под капотом](#proxy-под-капотом)
12. [Edge cases и частые ошибки](#edge-cases-и-частые-ошибки)
13. [Сравнение с React](#сравнение-с-react)
14. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
15. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
16. [Заключение](#заключение)
17. [Полезные ссылки](#полезные-ссылки)

---

## Что такое реактивность в Vue

Реактивность — это способность системы автоматически отслеживать зависимости между данными и UI. В Vue 3 реактивная система построена на нативных JavaScript-объектах `Proxy` и `Reflect`. Она состоит из двух частей:

- **Отслеживание чтения (track).** Когда компонент или `computed` обращается к реактивному значению, Vue запоминает эту зависимость.
- **Триггер обновления (trigger).** Когда значение изменяется, Vue уведомляет всех подписчиков, и они пересчитываются или перерисовываются.

Это похоже на систему подписчиков: реактивное значение — это издатель, а `computed`, `watch`, `watchEffect` и шаблон — подписчики.

### Зачем нужна реактивность

Без реактивности разработчику пришлось бы вручную обновлять DOM при каждом изменении данных. Vue берёт эту работу на себя:

```vue
<template>
  <button @click="count++">Count: {{ count }}</button>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
</script>
```

Здесь `count` — реактивное значение. Когда мы делаем `count++`, Vue автоматически обновляет текст внутри кнопки. Под капотом происходит ровно то, что мы опишем дальше: шаблон подписался на `count` при первом рендере, а изменение `count.value` вызвало повторный рендер.

---

## ref — реактивная обёртка

`ref` — самый универсальный инструмент реактивности в Vue. Он создаёт объект-обёртку с единственным свойством `.value`, которое хранит реактивное значение.

```js
import { ref } from 'vue';

const count = ref(0);
console.log(count.value); // 0

count.value++;
console.log(count.value); // 1
```

`ref` подходит для любых типов данных: примитивов, объектов, массивов, `null`, `undefined`.

### Почему именно обёртка

Примитивные значения в JavaScript передаются по значению. Если бы Vue пытался сделать число или строку реактивными напрямую, он не смог бы отслеживать их изменения — нет места, куда можно «повесить» подписку. Объект-обёртка решает эту проблему: у него есть стабильная ссылка, а `.value` можно отслеживать через `Proxy` при необходимости.

### ref для объектов

Если в `ref` передать объект, Vue автоматически превратит его в реактивный объект через `reactive`:

```js
const user = ref({ name: 'Alice', age: 30 });

// Это работает, потому что user.value — реактивный Proxy
user.value.name = 'Bob';
```

Но замена объекта целиком требует обращения к `.value`:

```js
// ✅ Правильно: заменяем значение через .value
user.value = { name: 'Charlie', age: 25 };

// ❌ Неправильно: это не обновит реактивную ссылку
user = { name: 'Charlie', age: 25 };
```

### Разворачивание в шаблоне

В шаблоне Vue автоматически разворачивает `ref`, поэтому `.value` писать не нужно:

```vue
<template>
  <p>{{ count }}</p>        <!-- не count.value -->
  <p>{{ user.name }}</p>    <!-- не user.value.name -->
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
const user = ref({ name: 'Alice' });
</script>
```

Внутри `<script setup>` обращение всегда идёт через `.value`.

### ref и DOM-элементы

Атрибут `ref` в шаблоне позволяет получить ссылку на DOM-элемент. Переменная должна быть пустым `ref(null)`:

```vue
<template>
  <input ref="inputRef" />
  <button @click="focus">Focus</button>
</template>

<script setup>
import { ref } from 'vue';

const inputRef = ref(null);

const focus = () => {
  inputRef.value?.focus();
};
</script>
```

> **Важно:** template ref в шаблоне и `ref()` из Composition API — разные вещи, хотя и связанные. Template ref создаёт реактивную ссылку на DOM-элемент.

### isRef, unref и customRef

Для проверки, является ли значение `ref`, используется `isRef`. Для извлечения значения из `ref` или использования как есть — `unref`:

```js
import { ref, isRef, unref } from 'vue';

const count = ref(0);
const plain = 42;

console.log(isRef(count)); // true
console.log(isRef(plain)); // false

console.log(unref(count)); // 0
console.log(unref(plain)); // 42
```

`customRef` позволяет создать `ref` с кастомной логикой отслеживания изменений. Классический пример — debounce для поля ввода:

```js
import { customRef } from 'vue';

function useDebouncedRef(value, delay = 300) {
  let timeout;

  return customRef((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(newValue) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        value = newValue;
        trigger();
      }, delay);
    }
  }));
}

// В компоненте
const search = useDebouncedRef('', 500);
```

Каждый раз при вызове `trigger()` Vue уведомляет подписчиков, что значение изменилось. Это даёт полный контроль над моментом обновления.

### Разворачивание ref внутри reactive

Если поле `reactive`-объекта содержит `ref`, Vue автоматически разворачивает его при доступе:

```js
const count = ref(0);
const state = reactive({ count });

console.log(state.count); // 0 — .value не нужен
state.count = 1;          // обновит исходный ref
console.log(count.value); // 1
```

Это удобно, когда смешиваете `reactive` и `ref`, но может сбить с толку: внутри `reactive` обращение к полю `ref` не требует `.value`, а за пределами — требует.

---

## reactive — реактивный объект

`reactive` создаёт реактивный `Proxy` на основе переданного объекта. В отличие от `ref`, здесь не нужна обёртка `.value`:

```js
import { reactive } from 'vue';

const state = reactive({
  count: 0,
  user: { name: 'Alice' }
});

state.count++;
state.user.name = 'Bob';
```

`reactive` работает только с объектоподобными типами: объектами, массивами, `Map`, `Set`. Для примитивов он не подходит.

### Ограничения reactive

Главное ограничение `reactive` — потеря реактивности при деструктуризации или переопределении:

```js
const state = reactive({ count: 0 });

// ❌ Потеряли реактивность
let { count } = state;
count++; // Vue не узнает об изменении

// ❌ Также потеряли реактивность
const stateRef = state;
stateRef = { count: 1 }; // ссылка на новый объект, не реактивный
```

Поэтому `reactive` удобен для «корневого» состояния компонента, которое передаётся целиком, но неудобен, когда нужно вытаскивать отдельные поля.

### Когда использовать reactive

`reactive` хорош для сложных объектов состояния, где много вложенных полей и не нужно переназначать сам объект:

```js
const form = reactive({
  email: '',
  password: '',
  errors: { email: '', password: '' }
});

const updateEmail = (value) => {
  form.email = value;
};
```

Для локального простого состояния чаще используют `ref`, потому что он универсальнее и не теряет реактивность при замене значения.

### reactive и массивы

`reactive` работает и с массивами. Методы вроде `push`, `pop`, `splice` отслеживаются автоматически:

```js
const list = reactive([1, 2, 3]);

list.push(4);      // ✅ UI обновится
list[0] = 10;      // ✅ Работает
list.length = 0;   // ✅ Очистит массив
```

Но если нужно заменить массив целиком, лучше использовать `ref` или присваивать новый массив в поле `reactive`-объекта:

```js
// ✅ Работает: Vue заменит значение и сделает его реактивным
const state = reactive({ items: [1, 2, 3] });
state.items = state.items.filter(n => n > 1);

// ✅ Или используем ref для частой полной замены
const list = ref([1, 2, 3]);
list.value = list.value.filter(n => n > 1);
```

Поэтому для массивов, которые часто перезаписываются целиком, чаще используют `ref`:

```js
const list = ref([1, 2, 3]);
list.value = list.value.filter(n => n > 1); // ✅
```

### markRaw, isReactive, isReadonly, isProxy

Иногда нужно сказать Vue, что объект не должен становиться реактивным. Для этого есть `markRaw`:

```js
import { markRaw, reactive } from 'vue';

const chart = markRaw(new Chart(ctx, options));
const state = reactive({ chart });

// chart останется оригинальным объектом, без Proxy
```

`markRaw` полезен для сложных объектов, чья реактивность не нужна или вредна: DOM-элементы, экземпляры сторонних библиотек, классы с собственным состоянием.

Для проверок используются:

- `isReactive(value)` — является ли значение `reactive` или `shallowReactive`.
- `isReadonly(value)` — является ли значение `readonly` или `shallowReadonly`.
- `isProxy(value)` — является ли значение `reactive` или `readonly`.

```js
import { isReactive, isProxy } from 'vue';

console.log(isReactive(state)); // true
console.log(isProxy(state));    // true
```

### ref vs reactive

| Критерий | `ref` | `reactive` |
|---|---|---|
| Типы данных | Любые: примитивы, объекты, массивы | Только объекты/массивы/коллекции |
| Доступ в скрипте | `count.value` | `state.count` |
| Доступ в шаблоне | `{{ count }}` (разворачивается) | `{{ state.count }}` |
| Замена целиком | `count.value = newValue` | Теряет реактивность |
| Деструктуризация | Сохраняет реактивность как объект | Теряет реактивность |
| Рекомендуемое использование | Основной инструмент | Сложные корневые объекты |

---

## computed — вычисляемые свойства

`computed` создаёт вычисляемое свойство, которое кэширует результат и пересчитывается только при изменении зависимостей.

```vue
<template>
  <p>Итого: {{ total }}</p>
  <p>НДС: {{ vat }}</p>
</template>

<script setup>
import { ref, computed } from 'vue';

const price = ref(100);
const quantity = ref(2);

const total = computed(() => price.value * quantity.value);
const vat = computed(() => total.value * 0.2);
</script>
```

### Почему computed, а не обычная функция

Обычная функция в шаблоне будет вызываться при каждом рендере, даже если её зависимости не изменились. `computed` отслеживает зависимости и пересчитывается лениво — только когда меняется одна из них. Это экономит ресурсы и предотвращает лишние вычисления.

```js
// ❌ Вызывается на каждый рендер
const total = () => price.value * quantity.value;

// ✅ Кэшируется и пересчитывается только при изменении зависимостей
const total = computed(() => price.value * quantity.value);
```

### Writable computed

По умолчанию `computed` доступен только для чтения. Но можно создать writable computed с явными геттером и сеттером:

```js
const firstName = ref('John');
const lastName = ref('Doe');

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newValue) => {
    [firstName.value, lastName.value] = newValue.split(' ');
  }
});

fullName.value = 'Alice Smith'; // обновит firstName и lastName
```

Writable computed полезен для `v-model`, когда нужно представить несколько полей как одно значение.

### computed должен быть чистым

Внутри `computed` не должно быть побочных эффектов: запросов к API, изменения других реактивных значений, модификации DOM. `computed` должен только вычислять значение на основе зависимостей. За побочными эффектами — в `watch` или `watchEffect`.

### computed и v-model

Writable computed часто используется для `v-model`, когда несколько полей нужно представить одним значением:

```vue
<template>
  <input v-model="fullName" />
  <p>First: {{ firstName }}</p>
  <p>Last: {{ lastName }}</p>
</template>

<script setup>
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    const parts = value.split(' ');
    firstName.value = parts[0] ?? '';
    lastName.value = parts[1] ?? '';
  }
});
</script>
```

Это избавляет от ручной синхронизации двух `ref` через `@input` и `$emit`.

### Отладка computed

Для отладки зависимостей можно использовать `onTrack` и `onTrigger`:

```js
const total = computed(() => price.value * quantity.value, {
  onTrack(e) {
    console.log('Отслеживается:', e);
  },
  onTrigger(e) {
    console.log('Триггер:', e);
  }
});
```

Это работает только в dev-режиме и помогает понять, от каких значений зависит `computed` и что его вызывает.

---

## watch — наблюдение за изменениями

`watch` отслеживает изменения конкретного реактивного источника и запускает колбэк. Он похож на `useEffect` в React, но работает иначе: следит за источником, а не за массивом зависимостей.

```js
import { ref, watch } from 'vue';

const count = ref(0);

watch(count, (newValue, oldValue) => {
  console.log(`Изменилось с ${oldValue} на ${newValue}`);
});
```

`watch` ленивый: колбэк не вызывается при создании, только при изменении.

### Отслеживание геттеров

Для отслеживания отдельного поля объекта или выражения используйте геттер:

```js
const user = reactive({ name: 'Alice', age: 30 });

watch(
  () => user.name,
  (newName, oldName) => {
    console.log(`Имя изменилось: ${oldName} -> ${newName}`);
  }
);
```

### Несколько источников

`watch` может следить сразу за несколькими источниками:

```js
watch([count, user.name], ([newCount, newName], [oldCount, oldName]) => {
  // ...
});
```

### Глубокое отслеживание

Для `ref` с объектом глубокое отслеживание включено по умолчанию. Для `reactive` оно тоже работает по умолчанию. Для геттера нужно явно указать `deep: true`:

```js
watch(
  () => user,
  (newUser, oldUser) => {
    // deep: true нужен, потому что отслеживаем геттер
  },
  { deep: true }
);
```

> **Важно:** глубокое отслеживание ресурсоёмко. Используйте его только когда нужно следить за вложенными изменениями.

### flush и immediate

Опции `watch` позволяют управлять моментом вызова колбэка:

```js
watch(count, callback, {
  immediate: true, // вызвать колбэк сразу при создании
  flush: 'post'    // вызвать после обновления DOM
});
```

Значения `flush`:

- `'pre'` — перед обновлением DOM (по умолчанию).
- `'post'` — после обновления DOM, удобно для чтения размеров элементов.
- `'sync'` — синхронно, сразу при изменении.

### Очистка побочных эффектов

Если внутри `watch` создаётся побочный эффект — таймер, подписка, запрос — его нужно очищать. Vue передаёт колбэк очистки в качестве аргумента:

```js
watch(query, async (newQuery, oldQuery, onCleanup) => {
  const controller = new AbortController();

  onCleanup(() => {
    controller.abort();
  });

  const results = await fetch(`/api/search?q=${newQuery}`, {
    signal: controller.signal
  });
});
```

### watch и reactive-объекты

Если передать `reactive`-объект напрямую в `watch`, Vue автоматически включает глубокое отслеживание:

```js
const user = reactive({ name: 'Alice', address: { city: 'Moscow' } });

watch(user, (newValue, oldValue) => {
  // Срабатывает при любом изменении user, включая user.address.city
  console.log('User changed');
});
```

Важный нюанс: `newValue` и `oldValue` указывают на один и тот же объект, потому что `reactive` не создаёт копий. Если нужно сравнивать старое и новое состояние, используйте геттер с `deep: true` или отслеживайте конкретные поля.

### Отладка watch

Как и `computed`, `watch` поддерживает `onTrack` и `onTrigger`:

```js
watch(
  count,
  (newVal, oldVal) => {
    console.log(`Count: ${oldVal} -> ${newVal}`);
  },
  {
    onTrack(e) {
      console.log('Watch отслеживает:', e);
    },
    onTrigger(e) {
      console.log('Watch сработал:', e);
    }
  }
);
```

Это работает только в dev-режиме и помогает понять, почему watcher не срабатывает или срабатывает слишком часто.

---

## watchEffect — автоматическое отслеживание

`watchEffect` немедленно запускает переданную функцию и автоматически отслеживает все реактивные зависимости, использованные внутри неё.

```js
import { ref, watchEffect } from 'vue';

const count = ref(0);

watchEffect(() => {
  console.log(`Count: ${count.value}`);
});

// Сразу выведет "Count: 0"
// При изменении count выведет новое значение
```

### Разница между watch и watchEffect

| Критерий | `watch` | `watchEffect` |
|---|---|---|
| Источник | Явно указан | Автоопределяется по использованным зависимостям |
| Первый запуск | Ленивый (только при изменении) | Немедленный |
| Старые значения | Доступны | Недоступны |
| Контроль | Больше опций | Меньше, но проще |
| Побочные эффекты | Явный колбэк | Функция сама содержит эффект |

`watch` лучше, когда нужно сравнить старое и новое значение или отслеживать конкретный источник. `watchEffect` удобен, когда важно автоматическое отслеживание всех зависимостей.

### Очистка в watchEffect

`watchEffect` тоже поддерживает очистку побочных эффектов:

```js
watchEffect((onCleanup) => {
  const timer = setTimeout(() => {
    console.log('tick');
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer);
  });
});
```

Каждый раз перед повторным запуском `watchEffect` вызывает функцию очистки от предыдущего запуска.

---

## toRef и toRefs — сохраняем реактивность

Когда нужно передать отдельное поле из `reactive`-объекта в другой composable или компонент, простая деструктуризация не подходит — реактивность теряется. Для этого существуют `toRef` и `toRefs`.

### toRef

`toRef` создаёт `ref`, связанный с конкретным свойством объекта:

```js
import { reactive, toRef } from 'vue';

const state = reactive({
  count: 0
});

const countRef = toRef(state, 'count');

console.log(countRef.value); // 0
countRef.value++;
console.log(state.count);    // 1
```

Изменение `countRef.value` изменяет исходный `state.count`, и наоборот.

### toRefs

`toRefs` превращает все свойства `reactive`-объекта в `ref`:

```js
import { reactive, toRefs } from 'vue';

const state = reactive({
  count: 0,
  message: 'Hello'
});

const { count, message } = toRefs(state);

// count и message — ref, сохраняют реактивность
count.value++;
message.value = 'Hi';
```

`toRefs` часто используется в composables, которые возвращают `reactive`-объект, но вызывающий хочет деструктурировать результат:

```js
function useCounter() {
  const state = reactive({
    count: 0,
    double: computed(() => state.count * 2)
  });

  const increment = () => state.count++;

  return {
    ...toRefs(state),
    increment
  };
}

// В компоненте:
const { count, double, increment } = useCounter();
```

> **На собеседовании:** `toRefs` — стандартный паттерн для возврата реактивного состояния из composable с возможностью деструктуризации.

---

## readonly — неизменяемая реактивность

`readonly` создаёт реактивный объект, который нельзя мутировать напрямую. Любая попытка изменения будет предупреждена в dev-режиме.

```js
import { reactive, readonly } from 'vue';

const original = reactive({ count: 0 });
const readOnlyState = readonly(original);

// ❌ Предупреждение в консоли
readOnlyState.count++;
```

### Когда использовать readonly

`readonly` полезен, когда нужно передать состояние вниз по дереву компонентов, но запретить дочерним компонентам его менять. Это аналог one-way data flow в React.

```js
// composable
const state = reactive({ user: null });

export function useUserState() {
  return {
    state: readonly(state),
    setUser: (user) => { state.user = user; }
  };
}
```

Дочерний компонент получает `readonly(state)` и не может его мутировать, но может вызвать `setUser`, который инкапсулирует мутацию.

---

## shallowRef и shallowReactive — поверхностная реактивность

По умолчанию Vue делает реактивными все вложенные объекты. Иногда это не нужно — например, когда внутри хранится большой неизменяемый объект или сторонняя библиотека.

### shallowRef

`shallowRef` реактивен только на уровне самой ссылки `.value`. Внутренние свойства объекта не отслеживаются:

```js
import { shallowRef, triggerRef } from 'vue';

const state = shallowRef({ count: 0 });

// ❌ Это НЕ вызовет обновления
state.value.count++;

// ✅ Это вызовет обновление
state.value = { count: 1 };

// ✅ Или принудительно триггерим
state.value.count++;
triggerRef(state);
```

### shallowReactive

`shallowReactive` отслеживает только прямые свойства объекта, но не вложенные:

```js
import { shallowReactive } from 'vue';

const state = shallowReactive({
  nested: { count: 0 }
});

// ✅ Работает
state.nested = { count: 1 };

// ❌ Не вызовет обновления
state.nested.count++;
```

### Когда применять shallow-API

- Хранение больших иммутабельных данных (например, графов, 3D-сцен).
- Интеграция со сторонними библиотеками, которые управляют своим состоянием.
- Оптимизация производительности, когда глубокая реактивность не нужна.

---

## Реактивность коллекций

Vue 3 поддерживает реактивность для нативных коллекций: `Map`, `Set`, `WeakMap`, `WeakSet`.

```js
import { reactive } from 'vue';

const map = reactive(new Map());
map.set('key', 'value');

const set = reactive(new Set());
set.add(1);
set.add(2);
```

### Особенности коллекций

Реактивные `Map` и `Set` работают так же, как обычные, но их изменения отслеживаются. В шаблоне можно использовать методы вроде `map.get('key')` или `set.size`.

```vue
<template>
  <ul>
    <li v-for="item in set" :key="item">{{ item }}</li>
  </ul>
</template>

<script setup>
import { reactive } from 'vue';

const set = reactive(new Set([1, 2, 3]));
</script>
```

> **Важно:** если положить `Map` или `Set` внутрь `ref`, Vue тоже сделает их реактивными, потому что `ref` объектов использует `reactive`.

---

## Proxy под капотом

Vue 3 использует `Proxy` для реализации реактивности. `Proxy` позволяет перехватывать операции чтения и записи свойств объекта.

### Как это работает

```js
const target = { count: 0 };

const proxy = new Proxy(target, {
  get(target, key) {
    console.log(`Чтение ${String(key)}`);
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    console.log(`Запись ${String(key)}: ${value}`);
    return Reflect.set(target, key, value);
  }
});

proxy.count++; // Чтение count, Запись count: 1
```

Vue делает примерно то же самое, но вместо `console.log`:

- При `get` вызывает `track()` — регистрирует зависимость.
- При `set` вызывает `trigger()` — уведомляет подписчиков.

### Реактивные эффекты

Когда `computed`, `watchEffect` или шаблон обращаются к реактивному объекту, Vue запускает их внутри «эффекта» (`effect`). Этот эффект подписывается на все прочитанные реактивные значения. При изменении любого из них эффект перезапускается.

```js
// Упрощённая модель
const count = ref(0);

watchEffect(() => {
  console.log(count.value); // эффект подписался на count
});

count.value++; // trigger уведомил эффект, тот перезапустился
```

### Почему Vue 3 перешёл на Proxy

Vue 2 использовал `Object.defineProperty`, который требовал предварительного обхода всех свойств объекта и не поддерживал:

- добавление новых свойств;
- удаление свойств;
- индексацию массивов;
- `Map`, `Set`;
- динамические ключи.

`Proxy` лишён этих ограничений: он перехватывает любые операции с объектом на лету.

### Ловушки Proxy

`Proxy` не перехватывает всё. Например, операции с `Date`, `RegExp` и некоторыми встроенными методами требуют особой обработки. Vue оборачивает их специальными «reactive collections». Также `Proxy` не работает с примитивами — отсюда необходимость `ref`.

### targetMap, effect и scheduler

Если заглянуть в исходный код Vue, реактивность устроена так:

- Каждый реактивный объект хранит карту зависимостей (`targetMap`): объект → ключ → набор эффектов.
- Когда эффект читает свойство, он добавляется в соответствующий набор.
- Когда свойство изменяется, Vue берёт все эффекты из набора и ставит их в очередь (`scheduler`).
- `scheduler` гарантирует, что эффекты выполняются асинхронно и дедуплицируются: одно и то же изменение не вызовет лишних перерисовок.

Это объясняет, почему несколько изменений подряд вызывают только один рендер:

```js
const count = ref(0);

// Все три операции сгруппируются в одно обновление
count.value++;
count.value++;
count.value++;
```

---

## Edge cases и частые ошибки

### Потеря реактивности при передаче в функцию

Если передать `reactive`-объект в функцию, которая его мутирует, реактивность сохранится, потому что объект остаётся тем же Proxy. Но если функция возвращает новый объект, он уже не будет реактивным:

```js
const state = reactive({ items: [1, 2, 3] });

// ✅ Реактивность сохранена: мутируем существующий массив
const add = (item) => state.items.push(item);

// ✅ Тоже сохранена: Vue сделает новый массив реактивным при присвоении
state.items = state.items.filter(i => i > 1);

// ❌ Потеря реактивности: новый массив не присвоен в reactive-поле
const filtered = state.items.filter(i => i > 1);
// filtered — обычный массив, а не reactive
```

### Деструктуризация props

Props — это reactive-объект. Если деструктурировать его в `<script setup>`, теряется реактивность:

```vue
<script setup>
const props = defineProps({ user: Object });

// ❌ Потеря реактивности
const { user } = props;

// ✅ Реактивность сохранена
toRefs(props).user;
</script>
```

Поэтому в шаблоне доступ к `props.user` всегда реактивен, а в скрипте стоит быть осторожным.

### watch не срабатывает на примитив в объекте

Если отслеживать `ref` с объектом через геттер без `deep`, вложенные изменения не будут замечены:

```js
const user = ref({ name: 'Alice' });

// ❌ Не сработает при user.value.name = 'Bob'
watch(() => user.value, () => {
  console.log('changed');
});

// ✅ Сработает
watch(user, () => {
  console.log('changed');
}, { deep: true });
```

### Одинаковые объекты в ref

Если присвоить `ref.value` тот же объект по ссылке, Vue не вызовет обновления, потому что значение не изменилось:

```js
const user = ref({ name: 'Alice' });
const sameUser = user.value;

user.value = sameUser; // trigger не сработает
```

Это поведение аналогично React с `Object.is`.

---

## Сравнение с React

| Vue | React | Примечание |
|---|---|---|
| `ref` | `useState` | Оба хранят состояние, но Vue использует мутацию через `.value`, React — иммутабельный сеттер |
| `reactive` | `useState` для объектов | Vue позволяет мутировать объект напрямую, React требует новой ссылки |
| `computed` | `useMemo` | Оба кэшируют значение, но `computed` отслеживает зависимости автоматически |
| `watch` | `useEffect` | `watch` следит за источником, `useEffect` — за массивом зависимостей |
| `watchEffect` | `useEffect` без массива | Автоотслеживание зависимостей в Vue vs ручной массив в React |
| `readonly` | — | В React однонаправленный поток данных достигается через props и соглашения |
| `shallowRef` | `useRef` для объектов | В React `useRef` не реактивен; Vue `shallowRef` реактивен на уровне ссылки |

### Ключевое отличие: мутация vs иммутабельность

В React состояние обновляется иммутабельно: нужно создавать новый объект или массив. В Vue `reactive` и `ref` позволяют мутировать данные напрямую, потому что `Proxy` отслеживает изменения.

```jsx
// React
const [user, setUser] = useState({ name: 'Alice' });
setUser({ ...user, name: 'Bob' });
```

```vue
<!-- Vue -->
<script setup>
const user = reactive({ name: 'Alice' });
user.name = 'Bob'; // ✅ Работает
</script>
```

Это делает Vue-код компактнее для типовых CRUD-операций, но требует дисциплины: важно не мутировать чужие данные, особенно props.

---

## Лучшие практики и антипаттерны

### ✅ Правильно

**Используйте `ref` как основной инструмент.**

`ref` универсален: работает с примитивами, объектами, массивами. Он не теряет реактивность при замене значения и удобен в деструктуризации.

**Предпочитайте `computed` для производных данных.**

Если значение можно вычислить из других реактивных значений — используйте `computed`. Это кэширование и автоматическое отслеживание зависимостей из коробки.

**Очищайте побочные эффекты в `watch` и `watchEffect`.**

Таймеры, подписки, `AbortController` — всё должно очищаться, чтобы избежать утечек памяти и гонок состояний.

**Используйте `readonly` для защиты состояния.**

Если composable отдаёт состояние наружу, оберните его в `readonly`, а мутации вынесите в отдельные функции.

### ❌ Антипаттерны

**Мутация props.**

Props во Vue передаются по ссылке. Если переданный prop — объект, его мутация изменит состояние родителя, что нарушает однонаправленный поток данных.

```vue
<script setup>
const props = defineProps(['user']);

// ❌ Неправильно: мутируем prop
props.user.name = 'Bob';
</script>
```

Правильно: эмитить событие и менять данные в родителе.

**Деструктуризация `reactive` без `toRefs`.**

```js
// ❌ Потеря реактивности
const { count } = state;

// ✅ Реактивность сохранена
const { count } = toRefs(state);
```

**Побочные эффекты внутри `computed`.**

```js
// ❌ Неправильно
const fullName = computed(() => {
  sendAnalytics(); // побочный эффект
  return `${firstName.value} ${lastName.value}`;
});
```

Для побочних эффектов используйте `watch` или `watchEffect`.

**Избыточные watchers.**

Не оборачивайте всё подряд в `watch`. Если значение используется в шаблоне или `computed`, Vue и так отследит его изменения. `watch` нужен для побочних эффектов.

**Глубокое отслеживание без нужды.**

`deep: true` увеличивает нагрузку. Используйте его только тогда, когда действительно нужно реагировать на вложенные изменения.

---

## Ключевые тезисы для интервью

1. **`ref`** создаёт реактивную обёртку с `.value` и подходит для любых типов данных; в шаблоне `.value` писать не нужно.
2. **`reactive`** создаёт реактивный `Proxy` только для объектов; теряет реактивность при деструктуризации и полной замене.
3. **`computed`** кэширует результат и пересчитывается только при изменении зависимостей; должен быть чистым.
4. **`watch`** лениво следит за конкретным источником и предоставляет старое и новое значение; поддерживает `immediate`, `deep`, `flush`.
5. **`watchEffect`** немедленно запускается и автоматически отслеживает все использованные зависимости.
6. **`toRef` и `toRefs`** позволяют сохранить реактивность при деструктуризации `reactive`-объекта.
7. **`readonly`** создаёт защищённую от мутаций реактивную копию; попытка изменения выдаёт предупреждение.
8. **`shallowRef` и `shallowReactive`** обеспечивают реактивность только на верхнем уровне, что полезно для оптимизации и интеграции со сторонними библиотеками.
9. **Vue 3 использует `Proxy`** для отслеживания чтения и записи; Vue 2 использовал `Object.defineProperty` с серьёзными ограничениями.
10. **Не мутируйте props** — используйте события или composable с `readonly` + setter.

---

## Заключение

Реактивность Vue 3 — это мощная и элегантная система, которая скрывает сложность синхронизации данных и UI за простыми примитивами. `ref` и `reactive` отвечают за хранение состояния, `computed` — за производные данные, `watch` и `watchEffect` — за побочные эффекты. `toRef`, `toRefs`, `readonly` и shallow-API решают специализированные задачи: передачу реактивности, защиту данных и оптимизацию.

Под капотом всё это работает на `Proxy`: Vue перехватывает чтение свойств, чтобы зарегистрировать зависимости, и запись, чтобы уведомить подписчиков. Понимание этого механизма помогает не только писать корректный код, но и уверенно отвечать на вопросы собеседований о внутреннем устройстве фреймворка.

---

## Полезные ссылки

- [Реактивность в Vue 3](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) — официальная документация.
- [Computed Properties](https://vuejs.org/guide/essentials/computed.html)
- [Watchers](https://vuejs.org/guide/essentials/watchers.html)
- [Reactivity API: Core](https://vuejs.org/api/reactivity-core.html)
- [Reactivity API: Utilities](https://vuejs.org/api/reactivity-utilities.html)
- [Reactivity API: Advanced](https://vuejs.org/api/reactivity-advanced.html)
- [How Vue's Reactivity Works (Evan You)](https://www.youtube.com/watch?v=YP7d9ae_VzI) — доклад о внутреннем устройстве.
