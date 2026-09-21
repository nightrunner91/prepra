---
title: "Preact: лёгкая альтернатива React"
section: platforms
description: "Preact — компактный рантайм с API React. Разбираем отличия, preact/compat, Signals и сценарии, где Preact уместнее React."
order: 1
tags: ["preact", "react", "preact-compat", "signals", "bundle-size"]
questions:
  - "Чем Preact отличается от React по размеру и внутренней архитектуре"
  - "Что делает `preact/compat` и как настроить алиасы для миграции с React"
  - "Как в Preact обрабатываются события и чем это отличается от SyntheticEvent"
  - "Что такое Preact Signals и почему они не вызывают ререндер компонента"
  - "В каких сценариях Preact предпочтительнее React"
  - "Когда Preact не подойдёт и стоит остаться на React"
---

# Preact: лёгкая альтернатива React

Preact — это компактный рантайм, повторяющий API React, но занимающий в несколько раз меньше места в бандле. Он полезен там, где критичны размер и время загрузки: лендинги, встраиваемые виджеты, микрофронтенды. В статье разбираем архитектурные отличия, слой совместимости `preact/compat`, реактивную модель Signals и границы применимости Preact.

## Содержание

1. [Что такое Preact](#что-такое-preact)
2. [Preact vs React](#preact-vs-react)
3. [Совместимость и миграция](#совместимость-и-миграция)
4. [Preact Signals](#preact-signals)
5. [Когда выбирать Preact](#когда-выбирать-preact)
6. [Когда оставить React](#когда-оставить-react)
7. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
8. [Заключение](#заключение)
9. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Preact

**Preact** — это быстрая и лёгкая альтернатива React с тем же API. Она реализует Virtual DOM, хуки, компоненты и JSX, занимая при этом значительно меньше места в бандле.

```
React + ReactDOM  ~ 40-50 kB (gzip)
Preact (compat)   ~ 10-12 kB (gzip)
Preact (core)     ~  3-4 kB (gzip)
```

Preact создан для сценариев, где важен размер бандла, скорость загрузки и производительность на слабых устройствах, но при этом нужна привычная экосистема React.

---

## Preact vs React

### Базовое сравнение

| | React | Preact |
|---|---|---|
| Размер | ~40-50 kB gzip | ~3-4 kB core / ~10-12 kB compat |
| API | Полный API React | Совместимый с React, меньше внутренних фич |
| Virtual DOM | Да | Да, упрощённая реализация |
| Хуки | `useState`, `useEffect`, и др. | Полная поддержка хуков |
| JSX | `React.createElement` / `jsx-runtime` | `h()` / `jsx-runtime` |
| DevTools | React DevTools | Preact DevTools |
| Concurrent features | Полная поддержка | Ограниченная / отсутствует |

### Ключевые отличия внутри

**1. Размер за счёт упрощений**

Preact убирает часть внутренних абстракций React: нет Fiber, нет приоритетов обновлений, нет Concurrent Mode. Это делает рендеринг проще и предсказуемее, но не даёт таких возможностей, как `useTransition` или Suspense на сервере.

**2. События**

React использует Synthetic Event System с пулингом событий (в старых версиях) и нормализацией. Preact использует нативные DOM-события напрямую, без слоя абстракции:

```jsx
// React: SyntheticEvent
function ReactButton() {
  return <button onClick={(e) => console.log(e.nativeEvent)}>Click</button>;
}

// Preact: нативное событие
function PreactButton() {
  return <button onClick={(e) => console.log(e)}>Click</button>;
}
```

**3. `class` вместо `className`**

Preact поддерживает оба варианта, но в документации рекомендует использовать стандартный HTML-атрибут `class`:

```jsx
// В Preact работает и так, и так
<div class="container" className="container">Content</div>
```

---

## Совместимость и миграция

### Preact Compat

`preact/compat` — это тонкая прослойка, которая делает Preact совместимым с большинством библиотек и кода, написанных для React.

```js
// vite.config.js
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
});
```

После такого алиаса можно импортировать `React` через обычные пути:

```jsx
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Постепенная миграция

Если проект на React, но хочется уменьшить размер бандла, часто используют Preact только в production-сборке, а в development остаются на React для удобства отладки:

```js
// webpack.config.js
const isProd = process.env.NODE_ENV === "production";

module.exports = {
  resolve: {
    alias: isProd
      ? {
          react: "preact/compat",
          "react-dom": "preact/compat",
        }
      : {},
  },
};
```

---

## Preact Signals

**Signals** — система реактивного состояния от команды Preact. В отличие от `useState`, сигналы не вызывают ререндер всего компонента: обновляется только тот DOM-узел, который зависит от значения.

```jsx
import { signal, computed } from "@preact/signals";

const count = signal(0);
const double = computed(() => count.value * 2);

function Counter() {
  return (
    <div>
      <p>Count: {count.value}</p>
      <p>Double: {double.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

Особенности Signals:

- Значение читается через `.value`
- Можно передавать в пропсы и контекст без лишних ререндеров
- Работают вне компонентов — как глобальное состояние
- Поддерживаются и в React, и в Preact через `@preact/signals-react`

---

## Когда выбирать Preact

Preact хорош, если:

- **Критичен размер бандла** — landing page, виджеты, встраиваемые скрипты
- **Много микрофронтендов или embed-кода** — меньший рантайм = быстрее загрузка
- **Простое приложение** без Concurrent React и сложного SSR
- **Нужна миграция с React без переписывания** — `preact/compat` покрывает большинство кейсов
- **Хочется попробовать Signals** — реактивность без лишних ререндеров

---

## Когда оставить React

Preact не всегда подходит:

- **Next.js и RSC** — Server Components, Server Actions, App Router тесно связаны с React-рантаймом
- **Concurrent features** — `useTransition`, `useDeferredValue`, Suspense boundaries работают не полностью
- **React Compiler и новые фичи React 19+** — появляются раньше и лучше поддерживаются в React
- **Библиотеки с прямой зависимостью от React internals** — некоторые пакеты ломаются при алиасинге

> 💡 Preact — не замена React для всех проектов, а инструмент для сценариев, где размер и скорость важнее последних фич экосистемы.

---

## Ключевые тезисы для интервью

- Preact — рантайм с React-совместимым API, но в 4–10 раз меньше по размеру бандла.
- Внутри Preact нет Fiber, приоритетов обновлений и Concurrent Mode — рендеринг проще и предсказуемее.
- События в Preact — нативные DOM-события, без слоя SyntheticEvent.
- Preact принимает как `class`, так и `className`; предпочтителен стандартный HTML-атрибут `class`.
- `preact/compat` — тонкая прослойка, позволяющая использовать библиотеки, написанные под React, через алиасы бандлера.
- Часто применяют гибридный подход: React в dev, Preact в production — компромисс между DX и размером.
- Signals — реактивное состояние без ререндера всего компонента: обновляется только DOM-узел, зависящий от значения.
- Signals работают вне компонентов и подходят как глобальное состояние; доступны и в React через `@preact/signals-react`.
- Preact уместен для лендингов, виджетов, embed-кода и микрофронтендов, где критично время загрузки.
- Для Next.js с RSC, полной поддержки Concurrent features и последних фич React 19+ лучше остаться на React.

## Заключение

Preact решает конкретную задачу — уменьшение размера рантайма при сохранении привычного React-API. За счёт `preact/compat` большинство React-библиотек работают без переписывания, а Signals добавляют модель точечной реактивности, независимую от VDOM-ререндеров. Однако Preact — не универсальная замена: экосистема React 19+ с Server Components, Server Actions и Concurrent features требует именно React-рантайма. Выбирайте Preact там, где ключевая метрика — байты в бандле и время до интерактива; оставайтесь на React, когда важны свежие возможности экосистемы.

## Полезные ссылки

- [Preact — Official Site](https://preactjs.com/)
- [Preact vs React — Differences](https://preactjs.com/guide/v10/differences-to-react/)
- [Switching to Preact from React](https://preactjs.com/guide/v10/switching-to-preact/)
- [Preact Signals](https://preactjs.com/guide/v10/signals/)
- [@preact/preset-vite](https://github.com/preactjs/preset-vite)
