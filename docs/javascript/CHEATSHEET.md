# Шпаргалка: JavaScript

## Типы и приведение

- **Примитивы:** string, number, bigint, boolean, undefined, null, symbol · всё остальное — object
- **typeof:** `null` → "object", функция → "function", `NaN` → "number"
- **Сравнение:** `==` (coercion), `===`, `Object.is` (NaN, ±0), `Number.isNaN`
- **Приведение:** явное (String, Number, Boolean), неявное (`+` → строка, `- * /` → число), ToPrimitive (`Symbol.toPrimitive` → valueOf → toString)
- **Falsy:** `0`, `0n`, `""`, `null`, `undefined`, `NaN`, `false`
- **Ловушки:** `0.1 + 0.2`, `[] + {}`, `[] == false`

## Scope, замыкания, this

- **Переменные:** var (func, ⬆ undefined), let и const ({}, ⬆ TDZ)
- **Scope:** глобальная, функциональная, блочная, лексическое окружение, scope chain
- **Hoisting:** function declaration (целиком), expression / arrow (как переменная), class (TDZ)
- **Замыкание:** функция + `[[Environment]]`, жизнь окружения после выхода
- **Применение:** приватные данные, фабрики, каррирование, IIFE, модульный паттерн, мемоизация
- **Ловушки замыканий:** var в цикле, stale closure (React), утечки
- **this:** обычный вызов (window / undefined в strict), метод (obj.), `new`, call / apply / bind, arrow (лексический)
- **Потеря this:** callback, setTimeout, деструктуризация метода → bind, стрелка, поле-стрелка в классе

## Асинхронность

- **Promise:** pending → fulfilled / rejected, then / catch / finally, цепочки
- **Комбинаторы:** all (fail-fast), allSettled, race (первый любой), any (первый успешный, AggregateError)
- **async/await:** последовательно vs параллельно, try/catch, unhandled rejection, AbortController
- **Event Loop:** call stack, Web API, macrotask (setTimeout, I/O, события), microtask (then, queueMicrotask, MutationObserver), rAF
- **Порядок:** sync → все микрозадачи → render → одна макрозадача
- **Node.js:** `process.nextTick` (до микрозадач), setImmediate
- **Блокировка:** тяжёлый sync-код, бесконечные микрозадачи → Web Workers, разбиение на чанки

## Объекты, классы, модули

- **Прототипы:** `[[Prototype]]` / `__proto__`, `F.prototype`, цепочка, `Object.create`, get / setPrototypeOf
- **Классы:** сахар над прототипами, constructor, extends / super, `#private`, static, TDZ, вызов без new → TypeError
- **instanceof:** проход по цепочке, ограничения (realm, `Symbol.hasInstance`)
- **ESM vs CJS:** static / runtime, live bindings / копия, async / sync
- **Экспорт:** named, default, re-export, `import()` (code splitting)
- **Нюансы модулей:** циклические зависимости, tree shaking, sideEffects

## Продвинутые возможности

- **Коллекции:** Map (любые ключи, порядок, size), Set (уникальность), WeakMap / WeakSet (ключи-объекты, GC, без итерации)
- **Итераторы:** `Symbol.iterator`, `next()` → `{ value, done }`, for...of, spread, деструктуризация
- **Генераторы:** `function*`, yield, `next(value)`, ленивость, бесконечные последовательности
- **Proxy:** target + handler, get / set / has / deleteProperty / ownKeys / apply / construct, revocable
- **Reflect:** дефолтное поведение, receiver, boolean вместо throw
- **Применение Proxy:** валидация, логирование, дефолты, реактивность (Vue 3)
- **Ограничения Proxy:** proxy !== target, `#private`, внутренние слоты (Map, Date), производительность
- **ФП:** чистые функции, side effects, иммутабельность, функции высшего порядка
- **Массивы:** map, filter, reduce, find, some / every, мутирующие vs toSorted / toReversed / with
- **Композиция:** каррирование, частичное применение, compose / pipe
- **Тайминги:** debounce (после паузы), throttle (раз в N мс)

## Браузер

- **DOM:** querySelector, createElement / append / remove, classList, dataset
- **События:** addEventListener, capture → target → bubble, делегирование, preventDefault / stopPropagation

## Память и сложность

- **Память:** стек (примитивы, фреймы), куча (объекты), достижимость
- **GC:** Mark-and-Sweep, поколения (young → old), stop-the-world
- **Утечки:** глобальные, слушатели, таймеры, замыкания, detached DOM, кэши без лимита
- **Инструменты:** DevTools Memory (heap snapshot, allocation timeline), WeakRef, FinalizationRegistry
- **Big O:** O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), time vs space
- **Оптимизация:** хеш-таблица вместо вложенного цикла, два указателя, скользящее окно, мемоизация
- **Сложность в JS:** push / pop O(1), shift / unshift O(n), includes O(n), Map / Set has O(1), sort O(n log n)
