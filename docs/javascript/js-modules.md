---
title: "Модули: ESM и CJS"
section: javascript
description: "Почему приложение ломается при циклическом импорте, чем ESM отличается от CommonJS и как tree shaking убирает лишний код из сборки."
order: 9
tags: ["esm", "commonjs", "tree-shaking", "live-bindings", "dynamic-import"]
questions:
  - "Почему переменная, не попавшая в `export`, недоступна в другом файле и чем это отличается от обычных `<script>`"
  - "Как `exports` связан с `module.exports` и почему присваивание `exports = {}` не меняет экспорт"
  - "Почему `import()` возвращает Promise, а не сам модуль, и как получить его содержимое"
  - "Как вынос общего кода в третий модуль разрывает цикл A ↔ B"
  - "Что произойдёт, если модуль с полифиллом не отмечен в `sideEffects`"
  - "Почему top-level await возможен в ESM, но не в CJS"
answers:
  - "Переменные верхнего уровня видны только внутри модуля, пока их не экспортировали. Обычные `<script>` делят одну глобальную область, поэтому два `const name` конфликтуют, а порядок подключения решает всё."
  - "`exports` — ссылка на `module.exports`. Присваивание `exports = {}` переписывает локальную переменную и разрывает связь, поэтому `require` вернёт прежний объект; экспорт меняют через `module.exports = {}`."
  - "Загрузка модуля асинхронна, поэтому результат приходит позже; содержимое получают через `await import(...)` или `.then`. Так код подгружают по клику или условию, а не при старте."
  - "Общий модуль C не импортирует ни A, ни B, поэтому граф становится ациклическим: C выполняется раньше обоих, и порядок загрузки перестаёт зависеть от цикла."
  - "Сборщик считает импорт без использованных экспортов бесполезным и удаляет его вместе с побочным эффектом, например полифиллом или CSS, хотя код в файле есть."
  - "Граф ESM известен до выполнения, поэтому его можно загружать и ждать асинхронно. CJS выполняет `require` синхронно, как обычный код, и ждать там нечего."
---

# Модули: ESM и CJS

Ты запускаешь приложение, и в консоли появляется `ReferenceError: Cannot access 'config' before initialization`. Файл `config.js` существует, импорт написан, опечаток нет. Причина обычно в циклическом импорте: два модуля тянут друг друга, и один из них выполняется раньше, чем его переменные готовы. Чтобы такое понять, нужно знать, когда в модулях выполняется код и что именно передаётся из одного файла в другой.

## Содержание

