---
title: "Основы React: компоненты, JSX, props и state"
section: react
description: "Фундамент React для начинающих: что такое React, виртуальный DOM, JSX, компоненты, props, state, обработка событий, условный рендеринг и списки. Всё, что нужно знать перед изучением хуков и продвинутых паттернов."
order: 1
tags: ["react-basics", "jsx", "components", "props", "state", "virtual-dom", "events"]
questions:
  - "Как декларативный подход React решает проблемы ручного управления DOM по сравнению с vanilla JavaScript"
  - "Как JSX преобразуется в вызовы React.createElement и чем отличается от HTML"
  - "Как виртуальный DOM и reconciliation минимизируют обновление реального DOM при изменении состояния"
  - "Чем props отличаются от state и как однонаправленный поток данных определяет архитектуру компонентов"
  - "Почему state нужно обновлять иммутабельно и когда использовать функциональное обновление"
  - "Как работает lifting state up и когда нужно поднимать состояние в общего родителя"
---

# Основы React: компоненты, JSX, props и state

React — это JavaScript-библиотека для построения пользовательских интерфейсов. Созданная Facebook в 2013 году, она изменила подход к разработке фронтенда, введя декларативный стиль программирования и компонентную архитектуру. Вместо того чтобы вручную обновлять DOM при каждом изменении данных, React сам определяет, что нужно перерисовать, и делает это эффективно. В этой статье разберём самые основы: что такое React, JSX, компоненты, props, state и как с их помощью строить интерфейсы.

## Содержание

