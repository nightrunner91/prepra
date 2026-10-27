import type { Task } from "../types";

const article = {
  href: "/javascript/js-functional/",
  label: "Функциональное программирование",
};

export const functionTasks: Task[] = [
  {
    id: "functions-foreach-return",
    topic: "functions",
    title: "Что возвращает forEach",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const result = [1, 2, 3].forEach((value) => value * 2);
console.log(result);`,
    options: ["`[2, 4, 6]`", "`undefined`", "`[1, 2, 3]`", "`3`"],
    answer: 1,
    explanation:
      "`forEach` всегда возвращает `undefined` и используется для побочных эффектов. Для нового массива нужен `map`.",
    article,
    tags: ["foreach", "map"],
  },
  {
    id: "functions-map-parseint",
    topic: "functions",
    title: "map(parseInt)",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log([1, 2, 3].map(parseInt));`,
    options: ["`[1, 2, 3]`", "`[1, NaN, NaN]`", "`[NaN, NaN, NaN]`", "`[1, 2, undefined]`"],
    answer: 1,
    explanation:
      "`map` передаёт в колбэк три аргумента: значение, индекс и массив. `parseInt` принимает вторым аргументом основание системы счисления: `parseInt('1', 0)` → `1`, `parseInt('2', 1)` → `NaN`, `parseInt('3', 2)` → `NaN`.",
    article,
    tags: ["map", "parseint", "callback-args"],
  },
  {
    id: "functions-sort-default",
    topic: "functions",
    title: "sort без компаратора",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log([10, 1, 2].sort());`,
    options: ["`[1, 2, 10]`", "`[1, 10, 2]`", "`[10, 2, 1]`", "`[2, 1, 10]`"],
    answer: 1,
    explanation:
      "Без компаратора `sort` приводит элементы к строкам и сравнивает лексикографически. `'10'` идёт раньше `'2'`, поэтому получается `[1, 10, 2]`.",
    article,
    tags: ["sort", "lexicographic"],
  },
  {
    id: "functions-sort-mutates",
    topic: "functions",
    title: "sort мутирует массив",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const values = [3, 1, 2];
const sorted = values.sort();

console.log(values === sorted);`,
    options: ["`true`", "`false`", "`undefined`", "`TypeError`"],
    answer: 0,
    explanation:
      "`sort` сортирует массив на месте и возвращает ссылку на него же. Поэтому `values` и `sorted` — один и тот же объект. Для копии нужен `[...values].sort()`.",
    article,
    tags: ["sort", "mutation", "reference"],
  },
  {
    id: "functions-reduce-empty-no-initial",
    topic: "functions",
    title: "reduce пустого массива",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `const result = [].reduce((acc, value) => acc + value);
console.log(result);`,
    options: ["`0`", "`undefined`", "`TypeError`", "`NaN`"],
    answer: 2,
    explanation:
      "Без начального значения `reduce` берёт первый элемент как аккумулятор. В пустом массиве такого элемента нет, поэтому выбрасывается `TypeError`.",
    article,
    tags: ["reduce", "empty-array"],
  },
  {
    id: "functions-reduce-empty-initial",
    topic: "functions",
    title: "reduce с начальным значением",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const result = [].reduce((acc, value) => acc + value, 0);
console.log(result);`,
    options: ["`0`", "`undefined`", "`TypeError`", "`NaN`"],
    answer: 0,
    explanation:
      "Если передано начальное значение, `reduce` возвращает его для пустого массива, не вызывая колбэк. Результат — `0`.",
    article,
    tags: ["reduce", "initial-value"],
  },
  {
    id: "functions-slice-immutable",
    topic: "functions",
    title: "slice не мутирует",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const values = [1, 2, 3];
const sliced = values.slice(0, 2);

console.log(sliced, values);`,
    options: [
      "`[1, 2] [1, 2, 3]`",
      "`[1, 2] [1, 2]`",
      "`[3] [1, 2, 3]`",
      "`[1, 2, 3] [1, 2]`",
    ],
    answer: 0,
    explanation:
      "`slice` возвращает новый массив с выбранным диапазоном и не меняет исходный. `slice(0, 2)` берёт элементы с индексами `0` и `1`.",
    article,
    tags: ["slice", "immutability"],
  },
  {
    id: "functions-splice-mutates",
    topic: "functions",
    title: "splice мутирует",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const values = [1, 2, 3];
const removed = values.splice(0, 2);

console.log(values, removed);`,
    options: [
      "`[1, 2, 3] [1, 2]`",
      "`[3] [1, 2]`",
      "`[1, 2] [3]`",
      "`[3] []`",
    ],
    answer: 1,
    explanation:
      "`splice` меняет исходный массив и возвращает массив удалённых элементов. Из `[1, 2, 3]` удаляются первые два элемента, остаётся `[3]`, а `removed` равно `[1, 2]`.",
    article,
    tags: ["splice", "mutation"],
  },
  {
    id: "functions-find-vs-filter",
    topic: "functions",
    title: "find или filter",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const values = [1, 2, 3, 4];
console.log(values.find((value) => value > 2));`,
    options: ["`[3, 4]`", "`3`", "`2`", "`undefined`"],
    answer: 1,
    explanation:
      "`find` возвращает первый подходящий элемент, а не массив. Первое значение больше `2` — это `3`. Массив вернул бы `filter`.",
    article,
    tags: ["find", "filter"],
  },
  {
    id: "functions-some-every-empty",
    topic: "functions",
    title: "some и every на пустом массиве",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log([].some(Boolean));
console.log([].every(Boolean));`,
    options: ["`false` и `true`", "`false` и `false`", "`true` и `true`", "`true` и `false`"],
    answer: 0,
    explanation:
      "`some` возвращает `false`, если ни один элемент не подошёл, — а в пустом массиве элементов нет. `every` возвращает `true` для пустого массива по правилам логики (vacuous truth).",
    article,
    tags: ["some", "every", "empty-array"],
  },
  {
    id: "functions-includes-nan",
    topic: "functions",
    title: "includes и NaN",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log([1, NaN].includes(NaN));
console.log([1, NaN].indexOf(NaN));`,
    options: ["`true` и `-1`", "`false` и `-1`", "`true` и `1`", "`false` и `NaN`"],
    answer: 0,
    explanation:
      "`includes` использует SameValueZero и находит `NaN`, а `indexOf` сравнивает через `===` и не может найти `NaN`, возвращая `-1`.",
    article,
    tags: ["includes", "indexof", "nan"],
  },
  {
    id: "functions-flat-depth",
    topic: "functions",
    title: "flat по умолчанию",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log([1, [2, [3]]].flat());`,
    options: ["`[1, 2, 3]`", "`[1, 2, [3]]`", "`[1, [2, [3]]]`", "`[1, [2, 3]]`"],
    answer: 1,
    explanation:
      "`flat()` без аргумента разворачивает только один уровень вложенности. Для полного разворачивания нужен `flat(Infinity)`.",
    article,
    tags: ["flat", "nested-arrays"],
  },
  {
    id: "functions-array-from",
    topic: "functions",
    title: "Array.from с length",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(Array.from({ length: 3 }, (_, index) => index));`,
    options: ["`[1, 2, 3]`", "`[0, 1, 2]`", "`[undefined, undefined, undefined]`", "`[]`"],
    answer: 1,
    explanation:
      "`Array.from` умеет работать с array-like объектами. `{ length: 3 }` задаёт длину, а второй аргумент — маппер, который получает индекс. Результат — `[0, 1, 2]`.",
    article,
    tags: ["array-from", "array-like"],
  },
  {
    id: "functions-foreach-async",
    topic: "functions",
    title: "async-колбэк в forEach",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `[1, 2].forEach(async (value) => {
  await null;
  console.log(value);
});

console.log('done');`,
    options: ["`1 2 done`", "`done 1 2`", "`done 2 1`", "`1 done 2`"],
    answer: 1,
    explanation:
      "`forEach` не ждёт асинхронные колбэки. Каждый вызов создаёт промис, который продолжается в микрозадаче, а синхронный `done` выводится сразу после цикла.",
    article,
    tags: ["foreach", "async", "microtask"],
  },
  {
    id: "functions-map-index",
    topic: "functions",
    title: "Второй аргумент map",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const result = [10, 20].map((value, index) => value + index);
console.log(result);`,
    options: ["`[10, 21]`", "`[11, 22]`", "`[10, 20]`", "`[20, 40]`"],
    answer: 0,
    explanation:
      "Второй аргумент колбэка `map` — индекс элемента. Получается `10 + 0 = 10` и `20 + 1 = 21`.",
    article,
    tags: ["map", "callback-args"],
  },
];
