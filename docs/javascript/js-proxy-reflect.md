---
title: "Proxy и Reflect"
section: javascript
description: "Как Proxy перехватывает операции над объектами, зачем нужен Reflect и как на этих механизмах устроена реактивность Vue 3, включая ловушки receiver и ограничения."
order: 11
tags: ["proxy", "reflect", "traps", "receiver", "reactivity", "vue"]
questions:
  - "Почему мемоизация через `Proxy` перестаёт работать для рекурсивной функции и как это исправить"
  - "Что происходит с выражением `state.count++` и почему в нём участвуют и `get`, и `set`"
  - "Чем `Proxy.revocable` отличается от обычного прокси и когда операции над ним начинают бросать `TypeError`"
  - "Почему `===` не перехватывается ловушками, а `instanceof` до них доходит"
  - "Почему ловушки `Map` требуют отдельной обработки и что должна возвращать ловушка `get`, чтобы методы коллекции работали"
answers:
  - "Имя `fib` внутри именованного function expression указывает на исходную функцию, а не на прокси, поэтому рекурсивные вызовы обходят кэш. Исправляется тем, что рекурсия вызывает внешнюю переменную, которой присвоен прокси."
  - "Чтение `state.count` вызывает ловушку `get`, а присваивание результата вызывает ловушку `set`. Vue на чтении запоминает эффект через `track`, а на записи перезапускает его через `trigger`."
  - "`Proxy.revocable` возвращает пару `proxy` и `revoke`; после вызова `revoke()` любая операция над прокси выбрасывает `TypeError`. Это удобно, когда доступ к объекту нужно отозвать."
  - "`===` сравнивает ссылки и не обращается к ловушкам. `instanceof` проверяет цепочку прототипов через внутреннюю операцию `getPrototypeOf`, поэтому ловушка `getPrototypeOf` срабатывает именно там."
  - "Методы `Map` проверяют внутренние слоты, которых у прокси нет, поэтому `proxy.get(...)` бросает `TypeError`. Ловушка `get` должна возвращать методы, привязанные к цели, как это делает Vue для коллекций."
---

# Proxy и Reflect

Ты пишешь `state.count++`, и интерфейс обновляется. Ни одного вызова `setState` или `forceUpdate` нет, и это не магия: Vue понимает, что свойство изменилось, в момент самой записи. Так же можно запретить отрицательный возраст в любом месте программы, не переписывая все присваивания. Оба приёма строятся на `Proxy`: объект оборачивается, и операции над ним проходят через наш код. `Reflect` помогает в этой обёртке вести себя как обычный объект, не повторяя стандартную логику вручную.

## Содержание

