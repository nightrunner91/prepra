---
title: "TypeGuard в TypeScript"
section: typescript
description: "TypeScript — надмножество JavaScript. Он добавляет статическую типизацию, но не меняет поведение рантайма. Это создаёт разрыв: типы существуют только при компиляции, а значения — только при выполне..."
order: 8
tags: ["typeguard", "typescript"]
---

## Фундаментальная проблема

TypeScript — надмножество JavaScript. Он добавляет статическую типизацию, но не меняет поведение рантайма. Это создаёт разрыв: типы существуют только при компиляции, а значения — только при выполнении.

TypeGuard — механизм, который сокращает этот разрыв. Он позволяет компилятору **во время анализа кода** понять, какой тип имеет переменная в конкретной точке программы, основываясь на проверках, которые выполняются в рантайме.

Без type guard TypeScript работал бы вслепую: вы знаете, что значение — это `string | number`, но компилятор не может догадаться, что после `typeof value === "string"` остался только `string`.

## Control Flow Analysis

Прежде чем говорить о type guard, нужно понять механизм, на котором всё держится — **анализ потока управления** (control flow analysis).

TypeScript проходит по коду сверху вниз и в каждой точке программы отслеживает, какой тип имеет каждая переменная. Когда он встречает ветвление (`if`, `switch`, тернарный оператор), он разделяет поток на ветки и в каждой ветке сужает тип на основе условий.

```ts
function process(value: string | number) {
  // Здесь value: string | number
  if (typeof value === "string") {
    // Здесь value: string — TypeScript сузил тип
    value.toUpperCase();
  } else {
    // Здесь value: number — осталась вторая ветка union
    value.toFixed(2);
  }
}
```

Ключевой момент: сужение работает **только внутри ветки**. После `if/else` тип снова становится `string | number`, потому что компилятор не знает, какая ветка выполнится.

```ts
function example(value: string | number) {
  if (typeof value === "string") {
    value.toUpperCase(); // ✅ string
  }
  value.toUpperCase(); // ❌ string | number — тип восстановился
}
```

TypeScript использует несколько встроенных механизмов для сужения типов. Все они работают через control flow analysis.

### `typeof` — сужение по примитивным типам

`typeof` возвращает строку, описывающую тип значения. TypeScript знает допустимые результаты для каждого примитивного типа и использует это для сужения.

```ts
function format(value: string | number | boolean) {
  if (typeof value === "string") {
    return value.trim();
  }
  // Здесь value: number | boolean — string исключён
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  // Здесь value: boolean — остались только неохваченные варианты
  return value ? "yes" : "no";
}
```

Ограничение: `typeof` работает только с примитивами и `function`. Для объектов `typeof` возвращает `"object"`, что не даёт никакой полезной информации о структуре.

### `instanceof` — сужение по классу

`instanceof` проверяет, присутствует ли конструктор.prototype в цепочке прототипов объекта. TypeScript сузит тип до класса (или его подтипов), если проверка прошла.

```ts
function handleError(err: Error | string) {
  if (err instanceof Error) {
    console.error(err.message); // ✅ err: Error
  } else {
    console.error(err); // ✅ err: string
  }
}
```

### `in` — сужение по наличию свойства

Оператор `in` проверяет наличие свойства в объекте. TypeScript использует это для сужения discriminated unions и обычных объединений объектов.

```ts
type Cat = { meow: () => void };
type Dog = { bark: () => void };

function makeSound(animal: Cat | Dog) {
  if ("meow" in animal) {
    animal.meow(); // ✅ animal: Cat
  } else {
    animal.bark(); // ✅ animal: Dog
  }
}
```

### Discriminated Unions

