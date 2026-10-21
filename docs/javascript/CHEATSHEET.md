# Шпаргалка: JavaScript

## Типы и приведение

- **Примитивы:** string, number, bigint, boolean, undefined, null, symbol · остальное — object
- **typeof:** `null` → "object", функция → "function", `NaN` → "number"
- **Сравнение:** `==` (coercion), `===`, `Object.is` (NaN, ±0)
- **Приведение:** `+` → строка, `- * /` → число, ToPrimitive (valueOf → toString)
- **Falsy:** `0`, `""`, `null`, `undefined`, `NaN`, `false` · ловушка `0.1 + 0.2`

## Scope, замыкания, this

- **Переменные:** var (func, ⬆ undefined), let и const ({}, ⬆ TDZ)
- **Hoisting:** function declaration (целиком), expression / arrow (как переменная), class (TDZ)
- **Замыкание:** функция + лексическое окружение, жизнь окружения после выхода
- **Применение и ловушки:** приватные данные, фабрики, мемоизация · var в цикле, stale closure
- **this:** вызов (undefined в strict), метод, `new`, call / apply / bind, arrow (лексический)
- **Потеря this:** callback, деструктуризация метода → bind, стрелка

## Асинхронность

- **Promise:** pending → fulfilled / rejected, then / catch / finally
- **Комбинаторы:** all (fail-fast), allSettled, race, any (первый успешный)
- **async/await:** последовательно vs параллельно, try/catch, AbortController
- **Event Loop:** call stack, macrotask (setTimeout, I/O), microtask (then, queueMicrotask)
- **Порядок:** sync → все микрозадачи → render → одна макрозадача

## Объекты, классы, модули

- **Прототипы:** `[[Prototype]]`, `F.prototype`, цепочка, `Object.create`
- **Классы:** сахар над прототипами, extends / super, `#private`, static
- **instanceof:** проход по цепочке прототипов
- **ESM vs CJS:** static / runtime, live bindings / копия, async / sync
- **Модули:** named / default, `import()` (code splitting), tree shaking, циклические зависимости

## Продвинутые возможности

- **Коллекции:** Map (любые ключи), Set (уникальность), WeakMap / WeakSet (GC, без итерации)
- **Итераторы:** `Symbol.iterator`, `next()` → `{ value, done }`, for...of, spread
- **Генераторы:** `function*`, yield, ленивость, бесконечные последовательности
- **Proxy и Reflect:** target + handler, ловушки get / set, Reflect (дефолтное поведение)
- **Применение Proxy:** валидация, логирование, реактивность (Vue 3) · ограничения: `#private`
- **ФП:** чистые функции, иммутабельность, функции высшего порядка
- **Массивы:** map, filter, reduce, мутирующие vs toSorted / toReversed
- **Композиция:** каррирование, compose / pipe, debounce / throttle

## Браузер и память

- **DOM и события:** querySelector, capture → target → bubble, делегирование
- **Память:** стек (примитивы), куча (объекты), достижимость
- **GC:** Mark-and-Sweep, поколения (young → old)
- **Утечки:** слушатели, таймеры, замыкания, detached DOM, кэши без лимита

## Сложность

- **Big O:** O(1), O(log n), O(n), O(n log n), O(n²), time vs space
- **Оптимизация:** хеш-таблица вместо вложенного цикла, два указателя, мемоизация
- **Сложность в JS:** shift / unshift O(n), includes O(n), Map / Set has O(1), sort O(n log n)