1. [Что такое Proxy](#что-такое-proxy)
2. [Ловушки `get` и `set`](#ловушки-get-и-set)
3. [Другие ловушки](#другие-ловушки)
4. [Reflect](#reflect)
5. [Практические примеры](#практические-примеры)
6. [Proxy в реальных фреймворках: Vue 3](#proxy-в-реальных-фреймворках-vue-3)
7. [Ограничения Proxy](#ограничения-proxy)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Proxy

`Proxy` оборачивает целевой объект. Вместо прямого доступа ты передаёшь набор функций-обработчиков, которые называются **ловушками** (traps):

```js
const target = { name: 'Alice', age: 30 };

const handler = {
  get(target, prop) {
    console.log(`Reading ${prop}`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`Setting ${prop} to ${value}`);
    target[prop] = value;
    return true;
  },
};

const proxy = new Proxy(target, handler);

console.log(proxy.name); // Reading name → Alice
proxy.age = 31;          // Setting age to 31
```

Для операций без ловушки всё работает как обычно: они выполняются над целевым объектом. Поэтому прокси можно добавить постепенно, перехватывая только то, что нужно.

---

## Ловушки `get` и `set`

Чтение и запись свойств — самые частые ловушки. Именно через них удобно проверять данные и задавать значения по умолчанию.

### Валидация через `set`

Представь форму, где возраст нельзя записать отрицательным. Проверку можно поставить в одном месте, а не в каждом обработчике ввода:

```js
const user = {
  name: 'Alice',
  age: 30,
};

const validator = new Proxy(user, {
  set(target, prop, value) {
    if (prop === 'age' && (typeof value !== 'number' || value < 0)) {
      throw new TypeError('Age must be a positive number');
    }
    target[prop] = value;
    return true;
  },
});

validator.age = 31; // OK
validator.age = -1; // TypeError
```

Обрати внимание на `return true`. В strict-режиме (а модули и классы работают именно в нём) ловушка `set`, которая вернула ложное значение, заставляет присваивание выбросить `TypeError`. Ловушка обязана явно сообщить, что запись прошла.

### Значения по умолчанию через `get`

Настройки с запасным значением, которое выдаётся для неизвестных ключей:

```js
const defaults = { theme: 'light' };

const settings = new Proxy(defaults, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    console.warn(`Unknown setting: ${prop}`);
    return null;
  },
});

console.log(settings.theme);    // 'light'
console.log(settings.language); // предупреждение → null
```

---

## Другие ловушки

| Ловушка | Перехватывает |
|---|---|
| `get` | Чтение свойства |
| `set` | Запись свойства |
| `has` | Оператор `in` |
| `deleteProperty` | Оператор `delete` |
| `ownKeys` | `Object.keys`, `for...in`, `Object.getOwnPropertyNames` |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor` |
| `defineProperty` | `Object.defineProperty` |
| `apply` | Вызов функции |
| `construct` | Вызов через `new` |
| `getPrototypeOf` / `setPrototypeOf` | Работу с прототипом |

### `has` и `deleteProperty`

Приватные ключи с префиксом `_` можно скрыть от проверок и защитить от удаления:

```js
const data = { public: 1, _private: 2 };

const proxy = new Proxy(data, {
  has(target, prop) {
    if (String(prop).startsWith('_')) return false;
    return prop in target;
  },
  deleteProperty(target, prop) {
    if (String(prop).startsWith('_')) {
      throw new Error('Cannot delete private property');
    }
    delete target[prop];
    return true;
  },
});

console.log('public' in proxy);   // true
console.log('_private' in proxy); // false
delete proxy.public;              // OK
// delete proxy._private;         // Error
```

### `ownKeys`

Фильтр перечисления: `Object.keys` и `for...in` видят только то, что разрешил обработчик:

```js
const obj = { a: 1, _b: 2, c: 3 };

const proxy = new Proxy(obj, {
  ownKeys(target) {
    return Object.keys(target).filter((key) => !key.startsWith('_'));
  },
});

console.log(Object.keys(proxy)); // ['a', 'c']
```

### `apply` и `construct`

Ловушки для функций и классов позволяют логировать вызовы без изменения самих функций:

```js
function sum(a, b) {
  return a + b;
}

const loggedSum = new Proxy(sum, {
  apply(target, thisArg, args) {
    console.log(`Called with ${args}`);
    return Reflect.apply(target, thisArg, args);
  },
});

console.log(loggedSum(2, 3)); // Called with 2,3 → 5
```

```js
class User {
  constructor(name) {
    this.name = name;
  }
}

const LoggedUser = new Proxy(User, {
  construct(target, args) {
    console.log(`Creating user ${args[0]}`);
    return Reflect.construct(target, args);
  },
});

const user = new LoggedUser('Alice'); // Creating user Alice
```

---

## Reflect

`Reflect` — набор функций, которые выполняют те же внутренние операции, что и синтаксис: `Reflect.get` соответствует чтению, `Reflect.set` записи, `Reflect.has` оператору `in`. Внутри ловушек их удобно вызывать вместо того, чтобы переписывать стандартное поведение руками.

```js
const user = { name: 'Alice' };

const proxy = new Proxy(user, {
  get(target, prop, receiver) {
    console.log(`Reading ${prop}`);
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    console.log(`Setting ${prop}`);
    return Reflect.set(target, prop, value, receiver);
  },
});

proxy.name = 'Bob';
console.log(proxy.name); // Setting name, Reading name, Bob
```

У `Reflect` есть три преимущества перед прямым доступом:

- **Передача `receiver`.** Третий аргумент задаёт `this` для геттеров и сеттеров. Без него поведение прокси расходится с обычным объектом.
- **Булев результат.** `Reflect.set` возвращает `true` или `false`, а не выбрасывает исключение или молча проваливается. Это как раз то, что ожидает ловушка `set`.
- **Одинаковые имена с ловушками.** Каждый метод `Reflect` соответствует ловушке, поэтому код читается парами.

### Пример с `receiver`

Чтобы понять, зачем нужен `receiver`, посмотри на объект, который наследует от прокси:

```js
const parent = {
  _name: 'Alice',
  get name() {
    return this._name;
  },
};

const proxy = new Proxy(parent, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
});

const child = Object.create(proxy);
child._name = 'Bob';

console.log(child.name); // Bob
```

Поиск `name` начинается с `child`, не находит его и идёт к прокси. Ловушка `get` получает `receiver === child`, и `Reflect.get` вызывает геттер с `this = child`. Значит, `this._name` читает `'Bob'`.

Если заменить `Reflect.get(target, prop, receiver)` на `target[prop]`, геттер получит `this = parent`, и результат будет `'Alice'`. Так теряется контекст, с которым искали свойство.

---

## Практические примеры

### Логирование доступа

Обёртка, которая пишет в лог каждое чтение и запись:

```js
function createLoggedObject(target) {
  return new Proxy(target, {
    get(target, prop, receiver) {
      console.log(`GET ${String(prop)}`);
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      console.log(`SET ${String(prop)} = ${value}`);
      return Reflect.set(target, prop, value, receiver);
    },
  });
}

const user = createLoggedObject({ name: 'Alice' });
user.name;
user.age = 30;
```

Явные параметры здесь читаются лучше, чем `Reflect.get(...arguments)`: аргументы видны и не зависят от того, сколько их передали.

### Реактивность (упрощённо)

Прокси, который вызывает колбэк при каждом реальном изменении значения:

```js
function createReactive(target, onChange) {
  return new Proxy(target, {
    set(target, prop, value) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value);
      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      return result;
    },
  });
}

const state = createReactive({ count: 0 }, (prop, value) => {
  console.log(`${prop} changed to ${value}`);
});

state.count++; // count changed to 1
```

### Мемоизация и рекурсия

Кэширование вызовов через ловушку `apply` выглядит элегантно:

```js
function memoize(fn) {
  const cache = new Map();

  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);

      const result = Reflect.apply(target, thisArg, args);
      cache.set(key, result);
      return result;
    },
  });
}
```

Но с рекурсией есть подвох. Если написать `memoize(function fib(n) { ... fib(n - 1) ... })`, имя `fib` внутри функции указывает на исходную функцию, а не на прокси. Рекурсивные вызовы обходят кэш, и `fib(40)` остаётся экспоненциальным.

Работает вариант, где рекурсия обращается к внешней переменной, которой присвоен прокси:

```js
let fib = memoize((n) => (n <= 1 ? n : fib(n - 1) + fib(n - 2)));

