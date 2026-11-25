---
title: "Прототипы и классы"
section: javascript
description: "Откуда у объекта берётся метод, которого в нём нет, как new и class устроены под капотом и почему instanceof иногда врёт после замены прототипа."
order: 8
tags: ["prototype-chain", "object-create", "class", "extends", "instanceof", "private-fields"]
questions:
  - "Как поиск свойства проходит по цепочке прототипов и почему это делегирование, а не копирование"
  - "Что делает `new` по шагам и почему методы не дублируются в каждом экземпляре"
  - "Почему `hasOwnProperty` возвращает `false` для метода класса, хотя `user.greet()` работает"
  - "Почему у `Object.create(null)` нет `toString` и где это полезно"
  - "Как `extends` связывает не только экземпляры, но и сами классы, и что это даёт статическим методам"
  - "Почему `class` в JS — это синтаксис поверх прототипов, а не отдельная модель наследования, и что это меняет для привычек из Java/C++"
  - "Чем `#`-поля отличаются от соглашения с подчёркиванием"
answers:
  - "Свойство ищется в самом объекте, затем в `[[Prototype]]`, затем дальше до `null`. Это делегирование: объект не содержит метод, а обращается к прототипу за ним, поэтому изменение прототипа видно сразу."
  - "`new` создаёт объект, связывает его с `Constructor.prototype`, вызывает конструктор с этим `this` и возвращает объект. Методы лежат в прототипе, поэтому экземпляры не получают собственных копий."
  - "`hasOwnProperty` проверяет только собственные свойства, а метод лежит в `User.prototype`. Вызов `user.greet()` работает, потому что движок находит метод по цепочке."
  - "Такой объект не наследует `Object.prototype`, поэтому в нём нет `toString`, `hasOwnProperty` и других встроенных методов. Это удобно для словарей, где ключ `toString` не должен конфликтовать с чем-то встроенным."
  - "`extends` делает `Dog.prototype` наследником `Animal.prototype`, а `Object.getPrototypeOf(Dog)` указывает на `Animal`. Поэтому статические методы наследуются, а `super` в статике ведёт к родителю."
  - "Под капотом `class` по-прежнему работают функции-конструкторы, `prototype` и цепочка `[[Prototype]]`, поэтому наследование остаётся делегированием, а не копированием. Из-за этого привычки из Java/C++ переносить без оговорок нельзя."
  - "`#`-поля недоступны снаружи класса и не видны через `Reflect.ownKeys`, а подчёркивание — лишь договорённость, которую можно обойти. Приватность нужна там, где внешний код не должен ломать инвариант класса, например баланс счёта."
---

# Прототипы и классы

Ты вызываешь `user.greet()`, хотя в объекте `user` нет ни одного метода `greet`. Ищешь его в файле, а его там нет. Ответ лежит в прототипах: объект не содержит всё, что умеет, а делегирует поиск другому объекту. Понимание этого механизма отвечает на три частых вопроса: откуда берётся метод, что делает `new`, и почему `class` — это не новая модель наследования, а удобная обёртка над тем же механизмом. Эти вопросы регулярно задают на собеседованиях, и ответ обычно сводится к нескольким точным фразам.

## Содержание

