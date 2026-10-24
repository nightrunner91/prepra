---
title: "Основы TypeScript: типы, интерфейсы и конфигурация"
section: typescript
stacks: []
description: "Фундамент TypeScript: зачем нужна статическая типизация, базовые типы, интерфейсы, type vs interface, аннотации, tsconfig.json и компиляция."
order: 1
tags: ["typescript-basics", "static-typing", "interfaces", "type-annotations", "tsconfig", "compilation"]
questions:
  - "Чем TypeScript отличается от JavaScript и какие проблемы решает статическая типизация"
  - "Какие базовые типы существуют в TypeScript и как аннотировать переменные, параметры и возвращаемые значения"
  - "Чем interface отличается от type alias и когда что использовать"
  - "Как работает компиляция TypeScript в JavaScript и что такое transpile vs type-check"
  - "Что такое structural typing и duck typing в TypeScript"
  - "Как работают union types, type narrowing и type guards"
  - "Что такое generic types и зачем они нужны"
answers:
  - "TypeScript — надмножество JavaScript с системой типов, которая проверяется до запуска программы: опечатки в свойствах и неверные присваивания ловятся на этапе написания кода, а типы становятся контрактом между модулями. Любой валидный JS — валидный TS."
  - "Примитивы: number, string, boolean, null, undefined, bigint, symbol, а также массив (`number[]`), tuple (`[string, number]`), enum, any, unknown, void и never. Аннотации ставятся через `: тип` у переменной и параметра и после `): тип` у функции, но обычно TS выводит тип сам — явная аннотация нужна, когда тип неочевиден (union, объект)."
  - "interface описывает объекты и поддерживает declaration merging и `extends`, а type — union, tuple, примитивы и функции. Правило: для объектов — interface, для union/tuple/примитивов — type."
  - "TS — transpiler: при компиляции аннотации типов удаляются, типы существуют только на этапе компиляции и в runtime их нет. Transpile — преобразование TS в JS, type check — отдельная проверка (`tsc --noEmit`); в Vite/esbuild transpile идёт без проверки типов."
  - "Structural typing проверяет не имя типа, а структуру: если у объекта есть нужные свойства, он подходит под тип (duck typing). Поэтому объект с `name` и `age` пройдёт как User, даже если не объявлен через него."
  - "Union type позволяет значение одного из нескольких типов, а type narrowing сужает его после проверки: `typeof`, `in`, `instanceof`, discriminated union через switch. В каждой ветке TS знает конкретный тип."
  - "Generic — «переменная для типа»: тип передаётся как параметр и сохраняет информацию. `firstElement<T>(arr: T[])` возвращает `T | undefined`, а не any, поэтому результат остаётся типизированным при любом входном типе."
---

# Основы TypeScript: типы, интерфейсы и конфигурация

Код на JavaScript ломается не там, где его пишут, а там, где он выполняется: опечатка в имени свойства, лишний аргумент, `undefined` вместо числа — всё это всплывает в лучшем случае в консоли, в худшем у пользователя. TypeScript переносит часть таких ошибок на этап написания кода. Но типы — не самоцель, а способ описать, что происходит в программе, и получить от редактора проверки и подсказки. В этой статье разберём, как устроена система типов TypeScript, как аннотировать код, чем `interface` отличается от `type`, зачем нужны generics и как настроить компилятор.

## Содержание