console.log(fib(40)); // быстро: каждое n считается один раз
```

---

## Proxy в реальных фреймворках: Vue 3

Реактивность Vue 3 построена на `Proxy`. Во Vue 2 использовался `Object.defineProperty`, и разница объясняет, почему переход был важным.

### Почему именно Proxy

`Object.defineProperty` работает с конкретными существующими свойствами. Поэтому:

- новое свойство, добавленное в объект, не отслеживалось (нужен был `Vue.set`);
- изменение элемента массива по индексу требовало обходных путей;
- `delete` не отслеживался.

`Proxy` перехватывает операции над самим объектом: `get`, `set`, `deleteProperty`, `has`, `ownKeys`. Vue 3 видит любое изменение, и отдельные методы для добавления свойств больше не нужны.

### Упрощённая реактивность в духе Vue 3

```js
const targetMap = new WeakMap();
let activeEffect = null;

function track(target, prop) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(prop);
  if (!dep) {
    dep = new Set();
    depsMap.set(prop, dep);
  }

  dep.add(activeEffect);
}

function trigger(target, prop) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(prop);
  if (dep) {
    dep.forEach((effect) => effect());
  }
}

function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

function reactive(target) {
  return new Proxy(target, {
    get(target, prop, receiver) {
      track(target, prop);
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      if (oldValue !== value) {
        trigger(target, prop);
      }
      return result;
    },
    deleteProperty(target, prop) {
      const hadKey = prop in target;
      const result = Reflect.deleteProperty(target, prop);
      if (hadKey) {
        trigger(target, prop);
      }
      return result;
    },
  });
}
```

Это упрощение: настоящий Vue хранит эффекты точнее и заботится о вложенных вызовах и очистке. Но принцип тот же.

### Как это работает

```js
const state = reactive({ count: 0 });

