---
title: "Декораторы в TypeScript"
section: typescript
description: "Декораторы — механизм метапрограммирования, позволяющий модифицировать поведение классов и их элементов через аннотации. Они не добавляют новой функциональности — они оборачивают существующую, доба..."
order: 1
tags: ["декораторы", "typescript"]
questions:
  - "Какую проблему решают декораторы и что такое сквозная логика (AOP)"
  - "Когда вызываются декораторы: при определении класса или при создании экземпляра"
  - "Чем Legacy-декораторы отличаются от Stage 3 декораторов"
  - "Какие виды декораторов бывают в Legacy-спецификации"
  - "Как работает `context.metadata` в Stage 3 декораторах"
  - "Что такое auto-accessor и как он работает в Stage 3"
  - "Где декораторы используются в реальных фреймворках (NestJS, MobX)"
  - "Когда НЕ стоит использовать декораторы"
---

# Декораторы в TypeScript

Декораторы — механизм метапрограммирования, позволяющий модифицировать поведение классов и их элементов через аннотации. Они не добавляют новой функциональности — они оборачивают существующую, добавляя поведение на уровне определения.

Понимание декораторов помогает решать задачи сквозной логики — логирования, валидации, кэширования — без дублирования кода. В этой статье разберём две спецификации (Legacy и Stage 3), рассмотрим все виды декораторов и научимся применять их в реальных фреймворках.

## Содержание