Если варианты union имеют общее свойство с литеральным типом (discriminant), TypeScript может сужать по нему через `switch` или `if`:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2; // ✅ shape: { kind: "circle"; radius: number }
    case "rectangle":
      return shape.width * shape.height;   // ✅ shape: { kind: "rectangle"; width: number; height: number }
  }
}
```

Это работает без type guard, потому что TypeScript **встроенно** понимает discriminated unions. Но что делать, когда проверки сложнее?

## Ограничения встроенных сужений

Встроенные механизмы работают, пока проверки простые. Но как только логика усложняется, TypeScript теряет контекст:

```ts
const data: unknown = { name: "Ann", age: 25 };

if (typeof data === "object" && data !== null && "name" in data) {
  data.name; // ❌ Error: Property 'name' does not exist on type 'object'
}
```

Проверка корректна с точки зрения JavaScript, но TypeScript не может вывести из неё конкретную структуру. Для `unknown` он знает только, что это объект — но не какой именно.

Ещё хуже — когда проверка вынесена в функцию:

```ts
function isUser(obj: unknown): boolean {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof (obj as any).name === "string"
  );
}

const data: unknown = { name: "Ann", age: 25 };

if (isUser(data)) {
  data.name; // ❌ TypeScript не знает, что isUser гарантирует тип User
}
```

Функция возвращает `boolean`. Для TypeScript это просто `true` или `false` — никакой информации о типе. Компилятор не заглядывает внутрь функции, чтобы понять, что именно она проверяет.

## Type Predicates — пользовательские type guard

Решение — **предикат типа** (type predicate). Это специальная сигнатура функции, которая явно сообщает компилятору: «Если функция вернула `true`, значит аргумент имеет указанный тип».

```ts
interface User {
  name: string;
  age: number;
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof (obj as any).name === "string" &&
    "age" in obj &&
    typeof (obj as any).age === "number"
  );
}
```

Синтаксис `obj is User` — это и есть предикат типа. Он состоит из:
- **Имени параметра** (`obj`) — какой аргумент сужается
- **Ключевого слова `is`** — маркер предиката
- **Целевого типа** (`User`) — до какого типа сужается

Теперь TypeScript понимает:

```ts
const data: unknown = { name: "Ann", age: 25 };

if (isUser(data)) {
  data.name; // ✅ data: User
  data.age;  // ✅ data: User
}
```

### Как это работает внутри

Предикат типа — это **контракт**, а не проверка. TypeScript доверяет вам: если вы написали `obj is User`, он верит, что при `true` объект действительно `User`. Компилятор не анализирует тело функции.

Это означает две вещи:

**1. Вы несёте ответственность за корректность.** Если предикат врёт — будет баг, который TypeScript не поймает:

```ts
function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null;
  // ❌ Предикат врёт: любой объект пройдёт как User
}

const data: unknown = { foo: "bar" };
if (isUser(data)) {
  data.name; // Компиляция пройдёт, но в рантайме — undefined
}
```

**2. Предикат — это только обещание, а не runtime-преобразование.** Он не меняет значение, не добавляет свойства. Он говорит компилятору: «трактуй это значение как `User` в этой ветке кода».

### Предикат и else-ветка

Предикат работает в обе стороны. Если функция вернула `true` — тип сужается до указанного. Если `false` — тип сужается до **исключения** указанного типа из union.

```ts
type Result = User | Guest;

function isUser(result: Result): result is User {
  return "name" in result && "age" in result;
}

