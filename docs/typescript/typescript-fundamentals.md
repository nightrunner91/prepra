---
title: "Основы TypeScript: типы, интерфейсы и конфигурация"
section: typescript
description: "Фундамент TypeScript для начинающих: что такое TS, зачем нужна статическая типизация, базовые типы, интерфейсы, type vs interface, аннотации, tsconfig.json и компиляция."
order: 1
tags: ["typescript-basics", "static-typing", "interfaces", "type-annotations", "tsconfig", "compilation"]
questions:
  - "Чем TypeScript отличается от JavaScript и какие проблемы решает статическая типизация"
  - "Какие базовые типы существуют в TypeScript и как аннотировать переменные, параметры и возвращаемые значения"
  - "Чем interface отличается от type alias и когда что использовать"
  - "Что такое tsconfig.json и какие опции самые важные"
  - "Как работает компиляция TypeScript в JavaScript и что такое transpile vs type-check"
  - "Что такое structural typing и duck typing в TypeScript"
  - "Как работают union types, type narrowing и type guards"
  - "Что такое generic types и зачем они нужны"
---

# Основы TypeScript: типы, интерфейсы и конфигурация

JavaScript — язык с динамической типизацией. Переменная может хранить число, потом строку, потом объект — и компилятор не будет возражать. Это удобно для прототипов, но на больших проектах приводит к багам, которые можно было бы поймать на этапе написания кода. TypeScript добавляет поверх JavaScript систему типов, которая ловит ошибки до запуска программы. В этой статье разберём самые основы: что такое TypeScript, зачем он нужен, как аннотировать типы, чем interface отличается от type, и как настроить проект.

## Содержание