1. [Что такое прототип](#что-такое-прототип)
2. [Цепочка прототипов](#цепочка-прототипов)
3. [Object.create, setPrototypeOf, getPrototypeOf](#objectcreate-setprototypeof-getprototypeof)
4. [Конструкторы и `prototype`](#конструкторы-и-prototype)
5. [Наследование без `class`](#наследование-без-class)
6. [Синтаксис `class`](#синтаксис-class)
7. [`extends` и `super`](#extends-и-super)
8. [Приватные поля и методы `#`](#приватные-поля-и-методы-)
9. [Статические методы и свойства](#статические-методы-и-свойства)
10. [`instanceof` и его ограничения](#instanceof-и-его-ограничения)
11. [Чем `class` в JS отличается от классов в Java/C++](#чем-class-в-js-отличается-от-классов-в-javac)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое прототип

У каждого объекта есть скрытая связь с другим объектом, которую спецификация называет `[[Prototype]]`. Когда ты читаешь свойство, движок сначала смотрит в сам объект. Если не нашёл, идёт в его прототип, потом в прототип прототипа, и так до `null`.

```js
const animal = {
  eats: true,
  walk() {
    console.log("I'm walking");
  },
};

const dog = {
  barks: true,
};

Object.setPrototypeOf(dog, animal);

console.log(dog.barks); // true — свойство самого объекта
console.log(dog.eats);  // true — найдено в прототипе
dog.walk();             // "I'm walking" — найдено в прототипе
```

Важно понимать, что `dog` ничего не копирует из `animal`. Он **делегирует** поиск. Поэтому если добавить метод в `animal` позже, `dog` увидит его сразу. Если свойство не найдено ни в одном звене цепочки, результатом будет `undefined`.

---

## Цепочка прототипов

Цепочка прототипов — это последовательность связанных объектов, которая заканчивается `null`:

```js
const obj = {};

console.log(obj.__proto__ === Object.prototype);  // true
console.log(Object.prototype.__proto__);          // null
```

Поэтому у любого обычного объекта есть `toString`, `hasOwnProperty` и другие методы: они лежат в `Object.prototype`, который находится в конце цепочки.

`__proto__` — геттер и сеттер для `[[Prototype]]`, он встроен в язык, но считается устаревшим. В новом коде используй `Object.getPrototypeOf` и `Object.setPrototypeOf`.

Отсюда вытекает ещё одна практическая вещь. Добавление свойства в прототип после создания экземпляров работает сразу, потому что экземпляры ищут свойство в прототипе во время обращения, а не при создании:

```js
function User() {}

const user = new User();
User.prototype.role = 'admin';

console.log(user.role); // 'admin'
```

---

## Object.create, setPrototypeOf, getPrototypeOf

`Object.create(proto)` создаёт новый объект с заданным прототипом, без вызова конструкторов:

```js
const animal = { eats: true };
const rabbit = Object.create(animal);

console.log(rabbit.eats); // true
console.log(Object.getPrototypeOf(rabbit) === animal); // true
```

Такой объект удобен, когда нужно построить иерархию без функций-конструкторов или классов.

`Object.setPrototypeOf` меняет прототип уже существующего объекта. Это медленная операция: движки не могут оптимизировать объект, у которого прототип меняется на ходу. Поэтому лучше задавать прототип сразу при создании.

### Объект без прототипа

`Object.create(null)` создаёт объект, у которого вообще нет прототипа:

```js
const dict = Object.create(null);
dict.toString = 'не функция, а обычное значение';

console.log(dict.hasOwnProperty); // undefined
```

Такой объект полезен как словарь: ключи вроде `toString`, `constructor` или `hasOwnProperty` не конфликтуют с встроенными методами. А если вызвать метод, которого там нет, например `dict.toString()` без своего определения, получишь `TypeError`.

---

## Конструкторы и `prototype`

До появления `class` наследование строили на функциях-конструкторах и свойстве `prototype`:

```js
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function () {
  console.log(`Hello, ${this.name}`);
};

const alice = new Person('Alice');
alice.greet(); // "Hello, Alice"
```

Что делает `new Person('Alice')`, по шагам:

1. Создаётся пустой объект.
2. Его `[[Prototype]]` указывает на `Person.prototype`.
3. Функция `Person` вызывается с `this`, который указывает на новый объект.
4. Объект возвращается, если конструктор не вернул другой объект.

Шаг 4 стоит проверить внимательнее. Если конструктор возвращает примитив, он игнорируется, и результатом остаётся созданный `this`. Если вернуть объект, он заменит результат:

```js
function User() {
  this.name = 'Alice';
  return 42; // примитив игнорируется
}

console.log(new User().name); // 'Alice'
```

Из-за того, что методы лежат в `Person.prototype`, все экземпляры разделяют одну функцию, а не получают каждый свою копию. Это и есть экономия памяти, ради которой весь механизм задуман.

Стрелочная функция не годится в роли конструктора. У неё нет собственного `this` и внутреннего метода, позволяющего вызвать её через `new`:

```js
const User = (name) => {
  this.name = name;
};

new User('Alice'); // TypeError: User is not a constructor
```

### Ловушки с `prototype`

Заменить `prototype` целиком можно, но это ломает связи:

```js
function User() {}

User.prototype = { role: 'admin' };
const user = new User();

console.log(user.constructor === User); // false
```

Новый объект прототипа не содержит `constructor`, и поиск уходит к `Object.prototype`. Ещё хуже, если заменить `prototype` после создания экземпляров:

```js
function User() {}

const user = new User();
User.prototype = {};

console.log(user instanceof User); // false
```

`user` всё ещё указывает на старый объект прототипа, а `User.prototype` теперь новый, поэтому проверка не проходит.

Есть и обратная ситуация. Присваивание свойства экземпляру затеняет одноимённое свойство прототипа, но не меняет сам прототип:

```js
function User() {}
User.prototype.role = 'user';

const account = new User();
account.role = 'admin';

console.log(account.role, User.prototype.role); // 'admin' 'user'
```

---

## Наследование без `class`

Чтобы реализовать наследование вручную, нужно связать прототипы и вызвать родительский конструктор:

```js
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function () {
  console.log(`${this.name} makes a sound`);
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function () {
  console.log(`${this.name} barks`);
};

const rex = new Dog('Rex', 'Shepherd');
rex.speak(); // "Rex makes a sound"
rex.bark();  // "Rex barks"
```

Здесь три шага, и каждый нужен. `Animal.call(this, name)` инициализирует свойства родителя на новом объекте. `Object.create(Animal.prototype)` связывает прототипы, но не вызывает конструктор родителя, в отличие от `new Animal()`, который выполнил бы его код ещё раз и создал бы побочные эффекты. Восстановленный `constructor` нужен, чтобы `rex.constructor` указывал на `Dog`.

---

## Синтаксис `class`

`class` делает то же самое, но читается проще:

```js
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, ${this.name}`);
  }
}

const alice = new Person('Alice');
alice.greet(); // "Hello, Alice"

console.log(typeof Person); // "function"
console.log(alice.__proto__ === Person.prototype); // true
```

Методы класса попадают в `Person.prototype`, а не в каждый экземпляр. Поэтому проверка `alice.hasOwnProperty('greet')` даёт `false`, хотя метод вызывается. Тело класса выполняется в строгом режиме.

Есть и различие в поднятии. Функции-конструкторы, объявленные через `function`, поднимаются полностью. Классы остаются в TDZ до строки объявления:

```js
const dog = new Dog(); // ReferenceError
class Dog {}
```

---

## `extends` и `super`

`extends` связывает прототипы, а `super` вызывает код родителя:

```js
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    super.speak();
    console.log(`${this.name} barks`);
  }
}

const rex = new Dog('Rex', 'Shepherd');
rex.speak();
// "Rex makes a sound"
// "Rex barks"
```

В производном классе конструктор обязан вызвать `super()` до первого обращения к `this`: объект создаёт родитель, и без вызова `this` не существует. В непроизводном классе `this` создаётся автоматически.

---

## Приватные поля и методы `#`

Современный синтаксис позволяет объявлять приватные члены класса, которые недоступны снаружи:

```js
class BankAccount {
  #balance = 0;

  deposit(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
    this.#balance += amount;
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();
account.deposit(1000);
console.log(account.getBalance()); // 1000
console.log(account.#balance);     // SyntaxError: Private field must be declared
```

Зачем это нужно, если есть соглашение с подчёркиванием `_balance`? Подчёркивание только подсказывает, что поле не надо трогать. Его можно прочитать и изменить, и код может это сделать случайно. С `#` внешний код не может ни прочитать поле, ни увидеть его через `Reflect.ownKeys`. Баланс в примере нельзя изменить в обход проверок `withdraw` и `deposit`, и это ровно то, что нужно.

Приватные поля не наследуются напрямую: потомок не получает доступ к `#balance` родителя. Приватные методы объявляются так же:

```js
class User {
  #validateName(name) {
    return name.trim().length > 0;
  }

  constructor(name) {
    if (!this.#validateName(name)) throw new Error('Invalid name');
    this.name = name;
  }
}
```

---

## Статические методы и свойства

Статические члены принадлежат самому классу, а не экземплярам. Их используют для фабрик, утилит и констант:

```js
class User {
  static role = 'guest';

  static createAdmin(name) {
    const user = new User(name);
    user.role = 'admin';
    return user;
  }

  constructor(name) {
    this.name = name;
  }
}

console.log(User.role); // "guest"
const admin = User.createAdmin('Alice');
console.log(admin.role); // "admin"
```

В статическом методе `this` указывает на класс, через который его вызвали. Поэтому метод работает и для подклассов:

```js
class Animal {
  static isAnimal(obj) {
    return obj instanceof this;
  }
}

class Dog extends Animal {}

console.log(Dog.isAnimal(new Dog())); // true
```

---

## `instanceof` и его ограничения

`instanceof` проверяет, есть ли `Constructor.prototype` в цепочке прототипов объекта:

```js
class Animal {}
class Dog extends Animal {}

const rex = new Dog();

console.log(rex instanceof Dog);    // true
console.log(rex instanceof Animal); // true
console.log(rex instanceof Object); // true
```

Для `rex` движок проходит цепочку: `rex` → `Dog.prototype` (совпадение, ответ `true`). Для `instanceof Animal` цепочка продолжается до `Animal.prototype`. Проверяется не конкретная ссылка на `prototype` в свойстве объекта, а наличие этого объекта где-то в цепочке.

Из этого следуют ограничения:

1. **Не работает с примитивами.** `'hello' instanceof String` даёт `false`, потому что строка не объект. Для примитивов используй `typeof`.

2. **Зависит от текущей цепочки.** Если изменить прототип объекта через `Object.setPrototypeOf` или заменить `Constructor.prototype`, результат может стать `false`:

   ```js
   const arr = [];
   Object.setPrototypeOf(arr, null);
   console.log(arr instanceof Array); // false
   ```

3. **Не видит приватных полей.** `instanceof` говорит только о цепочке прототипов. Наличие `#`-полей он не проверяет.

4. **Ломается между окнами и iframe.** У каждого окна свой `Array`, и массив из одного окна не будет `instanceof` `Array` из другого. Поэтому для массивов лучше `Array.isArray`, а для общей проверки типа `Object.prototype.toString.call(value)`.

---

## Чем `class` в JS отличается от классов в Java/C++

| Аспект | JavaScript | Java/C++ |
|--------|------------|----------|
| Модель наследования | Прототипная: объект делегирует поиск прототипу | Классовая: поля и методы задаёт тип |
| Что такое класс | Функция-конструктор и объект `prototype` | Тип, известный на этапе компиляции |
| Методы | Лежат в `prototype`, общие для экземпляров | Обычно доступны через таблицу виртуальных вызовов |
| Множественное наследование | Нет, только одна цепочка прототипов | Java: один родитель-класс, интерфейсы. C++: несколько родителей |
| Приватность | `#`-поля в рантайме | Модификаторы доступа |
| Изменение структуры | Прототипы можно менять во время работы | Тип фиксирован |

Поэтому «класс» в JavaScript — это удобный синтаксис поверх прототипов. Под капотом по-прежнему работают функции, `prototype` и цепочка делегирования.

---

## Ключевые тезисы для интервью

- Поиск свойств делегируется по цепочке `[[Prototype]]` до `null`; методы класса лежат в `prototype` и не копируются в экземпляры.
- `new` создаёт объект, связывает его с `Constructor.prototype` и вызывает конструктор с этим `this`; примитив, который вернул конструктор, игнорируется.
- `extends` связывает и прототипы экземпляров, и сами конструкторы: `Object.getPrototypeOf(Dog) === Animal`, поэтому статические методы наследуются.
- Замена `prototype` целиком ломает `constructor` и `instanceof` для уже созданных экземпляров; добавление свойства в прототип после создания видно сразу.
- `instanceof` проверяет наличие `Constructor.prototype` в цепочке, поэтому не работает с примитивами и ломается между окнами; для массивов надёжнее `Array.isArray`.
- `#`-поля — настоящая приватность: доступны только внутри класса и не наследуются; `Object.create(null)` даёт объект без прототипа и без `toString`.

## Заключение

JavaScript использует прототипное наследование: объект делегирует поиск свойств своему прототипу, и так устроено всё, что выглядит как классы. `class` из ES6 упрощает запись, но не меняет модель: под капотом по-прежнему работают функции-конструкторы, `prototype` и цепочка. Если помнить, что `new` связывает объект с прототипом, что `instanceof` смотрит на цепочку, а не на имя класса, большинство вопросов про наследование и «странные» результаты `instanceof` решаются за минуту.

## Полезные ссылки

- [Inheritance and the prototype chain — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [Object.create — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [Classes — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [Private class features — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)