1. [Что такое React и зачем он нужен](#что-такое-react-и-зачем-он-нужен)
2. [Создание проекта](#создание-проекта)
3. [JSX — синтаксис разметки в JavaScript](#jsx--синтаксис-разметки-в-javascript)
4. [Виртуальный DOM](#виртуальный-dom)
5. [Компоненты](#компоненты)
6. [Props — передача данных в компоненты](#props--передача-данных-в-компоненты)
7. [State — локальное состояние компонента](#state--локальное-состояние-компонента)
8. [Обработка событий](#обработка-событий)
9. [Условный рендеринг](#условный-рендеринг)
10. [Рендеринг списков](#рендеринг-списков)
11. [Lifting State Up — подъём состояния](#lifting-state-up--подъём-состояния)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое React и зачем он нужен

### Проблема: ручное управление DOM

Представьте, что вы пишете приложение на vanilla JavaScript. У вас есть форма, список задач и счётчик. При каждом действии пользователя (добавление задачи, изменение фильтра, клик по кнопке) вам нужно:

1. Найти нужные элементы в DOM (`document.querySelector`)
2. Изменить их содержимое или атрибуты
3. Следить, чтобы изменения не сломали другие части страницы
4. Оптимизировать производительность (не перерисовывать лишнее)

Это быстро становится кошмаром. Код превращается в набор `document.createElement`, `appendChild`, `removeChild` с кучей условий и ручным управлением состоянием.

### Решение: декларативный подход React

React меняет парадигму. Вместо того чтобы описывать **как** обновить DOM, вы описываете **что** должен видеть пользователь при каждом состоянии приложения. React сам определяет разницу между предыдущим и текущим состоянием и обновляет только то, что изменилось.

```js
// Vanilla JavaScript — императивный подход
function addTodo(text) {
  const li = document.createElement('li');
  li.textContent = text;
  li.className = 'todo-item';
  document.querySelector('#todo-list').appendChild(li);
  
  // Обновляем счётчик
  const counter = document.querySelector('#counter');
  counter.textContent = `Total: ${document.querySelectorAll('.todo-item').length}`;
}

// React — декларативный подход
function TodoApp() {
  const [todos, setTodos] = useState([]);
  
  const addTodo = (text) => {
    setTodos([...todos, { text, done: false }]);
  };
  
  return (
    <div>
      <p>Total: {todos.length}</p>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo.text}</li>
        ))}
      </ul>
      <button onClick={() => addTodo('New task')}>Add</button>
    </div>
  );
}
```

### Ключевые идеи React

**1. Компонентная архитектура**

UI разбивается на независимые, переиспользуемые компоненты. Каждый компонент — это функция, которая возвращает разметку.

```jsx
function Button({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>;
}

function App() {
  return (
    <div>
      <Button text="Save" onClick={handleSave} />
      <Button text="Cancel" onClick={handleCancel} />
    </div>
  );
}
```

**2. Однонаправленный поток данных**

Данные передаются сверху вниз (от родителя к ребёнку) через props. Это упрощает понимание того, откуда пришли данные и как они изменяются.

**3. Виртуальный DOM**

React создаёт лёгкую копию DOM в памяти. При изменении состояния React сравнивает новую версию с предыдущей и обновляет только различия в реальном DOM. Это быстрее, чем ручное обновление.

---

## Создание проекта

### Vite (рекомендуется)

```bash
# Создать проект с React + TypeScript
npm create vite@latest my-app -- --template react-ts

# Перейти в директорию
cd my-app

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

### Create React App (устарел, но всё ещё встречается)

```bash
npx create-react-app my-app --template typescript
cd my-app
npm start
```

### Структура проекта

```
my-app/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx          # Главный компонент
│   ├── App.css          # Стили для App
│   ├── main.tsx         # Точка входа
│   └── index.css        # Глобальные стили
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## JSX — синтаксис разметки в JavaScript

### Что такое JSX

JSX (JavaScript XML) — это синтаксическое расширение JavaScript, позволяющее писать HTML-подобную разметку прямо в JavaScript-коде.

```jsx
function Greeting() {
  const name = "Alice";
  return <h1>Hello, {name}!</h1>;
}
```

Под капотом JSX преобразуется в вызовы `React.createElement`:

```jsx
// JSX
const element = <h1 className="title">Hello</h1>;

// Преобразуется в:
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello'
);
```

### Встраивание JavaScript в JSX

В JSX можно вставлять любые JavaScript-выражения в фигурных скобках `{}`:

```jsx
function UserCard({ user }) {
  const isAdmin = user.role === 'admin';
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Age: {user.age}</p>
      <p>Role: {isAdmin ? 'Administrator' : 'User'}</p>
      <p>Score: {user.score * 10}%</p>
      <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}
```

### Отличия JSX от HTML

**1. `className` вместо `class`:**
```jsx
// ❌ Ошибка: class — зарезервированное слово в JavaScript
<div class="container">Content</div>

// ✅ Правильно
<div className="container">Content</div>
```

**2. `htmlFor` вместо `for`:**
```jsx
<label htmlFor="email">Email:</label>
<input id="email" type="email" />
```

**3. Стили — объект, а не строка:**
```jsx
// ❌ Не работает
<div style="color: red; font-size: 16px">Text</div>

// ✅ Правильно: объект с camelCase свойствами
<div style={{ color: 'red', fontSize: '16px' }}>Text</div>

// Или вынести в переменную
const styles = {
  color: 'red',
  fontSize: '16px',
  marginTop: '10px'
};

<div style={styles}>Text</div>
```

**4. Все теги должны быть закрыты:**
```jsx
// ❌ Ошибка
<img src="photo.jpg">
<input type="text">

// ✅ Правильно
<img src="photo.jpg" />
<input type="text" />
```

**5. Атрибуты в camelCase:**
```jsx
// HTML
<div onclick="handleClick()" tabindex="0" readonly></div>

// JSX
<div onClick={handleClick} tabIndex={0} readOnly />
```

### Фрагменты

Если нужно вернуть несколько элементов без обёртки, используйте Fragment:

```jsx
// Без Fragment — нужна обёртка
function List() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}

// С Fragment — без лишней обёртки
function List() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
}

// Или явно
import { Fragment } from 'react';

function List() {
  return (
    <Fragment>
      <h1>Title</h1>
      <p>Content</p>
    </Fragment>
  );
}
```

---

## Виртуальный DOM

### Что такое реальный DOM

DOM (Document Object Model) — это представление HTML-документа в виде дерева объектов. Браузер использует DOM для рендеринга страницы.

```html
<div id="app">
  <h1>Hello</h1>
  <p>World</p>
</div>
```

```
DOM Tree:
div#app
  ├── h1
  │   └── "Hello"
  └── p
      └── "World"
```

### Проблемы прямого манипулирования DOM

1. **Медленно.** Каждая операция с DOM (добавление, удаление, изменение) — дорогая операция. Браузер должен пересчитать layout, перерисовать элементы.
2. **Сложно.** Нужно вручную отслеживать, что изменилось, и обновлять только необходимые части.
3. **Хрупко.** Легко сломать другие части страницы при обновлении.

### Как работает виртуальный DOM

Виртуальный DOM (VDOM) — это лёгкое JavaScript-представление реального DOM.

```jsx
// Это JSX
const element = <h1 className="title">Hello</h1>;

// После компиляции — это объект (виртуальный DOM)
const element = {
  type: 'h1',
  props: {
    className: 'title',
    children: 'Hello'
  }
};
```

**Алгоритм работы:**

1. **Render phase:** React вызывает компоненты и создаёт новое дерево виртуального DOM.
2. **Diffing:** React сравнивает новое дерево с предыдущим и находит различия.
3. **Commit phase:** React обновляет только те части реального DOM, которые изменились.

```
State Change
    │
    ▼
New Virtual DOM Tree
    │
    ▼
Diff with Previous Tree
    │
    ▼
Minimal Updates to Real DOM
```

### Пример

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

Когда пользователь кликает кнопку:
1. `count` изменяется с 0 на 1
2. React перерисовывает компонент и создаёт новое виртуальное DOM-дерево
3. React сравнивает новое дерево с предыдущим
4. React видит, что изменился только текст в `<p>`
5. React обновляет только текстовый узел в реальном DOM

### Ключевые моменты

- Виртуальный DOM — это **оптимизация**, а не магия. Он не всегда быстрее ручного обновления DOM, но делает код проще и предсказуемее.
- React использует **reconciliation** — алгоритм сравнения двух деревьев виртуального DOM.
- Для оптимальной работы React нужно, чтобы компоненты были **чистыми функциями** props (по возможности).

---

## Компоненты

### Что такое компонент

Компонент — это независимая, переиспользуемая часть UI. В React компоненты — это функции, которые возвращают JSX.

```jsx
function Welcome() {
  return <h1>Hello, World!</h1>;
}

// Использование
function App() {
  return (
    <div>
      <Welcome />
      <Welcome />
      <Welcome />
    </div>
  );
}
```

### Правила именования

- Имена компонентов начинаются с **заглавной буквы** (`Welcome`, не `welcome`)
- Если имя начинается с маленькой буквы, React считает это HTML-тегом

```jsx
// ❌ React ищет HTML-тег <welcome>
<welcome />

// ✅ React ищет компонент Welcome
<Welcome />
```

### Функциональные компоненты (современный подход)

```jsx
// Базовый компонент
function Greeting() {
  return <h1>Hello!</h1>;
}

// Компонент с props
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Компонент с деструктуризацией и значениями по умолчанию
function Button({ text = 'Click me', variant = 'primary', onClick }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {text}
    </button>
  );
}

// Экспорт
export default Greeting;
export { Button };
```

### Классовые компоненты (устаревший подход)

```jsx
import { Component } from 'react';

class Greeting extends Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

**Почему функциональные компоненты лучше:**
- Проще читать и писать
- Можно использовать хуки (useState, useEffect и т.д.)
- Меньше boilerplate-кода
- Легче тестировать

**Когда классовые компоненты всё ещё встречаются:**
- Старые проекты (до React 16.8)
- Error Boundaries (пока не поддерживаются в функциональных компонентах)

### Композиция компонентов

Компоненты могут включать другие компоненты:

```jsx
function Header() {
  return (
    <header>
      <h1>My App</h1>
      <nav>...</nav>
    </header>
  );
}

function Sidebar() {
  return (
    <aside>
      <ul>...</ul>
    </aside>
  );
}

function MainContent() {
  return (
    <main>
      <p>Content here</p>
    </main>
  );
}

function App() {
  return (
    <div className="app">
      <Header />
      <div className="layout">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}
```

---

## Props — передача данных в компоненты

### Что такое props

Props (properties) — это данные, которые передаются от родительского компонента к дочернему. Props **только для чтения** — дочерний компонент не может изменить свои props.

```jsx
// Родительский компонент
function App() {
  return (
    <div>
      <UserCard name="Alice" age={25} />
      <UserCard name="Bob" age={30} />
    </div>
  );
}

// Дочерний компонент получает props
function UserCard({ name, age }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

### Props — это объект

Под капотом props — это объект, который передаётся в компонент как первый аргумент:

```jsx
function UserCard(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
    </div>
  );
}

// Или с деструктуризацией (предпочтительнее)
function UserCard({ name, age }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

### Типы props

В props можно передавать любые данные:

```jsx
function Example({
  text,           // string
  count,          // number
  isActive,       // boolean
  items,          // array
  user,           // object
  onClick,        // function
  children        // special prop — дочерние элементы
}) {
  return <div>...</div>;
}

// Использование
<Example
  text="Hello"
  count={42}
  isActive={true}
  items={['a', 'b', 'c']}
  user={{ name: 'Alice', age: 25 }}
  onClick={() => console.log('clicked')}
>
  <p>Это children</p>
</Example>
```

### Значения по умолчанию

```jsx
// Через деструктуризацию (предпочтительнее)
function Button({ text = 'Click me', variant = 'primary' }) {
  return <button className={`btn-${variant}`}>{text}</button>;
}

// Через defaultProps (устаревший способ для функциональных компонентов)
Button.defaultProps = {
  text: 'Click me',
  variant: 'primary'
};
```

### Props vs атрибуты HTML

Props — это не то же самое, что HTML-атрибуты. Хотя синтаксис похож:

```jsx
// Это props компонента, а не HTML-атрибуты
<UserCard name="Alice" age={25} />

// Если нужно передать HTML-атрибут, используйте строку
<div className="container" id="main">Content</div>

// Для boolean-props
<Button disabled />          // эквивалентно disabled={true}
<Button disabled={false} />  // явно false
```

### Children — специальный prop

`children` — это всё, что находится между открывающим и закрывающим тегами компонента:

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Использование
<Card title="My Card">
  <p>Это содержимое карточки</p>
  <button>Action</button>
</Card>
```

### Однонаправленный поток данных

Props передаются **только сверху вниз** — от родителя к ребёнку. Дочерний компонент не может изменить свои props.

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <Child count={count} />
    </div>
  );
}

function Child({ count }) {
  // ❌ Нельзя изменить count напрямую
  // count = 10; // Это не изменит count в Parent
  
  return <p>Child sees: {count}</p>;
}
```

Если дочерний компонент хочет изменить данные, он должен вызвать функцию, переданную через props:

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  
  const increment = () => setCount(count + 1);
  
  return (
    <div>
      <p>Count: {count}</p>
      <Child onIncrement={increment} />
    </div>
  );
}

function Child({ onIncrement }) {
  return <button onClick={onIncrement}>Increment</button>;
}
```

---

## State — локальное состояние компонента

### Что такое state

State — это данные, которые могут изменяться внутри компонента. В отличие от props, state управляется **самим компонентом**.

Когда state изменяется, React перерисовывает компонент, чтобы отразить новые данные в UI.

### useState — базовый хук для состояния

```jsx
import { useState } from 'react';

function Counter() {
  // useState возвращает массив: [текущее значение, функция для изменения]
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Как работает useState

1. При первом рендере `useState(0)` возвращает `[0, setCount]`
2. Когда вызывается `setCount(1)`, React запоминает новое значение
3. React перерисовывает компонент
4. При следующем рендере `useState(0)` возвращает `[1, setCount]` (новое значение)

### Обновление объектов и массивов

State нужно обновлять **иммутабельно** — создавать новые объекты/массивы, а не мутировать существующие:

```jsx
function UserForm() {
  const [user, setUser] = useState({ name: 'Alice', age: 25 });
  
  // ❌ Неправильно: мутируем объект
  // user.name = 'Bob';
  // setUser(user); // React не увидит изменений!
  
  // ✅ Правильно: создаём новый объект
  const updateName = (name) => {
    setUser({ ...user, name });
  };
  
  return (
    <div>
      <p>Name: {user.name}</p>
      <button onClick={() => updateName('Bob')}>Change Name</button>
    </div>
  );
}
```

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  
  // Добавить
  const addTodo = (text) => {
    setTodos([...todos, { text, done: false }]);
  };
  
  // Удалить
  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };
  
  // Обновить
  const toggleTodo = (index) => {
    setTodos(todos.map((todo, i) => 
      i === index ? { ...todo, done: !todo.done } : todo
    ));
  };
  
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i}>
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => toggleTodo(i)}>Toggle</button>
          <button onClick={() => removeTodo(i)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

### Функциональное обновление

Если новое состояние зависит от предыдущего, используйте функциональное обновление:

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  // ❌ Может работать некорректно при множественных обновлениях
  // setCount(count + 1);
  // setCount(count + 1);
  // setCount(count + 1);
  // Результат: count = 1 (не 3!)
  
  // ✅ Правильно: функциональное обновление
  const increment = () => {
    setCount(prev => prev + 1);
  };
  
  // Теперь это работает корректно
  const incrementThreeTimes = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // Результат: count = 3
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementThreeTimes}>+3</button>
    </div>
  );
}
```

### Props vs State

| | Props | State |
|---|---|---|
| **Кто управляет** | Родительский компонент | Сам компонент |
| **Можно изменять** | ❌ Нет (read-only) | ✅ Да |
| **Для чего** | Передача данных сверху вниз | Локальные данные компонента |
| **Изменение вызывает ререндер** | ✅ Да (у родителя) | ✅ Да (у самого компонента) |

---

## Обработка событий

### Базовая обработка

В React события именуются в camelCase (`onClick`, не `onclick`):

```jsx
function Button() {
  const handleClick = () => {
    console.log('Button clicked!');
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### Передача аргументов

```jsx
function ItemList() {
  const handleDelete = (id) => {
    console.log(`Delete item ${id}`);
  };
  
  return (
    <ul>
      <li>
        Item 1
        <button onClick={() => handleDelete(1)}>Delete</button>
      </li>
      <li>
        Item 2
        <button onClick={() => handleDelete(2)}>Delete</button>
      </li>
    </ul>
  );
}
```

### Объект события

React передаёт синтетическое событие (SyntheticEvent) в обработчик:

```jsx
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault(); // отменить отправку формы
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    console.log('Name:', name);
  };
  
  const handleChange = (e) => {
    console.log('Value:', e.target.value);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Предотвращение поведения по умолчанию

```jsx
function Link() {
  const handleClick = (e) => {
    e.preventDefault(); // отменить переход по ссылке
    console.log('Link clicked, but not navigating');
  };
  
  return (
    <a href="https://example.com" onClick={handleClick}>
      Click me
    </a>
  );
}
```

---

## Условный рендеринг

### Тернарный оператор

```jsx
function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome back!</h1>
      ) : (
        <h1>Please sign in</h1>
      )}
    </div>
  );
}
```

### Логический оператор &&

```jsx
function Notification({ count }) {
  return (
    <div>
      <h1>Messages</h1>
      {count > 0 && <p>You have {count} new messages</p>}
    </div>
  );
}
```

### if/else внутри компонента

```jsx
function Dashboard({ user }) {
  if (!user) {
    return <h1>Please log in</h1>;
  }
  
  if (user.isAdmin) {
    return <AdminPanel user={user} />;
  }
  
  return <UserDashboard user={user} />;
}
```

### Переменная для условного JSX

```jsx
function Button({ variant = 'primary' }) {
  let className;
  
  if (variant === 'primary') {
    className = 'btn btn-primary';
  } else if (variant === 'secondary') {
    className = 'btn btn-secondary';
  } else {
    className = 'btn';
  }
  
  return <button className={className}>Click me</button>;
}
```

---

## Рендеринг списков

### Базовый рендеринг списка

```jsx
function TodoList() {
  const todos = [
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Build an app' },
    { id: 3, text: 'Deploy to production' }
  ];
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### Зачем нужен key

`key` — специальный атрибут, который помогает React отслеживать изменения в списках.

```jsx
// ❌ Без key — React выдаст предупреждение
{todos.map(todo => <li>{todo.text}</li>)}

// ❌ Плохо: использовать индекс как key
{todos.map((todo, index) => <li key={index}>{todo.text}</li>)}

// ✅ Хорошо: использовать уникальный идентификатор
{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
```

**Почему индекс — плохой key:**

Если список может изменяться (добавление, удаление, перестановка), использование индекса приведёт к проблемам с производительностью и багам.

```jsx
// Исходный список
[{ id: 1, text: 'A' }, { id: 2, text: 'B' }, { id: 3, text: 'C' }]

// Удаляем второй элемент
[{ id: 1, text: 'A' }, { id: 3, text: 'C' }]

// С key={index}:
// Index 0: A → A (без изменений)
// Index 1: B → C (изменился!) ← React перерисует этот элемент
// Index 2: C → undefined (удалён)

// С key={id}:
// Key 1: A → A (без изменений)
// Key 2: B → удалён ← React удалит этот элемент
// Key 3: C → C (без изменений) ← React не тронет этот элемент
```

### Рендеринг с фильтрацией

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false },
    { id: 2, text: 'Build an app', done: true },
    { id: 3, text: 'Deploy', done: false }
  ]);
  
  const [filter, setFilter] = useState('all');
  
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.done;
    if (filter === 'completed') return todo.done;
    return true;
  });
  
  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      
      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            {todo.text} {todo.done && '✓'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Lifting State Up — подъём состояния

### Проблема: общий state для нескольких компонентов

Иногда двум или более компонентам нужны одни и те же данные. Как им поделиться?

```jsx
// ❌ Плохо: дублирование state
function Parent() {
  return (
    <div>
      <TemperatureInput />
      <TemperatureDisplay />
    </div>
  );
}

function TemperatureInput() {
  const [temperature, setTemperature] = useState(20);
  // TemperatureDisplay не знает про это состояние!
  return <input value={temperature} onChange={...} />;
}

function TemperatureDisplay() {
  // Нет доступа к temperature из TemperatureInput
  return <p>Temperature: ???</p>;
}
```

### Решение: подъём состояния в общего родителя

```jsx
function Parent() {
  const [temperature, setTemperature] = useState(20);
  
  return (
    <div>
      <TemperatureInput 
        temperature={temperature}
        onTemperatureChange={setTemperature}
      />
      <TemperatureDisplay temperature={temperature} />
    </div>
  );
}

function TemperatureInput({ temperature, onTemperatureChange }) {
  const handleChange = (e) => {
    onTemperatureChange(Number(e.target.value));
  };
  
  return <input value={temperature} onChange={handleChange} />;
}

function TemperatureDisplay({ temperature }) {
  return <p>Temperature: {temperature}°C</p>;
}
```

### Как это работает

1. State поднимается в общего родителя (`Parent`)
2. Родитель передаёт state через props в дочерние компоненты
3. Дочерние компоненты могут изменять state через callback-функции, переданные через props

Это создаёт **однонаправленный поток данных**: state живёт в родителе, передаётся вниз через props, изменения поднимаются обратно через callbacks.

---

## Ключевые тезисы для интервью

- React — декларативная библиотека с компонентной архитектурой: вместо ручного обновления DOM вы описываете, что должен видеть пользователь при каждом состоянии, а React сам находит и применяет различия.
- JSX — синтаксическое расширение JavaScript, преобразуемое в `React.createElement`; отличается от HTML использованием `className`, `htmlFor`, camelCase-атрибутов и обязательным закрытием тегов.
- Виртуальный DOM — лёгкое JS-представление реального DOM; алгоритм reconciliation сравнивает новое дерево с предыдущим и обновляет только различия, минимизируя дорогие операции с реальным DOM.
- Компоненты — независимые, переиспользуемые части UI; в современном React это функции, возвращающие JSX. Props — read-only данные от родителя к ребёнку, state — локальные данные компонента, управляемые через `useState`.
- State обновляется иммутабельно (создаются новые объекты/массивы); при зависимости от предыдущего значения используется функциональное обновление `setCount(prev => prev + 1)`.
- Lifting State Up — паттерн, при котором state поднимается в общего родителя, а изменения возвращаются через callback-props; это обеспечивает однонаправленный поток данных.

---

## Заключение

React — это мощная библиотека для построения пользовательских интерфейсов. В этой статье мы разобрали самые основы: что такое React, JSX, компоненты, props, state, обработка событий, условный рендеринг и списки. Это фундамент, на котором строятся все более сложные темы.

Следующие статьи раздела углубятся в хуки (useState, useEffect, useContext, useMemo и другие), продвинутые паттерны, оптимизацию производительности, работу с формами, роутинг и многое другое. Но без понимания основ, которые мы разобрали здесь, эти темы будут непонятны.

Создайте свой первый React-проект, поэкспериментируйте с компонентами, props и state. Только практика поможет закрепить эти знания.

---

## Полезные ссылки

- [React Documentation](https://react.dev/) — официальная документация React
- [React Tutorial](https://react.dev/learn) — интерактивный туториал
- [Create React App](https://create-react-app.dev/) — инструмент для создания React-приложений (устарел, используйте Vite)
- [Vite](https://vitejs.dev/) — быстрый сборщик для современных проектов
- [React DevTools](https://react.dev/learn/react-developer-tools) — расширение для браузера для отладки React-приложений