watchEffect(() => {
  console.log('count =', state.count);
});

state.count++; // count = 1
state.count++; // count = 2
```

1. `watchEffect` запускает функцию, и она читает `state.count`.
2. Ловушка `get` вызывает `track`: эффект запоминается за парой «объект и свойство».
3. Присваивание `state.count++` попадает в ловушку `set`, которая вызывает `trigger`.
4. `trigger` находит эффекты, зависящие от `count`, и перезапускает их.

Вложенные объекты Vue оборачивает лениво, при первом доступе. Это экономит память: большое дерево состояния не превращается в прокси целиком. Примитивные значения, которые не могут быть объектами, Vue хранит в `ref`. Доступ к `.value` в нём идёт через геттер и сеттер класса, а не через Proxy.

---

## Ограничения Proxy

1. **Только объекты.** `Proxy` нельзя создать над примитивом.

   ```js
   new Proxy(42, {}); // TypeError
   ```

2. **Прокси похож на цель, но не равен ей.** `typeof` возвращает то же самое, что и для цели: прокси функции — `'function'`, прокси объекта — `'object'`. Но `proxy === target` даёт `false`: это разные ссылки.

3. **Не все операции перехватываются одинаково.** `===` не перехватывается вовсе. `instanceof` проходит через ловушку `getPrototypeOf`, а не через `get`.

4. **Встроенные коллекции.** Методы `Map` и `Set` проверяют внутренние слоты, которых у прокси нет:

   ```js
   const proxy = new Proxy(new Map(), {});
   proxy.get('x'); // TypeError: метод вызван на несовместимом получателе
   ```

   Чтобы это работало, ловушка `get` должна возвращать методы, привязанные к цели. Именно поэтому Vue использует отдельные обработчики для коллекций.

5. **Производительность.** Каждая операция через ловушку медленнее прямого доступа. Оборачивать всё подряд не стоит.

6. **Отзываемый прокси.** `Proxy.revocable` возвращает прокси, который можно выключить:

   ```js
   const { proxy, revoke } = Proxy.revocable({ value: 42 }, {});
   console.log(proxy.value); // 42
   revoke();
   console.log(proxy.value); // TypeError
   ```

---

## Ключевые тезисы для интервью

- `Proxy` перехватывает базовые операции через ловушки (`get`, `set`, `has`, `deleteProperty`, `ownKeys`, `apply`, `construct`); операции без ловушки идут к цели напрямую.
- В strict-режиме ловушка `set` обязана вернуть `true`, иначе присваивание выбросит `TypeError`; `Reflect.set` возвращает нужный булев результат.
- `receiver` в `Reflect.get` задаёт `this` для геттеров и сеттеров; подстановка `target[prop]` теряет контекст поиска.
- Vue 3 строит реактивность на `Proxy`: ловушка `get` вызывает `track`, ловушка `set` и `deleteProperty` вызывают `trigger`, эффекты хранятся по паре объект и свойство.
- Vue 3 видит добавление и удаление свойств без `Vue.set`, потому что перехватывает операции над объектом, а Vue 2 на `Object.defineProperty` работал с существующими свойствами.
- Прокси работает только с объектами, а каждая операция через ловушку медленнее прямого доступа, поэтому оборачивать всё подряд не стоит.

## Заключение

`Proxy` и `Reflect` дают контроль над тем, что происходит при обращении к объекту: чтение, запись, перечисление, вызов. Именно поэтому на них держится реактивность Vue 3: изменение свойства становится событием, на которое можно подписаться без явных вызовов. Главное, что нужно помнить: ловушка `set` должна вернуть `true`, `receiver` важен для геттеров, а у `Map` и `Set` есть собственные ограничения. Попробуй написать свой валидатор или простую реактивную обёртку: после этого ловушки перестанут быть абстракцией.

## Полезные ссылки

- [Proxy — MDN](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Reflect — MDN](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [JavaScript Proxy — javascript.info](https://javascript.info/proxy)
- [Reactivity in Depth — Vue 3](https://vuejs.org/guide/extras/reactivity-in-depth.html)
