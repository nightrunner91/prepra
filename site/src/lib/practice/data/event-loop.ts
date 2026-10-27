import type { Task } from "../types";

const article = {
  href: "/javascript/js-event-loop/",
  label: "Event loop",
};

export const eventLoopTasks: Task[] = [
  {
    id: "event-loop-basic-order",
    topic: "event-loop",
    title: "Синхронный код, промис и таймер",
    difficulty: "junior",
    kind: "choice",
    prompt: "В каком порядке появятся строки?",
    code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
    options: ["`A B C D`", "`A D C B`", "`A D B C`", "`A C D B`"],
    answer: 1,
    explanation:
      "Сначала выполняется весь синхронный код: `A`, затем `D`. После этого дренируются микрозадачи (`C`), и только потом выполняется макрозадача таймера (`B`).",
    article,
    tags: ["microtask", "macrotask", "setTimeout"],
  },
  {
    id: "event-loop-promise-vs-timeout",
    topic: "event-loop",
    title: "Промис против setTimeout",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `setTimeout(() => console.log(1));
Promise.resolve().then(() => console.log(2));
console.log(3);`,
    options: ["`1 2 3`", "`3 1 2`", "`3 2 1`", "`2 3 1`"],
    answer: 2,
    explanation:
      "`console.log(3)` — синхронный. Колбэк `.then` попадает в очередь микрозадач и выполняется сразу после синхронного кода, а таймер — уже в следующей макрозадаче.",
    article,
    tags: ["promise", "setTimeout"],
  },
  {
    id: "event-loop-async-await-basic",
    topic: "event-loop",
    title: "Первый await",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  console.log(1);
  await null;
  console.log(2);
}

run();
console.log(3);`,
    options: ["`1 2 3`", "`1 3 2`", "`3 1 2`", "`2 3 1`"],
    answer: 1,
    explanation:
      "Тело `async`-функции выполняется синхронно до первого `await`. Дальше продолжение планируется как микрозадача, поэтому сначала выводится `3` и только затем `2`.",
    article,
    tags: ["async-await", "microtask"],
  },
  {
    id: "event-loop-two-awaits",
    topic: "event-loop",
    title: "Два await подряд",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  console.log('a');
  await 0;
  console.log('b');
  await 0;
  console.log('c');
}

run();
console.log('d');`,
    options: ["`a b c d`", "`a d b c`", "`a d c b`", "`d a b c`"],
    answer: 1,
    explanation:
      "До первого `await` функция выполняется синхронно: `a`. Затем управление возвращается в основной код (`d`), после чего микрозадачи продолжают функцию: `b`, затем второй `await` и `c`.",
    article,
    tags: ["async-await", "microtask"],
  },
  {
    id: "event-loop-then-chain-order",
    topic: "event-loop",
    title: "Порядок в цепочке then",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));

Promise.resolve().then(() => console.log(3));`,
    options: ["`1 2 3`", "`1 3 2`", "`3 1 2`", "`3 2 1`"],
    answer: 1,
    explanation:
      "Сначала в очередь попадают колбэки первого `then` и отдельного промиса. После вывода `1` второй `then` только планируется, поэтому уже стоящий в очереди `3` выполняется раньше `2`.",
    article,
    tags: ["promise", "microtask", "then"],
  },
  {
    id: "event-loop-queue-microtask",
    topic: "event-loop",
    title: "queueMicrotask",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `setTimeout(() => console.log('timeout'), 0);
queueMicrotask(() => console.log('microtask'));
Promise.resolve().then(() => console.log('promise'));
console.log('sync');`,
    options: [
      "`sync microtask promise timeout`",
      "`sync promise microtask timeout`",
      "`sync timeout microtask promise`",
      "`microtask promise sync timeout`",
    ],
    answer: 0,
    explanation:
      "`queueMicrotask` и `.then` добавляют задания в одну очередь микрозадач в порядке вызова: сначала `microtask`, затем `promise`. Таймер выполняется последним.",
    article,
    tags: ["queueMicrotask", "microtask"],
  },
  {
    id: "event-loop-timer-microtask",
    topic: "event-loop",
    title: "Микрозадача внутри таймера",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `setTimeout(() => {
  console.log(1);
  Promise.resolve().then(() => console.log(2));
}, 0);

setTimeout(() => console.log(3), 0);`,
    options: ["`1 3 2`", "`1 2 3`", "`3 1 2`", "`2 1 3`"],
    answer: 1,
    explanation:
      "После каждого колбэка макрозадачи очередь микрозадач полностью очищается. Поэтому `2` выводится сразу после `1`, до перехода ко второму таймеру с `3`.",
    article,
    tags: ["macrotask", "microtask", "setTimeout"],
  },
  {
    id: "event-loop-starvation",
    topic: "event-loop",
    title: "Голодание макрозадач",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что произойдёт?",
    code: `function loop() {
  Promise.resolve().then(loop);
}

