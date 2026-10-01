---
title: "TypeScript во Vue"
section: typescript
description: "TypeScript во Vue 3: defineProps и withDefaults, defineEmits, ref/computed, v-model и defineModel, generic-компоненты, типизация слотов, provide/inject с InjectionKey и vue-tsc."
order: 9
tags: ["typescript", "vue", "defineprops", "defineemits", "injectionkey", "template-refs"]
questions:
  - "Как типизировать пропсы через `defineProps<T>()` и `withDefaults`"
  - "Чем типизация событий через `defineEmits<T>()` отличается от пропсов-функций в React"
  - "Как типизировать `ref`, `reactive` и `computed`"
  - "Как типизировать `v-model` через `modelValue` и что даёт `defineModel`"
  - "Что даёт атрибут `generic=\"T\"` у `<script setup lang=\"ts\">`"
  - "Как типизировать слоты через `useSlots` и `defineSlots`"
  - "Как типизировать template ref на DOM-элемент и на компонент"
  - "Зачем нужен `InjectionKey<T>` для `provide`/`inject`"
  - "Почему шаблоны `.vue` нужно проверять через `vue-tsc`, а не обычный `tsc`"
answers:
  - "Пропсы типизируются макросом `defineProps<Props>()` — передаётся interface, type или inline-тип. Дефолты задаёт `withDefaults(defineProps<Props>(), { variant: \"primary\" })`, который снимает optional-флаг у пропсов с дефолтом, или деструктуризация с дефолтом `const { type = \"info\" } = defineProps<Props>()` (Vue 3.5+, стабильна)."
  - "Во Vue события объявляются макросом `defineEmits<T>()` с call signature `(e: \"change\", value: string): void` или именованными кортежами `{ change: [value: string] }` — TS проверяет и имя события, и payload. В React событие — обычный пропс-функция `onChange: (value: string) => void`."
  - "`ref(0)` выводит `Ref<number>`, для nullable нужен явный дженерик `ref<User | null>(null)` (как `useState<User | null>` в React). `reactive<T>({...})` работает только с объектами. `computed(...)` выводит `ComputedRef<T>` из колбэка."
  - "`v-model` на компоненте — это пропс `modelValue` + событие `update:modelValue`, оба типизируются явно. `defineModel<string>()` (Vue 3.4+) заменяет пару «пропс + emit» одним типизированным ref; `{ required: true }` убирает `undefined` из типа."
  - "Атрибут `generic=\"T extends Item\"` у `<script setup lang=\"ts\">` объявляет дженерик-параметры компонента, как `function List<T>(props: ListProps<T>)` в React. Поддерживает несколько параметров, constraints и default-типы; T выводится из передаваемых пропсов."
  - "`useSlots()` возвращает `Record<string, Slot | undefined>` без типов пропсов слотов. `defineSlots<{ default(props: { item: Item }): any }>()` (Vue 3.3+) типизирует scoped-слоты и служит подсказкой для IDE и vue-tsc."
  - "DOM: `ref<HTMLInputElement | null>(null)` + `ref=\"inputRef\"` в шаблоне (или `useTemplateRef<HTMLInputElement>(\"input\")` в 3.5+). Компонент: `ref<InstanceType<typeof Child> | null>(null)`, публичное API ребёнка задаётся через `defineExpose`."
  - "`InjectionKey<T>` — это `Symbol` с типом `T`: `export const ThemeKey: InjectionKey<Theme> = Symbol(\"theme\")`. Без него `inject(\"theme\")` возвращает `unknown`; с ключом — `Theme | undefined` (undefined убирается default-значением)."
  - "`tsc` не понимает `.vue`-файлы, поэтому шаблоны (v-bind, v-if narrowing, слоты) проверяет только `vue-tsc --noEmit`. Поэтому в build-скрипте типизация `.vue` запускается через `vue-tsc`, а не через обычный `tsc`."
---

# TypeScript во Vue

Vue 3 со Composition API и `<script setup lang="ts">` имеет встроенную поддержку TypeScript: типизированные макросы `defineProps` и `defineEmits`, generic-компоненты без дженериков в сигнатуре функции и строгая проверка шаблонов через `vue-tsc`.

В этой статье разберём типизацию пропсов, событий, реактивности, слотов, `provide`/`inject` и типичные ошибки — с параллелями на React, чтобы легче переключаться между экосистемами.

---

## Содержание

