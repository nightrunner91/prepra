---
title: "Composition API и <script setup>"
section: vue
description: "Composition API в Vue 3: setup(), <script setup>, composables, provide/inject, организация кода и лучшие практики для собеседований."
order: 3
tags: ["vue", "vue3", "composition-api", "script-setup", "composables", "provide-inject", "setup"]
questions:
  - "Чем setup() отличается от <script setup> и что предпочитать в новом коде"
  - "Какие top-level bindings <script setup> автоматически доступны в шаблоне"
  - "Что такое composable и какие соглашения именования и структуры он использует"
  - "Как работают provide и inject и почему важно использовать InjectionKey"
  - "Какие макросы доступны в <script setup>: defineProps, defineEmits, defineExpose, defineOptions"
  - "Как организовать код внутри <script setup>: порядок секций и разбиение на composables"
  - "Чем composables отличаются от React hooks по правилам вызова и отслеживанию зависимостей"
  - "Какие антипаттерны чаще всего встречаются при использовании Composition API"
---

# Composition API и `<script setup>`

Composition API — это основной способ описания логики компонентов в Vue 3. В отличие от Options API, где код разбивается по опциям `data`, `methods`, `computed` и `watch`, Composition API позволяет группировать код по логическим задачам: аутентификация, работа с формой, подписка на события, запросы к API. Это делает компоненты проще для чтения и тестирования, особенно когда они растут.

Эта статья посвящена тому, как писать компоненты на Composition API. Мы разберём явную функцию `setup()`, современный синтаксис `<script setup>`, переиспользуемые `composables`, внедрение зависимостей через `provide`/`inject` и правила организации кода. Основной фокус — `<script setup>`, потому что это рекомендуемый стиль в новых проектах. `setup()` рассматривается как форма, которая всё ещё полезна в некоторых ситуациях и необходима для понимания работы Vue под капотом.

## Содержание

