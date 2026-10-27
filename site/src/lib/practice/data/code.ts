import type { Task } from "../types";

export const codeTasks: Task[] = [
  {
    id: "code-unique",
    topic: "collections",
    title: "Уникальные значения",
    difficulty: "junior",
    kind: "code",
    prompt:
      "Напиши функцию `unique(values)`, которая возвращает новый массив уникальных значений в порядке их первого появления. Используй `Set`.",
    starter: `function unique(values) {
  // твой код
}`,
    entry: "unique",
    tests: [
      { args: [[1, 2, 2, 3, 1]], expected: [1, 2, 3], label: "числа" },
      { args: [["a", "b", "a", "c"]], expected: ["a", "b", "c"], label: "строки" },
      { args: [[]], expected: [], label: "пустой массив" },
    ],
    solution: `function unique(values) {
  return [...new Set(values)];
}`,
    explanation:
      "`Set` удаляет повторы и сохраняет порядок вставки, а spread превращает его обратно в массив. Сложность — `O(n)` по времени и `O(n)` по памяти.",
    hints: [
      "Создай `new Set(values)` — он сам уберёт дубликаты.",
      "Верни `[...set]`, чтобы получить массив.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["set", "dedupe"],
  },
  {
    id: "code-count-chars",
    topic: "collections",
    title: "Частота символов",
    difficulty: "junior",
    kind: "code",
    prompt:
      "Напиши функцию `countChars(text)`, которая возвращает `Map`, где ключ — символ, а значение — сколько раз он встречается. Порядок ключей — порядок первого появления.",
    starter: `function countChars(text) {
  // твой код
}`,
    entry: "countChars",
    tests: [
      {
        args: ["hello"],
        expected: new Map([
          ["h", 1],
          ["e", 1],
          ["l", 2],
          ["o", 1],
        ]),
        label: "hello",
      },
      { args: [""], expected: new Map(), label: "пустая строка" },
      {
        args: ["aba"],
        expected: new Map([
          ["a", 2],
          ["b", 1],
        ]),
        label: "aba",
      },
    ],
    solution: `function countChars(text) {
  const counts = new Map();

  for (const char of text) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  return counts;
}`,
    explanation:
      "`Map` хранит порядок вставки и даёт `O(1)` в среднем на `get`/`set`. Один проход по строке — `O(n)` по времени и `O(k)` по памяти, где `k` — число уникальных символов.",
    hints: [
      "Для каждого символа возьми текущее значение через `map.get(char)`.",
      "Если ключа ещё нет, используй `?? 0`, чтобы не получить `NaN`.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["map", "frequency"],
  },
  {
    id: "code-two-sum",
    topic: "collections",
    title: "Two Sum",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `twoSum(values, target)`, которая возвращает индексы двух чисел, дающих в сумме `target`. Если пары нет — верни пустой массив. Каждый элемент можно использовать один раз. Реши за один проход через `Map`.",
    starter: `function twoSum(values, target) {
  // твой код
}`,
    entry: "twoSum",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1], label: "классический пример" },
      { args: [[3, 2, 4], 6], expected: [1, 2], label: "пара в середине" },
      { args: [[3, 3], 6], expected: [0, 1], label: "одинаковые значения" },
      { args: [[1, 2], 10], expected: [], label: "пары нет" },
    ],
    solution: `function twoSum(values, target) {
  const seen = new Map();

  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    const complement = target - value;

    if (seen.has(complement)) {
      return [seen.get(complement), index];
    }

    seen.set(value, index);
  }

  return [];
}`,
    explanation:
      "На каждом шаге мы ищем в `Map` дополнение `target - value`. Если оно уже встречалось, возвращаем его индекс и текущий. Один проход — `O(n)` вместо `O(n²)` у двойного цикла.",
    hints: [
      "Храни в `Map` значение → индекс для уже просмотренных элементов.",
      "Для текущего `value` проверь, есть ли в `Map` ключ `target - value`.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["map", "two-sum", "o-n"],
  },
  {
    id: "code-is-anagram",
    topic: "collections",
    title: "Анаграммы",
    difficulty: "junior",
    kind: "code",
    prompt:
      "Напиши функцию `isAnagram(left, right)`, которая проверяет, являются ли две строки анаграммами (одинаковый набор символов с одинаковыми частотами). Регистр и пробелы можно не учитывать — тесты их не содержат.",
    starter: `function isAnagram(left, right) {
  // твой код
}`,
    entry: "isAnagram",
    tests: [
      { args: ["listen", "silent"], expected: true, label: "listen / silent" },
      { args: ["rat", "car"], expected: false, label: "rat / car" },
      { args: ["", ""], expected: true, label: "две пустые строки" },
      { args: ["aab", "abb"], expected: false, label: "разные частоты" },
    ],
    solution: `function isAnagram(left, right) {
  if (left.length !== right.length) return false;

  const counts = new Map();

  for (const char of left) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  for (const char of right) {
    const count = counts.get(char);
    if (!count) return false;
    counts.set(char, count - 1);
  }

  return true;
}`,
    explanation:
      "Сначала проверяем длину, затем считаем частоты символов первой строки и вычитаем их по второй. Если какой-то символ закончился раньше — это не анаграмма. Время `O(n)`, память `O(k)`.",
    hints: [
      "Если длины разные, строки точно не анаграммы.",
      "После вычитания частот все счётчики должны стать нулевыми.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["map", "anagram", "frequency"],
  },
  {
    id: "code-group-by",
    topic: "collections",
    title: "Группировка по ключу",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `groupBy(items, key)`, которая группирует массив объектов по значению свойства `key` и возвращает обычный объект: ключ → массив элементов.",
    starter: `function groupBy(items, key) {
  // твой код
}`,
    entry: "groupBy",
    tests: [
      {
        args: [
          [
            { type: "fruit", name: "apple" },
            { type: "vegetable", name: "carrot" },
            { type: "fruit", name: "banana" },
          ],
          "type",
        ],
        expected: {
          fruit: [
            { type: "fruit", name: "apple" },
            { type: "fruit", name: "banana" },
          ],
          vegetable: [{ type: "vegetable", name: "carrot" }],
        },
        label: "фрукты и овощи",
      },
      { args: [[], "type"], expected: {}, label: "пустой массив" },
      {
        args: [[{ role: "admin" }, { role: "admin" }], "role"],
        expected: { admin: [{ role: "admin" }, { role: "admin" }] },
        label: "одна группа",
      },
    ],
    solution: `function groupBy(items, key) {
  const groups = {};

  for (const item of items) {
    const group = item[key];
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  }

  return groups;
}`,
    explanation:
      "Один проход по массиву и словарь групп. В среднем `O(n)` по времени и `O(n)` по памяти. Если ключи могут быть объектами или символами, лучше использовать `Map`.",
    hints: [
      "Создай пустой объект для групп.",
      "Если массива для ключа ещё нет, создай его перед `push`.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["groupby", "object", "reduce"],
  },
  {
    id: "code-intersection",
    topic: "collections",
    title: "Пересечение массивов",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `intersection(left, right)`, которая возвращает уникальные общие значения в порядке их появления в `left`. Используй `Set`.",
    starter: `function intersection(left, right) {
  // твой код
}`,
    entry: "intersection",
    tests: [
      { args: [[1, 2, 2, 3], [2, 3, 4]], expected: [2, 3], label: "числа" },
      { args: [["a", "b"], ["b", "c"]], expected: ["b"], label: "строки" },
      { args: [[], [1, 2]], expected: [], label: "пустой левый массив" },
    ],
    solution: `function intersection(left, right) {
  const rightSet = new Set(right);
  const result = [];

  for (const value of new Set(left)) {
    if (rightSet.has(value)) result.push(value);
  }

  return result;
}`,
    explanation:
      "Строим `Set` из правого массива для `O(1)` проверок, затем идём по уникальным значениям левого. Время `O(n + m)`, память `O(n + m)` в худшем случае.",
    hints: [
      "`new Set(right)` ускорит проверку `has`.",
      "Пройди по `new Set(left)`, чтобы сохранить порядок и убрать дубли.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["set", "intersection"],
  },
  {
    id: "code-first-duplicate",
    topic: "collections",
    title: "Первое повторение",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `firstDuplicate(values)`, которая возвращает первое значение, встретившееся повторно, или `-1`, если повторов нет.",
    starter: `function firstDuplicate(values) {
  // твой код
}`,
    entry: "firstDuplicate",
    tests: [
      { args: [[2, 1, 3, 2, 1]], expected: 2, label: "числа" },
      { args: [[1, 2, 3]], expected: -1, label: "без повторов" },
      { args: [["a", "b", "a"]], expected: "a", label: "строки" },
    ],
    solution: `function firstDuplicate(values) {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }

  return -1;
}`,
    explanation:
      "`Set` позволяет проверять повтор за `O(1)` в среднем. Один проход — `O(n)` времени и `O(n)` памяти. Обрати внимание: важен именно первый повтор, а не минимальное значение.",
    hints: [
      "Иди по массиву слева направо.",
      "Если значение уже есть в `Set` — сразу верни его.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["set", "duplicate"],
  },
  {
    id: "code-has-pair-with-sum",
    topic: "big-o",
    title: "Пара с заданной суммой",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Дан **отсортированный** массив чисел. Напиши `hasPairWithSum(values, target)`, которая возвращает `true`, если есть два различных элемента с суммой `target`. Реши через два указателя за `O(n)` и `O(1)` памяти.",
    starter: `function hasPairWithSum(values, target) {
  // твой код
}`,
    entry: "hasPairWithSum",
    tests: [
      { args: [[1, 2, 3, 4, 6], 6], expected: true, label: "2 + 4" },
      { args: [[1, 2, 3, 9], 8], expected: false, label: "пары нет" },
      { args: [[1, 1], 2], expected: true, label: "два одинаковых" },
      { args: [[], 5], expected: false, label: "пустой массив" },
    ],
    solution: `function hasPairWithSum(values, target) {
  let left = 0;
  let right = values.length - 1;

  while (left < right) {
    const sum = values[left] + values[right];

    if (sum === target) return true;
    if (sum < target) left++;
    else right--;
  }

  return false;
}`,
    explanation:
      "Начинаем с краёв отсортированного массива. Если сумма меньше цели, двигаем левый указатель вправо; если больше — правый влево. Каждый элемент посещается не более одного раза: `O(n)` времени, `O(1)` памяти.",
    hints: [
      "Массив уже отсортирован — это подсказка про два указателя.",
      "Сравнивай сумму краёв с `target` и двигай тот указатель, который может её изменить.",
    ],
    article: {
      href: "/javascript/js-big-o/",
      label: "Алгоритмическая сложность и Big O",
    },
    tags: ["two-pointers", "o-n", "sorted"],
  },
  {
    id: "code-move-zeroes",
    topic: "big-o",
    title: "Нули в конец",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `moveZeroes(values)`, которая возвращает новый массив, где все нули перенесены в конец, а порядок остальных элементов сохранён. Постарайся обойтись одним проходом.",
    starter: `function moveZeroes(values) {
  // твой код
}`,
    entry: "moveZeroes",
    tests: [
      { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0], label: "смешанный" },
      { args: [[0]], expected: [0], label: "один ноль" },
      { args: [[1, 2]], expected: [1, 2], label: "без нулей" },
      { args: [[0, 0, 1]], expected: [1, 0, 0], label: "нули в начале" },
    ],
    solution: `function moveZeroes(values) {
  const result = [];
  let zeroCount = 0;

  for (const value of values) {
    if (value === 0) zeroCount++;
    else result.push(value);
  }

  while (zeroCount > 0) {
    result.push(0);
    zeroCount--;
  }

  return result;
}`,
    explanation:
      "Собираем ненулевые элементы в новый массив и считаем нули, затем добавляем их в конец. Время `O(n)`, память `O(n)`. In-place вариант использует два указателя и `O(1)` памяти.",
    hints: [
      "Не удаляй элементы из массива в цикле — это дорого.",
      "Сначала собери ненулевые, потом добавь нужное количество нулей.",
    ],
    article: {
      href: "/javascript/js-big-o/",
      label: "Алгоритмическая сложность и Big O",
    },
    tags: ["two-pointers", "array", "o-n"],
  },
  {
    id: "code-flatten",
    topic: "functions",
    title: "Глубокий flatten",
    difficulty: "middle",
    kind: "code",
    prompt:
      "Напиши функцию `flatten(values)`, которая разворачивает массив любой вложенности в плоский. Не используй `flat(Infinity)` — реализуй рекурсию или стек.",
    starter: `function flatten(values) {
  // твой код
}`,
    entry: "flatten",
    tests: [
      {
        args: [[1, [2, [3, [4]]]]],
        expected: [1, 2, 3, 4],
        label: "глубокая вложенность",
      },
      { args: [[]], expected: [], label: "пустой массив" },
      { args: [[[1], [2]]], expected: [1, 2], label: "два вложенных массива" },
    ],
    solution: `function flatten(values) {
  const result = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      result.push(...flatten(value));
    } else {
      result.push(value);
    }
  }

  return result;
}`,
    explanation:
      "Рекурсивно обходим каждый элемент: массивы разворачиваем, примитивы добавляем в результат. Время `O(n)` по общему числу элементов, память `O(n)` плюс глубина рекурсии.",
    hints: [
      "Проверяй вложенность через `Array.isArray(value)`.",
      "Рекурсивный вызов возвращает массив — его можно добавить через `push(...)`.",
    ],
    article: {
      href: "/javascript/js-functional/",
      label: "Функциональное программирование",
    },
    tags: ["recursion", "flatten", "array"],
  },
  {
    id: "code-is-balanced",
    topic: "collections",
    title: "Сбалансированные скобки",
    difficulty: "senior",
    kind: "code",
    prompt:
      "Напиши функцию `isBalanced(text)`, которая проверяет правильность расстановки скобок `()`, `[]` и `{}`. Используй стек и `Map` для пар.",
    starter: `function isBalanced(text) {
  // твой код
}`,
    entry: "isBalanced",
    tests: [
      { args: ["()[]{}"], expected: true, label: "все виды" },
      { args: ["(]"], expected: false, label: "неверная пара" },
      { args: ["([{}])"], expected: true, label: "вложенные" },
      { args: [""], expected: true, label: "пустая строка" },
      { args: ["((("], expected: false, label: "незакрытые" },
    ],
    solution: `function isBalanced(text) {
  const pairs = new Map([
    [")", "("],
    ["]", "["],
    ["}", "{"],
  ]);
  const stack = [];

  for (const char of text) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
    } else if (pairs.has(char)) {
      if (stack.pop() !== pairs.get(char)) return false;
    }
  }

  return stack.length === 0;
}`,
    explanation:
      "Открывающие скобки кладём в стек, для закрывающих проверяем вершину. Если пара не совпала или стек не пуст в конце — строка несбалансирована. Время `O(n)`, память `O(n)`.",
    hints: [
      "`Map` удобно хранит соответствие закрывающей скобки открывающей.",
      "После цикла стек должен быть пустым.",
    ],
    article: {
      href: "/javascript/js-collections-iterators/",
      label: "Коллекции и итераторы",
    },
    tags: ["stack", "map", "brackets"],
  },
];