1. [Что такое TypeScript и зачем он нужен](#что-такое-typescript-и-зачем-он-нужен)
2. [Установка и запуск](#установка-и-запуск)
3. [Базовые типы](#базовые-типы)
4. [Аннотации типов](#аннотации-типов)
5. [Interface и Type](#interface-и-type)
6. [Union Types и Type Narrowing](#union-types-и-type-narrowing)
7. [Функции](#функции)
8. [Generics — базовое понимание](#generics--базовое-понимание)
9. [Классы](#классы)
10. [tsconfig.json](#tsconfigjson)
11. [Компиляция TypeScript](#компиляция-typescript)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое TypeScript и зачем он нужен

### TypeScript — это JavaScript + типы

TypeScript (TS) — это надмножество JavaScript, разработанное Microsoft. Любой валидный JavaScript-код является валидным TypeScript-кодом. TS добавляет систему типов, которая проверяется **до** запуска программы.

```ts
// Это валидный JavaScript и валидный TypeScript
const message = "Hello, World!";
console.log(message);

// Это валидный JavaScript, но TypeScript покажет ошибку
const count: number = 42;
count = "hello"; // ❌ Type 'string' is not assignable to type 'number'
```

### Какие проблемы решает TypeScript

**1. Ошибки обнаруживаются на этапе написания кода**

```js
// JavaScript — ошибка обнаружится только при выполнении
function getUser(id) {
  return { name: "Alice" };
}

const user = getUser(1);
console.log(user.naem); // undefined — опечатка, но ошибки нет!
```

```ts
// TypeScript — ошибка обнаружится сразу
interface User {
  name: string;
}

function getUser(id: number): User {
  return { name: "Alice" };
}

const user = getUser(1);
console.log(user.naem); // ❌ Property 'naem' does not exist on type 'User'
```

**2. Автодополнение в IDE**

Когда типы известны, редактор (VS Code, WebStorm) предлагает автодополнение, показывает документацию и подсказки.

**3. Документация через типы**

Типы — это самодокументирующийся код. Вместо комментариев `// user: { name: string, age: number }` вы пишете `interface User { name: string; age: number }` — и это проверяется компилятором.

**4. Безопасный рефакторинг**

При переименовании свойства TypeScript покажет все места, где оно используется. В JavaScript придётся искать вручную.

### Когда TypeScript окупается

| Проект | TypeScript? | Почему |
|--------|-------------|--------|
| Маленький скрипт на 50 строк | ❌ Избыточен | Накладные расходы типов не окупаются |
| Прототип / MVP | ⚠️ Опционально | Можно начать без типов и добавить позже |
| Средний и большой проект | ✅ Рекомендуется | Типы ловят баги и помогают навигации |
| Командная разработка | ✅ Обязательно | Типы — контракт между модулями |
| Библиотека / фреймворк | ✅ Обязательно | Пользователи библиотеки получают автодополнение |

---

## Установка и запуск

### Установка TypeScript

```bash
# Глобально
npm install -g typescript

# В проект (рекомендуется)
npm install --save-dev typescript
```

### Проверка

```bash
tsc --version
# Version 5.x.x
```

### Первый файл

Создайте `hello.ts`:

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("TypeScript"));
```

### Компиляция

```bash
# Компилировать один файл
tsc hello.ts

# Запустить результат
node hello.js
```

### tsconfig.json

Для проекта создайте конфигурационный файл:

```bash
tsc --init
```

Это создаст `tsconfig.json` с разумными настройками по умолчанию. Подробнее о настройках — в конце статьи.

---

## Базовые типы

### Примитивные типы

```ts
// Number
const age: number = 25;
const price: number = 19.99;
const hex: number = 0xff00;
const binary: number = 0b1010;
const octal: number = 0o744;

// String
const name: string = "Alice";
const greeting: string = `Hello, ${name}`;

// Boolean
const isActive: boolean = true;

// Null и Undefined
const empty: null = null;
const notAssigned: undefined = undefined;

// BigInt
const bigNumber: bigint = 9007199254740991n;

// Symbol
const id: symbol = Symbol("id");
```

### Массивы

```ts
// Два способа аннотировать массив
const numbers: number[] = [1, 2, 3];
const strings: Array<string> = ["a", "b", "c"];

// Readonly массив (нельзя мутировать)
const readonlyNumbers: readonly number[] = [1, 2, 3];
// readonlyNumbers.push(4); // ❌ Property 'push' does not exist
```

### Tuple (кортеж)

```ts
// Фиксированное количество элементов с известными типами
const pair: [string, number] = ["age", 25];
const rgb: [number, number, number] = [255, 128, 0];

// Доступ по индексу
const label = pair[0]; // string
const value = pair[1]; // number

// Деструктуризация
const [key, val] = pair;
```

### Enum (перечисление)

```ts
// Числовой enum
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

const dir: Direction = Direction.Up;

// Числовой enum с явными значениями
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}

// Строковой enum
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

// ⚠️ Enum — спорная фича. Многие предпочитают const enum или union types.
// Подробнее — в статье про enums.
```

### Any и Unknown

```ts
// any — отключает проверку типов (избегайте!)
let anything: any = 42;
anything = "hello";    // ✅ TS не ругается
anything.toFixed();    // ✅ TS не ругается, но упадёт в runtime!

// unknown — безопасная альтернатива any
let mystery: unknown = 42;
mystery = "hello";     // ✅ OK
// mystery.toFixed();   // ❌ Object is of type 'unknown'

// Нужно проверить тип перед использованием
if (typeof mystery === "number") {
  mystery.toFixed();   // ✅ TS знает, что это number
}
```

**Правило:** Избегайте `any`. Если нужен «любой тип» — используйте `unknown` и проверяйте тип перед использованием.

### Void, Never, Object

```ts
// void — отсутствие значения (для функций, которые ничего не возвращают)
function log(message: string): void {
  console.log(message);
}

// never — значение, которое никогда не произойдёт
function throwError(msg: string): never {
  throw new Error(msg);
}

// object — любой не-примитивный тип
const obj: object = { name: "Alice" };
// obj.name; // ❌ Property 'name' does not exist on type 'object'
```

---

## Аннотации типов

### Переменные

Обычно TypeScript выводит тип автоматически (type inference):

```ts
const name = "Alice";     // TS знает, что это string
let age = 25;             // TS знает, что это number
const items = [1, 2, 3];  // TS знает, что это number[]
```

Аннотация нужна, когда тип неочевиден:

```ts
let value: string | number; // union type
value = "hello";
value = 42;
// value = true; // ❌

// Массив смешанных типов
const mixed: (string | number)[] = [1, "hello", 2, "world"];
```

### Параметры функций

```ts
function greet(name: string, times: number = 1): string {
  return `Hello, ${name}!`.repeat(times);
}

// Опциональные параметры (с ?)
function createUser(name: string, age?: number): object {
  return { name, age };
}

createUser("Alice");       // ✅
createUser("Alice", 25);   // ✅
// createUser();           // ❌ Expected 1-2 arguments
```

### Возвращаемые значения

```ts
// Явная аннотация возвращаемого типа
function add(a: number, b: number): number {
  return a + b;
}

// Обычно TS выводит тип автоматически, но явная аннотация полезна:
// - Для публичных API (функция — контракт)
// - Когда возврат неочевиден
// - Для предотвращения случайных изменений
```

### Объекты

```ts
const user: { name: string; age: number; email?: string } = {
  name: "Alice",
  age: 25,
  // email опционален, можно не указывать
};
```

Но лучше выносить в type или interface (см. ниже).

---

## Interface и Type

### Interface

```ts
interface User {
  name: string;
  age: number;
  email?: string; // опциональное свойство
  readonly id: number; // нельзя изменить после создания
}

const user: User = {
  name: "Alice",
  age: 25,
  id: 1,
};

// user.id = 2; // ❌ Cannot assign to 'id' because it is a read-only property

// Расширение интерфейса (inheritance)
interface Admin extends User {
  permissions: string[];
}

const admin: Admin = {
  name: "Bob",
  age: 30,
  id: 2,
  permissions: ["read", "write"],
};
```

### Type Alias

```ts
type User = {
  name: string;
  age: number;
  email?: string;
};

// Type alias может описывать не только объекты
type ID = string | number;           // union type
type Pair = [string, number];        // tuple
type Callback = (data: string) => void; // функция
type StringOrArray = string | string[];
```

### Interface vs Type: когда что использовать

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

**Общее правило:**
- Для объектов — используйте `interface` (лучше для расширяемости и ошибок)
- Для union, tuple, примитивов — используйте `type`

```ts
// Interface — для объектов
interface User {
  name: string;
  age: number;
}

// Type — для union
type Status = "active" | "inactive" | "banned";

// Type — для tuple
type Coordinate = [number, number];

// Type — для примитива
type ID = string | number;
```

### Declaration Merging (уникальная возможность interface)

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

// TypeScript объединит оба объявления
const user: User = {
  name: "Alice",
  age: 25,
};
```

Это полезно для расширения типов из сторонних библиотек.

---

## Union Types и Type Narrowing

### Union Types

Union type означает, что значение может быть одним из нескольких типов:

```ts
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello"; // ✅
value = 42;      // ✅
// value = true; // ❌

// Функция, принимающая union
function formatId(id: string | number): string {
  return `ID: ${id}`;
}
```

### Type Narrowing

TypeScript «сужает» тип, когда видит проверку:

```ts
function process(value: string | number) {
  // value может быть string или number
  
  if (typeof value === "string") {
    // Здесь TS знает, что value — string
    console.log(value.toUpperCase());
  } else {
    // Здесь TS знает, что value — number
    console.log(value.toFixed(2));
  }
}
```

### Type Guards

**typeof (для примитивов):**
```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(value: string | number) {
  if (isString(value)) {
    // TS знает, что value — string
    console.log(value.length);
  }
}
```

**in (для объектов):**
```ts
interface Fish { swim(): void }
interface Bird { fly(): void }

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim(); // TS знает, что это Fish
  } else {
    animal.fly();  // TS знает, что это Bird
  }
}
```

**instanceof (для классов):**
```ts
class Dog { bark() {} }
class Cat { meow() {} }

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}
```

### Discriminated Unions

```ts
interface SuccessResponse {
  status: "success";
  data: string;
}

interface ErrorResponse {
  status: "error";
  error: string;
}

type Response = SuccessResponse | ErrorResponse;

function handleResponse(response: Response) {
  switch (response.status) {
    case "success":
      console.log(response.data);  // TS знает, что есть data
      break;
    case "error":
      console.log(response.error); // TS знает, что есть error
      break;
  }
}
```

---

## Функции

### Типы параметров и возвращаемого значения

```ts
// Базовая аннотация
function add(a: number, b: number): number {
  return a + b;
}

// Стрелочная функция
const multiply = (a: number, b: number): number => a * b;

// Опциональные параметры
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

// Параметры по умолчанию
function createUser(name: string, role: string = "user"): User {
  return { name, role };
}

// Rest-параметры
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
```

### Function Types

```ts
// Тип функции
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;

// Функция как параметр
function applyOperation(a: number, b: number, operation: MathOperation): number {
  return operation(a, b);
}

applyOperation(5, 3, add);      // 8
applyOperation(5, 3, subtract); // 2
```

### Overloads (перегрузка)

```ts
// Функция может принимать разные типы и возвращать разные типы
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  if (typeof input === "string") {
    return parseInt(input, 10);
  }
  return input.toString();
}

const num = parse("42");    // number
const str = parse(42);      // string
```

---

## Generics — базовое понимание

Generics позволяют создавать «шаблоны» типов, которые работают с разными типами, сохраняя при этом информацию о типе.

### Проблема без generics

```ts
// Без generics — теряем информацию о типе
function firstElement(arr: any[]): any {
  return arr[0];
}

const result = firstElement([1, 2, 3]); // any — TS не знает, что это number
result.toFixed(); // TS не ругается, но это опасно
```

### Решение с generics

```ts
// С generics — сохраняем информацию о типе
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = firstElement([1, 2, 3]);       // number | undefined
const str = firstElement(["a", "b", "c"]); // string | undefined

num?.toFixed(); // ✅ TS знает, что это number
str?.toUpperCase(); // ✅ TS знает, что это string
```

### Generic интерфейсы

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  name: string;
  age: number;
}

// Используем generic с конкретным типом
const userResponse: ApiResponse<User> = {
  data: { name: "Alice", age: 25 },
  status: 200,
  message: "OK",
};

const usersResponse: ApiResponse<User[]> = {
  data: [{ name: "Alice", age: 25 }],
  status: 200,
  message: "OK",
};
```

### Generic функции

```ts
function identity<T>(value: T): T {
  return value;
}

const num = identity(42);         // number
const str = identity("hello");    // string
const arr = identity([1, 2, 3]);  // number[]

// Несколько generic-параметров
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

const p = pair("age", 25); // [string, number]
```

### Constraints (ограничения)

```ts
// T должен иметь свойство length
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength("hello");     // ✅ string имеет length
logLength([1, 2, 3]);   // ✅ array имеет length
// logLength(42);       // ❌ number не имеет length
```

---

## Классы

### Базовый класс

```ts
class User {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const user = new User("Alice", 25);
console.log(user.greet()); // "Hello, I'm Alice"
```

### Модификаторы доступа

```ts
class Animal {
  public name: string;       // доступен везде (по умолчанию)
  protected species: string; // доступен в классе и наследниках
  private age: number;       // доступен только в классе
  
  constructor(name: string, species: string, age: number) {
    this.name = name;
    this.species = species;
    this.age = age;
  }
  
  public getInfo(): string {
    return `${this.name} (${this.species}), ${this.age} years`;
    // Все поля доступны внутри класса
  }
}

const animal = new Animal("Rex", "Dog", 5);
console.log(animal.name);     // ✅ public
// console.log(animal.species); // ❌ protected
// console.log(animal.age);     // ❌ private
```

### Наследование

```ts
class Base {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  greet(): string {
    return `Hello, ${this.name}`;
  }
}

class Derived extends Base {
  role: string;
  
  constructor(name: string, role: string) {
    super(name); // вызов конструктора родителя
    this.role = role;
  }
  
  greet(): string {
    return `${super.greet()}! I'm a ${this.role}`;
  }
}

const dev = new Derived("Alice", "developer");
console.log(dev.greet()); // "Hello, Alice! I'm a developer"
```

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

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }
  
  area(): number {
    return this.width * this.height;
  }
}

// const shape = new Shape(); // ❌ Нельзя создать экземпляр абстрактного класса
const circle = new Circle(5);
console.log(circle.describe()); // "Area: 78.54..."
```

---

## tsconfig.json

`tsconfig.json` — конфигурационный файл TypeScript. Он говорит компилятору, как обрабатывать ваш код.

### Минимальная конфигурация

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

### Самые важные опции

**`target`** — в какую версию JavaScript компилировать:
```json
{
  "compilerOptions": {
    "target": "ES2020"  // ES2015, ES2016, ..., ES2020, ESNext
  }
}
```

**`module`** — система модулей:
```json
{
  "compilerOptions": {
    "module": "ESNext"  // CommonJS, AMD, ESNext, ES2020, NodeNext
  }
}
```

**`strict`** — включить все строгие проверки (ВСЕГДА включайте!):
```json
{
  "compilerOptions": {
    "strict": true
    // Включает:
    // strictNullChecks — null и undefined проверяются явно
    // noImplicitAny — запрещает неявный any
    // strictFunctionTypes — строгая проверка типов функций
    // и другие
  }
}
```

**`strictNullChecks`** — одна из самых важных опций:
```ts
// Без strictNullChecks (или strict: false)
let name: string = null; // ✅ TS не ругается — опасно!

// С strictNullChecks (или strict: true)
let name: string = null; // ❌ Type 'null' is not assignable to type 'string'
let name: string | null = null; // ✅ Явно указываем, что может быть null
```

**`esModuleInterop`** — совместимость с CommonJS модулями:
```json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```
```ts
// С esModuleInterop: true
import React from "react";       // ✅ работает
import fs from "fs";             // ✅ работает

// Без esModuleInterop
import * as React from "react";  // нужно писать так
import * as fs from "fs";
```

**`paths`** — алиасы для импортов:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```
```ts
// Вместо
import Button from "../../../components/Button";

// Можно писать
import Button from "@components/Button";
```

---

## Компиляция TypeScript

### Как работает компиляция

TypeScript — это **transpiler**, а не компилятор в традиционном смысле. Он преобразует TypeScript-код в JavaScript-код, удаляя все аннотации типов.

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

**Важно:** TypeScript-типы существуют **только** на этапе компиляции. В runtime их нет.

```ts
interface User {
  name: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}`;
}
```

После компиляции:
```js
function greet(user) {
  return `Hello, ${user.name}`;
}
// interface полностью удалена!
```

### Transpile vs Type Check

**Transpile** — преобразование TS в JS (удаление типов):
```bash
tsc file.ts          # компиляция одного файла
tsc --project .      # компиляция проекта по tsconfig.json
```

**Type Check** — проверка типов без генерации JS:
```bash
tsc --noEmit         # только проверка типов, без вывода файлов
```

В современных сборщиках (Vite, esbuild, swc) transpile и type check разделены:
- **Сборщик** (Vite/esbuild) — быстро transpile'ит TS в JS (без проверки типов)
- **TypeScript Compiler** — проверяет типы отдельно (`tsc --noEmit`)

### Source Maps

Source maps позволяют отлаживать TypeScript-код в браузере, хотя на самом деле выполняется JavaScript.

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "declarationMap": true
  }
}
```

---

## Ключевые тезисы для интервью

- TypeScript — надмножество JavaScript с системой типов; любой валидный JS — валидный TS.
- Базовые типы: number, string, boolean, null, undefined, symbol, bigint, array, tuple, enum, any, unknown, void, never.
- `interface` — для объектов (поддерживает declaration merging, extends); `type` — для union, tuple, примитивов.
- Union types (`string | number`) позволяют значение одного из нескольких типов; type narrowing сужает тип после проверки.
- Generics — «шаблоны» типов, сохраняющие информацию о типе при работе с разными данными.
- `strict: true` в tsconfig.json — всегда включайте; `strictNullChecks` — самая важная проверка.
- TypeScript-типы существуют только на этапе компиляции; в runtime их нет.
- Современные сборщики (Vite, esbuild) transpile'ят TS быстро, но без проверки типов; type check выполняется отдельно (`tsc --noEmit`).
- `any` отключает проверку типов — избегайте; `unknown` — безопасная альтернатива, требующая проверки типа.
- Structural typing: TS проверяет не имя типа, а структуру. Если у объекта есть нужные свойства — он подходит (duck typing).

---

## Заключение

TypeScript добавляет статическую типизацию поверх JavaScript, помогая ловить ошибки на этапе написания кода, улучшать автодополнение в IDE и документировать код через типы. В этой статье мы разобрали основы: базовые типы, интерфейсы, type alias, union types, generics, классы и конфигурацию.

Следующие статьи раздела углубятся в продвинутые темы: utility types, type guards, декораторы, generics в деталях, infer, хуки и асинхронность в TypeScript. Но всё это строится на фундаменте, который мы заложили здесь.

Начните использовать TypeScript в своём проекте — добавьте `tsconfig.json` с `strict: true` и постепенно аннотируйте типы. Практика — лучший способ освоить TypeScript.

---

## Полезные ссылки

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — официальная документация
- [TypeScript Playground](https://www.typescriptlang.org/play) — интерактивная песочница для экспериментов
- [Type Challenges](https://github.com/type-challenges/type-challenges) — задачи по TypeScript для практики
- [Total TypeScript](https://www.totaltypescript.com/) — курсы и туториалы от Matt Pocock
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) — бесплатная книга