1. [Что такое Composition API](#что-такое-composition-api)
2. [setup() — явный вход в Composition API](#setup--явный-вход-в-composition-api)
3. [`<script setup>` — синтаксический сахар](#script-setup--синтаксический-сахар)
4. [Top-level bindings и шаблон](#top-level-bindings-и-шаблон)
5. [Макросы `<script setup>`: defineProps, defineEmits, defineExpose, defineOptions](#макросы-script-setup-defineprops-defineemits-defineexpose-defineoptions)
6. [Composables — логика переиспользования](#composables--логика-переиспользования)
7. [Организация кода внутри `<script setup>`](#организация-кода-внутри-script-setup)
8. [provide / inject](#provide--inject)
9. [`getCurrentInstance` и почему его лучше избегать](#getcurrentinstance-и-почему-его-лучше-избегать)
10. [Сравнение с React Hooks](#сравнение-с-react-hooks)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Composition API

Composition API появился в Vue 3 как ответ на растущую сложность компонентов. В Options API логика одной фичи размазана по разным секциям: состояние в `data`, вычисления в `computed`, обработчики в `methods`, побочные эффекты в `watch` и `mounted`. В больших компонентах это приводит к постоянному прыжку между секциями при чтении кода.

Composition API предлагает другой подход: собирать код, относящийся к одной задаче, вместе. Это достигается за счёт функции `setup()` или синтаксиса `<script setup>`, внутри которых можно использовать реактивные примитивы, lifecycle hooks и любой JavaScript-код в произвольном порядке.

```vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue';

// --- Фича: счётчик ---
const count = ref(0);
const doubled = computed(() => count.value * 2);
const increment = () => count.value++;

watch(count, (newVal) => {
  console.log('count changed:', newVal);
});

// --- Фича: загрузка пользователя ---
const user = ref(null);

onMounted(async () => {
  user.value = await fetchUser();
});

async function fetchUser() {
  const res = await fetch('/api/user');
  return res.json();
}
</script>

<template>
  <div>
    <p>Count: {{ count }} (doubled: {{ doubled }})</p>
    <button @click="increment">+</button>
    <p v-if="user">User: {{ user.name }}</p>
  </div>
</template>
```

Здесь две фичи живут рядом, но каждая собрана вместе. В Options API части этих фич были бы разнесены по `data`, `computed`, `methods` и `mounted`.

Composition API не заменяет Options API полностью. Options API остаётся поддерживаемым и иногда удобным для простых компонентов или миграции legacy-кода. Но для новых проектов на Vue 3 рекомендуется Composition API + `<script setup>`.

---

## setup() — явный вход в Composition API

Функция `setup()` — это точка входа в Composition API. Она вызывается один раз при создании экземпляра компонента, после разрешения `props`, но до создания реактивного контекста и монтирования DOM.

### Сигнатура

```js
setup(props, context) {
  // логика компонента
  return { ... };
}
```

- `props` — реактивный объект с пропсами компонента.
- `context` — не реактивный объект с вспомогательными свойствами:
  - `attrs` — атрибуты, не объявленные как `props`.
  - `slots` — слоты компонента.
  - `emit` — функция для отправки событий.
  - `expose` — функция для явного контроля публичного API компонента.

### Возвращаемое значение

`setup()` должна вернуть объект, свойства которого становятся доступны в шаблоне:

```vue
<script>
import { ref } from 'vue';

export default {
  setup() {
    const count = ref(0);

    const increment = () => {
      count.value++;
    };

    return {
      count,
      increment,
    };
  },
};
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

Возвращать можно реактивные `ref`, `reactive`, `computed`, обычные функции, константы и даже render-функцию. Если вернуть функцию, она будет использована как `render`.

### `this` в setup()

Внутри `setup()` `this` недоступен. Компонент ещё не создан, поэтому обращаться к `this.$emit`, `this.$slots` или `this.$refs` нельзя. Вместо этого используются аргументы `context` и reactive refs.

### Реактивность props

`props` — реактивный объект. Если его деструктурировать напрямую, реактивность теряется:

```js
// ❌ Неправильно: title перестаёт быть реактивным
setup({ title }) {
  watch(() => title, () => {}); // не отреагирует на изменения
}
```

Правильный способ — обращаться через `props.title` или использовать `toRefs`:

```js
import { toRefs } from 'vue';

setup(props) {
  const { title } = toRefs(props);
  watch(title, (newTitle) => {
    console.log(newTitle);
  });
}
```

### Async setup()

`setup()` может быть асинхронной. В таком случае компонент становится `async component` и должен использоваться внутри `<Suspense>`:

```vue
<script>
import { ref } from 'vue';

export default {
  async setup() {
    const posts = ref(await fetch('/api/posts').then(r => r.json()));
    return { posts };
  },
};
</script>
```

То же самое верно и для `<script setup>`: если использовать `await` на верхнем уровне, компонент становится асинхронным.

---

## `<script setup>` — синтаксический сахар

`<script setup>` — это компилируемый синтаксис для Composition API. Он транслируется в обычную функцию `setup()` на этапе сборки, но убирает boilerplate: не нужно писать `export default { setup() { ... } }` и возвращать объект.

```vue
<script setup>
import { ref } from 'vue';

const count = ref(0);
const increment = () => count.value++;
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

После компиляции этот код превращается примерно в:

```js
export default {
  setup() {
    const count = ref(0);
    const increment = () => count.value++;

    return { count, increment };
  },
};
```

### Преимущества

- Меньше шаблонного кода.
- Top-level переменные и функции автоматически доступны в шаблоне.
- Импорты напрямую доступны в шаблоне: не нужно регистрировать компоненты в `components`.
- Лучшая поддержка TypeScript и tree-shaking.

### Комбинирование с обычным `<script>`

Иногда нужно использовать Options API или объявить module-level константы. В таких случаях можно использовать два блока `<script>`:

```vue
<script>
// Обычный блок: можно использовать Options API
export default {
  name: 'UserCard',
  inheritAttrs: false,
};
</script>

<script setup>
import { ref } from 'vue';

const user = ref(null);
</script>
```

С Vue 3.3 для многих опций появился макрос `defineOptions`, поэтому отдельный `<script>` нужен реже:

```vue
<script setup>
defineOptions({
  name: 'UserCard',
  inheritAttrs: false,
});

const user = ref(null);
</script>
```

### Ограничения

- `<script setup>` работает только в SFC.
- Нельзя одновременно использовать `setup()` и `<script setup>` в одном компоненте.
- Все top-level bindings считаются публичными для шаблона, если не указано иное через `defineExpose`.

---

## Top-level bindings и шаблон

В `<script setup>` всё, что объявлено на верхнем уровне, автоматически доступно в шаблоне. Сюда входят:

- переменные и константы;
- функции;
- импортированные компоненты;
- импортированные хелперы из `vue`.

```vue
<script setup>
import { ref, computed } from 'vue';
import BaseButton from './BaseButton.vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
}
</script>

<template>
  <BaseButton @click="increment">
    Count: {{ count }}, doubled: {{ doubled }}
  </BaseButton>
</template>
```

Здесь `BaseButton`, `count`, `doubled` и `increment` доступны в шаблоне без дополнительной регистрации.

### Приватность

Если переменная или функция не должна использоваться в шаблоне, это не запрещено, но считается хорошим тоном выносить чистую логику в отдельные модули или composables. Сам `<script setup>` не имеет понятия «приватного» binding, но шаблон видит только то, что использует.

### Именование

Имена top-level bindings должны быть валидными JavaScript-идентификаторами. Имена компонентов в PascalCase автоматически распознаются как компоненты в шаблоне, тогда как имена в camelCase или kebab-case интерпретируются как обычные переменные или HTML-элементы.

---

## Макросы `<script setup>`: defineProps, defineEmits, defineExpose, defineOptions

Внутри `<script setup>` доступны специальные компиляционные макросы. Они выглядят как функции, но на самом деле преобразуются компилятором Vue в соответствующие объявления компонента. Их не нужно импортировать.

### defineProps

Объявляет входные параметры компонента:

```vue
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <h1>{{ props.title }}</h1>
</template>
```

Также поддерживается TypeScript-синтаксис:

```vue
<script setup lang="ts">
const props = defineProps<{
  title: string;
  count?: number;
}>();
</script>
```

### defineEmits

Объявляет события, которые компонент может отправлять:

```vue
<script setup>
const emit = defineEmits(['update', 'delete']);

const handleClick = () => {
  emit('update', { id: 1 });
};
</script>
```

TypeScript-вариант:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [id: number];
  delete: [id: number];
}>();
</script>
```

### defineExpose

По умолчанию компонент на `<script setup>` не экспонирует свои внутренние методы и свойства родителям через `ref`. Чтобы открыть доступ к определённым членам, используется `defineExpose`:

```vue
<script setup>
import { ref } from 'vue';

const inputRef = ref(null);

const focus = () => {
  inputRef.value?.focus();
};

defineExpose({
  focus,
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

Родитель:

```vue
<script setup>
import { ref, onMounted } from 'vue';
import SearchInput from './SearchInput.vue';

const searchInput = ref(null);

onMounted(() => {
  searchInput.value?.focus();
});
</script>

<template>
  <SearchInput ref="searchInput" />
</template>
```

### defineOptions

Позволяет объявить Options API-опции внутри `<script setup>`:

```vue
<script setup>
defineOptions({
  name: 'AppButton',
  inheritAttrs: false,
});
</script>
```

### defineModel

Начиная с Vue 3.4, `defineModel` предоставляет удобный способ реализации `v-model`:

```vue
<script setup>
const modelValue = defineModel();
</script>

<template>
  <input v-model="modelValue" />
</template>
```

Под капотом это компилируется в пропс `modelValue` и событие `update:modelValue`. Подробнее о типизации `defineModel` разбирается в статье про TypeScript во Vue.

---

## Composables — логика переиспользования

Composable — это функция, которая инкапсулирует реактивное состояние и побочные эффекты и может быть переиспользована между компонентами. Это основной механизм композиции в Composition API.

Хороший composable обычно:

- называется с префикса `use`, например `useMouse`, `useFetch`, `useLocalStorage`;
- может принимать аргументы и возвращать refs, объекты или функции;
- сам управляет подписками и отписками через lifecycle hooks;
- не зависит от конкретного компонента.

### Пример: useMouse

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0);
  const y = ref(0);

  const update = (event: MouseEvent) => {
    x.value = event.pageX;
    y.value = event.pageY;
  };

  onMounted(() => {
    window.addEventListener('mousemove', update);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });

  return { x, y };
}
```

Использование:

```vue
<script setup>
import { useMouse } from './composables/useMouse';

const { x, y } = useMouse();
</script>

<template>
  <p>Mouse: {{ x }}, {{ y }}</p>
</template>
```

### Пример: useFetch

```ts
// composables/useFetch.ts
import { ref, watchEffect, toValue } from 'vue';

export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  const fetchData = () => {
    loading.value = true;

    fetch(toValue(url))
      .then((res) => res.json())
      .then((json) => {
        data.value = json;
        error.value = null;
      })
      .catch((err) => {
        error.value = err;
        data.value = null;
      })
      .finally(() => {
        loading.value = false;
      });
  };

  watchEffect(fetchData);

  return {
    data,
    error,
    loading,
    refresh: fetchData,
  };
}
```

`toValue` (доступен с Vue 3.3) позволяет принимать как строку, так и `ref` с URL. Composable автоматически перезапросит данные, если URL изменится.

### Composable как функция-хелпер

Не всякая функция, использующая Vue API, должна называться `useXxx`. Если функция не хранит состояние и не использует lifecycle hooks, это обычный хелпер. Composable — это именно функция, которая завязывается на реактивность и/или lifecycle компонента.

```ts
// composable: хранит состояние и использует lifecycle
export function useCounter() {
  const count = ref(0);
  const increment = () => count.value++;
  return { count, increment };
}

// обычная функция-хелпер
export function formatPrice(value, currency = 'USD') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(value);
}
```

### Асинхронные composables

Composable может быть асинхроным, но важно помнить, что `setup()` выполняется синхронно до монтирования. Если composable возвращает Promise, его результат нужно обрабатывать через `await` в `<script setup>`, что делает компонент асинхронным и требует `<Suspense>`.

---

## Организация кода внутри `<script setup>`

Хотя `<script setup>` даёт свободу в расположении кода, свобода не означает отсутствие порядка. Единый стиль внутри команды важен для читаемости.

Рекомендуемый порядок секций:

1. **Импорты**: Vue API, сторонние библиотеки, composables, компоненты, утилиты.
2. **Макросы**: `defineProps`, `defineEmits`, `defineOptions`, `defineExpose`.
3. **Константы и конфигурация**: статические значения, валидаторы, ключи.
4. **Вызов composables**: `useRoute`, `useRouter`, `useFetch`, кастомные `useXxx`.
5. **Реактивное состояние**: `ref`, `reactive`, `computed`.
6. **Watchers**: `watch`, `watchEffect`.
7. **Методы**: обработчики событий, вспомогательные функции.
8. **Lifecycle hooks**: `onMounted`, `onUnmounted` и другие.
9. **Expose и другие макросы** в конце, если нужно.

Это не догма, а отправная точка. Главное — группировать код по фичам, а не по типам.

```vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUser } from './composables/useUser';
import UserProfile from './UserProfile.vue';

// --- Макросы ---
const props = defineProps({
  userId: String,
});

const emit = defineEmits(['loaded']);

// --- Composables ---
const route = useRoute();
const { user, loadUser } = useUser(props.userId || route.params.id);

// --- Реактивное состояние ---
const isEditing = ref(false);
const fullName = computed(() => `${user.value?.firstName} ${user.value?.lastName}`);

// --- Watchers ---
watch(user, (newUser) => {
  if (newUser) {
    emit('loaded', newUser);
  }
});

// --- Методы ---
const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

// --- Lifecycle ---
onMounted(() => {
  loadUser();
});
</script>
```

В этом примере логика читается сверху вниз: сначала входные параметры, потом зависимости, потом состояние, потом поведение.

---

## provide / inject

`provide` и `inject` — это механизм внедрения зависимостей в дереве компонентов. Он позволяет передать данные от предка к потомкам на любом уровне вложенности без prop drilling.

### Базовый пример

```vue
<!-- Parent.vue -->
<script setup>
import { provide, ref } from 'vue';

const theme = ref('light');

provide('theme', theme);
</script>
```

```vue
<!-- DeepChild.vue -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme');
</script>

<template>
  <div>Current theme: {{ theme }}</div>
</template>
```

### InjectionKey и типизация

Для избежания коллизий имён и лучшей поддержки TypeScript рекомендуется использовать `Symbol` через `InjectionKey`:

```ts
// keys.ts
import type { InjectionKey, Ref } from 'vue';

export type Theme = 'light' | 'dark';

export const ThemeKey: InjectionKey<Ref<Theme>> = Symbol('theme');
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue';
import { ThemeKey, type Theme } from './keys';

const theme = ref<Theme>('light');
provide(ThemeKey, theme);
</script>
```

```vue
<!-- Child.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { ThemeKey } from './keys';

const theme = inject(ThemeKey, ref('light'));
</script>
```

### Реактивность

Если через `provide` передан `ref` или `reactive`, потомок получит ту же самую реактивную ссылку. Изменения в одном компоненте будут видны во всех остальных.

```vue
<script setup>
import { provide, ref } from 'vue';

const user = ref({ name: 'Alice' });
provide('user', user);

const rename = () => {
  user.value.name = 'Bob';
};
</script>
```

### Когда использовать

`provide`/`inject` хорошо подходит для:

- темы, локали, настроек приложения;
- данных, которые нужны на нескольких уровнях вложенности;
- форм, где родительская форма предоставляет состояние дочерним полям.

Не стоит использовать его как замену Pinia или Vuex для глобального состояния: для больших приложений централизованное управление состоянием предсказуемее.

---

## `getCurrentInstance` и почему его лучше избегать

`getCurrentInstance()` возвращает текущий внутренний экземпляр компонента во время выполнения `setup()`. Через него можно получить доступ к свойствам вроде `slots`, `emit`, `props` и даже к внутренним API Vue.

```js
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
console.log(instance.props.title);
```

### Почему не стоит использовать в прикладном коде

- Это внутренний API, который может меняться между версиями.
- Код становится хрупким и плохо тестируемым.
- Практически всё, что нужно в компоненте, доступно через `props`, `defineEmits`, `slots` и `provide`/`inject`.

`getCurrentInstance` оправдан в библиотеках, плагинах и сложных интеграциях, где нет другого способа добраться до внутренностей Vue. В обычном приложении его использование считается антипаттерном.

---

## Сравнение с React Hooks

Composition API часто сравнивают с React Hooks, потому что оба подхода позволяют выносить и переиспользовать логику состояния. Но между ними есть важные различия.

| Аспект | Vue composables | React hooks |
|---|---|---|
| Где вызываются | Внутри `setup()` или `<script setup>` | Внутри компонента-функции |
| Условный вызов | Можно вызывать условно | Запрещён: нарушает порядок hooks |
| Правила порядка | Нет | Rules of Hooks |
| Зависимости | Автоматическое отслеживание в `computed`/`watchEffect` | Явные массивы зависимостей в `useEffect`/`useMemo` |
| Cleanup | `onUnmounted` или отмена в `watch` | Функция-очистка из `useEffect` |
| Состояние | `ref`, `reactive` | `useState`, `useReducer` |
| `this` | Нет | Нет |
| Производительность | Меньше необходимости в мемоизации | Часто требуется `useMemo`/`useCallback` |

Главное отличие в философии: React Hooks строятся вокруг строгих правил вызова и явных зависимостей. Vue composables — это обычные функции, которые используют реактивную систему Vue. Это делает их более гибкими, но не отменяет ответственности за корректную работу с lifecycle и побочными эффектами.

Например, в React нельзя написать:

```jsx
if (condition) {
  useEffect(() => {}, []);
}
```

В Vue аналогичный composable можно вызвать условно, если он сам корректно обрабатывает отсутствие lifecycle:

```vue
<script setup>
if (someCondition) {
  useEventListener(window, 'resize', handler);
}
</script>
```

Однако lifecycle hooks внутри composable всё равно регистрируются в момент вызова, поэтому условные composables следует применять осмотрительно.

---

## Лучшие практики и антипаттерны

### Лучшие практики

- **Используйте `<script setup>` для новых компонентов.** Это современный стандарт Vue 3.
- **Выносите логику в composables.** Если в `<script setup>` больше 100–150 строк, подумайте о разделении по фичам.
- **Именуйте composables с префиксом `use`.** Это общепринятое соглашение во всей экосистеме Vue.
- **Очищайте побочные эффекты.** Всегда отписывайтесь от событий, таймеров и подписок в `onUnmounted`.
- **Используйте `InjectionKey` с `Symbol`.** Это защищает от коллизий имён и улучшает типизацию.
- **Не мутируйте `props`.** Props — однонаправленный поток данных. Для изменений используйте события или `v-model`.
- **Не деструктурируйте `props` без `toRefs`.** Иначе потеряете реактивность.

### Антипаттерны

- **Огромный `<script setup>` без разбиения.** Когда в одном файле смешаны десятки фич, компонент сложно поддерживать.
- **Использование `getCurrentInstance` в прикладном коде.** Это внутренний API, который делает код хрупким.
- **Вызов composable вне `setup()` или другого composable.** Vue lifecycle hooks не будут привязаны к правильному экземпляру компонента.
- **Создание composable без префикса `use`.** Ломает соглашения и затрудняет поиск.
- **Async `<script setup>` без `<Suspense>`.** Компонент с `await` на верхнем уровне становится асинхронным и не может рендериться без границы Suspense.
- **Передача мутабельных объектов через `provide` без контракта.** Легко получить неявные зависимости, которые сложно отлаживать.

---

## Ключевые тезисы для интервью

1. **Composition API** группирует код по логическим задачам, а не по опциям. Это основной стиль в Vue 3.
2. **`<script setup>`** — компилируемый синтаксис для Composition API, который убирает boilerplate и автоматически экспонирует top-level bindings в шаблон.
3. **`setup()`** вызывается до создания компонента, внутри неё `this` недоступен, а `props` — реактивный объект.
4. В `<script setup>` доступны макросы `defineProps`, `defineEmits`, `defineExpose`, `defineOptions` и, начиная с Vue 3.4, `defineModel`. Их не нужно импортировать.
5. **Composables** — функции с префиксом `use`, инкапсулирующие реактивное состояние и побочные эффекты. Они — основной способ переиспользования логики.
6. **`provide`/`inject`** позволяет передавать данные вниз по дереву без prop drilling. Для типизации и защиты от коллизий используйте `InjectionKey` с `Symbol`.
7. Не деструктурируйте `props` напрямую — используйте `toRefs`, чтобы сохранить реактивность.
8. Не используйте `getCurrentInstance` в прикладном коде — это внутренний API.
9. Composables в Vue можно вызывать более свободно, чем React hooks, но lifecycle hooks всё равно привязаны к моменту вызова.
10. Async `<script setup>` требует `<Suspense>`, потому что компонент становится асинхронным.

---

## Заключение

Composition API и `<script setup>` — это современный способ писать Vue-компоненты. Они дают гибкость в организации кода, мощные средства для переиспользования логики через composables и удобный механизм внедрения зависимостей через `provide`/`inject`. Правильное использование этих инструментов делает компоненты более читаемыми, тестируемыми и масштабируемыми.

Для подготовки к собеседованиям важно понимать разницу между `setup()` и `<script setup>`, уметь писать composables, знать макросы и помнить об антипаттернах вроде деструктуризации `props` и использования `getCurrentInstance`. В следующих статьях раздела мы рассмотрим Vue Router, жизненный цикл компонента и события во Vue.

---

## Полезные ссылки

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) — официальная документация Vue.
- [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) — подробное руководство по синтаксису.
- [Composables](https://vuejs.org/guide/reusability/composables.html) — рекомендации по написанию переиспользуемой логики.
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) — документация по внедрению зависимостей.
- [VueUse](https://vueuse.org/) — библиотека готовых composables.
- [Options API vs Composition API](https://vuejs.org/guide/extras/composition-api-faq.html#options-api-vs-composition-api) — когда что использовать.