1. [Базовая типизация пропсов](#базовая-типизация-пропсов)
2. [Типизация событий](#типизация-событий)
3. [Типизация реактивности](#типизация-реактивности)
4. [Типизация v-model и форм](#типизация-v-model-и-форм)
5. [Дженерики в компонентах](#дженерики-в-компонентах)
6. [Дочерние элементы: слоты](#дочерние-элементы-слоты)
7. [Template refs: DOM и компоненты](#template-refs-dom-и-компоненты)
8. [Provide/Inject: InjectionKey](#provideinject-injectionkey)
9. [Utility-типы для пропсов](#utility-типы-для-пропсов)
10. [Discriminated unions для пропсов](#discriminated-unions-для-пропсов)
11. [Vue vs React: шпаргалка по типизации](#vue-vs-react-шпаргалка-по-типизации)
12. [Проверка типов: vue-tsc](#проверка-типов-vue-tsc)
13. [Типичные ошибки](#типичные-ошибки)

---

## Базовая типизация пропсов

В React пропсы — это аргумент функции-компонента. Во Vue пропсы объявляются макросом `defineProps`, а типы задаются через дженерик — без отдельного `interface` для параметра.

> **React-аналог:** в React — `interface Props` у параметра функции-компонента. Во Vue — макрос `defineProps<T>()`. Концептуально то же самое, но синтаксис другой.

### Через defineProps<T>()

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  variant?: "primary" | "secondary" | "danger";
}

const props = defineProps<Props>();
</script>

<template>
  <h1 :class="`btn-${props.variant ?? 'primary'}`">{{ props.title }}</h1>
</template>
```

### Inline-тип

Можно не выносить тип в отдельный `interface`:

```vue
<script setup lang="ts">
const props = defineProps<{
  title: string;
  count?: number;
}>();
</script>
```

С 3.3 разрешены импортированные и сложные типы — например, `defineProps<Props & Extra>()`.

### Дефолтные значения: withDefaults

```vue
<script setup lang="ts">
interface Props {
  message: string;
  type?: "info" | "warning" | "error";
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
});
</script>
```

`withDefaults` снимает optional-флаг у пропсов, для которых объявлен дефолт: тип `props.type` становится `"info" | "warning" | "error"` без `undefined`. Дефолты для массивов и объектов обязательно передаются фабриками, чтобы каждый экземпляр получал свою копию: `items: () => []`.

### Деструктуризация пропсов

С Vue 3.5 стабильна **реактивная деструктуризация** — дефолты пишутся прямо в деструктуризации, и тип сужается как в обычном TS:

```vue
<script setup lang="ts">
const { title, type = "info" } = defineProps<Props>();
// type здесь: "info" | "warning" | "error" — без undefined
</script>
```

> **React-аналог:** в React `function Alert({ type = "info" }: AlertProps)` — деструктуризация сразу сужает тип. Во Vue то же самое достигается `withDefaults` (через `props.type`) или реактивной деструктуризацией в 3.5+.

### Fallthrough-атрибуты и useAttrs

Во Vue необъявленные атрибуты автоматически пробрасываются на корневой элемент (fallthrough attributes) — в отличие от React, где это делается явно.

```vue
<script setup lang="ts">
const props = defineProps<{ label: string }>();
const attrs = useAttrs(); // Record<string, unknown>
</script>

<template>
  <label>
    {{ label }}
    <input v-bind="$attrs" />
  </label>
</template>
```

> **React-аналог:** в React атрибуты пробрасываются явно: `...rest` + `React.InputHTMLAttributes<HTMLInputElement>`. Во Vue — автоматический fallthrough + `useAttrs()`/`$attrs`.

---

## Типизация событий

Во Vue события компонента объявляются макросом `defineEmits` и типизируются как «call signature» или именованные кортежи.

> **React-аналог:** в React события — пропсы-функции: `onChange: (value: string) => void`. Во Vue — макрос `defineEmits<T>()`, и TS проверяет и имя события, и payload при вызове `emit`.

### Синтаксис call signature

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: "change", value: string): void;
  (e: "submit", formData: FormData): void;
  (e: "close"): void;
}>();
</script>
```

### Именованные кортежи (Vue 3.3+)

Более читаемый вариант:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string];
  submit: [formData: FormData];
  close: [];
}>();
</script>
```

### Использование

```vue
<template>
  <button @click="emit('close')">Close</button>
</template>
```

TypeScript проверяет и имя события, и payload: `emit("change", 42)` — ошибка компиляции.

### v-model на компоненте

`v-model` — это синтаксический сахар над парой «пропс `modelValue` + событие `update:modelValue`»:

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <input
    :value="props.modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

> **React-аналог:** `v-model` — это пара «пропс + событие», как `value` + `onChange` в React. Разница в синтаксисе: в React это два явных пропса, во Vue — макрос.

---

## Типизация реактивности

### ref

```ts
const count = ref(0); // Ref<number>
const user = ref<User | null>(null); // Ref<User | null>
const items = ref<string[]>([]); // Ref<string[]>
```

`ref()` без значения выводит union с `undefined`: `const n = ref<number>()` → `Ref<number | undefined>`.

> **React-аналог:** `useState(0)` — то же самое, но возвращает кортеж `[state, setState]`. Для nullable в React нужен явный дженерик `useState<User | null>(null)` — во Vue тот же паттерн: `ref<User | null>(null)`.

### reactive

```ts
interface FormState {
  email: string;
  password: string;
}

const form = reactive<FormState>({ email: "", password: "" });
```

`reactive` работает только с объектами — для примитивов и union-типов используйте `ref`. Деструктуризация объекта `reactive` теряет реактивность, поэтому нужны `toRefs` или `ref`.

### computed

```ts
const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0));
// total: ComputedRef<number>

const sorted = computed<string[]>(() => {
  return [...items.value].sort((a, b) => a.name.localeCompare(b.name));
});
```

### watch и readonly

```ts
watch(source, (value, oldValue) => {
  // типы выводятся из источника
});

const config = readonly(ref({ theme: "light" })); // Readonly<Ref<{ theme: string }>>
```

---

## Типизация v-model и форм

### Состояние формы через reactive

```ts
interface FormState {
  email: string;
  password: string;
  errors: Partial<Record<"email" | "password", string>>;
  isSubmitting: boolean;
}

const form = reactive<FormState>({
  email: "",
  password: "",
  errors: {},
  isSubmitting: false,
});
```

`Partial<Record<"email" | "password", string>>` — элегантный способ типизировать объект ошибок: каждое поле либо `string`, либо `undefined`.

### v-model на нативных инпутах

```vue
<template>
  <input v-model="form.email" />
</template>
```

Тип `v-model` на нативном `<input>` выводится автоматически.

### События форм

Во Vue события в шаблоне — нативные DOM-события, поэтому `Event` приводится явно:

```vue
<script setup lang="ts">
function onSubmit(e: Event) {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  const email = formData.get("email"); // FormDataEntryValue | null
}
</script>

<template>
  <form @submit="onSubmit">
    <input name="email" type="email" />
  </form>
</template>
```

> **React-аналог:** в React `onSubmit` типизируется как `React.FormEvent<HTMLFormElement>`. Во Vue — нативный `Event` с приведением `e.target as HTMLFormElement`, потому что у Vue нет синтетических событий.

### defineModel (Vue 3.4+)

`defineModel` заменяет пару «пропс `modelValue` + emit `update:modelValue`» одним типизированным ref:

```vue
<script setup lang="ts">
const model = defineModel<string>(); // Ref<string | undefined>
const required = defineModel<string>({ required: true }); // Ref<string>

const count = defineModel<number>("count"); // именованная модель — v-model:count
</script>

<template>
  <input v-model="model" />
</template>
```

`{ required: true }` убирает `undefined` из типа. Для кастомных модификаторов `v-model` типизируется второй параметр `defineModel`:

```vue
<script setup lang="ts">
const [model, modifiers] = defineModel<string, "capitalize">();
// modifiers.capitalize: boolean | undefined
</script>
```

---

## Дженерики в компонентах

Vue 3.3+ поддерживает generic-компоненты через атрибут `generic` у `<script setup>`.

> **React-аналог:** в React `function List<T>(props: ListProps<T>)` — дженерик прямо в функции. Во Vue — атрибут `generic="T extends Item"` у `<script setup lang="ts">`. Концептуально идентично.

### Базовый пример

```vue
<script setup lang="ts" generic="T">
defineProps<{
  items: T[];
  keyExtractor: (item: T) => string;
}>();

defineEmits<{
  (e: "select", item: T): void;
}>();
</script>

<template>
  <ul>
    <li v-for="item in items" :key="keyExtractor(item)">
      <slot :item="item" />
    </li>
  </ul>
</template>
```

Тип `T` выводится из передаваемых пропсов — как и в React.

### Ограничение дженерика

```vue
<script setup lang="ts" generic="T extends { id: string; label: string }">
defineProps<{
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
}>();
</script>
```

### Несколько дженериков

Значение `generic` работает как список параметров в `<>` TypeScript:

```vue
<script setup lang="ts" generic="T extends string | number, U extends Item">
defineProps<{
  id: T;
  list: U[];
}>();
</script>
```

---

## Дочерние элементы: слоты

Во Vue дочерний контент — это слоты, и они тоже типизируются.

> **React-аналог:** в React дочерние элементы — пропс `children` (дефолтный «слот») и именованные пропсы `header: ReactNode`. Во Vue — `<slot />`, `<slot name="header" />` и scoped-слоты с типизацией через `useSlots`/`defineSlots`.

### Типизация через useSlots

```vue
<script setup lang="ts">
import { useSlots } from "vue";

const slots = useSlots(); // Record<string, Slot | undefined>

const hasHeader = Boolean(slots.header); // проверка наличия слота
</script>
```

`useSlots()` не знает типов пропсов слотов — только наличие. Для полной типизации нужен `defineSlots`.

### DefineSlots (Vue 3.3+)

```vue
<script setup lang="ts">
defineSlots<{
  default(props: { item: Item }): any;
  header(): any;
  footer(): any;
}>();
</script>
```

`defineSlots` — макрос только для типов, без runtime-эффекта. Он типизирует scoped-слоты: в родителе `#default="{ item }"` получит типизированный `item`. Возвращает тот же объект, что `useSlots()`.

### Использование в шаблоне

```vue
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>
```

---

## Template refs: DOM и компоненты

### Ref на DOM-элемент

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

> **React-аналог:** в React `useRef<HTMLInputElement>(null)` + `ref={inputRef}`. Во Vue — `ref<HTMLInputElement | null>(null)` + `ref="inputRef"` в шаблоне. Ключевое отличие: во Vue значение лежит в `.value`, в React — в `.current`.

### useTemplateRef (Vue 3.5+)

Современная альтернатива без ручной связки по имени:

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from "vue";

const inputRef = useTemplateRef<HTMLInputElement>("input");

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input ref="input" />
</template>
```

### Ref на компонент + defineExpose

Публичное API дочернего компонента задаётся через `defineExpose`, а тип экземпляра — через `InstanceType<typeof Child>`:

```vue
<!-- Child.vue -->
<script setup lang="ts">
function reset() {
  // ...
}
defineExpose({ reset });
</script>

<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const childRef = ref<InstanceType<typeof Child> | null>(null);

function handleClick() {
  childRef.value?.reset();
}
</script>
```

> **React-аналог:** в React с React 19 ref — обычный пропс `ref?: React.Ref<HTMLInputElement>`, а публичное API через `useImperativeHandle`. Во Vue — `defineExpose` + `InstanceType<typeof Child>`.

---

## Provide/Inject: InjectionKey

> **React-аналог:** в React — `createContext<T>` + `useContext`. Во Vue — `provide`/`inject` с `InjectionKey<T>`.

`InjectionKey<T>` — это `Symbol` с привязанным типом:

```ts
// keys.ts
import type { InjectionKey } from "vue";

export interface Theme {
  theme: "light" | "dark";
  toggle: () => void;
}

export const ThemeKey: InjectionKey<Theme> = Symbol("theme");
```

```vue
<!-- Provider -->
<script setup lang="ts">
import { provide, ref } from "vue";
import { ThemeKey } from "./keys";

const theme = ref<"light" | "dark">("light");
const toggle = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

provide(ThemeKey, { theme, toggle });
</script>
```

```vue
<!-- Consumer -->
<script setup lang="ts">
import { inject } from "vue";
import { ThemeKey } from "./keys";

const themeCtx = inject(ThemeKey); // Theme | undefined
</script>
```

Без `InjectionKey` — `inject("theme")` вернёт `unknown`. С ключом — `Theme | undefined` (гарантии, что провайдер существует, нет). Убрать `undefined` можно default-значением: `inject(ThemeKey, defaultTheme)`.

---

## Utility-типы для пропсов

Utility-типы TypeScript работают с пропсами Vue точно так же, как в React.

### Partial, Pick, Omit, Required

```ts
interface UserCardProps {
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user" | "guest";
}

type EditableUserCard = Partial<UserCardProps>; // для формы редактирования
type UserPreview = Pick<UserCardProps, "name" | "email">; // компактная карточка
type UserWithoutAvatar = Omit<UserCardProps, "avatar">;
type FullUserCard = Required<UserCardProps>;
```

### Использование с defineProps

```vue
<script setup lang="ts">
defineProps<Partial<UserCardProps>>();
</script>
```

> **React-аналог:** то же самое работает в React: `Partial<Props>`, `Omit<Props, "onSubmit">`. Utility-типы — общая часть TypeScript, не зависящая от фреймворка.

---

## Discriminated unions для пропсов

Discriminated union — тип с общим полем-«дискриминатором», по которому TypeScript сужает тип. Работает и в скрипте, и в шаблоне (через `v-if`).

### Пропсы с вариантами

```vue
<script setup lang="ts">
type ButtonProps =
  | { variant: "link"; href: string }
  | { variant: "button"; onClick: () => void };

const props = defineProps<ButtonProps>();
</script>

<template>
  <a v-if="props.variant === 'link'" :href="props.href">Link</a>
  <button v-else @click="props.onClick">Button</button>
</template>
```

`vue-tsc` сужает тип в шаблоне: в ветке `v-if` известен `props.href`, в `v-else` — `props.onClick`.

### Exhaustiveness checking

```ts
type Status = "idle" | "loading" | "success" | "error";

function getStatusLabel(status: Status): string {
  switch (status) {
    case "idle":
      return "Ready";
    case "loading":
      return "Loading...";
    case "success":
      return "Done";
    case "error":
      return "Failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
```

Паттерн `never` в `default` гарантирует, что при добавлении нового значения в union-тип компилятор напомнит обработать его.

> **React-аналог:** идентично — discriminated unions работают одинаково в обеих экосистемах. В React сужение происходит в функции-компоненте (`if`/`switch`), во Vue — в `<script>` или в шаблоне через `v-if`.

---

## Vue vs React: шпаргалка по типизации

| Концепция | Vue | React |
|---|---|---|
| Пропсы компонента | `defineProps<{ title: string }>()` | `interface Props { title: string }` + параметр функции |
| Дефолтные пропсы | `withDefaults(defineProps(), { title: "Default" })` или деструктуризация (3.5+) | Деструктуризация: `{ title = "Default" }: Props` |
| События (emit) | `defineEmits<{ (e: "change", v: string): void }>()` | Пропс-функция: `onChange: (value: string) => void` |
| Слоты | `<slot />`, `<slot name="header" />`, `defineSlots` | `children`, именованные пропсы: `header: ReactNode` |
| Ref на DOM | `const el = ref<HTMLInputElement \| null>(null)` | `const el = useRef<HTMLInputElement>(null)` |
| Provide/Inject | `provide<T>(key, value)` / `inject<T>(key)` | `createContext<T>()` / `useContext()` |
| Дженерики | `<script setup generic="T">` | `function Comp<T>(props: Props<T>)` |
| События | `@click="(e: Event) => ..."` | `onClick={(e: React.MouseEvent) => ...}` |
| Формы | `v-model` с типизацией, `defineModel` | `value` + `onChange` с `React.ChangeEvent` |
| Ref-передача | `ref="childRef"` в шаблоне | `ref={childRef}` в JSX |

---

## Проверка типов: vue-tsc

Обычный `tsc` не понимает `.vue`-файлы. Проверку типов в SFC — включая шаблоны, `v-bind`, narrowing в `v-if` и типы слотов — выполняет `vue-tsc`:

```bash
vue-tsc --noEmit   # проверка типов
npm run build      # в build-скрипте обычно vue-tsc --noEmit && vite build
```

TS-конфиг наследуется от Vue: `extends: "@vue/tsconfig/tsconfig.dom.json"`.

> **React-аналог:** в React типы проверяет обычный `tsc`/`tsc --noEmit` — JSX проверяется как часть TSX. Во Vue шаблоны вне `<script>` понимает только `vue-tsc`.

---

## Типичные ошибки

### 1. `ref(null)` без дженерика

```ts
// ❌ Тип выводится как Ref<null> — присвоить User нельзя
const user = ref(null);
user.value = { name: "Alice" }; // Ошибка!

// ✅ Явный дженерик
const user = ref<User | null>(null);
user.value = { name: "Alice" }; // OK
```

### 2. inject без InjectionKey

```ts
// ❌ Тип unknown — никакой проверки на месте использования
const theme = inject("theme");

// ✅ Типизированный ключ
const theme = inject(ThemeKey); // Theme | undefined
```

### 3. withDefaults в паре с деструктуризацией

```vue
<script setup lang="ts">
// ⚠️ eslint (vue/define-props-destructuring) запрещает комбинацию
// withDefaults + деструктуризация; до 3.5 теряется реактивность
const { type } = withDefaults(defineProps<Props>(), { type: "info" });

// ✅ Обращение через props-объект (тип сужен withDefaults)
const props = withDefaults(defineProps<Props>(), { type: "info" });

// ✅ Или реактивная деструктуризация в Vue 3.5+
const { type = "info" } = defineProps<Props>();
</script>
```

### 4. reactive с примитивом или union

```ts
// ❌ reactive работает только с объектами
const status = reactive("idle");

// ✅ ref для примитивов и union
const status = ref<"idle" | "loading" | "success">("idle");
```

### 5. Типизация событий через any

```vue
<script setup lang="ts">
// ❌ Теряется типобезопасность
function onSubmit(e: any) { ... }

// ✅ Нативный тип + приведение
function onSubmit(e: Event) { ... }
</script>
```

### 6. Template ref на компонент без InstanceType

```vue
<script setup lang="ts">
// ❌ ref<Child | null> — Child не тип, vue-tsc ругается
const childRef = ref<Child | null>(null);

// ✅ InstanceType<typeof Child> + defineExpose у ребёнка
const childRef = ref<InstanceType<typeof Child> | null>(null);
</script>
```

### 7. Не типизированный v-model на компоненте

```vue
<script setup lang="ts">
// ❌ modelValue и update:modelValue без типов — v-model принимает anything
// ✅
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();
// либо проще:
const model = defineModel<string>();
</script>
```

### 8. Ожидание, что tsc проверит шаблоны

```bash
# ❌ Ошибки в <template> не будут найдены
tsc --noEmit

# ✅ Шаблоны проверяет только vue-tsc
vue-tsc --noEmit
```

## Ключевые тезисы для интервью

- Пропсы типизируются макросом `defineProps<Props>()` — interface, type или inline-тип.
- `withDefaults` задаёт дефолты в рантайме и снимает optional-флаг у пропсов с дефолтом; с 3.5 предпочтительна реактивная деструктуризация с дефолтами.
- События — через `defineEmits<T>()`: call signature `(e: "change", value: string): void` или именованные кортежи `{ change: [value: string] }`.
- `v-model` на компоненте — это пропс `modelValue` + событие `update:modelValue`; `defineModel<string>()` (3.4+) заменяет эту пару одним типизированным ref.
- `ref<User | null>(null)` — явный дженерик для nullable, как `useState<User | null>(null)` в React.
- Generic-компоненты — атрибут `generic="T extends Item"` у `<script setup lang="ts">`.
- Слоты типизируются через `useSlots()` (`Record<string, Slot | undefined>`) и `defineSlots` (3.3+).
- Template ref на компонент — `ref<InstanceType<typeof Child> | null>(null)` + `defineExpose` у ребёнка.
- `provide`/`inject` типизируются через `InjectionKey<T>`; `inject` возвращает `T | undefined`.
- Шаблоны `.vue` (v-bind, v-if narrowing, слоты) проверяет только `vue-tsc`, обычный `tsc` не понимает SFC.

## Заключение

Vue 3 даёт встроенную типизацию через макросы: `defineProps` для пропсов, `defineEmits` для событий, `defineSlots` для слотов, `generic` для переиспользуемых компонентов. Ключевые паттерны: `withDefaults` и реактивная деструктуризация для дефолтов, `InjectionKey<T>` для `provide`/`inject`, `InstanceType<typeof Child>` для template refs на компоненты и `vue-tsc` для проверки шаблонов. Параллели с React помогают не запутаться в синтаксисе: пропсы-функции против `defineEmits`, `children` против слотов, `useState` против `ref`. Попробуйте переписать типичный компонент на `defineModel` и `generic` — это быстрее всего закрепляет материал.

## Полезные ссылки

- [Vue Docs — TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api.html)
- [Vue Docs — TypeScript Support Overview](https://vuejs.org/guide/typescript/overview.html)
- [Vue Docs — Typing Component Template Refs](https://vuejs.org/guide/typescript/composition-api.html#typing-component-template-refs)
- [Vue 3.3 Release Notes — Generic Components, defineSlots](https://blog.vuejs.org/posts/vue-3-3)
- [Vue 3.5 Release Notes — Reactive Props Destructure](https://blog.vuejs.org/posts/vue-3-5)