setTimeout(() => console.log('timer'), 0);
loop();`,
    options: [
      "Выведется `timer`, затем цикл продолжится",
      "`timer` не выведется: очередь микрозадач не опустеет",
      "Будет `RangeError: Maximum call stack size exceeded`",
      "Выведется `timer` три раза",
    ],
    answer: 1,
    explanation:
      "Каждая микрозадача добавляет следующую, поэтому очередь микрозадач никогда не опустеет. Event loop не перейдёт к макрозадачам, и таймер не выполнится — страница зависнет.",
    article,
    tags: ["starvation", "microtask"],
  },
  {
    id: "event-loop-await-in-loop",
    topic: "event-loop",
    title: "await внутри цикла",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  for (const value of [1, 2]) {
    await null;
    console.log(value);
  }
}

run();
console.log(0);`,
    options: ["`1 2 0`", "`0 1 2`", "`0 2 1`", "`1 0 2`"],
    answer: 1,
    explanation:
      "`run()` доходит до первого `await` и возвращает управление. Сначала выводится `0`, затем каждая итерация продолжается в отдельной микрозадаче: `1`, `2`.",
    article,
    tags: ["async-await", "loop"],
  },
  {
    id: "event-loop-executor-sync",
    topic: "event-loop",
    title: "Executor промиса",
    difficulty: "junior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `console.log(1);

new Promise((resolve) => {
  console.log(2);
  resolve();
}).then(() => console.log(3));

console.log(4);`,
    options: ["`1 2 3 4`", "`1 2 4 3`", "`1 4 2 3`", "`1 4 3 2`"],
    answer: 1,
    explanation:
      "Executor `new Promise(...)` вызывается синхронно, поэтому `2` выводится до `4`. Колбэк `then` всегда планируется как микрозадача и выполняется после синхронного кода.",
    article,
    tags: ["promise", "executor"],
  },
  {
    id: "event-loop-async-without-await",
    topic: "event-loop",
    title: "async без await",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  console.log('run');
}

run().then(() => console.log('then'));
console.log('end');`,
    options: ["`run then end`", "`run end then`", "`end run then`", "`end then run`"],
    answer: 1,
    explanation:
      "Тело `async`-функции без `await` выполняется синхронно (`run`), но возвращает уже разрешённый промис. Его `then` попадёт в микрозадачи и сработает после `end`.",
    article,
    tags: ["async-await", "promise"],
  },
  {
    id: "event-loop-nested-timer",
    topic: "event-loop",
    title: "Вложенный таймер",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `setTimeout(() => {
  console.log('A');
  setTimeout(() => console.log('C'), 0);
}, 0);

setTimeout(() => console.log('B'), 0);`,
    options: ["`A B C`", "`A C B`", "`B A C`", "`C A B`"],
    answer: 0,
    explanation:
      "Оба внешних таймера поставлены в очередь до начала выполнения. Сначала выполняется первый (`A`), он добавляет `C` в конец очереди, затем идёт уже стоящий `B`, и только потом `C`.",
    article,
    tags: ["setTimeout", "macrotask", "queue"],
  },
  {
    id: "event-loop-then-chain-interleave",
    topic: "event-loop",
    title: "Цепочка then и отдельный промис",
    difficulty: "senior",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => console.log(v));

Promise.resolve().then(() => console.log('micro'));`,
    options: ["`2 micro`", "`micro 2`", "`1 micro 2`", "`micro 1 2`"],
    answer: 1,
    explanation:
      "Первый `then` и отдельный промис стоят в очереди рядом. После выполнения первого `then` второй `then` только планируется, поэтому `micro` успевает вывестись раньше `2`.",
    article,
    tags: ["then", "microtask", "chain"],
  },
  {
    id: "event-loop-try-finally-await",
    topic: "event-loop",
    title: "try/finally с await",
    difficulty: "senior",
    kind: "choice",
    prompt: "В каком порядке появятся строки?",
    code: `async function run() {
  try {
    console.log('try');
    await null;
    return 'result';
  } finally {
    console.log('finally');
  }
}

run().then((value) => console.log(value));
console.log('sync');`,
    options: [
      "`try sync finally result`",
      "`try finally sync result`",
      "`sync try result finally`",
      "`try sync result finally`",
    ],
    answer: 0,
    explanation:
      "`try` выполняется синхронно, затем `await` отдаёт управление и выводится `sync`. Продолжение функции выполняет `finally` перед тем, как промис разрешится значением `result`, поэтому `then` срабатывает последним.",
    article,
    tags: ["async-await", "finally", "microtask"],
  },
  {
    id: "event-loop-await-rejection",
    topic: "event-loop",
    title: "Отклонённый await",
    difficulty: "middle",
    kind: "choice",
    prompt: "Что выведет код?",
    code: `async function run() {
  try {
    await Promise.reject('boom');
  } catch (error) {
    console.log('catch', error);
  }
}

run();
console.log('sync');`,
    options: [
      "`catch boom sync`",
      "`sync catch boom`",
      "`sync boom`",
      "`UnhandledPromiseRejection`",
    ],
    answer: 1,
    explanation:
      "`await` приостанавливает функцию, поэтому сначала выполняется синхронный `console.log('sync')`. Отклонение обрабатывается в микрозадаче и попадает в `catch`.",
    article,
    tags: ["async-await", "rejection", "try-catch"],
  },
];
