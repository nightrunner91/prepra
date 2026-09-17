---
title: ""
section: typescript
description: ""
order: 4
tags: []
---

Дженерики — одна из самых мощных и одновременно самых сложных концепций TypeScript. Они позволяют писать код, который работает с любыми типами, сохраняя при этом полную типобезопасность. В React дженерики используются повсеместно: в хуках, компонентах, utility-типах. Во Vue — в composables, пропсах, хелперах. В этой статье мы разберём дженерики от базовых концепций до продвинутых паттернов, применяемых в реальных проектах.

---

## Содержание

1. [Что такое дженерики и зачем они нужны](#что-такое-дженерики-и-зачем-они-нужны)
2. [Как дженерики работают под капотом](#как-дженерики-работают-под-капотом)
3. [Базовый синтаксис](#базовый-синтаксис)
4. [Дженерики в функциях](#дженерики-в-функциях)
5. [Дженерики в интерфейсах и типах](#дженерики-в-интерфейсах-и-типах)
6. [Дженерики в классах](#дженерики-в-классах)
7. [Constraints — ограничения типов](#constraints--ограничения-типов)
8. [Default types — типы по умолчанию](#default-types--типы-по-умолчанию)
9. [Дженерики в React](#дженерики-в-react)
10. [Дженерики во Vue](#дженерики-во-vue)
11. [Продвинутые паттерны](#продвинутые-паттерны)
12. [Как читать сложные дженерики](#как-читать-сложные-дженерики)
13. [Типичные ошибки](#типичные-ошибки)

---

## Что такое дженерики и зачем они нужны

### Проблема, которую решают дженерики

Представьте, что вам нужна функция, которая возвращает переданное значение. Без дженериков у вас два плохих варианта:

```typescript
// Вариант 1: теряем тип — возвращается any
function identity(value: any): any {
  return value;
}

const result = identity("hello"); // result: any — тип потерян
// TypeScript не знает, что result — это string
// Можно написать result.toFixed() — и получить ошибку в рантайме

// Вариант 2: пишем отдельную функцию для каждого типа
function identityString(value: string): string {
  return value;
}
function identityNumber(value: number): number {
  return value;
}
// Бесконечное дублирование кода
```

Оба варианта плохи: первый теряет типобезопасность, второй требует дублирования кода.

### Решение — дженерики

Дженерики позволяют передать тип как параметр. Функция `identity` принимает не только значение, но и тип этого значения:

```typescript
function identity<T>(value: T): T {
  return value;
}

const a = identity("hello");   // a: string — TypeScript вывел тип
const b = identity(42);        // b: number
const c = identity(true);      // c: boolean
```

> **Аналогия:** Дженерик — это «переменная для типа». Как обычная функция принимает значение и возвращает результат, так дженерик принимает тип и возвращает типизированный результат. Только вместо `value` вы передаёте `T`.

### Ключевая идея

Дженерики создают **шаблон**, из которого TypeScript создаёт конкретные типы при каждом вызове. Когда вы пишете `identity<string>("hello")`, TypeScript подставляет `string` вместо `T` и получает:

```typescript
// Что видит TypeScript после подстановки:
function identity(value: string): string {
  return value;
}
```

Это называется **мономорфизацией** — из одного шаблона создаётся множество конкретных функций.

### Где дженерики встречаются в повседневном коде

| Контекст | Пример | Что происходит |
|---|---|---|
| React хуки | `useState<User>(initialUser)` | Хук хранит состояние типа `User` |
| Vue composables | `useLocalStorage<User>('key', defaultUser)` | Composable работает с типом `User` |
| Fetch / API | `fetch<User>('/api/user')` | Ответ сервера типизирован как `User` |
| Коллекции | `Array<string>`, `Map<string, User>` | Массив строк, словарь с ключами-строками и значениями-User |
| Utility-типы | `Partial<User>`, `Pick<User, 'name'>` | Трансформация типа `User` |
---

## Как дженерики работают под капотом

Чтобы по-настоящему понять дженерики, нужно разобраться, что происходит на этапе компиляции.

### Механизм подстановки типов

Когда вы объявляете дженерик, вы создаёте **шаблон**. TypeScript не создаёт реальный код — он запоминает правила. При каждом использовании дженерика TypeScript подставляет конкретные типы и проверяет, что всё корректно.

```typescript
// Объявление шаблона
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Использование — подстановка типов
const a = first([1, 2, 3]);       // T = number → возвращает number | undefined
const b = first(["a", "b"]);      // T = string → возвращает string | undefined
const c = first<boolean>([]);     // T = boolean (явно) → возвращает boolean | undefined
```

### Type inference — автоматический вывод типов

TypeScript **сам выводит** тип дженерика из контекста. Вам не нужно писать `<string>` каждый раз:

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

const p = pair("age", 25);
// TypeScript видит:
// - первый аргумент "age" → A = string
// - второй аргумент 25 → B = number
// - результат: [string, number]
```

Type inference работает, когда тип можно однозначно определить из аргументов. Если нельзя — нужно указывать явно:

```typescript
function empty<T>(): T[] {
  return [];
}

// TypeScript не может вывести T из контекста
const arr1 = empty();           // Error: T is unknown
const arr2 = empty<string>();   // OK: T = string
```

### Проверка типов на этапе компиляции

Важно понимать: дженерики существуют **только на этапе компиляции**. В рантайме никакого `T` не существует — это называется **type erasure** (стирание типов). JavaScript не знает о типах.

```typescript
function checkType<T>(value: T): void {
  // В рантайме T не существует
  // Нельзя написать: if (value instanceof T)
  // Можно только работать со значением как с T
}
```

---

## Базовый синтаксис

Дженерик объявляется угловыми скобками `<>` с именем типа. Традиционно используются заглавные латинские буквы.

### Один параметр типа

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstStr = first(["a", "b", "c"]); // string | undefined
const firstNum = first([1, 2, 3]);       // number | undefined
```

**Что происходит:**
1. `first<string>(["a", "b", "c"])` — TypeScript подставляет `string` вместо `T`
2. Сигнатура становится: `function first(arr: string[]): string | undefined`
3. Возвращаемый тип — `string | undefined`, потому что массив может быть пустым

### Несколько параметров типа

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

const p = pair("age", 25); // [string, number]
const q = pair(1, true);   // [number, boolean]
```

**Что происходит:**
- `A` и `B` — независимые параметры типа
- TypeScript выводит их из аргументов: `A = string`, `B = number`
- Результат — кортеж `[string, number]`

### Именование типов

Принятые соглашения:
- `T` — Type (один тип, самый частый случай)
- `K` — Key (ключ)
- `V` — Value (значение)
- `A, B` — когда нужно несколько разных типов
- `TData, TError` — описательные имена для сложных случаев (префикс `T` показывает, что это тип)

```typescript
// Хороший стиль для API-хука — описательные имена
function useFetch<TData, TError = Error>(
  url: string
): { data: TData | null; error: TError | null } {
  // ...
}
```

> **Совет:** Используйте `T` для простых случаев (один-два параметра). Для трёх и более — дайте описательные имена: `TData`, `TError`, `TResult`.

---

## Дженерики в функциях

### Функция с несколькими дженериками

```typescript
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

const lengths = map(["hello", "world"], s => s.length); // number[]
const upper = map(["hello", "world"], s => s.toUpperCase()); // string[]
```

**Разбор по шагам:**
1. `map(["hello", "world"], s => s.length)`
2. TypeScript видит: `arr` — массив строк → `T = string`
3. Функция `s => s.length` принимает `string` и возвращает `number` → `U = number`
4. Результат: `number[]`

Второй вызов:
1. `map(["hello", "world"], s => s.toUpperCase())`
2. `T = string` (массив строк)
3. `s.toUpperCase()` возвращает `string` → `U = string`
4. Результат: `string[]`

### Функция с constraint (ограничением)

Без ограничения TypeScript не знает, какие свойства есть у `T`. Если нужно обратиться к свойству, используйте `extends`:

```typescript
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength("hello");     // OK — string имеет length
getLength([1, 2, 3]);   // OK — array имеет length
getLength(42);          // Error — number не имеет length
```

**Что происходит:**
- `T extends { length: number }` означает: «T может быть любым типом, у которого есть свойство `length` типа `number`»
- TypeScript проверяет, что аргумент соответствует ограничению
- `42` (number) не имеет `length` → ошибка компиляции

Подробнее про constraints — в [отдельной секции](#constraints--ограничения-типов).

---

## Дженерики в интерфейсах и типах

Дженерики можно использовать не только в функциях, но и в типах. Это позволяет создавать **переиспользуемые шаблоны типов**.

### Generic interface

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
}

// Подставляем User вместо T
const response: ApiResponse<User> = {
  data: { id: 1, name: "John" },
  status: 200,
  message: "OK"
};

// Подставляем Product вместо T
interface Product {
  id: number;
  title: string;
  price: number;
}

const productResponse: ApiResponse<Product> = {
  data: { id: 1, title: "Phone", price: 500 },
  status: 200,
  message: "OK"
};
```

**Что происходит:**
- `ApiResponse<T>` — это шаблон. Сам по себе он не является типом.
- `ApiResponse<User>` — конкретный тип, где `T = User`
- TypeScript подставляет `User` во все места, где используется `T`
- Получается: `{ data: User; status: number; message: string }`

### Generic type alias

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseJSON(json: string): Result<unknown> {
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

// Использование
const result = parseJSON('{"name": "John"}');
if (result.ok) {
  console.log(result.value); // unknown
} else {
  console.log(result.error); // Error
}
```

**Что происходит:**
- `Result<T, E>` — union-тип с двумя вариантами
- `E = Error` — тип по умолчанию (подробнее — в [секции про default types](#default-types--типы-по-умолчанию))
- `Result<unknown>` подставляет `T = unknown`, `E = Error` (по умолчанию)
- TypeScript проверяет `result.ok` и сужает тип: если `ok: true`, то `value: unknown`; если `ok: false`, то `error: Error`

### Интерфейс с несколькими типами

```typescript
interface Dictionary<K extends string | number, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  keys(): K[];
}

type UserDict = Dictionary<string, { name: string; age: number }>;
// Эквивалентно:
// {
//   get(key: string): { name: string; age: number } | undefined;
//   set(key: string, value: { name: string; age: number }): void;
//   keys(): string[];
// }
```

**Что происходит:**
- `K extends string | number` — ключ может быть только строкой или числом
- `V` — значение любого типа
- При использовании `Dictionary<string, User>` подставляются оба параметра

---

## Дженерики в классах

Дженерики в классах работают так же, как в интерфейсах — они параметризуют тип класса.

### Базовый generic-класс

```typescript
class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getFirst(): T | undefined {
    return this.items[0];
  }

  getAll(): T[] {
    return [...this.items];
  }
}

const numContainer = new Container<number>();
numContainer.add(1);
numContainer.add(2);
const first = numContainer.getFirst(); // number | undefined
// numContainer.add("hello"); // Error — ожидается number

const strContainer = new Container<string>();
strContainer.add("hello");
// strContainer.add(42); // Error — ожидается string
```

**Что происходит:**
- `Container<T>` — шаблон класса
- `new Container<number>()` создаёт экземпляр, где `T = number`
- Все методы используют `number` вместо `T`: `add(item: number)`, `getFirst(): number | undefined`
- Каждый экземпляр имеет свой тип — `Container<number>` и `Container<string>` несовместимы

### Generic-класс с constraint

```typescript
interface Identifiable {
  id: string;
}

class Repository<T extends Identifiable> {
  private items: Map<string, T> = new Map();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  getById(id: string): T | undefined {
    return this.items.get(id);
  }
}

interface User extends Identifiable {
  id: string;
  name: string;
}

const userRepo = new Repository<User>();
userRepo.add({ id: "1", name: "John" });
const user = userRepo.getById("1"); // User | undefined
```

**Что происходит:**
- `T extends Identifiable` — класс работает только с типами, у которых есть `id: string`
- `Repository<User>` — `User` должен иметь `id: string` (удовлетворяет ограничению)
- Метод `getById` возвращает `T | undefined`, то есть `User | undefined`

---

## Constraints — ограничения типов

Constraints позволяют ограничить, какие типы можно передать в дженерик. Без ограничений TypeScript считает, что `T` может быть чем угодно, и вы не можете обращаться к его свойствам.

### Зачем нужны constraints

Без ограничения TypeScript не знает, какие свойства есть у `T`:

```typescript
// Error — T может не иметь свойства length
function getLength<T>(item: T): number {
  return item.length; // TypeScript не знает, есть ли length у T
}
```

С ограничением TypeScript знает, что `T` имеет нужные свойства:

```typescript
// OK — T обязательно имеет length
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}
```

### extends — базовое ограничение

`extends` означает «должен быть совместим с». Тип `T` может быть любым, но обязан иметь указанные свойства.

```typescript
interface HasId {
  id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

interface User { id: number; name: string; }
interface Product { id: number; title: string; price: number; }

const users: User[] = [{ id: 1, name: "John" }];
const user = findById(users, 1); // User | undefined

const products: Product[] = [{ id: 1, title: "Phone", price: 500 }];
const product = findById(products, 1); // Product | undefined
```

**Что происходит:**
- `T extends HasId` — `T` должен иметь `id: number`
- `User` и `Product` оба имеют `id: number` → оба подходят
- TypeScript сохраняет конкретный тип: `findById(users, 1)` возвращает `User | undefined`, а не `HasId | undefined`

### keyof — ограничение ключами объекта

`keyof T` — это union всех ключей типа `T`. Ограничение `K extends keyof T` означает «K должен быть одним из ключей T».

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "John", age: 25 };

const name = getProperty(user, "name"); // string
const age = getProperty(user, "age");   // number
const wrong = getProperty(user, "email"); // Error — "email" не ключ user
```

**Разбор по шагам:**
1. `getProperty(user, "name")`
2. `T = { name: string; age: number }` (выведен из `user`)
3. `keyof T = "name" | "age"` (все ключи объекта)
4. `K extends "name" | "age"` — `K` должен быть `"name"` или `"age"`
5. `"name"` подходит → `K = "name"`
6. Возвращаемый тип: `T[K] = T["name"] = string`

Для `"email"`:
- `"email"` не входит в `"name" | "age"` → ошибка компиляции

### Multiple constraints

Можно ограничивать несколько параметров типа одновременно:

```typescript
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

const merged = merge({ name: "John" }, { age: 25 });
// merged: { name: string } & { age: number }
// TypeScript вывел: T = { name: string }, U = { age: number }
```

---

## Default types — типы по умолчанию

Типы по умолчанию позволяют не указывать параметр типа, если вас устраивает стандартное значение.

```typescript
interface Pagination<T, TOrder extends "asc" | "desc" = "asc"> {
  items: T[];
  total: number;
  order: TOrder;
}

// TOrder по умолчанию "asc" — можно не указывать
const page1: Pagination<User> = {
  items: [],
  total: 0,
  order: "asc"
};

// Явно указываем "desc"
const page2: Pagination<User, "desc"> = {
  items: [],
  total: 0,
  order: "desc"
};
```

**Что происходит:**
- `TOrder extends "asc" | "desc" = "asc"` — `TOrder` может быть только `"asc"` или `"desc"`, по умолчанию `"asc"`
- `Pagination<User>` — `T = User`, `TOrder = "asc"` (по умолчанию)
- `Pagination<User, "desc">` — `T = User`, `TOrder = "desc"` (явно)

Типы по умолчанию работают справа налево: если у вас `Pagination<T, TOrder = "asc">`, то `T` указывать обязательно, а `TOrder` — нет.

---

## Дженерики в React

React активно использует дженерики в хуках и компонентах. Понимание механизма помогает правильно типизировать код.

### useState с дженериком

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  // Явно указываем тип — важно для nullable значений
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // user: User | null — можно присвоить User или null
  // users: User[] — массив пользователей
}
```

**Почему важно указывать тип явно:**
- Без `<User | null>` TypeScript выведет `null` из начального значения
- Тогда `setUser({ id: 1, name: "John", email: "..." })` выдаст ошибку
- С `<User | null>` тип корректный: можно присвоить и `User`, и `null`

### useReducer с дженериком

```typescript
interface State {
  count: number;
  error: string | null;
}

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setError"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1, error: null };
    case "decrement":
      return { ...state, count: state.count - 1, error: null };
    case "setError":
      return { ...state, error: action.payload };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });
  // state: State
  // dispatch: (action: Action) => void
}
```

**Что происходит:**
- `useReducer` выводит тип состояния из начального значения и reducer
- `dispatch` принимает только `Action` — другие объекты не пройдут
- TypeScript проверяет `action.type` и сужает тип внутри `switch`

### Generic-компоненты

Generic-компоненты позволяют создавать переиспользуемые UI-элементы с сохранением типов.

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Использование — тип выводится автоматически из items
<List
  items={[{ id: 1, name: "John" }, { id: 2, name: "Jane" }]}
  renderItem={user => <span>{user.name}</span>}
  keyExtractor={user => String(user.id)}
/>
```

**Что происходит:**
- `List<T>` — компонент принимает параметр типа
- TypeScript выводит `T` из `items`: массив объектов с `id` и `name` → `T = { id: number; name: string }`
- `renderItem` и `keyExtractor` получают типизированный `item`
- Внутри `renderItem` TypeScript знает, что `user` имеет `name` и `id`

### Generic forwardRef

`forwardRef` с дженериками требует явного приведения типов, потому что `forwardRef` не поддерживает дженерики напрямую.

```typescript
interface InputProps<T> {
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}

function InputInner<T>(
  { value, onChange, format }: InputProps<T>,
  ref: React.Ref<HTMLInputElement>
) {
  const display = format ? format(value) : String(value);
  return <input ref={ref} value={display} onChange={e => onChange(value)} />;
}

// Приведение типов — forwardRef не поддерживает дженерики
const Input = React.forwardRef(InputInner) as <T>(
  props: InputProps<T> & React.RefAttributes<HTMLInputElement>
) => React.ReactElement;
```

---

## Дженерики во Vue

Vue 3 с Composition API активно использует дженерики в composables и типизированных компонентах.

### defineProps с дженериком

```vue
<script setup lang="ts" generic="T">
interface Props<T> {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
}

const props = defineProps<Props<T>>();
</script>

<template>
  <ul>
    <li v-for="item in items" @click="onSelect(item)">
      {{ item }}
    </li>
  </ul>
</template>
```

**Что происходит:**
- `generic="T"` — объявляет параметр типа для компонента (аналог `<T>` в React)
- `Props<T>` — пропсы параметризованы типом `T`
- При использовании компонента TypeScript выводит `T` из `items`

### Composable с дженериком

```typescript
import { ref, type Ref } from "vue";

function useLocalStorage<T>(key: string, initialValue: T) {
  const storedValue = ref<T>(initialValue) as Ref<T>;

  try {
    const item = localStorage.getItem(key);
    if (item) {
      storedValue.value = JSON.parse(item) as T;
    }
  } catch {
    storedValue.value = initialValue;
  }

  function setValue(value: T) {
    storedValue.value = value;
    localStorage.setItem(key, JSON.stringify(value));
  }

  return { value: storedValue, setValue };
}

// Использование
const { value: user, setValue: setUser } = useLocalStorage<User>("user", {
  id: 0,
  name: ""
});
// user: Ref<User>
// setUser: (value: User) => void
```

**Что происходит:**
- `useLocalStorage<T>` — composable параметризован типом `T`
- `useLocalStorage<User>("user", {...})` — `T = User`
- `ref<T>(initialValue)` создаёт реактивное значение типа `User`
- `setValue` принимает только `User`

### Generic defineEmits

```vue
<script setup lang="ts" generic="T extends { id: number }">
const props = defineProps<{
  items: T[];
}>();

const emit = defineEmits<{
  select: [item: T];
  remove: [id: number];
}>();
</script>
```

**Что происходит:**
- `T extends { id: number }` — компонент работает только с типами, у которых есть `id: number`
- `emit("select", item)` — `item` типизирован как `T`
- `emit("remove", id)` — `id` типизирован как `number`

---

> **Смежные темы:** Встроенные utility-типы (`Partial`, `Pick`, `Omit`, `Record` и др.) подробно разобраны в статье [TypeScript Utility Types](./typescript-utility-types.md). Условные типы и `infer` — в статье [TypeScript `infer`](./typescript-infer.md).

---

## Продвинутые паттерны

### Фабрика с дженериком

```typescript
function createApiService<T extends { id: string }>(baseUrl: string) {
  return {
    async getAll(): Promise<T[]> {
      const res = await fetch(baseUrl);
      return res.json();
    },
    async getById(id: string): Promise<T | null> {
      const res = await fetch(`${baseUrl}/${id}`);
      return res.json();
    },
    async create(item: Omit<T, "id">): Promise<T> {
      const res = await fetch(baseUrl, {
        method: "POST",
        body: JSON.stringify(item)
      });
      return res.json();
    }
  };
}

interface User { id: string; name: string; }
const userService = createApiService<User>("/api/users");
// userService.getAll(): Promise<User[]>
// userService.getById("1"): Promise<User | null>
// userService.create({ name: "John" }): Promise<User>
```

**Что происходит:**
- `createApiService<User>` создаёт сервис, типизированный под `User`
- `T extends { id: string }` — сервис работает только с типами, у которых есть `id: string`
- `Omit<T, "id">` — при создании убираем `id` (сервер сгенерирует его)
- Все методы возвращают типизированные результаты

### Типизированный event emitter

```typescript
type EventMap = Record<string, any[]>;

class TypedEmitter<T extends EventMap> {
  private listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(listener);
  }

  emit<K extends keyof T>(event: K, ...args: T[K]) {
    this.listeners[event]?.forEach(fn => fn(...args));
  }
}

interface AppEvents {
  login: [user: User];
  logout: [];
  error: [message: string, code: number];
}

const emitter = new TypedEmitter<AppEvents>();
emitter.on("login", user => console.log(user.name)); // OK
emitter.on("error", (msg, code) => console.log(msg, code)); // OK
```

**Что происходит:**
- `EventMap` — карта событий: ключ — имя события, значение — массив аргументов
- `TypedEmitter<AppEvents>` — эмиттер, типизированный под `AppEvents`
- `on("login", ...)` — TypeScript знает, что listener принимает `User`
- `on("error", ...)` — TypeScript знает, что listener принимает `string` и `number`
- Попытка `on("unknown", ...)` — ошибка компиляции

---

## Как читать сложные дженерики

Алгоритм разбора:

1. **Найдите параметры типа** — что внутри `<>`?
2. **Найдите constraints** — что после `extends`?
3. **Найдите, где используется `T`** — в аргументах, возвращаемом типе, свойствах?
4. **Подставьте конкретный тип** — замените `T` на реальный тип и посмотрите, что получится

```typescript
function createApiService<T extends { id: string }>(baseUrl: string) {
  // ...
}

const userService = createApiService<User>("/api/users");
// 1. Параметры: T
// 2. Constraint: T extends { id: string }
// 3. T используется в возвращаемых методах
// 4. Подстановка: T = User → все методы типизированы под User
```

---

## Типичные ошибки

### 1. Избыточные дженерики

```typescript
// Плохо — дженерик не нужен, тип и так выводится
function getValue<T>(value: T): T {
  return value;
}

// Хорошо — дженерик связывает вход и выход
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 2. Неправильное использование в React

```typescript
// Плохо — тип не передаётся в useState
const [user, setUser] = useState(null);
// user: null — нельзя присвоить User

// Хорошо — явно указываем тип
const [user, setUser] = useState<User | null>(null);
// user: User | null
```

---

## Заключение

Дженерики — фундамент типобезопасности в TypeScript. Они позволяют:

- Писать переиспользуемый код без потери типов
- Создавать гибкие API с проверкой на этапе компиляции
- Строить сложные utility-типы для трансформации данных
- Типизировать компоненты и хуки в React/Vue

**Правила для запоминания:**
1. Используйте дженерики, когда нужно связать типы входных и выходных данных
2. Добавляйте constraints (`extends`), когда нужны гарантии о структуре типа
3. Давайте описательные имена (`TData`, `TError`), если дженериков больше одного
4. Пользуйтесь встроенными utility-типами вместо написания своих
5. Разбирайте сложные дженерики по шагам: параметры → constraints → использование → подстановка
