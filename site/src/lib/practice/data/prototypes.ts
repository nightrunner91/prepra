import type { Task } from "../types";

const article = {
  href: "/javascript/js-prototypes-classes/",
  label: "Прототипы и классы",
};

export const prototypeTasks: Task[] = [
  {
    id: "prototypes-chain-lookup",
    topic: "prototypes",
    title: "Поиск метода в цепочке",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function Animal() {}

Animal.prototype.speak = function () {
  return '...';
};

const animal = new Animal();
console.log(animal.speak());`,
    options: ["`'...'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "У экземпляра нет собственного `speak`, поэтому движок идёт по цепочке прототипов к `Animal.prototype` и находит метод там.",
    article,
    tags: ["prototype-chain", "method"],
  },
  {
    id: "prototypes-instanceof",
    topic: "prototypes",
    title: "instanceof",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function Animal() {}
const animal = new Animal();

console.log(animal instanceof Animal);`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 0,
    explanation:
      "`instanceof` проверяет, есть ли `Animal.prototype` в цепочке прототипов объекта. При `new Animal()` прототип экземпляра как раз указывает на него.",
    article,
    tags: ["instanceof", "prototype-chain"],
  },
  {
    id: "prototypes-own-vs-inherited",
    topic: "prototypes",
    title: "Собственное или унаследованное",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function Animal() {}

Animal.prototype.speak = function () {
  return '...';
};

const animal = new Animal();
console.log(animal.hasOwnProperty('speak'));`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "`speak` находится в `Animal.prototype`, а не на самом объекте. `hasOwnProperty` проверяет только собственные свойства, поэтому возвращает `false`.",
    article,
    tags: ["has-own-property", "prototype"],
  },
  {
    id: "prototypes-object-create-null",
    topic: "prototypes",
    title: "Объект без прототипа",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `const obj = Object.create(null);
console.log(obj.toString());`,
    options: [
      "Выведет `'[object Object]'`",
      "Выведет `undefined`",
      "`TypeError`",
      "`ReferenceError`",
    ],
    answer: 2,
    explanation:
      "`Object.create(null)` создаёт объект без `Object.prototype`, поэтому у него нет метода `toString`. Вызов отсутствующего метода даёт `TypeError`.",
    article,
    tags: ["object-create", "null-prototype"],
  },
  {
    id: "prototypes-class-inheritance",
    topic: "prototypes",
    title: "Наследование классов",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `class Animal {
  speak() {
    return '...';
  }
}

class Dog extends Animal {}

console.log(new Dog().speak());`,
    options: ["`'...'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "`Dog.prototype` наследуется от `Animal.prototype`. Метод `speak` не найден на экземпляре и в `Dog.prototype`, но находится в `Animal.prototype`.",
    article,
    tags: ["class", "extends", "inheritance"],
  },
  {
    id: "prototypes-borrow-method",
    topic: "prototypes",
    title: "Заимствование метода",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const user = {
  name: 'Alice',
  getName() {
    return this.name;
  },
};

const other = { name: 'Bob' };

console.log(user.getName.call(other));`,
    options: ["`'Alice'`", "`'Bob'`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "Метод можно вызвать с другим `this` через `call`. Здесь `this` — объект `other`, поэтому возвращается `'Bob'`.",
    article,
    tags: ["call", "method-borrowing"],
  },
  {
    id: "prototypes-arrow-constructor",
    topic: "prototypes",
    title: "Стрелка и new",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `const User = (name) => {
  this.name = name;
};

const user = new User('Alice');`,
    options: [
      "Создастся объект `User`",
      "`TypeError: User is not a constructor`",
      "`ReferenceError`",
      "Вернётся `undefined`",
    ],
    answer: 1,
    explanation:
      "Стрелочные функции не имеют собственного `this` и внутреннего метода `[[Construct]]`, поэтому их нельзя вызывать через `new`.",
    article,
    tags: ["arrow-function", "new", "constructor"],
  },
  {
    id: "prototypes-class-method-own",
    topic: "prototypes",
    title: "Метод класса на прототипе",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `class User {
  getName() {
    return 'Alice';
  }
}

const user = new User();
console.log(Object.hasOwn(user, 'getName'));`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "Методы класса определены в `User.prototype`, а не копируются в каждый экземпляр. Поэтому собственного свойства `getName` у `user` нет.",
    article,
    tags: ["class", "prototype", "methods"],
  },
  {
    id: "prototypes-mutation-after-creation",
    topic: "prototypes",
    title: "Изменение прототипа после создания",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User() {}

const user = new User();
User.prototype.role = 'admin';

console.log(user.role);`,
    options: ["`'admin'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "Экземпляр хранит ссылку на объект прототипа, а не копию его свойств. Добавление `role` в прототип после создания сразу становится доступным.",
    article,
    tags: ["prototype", "mutation"],
  },
  {
    id: "prototypes-shadowing",
    topic: "prototypes",
    title: "Собственное свойство затеняет прототип",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User() {}

User.prototype.role = 'user';
const account = new User();
account.role = 'admin';

console.log(account.role, User.prototype.role);`,
    options: [
      "`'admin' 'admin'`",
      "`'admin' 'user'`",
      "`'user' 'user'`",
      "`undefined 'user'`",
    ],
    answer: 1,
    explanation:
      "Присваивание создаёт собственное свойство `role` на экземпляре, которое затеняет одноимённое свойство прототипа. Прототип при этом не меняется.",
    article,
    tags: ["shadowing", "prototype"],
  },
  {
    id: "prototypes-replaced-constructor",
    topic: "prototypes",
    title: "Замена prototype",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User() {}

User.prototype = { role: 'admin' };
const user = new User();

console.log(user.constructor === User);`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "При замене `prototype` целиком теряется свойство `constructor`. Новый объект прототипа наследует `constructor` от `Object`, поэтому сравнение с `User` даёт `false`.",
    article,
    tags: ["constructor", "prototype", "replacement"],
  },
  {
    id: "prototypes-static-chain",
    topic: "prototypes",
    title: "Цепочка самих классов",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `class Animal {}
class Dog extends Animal {}

console.log(Object.getPrototypeOf(Dog) === Animal);`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 0,
    explanation:
      "`extends` связывает не только прототипы экземпляров, но и сами конструкторы: `Object.getPrototypeOf(Dog)` указывает на `Animal`. Так работают статические методы и `super`.",
    article,
    tags: ["class", "static", "prototype-chain"],
  },
  {
    id: "prototypes-constructor-primitive-return",
    topic: "prototypes",
    title: "Конструктор возвращает примитив",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User() {
  this.name = 'Alice';
  return 42;
}

console.log(new User().name);`,
    options: ["`'Alice'`", "`42`", "`undefined`", "`TypeError`"],
    answer: 0,
    explanation:
      "Если конструктор возвращает примитив, он игнорируется, и результатом `new` остаётся созданный `this`. Объект, наоборот, заменил бы результат.",
    article,
    tags: ["constructor", "new", "return"],
  },
  {
    id: "prototypes-instanceof-after-replacement",
    topic: "prototypes",
    title: "instanceof после замены prototype",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User() {}

const user = new User();
User.prototype = {};

console.log(user instanceof User);`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "`user` сохранил ссылку на старый объект прототипа. После замены `User.prototype` на новый объект эта ссылка больше не входит в цепочку, поэтому `instanceof` даёт `false`.",
    article,
    tags: ["instanceof", "prototype", "replacement"],
  },
];
