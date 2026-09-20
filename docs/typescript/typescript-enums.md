---
title: "Enum в TypeScript: польза и риски"
section: typescript
description: "Enum в TypeScript генерирует runtime-объект, что даёт возможности и создаёт риски. Сравниваем numeric, string enums и альтернативы: union types и as const."
order: 2
tags: ["enum", "union-types", "as-const", "const-enum", "reverse-mapping", "numeric-enums"]
questions:
  - "Почему enum — единственная конструкция TypeScript, генерирующая runtime-объект"
  - "Что такое reverse mapping в numeric enums и почему это проблема"
  - "Чем string enums лучше numeric enums"
  - "Почему union types в большинстве случаев лучше enum"
  - "Как работает паттерн `as const` и чем он лучше enum"
  - "Когда enum действительно оправдан (битовые флаги, reverse mapping)"
  - "Почему `const enum` не работает с `isolatedModules`"
  - "Как использовать `Record<Enum, ...>` для метаданных"
---

# Enum в TypeScript: польза и риски

Enum — механизм TypeScript для создания именованных наборов констант. Но прежде чем использовать enum, нужно понять его ключевую особенность, которая отличает его от всех остальных конструкций TypeScript и которая делает его спорным.

Enum — единственная конструкция TypeScript, которая генерирует реальный JavaScript-объект при компиляции. Все остальные типы стираются, а enum существует в рантайме. Это определяет и его возможности, и его проблемы. В этой статье разберём numeric и string enums, union types как альтернативу, `as const` паттерн и узнаем, когда enum действительно оправдан.

## Содержание

