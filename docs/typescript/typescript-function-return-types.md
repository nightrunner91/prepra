---
title: "Типы возврата функций в TypeScript"
section: typescript
description: "Типизация возвращаемого значения — одна из ключевых возможностей TypeScript. Она позволяет зафиксировать контракт функции: что именно получит вызывающий код."
order: 3
tags: ["return-types", "void", "never", "unknown", "generics", "promise"]
questions:
  - "Чем `void` отличается от `never` в типах возврата функций"
  - "Почему `unknown` безопаснее `any` для возвращаемых значений"
  - "Как дженерики связывают тип аргумента с типом возврата"
  - "Что возвращает `async`-функция и как это типизировать"
  - "Когда нужно указывать тип возврата явно, а когда достаточно вывода типов"
  - "Как типизировать функцию, которая возвращает другую функцию"
  - "Что такое exhaustive checks и как `never` помогает в `switch`"
---

# Типы возврата функций в TypeScript

Типизация возвращаемого значения — одна из ключевых возможностей TypeScript. Она позволяет зафиксировать контракт функции: что именно получит вызывающий код.

Правильный выбор типа возврата делает код предсказуемым и безопасным. Вызывающий код знает, что ожидать, а компилятор проверяет соответствие. В этой статье разберём все варианты типов возврата — от примитивов до дженериков и async-функций — и научимся выбирать подходящий тип для каждой задачи.

## Содержание