1. [Что такое TypeScript и зачем он нужен](#что-такое-typescript-и-зачем-он-нужен)
2. [Установка и первый запуск](#установка-и-первый-запуск)
3. [Базовые типы](#базовые-типы)
4. [Аннотации и вывод типов](#аннотации-и-вывод-типов)
5. [Interface и Type](#interface-и-type)
6. [Structural typing](#structural-typing)
7. [Union types и narrowing](#union-types-и-narrowing)
8. [Функции](#функции)
9. [Generics: параметры типов](#generics-параметры-типов)
10. [Классы](#классы)
11. [tsconfig.json](#tsconfigjson)
12. [Компиляция](#компиляция)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

---

## Что такое TypeScript и зачем он нужен

В JavaScript тип принадлежит значению, а не переменной. Одна и та же переменная может хранить число, потом строку, потом объект — язык не помнит, что «должно» лежать внутри. Из-за этого ошибка обнаруживается не в момент, когда её сделали, а в момент, когда значение начали использовать.

Посмотрите на типичную опечатку:

```js
function getUser(id) {
  return { name: "Alice" };
}

const user = getUser(1);
console.log(user.naem); // undefined — опечатка, но JavaScript не возражает
```

Для JavaScript `user.naem` — обычное обращение к свойству. Свойства с таким именем нет, поэтому результатом будет `undefined`. Дальше программа продолжит работу с «пустым» значением, и настоящая ошибка проявится позже — например, при чтении `user.naem.length`.

Теперь тот же код с типами:

```ts
interface User {
  name: string;
}

function getUser(id: number): User {
  return { name: "Alice" };
}

const user = getUser(1);
console.log(user.naem); // ❌ Property 'naem' does not exist on type 'User'
```

Здесь работает не магия, а простая цепочка рассуждений. Аннотация `: User` сообщает, что функция возвращает объект с полем `name`. TypeScript запоминает эту форму и проверяет каждое обращение к `user`. Опечатка находится до запуска — прямо в редакторе.

TypeScript — надмножество JavaScript: любой валидный JS уже является валидным TS. Новых возможностей в рантайме он не добавляет. Браузер и Node выполняют тот же JavaScript, только без типов: аннотации и интерфейсы существуют лишь до сборки и полностью стираются. Поэтому TypeScript можно добавить в существующий проект постепенно, файл за файлом.

### Что это даёт на практике

**Ошибки до запуска.** Неверный аргумент, забытое свойство, `null` там, где ожидается строка, — всё это ловится компилятором, а не пользователем. Чем раньше найден баг, тем дешевле его исправление.

**Подсказки в редакторе.** Когда типы известны, VS Code и WebStorm предлагают автодополнение, показывают сигнатуры функций и документацию. Это не украшение: по сути, редактор отвечает на вопрос «что здесь можно сделать» без переключения в документацию.

**Контракты между модулями.** Сигнатура функции с типами — это публичный API. Если функция принимает `User` и возвращает `Promise<Order[]>`, её не нужно читать целиком, чтобы понять, как её использовать.

**Безопасный рефакторинг.** При переименовании свойства компилятор покажет все места, где оно используется. В JavaScript такие места приходится искать вручную, и что-то обязательно останется.

### Когда TypeScript окупается

| Проект | TypeScript? | Почему |
|--------|-------------|--------|
| Маленький скрипт на 50 строк | ❌ Избыточен | Накладные расходы типов не окупаются |
| Прототип / MVP | ⚠️ Опционально | Можно начать без типов и добавить позже |
| Средний и большой проект | ✅ Рекомендуется | Типы ловят баги и помогают навигации |
| Командная разработка | ✅ Обязательно | Типы — контракт между модулями |
| Библиотека / фреймворк | ✅ Обязательно | Пользователи библиотеки получают автодополнение |

---

## Установка и первый запуск

TypeScript распространяется как npm-пакет с компилятором `tsc`. В проект его ставят в dev-зависимости: он нужен для сборки и проверки, но не для работы приложения.

```bash
# В проект — рекомендуемый вариант
npm install --save-dev typescript

# Глобально — если нужен tsc вне проекта
npm install -g typescript
```

Проверьте установку:

```bash
tsc --version
# Version 5.x.x
```

Создайте файл `hello.ts`:

```ts
function greet(userName: string): string {
  return `Hello, ${userName}!`;
}

console.log(greet("TypeScript"));
```

В этом примере всего две аннотации: `userName: string` говорит, что параметр принимает только строку, а `): string` — что функция обещает вернуть строку. Пока это единственное, что TypeScript добавляет к коду.

Скомпилируйте файл и запустите результат:

```bash
tsc hello.ts   # рядом появится hello.js
node hello.js
```

Именно `hello.js` выполнит Node — в нём не будет ни аннотаций, ни `interface`. Если не хочется компилировать вручную на каждом шаге, используйте `tsx hello.ts`: он транспилирует файл на лету.

Для проекта конфигурацию создают командой `tsc --init`. Она сгенерирует `tsconfig.json` с настройками по умолчанию; о самых важных опциях поговорим в конце статьи.

---

## Базовые типы

Прежде чем перечислять типы, полезно договориться о модели. В TypeScript **тип — это множество значений**, допустимых в данной позиции. `number` — множество всех чисел, `"active"` — множество из одного значения, `string | number` — объединение двух множеств. Почти всё дальнейшее — операции над этими множествами: расширение, сужение, пересечение. С такой моделью `union`, narrowing и `never` перестают быть набором трюков.

### Примитивы

| Тип | Какие значения входят |
|-----|-----------------------|
| `string` | все строки |
| `number` | целые, дробные, `NaN`, `Infinity` — в JavaScript одно числовое множество |
| `boolean` | `true` и `false` |
| `null` | единственное значение `null` |
| `undefined` | единственное значение `undefined` |
| `bigint` | целые произвольной длины (суффикс `n`) |
| `symbol` | уникальные идентификаторы |

Отдельных `int`, `float` или `char` в TypeScript нет — их не существует и в рантайме. `null` и `undefined` — самостоятельные типы, а не «пустые значения». При включённом `strictNullChecks` (он входит в `strict`) они не присваиваются другим типам без явного разрешения.

```ts
const age: number = 25;          // аннотация: переменная имеет тип number
const userName: string = "Alice";
const isActive: boolean = true;

// let city: string = null;      // ❌ Type 'null' is not assignable to type 'string'
let nickname: string | null = null; // ✅ явно разрешили null
```

Аннотация читается как «переменная `age` имеет тип `number`». `bigint` и `symbol` встречаются реже остальных, но это полноценные типы: например, `Symbol` используют для уникальных ключей объектов.

### Массивы

Массив описывает однородную коллекцию: все элементы одного типа. Запись `number[]` читается как «массив чисел», `Array<number>` — то же самое в generic-форме (о generics поговорим ниже).

```ts
const numbers: number[] = [1, 2, 3];
const names: Array<string> = ["Alice", "Bob"]; // то же, что string[]

numbers.push(4); // ✅
// numbers.push("five"); // ❌ Argument of type 'string' is not assignable to parameter of type 'number'

// readonly-массив: менять нельзя
const readings: readonly number[] = [1, 2, 3];
// readings.push(4); // ❌ Property 'push' does not exist on type 'readonly number[]'
```

Бывает нужно запретить изменение массива. Для этого есть `readonly`: он не делает значения неизменяемыми, но запрещает менять сам массив — добавлять, удалять и сортировать элементы. Такой тип удобно ставить у параметров функций, которые не должны мутировать входные данные: компилятор не даст случайно вызвать `push`.

### Tuple

Обычный массив отвечает на вопрос «какие элементы», но не «сколько их и в каком порядке». Tuple фиксирует и длину, и тип на каждой позиции. Он нужен, когда позиция несёт смысл: пара «ключ — значение», координата, результат функции, возвращающей два значения.

```ts
const pair: [string, number] = ["age", 25];
const [key, value] = pair; // key: string, value: number

// pair[0] = 42; // ❌ Type 'number' is not assignable to type 'string'
// const wrong: [string, number] = [25, "age"]; // ❌
```

Самый известный tuple в реальном коде — результат `useState` в React: `[значение, сеттер]`. Благодаря tuple TypeScript знает тип каждого элемента, а не считает массив общим списком.

### Enum

Enum даёт имена набору констант:

```ts
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

enum Color {
  Red = "RED",
  Green = "GREEN",
}
```

Числовой enum по умолчанию нумерует элементы с нуля, строковый требует явных значений. В отличие от `interface`, enum существует в рантайме: компилятор создаёт объект `Direction` с полями. Из-за этого enum считают спорной возможностью — он добавляет код в бандл и хуже сочетается с union-типами. Часто его заменяют на `type Direction = "up" | "down" | "left" | "right"` — подробнее в статье про enums.

### any и unknown

`any` и `unknown` оба означают «тип неизвестен», но ведут себя противоположным образом:

```ts
let anything: any = 42;
anything = "hello";  // ✅ any принимает всё
anything.toFixed();  // ✅ компилятор молчит — и это опасно: у строки нет toFixed

let mystery: unknown = 42;
mystery = "hello";   // ✅ unknown тоже принимает всё
// mystery.toFixed(); // ❌ 'mystery' is of type 'unknown'
```

Разница в том, что `any` отключает проверку и передаёт это «отключение» дальше: любое выражение с `any` тоже становится `any`. Одна такая переменная способна обнулить типизацию целого модуля. `unknown` запрещает что-либо делать со значением, пока вы не проверите его тип:

```ts
let mystery: unknown = 42;

if (typeof mystery === "number") {
  mystery.toFixed(); // ✅ после проверки TypeScript сузил тип до number
}
```

Правило простое: `any` допустим как временная мера при миграции с JavaScript, `unknown` — для данных, которые приходят извне: ответ API, `JSON.parse`, `localStorage`.

### void, never и object

`void` означает, что функция завершается, но ничего не возвращает. `never` — что функция вообще не завершается нормально: бросает исключение или работает бесконечно. У `never` есть и второе применение: это тип, у которого нет ни одного значения. Он пригодится для проверки полноты union.

```ts
function log(message: string): void {
  console.log(message);
}

function fail(message: string): never {
  throw new Error(message);
}
```

`object` — любой не-примитивный тип. На практике он почти бесполезен: `object` не говорит, какие у объекта свойства. Лучше описывать конкретную форму через `interface`.

```ts
const data: object = { name: "Alice" };
// data.name; // ❌ Property 'name' does not exist on type 'object'
```

---

## Аннотации и вывод типов

Аннотация — это `: Тип` после имени. Но писать её везде не нужно: TypeScript выводит тип из инициализатора. Последующее использование может сузить тип в конкретной ветке, но не меняет объявленный тип.

```ts
const role = "admin";    // тип "admin" — литерал
let mode = "admin";      // тип string
const ids = [1, 2, 3];   // тип number[]
```

Почему `const role` получил не `string`, а `"admin"`? Потому что `const` нельзя переприсвоить: значение навсегда останется именно этой строкой. У `let` такой гарантии нет — он получил широкий `string`. Это различие важно для union-типов: литеральные типы — основа discriminated union, о котором ниже.

### Когда аннотация обязательна

**Параметры функций.** TypeScript проверяет функцию до того, как увидит вызовы, и не может вывести тип параметра из аргументов. Поэтому параметры аннотируют всегда.

**Пустые массивы и объекты.** Из `[]` или `{}` компилятору нечего вывести. Объект получит тип `{}` и не даст добавить поле, а массив в некоторых контекстах останется `any[]`, и проверки не будет. Аннотация задаёт тип заранее:

```ts
const config: { mode?: string } = {};
config.mode = "dark"; // ✅

// Без аннотации: Property 'mode' does not exist on type '{}'

const ids: number[] = [];
ids.push(1); // ✅
```

**Публичные функции и модули.** Возвращаемый тип TypeScript выведет сам, но у экспортируемой функции его лучше указать явно: тогда изменение тела не сможет незаметно изменить контракт.

**Сложные типы.** Union, объект или функцию с нетривиальной сигнатурой проще прочитать, когда тип назван явно.

### Функции: параметры и возврат

```ts
function greet(userName: string, times = 1): string {
  return `Hello, ${userName}!`.repeat(times);
}
```

`userName: string` — входной контракт. `times = 1` — параметр по умолчанию: TypeScript выводит его тип `number` и разрешает не передавать аргумент. `): string` — обещание вернуть строку; если внутри случайно вернуть число, компилятор ошибётся.

### Объекты

Инлайновый тип объекта работает, но его нельзя переиспользовать, и он засоряет сигнатуры:

```ts
const user: { name: string; age: number } = {
  name: "Alice",
  age: 25,
};
```

Если форма встречается больше одного раза — выносите её в `interface` или `type`. Это не только короче, но и даёт типу имя, которое появится в сообщениях об ошибках.

---

## Interface и Type

`interface` описывает форму объекта: какие у него свойства, какие типы, какие обязательны. Это контракт: если значение объявлено как `User`, компилятор потребует все обязательные поля и не даст обращаться к несуществующим.

```ts
interface User {
  readonly id: number;
  name: string;
  email?: string;
}

const user: User = {
  id: 1,
  name: "Alice",
  // email можно не указывать — свойство необязательное
};

user.name = "Bob"; // ✅
// user.id = 2;    // ❌ Cannot assign to 'id' because it is a read-only property
```

Знак `?` делает свойство необязательным: его может не быть, а при чтении тип будет `string | undefined`. Это не то же самое, что `email: string | undefined`: во втором случае свойство обязано присутствовать, пусть и со значением `undefined`.

Интерфейсы расширяются через `extends` — новый интерфейс получает все поля родителя и добавляет свои. Например, менеджер — такой же сотрудник, но с подчинёнными:

```ts
interface Employee {
  name: string;
  salary: number;
}

interface Manager extends Employee {
  reports: Employee[];
}

const manager: Manager = {
  name: "Bob",
  salary: 5000,
  reports: [],
};
```

`Manager` получает поля `Employee` и добавляет список подчинённых. Наследование здесь только на уровне типов: в рантайме ни `Employee`, ни `Manager` не существует.

### Type alias

`type` даёт имя любому типу, не только объектному:

```ts
type ID = string | number;              // union: строка или число
type Status = "active" | "inactive";    // набор литеральных значений
type Coordinate = [number, number];     // tuple из двух чисел
type Handler = (event: Event) => void;  // сигнатура функции
```

Для объектов `type User = { name: string }` и `interface User { name: string }` почти взаимозаменяемы. Разница проявляется в возможностях.

### Interface vs Type

| Критерий | Interface | Type |
|----------|-----------|------|
| Объекты с именованными свойствами | ✅ | ✅ |
| Union types | ❌ | ✅ |
| Tuple | ❌ | ✅ |
| Primitive aliases | ❌ | ✅ |
| Function types | ✅ | ✅ (удобнее) |
| Declaration merging | ✅ (можно расширять) | ❌ |
| Extends | ✅ (extends) | ✅ (& intersection) |
| Implementation в классах | ✅ (implements) | ✅ |

Практическое правило: **объекты — `interface`, всё остальное — `type`**. Причины такие:

- `interface` умеет расширяться через `extends` и объединяться при повторном объявлении — это нужно для дополнения типов библиотек;
- `type` выражает union, tuple и примитивы, а `interface` — нет;
- у `interface` обычно читаемее сообщения об ошибках, потому что тип имеет имя.

### Declaration merging

У `interface` есть уникальная возможность: два объявления с одним именем сливаются в одно.

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

const user: User = { name: "Alice", age: 25 };
```

Это не трюк ради трюка. Так библиотеки позволяют дополнять свои типы: например, добавить поле в `Request` из Express, не меняя исходный пакет. У `type` такого поведения нет — повторное объявление вызовет ошибку.

---

## Structural typing

В большинстве языков с типами совместимость определяется именем: если функция ждёт `Point`, нужно передать именно `Point`. TypeScript работает иначе — он смотрит на структуру. Проверим на примере:

```ts
interface Point {
  x: number;
  y: number;
}

function printPoint(point: Point) {
  console.log(`${point.x}, ${point.y}`);
}

const point3d = { x: 1, y: 2, z: 3 };
printPoint(point3d); // ✅ лишнее свойство не мешает

printPoint({ x: 1, y: 2, z: 3 });
// ❌ Object literal may only specify known properties,
//    and 'z' does not exist in type 'Point'
```

`point3d` не объявлен как `Point`, но у него есть `x` и `y` нужных типов — этого достаточно. Так же работают классы: класс без наследования совместим с интерфейсом, если реализует его структуру. Это статическая версия duck typing: «если это выглядит как утка и крякает как утка — это утка», только проверенная компилятором.

Почему второй вызов не компилируется? Object literal, переданный напрямую, проверяется строже. Для литерала TypeScript может проверить все поля сразу и ловит опечатки вроде `{ x: 1, yy: 2 }`. Для переменной лишние поля допустимы: она могла прийти из другого места, и запрещать её было бы слишком строго.

Из structural typing следуют практические выводы:

- типы из разных библиотек совместимы, если совпадает форма — не нужно приводить их друг к другу;
- чтобы реализовать интерфейс, не обязательно наследование — достаточно структуры;
- случайно совпавшие структуры тоже совместимы. Два разных идентификатора с одинаковой формой компилятор считает взаимозаменяемыми. Если нужна номинальность, используют branding, но это отдельная тема.

---

## Union types и narrowing

Union — это «или». `string | number` означает, что значение принадлежит объединению множеств строк и чисел. Пока тип не сужен, TypeScript разрешает только те операции, которые безопасны для всех вариантов.

```ts
function formatId(id: string | number) {
  id.toUpperCase(); // ❌ Property 'toUpperCase' does not exist on type 'string | number'
}
```

`toUpperCase` есть у строки, но нет у числа — компилятор не может гарантировать вызов. Чтобы работать с конкретным вариантом, тип нужно сузить проверкой:

```ts
function formatId(id: string | number): string {
  if (typeof id === "string") {
    return id.toUpperCase(); // id: string
  }
  return id.toFixed(0);      // id: number — второй вариант остался
}
```

Это не приведение типа, а анализ потока управления: TypeScript идёт по коду и в каждой ветке знает, какие варианты ещё возможны. Сужение живёт только внутри ветки. Если из ветки не выходить через `return` или `throw`, после неё тип снова объединяется — компилятор не знает, какая ветка выполнится.

`typeof` работает с примитивами. Для объектов используют `in` (есть ли свойство) и `instanceof` (принадлежность классу):

```ts
interface Fish { swim(): void }
interface Bird { fly(): void }

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim(); // Fish
  } else {
    animal.fly();  // Bird
  }
}
```

### Discriminated unions

Самый надёжный способ сузить сложный union — добавить общее поле-дискриминант с литеральным типом. Тогда TypeScript сужает по значению этого поля, и проверка не зависит от наличия методов.

```ts
type Result =
  | { status: "success"; data: string }
  | { status: "error"; error: string };

function handle(result: Result) {
  switch (result.status) {
    case "success":
      return result.data;  // TypeScript знает: есть data
    case "error":
      return result.error; // TypeScript знает: есть error
  }
}
```

Литеральные типы `"success"` и `"error"` — не просто строки. Это разные типы, поэтому сравнение `result.status === "success"` отсекает второй вариант.

Если добавить третий вариант, а `switch` не обновить, компилятор не всегда ошибётся: `switch` без `default` просто завершится. Полноту проверяют через `never`. Покажем на функции, которая считает площадь фигуры:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      return assertNever(shape);
  }
}
```

Если все варианты обработаны, в `default` значение имеет тип `never`. Если появится третий вид фигуры — тип перестанет быть `never`, и вызов `assertNever` не скомпилируется. Это дешёвый способ заставить себя обновить обработку.

### Type predicate

Иногда проверку хочется вынести в функцию. Обычная функция `(value) => boolean` не поможет: TypeScript не смотрит в её тело и не узнает, что она гарантирует. Нужен предикат типа — `value is string`:

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function printValue(value: string | number) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value: string
  }
}
```

`value is string` — обещание компилятору: если функция вернула `true`, аргумент является строкой. TypeScript проверяет, что функция возвращает `boolean`, но тело не анализирует. Если предикат врёт, ошибка пройдёт компиляцию — поэтому проверка внутри должна быть честной.

---

## Функции

Функции — место, где типы окупаются быстрее всего: параметры описывают вход, возвращаемый тип — выход, и оба проверяются на каждом вызове.

```ts
function add(a: number, b: number): number {
  return a + b;
}

const multiply = (a: number, b: number): number => a * b;
```

У стрелочных функций аннотации те же. Если функция короткая и очевидная, возвращаемый тип можно опустить — TypeScript выведет его сам.

### Необязательные параметры, значения по умолчанию, rest

```ts
function greet(userName: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${userName}!`;
}

function createUser(userName: string, role = "user") {
  return { name: userName, role };
}

function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}
```

`greeting?` — параметр можно не передавать; внутри он имеет тип `string | undefined`, поэтому нужен `??`. `role = "user"` — параметр по умолчанию: его тоже можно не передавать, но внутри тип уже `string`, потому что значение всегда есть. `?` и `=` не взаимозаменяемы: первый говорит «значения может не быть», второй подставляет значение.

`...numbers` собирает остальные аргументы в массив. Тип `number[]` гарантирует, что каждый аргумент — число.

### Типы функций

```ts
type Operation = (a: number, b: number) => number;

const add: Operation = (a, b) => a + b;
const subtract: Operation = (a, b) => a - b;

function apply(a: number, b: number, operation: Operation): number {
  return operation(a, b);
}

apply(5, 3, add); // 8
```

Тип функции описывает её сигнатуру: какие параметры и что она возвращает. Имена параметров в типе не важны — важны типы и порядок. Такой тип удобно использовать для колбэков: TypeScript проверит, что переданная функция совместима.

### Перегрузки

Иногда результат зависит от типа входа: строка → число, число → строка. Union возврата `string | number` заставил бы проверять тип на каждом вызове. Перегрузки позволяют описать несколько сигнатур:

```ts
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  return typeof input === "string" ? Number(input) : String(input);
}

const parsedNumber = parse("42"); // number
const parsedString = parse(42);   // string
```

Первые две строки — сигнатуры, которые видит вызывающий код. Третья — реализация; она должна быть совместима со всеми сигнатурами, но снаружи не видна. Поэтому `parse("42")` получает тип `number`, а не `string | number`.

---

## Generics: параметры типов

Generics решают проблему повторения. Допустим, нужна функция, возвращающая первый элемент массива. Без типов получается так:

```ts
function firstElement(arr: any[]): any {
  return arr[0];
}

const first = firstElement([1, 2, 3]); // any
first.toFixed(); // компилятор не поможет, если это не число
```

`any` стирает информацию: на выходе мы снова ничего не знаем о типе. Можно написать отдельную функцию для чисел и для строк, но типов бесконечно много. Нужен способ сказать: «тип входа и выхода связаны, а какой именно — решится при вызове».

```ts
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstNumber = firstElement([1, 2, 3]);  // number | undefined
const firstString = firstElement(["a", "b"]); // string | undefined
```

`<T>` — параметр типа, «переменная» на уровне типов. Когда вы вызываете `firstElement([1, 2, 3])`, TypeScript выводит `T = number` из типа аргумента и подставляет его в возвращаемый тип. Это не `any`: связь между входом и выходом сохраняется.

`| undefined` появился не случайно: массив может быть пустым, и тогда `arr[0]` вернёт `undefined`. Без этого возвращаемый тип был бы ложью.

Generics — это параметризация типов: как функция принимает аргументы и возвращает значение, так generic-тип принимает параметры типа и возвращает конкретный тип.

### Generic-интерфейсы

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
}

const userResponse: ApiResponse<{ name: string }> = {
  data: { name: "Alice" },
  status: 200,
};

const usersResponse: ApiResponse<{ name: string }[]> = {
  data: [{ name: "Alice" }],
  status: 200,
};
```

Один интерфейс описывает ответ с любыми данными; `T` фиксируется в момент использования. Так типизируют API-клиенты: `fetch<User>("/me")` возвращает `User`, а не `unknown`.

### Constraints

```ts
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength("hello");   // ✅ у строки есть length
logLength([1, 2, 3]); // ✅ у массива есть length
// logLength(42);     // ❌ number не имеет length
```

`extends` здесь не наследование, а ограничение: `T` может быть любым типом, у которого есть числовое свойство `length`. Без ограничения обращение `value.length` не скомпилируется — TypeScript не знает, что оно существует.

---

## Классы

Классы в TypeScript — это те же классы JavaScript плюс проверки. Новых возможностей рантайма не появляется: модификаторы и `implements` стираются при компиляции.

```ts
class User {
  constructor(
    public name: string,
    private age: number,
  ) {}

  greet(): string {
    return `Hello, ${this.name}`;
  }
}

const user = new User("Alice", 25);
user.greet();
// user.age; // ❌ Property 'age' is private and only accessible within class 'User'
```

`public name` в конструкторе — сокращение: TypeScript сам объявит поле и присвоит его. Без этого пришлось бы писать поле, параметр и `this.name = name`. Модификаторы: `public` — доступен везде (по умолчанию), `protected` — классу и наследникам, `private` — только классу.

Важно: `private` — ограничение компилятора, а не рантайма. В собранном JavaScript поле остаётся обычным свойством, его видно в консоли и в `Object.keys`. Если нужна настоящая приватность, используют `#age` — это уже механизм JavaScript.

### Реализация интерфейса

```ts
interface Serializable {
  serialize(): string;
}

class User implements Serializable {
  constructor(public name: string) {}

  serialize(): string {
    return JSON.stringify({ name: this.name });
  }
}
```

`implements` — обещание, что класс реализует интерфейс. TypeScript проверит наличие метода и совместимость сигнатуры. Сам интерфейс в JavaScript не попадает.

### Абстрактные классы

```ts
abstract class Shape {
  abstract area(): number;

  describe(): string {
    return `Area: ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}
```

Абстрактный класс нельзя создать через `new`: он задаёт общий каркас для наследников. `abstract area()` обязывает их реализовать метод, а `describe` уже написан один раз.

---

## tsconfig.json

`tsconfig.json` отвечает на два вопроса: какие файлы компилировать и как. Без него `tsc`, запущенный с файлами, компилирует их по отдельности с настройками по умолчанию; для проекта нужен единый конфиг. Создать его можно командой `tsc --init`.

Разумная стартовая конфигурация выглядит так:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Разберём, что здесь важно.

**`target`** — в какую версию JavaScript компилировать. Он определяет, какие возможности синтаксиса компилятор оставит как есть, а какие перепишет. `ES2020` — разумный минимум для современных браузеров.

**`module`** — формат модулей на выходе: `ESNext`, `CommonJS`, `NodeNext`. Для сборщика обычно `ESNext`, для Node — `NodeNext`.

**`moduleResolution`** — как искать импорты. `bundler` подходит для Vite и webpack, `NodeNext` — для Node.

**`strict`** — включает семейство строгих проверок: `strictNullChecks`, `noImplicitAny` (запрет неявного `any`), `strictFunctionTypes` и другие. Главная из них — `strictNullChecks`:

```ts
let nickname: string = null; // ❌ Type 'null' is not assignable to type 'string'
let nicknameOrNull: string | null = null; // ✅
```

Без `strictNullChecks` `null` и `undefined` присваиваются любому типу — именно так теряются баги с отсутствующими данными. Включать `strict` целиком стоит с самого начала: сделать это позже, когда кода много, намного дороже.

**`esModuleInterop`** — позволяет импортировать CommonJS-модули через `import x from "x"` вместо `import * as x`. Практически всегда нужен.

**`skipLibCheck`** — не проверять declaration-файлы (`*.d.ts`), в том числе из `node_modules`. Ускоряет сборку и не даёт ошибкам чужих типов валить проект.

**`outDir` и `rootDir`** — куда класть результат и где лежат исходники. Без них `tsc` может разложить `.js` рядом с `.ts`.

**`include` и `exclude`** — какие файлы входят в проект. `node_modules` исключают всегда; файл, импортированный из включённого, попадёт в сборку даже при совпадении с `exclude`.

### Алиасы путей

`paths` задаёт короткие имена для импортов, чтобы не писать `../../../`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Теперь вместо `import Button from "../../../components/Button"` можно писать `import Button from "@/components/Button"`.

Важно: `paths` понимает только TypeScript. Сборщику (Vite, webpack) нужен свой alias с теми же значениями — иначе код пройдёт проверку типов, но не соберётся.

Если транспиляцией занимается Vite или esbuild, в конфиге ставят `noEmit: true` — тогда `tsc` только проверяет типы и не генерирует файлы.

---

## Компиляция

У `tsc` две задачи, и их полезно разделять: проверить типы и сгенерировать JavaScript. Первая — статический анализ кода, вторая — удаление типов и переписывание синтаксиса под выбранный `target`.

```
TypeScript код (.ts)
    │
    ▼
TypeScript Compiler (tsc)
    │
    ├── Type Checking (проверка типов)
    │
    ▼
JavaScript код (.js)
```

Главное следствие: типы не существуют в рантайме. Нельзя проверить `instanceof` для интерфейса, нельзя получить список полей типа, нельзя использовать тип как значение. Поэтому данные из внешнего мира проверяют вручную (type guards) или библиотеками вроде Zod.

Посмотрите, что остаётся после компиляции:

```ts
interface User {
  name: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}`;
}
```

```js
function greet(user) {
  return `Hello, ${user.name}`;
}
// interface исчез, аннотации исчезли
```

Поведение программы не изменилось — изменилась только информация, доступная компилятору.

### Transpile vs Type Check

**Transpile** (транспиляция) — преобразование TypeScript в JavaScript. **Type check** — проверка типов. `tsc` умеет и то, и другое: обычный запуск компилирует, `tsc --noEmit` только проверяет.

Современные сборщики (Vite, esbuild, swc) транспилируют очень быстро, потому что просто удаляют типы, не проверяя их. Проверка выполняется отдельно — в редакторе или командой `tsc --noEmit` в CI. Если этого не делать, проект «собирается», но ошибки типов остаются незамеченными.

### Source maps

При `sourceMap: true` рядом с `.js` появляется `.js.map` — карта соответствия скомпилированного кода исходному. Браузер и отладчик показывают исходные `.ts`, а не результат сборки. Если вы публикуете библиотеку, включают ещё `declaration: true` и `declarationMap: true`: первый генерирует `.d.ts` — файлы с типами без реализации, второй — карты к ним.

---

## Ключевые тезисы для интервью

- TypeScript — надмножество JavaScript: любой валидный JS — валидный TS, а типы стираются при компиляции.
- Тип — это множество значений; union объединяет множества, narrowing сужает их проверками.
- Базовые типы: `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol`, а также массив, tuple, enum, `any`, `unknown`, `void`, `never`.
- Type inference работает из инициализатора; параметры функций аннотируют обязательно, возвращаемый тип публичных функций — желательно.
- `interface` — для объектов и расширения, `type` — для union, tuple и примитивов; declaration merging есть только у `interface`.
- Structural typing: совместимость по форме, а не по имени; исключение — проверка лишних свойств у object literal.
- Narrowing работает через control flow: `typeof`, `in`, `instanceof`, дискриминант; вне ветки тип восстанавливается.
- `any` отключает проверку и распространяется дальше; `unknown` требует проверки перед использованием.
- Generics — параметры типов: связывают вход и выход и сохраняют конкретный тип при вызове.
- `strict: true` включает `strictNullChecks` и другие проверки; без него `null` и `undefined` проникают в любые типы.
- Компиляция = транспиляция + проверка типов; Vite и esbuild транспилируют без проверки, поэтому нужен отдельный `tsc --noEmit`.
- `private` в классах — только на этапе компиляции; настоящая приватность — `#поле`.

---

## Заключение

TypeScript добавляет статическую типизацию поверх JavaScript. Он не меняет поведение программы — он помогает описать данные и связи между ними, а затем проверяет, что код этим описаниям соответствует. В статье мы прошли путь от базовых типов и аннотаций до интерфейсов, structural typing, union-типов, generics и настройки компилятора.

Главные выводы:

1. Аннотируйте не всё подряд, а там, где тип не выводится или должен стать контрактом: параметры, публичные функции, пустые коллекции.
2. Для объектов используйте `interface`, для union, tuple и примитивов — `type`.
3. Сужение типа — это анализ потока управления, а не приведение; проверяйте варианты явно.
4. Generics сохраняют связь между типами входа и выхода, а `any` её разрушает.
5. Включайте `strict: true` сразу и проверяйте типы отдельно от сборки.

Начните с малого: добавьте `tsconfig.json` со `strict: true` и постепенно аннотируйте код. Практика — лучший способ освоить TypeScript.

---

## Полезные ссылки

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — официальная документация
- [TypeScript Playground](https://www.typescriptlang.org/play) — интерактивная песочница для экспериментов
- [Type Challenges](https://github.com/type-challenges/type-challenges) — задачи по TypeScript для практики
- [Total TypeScript](https://www.totaltypescript.com/) — курсы и туториалы от Matt Pocock
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) — бесплатная книга
