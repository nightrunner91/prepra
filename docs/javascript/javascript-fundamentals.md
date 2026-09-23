---
title: "Основы JavaScript: от переменных до DOM"
section: javascript
description: "Фундамент JavaScript для начинающих: что такое JS, история языка, переменные, типы данных, функции, объекты, массивы, работа с DOM и событиями. Всё, что нужно знать перед изучением продвинутых тем."
order: 1
tags: ["javascript-basics", "variables", "functions", "objects", "arrays", "dom", "events"]
questions:
  - "Почему var считается устаревшим и чем его функциональная область видимости отличается от блочной у let и const"
  - "Как динамическая типизация JavaScript влияет на сравнение значений и почему `===` предпочтительнее `==`"
  - "Чем function declaration отличается от arrow function и как стрелочные функции решают проблему потери this в callback"
  - "Как методы массивов map, filter и reduce позволяют трансформировать данные без мутации исходного массива"
  - "Как DOM представляет HTML в виде дерева объектов и какие API используются для выбора, изменения и создания элементов"
  - "Как работает всплытие событий (bubbling) и почему делегирование событий эффективнее, чем обработчик на каждом элементе"
  - "Как эволюция от callback через Promise к async/await решает проблему callback hell и упрощает обработку ошибок"
---

# Основы JavaScript: от переменных до DOM

JavaScript — это язык программирования, который делает веб-страницы интерактивными. Если HTML — это скелет страницы, CSS — её одежда, то JavaScript — это мышцы и мозг, которые заставляют всё двигаться и реагировать на действия пользователя. В этой статье разберём самые основы: от объявления переменных и работы с функциями до взаимодействия с DOM и обработки событий. Это фундамент, без которого невозможно понять более сложные темы вроде замыканий, Event Loop или прототипов.

## Содержание