1. [Enum — это не тип, это значение](#enum--это-не-тип-это-значение)
2. [Numeric Enums](#numeric-enums)
3. [String Enums](#string-enums)
4. [Union Types — альтернатива enum](#union-types--альтернатива-enum)
5. [Когда enum действительно нужен](#когда-enum-действительно-нужен)
6. [Const Enum](#const-enum)
7. [Практические паттерны](#практические-паттерны)
8. [Рекомендации](#рекомендации)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## Enum — это не тип, это значение

Все остальные конструкции TypeScript — `interface`, `type`, generics, utility-типы — существуют только на уровне типов. При компиляции в JavaScript они полностью стираются.

Enum — единственное исключение. Он генерирует **реальный JavaScript-объект**, который существует в рантайме.

```typescript
// TypeScript
enum Status {
  Idle,
  Loading,
  Success,
  Error
}

// Скомпилированный JavaScript
var Status;
(function (Status) {
  Status[Status["Idle"] = 0] = "Idle";
  Status[Status["Loading"] = 1] = "Loading";
  Status[Status["Success"] = 2] = "Success";
  Status[Status["Error"] = 3] = "Error";
})(Status || (Status = {}));
```

Это не абстрактный тип — это объект в памяти, который занимает место в бандле, итерация по которому даёт реальные значения. Это фундаментальное отличие определяет всё: и возможности enum, и его проблемы.

## Numeric Enums

Значения автоматически нумеруются начиная с 0:

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

const dir = Direction.Up; // 0
```

Можно задавать значения явно, в том числе с автоинкрементом:

```typescript
enum HttpStatus {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404
}
```

Или использовать битовые флаги:

```typescript
enum FileAccess {
  None    = 0,
  Read    = 1 << 0, // 1
  Write   = 1 << 1, // 2
  Execute = 1 << 2  // 4
}

const access = FileAccess.Read | FileAccess.Write; // 3
```

### Reverse Mapping — ловушка numeric enum

Numeric enum создаёт **двунаправленный маппинг**: по имени можно получить значение, по значению — имя.

```typescript
enum Status {
  Idle,     // 0
  Loading   // 1
}

Status.Idle;       // 0
Status[0];         // "Idle"  ← обратное обращение
```

Это работает потому, что сгенерированный объект содержит оба направления:

```javascript
Status["Idle"] = 0;   // прямое
Status[0] = "Idle";   // обратное
```

Проблема: это означает, что **любое число** может быть валидным значением enum. TypeScript не проверяет, что значение действительно было присвоено:

```typescript
enum Status { Idle, Loading, Success }

function handle(status: Status) {
  // ...
}

handle(42); // ❌ Компилятор не ругается, хотя 42 не определён в enum
```

TypeScript принимает любое число как валидное значение numeric enum. Это ослабляет типобезопасность — одна из причин, по которой community уходит от numeric enum.

## String Enums

Строковые enum хранят строки вместо чисел. Они не поддерживают reverse mapping:

```typescript
enum Status {
  Idle    = "idle",
  Loading = "loading",
  Success = "success",
  Error   = "error"
}

Status.Loading; // "loading" — понятно при отладке
```

String enum решает проблему numeric enum: значение `42` нельзя присвоить `Status`, потому что компилятор знает, что допустимы только `"idle"`, `"loading"`, `"success"`, `"error"`.

```typescript
handle(Status.Idle);  // ✅
handle("idle");       // ❌ Error: string не присваивается к Status
handle(42);           // ❌ Error
```

Но появляется другая проблема: string enum **не совместим** со строковыми литералами. Если API возвращает `"idle"`, вы не можете напрямую присвоить это значение `Status` без приведения типов:

```typescript
const apiResponse = "idle"; // string
const status: Status = apiResponse; // ❌ Error
const status: Status = apiResponse as Status; // ✅ но это небезопасно
```

## Union Types — альтернатива enum

В большинстве случаев union type решает ту же задачу лучше:

```typescript
// Enum
enum Status {
  Idle    = "idle",
  Loading = "loading",
  Success = "success",
  Error   = "error"
}

// Union type — тот же результат
type Status = "idle" | "loading" | "success" | "error";
```

Сравнение:

| | Enum | Union Type |
|---|---|---|
| Runtime-объект | Да, занимает место в бандле | Нет, стирается при компиляции |
| Совместимость со строками | Нет, нужен `as` | Да, `"idle"` — валидное значение |
| Итерация по значениям | `Object.values(Status)` | Нет встроенного способа |
| Reverse mapping | Да (numeric) | Нет |
| `isolatedModules` | `const enum` не работает | Работает без ограничений |
| Автодополнение | Да | Да |

Ключевое преимущество union type — **совместимость с данными извне**. Когда API возвращает `"idle"`, это уже валидное значение `Status`. С enum вам придётся делать `as Status` — небезопасное приведение, которое обходит проверку типов.

### `as const` — enum без runtime-объекта

Если нужна итерация по значениям и общее пространство имён, но без runtime-объекта:

```typescript
const Status = {
  Idle:    "idle",
  Loading: "loading",
  Success: "success",
  Error:   "error",
} as const;

type Status = typeof Status[keyof typeof Status];
// "idle" | "loading" | "success" | "error"

// Итерация
Object.values(Status); // ["idle", "loading", "success", "error"]

// Использование как тип
function handle(status: Status) {
  // ...
}

// Использование как значение
handle(Status.Idle);
```

`as const` создаёт объект с литеральными типами. `typeof Status[keyof typeof Status]` извлекает union всех значений. Вы получаете и пространство имён (`Status.Idle`), и тип (`Status`), и итерацию — без генерации enum-объекта.

## Когда enum действительно нужен

Enum оправдан, когда вы используете его сильные стороны:

**1. Битовые флаги** — единственный случай, где enum незаменим:

```typescript
enum Permission {
  Read    = 1 << 0, // 1
  Write   = 1 << 1, // 2
  Execute = 1 << 2  // 4
}

const perm = Permission.Read | Permission.Write; // 3
const hasRead = (perm & Permission.Read) !== 0;  // true
```

**2. Числовые константы с reverse mapping** — когда нужно по значению узнать имя:

```typescript
enum HttpCode {
  OK = 200,
  NotFound = 404,
  ServerError = 500
}

HttpCode[404]; // "NotFound" — полезно для логирования
```

**3. Группа связанных констант, которые нужно итерировать** — когда `as const` не подходит:

```typescript
enum Month {
  January = 1,
  February,
  // ...
  December
}

// Итерация по всем месяцам
Object.values(Month).filter(v => typeof v === "number");
```

## Const Enum

`const enum` — вариант, при котором значения подставляются напрямую в код при компиляции:

```typescript
const enum Status {
  Idle = "idle",
  Loading = "loading"
}

const s = Status.Idle;
// Компилируется в: const s = "idle";
// Объект Status полностью удалён
```

Проблема: `const enum` **не работает** с `isolatedModules: true` — стандартной настройкой Vite, Next.js, esbuild. Компилятор не может подставить значения, потому что каждый файл компилируется изолированно и не видит определения enum.

Это делает `const enum` практически непригодным для современных проектов. Используйте union types или `as const`.

## Практические паттерны

### Enum + Record для метаданных

```typescript
enum Status {
  Idle    = "idle",
  Loading = "loading",
  Success = "success",
  Error   = "error"
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  [Status.Idle]:    { label: "Ожидание",  color: "gray" },
  [Status.Loading]: { label: "Загрузка",  color: "blue" },
  [Status.Success]: { label: "Успех",     color: "green" },
  [Status.Error]:   { label: "Ошибка",    color: "red" },
};
```

`Record<Status, ...>` гарантирует, что все варианты обработаны. Если добавить новый вариант в enum — TypeScript выдаст ошибку.

### Exhaustiveness check

```typescript
function getLabel(status: Status): string {
  switch (status) {
    case Status.Idle:    return "Ожидание";
    case Status.Loading: return "Загрузка";
    case Status.Success: return "Успех";
    case Status.Error:   return "Ошибка";
    default:
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

### Type guard для enum

```typescript
function isStatus(value: string): value is Status {
  return Object.values(Status).includes(value as Status);
}

const input = "idle";
if (isStatus(input)) {
  // input: Status
}
```

### Enum в discriminated unions

```typescript
type FetchState =
  | { status: Status.Idle }
  | { status: Status.Loading }
  | { status: Status.Success; data: User[] }
  | { status: Status.Error; error: string };

function render(state: FetchState) {
  switch (state.status) {
    case Status.Loading:
      return <Spinner />;
    case Status.Success:
      return <List items={state.data} />; // ✅ data гарантированно существует
    case Status.Error:
      return <Error message={state.error} />;
    case Status.Idle:
      return null;
  }
}
```

## Рекомендации

1. **По умолчанию используйте union types.** Для большинства случаев `"idle" | "loading" | "success" | "error"` лучше enum.

2. **Используйте `as const`**, если нужно пространство имён и итерация без runtime-объекта.

3. **Используйте enum**, когда нужны битовые флаги, числовые константы с reverse mapping, или группа констант, которую нужно итерировать.

4. **Избегайте `const enum`** в проектах с `isolatedModules` (Vite, Next.js).

5. **String enum предпочтительнее numeric** — значения читаемы при отладке, и компилятор не принимает произвольные числа.

6. **Не смешивайте string и numeric** в одном enum.

7. **Используйте exhaustiveness check** с `never` в `default`-ветке `switch`.

## Ключевые тезисы для интервью

- Enum — единственная конструкция TypeScript, генерирующая реальный JavaScript-объект в рантайме.
- Numeric enum создаёт reverse mapping: по значению можно узнать имя, но любое число проходит как валидное значение.
- String enum хранит строки, не поддерживает reverse mapping, но обеспечивает строгую типобезопасность.
- String enum не совместим со строковыми литералами — нужен `as` для приведения типов.
- Union type (`"idle" | "loading"`) в большинстве случаев лучше enum: стирается при компиляции, совместим с данными извне.
- `as const` создаёт enum-подобный объект без runtime-генерации: и пространство имён, и тип, и итерация.
- `const enum` не работает с `isolatedModules: true` (Vite, Next.js, esbuild).
- Enum оправдан для битовых флагов, числовых констант с reverse mapping и итерируемых групп констант.
- `Record<Enum, ...>` гарантирует обработку всех вариантов; exhaustiveness check с `never` ловит забытые случаи.
- Не смешивайте string и numeric значения в одном enum.

## Заключение

Enum в TypeScript — спорная конструкция. Единственная, которая генерирует runtime-объект, что одновременно даёт возможности (итерация, reverse mapping) и создаёт проблемы (размер бандла, несовместимость с внешними данными). В большинстве случаев union type или `as const` решают задачу лучше. Enum оправдан для битовых флагов и числовых констант с reverse mapping. При использовании enum применяйте `Record` для метаданных и exhaustiveness check для полноты обработки.

## Полезные ссылки

- [Enums — TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TypeScript Enums — Matt Pocock](https://www.totaltypescript.com/tutorials/typescript/enum)
- [Union types vs Enums](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