1. [Архитектурная идея](#архитектурная-идея)
2. [Когда вызываются декораторы](#когда-вызываются-декораторы)
3. [Две спецификации: Legacy и Stage 3](#две-спецификации-legacy-и-stage-3)
4. [Legacy-декораторы (experimentalDecorators)](#legacy-декораторы-experimentaldecorators)
5. [Stage 3 Декораторы (TC39)](#stage-3-декораторы-tc39)
6. [Где используются декораторы](#где-используются-декораторы)
7. [Когда НЕ использовать декораторы](#когда-не-использовать-декораторы)
8. [Типичные ошибки](#типичные-ошибки)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## Архитектурная идея

Декораторы решают проблему **сквозной логики** (cross-cutting concerns). Логирование, валидация, кэширование, авторизация — это поведение, которое нужно во многих местах, но не является частью бизнес-логики.

Без декораторов вы дублируете эту логику:

```typescript
class UserService {
  async getUser(id: string) {
    console.log("getUser called with", id);
    const start = Date.now();
    try {
      const user = await db.users.findById(id);
      return user;
    } finally {
      console.log("getUser took", Date.now() - start, "ms");
    }
  }

  async updateUser(id: string, data: Partial<User>) {
    console.log("updateUser called with", id);
    const start = Date.now();
    try {
      await db.users.update(id, data);
    } finally {
      console.log("updateUser took", Date.now() - start, "ms");
    }
  }
}
```

С декораторами — определяете поведение один раз:

```typescript
class UserService {
  @log @measure
  async getUser(id: string) {
    return db.users.findById(id);
  }

  @log @measure
  async updateUser(id: string, data: Partial<User>) {
    await db.users.update(id, data);
  }
}
```

Это **Aspect-Oriented Programming** (AOP) — парадигма, в которой сквозная логика выделяется в отдельные модули и применяется к коду декларативно.

## Когда вызываются декораторы

Критически важно: декораторы выполняются **при определении класса** (когда модуль загружается), а не при создании экземпляра.

```typescript
function logClass(target: Function) {
  console.log("Декоратор вызван для:", target.name);
}

@logClass
class User {
  constructor(public name: string) {}
}

// При загрузке модуля выведет: "Декоратор вызван для: User"
// При new User() — НЕ выведет ничего
```

Это означает:
- Декораторы не имеют доступа к `this` экземпляра (его ещё не существует)
- Декораторы выполняются один раз за всё время жизни приложения
- Порядок применения — снизу вверх (от класса к методу)

## Две спецификации: Legacy и Stage 3

TypeScript поддерживает две версии декораторов, и это **не просто разные синтаксисы** — это принципиально разные API.

| | Legacy (`experimentalDecorators`) | Stage 3 (TC39 стандарт) |
|---|---|---|
| Сигнатура | `(target, key, descriptor)` | `(value, context)` |
| Поддержка TS | `experimentalDecorators: true` | По умолчанию (TS 5.0+) |
| Статус | Экспериментальная | Стандарт ECMAScript |
| Доступ к метаданным | Через `reflect-metadata` | Через `context.metadata` |
| `this` в декораторе | Не доступен | Через `context.access` |

Legacy-декораторы — это экспериментальная фича TypeScript, которая предшествовала стандарту. Stage 3 — финальная спецификация, принятая TC39.

## Legacy-декораторы (`experimentalDecorators`)

Для использования нужна настройка в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Декораторы классов

Получают конструктор класса. Могут модифицировать или заменить его:

```typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class User {
  constructor(public name: string) {}
}
```

Декоратор с параметрами — это функция, возвращающая декоратор:

```typescript
function singleton(scope: "global" | "request" = "global") {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    let instance: any;
    return class extends constructor {
      constructor(...args: any[]) {
        if (!instance) instance = new constructor(...args);
        return instance;
      }
    };
  };
}

@singleton("global")
class Database {
  constructor(public connectionString: string) {}
}
```

### Декораторы методов

Получают три аргумента:
- `target` — прототип класса (для `static` — сам класс)
- `key` — имя метода
- `descriptor` — дескриптор свойства, который можно модифицировать

```typescript
function log(
  target: any,
  key: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const original = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${key} with`, args);
    const result = original.apply(this, args);
    console.log(`${key} returned`, result);
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### Декораторы свойств

Получают `target` (прототип) и `key` (имя свойства). **Не получают дескриптор** — потому что свойство ещё не инициализировано на момент вызова декоратора. Могут только добавить метаданные или определить getter/setter:

```typescript
function readonly(target: any, key: string) {
  Object.defineProperty(target, key, {
    writable: false,
    configurable: false
  });
}

class Config {
  @readonly
  apiUrl = "https://api.example.com";
}
```

### Декораторы параметров

Не могут модифицировать значение — только добавлять метаданные:

```typescript
function logParam(target: any, key: string, index: number) {
  console.log(`Param ${index} in ${key}`);
}

class UserService {
  createUser(@logParam name: string, @logParam age: number) {
    // ...
  }
}
```

### Декораторы accessor (get/set)

Работают как декораторы методов — получают дескриптор:

```typescript
function uppercase(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.get!;
  descriptor.get = function () {
    const value = original.call(this);
    return typeof value === "string" ? value.toUpperCase() : value;
  };
  return descriptor;
}

class User {
  private _name = "john";

  @uppercase
  get name() { return this._name; }
}

new User().name; // "JOHN"
```

## Stage 3 Декораторы (TC39)

Новая спецификация, принятая как стандарт ECMAScript. TypeScript поддерживает её начиная с 5.0 без дополнительных флагов.

### Принципиально другой API

Вместо `(target, key, descriptor)` — `(value, context)`:

- `value` — декорируемый элемент (функция метода, класс, initializer)
- `context` — объект с информацией о контексте:
  - `context.kind` — тип элемента: `"class"`, `"method"`, `"getter"`, `"setter"`, `"field"`, `"accessor"`
  - `context.name` — имя элемента (строка, символ или вычисленное)
  - `context.access` — объект для доступа к элементу: `access.get(obj)`, `access.set(obj, value)`
  - `context.metadata` — хранилище метаданных (замена `reflect-metadata`)

### Декоратор метода

```typescript
function logged(value: Function, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    console.log(`Calling ${String(context.name)}`);
    return value.apply(this, args);
  };
}

class User {
  @logged
  greet() {
    return "Hello";
  }
}
```

### Декоратор класса

```typescript
function registered(value: typeof User, context: ClassDecoratorContext) {
  return class extends value {
    constructor(...args: any[]) {
      super(...args);
      console.log(`Instance of ${String(context.name)} created`);
    }
  };
}

@registered
class User {
  constructor(public name: string) {}
}
```

### Декоратор поля (field)

В Stage 3 декораторы полей работают через **initializer** — функцию, которая вызывается при инициализации поля:

```typescript
function observed(initialValue: any, context: ClassFieldDecoratorContext) {
  const { name } = context;
  
  return function (this: any) {
    const stored = initialValue;
    Object.defineProperty(this, name, {
      get() { return stored; },
      set(v: any) {
        console.log(`${String(name)} changed to`, v);
      }
    });
    return stored;
  };
}

class User {
  @observed
  name = "John";
}
```

### Автоматическая установка доступа (auto-accessor)

Stage 3 вводит новый синтаксис `accessor`, который автоматически создаёт getter/setter:

```typescript
function logged(value: { get(): any; set(v: any): void }, context: ClassAccessorDecoratorContext) {
  return {
    get(this: any) {
      console.log(`Reading ${String(context.name)}`);
      return value.get.call(this);
    },
    set(this: any, newValue: any) {
      console.log(`Setting ${String(context.name)} to`, newValue);
      value.set.call(this, newValue);
    }
  };
}

class User {
  @logged
  accessor name = "John";
}
```

### Метаданные без `reflect-metadata`

Stage 3 декораторы имеют встроенное хранилище метаданных:

```typescript
const ROUTES = Symbol("routes");

function Route(path: string) {
  return function (value: Function, context: ClassMethodDecoratorContext) {
    context.metadata[ROUTES] ??= [];
    context.metadata[ROUTES].push({ method: context.name, path });
  };
}

class UserController {
  @Route("/users")
  getAll() { return []; }

  @Route("/users/:id")
  getById() { return null; }
}
```

## Где используются декораторы

### NestJS — декораторы как основа фреймворка

NestJS построен на декораторах для DI, маршрутизации и валидации:

```typescript
@Controller("users")
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }
}

@Injectable()
class UserService {
  constructor(@Inject("USER_REPOSITORY") private repo: Repository<User>) {}
}

class CreateUserDto {
  @IsString() @MinLength(2) @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;
}
```

### MobX — реактивность через декораторы

```typescript
class UserStore {
  @observable users: User[] = [];
  @observable loading = false;

  @computed get activeUsers() {
    return this.users.filter(u => u.isActive);
  }

  @action addUser(user: User) {
    this.users.push(user);
  }
}
```

### Vue — class-based компоненты (legacy)

Vue 2 с `vue-property-decorator` и Vue 3 с `vue-facing-decorator`:

```typescript
@Component
class UserCard extends Vue {
  @Prop({ required: true }) userId!: number;

  @Watch("userId", { immediate: true })
  async onUserIdChange(id: number) {
    this.user = await fetchUser(id);
  }
}
```

## Когда НЕ использовать декораторы

1. **В функциональном коде.** React hooks, Vue composables — декораторы не нужны, если нет классов.

2. **Когда достаточно обычных функций или HOC.** Декораторы — это синтаксический сахар над обёртками. Если обёртка простая, декоратор избыточен.

3. **Если команда не знакома с паттерном.** Декораторы — продвинутая фича. Если команда не понимает, как они работают, — лучше использовать явные обёртки.

4. **В новом коде на Stage 3.** Если проект начинается сейчас, используйте Stage 3 декораторы, а не legacy. Legacy — только для поддержки существующих библиотек (NestJS, MobX).

## Типичные ошибки

### Забытый `experimentalDecorators`

```json
// tsconfig.json — без этого legacy-декораторы не работают
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### Путаница между legacy и Stage 3

```typescript
// Legacy — три аргумента
function legacy(target: any, key: string, descriptor: PropertyDescriptor) { }

// Stage 3 — два аргумента
function stage3(value: any, context: ClassMethodDecoratorContext) { }
```

### Декоратор свойства не может изменить значение напрямую

```typescript
// ❌ Не работает — свойство ещё не инициализировано
function init(target: any, key: string) {
  target[key] = "initial";
}

// ✅ Использовать getter/setter
function init(target: any, key: string) {
  let value: any;
  Object.defineProperty(target, key, {
    get() { return value ?? "default"; },
    set(v: any) { value = v; }
  });
}
```

### Отсутствие `reflect-metadata` для legacy

```typescript
// ❌ Reflect.defineMetadata не существует
Reflect.defineMetadata("key", "value", target);

// ✅ Импортировать polyfill
import "reflect-metadata";
Reflect.defineMetadata("key", "value", target);
```

## Ключевые тезисы для интервью

- Декораторы — механизм метапрограммирования для сквозной логики (AOP): логирование, валидация, кэширование.
- Декораторы выполняются при определении класса (загрузке модуля), а не при создании экземпляра.
- TypeScript поддерживает две спецификации: Legacy (`experimentalDecorators`) и Stage 3 (TC39 стандарт).
- Legacy-декораторы получают `(target, key, descriptor)`, Stage 3 — `(value, context)`.
- Legacy-декораторы бывают пяти видов: классы, методы, свойства, параметры, accessor.
- Stage 3 вводит `context.metadata` для хранения метаданных без `reflect-metadata`.
- Stage 3 добавляет синтаксис `accessor` для автоматического создания getter/setter.
- NestJS построен на декораторах: DI, маршрутизация, валидация — всё через аннотации.
- В новом коде предпочтительнее Stage 3 декораторы; Legacy — только для поддержки существующих библиотек.
- Декораторы не нужны в функциональном коде (React hooks, Vue composables) без классов.

## Заключение

Декораторы — мощный инструмент для разделения бизнес-логики и сквозной функциональности. Ключевое различие — между Legacy и Stage 3 спецификациями: это принципиально разные API, а не просто синтаксис. Для новых проектов выбирайте Stage 3, для поддержки NestJS и MobX — Legacy. Декораторы не заменяют обычные функции и HOC — применяйте их осознанно, когда паттерн действительно уместен.

## Полезные ссылки

- [Decorators — TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [NestJS Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [MobX Decorators](https://mobx.js.org/understanding.html#decorators)
