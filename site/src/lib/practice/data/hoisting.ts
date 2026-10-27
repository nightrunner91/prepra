import type { Task } from "../types";

const article = {
  href: "/javascript/js-scope-hoisting/",
  label: "Hoisting и область видимости",
};

export const hoistingTasks: Task[] = [
  {
    id: "hoisting-var-before",
    topic: "hoisting",
    title: "var до объявления",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(value);
var value = 42;`,
    options: ["`42`", "`undefined`", "`ReferenceError`", "`null`"],
    answer: 1,
    explanation:
      "Объявление `var value` поднимается в начало области видимости и инициализируется `undefined`. Присваивание `42` выполняется только на своей строке, поэтому до неё в консоль попадает `undefined`.",
    article,
    tags: ["var", "undefined"],
  },
  {
    id: "hoisting-let-before",
    topic: "hoisting",
    title: "let до объявления",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что произойдёт при выполнении?",
    code: `console.log(value);
let value = 42;`,
    options: ["`42`", "`undefined`", "`ReferenceError`", "`TypeError`"],
    answer: 2,
    explanation:
      "`let` тоже поднимается, но до инициализации находится в Temporal Dead Zone. Обращение к переменной в TDZ выбрасывает `ReferenceError`, а не возвращает `undefined`.",
    article,
    tags: ["let", "tdz"],
  },
  {
    id: "hoisting-function-declaration",
    topic: "hoisting",
    title: "Function declaration до вызова",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(sum(2, 3));

function sum(a, b) {
  return a + b;
}`,
    options: ["`5`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "Function declaration поднимается целиком — и имя, и тело. Поэтому функцию можно вызывать до её текстового объявления.",
    article,
    tags: ["function-declaration"],
  },
  {
    id: "hoisting-function-expression-var",
    topic: "hoisting",
    title: "Function expression через var",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(sum(2, 3));

var sum = function (a, b) {
  return a + b;
};`,
    options: ["`5`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 2,
    explanation:
      "Поднимается только переменная `sum` со значением `undefined`. Вызов `sum(2, 3)` пытается вызвать `undefined` как функцию и получает `TypeError: sum is not a function`.",
    article,
    tags: ["function-expression", "var"],
  },
  {
    id: "hoisting-function-expression-const",
    topic: "hoisting",
    title: "Function expression через const",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `sayHi();

const sayHi = () => console.log('hi');`,
    options: ["Выведет `hi`", "`TypeError`", "`ReferenceError`", "`undefined`"],
    answer: 2,
    explanation:
      "`const` попадает в TDZ до инициализации. Вызов до строки с `const` даёт `ReferenceError`, а не `TypeError`.",
    article,
    tags: ["const", "tdz"],
  },
  {
    id: "hoisting-class-tdz",
    topic: "hoisting",
    title: "Класс до объявления",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `const user = new User();

class User {}`,
    options: [
      "Создастся пустой объект `User`",
      "`ReferenceError`",
      "`TypeError`",
      "Вернётся `undefined`",
    ],
    answer: 1,
    explanation:
      "Классы поднимаются, но остаются в TDZ до выполнения строки объявления. Обращение к `User` раньше времени выбрасывает `ReferenceError`.",
    article,
    tags: ["class", "tdz"],
  },
  {
    id: "hoisting-var-block",
    topic: "hoisting",
    title: "var внутри блока",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `var x = 1;
if (true) {
  var x = 2;
}
console.log(x);`,
    options: ["`1`", "`2`", "`undefined`", "`ReferenceError`"],
    answer: 1,
    explanation:
      "У `var` функциональная (или глобальная) область видимости: блок `if` не создаёт новую переменную. Внутри блока перезаписывается тот же самый `x`, поэтому выводится `2`.",
    article,
    tags: ["var", "block-scope"],
  },
  {
    id: "hoisting-let-block",
    topic: "hoisting",
    title: "let внутри блока",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `let x = 1;
if (true) {
  let x = 2;
}
console.log(x);`,
    options: ["`1`", "`2`", "`undefined`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "`let` имеет блочную область видимости. Внутри `if` создаётся отдельная переменная `x`, которая затеняет внешнюю, но не изменяет её. Снаружи остаётся `1`.",
    article,
    tags: ["let", "block-scope", "shadowing"],
  },
  {
    id: "hoisting-var-loop-timeout",
    topic: "hoisting",
    title: "var в цикле и setTimeout",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    options: ["`0 1 2`", "`3 3 3`", "`0 0 0`", "`undefined undefined undefined`"],
    answer: 1,
    explanation:
      "`var` создаёт одну переменную на всю область видимости. К моменту выполнения колбэков цикл уже завершился, и `i` равно `3`. Все три замыкания смотрят на одну и ту же переменную.",
    article,
    tags: ["var", "setTimeout", "closure"],
  },
  {
    id: "hoisting-let-loop-timeout",
    topic: "hoisting",
    title: "let в цикле и setTimeout",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    options: ["`0 1 2`", "`3 3 3`", "`0 0 0`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "`let` в заголовке `for` создаёт новую привязку на каждую итерацию. Каждый колбэк замыкает собственную `i`, поэтому вывод — `0 1 2`.",
    article,
    tags: ["let", "setTimeout", "closure"],
  },
  {
    id: "hoisting-typeof-tdz",
    topic: "hoisting",
    title: "typeof и TDZ",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(typeof value);
let value = 1;`,
    options: ["`'undefined'`", "`'number'`", "`ReferenceError`", "`TypeError`"],
    answer: 2,
    explanation:
      "`typeof` безопасен только для необъявленных переменных. Здесь `value` уже объявлена через `let`, но находится в TDZ, поэтому `typeof` тоже выбрасывает `ReferenceError`.",
    article,
    tags: ["typeof", "tdz"],
  },
  {
    id: "hoisting-block-function-strict",
    topic: "hoisting",
    title: "Функция внутри блока в strict mode",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `'use strict';

{
  function helper() {
    return 'ok';
  }
}

console.log(typeof helper);`,
    options: ["`'function'`", "`'undefined'`", "`ReferenceError`", "`'object'`"],
    answer: 1,
    explanation:
      "В strict mode function declaration внутри блока имеет блочную область видимости. Снаружи блока имя `helper` не объявлено, а `typeof` для необъявленного имени возвращает `'undefined'`.",
    article,
    tags: ["function-declaration", "strict-mode", "block-scope"],
  },
  {
    id: "hoisting-named-function-expression",
    topic: "hoisting",
    title: "Имя named function expression",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const fn = function inner() {
  return typeof inner;
};

console.log(fn());
console.log(typeof inner);`,
    options: [
      "`'function'` и `'function'`",
      "`'function'` и `'undefined'`",
      "`'undefined'` и `'undefined'`",
      "`ReferenceError` во второй строке",
    ],
    answer: 1,
    explanation:
      "Имя `inner` существует только в собственной области видимости функции. Внутри она возвращает `'function'`, а снаружи такого имени нет — `typeof` безопасно даёт `'undefined'`.",
    article,
    tags: ["function-expression", "scope"],
  },
  {
    id: "hoisting-duplicate-functions",
    topic: "hoisting",
    title: "Две function declaration с одним именем",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(pick());

function pick() {
  return 'first';
}

function pick() {
  return 'second';
}`,
    options: ["`first`", "`second`", "`undefined`", "`SyntaxError`"],
    answer: 1,
    explanation:
      "При создании лексического окружения обрабатываются все объявления. При одинаковых именах функций побеждает последнее объявление, поэтому вызывается версия, возвращающая `second`.",
    article,
    tags: ["function-declaration", "hoisting"],
  },
  {
    id: "hoisting-var-and-function",
    topic: "hoisting",
    title: "var и function с одинаковым именем",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(typeof foo);
var foo = 1;

function foo() {}`,
    options: ["`'undefined'`", "`'number'`", "`'function'`", "`SyntaxError`"],
    answer: 2,
    explanation:
      "На этапе создания окружения function declaration инициализирует `foo` функцией, а `var` не перетирает это значение. Поэтому до присваивания `foo = 1` тип — `'function'`.",
    article,
    tags: ["var", "function-declaration", "hoisting"],
  },
  {
    id: "hoisting-default-params-tdz",
    topic: "hoisting",
    title: "Параметры по умолчанию и TDZ",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что произойдёт при вызове?",
    code: `function greet(name = title, title = 'Mr.') {
  return name + ' ' + title;
}

greet();`,
    options: [
      "`'Mr. undefined'`",
      "`'undefined Mr.'`",
      "`ReferenceError`",
      "`TypeError`",
    ],
    answer: 2,
    explanation:
      "Параметры по умолчанию имеют собственный scope и вычисляются слева направо. Когда вычисляется `name = title`, параметр `title` ещё не инициализирован и находится в TDZ — получаем `ReferenceError`.",
    article,
    tags: ["default-parameters", "tdz"],
  },
];
