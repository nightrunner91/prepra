import type { Task } from "../types";

const article = {
  href: "/javascript/js-big-o/",
  label: "Алгоритмическая сложность и Big O",
};

const complexityOptions = ["`O(1)`", "`O(log n)`", "`O(n)`", "`O(n log n)`", "`O(n²)`"];

export const bigOTasks: Task[] = [
  {
    id: "big-o-single-loop",
    topic: "big-o",
    title: "Один проход по массиву",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая временная сложность у функции?",
    code: `function sum(values) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}`,
    options: complexityOptions,
    answer: 2,
    explanation:
      "Цикл выполняется один раз для каждого элемента массива, то есть `n` раз. Константные операции внутри не меняют оценку — `O(n)`.",
    article,
    tags: ["time-complexity", "loop"],
  },
  {
    id: "big-o-nested-loops",
    topic: "big-o",
    title: "Вложенные циклы",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая временная сложность?",
    code: `for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    count++;
  }
}`,
    options: complexityOptions,
    answer: 4,
    explanation:
      "Внешний цикл делает `n` итераций, и на каждой внутренний ещё `n`. Итого `n * n` операций — `O(n²)`.",
    article,
    tags: ["nested-loops", "time-complexity"],
  },
  {
    id: "big-o-two-sequential-loops",
    topic: "big-o",
    title: "Два цикла подряд",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая временная сложность?",
    code: `for (let i = 0; i < n; i++) {
  a++;
}

for (let i = 0; i < n; i++) {
  b++;
}`,
    options: complexityOptions,
    answer: 2,
    explanation:
      "Последовательные циклы складываются: `O(n) + O(n) = O(2n)`. Константа отбрасывается, остаётся `O(n)`.",
    article,
    tags: ["time-complexity", "constants"],
  },
  {
    id: "big-o-halving-loop",
    topic: "big-o",
    title: "Шаг с умножением",
    difficulty: "middle",
    kind: "choice",
    prompt: "Сколько итераций сделает цикл при больших `n`?",
    code: `for (let i = 1; i < n; i *= 2) {
  count++;
}`,
    options: complexityOptions,
    answer: 1,
    explanation:
      "На каждой итерации `i` удваивается: `1, 2, 4, 8...`. Количество итераций — это число удвоений до `n`, то есть `log₂ n`. Сложность `O(log n)`.",
    article,
    tags: ["logarithm", "loop"],
  },
  {
    id: "big-o-binary-search",
    topic: "big-o",
    title: "Бинарный поиск",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая сложность у бинарного поиска в отсортированном массиве?",
    code: `while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) left = mid + 1;
  else right = mid - 1;
}`,
    options: complexityOptions,
    answer: 1,
    explanation:
      "На каждом шаге область поиска сокращается вдвое. Количество делений `n` до `1` — `log₂ n`, поэтому сложность `O(log n)`.",
    article,
    tags: ["binary-search", "logarithm"],
  },
  {
    id: "big-o-includes-in-loop",
    topic: "big-o",
    title: "includes внутри цикла",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая общая временная сложность?",
    code: `for (let i = 0; i < n; i++) {
  if (values.includes(i)) {
    count++;
  }
}`,
    options: complexityOptions,
    answer: 4,
    explanation:
      "`Array.prototype.includes` в худшем случае просматривает весь массив — `O(n)`. Он вызывается `n` раз, поэтому итоговая сложность `O(n²)`.",
    article,
    tags: ["includes", "hidden-n2"],
  },
  {
    id: "big-o-shift-in-loop",
    topic: "big-o",
    title: "shift в цикле",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая сложность у такого опустошения массива?",
    code: `while (values.length > 0) {
  values.shift();
}`,
    options: complexityOptions,
    answer: 4,
    explanation:
      "`shift()` удаляет первый элемент и сдвигает все оставшиеся — это `O(n)`. В цикле из `n` итераций получается `O(n²)`. Для очереди лучше использовать индекс или `Map`.",
    article,
    tags: ["shift", "array", "hidden-n2"],
  },
  {
    id: "big-o-set-lookup-in-loop",
    topic: "big-o",
    title: "Set внутри цикла",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая общая сложность при среднем поведении хэш-таблицы?",
    code: `let found = 0;

for (const value of values) {
  if (lookup.has(value)) {
    found++;
  }
}`,
    options: complexityOptions,
    answer: 2,
    explanation:
      "`Set.has` в среднем работает за `O(1)`, а цикл проходит `n` элементов. Итог — `O(n)`. В худшем случае из-за коллизий возможен `O(n)` на операцию, но на интервью обычно называют среднюю оценку.",
    article,
    tags: ["set", "hash-table", "lookup"],
  },
  {
    id: "big-o-sort",
    topic: "big-o",
    title: "Сортировка",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая типичная сложность `Array.prototype.sort` в современных движках?",
    code: `values.sort((a, b) => a - b);`,
    options: complexityOptions,
    answer: 3,
    explanation:
      "Современные движки используют TimSort или аналогичные алгоритмы с типичной сложностью `O(n log n)`. Спецификация точный алгоритм не фиксирует, но на интервью ожидается `O(n log n)`.",
    article,
    tags: ["sort", "n-log-n"],
  },
  {
    id: "big-o-naive-fibonacci",
    topic: "big-o",
    title: "Наивный Фибоначчи",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая временная сложность у рекурсивной функции?",
    code: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    options: ["`O(n)`", "`O(n log n)`", "`O(2^n)`", "`O(n²)`"],
    answer: 2,
    explanation:
      "Каждый вызов порождает два новых, и дерево вызовов растёт экспоненциально. Точная оценка ближе к `O(1.618^n)`, но на интервью обычно говорят `O(2^n)`. Мемоизация снижает до `O(n)`.",
    article,
    tags: ["recursion", "fibonacci", "exponential"],
  },
  {
    id: "big-o-two-pointers",
    topic: "big-o",
    title: "Два указателя",
    difficulty: "middle",
    kind: "choice",
    prompt:
      "Массив отсортирован. Какая временная сложность поиска пары с заданной суммой?",
    code: `let left = 0;
let right = arr.length - 1;

while (left < right) {
  const sum = arr[left] + arr[right];
  if (sum === target) return true;
  if (sum < target) left++;
  else right--;
}`,
    options: complexityOptions,
    answer: 2,
    explanation:
      "Указатели двигаются навстречу друг другу и в сумме проходят не больше `n` шагов. Дополнительная память — `O(1)`, время — `O(n)`.",
    article,
    tags: ["two-pointers", "sorted-array"],
  },
  {
    id: "big-o-factorial-memory",
    topic: "big-o",
    title: "Память рекурсии",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая временная и пространственная сложность?",
    code: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`,
    options: [
      "`O(n)` времени и `O(1)` памяти",
      "`O(n)` времени и `O(n)` памяти",
      "`O(n²)` времени и `O(n)` памяти",
      "`O(2^n)` времени и `O(n)` памяти",
    ],
    answer: 1,
    explanation:
      "Функция вызывается `n` раз — `O(n)` времени. При этом каждый незавершённый вызов остаётся в стеке, поэтому глубина рекурсии и память тоже `O(n)`.",
    article,
    tags: ["recursion", "call-stack", "space-complexity"],
  },
  {
    id: "big-o-map-space",
    topic: "big-o",
    title: "Память при map",
    difficulty: "junior",
    kind: "choice",
    prompt: "Сколько дополнительной памяти требует функция?",
    code: `function doubleAll(values) {
  return values.map((value) => value * 2);
}`,
    options: ["`O(1)`", "`O(log n)`", "`O(n)`", "`O(n²)`"],
    answer: 2,
    explanation:
      "`map` создаёт новый массив той же длины, поэтому дополнительная память растёт линейно — `O(n)`. Исходный массив не мутируется.",
    article,
    tags: ["space-complexity", "map"],
  },
  {
    id: "big-o-matrix",
    topic: "big-o",
    title: "Обход матрицы",
    difficulty: "middle",
    kind: "choice",
    prompt: "Какая сложность обхода матрицы размера `rows × cols`?",
    code: `for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    visit(matrix[i][j]);
  }
}`,
    options: [
      "`O(rows + cols)`",
      "`O(rows * cols)`",
      "`O(rows²)`",
      "`O(cols²)`",
    ],
    answer: 1,
    explanation:
      "Внутренний цикл выполняется `cols` раз для каждой из `rows` строк. Итог — `rows * cols`, то есть линейно по количеству ячеек.",
    article,
    tags: ["matrix", "time-complexity"],
  },
  {
    id: "big-o-slice-in-loop",
    topic: "big-o",
    title: "slice внутри цикла",
    difficulty: "senior",
    kind: "choice",
    prompt: "Какая общая временная сложность?",
    code: `for (let i = 0; i < n; i++) {
  const copy = values.slice();
  process(copy);
}`,
    options: complexityOptions,
    answer: 4,
    explanation:
      "`slice()` без аргументов копирует весь массив — `O(n)`. Копирование выполняется `n` раз, итог `O(n²)`. Это частая скрытая деградация в циклах.",
    article,
    tags: ["slice", "hidden-n2", "copy"],
  },
  {
    id: "big-o-object-property",
    topic: "big-o",
    title: "Доступ к свойству объекта",
    difficulty: "junior",
    kind: "choice",
    prompt: "Какая средняя сложность чтения свойства объекта по ключу?",
    code: `const value = user[key];`,
    options: complexityOptions,
    answer: 0,
    explanation:
      "Доступ к свойству объекта в среднем `O(1)`: движок использует хэш-таблицу или скрытые классы. Это одна из причин, почему объекты и `Map` хороши для частых lookup-операций.",
    article,
    tags: ["object", "lookup", "hash-table"],
  },
];
