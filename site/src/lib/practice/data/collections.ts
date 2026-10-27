import type { Task } from "../types";

const article = {
  href: "/javascript/js-collections-iterators/",
  label: "Коллекции и итераторы",
};

export const collectionTasks: Task[] = [
  {
    id: "collections-object-key-coercion",
    topic: "collections",
    title: "Ключи обычного объекта",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const obj = {};
obj[1] = 'a';
obj['1'] = 'b';

console.log(Object.keys(obj).length, obj[1]);`,
    options: ["`1 'b'`", "`2 'b'`", "`2 'a'`", "`1 'a'`"],
    answer: 0,
    explanation:
      "Ключи объекта всегда приводятся к строке, поэтому `1` и `'1'` — один и тот же ключ. Второе присваивание перезаписывает значение, остаётся одно свойство со значением `'b'`.",
    article,
    tags: ["object", "keys", "coercion"],
  },
  {
    id: "collections-map-vs-object-keys",
    topic: "collections",
    title: "Map хранит тип ключа",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map();
map.set(1, 'a');
map.set('1', 'b');

console.log(map.size);`,
    options: ["`1`", "`2`", "`'a'`", "`'b'`"],
    answer: 1,
    explanation:
      "`Map` сравнивает ключи по SameValueZero и не приводит их к строке. Число `1` и строка `'1'` — разные ключи, поэтому в коллекции два элемента.",
    article,
    tags: ["map", "keys"],
  },
  {
    id: "collections-map-nan",
    topic: "collections",
    title: "NaN как ключ Map",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map();
map.set(NaN, 'found');

console.log(map.get(NaN));`,
    options: ["`undefined`", "`'found'`", "`NaN`", "`TypeError`"],
    answer: 1,
    explanation:
      "В отличие от `===`, сравнение ключей в `Map` работает по SameValueZero, где `NaN` равен самому себе. Поэтому `get(NaN)` находит значение.",
    article,
    tags: ["map", "nan", "samevaluezero"],
  },
  {
    id: "collections-set-nan",
    topic: "collections",
    title: "NaN в Set",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const set = new Set([NaN, NaN, 1, 1]);

console.log(set.size);`,
    options: ["`1`", "`2`", "`3`", "`4`"],
    answer: 1,
    explanation:
      "`Set` использует SameValueZero: `NaN` считается равным `NaN`, а `1` — равным `1`. Остаются два уникальных значения, размер равен `2`.",
    article,
    tags: ["set", "nan"],
  },
  {
    id: "collections-set-object-identity",
    topic: "collections",
    title: "Объекты в Set",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const a = {};
const b = {};

const set = new Set([a, b, a]);
console.log(set.size);`,
    options: ["`1`", "`2`", "`3`", "`undefined`"],
    answer: 1,
    explanation:
      "Объекты сравниваются по ссылке, а не по содержимому. `a` и `b` — разные ссылки, повторное добавление `a` игнорируется. Итоговый размер — `2`.",
    article,
    tags: ["set", "identity"],
  },
  {
    id: "collections-map-insertion-order",
    topic: "collections",
    title: "Порядок обхода Map",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map([
  ['b', 1],
  ['a', 2],
  ['c', 3],
]);

console.log([...map.keys()].join(','));`,
    options: ["`a,b,c`", "`b,a,c`", "`1,2,3`", "`c,a,b`"],
    answer: 1,
    explanation:
      "`Map` сохраняет порядок вставки ключей. Сортировка по алфавиту не выполняется, поэтому ключи идут в порядке добавления: `b,a,c`.",
    article,
    tags: ["map", "iteration-order"],
  },
  {
    id: "collections-object-key-order",
    topic: "collections",
    title: "Порядок ключей объекта",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const obj = { b: 1, 2: 2, a: 3, 1: 4 };

console.log(Object.keys(obj).join(','));`,
    options: ["`b,2,a,1`", "`1,2,b,a`", "`b,a,1,2`", "`2,1,b,a`"],
    answer: 1,
    explanation:
      "Сначала идут целочисленные ключи в возрастающем порядке (`1`, `2`), затем строковые ключи в порядке создания (`b`, `a`). Это поведение спецификации для обычных объектов.",
    article,
    tags: ["object", "keys", "order"],
  },
  {
    id: "collections-map-missing-key",
    topic: "collections",
    title: "Отсутствующий ключ Map",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map();
console.log(map.get('missing'));`,
    options: ["`null`", "`undefined`", "`false`", "`TypeError`"],
    answer: 1,
    explanation:
      "`Map.get` возвращает `undefined`, если ключа нет. Проверять наличие лучше через `map.has(key)`, потому что значение `undefined` можно сохранить явно.",
    article,
    tags: ["map", "get", "undefined"],
  },
  {
    id: "collections-weakmap-string-key",
    topic: "collections",
    title: "Строковый ключ WeakMap",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `const weakMap = new WeakMap();
weakMap.set('key', 1);`,
    options: [
      "Добавится строковый ключ",
      "`TypeError`",
      "`ReferenceError`",
      "Вернётся `undefined`",
    ],
    answer: 1,
    explanation:
      "Ключами `WeakMap` могут быть только объекты (включая функции). Строка не подходит, поэтому `set` выбрасывает `TypeError`.",
    article,
    tags: ["weakmap", "keys"],
  },
  {
    id: "collections-weakmap-not-iterable",
    topic: "collections",
    title: "Итерация по WeakMap",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const weakMap = new WeakMap();
console.log(typeof weakMap[Symbol.iterator]);`,
    options: ["`'function'`", "`'undefined'`", "`'object'`", "`TypeError`"],
    answer: 1,
    explanation:
      "`WeakMap` не итерируемый: у него нет `size`, `keys`, `values`, `entries` и `Symbol.iterator`. Это следствие слабых ссылок — содержимое нельзя перечислить.",
    article,
    tags: ["weakmap", "iterator"],
  },
  {
    id: "collections-proto-key",
    topic: "collections",
    title: "Присваивание __proto__",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const obj = {};
obj['__proto__'] = 1;

console.log(Object.keys(obj).length);`,
    options: ["`0`", "`1`", "`2`", "`TypeError`"],
    answer: 0,
    explanation:
      "`__proto__` — аксессор в `Object.prototype`. Присваивание примитива не создаёт собственное свойство (и не меняет прототип), поэтому `Object.keys` возвращает пустой массив.",
    article,
    tags: ["object", "proto", "prototype"],
  },
  {
    id: "collections-map-negative-zero",
    topic: "collections",
    title: "−0 и 0 как ключи Map",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map();
map.set(-0, 'zero');

console.log(map.get(0));`,
    options: ["`undefined`", "`'zero'`", "`0`", "`-0`"],
    answer: 1,
    explanation:
      "SameValueZero считает `-0` и `0` одним и тем же ключом (в отличие от `Object.is`). Поэтому значение, записанное по `-0`, доступно по `0`.",
    article,
    tags: ["map", "samevaluezero", "zero"],
  },
  {
    id: "collections-set-delete-add-order",
    topic: "collections",
    title: "Порядок после delete и add",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const set = new Set([1, 2, 3]);
set.delete(1);
set.add(1);

console.log([...set].join(','));`,
    options: ["`1,2,3`", "`2,3,1`", "`3,2,1`", "`1,3,2`"],
    answer: 1,
    explanation:
      "`Set` хранит порядок вставки. Удалённый элемент при повторном добавлении вставляется в конец, поэтому получается `2,3,1`.",
    article,
    tags: ["set", "order", "delete"],
  },
  {
    id: "collections-object-keys-map",
    topic: "collections",
    title: "Object.keys от Map",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map([['a', 1], ['b', 2]]);
console.log(Object.keys(map).length);`,
    options: ["`0`", "`1`", "`2`", "`TypeError`"],
    answer: 0,
    explanation:
      "Элементы `Map` хранятся во внутренних слотах, а не как обычные свойства объекта. `Object.keys` видит только собственные перечисляемые свойства и возвращает пустой массив.",
    article,
    tags: ["map", "object-keys"],
  },
  {
    id: "collections-map-readd-order",
    topic: "collections",
    title: "Повторная вставка в Map",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map([
  ['a', 1],
  ['b', 2],
]);

map.delete('a');
map.set('a', 3);

console.log([...map.keys()].join(','));`,
    options: ["`a,b`", "`b,a`", "`a`", "`b`"],
    answer: 1,
    explanation:
      "После удаления ключ исчезает из порядка. Повторный `set` добавляет его в конец, поэтому порядок становится `b,a`.",
    article,
    tags: ["map", "order", "delete"],
  },
  {
    id: "collections-json-map",
    topic: "collections",
    title: "JSON.stringify и Map",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `const map = new Map([['a', 1]]);
console.log(JSON.stringify(map));`,
    options: ["`'{\"a\":1}'`", "`'{}'`", "`'[]'`", "`'[object Map]'`"],
    answer: 1,
    explanation:
      "У `Map` нет собственных перечисляемых свойств, а `JSON.stringify` не знает про внутренние слоты. Поэтому сериализуется пустой объект `'{}'`. Для Map нужно вручную делать `Object.fromEntries` или `[...map]`.",
    article,
    tags: ["map", "json", "serialization"],
  },
];
