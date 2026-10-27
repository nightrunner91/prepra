import type { Task } from "../types";

const article = {
  href: "/javascript/js-closures/",
  label: "Замыкания",
};

export const closureTasks: Task[] = [
  {
    id: "closure-counter",
    topic: "closures",
    title: "Счётчик на замыкании",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function makeCounter() {
  let count = 0;
  return () => ++count;
}

const counter = makeCounter();
counter();
counter();
console.log(counter());`,
    options: ["`1`", "`2`", "`3`", "`ReferenceError`"],
    answer: 2,
    explanation:
      "Возвращённая функция замыкает переменную `count`. Она живёт между вызовами, поэтому три вызова увеличивают значение до `3`.",
    article,
    tags: ["counter", "lexical-environment"],
  },
  {
    id: "closure-independent-counters",
    topic: "closures",
    title: "Два независимых счётчика",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function makeCounter() {
  let count = 0;
  return () => ++count;
}

const a = makeCounter();
const b = makeCounter();

console.log(a(), a(), b());`,
    options: ["`3 3 3`", "`2 1 1`", "`3 3 2`", "`1 2 1`"],
    answer: 3,
    explanation:
      "Каждый вызов `makeCounter()` создаёт новое лексическое окружение со своей `count`. Поэтому `a()` последовательно вернёт `1` и `2`, а `b()` начинает с нуля и возвращает `1`.",
    article,
    tags: ["counter", "scope"],
  },
  {
    id: "closure-var-loop-fixed",
    topic: "closures",
    title: "IIFE вместо var в цикле",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j), 0);
  })(i);
}`,
    options: ["`3 3 3`", "`0 1 2`", "`0 0 0`", "`undefined` три раза"],
    answer: 1,
    explanation:
      "IIFE создаёт новое лексическое окружение на каждой итерации и получает текущее значение `i` как параметр `j`. Колбэк замыкает уже собственную `j`, поэтому вывод — `0 1 2`.",
    article,
    tags: ["iife", "var", "setTimeout"],
  },
  {
    id: "closure-stale-value",
    topic: "closures",
    title: "Замыкание и переприсваивание",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function createLogger() {
  let message = 'first';
  const log = () => console.log(message);
  message = 'second';
  return log;
}

createLogger()();`,
    options: ["`first`", "`second`", "`undefined`", "`ReferenceError`"],
    answer: 1,
    explanation:
      "Замыкание захватывает не значение переменной, а саму переменную (binding). К моменту вызова `message` уже перезаписана на `'second'`.",
    article,
    tags: ["binding", "stale-closure"],
  },
  {
    id: "closure-shared-state",
    topic: "closures",
    title: "Общее состояние двух методов",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function create() {
  let value = 0;
  return {
    increment() {
      value++;
    },
    get() {
      return value;
    },
  };
}

const counter = create();
counter.increment();
counter.increment();
console.log(counter.get());`,
    options: ["`0`", "`1`", "`2`", "`undefined`"],
    answer: 2,
    explanation:
      "Оба метода замкнуты на одну и ту же переменную `value` из вызова `create()`. Два инкремента дают `2`.",
    article,
    tags: ["module-pattern", "shared-state"],
  },
  {
    id: "closure-private-variable",
    topic: "closures",
    title: "Приватная переменная",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function create() {
  let secret = 'hidden';
  return { getSecret: () => secret };
}

const obj = create();
console.log(obj.secret);`,
    options: ["`'hidden'`", "`undefined`", "`ReferenceError`", "`TypeError`"],
    answer: 1,
    explanation:
      "`secret` — локальная переменная функции, а не свойство возвращённого объекта. Обращение к `obj.secret` даёт `undefined`; значение доступно только через замыкание `getSecret`.",
    article,
    tags: ["encapsulation", "private"],
  },
  {
    id: "closure-accumulator",
    topic: "closures",
    title: "Аккумулятор",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function createAccumulator() {
  let total = 0;
  return function add(n) {
    total += n;
    return total;
  };
}

const add = createAccumulator();
add(5);
add(10);
console.log(add(1));`,
    options: ["`1`", "`15`", "`16`", "`11`"],
    answer: 2,
    explanation:
      "`total` сохраняется в замыкании между вызовами: `0 + 5 = 5`, затем `5 + 10 = 15`, затем `15 + 1 = 16`.",
    article,
    tags: ["state", "accumulator"],
  },
  {
    id: "closure-once",
    topic: "closures",
    title: "Функция once",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function once(fn) {
  let called = false;
  let result;

  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

const init = once((x) => x * 2);
console.log(init(2), init(10));`,
    options: ["`4 20`", "`4 4`", "`2 10`", "`undefined undefined`"],
    answer: 1,
    explanation:
      "`once` запоминает результат первого вызова в замыкании. Второй вызов не выполняет исходную функцию и возвращает сохранённые `4`.",
    article,
    tags: ["once", "cache"],
  },
  {
    id: "closure-memoization",
    topic: "closures",
    title: "Мемоизация",
    difficulty: "middle",
    kind: "choice",
    prompt: "Сколько раз выполнится исходная функция?",
    code: `function memo(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}

let calls = 0;
const square = memo((x) => {
  calls++;
  return x * x;
});

square(3);
square(3);
square(4);
console.log(calls);`,
    options: ["`1`", "`2`", "`3`", "`4`"],
    answer: 1,
    explanation:
      "Кэш хранится в замыкании. Для `3` функция выполнится один раз, для `4` — ещё один. Повторный `square(3)` берёт значение из `Map`, итого `2` вызова.",
    article,
    tags: ["memoization", "map"],
  },
  {
    id: "closure-currying",
    topic: "closures",
    title: "Каррирование",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const add = (a) => (b) => (c) => a + b + c;

console.log(add(1)(2)(3));`,
    options: ["`6`", "`123`", "`TypeError`", "`undefined`"],
    answer: 0,
    explanation:
      "Каждая стрелочная функция замыкает предыдущий аргумент. В итоге выполняется `1 + 2 + 3`, то есть `6`.",
    article,
    tags: ["currying", "closure"],
  },
  {
    id: "closure-reassignment",
    topic: "closures",
    title: "Замыкание видит новое значение",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `let value = 1;
const read = () => value;
value = 2;

console.log(read());`,
    options: ["`1`", "`2`", "`undefined`", "`ReferenceError`"],
    answer: 1,
    explanation:
      "Стрелка `read` захватывает переменную `value`, а не её копию. После переприсваивания вызов возвращает актуальное значение `2`.",
    article,
    tags: ["binding", "reference"],
  },
  {
    id: "closure-arrow-this",
    topic: "closures",
    title: "Стрелка внутри метода",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const obj = {
  value: 10,
  getValue() {
    return () => this.value;
  },
};

const fn = obj.getValue();
console.log(fn());`,
    options: ["`10`", "`undefined`", "`TypeError`", "`ReferenceError`"],
    answer: 0,
    explanation:
      "Стрелочная функция не создаёт собственный `this`, а берёт его из `getValue`. При вызове `obj.getValue()` это `obj`, поэтому `fn()` возвращает `10` даже после потери контекста.",
    article,
    tags: ["arrow-function", "this"],
  },
  {
    id: "closure-not-global",
    topic: "closures",
    title: "Жизнь после возврата функции",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function outer() {
  let count = 0;
  return () => ++count;
}

const inc = outer();

console.log(typeof count);
console.log(inc());`,
    options: [
      "`'number'` и `1`",
      "`'undefined'` и `1`",
      "`ReferenceError` в первой строке",
      "`undefined` и `undefined`",
    ],
    answer: 1,
    explanation:
      "Замыкание удерживает `count` в памяти, но не делает её глобальной. Снаружи такого имени нет, поэтому `typeof` даёт `'undefined'`, а вызов `inc()` работает со своей скрытой переменной и возвращает `1`.",
    article,
    tags: ["lexical-environment", "memory"],
  },
  {
    id: "closure-var-loop-return",
    topic: "closures",
    title: "Массив функций в цикле с var",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const fns = [];

for (var i = 0; i < 3; i++) {
  fns.push(function () {
    return i;
  });
}

console.log(fns.map((fn) => fn()).join(','));`,
    options: ["`0,1,2`", "`3,3,3`", "`0,0,0`", "`undefined,undefined,undefined`"],
    answer: 1,
    explanation:
      "Все функции замкнуты на одну переменную `i`, объявленную через `var`. После цикла она равна `3`, поэтому каждая функция возвращает `3`.",
    article,
    tags: ["var", "loop", "closure"],
  },
  {
    id: "closure-shared-between-instances",
    topic: "closures",
    title: "Изоляция экземпляров",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `function make() {
  let n = 0;
  return () => ++n;
}

const a = make();
const b = make();

console.log(a(), b(), a(), b());`,
    options: ["`1 1 2 2`", "`1 2 1 2`", "`2 1 2 1`", "`2 2 2 2`"],
    answer: 0,
    explanation:
      "Замыкания независимы, но каждое помнит свой счётчик. `a()` дважды даёт `1` и `2`, `b()` дважды — тоже `1` и `2`. Итоговая последовательность: `1 1 2 2`.",
    article,
    tags: ["instances", "state"],
  },
];
