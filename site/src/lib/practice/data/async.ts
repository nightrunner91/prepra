import type { Task } from "../types";

const article = {
  href: "/javascript/js-async/",
  label: "Асинхронность и промисы",
};

export const asyncTasks: Task[] = [
  {
    id: "async-function-returns-promise",
    topic: "async",
    title: "Что возвращает async-функция",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function getValue() {
  return 1;
}

console.log(getValue() instanceof Promise);`,
    options: ["`true`", "`false`", "`1`", "`undefined`"],
    answer: 0,
    explanation:
      "Любая `async`-функция всегда возвращает промис. Возвращённое значение `1` становится результатом его выполнения.",
    article,
    tags: ["async", "promise"],
  },
  {
    id: "async-await-value",
    topic: "async",
    title: "await разворачивает значение",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function getValue() {
  return 1;
}

async function run() {
  const value = await getValue();
  console.log(value);
}

run();`,
    options: ["`Promise { 1 }`", "`1`", "`undefined`", "`TypeError`"],
    answer: 1,
    explanation:
      "`await` дожидается выполнения промиса и возвращает его результат, а не сам промис. Поэтому `value` равно `1`.",
    article,
    tags: ["await", "promise"],
  },
  {
    id: "async-promise-all-fail-fast",
    topic: "async",
    title: "Promise.all и ошибка",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.all([
  Promise.resolve('a'),
  Promise.reject('boom'),
  Promise.resolve('c'),
])
  .then((values) => console.log(values))
  .catch((error) => console.log('catch', error));`,
    options: [
      "`['a', 'boom', 'c']`",
      "`catch boom`",
      "`catch a`",
      "Ничего не выведет",
    ],
    answer: 1,
    explanation:
      "`Promise.all` отклоняется сразу при первой ошибке, не дожидаясь остальных. Успешные результаты при этом теряются.",
    article,
    tags: ["promise-all", "rejection"],
  },
  {
    id: "async-promise-all-settled",
    topic: "async",
    title: "Promise.allSettled",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.allSettled([
  Promise.resolve(1),
  Promise.reject('x'),
]).then((results) => {
  console.log(results.map((result) => result.status).join(','));
});`,
    options: [
      "`fulfilled,rejected`",
      "`fulfilled,fulfilled`",
      "`rejected`",
      "`1,x`",
    ],
    answer: 0,
    explanation:
      "`Promise.allSettled` ждёт завершения всех промисов и возвращает массив статусов. Ошибка не прерывает выполнение, поэтому статусы — `fulfilled` и `rejected`.",
    article,
    tags: ["promise-allsettled", "status"],
  },
  {
    id: "async-promise-race",
    topic: "async",
    title: "Promise.race",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.race([
  new Promise((resolve) => setTimeout(() => resolve('slow'), 10)),
  Promise.resolve('fast'),
]).then((value) => console.log(value));`,
    options: ["`slow`", "`fast`", "`['slow', 'fast']`", "`undefined`"],
    answer: 1,
    explanation:
      "`Promise.race` возвращает результат первого завершившегося промиса — неважно, успешно или с ошибкой. `Promise.resolve('fast')` завершается сразу.",
    article,
    tags: ["promise-race", "timing"],
  },
  {
    id: "async-promise-any",
    topic: "async",
    title: "Promise.any",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.any([
  Promise.reject('a'),
  Promise.resolve('b'),
  Promise.reject('c'),
])
  .then((value) => console.log(value))
  .catch((error) => console.log(error));`,
    options: ["`a`", "`b`", "`c`", "`AggregateError`"],
    answer: 1,
    explanation:
      "`Promise.any` ждёт первый успешно выполненный промис и игнорирует ошибки. Если бы все промисы отклонились, вернулся бы `AggregateError`.",
    article,
    tags: ["promise-any", "aggregate-error"],
  },
  {
    id: "async-then-return",
    topic: "async",
    title: "Возврат из then",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.resolve(1)
  .then((value) => value + 1)
  .then((value) => console.log(value));`,
    options: ["`1`", "`2`", "`Promise { 2 }`", "`undefined`"],
    answer: 1,
    explanation:
      "Значение, возвращённое из `then`, становится результатом следующего промиса в цепочке. Поэтому во второй `then` приходит `2`.",
    article,
    tags: ["then", "chain"],
  },
  {
    id: "async-throw-in-then",
    topic: "async",
    title: "Ошибка внутри then",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.resolve()
  .then(() => {
    throw new Error('boom');
  })
  .catch((error) => console.log(error.message));`,
    options: ["`boom`", "`Error: boom`", "`undefined`", "`UnhandledPromiseRejection`"],
    answer: 0,
    explanation:
      "Исключение внутри `then` превращает промис в отклонённый. Ближайший `catch` перехватывает ошибку, и выводится её сообщение — `boom`.",
    article,
    tags: ["then", "catch", "throw"],
  },
  {
    id: "async-finally-value",
    topic: "async",
    title: "finally и значение",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.resolve(1)
  .finally(() => 2)
  .then((value) => console.log(value));`,
    options: ["`1`", "`2`", "`undefined`", "`Promise { 1 }`"],
    answer: 0,
    explanation:
      "`finally` не меняет результат промиса: возвращённое из него значение игнорируется (кроме случая, когда он выбрасывает ошибку). Поэтому дальше проходит исходная `1`.",
    article,
    tags: ["finally", "promise"],
  },
  {
    id: "async-try-catch-await",
    topic: "async",
    title: "try/catch с await",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  try {
    await Promise.reject(new Error('fail'));
  } catch (error) {
    console.log('caught', error.message);
  }
}

run();`,
    options: ["`caught fail`", "`fail`", "`UnhandledPromiseRejection`", "`undefined`"],
    answer: 0,
    explanation:
      "`await` на отклонённом промисе выбрасывает исключение, которое можно поймать обычным `try/catch`. Выводится `caught fail`.",
    article,
    tags: ["try-catch", "await", "rejection"],
  },
  {
    id: "async-sequential-awaits",
    topic: "async",
    title: "Последовательные await",
    difficulty: "middle",
    kind: "choice",
    prompt: "Как выполняются запросы в функции?",
    code: `async function load() {
  const user = await fetchUser();
  const posts = await fetchPosts();
  return [user, posts];
}`,
    options: [
      "Параллельно: оба запроса стартуют сразу",
      "Последовательно: `fetchPosts` стартует только после `fetchUser`",
      "Второй запрос вообще не выполнится",
      "Оба стартуют, но результат второго игнорируется",
    ],
    answer: 1,
    explanation:
      "`await` приостанавливает функцию до выполнения первого промиса. Второй запрос начинается только после первого. Для параллельного выполнения нужен `Promise.all([fetchUser(), fetchPosts()])`.",
    article,
    tags: ["await", "parallel", "promise-all"],
  },
  {
    id: "async-race-empty",
    topic: "async",
    title: "Promise.race с пустым массивом",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.race([]).then(() => console.log('done'));
console.log('sync');`,
    options: ["`sync done`", "`sync`, а `done` не выведется никогда", "`done sync`", "`TypeError`"],
    answer: 1,
    explanation:
      "`Promise.race([])` навсегда остаётся в состоянии pending: нет ни одного промиса, который мог бы его завершить. Поэтому `then` не вызывается, выводится только `sync`.",
    article,
    tags: ["promise-race", "pending"],
  },
  {
    id: "async-unhandled-rejection",
    topic: "async",
    title: "Необработанное отклонение",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `Promise.reject(new Error('boom'));
console.log('sync');`,
    options: [
      "Выведется `sync`, затем браузер сообщит об `UnhandledPromiseRejection`",
      "Ошибка молча игнорируется",
      "Сначала `UnhandledPromiseRejection`, затем `sync`",
      "`TypeError` в синхронном коде",
    ],
    answer: 0,
    explanation:
      "Синхронный код выполняется первым. Отклонение остаётся без обработчика, и после очистки микрозадач среда сообщает об `UnhandledPromiseRejection`.",
    article,
    tags: ["unhandled-rejection", "promise"],
  },
  {
    id: "async-throw-before-await",
    topic: "async",
    title: "Брошенная ошибка в async-функции",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function load() {
  throw new Error('boom');
}

load().catch((error) => console.log('caught', error.message));
console.log('sync');`,
    options: [
      "`caught boom sync`",
      "`sync caught boom`",
      "`sync`, затем `UnhandledPromiseRejection`",
      "`TypeError`",
    ],
    answer: 1,
    explanation:
      "Ошибка в `async`-функции превращается в отклонённый промис, а не выбрасывается синхронно. Сначала выполняется `sync`, затем микрозадача `catch`.",
    article,
    tags: ["async", "throw", "catch"],
  },
  {
    id: "async-all-non-promises",
    topic: "async",
    title: "Promise.all с обычными значениями",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.all([1, Promise.resolve(2)]).then((values) => {
  console.log(values.join(','));
});`,
    options: ["`1,2`", "`2`", "`Promise { 1 },2`", "`TypeError`"],
    answer: 0,
    explanation:
      "`Promise.all` оборачивает обычные значения в уже выполненные промисы через `Promise.resolve`. Поэтому результатом будет массив `[1, 2]`.",
    article,
    tags: ["promise-all", "values"],
  },
];
