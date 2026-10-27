import type { Task } from "../types";

const article = {
  href: "/javascript/js-this/",
  label: "this и контекст вызова",
};

export const thisTasks: Task[] = [
  {
    id: "this-method-call",
    topic: "this",
    title: "Вызов метода объекта",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const user = {
  name: 'Alice',
  getName() {
    return this.name;
  },
};

console.log(user.getName());`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`'getName'`"],
    answer: 0,
    explanation:
      "При вызове `user.getName()` `this` указывает на объект перед точкой, то есть на `user`. Поэтому возвращается `'Alice'`.",
    article,
    tags: ["method", "context"],
  },
  {
    id: "this-detached-method",
    topic: "this",
    title: "Потеря контекста",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что произойдёт? Код выполняется в strict mode.",
    code: `'use strict';

const user = {
  name: 'Alice',
  getName() {
    return this.name;
  },
};

const fn = user.getName;
console.log(fn());`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 2,
    explanation:
      "После `const fn = user.getName` связь с объектом теряется. В strict mode обычный вызов функции получает `this === undefined`, поэтому обращение `this.name` падает с `TypeError`.",
    article,
    tags: ["detached-method", "strict-mode"],
  },
  {
    id: "this-arrow-in-object",
    topic: "this",
    title: "Стрелка как метод объекта",
    difficulty: "middle",
    kind: "choice",
    prompt:
      "Код выполняется как ES-модуль (strict mode). Что произойдёт?",
    code: `const user = {
  name: 'Alice',
  getName: () => this.name,
};

console.log(user.getName());`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`'getName'`"],
    answer: 2,
    explanation:
      "Стрелка не создаёт собственный `this`, а берёт его из внешнего scope. На верхнем уровне модуля `this` равен `undefined`, поэтому `this.name` выбрасывает `TypeError`.",
    article,
    tags: ["arrow-function", "lexical-this", "module"],
  },
  {
    id: "this-bind",
    topic: "this",
    title: "bind",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function getName() {
  return this.name;
}

const bound = getName.bind({ name: 'Alice' });
console.log(bound());`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`'getName'`"],
    answer: 0,
    explanation:
      "`bind` создаёт новую функцию с жёстко зафиксированным `this`. При вызове `bound()` контекст уже не зависит от места вызова.",
    article,
    tags: ["bind", "context"],
  },
  {
    id: "this-call",
    topic: "this",
    title: "call с аргументами",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function sum(a, b) {
  return this.base + a + b;
}

console.log(sum.call({ base: 10 }, 2, 3));`,
    options: ["`5`", "`15`", "`NaN`", "`TypeError`"],
    answer: 1,
    explanation:
      "`call` первым аргументом задаёт `this`, а остальные передаёт как аргументы функции. Получается `10 + 2 + 3 = 15`.",
    article,
    tags: ["call", "apply"],
  },
  {
    id: "this-new",
    topic: "this",
    title: "this в конструкторе",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User(name) {
  this.name = name;
}

const user = new User('Alice');
console.log(user.name);`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "При вызове через `new` создаётся новый объект, он становится `this` внутри конструктора и неявно возвращается из функции.",
    article,
    tags: ["new", "constructor"],
  },
  {
    id: "this-detached-class-method",
    topic: "this",
    title: "Отделённый метод класса",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `class User {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

const user = new User('Alice');
const fn = user.getName;
console.log(fn());`,
    options: ["`'Alice'`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 2,
    explanation:
      "Методы классов всегда работают в strict mode, а `this` определяется способом вызова. После отделения метода `this` равен `undefined`, поэтому чтение `this.name` даёт `TypeError`.",
    article,
    tags: ["class", "detached-method"],
  },
  {
    id: "this-nested-object",
    topic: "this",
    title: "Вложенный объект",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const obj = {
  x: 1,
  inner: {
    x: 2,
    getX() {
      return this.x;
    },
  },
};

console.log(obj.inner.getX());`,
    options: ["`1`", "`2`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "`this` определяется объектом непосредственно перед точкой — здесь это `obj.inner`, у которого `x` равно `2`. Родительский `obj` в цепочку `this` не входит.",
    article,
    tags: ["nested", "context"],
  },
  {
    id: "this-constructor-returns-object",
    topic: "this",
    title: "Конструктор возвращает объект",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function User(name) {
  this.name = name;
  return { name: 'Guest' };
}

const user = new User('Alice');
console.log(user.name);`,
    options: ["`'Alice'`", "`'Guest'`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "Если конструктор явно возвращает объект, именно он становится результатом `new`, а созданный `this` отбрасывается. Если вернуть примитив, он будет проигнорирован и вернётся `this`.",
    article,
    tags: ["constructor", "new", "return"],
  },
  {
    id: "this-bind-twice",
    topic: "this",
    title: "Двойной bind",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function getX() {
  return this.x;
}

const fn = getX.bind({ x: 1 }).bind({ x: 2 });
console.log(fn());`,
    options: ["`1`", "`2`", "`undefined`", "`TypeError`"],
    answer: 0,
    explanation:
      "Контекст, заданный первым `bind`, зафиксирован навсегда. Повторный `bind` не может его переопределить, поэтому возвращается `1`.",
    article,
    tags: ["bind", "hard-binding"],
  },
  {
    id: "this-arrow-in-constructor",
    topic: "this",
    title: "Стрелка в конструкторе",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function Counter() {
  this.count = 0;
  this.inc = () => {
    this.count++;
  };
}

const counter = new Counter();
const inc = counter.inc;
inc();
console.log(counter.count);`,
    options: ["`0`", "`1`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "Стрелка в конструкторе замыкает `this` создаваемого объекта. Даже после отделения функции от `counter` вызов `inc()` увеличивает именно его `count`.",
    article,
    tags: ["arrow-function", "constructor"],
  },
  {
    id: "this-class-field-arrow",
    topic: "this",
    title: "Стрелочное поле класса",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `class Counter {
  count = 0;
  inc = () => {
    this.count++;
  };
}

const counter = new Counter();
const inc = counter.inc;
inc();
console.log(counter.count);`,
    options: ["`0`", "`1`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "Поле-стрелка создаётся в конструкторе и замыкает `this` экземпляра. Поэтому отделённый `inc` продолжает работать с `counter` и увеличивает `count` до `1`.",
    article,
    tags: ["class-fields", "arrow-function"],
  },
];