1. [Зачем нужны модули](#зачем-нужны-модули)
2. [ES Modules: import/export](#es-modules-importexport)
3. [CommonJS: require/module.exports](#commonjs-requiremoduleexports)
4. [Динамический импорт `import()`](#динамический-импорт-import)
5. [Циклические зависимости](#циклические-зависимости)
6. [Разница между ESM и CJS](#разница-между-esm-и-cjs)
7. [Tree shaking и side effects](#tree-shaking-и-side-effects)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Зачем нужны модули

Без модулей все файлы пишут в одну глобальную область. Два скрипта объявляют `const name` и ломают друг друга, а порядок подключения `<script>` начинает решать всё. Модуль создаёт собственную область: переменные верхнего уровня видны только внутри него, пока их явно не экспортировали.

```js
// utils.js
const secret = 'hidden'; // не экспортировано — доступно только внутри модуля
export const name = 'utils';
```

```js
// main.js
import { name } from './utils.js';
console.log(name);   // utils
console.log(secret); // ReferenceError: secret is not defined
```

---

## ES Modules: import/export

ES Modules — стандарт, введённый в ES2015. Его используют браузеры (через `<script type="module">`) и Node.js (для файлов `.mjs` или при `"type": "module"` в `package.json`).

### Именованные экспорты

```js
// math.js
export const PI = 3.14159;

export function sum(a, b) {
  return a + b;
}
```

```js
// main.js
import { PI, sum } from './math.js';

console.log(PI);        // 3.14159
console.log(sum(2, 3)); // 5
```

### Дефолтный экспорт

У модуля может быть только один `default`-экспорт. Обычно его берут для главной сущности файла:

```js
// logger.js
export default function log(message) {
  console.log(`[LOG] ${message}`);
}
```

```js
// main.js
import log from './logger.js';

log('Hello'); // [LOG] Hello
```

### Смешанный экспорт и переименование

```js
// api.js
export const BASE_URL = '/api';

export default function fetchUser(id) {
  return fetch(`${BASE_URL}/users/${id}`);
}
```

```js
import fetchUser, { BASE_URL } from './api.js';
import { sum as add } from './math.js';
import * as math from './math.js';

console.log(add(1, 2));
console.log(math.PI);
```

### Re-export

Файл `index.js` часто собирает публичный API папки в одном месте:

```js
// index.js
export { sum, PI } from './math.js';
export { default as logger } from './logger.js';
```

---

## CommonJS: require/module.exports

CommonJS — система модулей Node.js. Она появилась раньше ES Modules и до сих пор широко используется в библиотеках и старом коде.

```js
// math.js
const PI = 3.14159;

function sum(a, b) {
  return a + b;
}

module.exports = { PI, sum };
```

```js
// main.js
const { PI, sum } = require('./math.js');

console.log(PI);
console.log(sum(2, 3));
```

### Ловушка с `exports`

`exports` — ссылка на `module.exports`. Добавлять свойства через неё можно, а перезаписывать — нет:

```js
module.exports.foo = 1; // работает
exports.bar = 2;        // работает: тот же объект

exports = { foo: 1 };   // ломает ссылку: module.exports не изменился
```

Эта ошибка встречается часто: человек пишет `exports = ...` и удивляется, почему импорт возвращает пустой объект. Решение — всегда писать `module.exports = ...`, если нужен новый объект.

---

## Динамический импорт `import()`

`import()` возвращает Promise и загружает модуль тогда, когда он действительно нужен. Самый частый пример — административная панель, которую видит только часть пользователей:

```js
if (user.isAdmin) {
  const { adminPanel } = await import('./admin.js');
  adminPanel.init();
}
```

Так код панели не попадает в основной бандл, и обычный пользователь её не скачивает. То же правило работает для ленивых маршрутов в React:

```js
const LazyComponent = React.lazy(() => import('./HeavyComponent.jsx'));
```

В CJS-окружении для такой загрузки обычно используют `require`, но `import()` работает и там.

---

## Циклические зависимости

**Циклическая зависимость** возникает, когда модуль A импортирует B, а B импортирует A. Такое часто случается незаметно: `user.js` импортирует `permissions.js` ради проверки прав, а тот импортирует `user.js` ради типа.

```js
// a.js
import { b } from './b.js';
export const a = 'a';
console.log(b);
```

```js
// b.js
import { a } from './a.js';
export const b = 'b';
console.log(a);
```

Запусти `a.js` — и в `b.js` получишь `ReferenceError: Cannot access 'a' before initialization`.

### Что происходит в ESM

ESM сначала связывает все модули графа, а потом выполняет их в порядке зависимостей. Когда `a.js` импортирует `b.js`, сначала выполняется `b.js`, и `a.js` при этом ещё не выполнялся. Его переменная `a` создана, но находится в **temporal dead zone** (TDZ): обращаться к ней нельзя до строки объявления.

Для `const` и `let` это даёт `ReferenceError`. Для функционального объявления (`export function`) всё иначе: функции поднимаются вместе с модулем, поэтому их можно вызвать из цикла без ошибки.

### Что происходит в CJS

CJS не связывает модули заранее. Когда цикл замыкается, `require` возвращает текущее состояние `module.exports` того модуля, который ещё не завершился. Обычно это пустой объект `{}`. Ошибки не будет, но свойство окажется `undefined`, и код упадёт позже, в неожиданном месте.

### Как бороться

- Вынести общий код в третий модуль, от которого зависят оба. Чаще всего это лучший вариант.
- Перенести обращение к импорту внутрь функции, которая вызывается после инициализации. Для ESM подойдёт `await import()`.
- Пересмотреть архитектуру: цикл обычно означает, что два модуля отвечают за одно и то же.

```js
// вместо импорта на верхнем уровне
export async function init() {
  const { a } = await import('./a.js');
  return a;
}
```

---

## Разница между ESM и CJS

| Особенность | ES Modules | CommonJS |
|---|---|---|
| Синтаксис | `import` / `export` | `require` / `module.exports` |
| Выполнение | Зависимости известны до запуска кода | `require` выполняется по мере вызова |
| Top-level await | Поддерживается | Не поддерживается |
| Strict mode | Всегда включён | Зависит от файла |
| Значения | Live bindings: импорт связан с экспортом | Копия значения на момент `require` |
| `this` на верхнем уровне | `undefined` | `module.exports` |
| Браузер | Нативно через `<script type="module">` | Нужен сборщик |

### Live bindings

В ESM импорт — это ссылка на экспорт, а не копия. Если экспорт меняется, импортёр видит новое значение:

```js
// counter.js
export let count = 0;

export function increment() {
  count++;
}
```

```js
// main.js
import { count, increment } from './counter.js';

console.log(count); // 0
increment();
console.log(count); // 1
```

В CJS так не получится: `require` копирует значение в момент импорта.

```js
// counter.js
let count = 0;

function increment() {
  count++;
}

module.exports = { count, increment };
```

```js
const { count, increment } = require('./counter.js');

console.log(count); // 0
increment();
console.log(count); // 0 — копия не изменилась
```

Чтобы получить актуальное значение, экспортируй getter:

```js
module.exports = {
  get count() { return count; },
  increment,
};
```

### Статический и динамический анализ

ESM известен до запуска, поэтому сборщик видит, какие имена используются, ещё до выполнения. CJS можно вызвать внутри `if`, цикла или функции, и заранее понять, что реально понадобится, сложнее. Именно поэтому tree shaking с CJS работает хуже.

---

## Tree shaking и side effects

**Tree shaking** — удаление неиспользуемого кода при сборке. Представь библиотеку утилит на сто функций, из которой ты взял одну. Без tree shaking в бандл попадут все сто.

```js
// utils.js
export function used() { /* ... */ }
export function unused() { /* ... */ }
```

```js
// main.js
import { used } from './utils.js';
used();
```

Сборщик может удалить `unused`, потому что её никто не вызывает. Но удалить можно только код **без побочных эффектов** (side effects): изменения глобального состояния, регистрации полифиллов, инициализации библиотеки.

### Файлы с побочными эффектами

```js
// polyfill.js
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function () { /* ... */ };
}
```

Из этого файла ничего не импортируют, и сборщик мог бы решить, что он не нужен. Но без него `toSorted` не появится. Поэтому в `package.json` библиотеки перечисляют файлы, которые нельзя трогать:

```json
{
  "sideEffects": ["./src/polyfill.js", "*.css"]
}
```

Если указать `sideEffects: false`, сборщик будет считать, что любой неиспользуемый файл можно удалить. Это сильное утверждение: ошибка в нём стоит тихо сломанного поведения, поэтому его ставят только там, где уверены.

---

## Ключевые тезисы для интервью

- ESM загружает и связывает зависимости до выполнения кода, CJS выполняет `require` по мере вызова.
- Именованные экспорты отдают несколько значений по имени, дефолтный — один на модуль; обе формы можно смешивать в одном файле.
- В цикле ESM `export const` ещё в TDZ и даёт `ReferenceError`, функции при этом доступны; CJS возвращает неполный `module.exports`.
- Циклы устраняют выносом общего кода в третий модуль или отложенным `import()`.
- В ESM импорт — live binding, в CJS `require` копирует значение на момент вызова.
- `import()` — точка разделения бандла: тяжёлый код, не нужный на старте, не попадает в первый бандл.
- Tree shaking опирается на статические `import`/`export`; файлы с побочными эффектами помечают через `sideEffects`.

## Заключение

ESM и CJS решают одну задачу по-разному. ESM известен заранее, связывает модули через live bindings и даёт сборщику возможность убрать лишний код. CJS выполняется по мере вызова и копирует значения. Большинство неприятных ошибок с модулями сводятся к двум вопросам: кто что импортирует и в какой момент это значение становится доступным. Если цикл попадает в проект, сначала стоит вынести общий код, а не подпирать его динамическим импортом.

## Полезные ссылки

- [Modules — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [import — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [CommonJS vs ES Modules](https://nodejs.org/api/esm.html#commonjs-vs-es-modules)
- [export — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