1. [Конкретные типы](#конкретные-типы)
2. [void](#void)
3. [never](#never)
4. [any и unknown](#any-и-unknown)
5. [Union types](#union-types)
6. [Generics](#generics)
7. [Асинхронные функции (Promise)](#асинхронные-функции-promise)
8. [Объекты и интерфейсы](#объекты-и-интерфейсы)
9. [Массивы и кортежи](#массивы-и-кортежи)
10. [Функции как возвращаемое значение](#функции-как-возвращаемое-значение)
11. [Вывод типов (type inference)](#вывод-типов-type-inference)
12. [Таблица](#таблица)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

---

## Конкретные типы

Самый простой случай — функция возвращает значение конкретного типа:

```ts
function getName(): string {
  return "Alice";
}

function getAge(): number {
  return 25;
}

function isActive(): boolean {
  return true;
}
```

TypeScript проверяет, что `return` действительно возвращает значение указанного типа. Если нет — ошибка компиляции:

```ts
function getCount(): number {
  return "five"; // ❌ Type 'string' is not assignable to type 'number'
}
```

## void

`void` означает, что функция **ничего не возвращает**. Точнее, она завершается, но результат не имеет значения:

```ts
function log(message: string): void {
  console.log(message);
}

function notify(user: string): void {
  alert(`Hello, ${user}`);
}
```

Функция с `void` может технически содержать `return`, но без значения:

```ts
function doSomething(): void {
  if (condition) {
    return; // допустимо
  }
  // ...
}
```

Типичное применение — обработчики событий, мутации, побочные эффекты.

## never

`never` — функция **никогда не завершается нормально**. Это не то же самое, что `void`:

```ts
function throwError(msg: string): never {
  throw new Error(msg);
}

function infiniteLoop(): never {
  while (true) {}
}
```

`void` — функция дошла до конца, но ничего не вернула.
`never` — функция не дошла до конца вообще (исключение, бесконечный цикл).

### Exhaustive checks

Главное практическое применение `never` — проверка полноты `switch`:

```ts
type Status = "loading" | "success" | "error";

function render(status: Status) {
  switch (status) {
    case "loading": return "Загрузка...";
    case "success": return "Данные загружены";
    case "error":   return "Ошибка";
    default:
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

Если добавить `"empty"` в `Status`, TypeScript выдаст ошибку в `default`-ветке — `status` уже не `never`. Это страховка от забытых случаев.

## any и unknown

Оба типа принимают любое значение, но разница принципиальна:

```ts
function parseAny(input: string): any {
  return JSON.parse(input);
}

function parseUnknown(input: string): unknown {
  return JSON.parse(input);
}

const a = parseAny("42");
a.toFixed(); // ✅ компилятор не ругается, но в рантайме может упасть

const b = parseUnknown("42");
b.toFixed(); // ❌ Error: Object is of type 'unknown'
```

`any` отключает проверку типов — это как вернуться в JavaScript.
`unknown` заставляет вызывающий код проверить тип перед использованием.

Правило: **всегда предпочитайте `unknown` вместо `any`**, если только нет веской причины.

## Union types

Функция может возвращать одно из нескольких значений:

```ts
function findUser(id: number): User | null {
  return users[id] ?? null;
}

function parse(input: string): string | number {
  const n = Number(input);
  return isNaN(n) ? input : n;
}
```

Вызывающий код обязан обработать все варианты через narrowing:

```ts
const result = parse("42");

if (typeof result === "string") {
  result.toUpperCase(); // ✅ result: string
} else {
  result.toFixed();     // ✅ result: number
}
```

## Generics

Когда тип возврата зависит от типа аргумента, используются дженерики:

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);       // n: number | undefined
const s = first(["a", "b", "c"]); // s: string | undefined
```

Без дженерика пришлось бы использовать `any` или `unknown`, теряя информацию о типе:

```ts
function firstBad(arr: any[]): any {
  return arr[0];
}

const x = firstBad([1, 2, 3]); // x: any — тип потерян
```

Дженерики позволяют сохранять связь между аргументами и возвращаемым значением.

## Асинхронные функции (Promise)

`async`-функция всегда возвращает `Promise<T>`, где `T` — тип значения из `return`:

```ts
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

async function findUser(id: number): Promise<User | null> {
  const user = await fetchUser(id);
  return user ?? null;
}
```

Тип `Promise` указывается явно. Внутри `async`-функции достаточно написать `return value` — TypeScript оборачивает его в `Promise` автоматически.

## Объекты и интерфейсы

Функция может возвращать объект:

```ts
interface Point {
  x: number;
  y: number;
}

function createPoint(x: number, y: number): Point {
  return { x, y };
}
```

Можно описать тип инлайн, без отдельного интерфейса:

```ts
function createUser(name: string): { name: string; id: number } {
  return { name, id: Date.now() };
}
```

Для больших объектов предпочтительнее выносить тип в отдельный `interface` или `type`.

## Массивы и кортежи

```ts
function getNames(): string[] {
  return ["Alice", "Bob"];
}

function getPair(): [string, number] {
  return ["Alice", 25];
}
```

Массив (`string[]`) — любое количество элементов одного типа.
Кортеж (`[string, number]`) — фиксированное количество элементов с конкретными типами.

## Функции как возвращаемое значение

Функция может возвращать другую функцию:

```ts
function createMultiplier(factor: number): (value: number) => number {
  return (value) => value * factor;
}

const double = createMultiplier(2);
double(5); // 10
```

Тип `(value: number) => number` описывает сигнатуру возвращаемой функции.

## Вывод типов (type inference)

TypeScript часто может вывести тип возврата автоматически:

```ts
function add(a: number, b: number) {
  return a + b; // TS сам выводит: number
}

function getUser() {
  return { name: "Alice", age: 25 }; // TS выводит: { name: string; age: number }
}
```

Однако для публичных API **рекомендуется** указывать тип возврата явно:

```ts
// Хорошо — контракт зафиксирован
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Плохо — при изменении реализации может случайно измениться тип
export function calculateTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

Явный тип возврата — это документация и страховка от случайных изменений.

## Таблица

| Тип | Когда использовать |
|-----|-------------------|
| `string`, `number`, `boolean`, объекты | Функция возвращает конкретное значение |
| `void` | Функция завершается, но не возвращает значение (побочные эффекты) |
| `never` | Функция не завершается (throw, бесконечный цикл) + exhaustive checks |
| `unknown` | Функция возвращает значение, тип которого неизвестен, но нужна проверка |
| `any` | Избегать. Только для миграции с JS |
| `T \| null`, `T \| undefined` | Функция может не найти результат |
| `T \| U` | Функция может вернуть разные типы |
| `Promise<T>` | Асинхронная функция |
| `T[]`, `[A, B]` | Массив или кортеж |
| `(x: T) => U` | Функция возвращает другую функцию |

## Ключевые тезисы для интервью

- Конкретные типы (`string`, `number`, `boolean`, объекты) — по умолчанию для всех функций.
- `void` означает, что функция завершается, но результат не имеет значения — для побочных эффектов.
- `never` — функция никогда не завершается нормально (throw, бесконечный цикл); также используется для exhaustive checks.
- `unknown` безопаснее `any`: заставляет вызывающий код проверить тип перед использованием.
- Union types (`T | U`) требуют narrowing через `if`, `switch` или type guards.
- Дженерики связывают тип аргумента с типом возврата, сохраняя типобезопасность.
- `async`-функция всегда возвращает `Promise<T>`, где `T` — тип значения из `return`.
- Для больших объектов выносите тип в отдельный `interface` или `type`.
- Массив (`T[]`) — любое количество элементов; кортеж (`[A, B]`) — фиксированное количество с конкретными типами.
- Явный тип возврата в публичных API — это документация и страховка от случайных изменений реализации.

## Заключение

Правильный выбор типа возврата — основа предсказуемого кода. Конкретные типы для данных, `void` для побочных эффектов, `never` для неиспользуемых веток и exhaustive checks, `unknown` вместо `any` для неизвестных данных, дженерики для связи входа и выхода, `Promise<T>` для асинхронных функций. В публичных API указывайте тип возврата явно — это контракт, который защищает от случайных изменений.

## Полезные ссылки

- [Everyday Types — TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Functions — TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Generics — TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/2/generics.html)