1. [Что такое JavaScript и зачем он нужен](#что-такое-javascript-и-зачем-он-нужен)
2. [Переменные: var, let и const](#переменные-var-let-и-const)
3. [Типы данных](#типы-данных)
4. [Операторы и условия](#операторы-и-условия)
5. [Функции](#функции)
6. [Объекты](#объекты)
7. [Массивы](#массивы)
8. [Циклы](#циклы)
9. [Работа с DOM](#работа-с-dom)
10. [События](#события)
11. [Асинхронность: callback, Promise, async/await](#асинхронность-callback-promise-asyncawait)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое JavaScript и зачем он нужен

### Краткая история

JavaScript был создан Бренданом Эйком в 1995 году за 10 дней в компании Netscape. Изначально язык назывался Mocha, затем LiveScript, и наконец JavaScript (маркетинговое название, чтобы ассоциироваться с Java, хотя это совершенно разные языки).

В 1997 году JavaScript стал стандартом ECMAScript (ES). С тех пор язык развивается через ежегодные релизы спецификации: ES6 (2015) принёс классы, модули, стрелочные функции, let/const — то, что мы используем сегодня.

### Где работает JavaScript

**Браузер** — исторически единственная среда. JavaScript позволяет:
- Менять содержимое страницы (DOM)
- Реагировать на действия пользователя (события)
- Отправлять запросы на сервер (fetch, XMLHttpRequest)
- Рисовать графику (Canvas, WebGL)
- Работать с мультимедиа (Audio, Video)

**Сервер** — с 2009 года благодаря Node.js. JavaScript вышел за пределы браузера и теперь используется для:
- Бэкенд-разработки (Express, NestJS)
- CLI-инструментов (webpack, eslint)
- Мобильных приложений (React Native)
- Десктопных приложений (Electron)

### Как запустить JavaScript

**В браузере:**
1. Создайте файл `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Мой первый JS</title>
</head>
<body>
  <h1 id="greeting">Привет, мир!</h1>
  <script src="script.js"></script>
</body>
</html>
```

2. Создайте файл `script.js`:
```js
document.getElementById('greeting').textContent = 'Привет, JavaScript!';
console.log('Скрипт загружен!');
```

3. Откройте `index.html` в браузере и посмотрите в консоль (F12 → Console).

**В Node.js:**
```bash
# Установите Node.js с https://nodejs.org
node script.js
```

**В консоли браузера:**
Нажмите F12, перейдите во вкладку Console и пишите код напрямую.

---

## Переменные: var, let и const

Переменная — это именованный контейнер для хранения данных. В JavaScript есть три способа объявления переменных: `var`, `let` и `const`.

### var (устаревший способ)

```js
var name = 'Alice';
var age = 25;
var name = 'Bob'; // ✅ Можно переобъявить — это проблема!

console.log(name); // 'Bob'
```

**Проблемы var:**
- Можно переобъявить переменную без ошибки
- Имеет функциональную область видимости (function scope), а не блочную
- Поднимается (hoisting) в начало функции

### let (современный способ)

```js
let name = 'Alice';
let age = 25;

name = 'Bob'; // ✅ Можно изменить значение
// let name = 'Charlie'; // ❌ Ошибка: нельзя переобъявить

if (true) {
  let x = 10;
  console.log(x); // 10
}
// console.log(x); // ❌ Ошибка: x не существует вне блока
```

**Особенности let:**
- Нельзя переобъявить в той же области видимости
- Имеет блочную область видимости (block scope)
- Не поднимается (точнее, поднимается, но не инициализируется — temporal dead zone)

### const (константа)

```js
const PI = 3.14159;
// PI = 3; // ❌ Ошибка: нельзя изменить значение константы

const user = { name: 'Alice' };
user.name = 'Bob'; // ✅ Можно изменить свойство объекта
// user = { name: 'Charlie' }; // ❌ Ошибка: нельзя переassignить саму константу

const arr = [1, 2, 3];
arr.push(4); // ✅ Можно мутировать массив
// arr = [5, 6]; // ❌ Ошибка
```

**Особенности const:**
- Нельзя переassignить (изменить ссылку)
- Можно мутировать, если это объект или массив
- Имеет блочную область видимости

### Когда что использовать

**Правило:**
- По умолчанию используйте `const`
- Используйте `let`, если нужно переприсваивать переменную
- Избегайте `var` — он устарел и создаёт проблемы

```js
// ✅ Хорошо
const API_URL = 'https://api.example.com';
let counter = 0;
counter++; // OK

// ❌ Плохо
var oldStyle = 'не используйте var';
```

---

## Типы данных

JavaScript — язык с динамической типизацией. Это значит, что тип значения определяется автоматически, и переменная может хранить значения любого типа.

### Примитивные типы

**1. Number (число)**
```js
const age = 25;          // целое число
const price = 19.99;     // дробное число
const negative = -10;    // отрицательное
const infinity = Infinity;
const notANumber = NaN;  // результат некорректной математической операции

console.log(typeof age);       // 'number'
console.log(typeof NaN);       // 'number' (парадокс!)
console.log(0.1 + 0.2);        // 0.30000000000000004 (проблема floating point)
console.log(0.1 + 0.2 === 0.3); // false
```

**2. String (строка)**
```js
const name = 'Alice';           // одинарные кавычки
const greeting = "Hello";       // двойные кавычки
const template = `Привет, ${name}!`; // шаблонная строка (backticks)

console.log(template);          // 'Привет, Alice!'
console.log(name.length);       // 5
console.log(name.toUpperCase()); // 'ALICE'
console.log(name[0]);           // 'A'
```

**3. Boolean (логический)**
```js
const isActive = true;
const isDeleted = false;

console.log(5 > 3);             // true
console.log(10 === '10');       // false (разные типы)
console.log(10 == '10');        // true (приведение типов — см. следующую статью)
```

**4. undefined**
```js
let x;
console.log(x); // undefined — переменная объявлена, но значение не присвоено

function noReturn() {
  // нет return
}
console.log(noReturn()); // undefined
```

**5. null**
```js
const empty = null;
console.log(empty); // null — явное "ничего"

console.log(typeof null); // 'object' (историческая ошибка в языке)
console.log(typeof undefined); // 'undefined'
```

**6. Symbol (уникальный идентификатор)**
```js
const id1 = Symbol('id');
const id2 = Symbol('id');

console.log(id1 === id2); // false — каждый Symbol уникален

const user = {
  name: 'Alice',
  [id1]: 123 // скрытое свойство
};
```

**7. BigInt (большие целые числа)**
```js
const bigNumber = 9007199254740991n; // добавьте 'n' в конце
const another = BigInt('9007199254740991');
```

### Объектные типы

Всё, что не примитив — объект.

**Обычный объект:**
```js
const user = {
  name: 'Alice',
  age: 25,
  isAdmin: false,
  greet() {
    console.log(`Привет, я ${this.name}`);
  }
};

console.log(user.name);      // 'Alice'
console.log(user['age']);    // 25
user.greet();                // 'Привет, я Alice'
```

**Массив:**
```js
const numbers = [1, 2, 3, 4, 5];
const mixed = [1, 'hello', true, null];

console.log(numbers[0]);     // 1
console.log(numbers.length); // 5
numbers.push(6);             // [1, 2, 3, 4, 5, 6]
```

**Функция:**
```js
function add(a, b) {
  return a + b;
}

const multiply = (a, b) => a * b;

console.log(typeof add);       // 'function'
console.log(add(2, 3));        // 5
console.log(multiply(2, 3));   // 6
```

### Проверка типа: typeof и instanceof

```js
console.log(typeof 42);              // 'number'
console.log(typeof 'hello');         // 'string'
console.log(typeof true);            // 'boolean'
console.log(typeof undefined);       // 'undefined'
console.log(typeof null);            // 'object' (ошибка!)
console.log(typeof {});              // 'object'
console.log(typeof []);              // 'object' (массив — это объект)
console.log(typeof function() {});   // 'function'

// Для массивов используйте Array.isArray
console.log(Array.isArray([1, 2]));  // true
console.log(Array.isArray({}));      // false

// Для проверки типа объекта используйте instanceof
class User {}
const user = new User();
console.log(user instanceof User);   // true
```

---

## Операторы и условия

### Арифметические операторы

```js
const a = 10;
const b = 3;

console.log(a + b);   // 13 — сложение
console.log(a - b);   // 7  — вычитание
console.log(a * b);   // 30 — умножение
console.log(a / b);   // 3.333... — деление
console.log(a % b);   // 1  — остаток от деления
console.log(a ** b);  // 1000 — возведение в степень
```

### Операторы сравнения

```js
console.log(5 > 3);    // true
console.log(5 < 3);    // false
console.log(5 >= 5);   // true
console.log(5 <= 4);   // false

// Важное различие: == vs ===
console.log(5 == '5');   // true  — приводит типы
console.log(5 === '5');  // false — строгое сравнение (рекомендуется)

console.log(5 != '5');   // false
console.log(5 !== '5');  // true  — строгое неравенство (рекомендуется)
```

**Правило:** Всегда используйте `===` и `!==`, чтобы избежать неожиданного поведения из-за приведения типов.

### Логические операторы

```js
// && (И)
console.log(true && true);   // true
console.log(true && false);  // false

// || (ИЛИ)
console.log(true || false);  // true
console.log(false || false); // false

// ! (НЕ)
console.log(!true);          // false
console.log(!false);         // true

// Практический пример
const age = 25;
const hasLicense = true;

if (age >= 18 && hasLicense) {
  console.log('Может водить');
}
```

### Условные конструкции

**if...else:**
```js
const age = 20;

if (age < 18) {
  console.log('Несовершеннолетний');
} else if (age >= 18 && age < 65) {
  console.log('Взрослый');
} else {
  console.log('Пенсионер');
}
```

**Тернарный оператор:**
```js
const age = 20;
const status = age >= 18 ? 'взрослый' : 'ребёнок';
console.log(status); // 'взрослый'

// Эквивалент:
let status2;
if (age >= 18) {
  status2 = 'взрослый';
} else {
  status2 = 'ребёнок';
}
```

**switch:**
```js
const day = 'Monday';

switch (day) {
  case 'Monday':
  case 'Tuesday':
  case 'Wednesday':
  case 'Thursday':
  case 'Friday':
    console.log('Рабочий день');
    break;
  case 'Saturday':
  case 'Sunday':
    console.log('Выходной');
    break;
  default:
    console.log('Неизвестный день');
}
```

---

## Функции

Функция — это блок кода, который можно вызывать многократно. Функции помогают избежать дублирования и сделать код более читаемым.

### Function Declaration

```js
function greet(name) {
  return `Привет, ${name}!`;
}

console.log(greet('Alice')); // 'Привет, Alice!'
console.log(greet('Bob'));   // 'Привет, Bob!'
```

**Особенности:**
- Поднимается (hoisting) — можно вызывать до объявления
- Имеет собственную область видимости

### Function Expression

```js
const greet = function(name) {
  return `Привет, ${name}!`;
};

console.log(greet('Alice')); // 'Привет, Alice!'
```

**Особенности:**
- Не поднимается — нужно объявить перед использованием
- Можно присвоить переменной, передать как аргумент

### Arrow Function (ES6+)

```js
// Полная форма
const greet = (name) => {
  return `Привет, ${name}!`;
};

// Краткая форма (если одно выражение)
const greet = (name) => `Привет, ${name}!`;

// Если один параметр, скобки можно опустить
const greet = name => `Привет, ${name}!`;

// Если нет параметров, нужны пустые скобки
const sayHello = () => 'Привет!';

console.log(greet('Alice')); // 'Привет, Alice!'
```

**Особенности стрелочных функций:**
- Краткий синтаксис
- Не имеют собственного `this` (берут из окружающего контекста)
- Не подходят для методов объектов и конструкторов

### Параметры и аргументы

```js
// Параметры по умолчанию
function greet(name = 'Гость') {
  return `Привет, ${name}!`;
}

console.log(greet('Alice')); // 'Привет, Alice!'
console.log(greet());        // 'Привет, Гость!'

// Rest-параметры (собирают оставшиеся аргументы в массив)
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(1, 2, 3, 4, 5)); // 15
```

### Возврат значения

```js
function add(a, b) {
  return a + b;
}

const result = add(2, 3);
console.log(result); // 5

// Если нет return, функция возвращает undefined
function noReturn() {
  console.log('Привет');
}

console.log(noReturn()); // undefined
```

### Функции как значения первого класса

Функции можно передавать как аргументы, возвращать из других функций и присваивать переменным.

```js
// Функция как аргумент (callback)
function processNumber(num, callback) {
  const result = num * 2;
  callback(result);
}

processNumber(5, (result) => {
  console.log(`Результат: ${result}`); // 'Результат: 10'
});

// Функция как возвращаемое значение
function createMultiplier(factor) {
  return (number) => number * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

---

## Объекты

Объект — это коллекция пар ключ-значение. Ключи — это строки (или Symbols), значения — любые данные.

### Создание объектов

```js
// Литерал объекта
const user = {
  name: 'Alice',
  age: 25,
  isAdmin: false,
  greet() {
    console.log(`Привет, я ${this.name}`);
  }
};

// Конструктор Object
const user2 = new Object();
user2.name = 'Bob';
```

### Доступ к свойствам

```js
const user = { name: 'Alice', age: 25 };

// Точечная нотация (dot notation)
console.log(user.name); // 'Alice'

// Скобочная нотация (bracket notation)
console.log(user['age']); // 25

// Динамический доступ
const key = 'name';
console.log(user[key]); // 'Alice'
```

### Изменение свойств

```js
const user = { name: 'Alice', age: 25 };

user.age = 26;           // изменить существующее
user.email = 'alice@example.com'; // добавить новое
delete user.age;         // удалить свойство

console.log(user); // { name: 'Alice', email: 'alice@example.com' }
```

### Методы объекта

```js
const user = {
  name: 'Alice',
  age: 25,
  greet() {
    console.log(`Привет, я ${this.name}`);
  },
  haveBirthday() {
    this.age++;
  }
};

user.greet();      // 'Привет, я Alice'
user.haveBirthday();
console.log(user.age); // 26
```

### this в методах

```js
const user = {
  name: 'Alice',
  greet() {
    console.log(this.name);
  }
};

user.greet(); // 'Alice' — this ссылается на объект user

// Но если передать метод как callback, this потеряется
setTimeout(user.greet, 1000); // undefined — this потерялся!

// Решение: использовать стрелочную функцию или bind
setTimeout(() => user.greet(), 1000); // 'Alice'
setTimeout(user.greet.bind(user), 1000); // 'Alice'
```

### Деструктуризация

```js
const user = { name: 'Alice', age: 25, city: 'Moscow' };

// Без деструктуризации
const name = user.name;
const age = user.age;

// С деструктуризацией
const { name, age, city } = user;
console.log(name); // 'Alice'
console.log(age);  // 25

// Переименование
const { name: userName, age: userAge } = user;
console.log(userName); // 'Alice'

// Значения по умолчанию
const { name, age, country = 'Unknown' } = user;
console.log(country); // 'Unknown'
```

### Spread и rest для объектов

```js
const user = { name: 'Alice', age: 25 };
const additional = { email: 'alice@example.com', city: 'Moscow' };

// Spread (распаковка)
const fullUser = { ...user, ...additional };
console.log(fullUser); // { name: 'Alice', age: 25, email: 'alice@example.com', city: 'Moscow' }

// Переопределение свойств
const updatedUser = { ...user, age: 26, city: 'Saint Petersburg' };
console.log(updatedUser); // { name: 'Alice', age: 26, city: 'Saint Petersburg' }
```

---

## Массивы

Массив — это упорядоченная коллекция значений. В JavaScript массивы — это объекты со специальным поведением.

### Создание массивов

```js
// Литерал массива
const numbers = [1, 2, 3, 4, 5];
const mixed = [1, 'hello', true, null, { name: 'Alice' }];

// Конструктор Array
const empty = new Array();      // []
const sized = new Array(5);     // [empty × 5] — массив из 5 пустых слотов
const filled = Array.of(1, 2, 3); // [1, 2, 3]
```

### Доступ к элементам

```js
const fruits = ['apple', 'banana', 'orange'];

console.log(fruits[0]); // 'apple'
console.log(fruits[2]); // 'orange'
console.log(fruits[10]); // undefined — элемент не существует

fruits[1] = 'mango';
console.log(fruits); // ['apple', 'mango', 'orange']
```

### Основные методы

**Добавление/удаление элементов:**
```js
const arr = [1, 2, 3];

arr.push(4);        // добавить в конец → [1, 2, 3, 4]
arr.pop();          // удалить с конца → [1, 2, 3]
arr.unshift(0);     // добавить в начало → [0, 1, 2, 3]
arr.shift();        // удалить с начала → [1, 2, 3]

arr.splice(1, 1);   // удалить 1 элемент с индекса 1 → [1, 3]
arr.splice(1, 0, 2); // вставить 2 с индекса 1 → [1, 2, 3]
```

**Поиск:**
```js
const numbers = [1, 2, 3, 2, 1];

console.log(numbers.indexOf(2));      // 1 — индекс первого вхождения
console.log(numbers.lastIndexOf(2));  // 3 — индекс последнего вхождения
console.log(numbers.includes(3));     // true — есть ли элемент
```

### Итерация по массиву

**for...of:**
```js
const fruits = ['apple', 'banana', 'orange'];

for (const fruit of fruits) {
  console.log(fruit);
}
// 'apple'
// 'banana'
// 'orange'
```

**forEach:**
```js
fruits.forEach((fruit, index) => {
  console.log(`${index}: ${fruit}`);
});
// 0: apple
// 1: banana
// 2: orange
```

### Методы трансформации

**map — преобразование каждого элемента:**
```js
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

const users = [{ name: 'Alice' }, { name: 'Bob' }];
const names = users.map(user => user.name);
console.log(names); // ['Alice', 'Bob']
```

**filter — фильтрация:**
```js
const numbers = [1, 2, 3, 4, 5, 6];

const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4, 6]

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 17 },
  { name: 'Charlie', age: 30 }
];

const adults = users.filter(user => user.age >= 18);
console.log(adults); // [{ name: 'Alice', age: 25 }, { name: 'Charlie', age: 30 }]
```

**reduce — сведение к одному значению:**
```js
const numbers = [1, 2, 3, 4, 5];

const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log(sum); // 15

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
];

const totalAge = users.reduce((acc, user) => acc + user.age, 0);
console.log(totalAge); // 55
```

**find и findIndex:**
```js
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

const bob = users.find(user => user.name === 'Bob');
console.log(bob); // { id: 2, name: 'Bob' }

const index = users.findIndex(user => user.name === 'Charlie');
console.log(index); // 2
```

### Деструктуризация массивов

```js
const numbers = [1, 2, 3];

const [first, second, third] = numbers;
console.log(first);  // 1
console.log(second); // 2
console.log(third);  // 3

// Пропуск элементов
const [a, , c] = numbers;
console.log(a); // 1
console.log(c); // 3

// Rest-элементы
const [head, ...tail] = numbers;
console.log(head); // 1
console.log(tail); // [2, 3]
```

### Spread для массивов

```js
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4, 5, 6]

// Копирование массива
const copy = [...arr1];
console.log(copy); // [1, 2, 3]
console.log(copy === arr1); // false — разные массивы
```

---

## Циклы

Циклы позволяют выполнять код многократно.

### for

```js
for (let i = 0; i < 5; i++) {
  console.log(i);
}
// 0, 1, 2, 3, 4

// Итерация по массиву
const fruits = ['apple', 'banana', 'orange'];
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}
```

### while

```js
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}
// 0, 1, 2, 3, 4
```

### do...while

```js
let num = 0;
do {
  console.log(num);
  num++;
} while (num < 5);
// 0, 1, 2, 3, 4
```

### for...in (для объектов)

```js
const user = { name: 'Alice', age: 25, city: 'Moscow' };

for (const key in user) {
  console.log(`${key}: ${user[key]}`);
}
// name: Alice
// age: 25
// city: Moscow
```

**Важно:** `for...in` не рекомендуется для массивов — используйте `for...of`.

### for...of (для массивов и итерируемых)

```js
const fruits = ['apple', 'banana', 'orange'];

for (const fruit of fruits) {
  console.log(fruit);
}
// apple
// banana
// orange
```

### break и continue

```js
// break — выход из цикла
for (let i = 0; i < 10; i++) {
  if (i === 5) break;
  console.log(i);
}
// 0, 1, 2, 3, 4

// continue — пропуск итерации
for (let i = 0; i < 5; i++) {
  if (i === 2) continue;
  console.log(i);
}
// 0, 1, 3, 4
```

---

## Работа с DOM

DOM (Document Object Model) — это программный интерфейс для HTML-документов. Он представляет страницу в виде дерева объектов, которые можно изменять с помощью JavaScript.

### Структура DOM

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Моя страница</title>
  </head>
  <body>
    <h1>Заголовок</h1>
    <p>Текст</p>
  </body>
</html>
```

В DOM это выглядит так:
```
document
  └── html
      ├── head
      │   └── title
      │       └── "Моя страница"
      └── body
          ├── h1
          │   └── "Заголовок"
          └── p
              └── "Текст"
```

### Выбор элементов

**По ID:**
```js
const header = document.getElementById('header');
```

**По CSS-селектору (первый найденный):**
```js
const button = document.querySelector('.btn-primary');
const firstItem = document.querySelector('ul li');
```

**По CSS-селектору (все найденные):**
```js
const allButtons = document.querySelectorAll('.btn');
const allItems = document.querySelectorAll('ul li');

//querySelectorAll возвращает NodeList — можно использовать forEach
allButtons.forEach(btn => console.log(btn));
```

**Другие методы:**
```js
// По имени класса (устаревший, но быстрый)
const elements = document.getElementsByClassName('btn');

// По имени тега
const paragraphs = document.getElementsByTagName('p');
```

### Изменение содержимого

```js
const element = document.querySelector('#greeting');

// textContent — только текст (безопасно)
element.textContent = 'Новый текст';

// innerHTML — HTML-разметка (осторожно, может быть XSS!)
element.innerHTML = '<strong>Жирный текст</strong>';

// outerHTML — весь элемент включая его теги
console.log(element.outerHTML); // '<div id="greeting"><strong>Жирный текст</strong></div>'
```

### Изменение атрибутов

```js
const link = document.querySelector('a');

// Получить атрибут
const href = link.getAttribute('href');

// Установить атрибут
link.setAttribute('href', 'https://example.com');
link.setAttribute('target', '_blank');

// Удалить атрибут
link.removeAttribute('target');

// Проверить наличие
const hasHref = link.hasAttribute('href'); // true

// Специальные свойства
link.href = 'https://example.com'; // то же самое
link.id = 'main-link';
```

### Изменение стилей

```js
const element = document.querySelector('#box');

// Индивидуальные стили (camelCase)
element.style.backgroundColor = 'red';
element.style.fontSize = '20px';
element.style.marginTop = '10px';

// Классы (предпочтительный способ)
element.classList.add('active');
element.classList.remove('hidden');
element.classList.toggle('visible');
element.classList.contains('active'); // true

// Несколько классов
element.classList.add('class1', 'class2', 'class3');
```

### Создание и удаление элементов

```js
// Создать элемент
const newDiv = document.createElement('div');
newDiv.textContent = 'Новый блок';
newDiv.className = 'box';

// Добавить в DOM
document.body.appendChild(newDiv);

// Вставить перед другим элементом
const reference = document.querySelector('#target');
document.body.insertBefore(newDiv, reference);

// Вставить в начало родителя
parent.insertBefore(newDiv, parent.firstChild);

// Удалить элемент
newDiv.remove();

// Или через родителя
parent.removeChild(newDiv);
```

### Навигация по DOM

```js
const element = document.querySelector('#target');

// Родитель
console.log(element.parentNode);
console.log(element.parentElement);

// Дети
console.log(element.childNodes); // все узлы (включая текст и комментарии)
console.log(element.children);   // только элементы

// Первый/последний ребёнок
console.log(element.firstChild);
console.log(element.lastChild);
console.log(element.firstElementChild);
console.log(element.lastElementChild);

// Соседние элементы
console.log(element.previousSibling);
console.log(element.nextSibling);
console.log(element.previousElementSibling);
console.log(element.nextElementSibling);
```

---

## События

События — это сигналы, которые браузер отправляет, когда что-то происходит: клик мыши, нажатие клавиши, загрузка страницы и т.д.

### addEventListener

```js
const button = document.querySelector('#myButton');

// Основной способ обработки событий
button.addEventListener('click', (event) => {
  console.log('Кнопка нажата!');
  console.log(event); // объект события
});

// Можно добавить несколько обработчиков
button.addEventListener('click', () => console.log('Обработчик 1'));
button.addEventListener('click', () => console.log('Обработчик 2'));
```

### Типы событий

**События мыши:**
```js
element.addEventListener('click', handler);      // клик
element.addEventListener('dblclick', handler);   // двойной клик
element.addEventListener('mousedown', handler);  // нажатие кнопки мыши
element.addEventListener('mouseup', handler);    // отпускание кнопки
element.addEventListener('mousemove', handler);  // движение мыши
element.addEventListener('mouseenter', handler); // курсор вошёл в элемент
element.addEventListener('mouseleave', handler); // курсор покинул элемент
```

**События клавиатуры:**
```js
document.addEventListener('keydown', (e) => {
  console.log(`Нажата клавиша: ${e.key}`);
  console.log(`Код клавиши: ${e.code}`);
  
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault(); // отменить сохранение страницы
    console.log('Сохранение...');
  }
});

document.addEventListener('keyup', handler);
```

**События форм:**
```js
const form = document.querySelector('form');
const input = document.querySelector('input');

form.addEventListener('submit', (e) => {
  e.preventDefault(); // отменить отправку формы
  console.log('Форма отправлена');
});

input.addEventListener('input', (e) => {
  console.log(`Значение: ${e.target.value}`);
});

input.addEventListener('change', handler); // когда поле потеряло фокус и значение изменилось
input.addEventListener('focus', handler);  // поле получило фокус
input.addEventListener('blur', handler);   // поле потеряло фокус
```

**События окна:**
```js
window.addEventListener('load', () => {
  console.log('Страница полностью загружена');
});

window.addEventListener('resize', () => {
  console.log(`Размер: ${window.innerWidth}x${window.innerHeight}`);
});

window.addEventListener('scroll', () => {
  console.log(`Прокрутка: ${window.scrollY}`);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM готов к работе');
});
```

### Объект события

```js
button.addEventListener('click', (event) => {
  console.log(event.type);        // 'click'
  console.log(event.target);      // элемент, на котором произошло событие
  console.log(event.currentTarget); // элемент, на котором висит обработчик
  console.log(event.clientX);     // координата X относительно окна
  console.log(event.clientY);     // координата Y относительно окна
  console.log(event.pageX);       // координата X относительно документа
  console.log(event.pageY);       // координата Y относительно документа
});
```

### Всплытие и перехват событий

```html
<div id="parent">
  <button id="child">Нажми меня</button>
</div>
```

```js
const parent = document.querySelector('#parent');
const child = document.querySelector('#child');

// Всплытие (bubbling) — событие всплывает от ребёнка к родителю
parent.addEventListener('click', () => {
  console.log('Parent clicked');
});

child.addEventListener('click', () => {
  console.log('Child clicked');
});

// При клике на child вы увидите:
// 'Child clicked'
// 'Parent clicked'

// Остановка всплытия
child.addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('Child clicked (остановлено)');
});

// Теперь при клике на child вы увидите только 'Child clicked (остановлено)'
```

### Делегирование событий

```html
<ul id="list">
  <li>Пункт 1</li>
  <li>Пункт 2</li>
  <li>Пункт 3</li>
</ul>
```

```js
// Плохо: вешать обработчик на каждый li
const items = document.querySelectorAll('li');
items.forEach(item => {
  item.addEventListener('click', () => {
    console.log(item.textContent);
  });
});

// Хорошо: делегирование — один обработчик на родителе
const list = document.querySelector('#list');

list.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    console.log(e.target.textContent);
  }
});
```

---

## Асинхронность: callback, Promise, async/await

JavaScript — однопоточный язык. Это значит, что он может выполнять только одну операцию за раз. Но некоторые операции (запросы к серверу, чтение файлов, таймеры) занимают время. Асинхронность позволяет не блокировать выполнение кода, пока эти операции выполняются.

### Callback (устаревший способ)

```js
// Функция принимает callback, который вызовется позже
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: 'Alice', age: 25 };
    callback(data);
  }, 1000);
}

fetchData((data) => {
  console.log('Данные получены:', data);
});

console.log('Этот код выполнится первым, не дожидаясь fetchData');

// Проблема callback hell
fetchUser((user) => {
  fetchUserPosts(user.id, (posts) => {
    fetchPostComments(posts[0].id, (comments) => {
      console.log(comments);
      // Вложенность 3+ уровня — кошмар!
    });
  });
});
```

### Promise (ES6+)

Promise — это объект, представляющий результат асинхронной операции. Он может быть в одном из трёх состояний:
- **pending** — ожидание
- **fulfilled** — успешно выполнено
- **rejected** — ошибка

```js
// Создание Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve({ name: 'Alice', age: 25 });
    } else {
      reject(new Error('Ошибка загрузки'));
    }
  }, 1000);
});

// Использование Promise
promise
  .then((data) => {
    console.log('Успех:', data);
  })
  .catch((error) => {
    console.error('Ошибка:', error);
  })
  .finally(() => {
    console.log('Выполнится в любом случае');
  });

// Цепочки Promise
fetchUser()
  .then(user => fetchUserPosts(user.id))
  .then(posts => fetchPostComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(error => console.error(error));
```

### async/await (ES2017+)

async/await — это синтаксический сахар над Promise, который делает асинхронный код похожим на синхронный.

```js
// async функция всегда возвращает Promise
async function fetchUser() {
  const response = await fetch('https://api.example.com/user');
  const user = await response.json();
  return user;
}

// Использование
fetchUser()
  .then(user => console.log(user))
  .catch(error => console.error(error));

// Или с try/catch
async function getUser() {
  try {
    const user = await fetchUser();
    console.log(user);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

// Параллельное выполнение
async function fetchAll() {
  const [users, posts] = await Promise.all([
    fetch('https://api.example.com/users').then(r => r.json()),
    fetch('https://api.example.com/posts').then(r => r.json())
  ]);
  
  console.log(users, posts);
}
```

### Практический пример: загрузка данных

```js
async function loadUserData(userId) {
  try {
    // Показываем индикатор загрузки
    showLoading();
    
    // Загружаем данные пользователя
    const userResponse = await fetch(`https://api.example.com/users/${userId}`);
    if (!userResponse.ok) {
      throw new Error('Ошибка загрузки пользователя');
    }
    const user = await userResponse.json();
    
    // Загружаем посты пользователя
    const postsResponse = await fetch(`https://api.example.com/users/${userId}/posts`);
    if (!postsResponse.ok) {
      throw new Error('Ошибка загрузки постов');
    }
    const posts = await postsResponse.json();
    
    // Обновляем UI
    renderUser(user);
    renderPosts(posts);
    
  } catch (error) {
    console.error('Ошибка:', error);
    showError(error.message);
  } finally {
    hideLoading();
  }
}

loadUserData(1);
```

---

## Ключевые тезисы для интервью

- `const` — по умолчанию, `let` — для переприсваивания; `var` устарел (function scope, hoisting).
- 7 примитивных типов + объекты; `typeof null === 'object'` — баг языка.
- Arrow Function не имеет своего `this` — решает проблему потери контекста в callback.
- Массивы: `map`/`filter`/`reduce` трансформируют без мутации; объекты и массивы копируются через spread.
- DOM — дерево HTML; выбор через `querySelector`, изменение через `textContent`/`classList`.
- События всплывают (bubbling); делегирование — один обработчик на родителе вместо отдельных на каждом ребёнке.
- Эволюция асинхронности: callback → Promise → async/await (сахар над Promise).

---

## Заключение

JavaScript — это мощный язык с богатой историей и экосистемой. В этой статье мы разобрали самые основы: от объявления переменных и работы с функциями до взаимодействия с DOM и обработки асинхронных операций. Это фундамент, на котором строятся все более сложные темы.

Следующие статьи раздела углубятся в конкретные темы: типы данных и приведение типов, замыкания, `this`, Event Loop, прототипы и классы, модули и многое другое. Но без понимания основ, которые мы разобрали здесь, эти темы будут непонятны.

Практикуйтесь: создайте простую страницу, добавьте интерактивность через JavaScript, поэкспериментируйте с DOM и событиями. Только практика поможет закрепить эти знания.

---

## Полезные ссылки

- [MDN Web Docs — JavaScript](https://developer.mozilla.org/ru/docs/Web/JavaScript) — официальная документация Mozilla
- [JavaScript.ru](https://learn.javascript.ru/) — подробный учебник современного JavaScript
- [Eloquent JavaScript](https://eloquentjavascript.ru/) — бесплатная книга Мариjnа Хавейрбеке
- [You Don't Know JS (Yet)](https://github.com/getify/You-Dont-Know-JS) — серия книг Кайла Симпсона о глубинных аспектах JavaScript
- [JavaScript Info](https://javascript.info/) — современный учебник JavaScript