function greet(result: Result) {
  if (isUser(result)) {
    result.name; // ✅ result: User
  } else {
    result.id; // ✅ result: Guest — User исключён из union
  }
}
```

Это работает, только если исходный тип — union. Для `unknown` else-ветка не сузится, потому что из `unknown` нечего исключать.

## Assertion Functions

Иногда нужна другая семантика: не «проверить и вернуть boolean», а «проверить и бросить ошибку, если не проходит». Для этого существуют **функции-утверждения** (assertion functions).

```ts
function assertIsUser(obj: unknown): asserts obj is User {
  if (
    typeof obj !== "object" ||
    obj === null ||
    typeof (obj as any).name !== "string" ||
    typeof (obj as any).age !== "number"
  ) {
    throw new Error("Value is not a User");
  }
}
```

Синтаксис `asserts obj is User` означает: «Если функция вернулась нормально (не бросила исключение), значит `obj` имеет тип `User`».

```ts
const data: unknown = fetchUser();
assertIsUser(data);
// Если мы дошли до этой строки — data: User
console.log(data.name); // ✅
```

Разница между type guard и assertion function:

| | Type Guard (`value is T`) | Assertion (`asserts value is T`) |
|---|---|---|
| Возвращает | `boolean` | `void` |
| При неудаче | Возвращает `false` | Бросает исключение |
| Использование | В условии `if` | Как утверждение в потоке кода |
| Сужение | Только внутри ветки `if` | До конца текущей области видимости |

Assertion functions полезны для валидации на границах системы — при получении данных из API, парсинге конфигов, чтении переменных окружения.

## Практическое применение

### Валидация API-ответов

Самый частый сценарий — данные извне. TypeScript не может гарантировать, что API вернёт то, что обещала документация. Type guard — мост между «мы надеемся» и «мы проверили».

```ts
interface ApiResponse {
  status: "success" | "error";
  data?: { id: number; title: string };
  error?: string;
}

function isSuccessResponse(
  res: ApiResponse
): res is ApiResponse & { data: { id: number; title: string } } {
  return res.status === "success" && res.data !== undefined;
}

const result = await fetch("/api/data").then(r => r.json());

if (isSuccessResponse(result)) {
  console.log(result.data.id); // ✅ TypeScript знает, что data существует
} else {
  console.log(result.error);   // ✅ TypeScript знает, что это error-ответ
}
```

### Type guard как callback для массивов

Type guard — это обычная функция `(value: T) => boolean`. Это значит, её можно передавать в `.filter()`, `.find()`, `.some()` — и TypeScript корректно сузит тип элементов:

```ts
const values: unknown[] = getMixedData();

const users = values.filter(isUser);
// ✅ users: User[]

const firstUser = values.find(isUser);
// ✅ firstUser: User | undefined
```

Без предиката `.filter()` вернул бы `unknown[]`, и пришлось бы делать `as User[]` — небезопасное приведение.

### Исчерпывающая проверка (exhaustiveness check)

TypeScript позволяет гарантировать, что обработаны все варианты union. Если кто-то добавит новый вариант — компилятор выдаст ошибку:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

Переменная `_exhaustive` имеет тип `never` — тип, которому не может принадлежать никакое значение. Если добавить новый вариант в `Shape` и не обработать его в `switch`, TypeScript выдаст ошибку на строке `const _exhaustive: never = shape`, потому что `shape` уже не будет `never`.

## Когда type guard недостаточен

Ручные type guard хрупкие. Они не масштабируются на сложные схемы и легко расходятся с реальными данными. Для серьёзной валидации используют runtime-библиотеки, которые **одновременно** проверяют данные и генерируют типы:

```ts
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>; // { name: string; age: number }

const data: unknown = await fetchUser();
const user = UserSchema.parse(data); // ✅ Проверка в рантайме + тип User
```

Zod, Valibot, io-ts — все они решают одну проблему: гарантировать, что runtime-значение соответствует compile-time типу. Type guard — это ручная версия того же механизма.

## Ключевые принципы

1. **Type guard — это мост между рантаймом и системой типов.** Он позволяет информации из runtime-проверок влиять на compile-time анализ.

2. **Предикат типа (`value is T`) — контракт, а не проверка.** TypeScript доверяет вам. Если предикат врёт — баг останется незамеченным.

3. **Control flow analysis — основа всего.** Сужение работает только внутри ветки, в которой произошла проверка. После слияния веток тип восстанавливается.

4. **Assertion functions (`asserts value is T`)** — альтернатива для сценариев, где неудача — это исключение, а не нормальная ветка выполнения.

5. **Для сложных схем используйте библиотеки валидации.** Ручные guard подходят для простых случаев. Для API-контрактов и сложных структур — Zod или аналоги.
