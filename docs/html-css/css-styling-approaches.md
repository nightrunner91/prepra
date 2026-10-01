---
title: "Способы применения CSS, токены и архитектура стилей"
section: html-css
description: "На современном фронтенде стили можно писать десятком способов — от архаичного `style={}` до zero-runtime компиляции. Плюс системы токенов, методологии именования и CSS custom properties для темизации. Разбираем trade-offs каждого подхода."
order: 9
tags: ["css-modules", "css-in-js", "tailwind", "custom-properties", "design-tokens", "bem"]
questions:
  - "Чем CSS Modules отличаются от глобального CSS и почему они оптимальны для React/Next.js"
  - "Как runtime CSS-in-JS (styled-components) и zero-runtime (Vanilla Extract) генерируют стили и какие проблемы каждого подхода с RSC, SSR, performance и CSP"
  - "Как Tailwind CSS формирует итоговый CSS-файл и почему utility-first подход ускоряет разработку"
  - "Что такое Shadow DOM и `@scope`, и как они обеспечивают инкапсуляцию стилей без инструментов сборки"
  - "Чем CSS custom properties отличаются от переменных препроцессоров, когда резервное значение `var(--name, fallback)` не сработает и почему для вычислений нужен `calc()`"
  - "Какие три уровня токенов (primitive, semantic, component) выделяют в дизайн-системах и зачем"
  - "В чём суть методологий BEM, CUBE и ITCSS и как они решают проблему масштабируемости стилей"
  - "Почему индустрия движется от runtime CSS-in-JS к compile-time решениям и какой стек рекомендуется в 2025–2026"
answers:
  - "Бандлер переименовывает классы в уникальные хэши вида `Button_button__x7K2p`, убирая глобальные конфликты, и генерирует объект-словарь для импорта в JS — на выходе обычный CSS с нулевым runtime, tree shaking'ом и полной поддержкой псевдоклассов/`@layer`; глобальный CSS таких гарантий не даёт и на крупных проектах требует методологии (BEM, `@layer`)."
  - "При первом рендере runtime-библиотека парсит шаблонный литерал, генерирует хэш-класс и вставляет CSS-правило в `<style>` в `<head>`; каждый уникальный набор props раздувает `<style>`, SSR требует `ServerStyleSheet`, RSC не имеют клиентского JS для генерации стилей, а CSP без `'unsafe-inline'` блокирует inline-`<style>`. Zero-runtime (Vanilla Extract) выполняет `.css.ts` в Node.js на этапе сборки и генерирует статические CSS-файлы с хэш-классами — runtime-кода нет, поэтому исчезают проблемы SSR и CSP, работают tree shaking и кеширование; плата — динамические стили ограничены CSS-переменными."
  - "Tailwind сканирует исходники на этапе сборки и генерирует минимальный CSS-файл только с используемыми утилитами — на выходе чистый CSS без runtime; утилиты прямо в JSX (включая `md:`/`hover:`/`dark:`-модификаторы) ускоряют прототипирование и убирают придумывание имён, а длинные className и глобальное пространство имён лечатся через `cva`."
  - "Shadow DOM даёт полную изоляцию стилей — они не влияют наружу и наоборот (снаружи можно стилизовать только через проникающие custom properties), а `@scope (.card) to (.card__content)` ограничивает область действия правил корнем и границей без хэширования; `@scope` не решает проблему именования вне scope и имеет ограниченную поддержку браузеров."
  - "Custom properties живут в runtime браузера и наследуются как обычные CSS-свойства: область видимости определяется селектором — `.card { --accent: green }` переопределяет значение только внутри `.card`, и это работает в медиа-запросах, псевдоклассах и через JS; переменные Sass компилируются в статические значения и такой области видимости не имеют. Fallback подставляется только если переменная не задана — если она задана, но содержит невалидное для свойства значение, свойство получит initial value; сами переменные — строки, поэтому вычисления требуют `calc(var(--base) * var(--scale))`, а для безразмерных значений применяют трюк `calc(var(--value) * 1px)`."
  - "Primitive tokens — низкоуровневые значения (`--blue-500`, `--space-4`), semantic tokens — значения смысла (`--color-surface`, `--color-text-default`), component tokens — значения для конкретного компонента (`--button-bg`); семантический слой позволяет менять тему, переназначая `--color-surface`, не трогая примитивы."
  - "BEM (`Block__Element--Modifier`) делает структуру классов предсказуемой и решает проблему специфичности, CUBE разделяет Composition/Utility/Block/Exception (раскладка отделена от внешнего вида), ITCSS организует иерархию от глобального к локальному (settings → utilities/trumps) — все три упорядочивают каскад, чтобы стили не конфликтовали на больших проектах."
  - "Runtime CSS-in-JS добавляет задержку к FCP/LCP, увеличивает JS-бандл, не работает в React Server Components (нет клиентского runtime) и ломается CSP, запрещающим inline `<style>`; рекомендуемый стек: CSS Modules + CSS-переменные + `@layer` + Tailwind, а для типизированного CSS-in-JS DX — Vanilla Extract/Panda CSS."
---

# Способы применения CSS, токены и архитектура стилей

На современном фронтенде стили можно писать десятком способов — от архаичного `style={}` до zero-runtime компиляции. Каждый подход решает свою задачу: инкапсуляцию, динамичность, производительность, DX. Отдельная часть — архитектура стилей на больших проектах: CSS custom properties для темизации, дизайн-токены и методологии именования вроде BEM, CUBE и ITCSS. На собеседовании важно не просто перечислить варианты, а объяснить trade-offs: что каждый подход даёт и что отнимает, как влияет на бандл, SSR и поддерживаемость.

## Содержание

1. [Глубокий разбор](#глубокий-разбор)
2. [Custom properties и токены](#custom-properties-и-токены)
3. [Методологии именования](#методологии-именования)
4. [Сравнительная таблица](#сравнительная-таблица)
5. [Тренд 2025–2026](#тренд-20252026)
6. [Практические примеры](#практические-примеры)
7. [Типичные ошибки и антипаттерны](#типичные-ошибки-и-антипаттерны)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Глубокий разбор

### 1. Inline styles

Стили напрямую в атрибуте `style` элемента.

```jsx
function Badge({ count }) {
  return (
    <span style={{
      backgroundColor: count > 0 ? 'red' : 'gray',
      color: 'white',
      borderRadius: 12,
      padding: '2px 8px',
      fontSize: 12,
    }}>
      {count}
    </span>
  );
}
```

**Как работает.** Браузер преобразует объект в CSS-строку и записывает в `style` элемента. Каждый рендер генерирует новый объект — React не может сравнить ссылки и обновляет DOM-атрибут.

**Плюсы:**
- Нулевая настройка — работает из коробки.
- Полный доступ к JS-переменным и props без посредников.
- Нет проблем с именами классов.

**Минусы:**
- Нельзя использовать псевдоклассы (`:hover`, `:focus`) и псевдоэлементы (`::before`).
- Нельзя использовать медиа-запросы (без JS-костылей).
- Высокая специфичность inline-атрибута — сложно переопределить.
- Нет кеширования: стили пересоздаются при каждом рендере.
- Префиксы (vendor) не добавляются автоматически.
- Нельзя анимировать через `@keyframes` (только через JS).
- Увеличение HTML-размера: стили дублируются в каждом элементе.

**Когда использовать:** Прототипы, единичные динамические значения (позиция tooltip, ширина прогресс-бара), conditional rendering простых стилей. Не подходит для системного стилирования.

---

### 2. Глобальный CSS

Классический подход: один или несколько `.css`-файлов, подключаемых через `import './styles.css'` или `<link>`.

```css
/* global.css */
.button {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}

.button:hover {
  background: #2563eb;
}
```

```jsx
import './global.css';

function Button({ children }) {
  return <button className="button">{children}</button>;
}
```

**Как работает.** CSS-файл парсится, все правила попадают в единый CSSOM. Классы глобальны — любой элемент с классом `.button` получит эти стили.

**Плюсы:**
- Максимальная простота, нет зависимостей.
- Полная мощность CSS: псевдоклассы, медиа-запросы, анимации, `@layer`.
- Кеширование браузером — файл загружается один раз.
- Минимальный размер бандла — нет runtime-кода.

**Минусы:**
- Глобальное пространство имён — конфликты классов на крупных проектах.
- Нет tree shaking: весь CSS загружается, даже неиспользуемые классы.
- Сложность отслеживания, какой компонент использует какой класс.
- Удаление класса из компонента не гарантирует, что он не используется где-то ещё.
- Порядок импортов влияет на результат.

**Когда использовать:** Малые проекты, лендинги, глобальные стили (reset, typography), утилитарные классы. На больших проектах — только в комбинации с методологией (BEM) или `@layer`.

---

### 3. CSS Modules

Файлы `.module.css`, в которых все имена классов автоматически локализуются.

```css
/* Button.module.css */
.button {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}

.primary {
  background: #3b82f6;
}

.secondary {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
}

.button:hover {
  background: #2563eb;
}
```

```jsx
import styles from './Button.module.css';

function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

**Как работает.** Бандлер (Vite, Webpack, Next.js) при сборке переименовывает классы в уникальные идентификаторы вида `Button_button__x7K2p`. CSS-файл остаётся обычным CSS, генерируется объект-словарь для импорта в JS.

```
Исходный CSS:  .button { background: blue; }
Скомпилированный: .Button_button__x7K2p { background: blue; }
```

**Плюсы:**
- Локальность классов — нет глобальных конфликтов.
- Нулевой runtime — на выходе обычный CSS-файл.
- Tree shaking: неиспользуемые классы удаляются бандлером.
- Полная поддержка CSS: псевдоклассы, медиа-запросы, анимации, `@layer`.
- Кеширование браузером.
- Предсказуемая специфичность — один класс = одна специфичность.
- Отличная поддержка в Next.js, Vite, Create React App.

**Минусы:**
- Динамические стили через props неудобны — нужны CSS-переменные или условные классы.
- Нет автоматической генерации стилей из props (в отличие от CSS-in-JS).
- `composes` работает, но менее мощён, чем наследование в styled-components.
- Имена классов в DevTools нечитаемы (хэши).

**Композиция классов:**

```css
/* base.module.css */
.base {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}

/* Button.module.css */
.button {
  composes: base from './base.module.css';
  background: #3b82f6;
  color: white;
}
```

`composes` — аналог наследования: класс `.button` получит все свойства `.base` без дублирования CSS.

**Глобальные классы внутри CSS Modules:**

```css
/* Button.module.css */
.button { /* локальный */ }

:global(.active) .button { /* глобальный .active */ }
```

**Динамические стили через CSS-переменные:**

```css
/* Card.module.css */
.card {
  width: var(--card-width, 300px);
  background: var(--card-bg, white);
}
```

```jsx
function Card({ width, bg, children }) {
  return (
    <div
      className={styles.card}
      style={{ '--card-width': `${width}px`, '--card-bg': bg }}
    >
      {children}
    </div>
  );
}
```

**Когда использовать:** Основной выбор для React/Next.js проектов среднего и крупного размера. Оптимален по соотношению DX, производительности и инкапсуляции.

---

### 4. CSS-in-JS (runtime): styled-components, Emotion

Стили описываются как JavaScript-выражения, генерируются и внедряются в DOM в runtime.

#### styled-components

```jsx
import styled from 'styled-components';

const Button = styled.button`
  background: ${p => p.$primary ? '#3b82f6' : 'transparent'};
  color: ${p => p.$primary ? 'white' : '#3b82f6'};
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid ${p => p.$primary ? 'transparent' : '#3b82f6'};

  &:hover {
    background: ${p => p.$primary ? '#2563eb' : 'rgba(59, 130, 246, 0.1)'};
  }

  @media (min-width: 768px) {
    padding: 12px 24px;
  }
`;

function App() {
  return (
    <>
      <Button $primary>Primary</Button>
      <Button>Secondary</Button>
    </>
  );
}
```

#### Emotion (object syntax)

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

const buttonStyles = (primary) => css`
  background: ${primary ? '#3b82f6' : 'transparent'};
  color: ${primary ? 'white' : '#3b82f6'};
  padding: 8px 16px;
  border-radius: 6px;
`;

function Button({ primary, children }) {
  return <button css={buttonStyles(primary)}>{children}</button>;
}
```

**Как работает.** При первом рендере компонента библиотека:
1. Парсит шаблонный литерал (или объект).
2. Генерирует уникальное имя класса (хэш).
3. Создаёт `<style>` элемент в `<head>` и вставляет CSS-правило.
4. Назначает класс элементу.

Последующие рендеры с теми же props переиспользуют кешированный класс. Новые комбинации props — новые правила.

**Transient props (`$`-префикс):**

В styled-components props с `$` не попадают в DOM — это предотвращает предупреждения React о неизвестных атрибутах.

```jsx
const Box = styled.div`
  color: ${p => p.$color};
`;

<Box $color="red" color="blue" />
// $color — только для стилизации, color — DOM-атрибут
```

**Плюсы:**
- Полная мощность JS для генерации стилей: условия, циклы, функции.
- Доступ к props, теме, контексту без посредников.
- Автоматическая инкапсуляция — уникальные имена классов.
- Автоматический vendor prefixing (через stylis в Emotion/styled-components).
- Удаление мёртвого CSS — стили удаляются при unmount компонента.
- Темизация из коробки: `<ThemeProvider>`.
- TypeScript-интеграция: типизация props и темы.

**Минусы:**
- Runtime-накладные расходы: парсинг, хэширование, DOM-манипуляции при первом рендере.
- Увеличение JS-бандла: ~10-15 KB (styled-components) или ~8 KB (Emotion).
- Дублирование CSS-правил в `<style>` при множестве уникальных комбинаций props.
- Сложности с SSR: нужно извлечь стили на сервере и передать клиенту (`ServerStyleSheet`).
- Нет кеширования CSS-файла браузером — стили живут в JS.
- Проблема «specificity war» при микшировании с глобальным CSS.
- Потенциальные проблемы с Content Security Policy (inline `<style>`).

**Производительность:** На небольших проектах незаметна. На больших (100+ компонентов с динамическими стилями) — может быть ощутима при первом рендере (FCP/LCP). Библиотеки кешируют результаты, но первый проход по-прежнему дорог.

**Когда использовать:** Проекты с высокой динамичностью стилей (theming, user-customizable UI), дизайн-системы с runtime-темизацией, команды, которым важен colocation (стили рядом с компонентом в одном файле).

---

### 5. CSS-in-JS (zero-runtime): Vanilla Extract, Linaria, Panda CSS

Стили пишутся в JS/TS, но компилируются в статические CSS-файлы на этапе сборки. Runtime-кода нет.

#### Vanilla Extract

```ts
// Button.css.ts
import { style, styleVariants } from '@vanilla-extract/css';

export const button = style({
  padding: '8px 16px',
  borderRadius: '6px',
  fontWeight: 500,
});

export const variant = styleVariants({
  primary: {
    background: '#3b82f6',
    color: 'white',
  },
  secondary: {
    background: 'transparent',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
  },
});
```

```tsx
// Button.tsx
import * as styles from './Button.css';

interface ButtonProps {
  variant?: keyof typeof styles.variant;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles.variant[variant]}`}>
      {children}
    </button>
  );
}
```

**Как работает.** Плагин для бандлера (Vite, Webpack, Next.js) на этапе сборки:
1. Находит `.css.ts` файлы.
2. Выполняет их в Node.js (не в браузере).
3. Генерирует статические `.css` файлы с хэшированными именами классов.
4. Заменяет экспорты в JS на строковые идентификаторы классов.

На выходе — обычный CSS-файл и JS без runtime-кода для стилей.

**Динамические стили через CSS-переменные:**

```ts
// Card.css.ts
import { style } from '@vanilla-extract/css';

export const card = style({
  width: 'var(--card-width)',
  background: 'var(--card-bg)',
});
```

```tsx
function Card({ width, bg, children }) {
  return (
    <div
      className={styles.card}
      style={{ '--card-width': `${width}px`, '--card-bg': bg }}
    >
      {children}
    </div>
  );
}
```

#### Linaria

```tsx
import { styled } from 'linaria/react';
import { css } from 'linaria';

const Button = styled.button<{ $primary?: boolean }>`
  background: ${p => p.$primary ? '#3b82f6' : 'transparent'};
  color: ${p => p.$primary ? 'white' : '#3b82f6'};
  padding: 8px 16px;
  border-radius: 6px;
`;
```

Linaria анализирует шаблонные литералы на этапе сборки и извлекает статические CSS-правила. Динамические значения через props компилируются в CSS-переменные.

#### Panda CSS

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#3b82f6' },
        },
      },
    },
  },
});
```

```tsx
import { css } from '../styled-system/css';

function Button({ primary, children }) {
  return (
    <button className={css({
      bg: primary ? 'primary' : 'transparent',
      color: primary ? 'white' : 'primary',
      px: 4,
      py: 2,
      rounded: 'md',
    })}>
      {children}
    </button>
  );
}
```

Panda CSS генерирует утилитарные CSS-классы на этапе сборки — подход, сочетающий DX CSS-in-JS с производительностью utility-first.

**Плюсы:**
- Нулевой runtime — на выходе статический CSS.
- Полная типизация (TypeScript-first).
- Инкапсуляция через хэшированные имена.
- Tree shaking: неиспользуемые стили не попадают в бандл.
- Кеширование CSS-файла браузером.
- Нет проблем с SSR — обычный CSS.
- Нет проблем с CSP — нет inline `<style>`.

**Минусы:**
- Динамические стили ограничены CSS-переменными (нельзя генерировать новые классы в runtime).
- Более сложная настройка (плагины для бандлера).
- Меньше библиотек и экосистемы по сравнению с runtime-решениями.
- Долгий initial build из-за компиляции.

**Когда использовать:** Когда нужен DX CSS-in-JS, но критична производительность. Оптимальный выбор для новых проектов на Next.js/Vite.

---

### 6. Utility-first CSS: Tailwind CSS

Стили собираются из атомарных утилитарных классов прямо в JSX.

```jsx
function Card({ title, description }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}
```

**Как работает.** Tailwind сканирует исходники, находит используемые утилиты и генерирует минимальный CSS-файл только с нужными классами. На этапе сборки — не runtime.

```css
/* Сгенерированный output.css */
.rounded-lg { border-radius: 0.5rem; }
.bg-white { background-color: #fff; }
.p-6 { padding: 1.5rem; }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
/* ... только используемые классы */
```

**Плюсы:**
- Минимальный CSS-бандл — только используемые утилиты.
- Нет придумывания имён классов.
- Быстрый прототипинг — стили не покидают JSX.
- Консистентность: ограничения дизайн-системы в конфиге (цвета, отступы, шрифты).
- Responsive и state-модификаторы прямо в классе: `md:flex`, `hover:bg-blue-700`.
- Тёмная тема: `dark:bg-gray-900`.
- Нет runtime — чистый CSS на выходе.

**Минусы:**
- Длинные className — ухудшение читаемости JSX.
- Нельзя выразить сложные стили (многослойные тени, кастомные анимации) без `@apply` или arbitrary values.
- CSS-файл всё ещё глобален — нет инкапсуляции на уровне компонента.
- Переключение контекста между JSX и CSS-мышлением.
- Legacy-код с Tailwind тяжело рефакторить.

**Arbitrary values:**

```jsx
<div className="w-[350px] bg-[#1da1f2] grid-cols-[repeat(3,minmax(0,1fr))]">
```

**Компонентный подход с `cva` (class-variance-authority):**

```tsx
import { cva } from 'class-variance-authority';
import { cn } from './utils';

const button = cva(
  'rounded-md font-bold transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
        ghost: 'text-blue-500 hover:bg-blue-50',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

function Button({ variant, size, className, children }) {
  return (
    <button className={cn(button({ variant, size }), className)}>
      {children}
    </button>
  );
}
```

**Когда использовать:** Команды, ценящие скорость разработки и консистентность; дизайн-системы с чёткими токенами; проекты, где важна минимальность CSS-бандла.

---

### 7. CSS `@scope`

Новый CSS-механизм для ограничения области видимости стилей без CSS Modules.

```css
@scope (.card) to (.card__content) {
  :scope {
    padding: 16px;
    background: white;
  }

  a {
    color: blue;
  }

  img {
    border-radius: 8px;
  }
}
```

**Как работает.** `@scope` определяет корень (`.card`) и границу (`.card__content`). Стили применяются только к элементам внутри этой области, не выходя за границу.

**Плюсы:**
- Нативный CSS — нет зависимостей и сборки.
- Инкапсуляция без хэширования имён.
- Можно применять к существующему CSS без миграции.

**Минусы:**
- Ограниченная поддержка браузеров (на 2026 — Chromium, частично Firefox).
- Не решает проблему именования — классы всё ещё глобальны вне scope.
- Не интегрируется с JS-модулями напрямую.

**Когда использовать:** Прогрессивное улучшение, виджеты на чистом HTML/CSS, изоляция legacy-стилей.

---

### 8. Shadow DOM и стили в Web Components

Shadow DOM обеспечивает полную инкапсуляцию: стили внутри не влияют на внешний мир и наоборот.

```js
class MyButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        button {
          background: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
        }
        button:hover {
          background: #2563eb;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}

customElements.define('my-button', MyButton);
```

**Плюсы:**
- Полная изоляция — стили не протекают ни в одну сторону.
- Идеально для переиспользуемых виджетов.
- Нативный браузерный механизм.

**Минусы:**
- Нельзя стилизовать извне (кроме custom properties, которые проникают через Shadow DOM).
- Сложности с глобальными темами и дизайн-системами.
- Не все CSS-фреймворки работают с Shadow DOM.

**Когда использовать:** Web Components, виджеты для сторонних сайтов, микрофронтенды.

---

## Custom properties и токены

### CSS custom properties

**Custom properties** (пользовательские свойства, часто называемые CSS-переменными) — это именованные значения, объявляемые с префиксом `--` и используемые через `var()`.

```css
:root {
  --color-primary: #3b82f6;
  --space-md: 1rem;
  --radius-base: 0.5rem;
}

.button {
  background: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius-base);
}
```

В отличие от препроцессорных переменных (Sass, Less), custom properties живут в runtime браузера: их можно переопределять в медиа-запросах, псевдоклассах, через JavaScript и наследовать по DOM.

### Область видимости и наследование

Custom properties наследуются, как и большинство CSS-свойств. Область видимости определяется селектором, в котором они объявлены.

```css
:root {
  --accent: blue;
}

.card {
  --accent: green;
}

.card .title {
  color: var(--accent); /* green, если .title внутри .card */
}
```

Это позволяет создавать локальные переопределения: один и тот же компонент выглядит по-разному в разных контекстах без изменения HTML или классов.

### Резервные значения

`var()` поддерживает второй аргумент — значение по умолчанию, которое используется, если переменная не определена.

```css
.button {
  color: var(--button-color, white);
}
```

Важный нюанс: резервное значение подставляется только если переменная не задана. Если переменная задана, но содержит невалидное для свойства значение, резервное не сработает — свойство получит initial value.

### Типизация и вычисления

CSS custom properties — это строки. Браузер не знает, что внутри `--size: 16px`, пока не подставит значение в свойство. Поэтому нельзя просто сложить `var(--a) + var(--b)`; для вычислений используется `calc()`.

```css
:root {
  --base: 1rem;
  --scale: 2;
}

.box {
  padding: calc(var(--base) * var(--scale));
}
```

Если переменная используется в месте, где ожидается число без единиц, применяют трюк с умножением на единицу: `calc(var(--value) * 1px)`.

### Темизация и дизайн-токены

Custom properties — стандартный способ реализации **design tokens**: именованных значений цветов, отступов, типографики, теней.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --font-base: system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111827;
    --color-text: #f9fafb;
    --color-border: #374151;
  }
}
```

Токены обычно делят на уровни:

- **Primitive tokens** — низкоуровневые значения: `--blue-500`, `--space-4`.
- **Semantic tokens** — значения смысла: `--color-surface`, `--color-text-default`.
- **Component tokens** — значения для конкретного компонента: `--button-bg`, `--input-border`.

Семантический слой позволяет менять тему, не трогая примитивы: достаточно переназначить `--color-surface` в зависимости от контекста.

### Динамические стили через CSS-переменные

Статический класс ссылается на переменные, а JS задаёт только их значения:

```css
/* Card.module.css */
.card {
  width: var(--card-width, 300px);
  background: var(--card-bg, white);
}
```

```jsx
function Card({ width, bg, children }) {
  return (
    <div
      className={styles.card}
      style={{ '--card-width': `${width}px`, '--card-bg': bg }}
    >
      {children}
    </div>
  );
}
```

Новые значения применяются без генерации новых CSS-правил, сохраняя кеширование и работая в SSR/RSC без runtime.

## Методологии именования

### BEM

**BEM** (Block, Element, Modifier) — классическая методология для именования классов:

```html
<button class="button button--primary button--large">Save</button>
```

```css
.button { }
.button__icon { }
.button--primary { }
.button--large { }
```

BEM решает проблему специфичности и делает структуру классов предсказуемой. Недостаток: длинные имена и жёсткая привязка к компоненту.

### CUBE CSS

**CUBE CSS** — подход, в котором стили разделяются на слои:

- **Composition** — раскладка и пространство (flex/grid-утилиты, контейнеры).
- **Utility** — мелкие одноцелевые классы.
- **Block** — компоненты в духе BEM.
- **Exception** — состояния и модификаторы, часто через `data-*` атрибуты.

```html
<div class="cluster | card" data-state="highlighted">
```

CUBE акцентирует внимание на глобальных утилитах и раскладке, а компоненты оставляет минималистичными.

### ITCSS

**ITCSS** (Inverted Triangle CSS) — архитектурная система, которая организует стили от глобальных к локальным:

1. Settings — переменные и конфигурация.
2. Tools — миксины и функции.
3. Generic — сбросы и нормализация.
4. Elements — стили тегов.
5. Objects — раскладочные паттерны.
6. Components — компоненты.
7. Utilities — вспомогательные классы.
8. Trumps — переопределения с высшим приоритетом.

ITCSS хорошо сочетается с `@layer`: каждый уровень треугольника может быть отдельным слоем.

### `@layer` в архитектуре

CSS Layers позволяют явно управлять приоритетом стилей, не повышая специфичность. Это особенно полезно в архитектуре, где есть reset, base, components и utilities.

```css
@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
}

@layer components {
  .button { background: blue; }
}

@layer utilities {
  .bg-red { background: red !important; }
}
```

Слои объявлены один раз, и их порядок определяет приоритет. Правила вне `@layer` имеют наивысший приоритет среди author-стилей. Без слоёв утилиты и компоненты начинают бороться через `!important` и высокую специфичность.

---

## Сравнительная таблица

| Подход | Runtime | Инкапсуляция | Динамические стили | CSS-бандл | SSR | Типизация |
|---|---|---|---|---|---|---|
| Inline | Нет | Полная | Да | Нет CSS | Да | Частичная |
| Глобальный CSS | Нет | Нет | Через CSS-переменные | Полный | Да | Нет |
| CSS Modules | Нет | Локальные классы | Через CSS-переменные | Tree-shaken | Да | Через `.d.ts` |
| CSS-in-JS (runtime) | Да | Хэш-классы | Полная | Нет CSS | Сложнее | Да |
| CSS-in-JS (zero-runtime) | Нет | Хэш-классы | CSS-переменные | Tree-shaken | Да | Да |
| Tailwind CSS | Нет | Нет (утилиты) | Через arbitrary values | Минимальный | Да | Через плагины |
| `@scope` | Нет | Через scope | Через CSS-переменные | Полный | Да | Нет |
| Shadow DOM | Нет | Полная | Да | Нет CSS | Да | Нет |

---

## Тренд 2025–2026

Индустрия движется от runtime CSS-in-JS к **compile-time решениям**. Причины:

1. **Performance.** Runtime CSS-in-JS добавляет задержку к FCP/LCP. На мобильных устройствах с низким CPU это заметно.
2. **React Server Components.** Серверные компоненты не могут использовать runtime CSS-in-JS — нет JS-рантайма на клиенте для генерации стилей. Zero-runtime решения и CSS Modules работают с RSC.
3. **Bundle size.** Каждый KB JS-бандла — это время загрузки и парсинга. CSS-файл кешируется отдельно и не блокирует JS-выполнение.
4. **CSP.** Политики безопасности всё чаще запрещают inline `<style>`, что ломает runtime CSS-in-JS.

**Рекомендуемый стек для нового React/Next.js проекта:**

- **CSS Modules** — для компонентных стилей (простота, нулевой runtime).
- **CSS-переменные** — для токенов и темизации.
- **`@layer`** — для управления каскадом.
- **Tailwind CSS** — для утилитарных стилей и быстрого прототипирования.
- **Vanilla Extract / Panda CSS** — если нужен типизированный CSS-in-JS DX без runtime.

---

## Практические примеры

### Пример 1: CSS Modules + темизация через CSS-переменные

```css
/* Button.module.css */
.button {
  --btn-bg: var(--color-primary);
  --btn-color: var(--color-text-inverted);
  --btn-border: transparent;

  background: var(--btn-bg);
  color: var(--btn-color);
  border: 1px solid var(--btn-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.button:hover {
  --btn-bg: var(--color-primary-hover);
}

.outline {
  --btn-bg: transparent;
  --btn-color: var(--color-primary);
  --btn-border: var(--color-primary);
}

.ghost {
  --btn-bg: transparent;
  --btn-color: var(--color-primary);
  --btn-border: transparent;
}

.ghost:hover {
  --btn-bg: var(--color-primary-alpha-10);
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

```tsx
import styles from './Button.module.css';
import { cn } from './utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
}

export function Button({ variant = 'solid', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        props.disabled && styles.disabled,
        className
      )}
      {...props}
    />
  );
}
```

### Пример 2: Vanilla Extract с рецептами (sprinkles)

```ts
// sprinkles.css.ts
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': '(min-width: 768px)' },
    desktop: { '@media': '(min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'grid'],
    flexDirection: ['row', 'column'],
    padding: { small: '8px', medium: '16px', large: '24px' },
    gap: { small: '8px', medium: '16px', large: '24px' },
  },
  shorthands: {
    p: ['padding'],
    fd: ['flexDirection'],
  },
});

const colorProperties = defineProperties({
  properties: {
    background: {
      primary: '#3b82f6',
      surface: '#ffffff',
      danger: '#ef4444',
    },
    color: {
      default: '#111827',
      inverted: '#ffffff',
      muted: '#6b7280',
    },
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);
```

```tsx
import { sprinkles } from './sprinkles.css';

function Card() {
  return (
    <div className={sprinkles({
      display: 'flex',
      fd: 'column',
      p: 'medium',
      background: 'surface',
      color: 'default',
      gap: { mobile: 'small', desktop: 'medium' },
    })}>
      <h2>Card title</h2>
      <p>Card content</p>
    </div>
  );
}
```

### Пример 3: Tailwind + cva — компонентный подход

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const badge = cva(
  'inline-flex items-center rounded-full font-bold',
  {
    variants: {
      variant: {
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
    },
  }
);

type BadgeProps = VariantProps<typeof badge> & {
  children: React.ReactNode;
};

function Badge({ variant, size, children }: BadgeProps) {
  return <span className={badge({ variant, size })}>{children}</span>;
}
```

### Пример 4: Миграция с runtime CSS-in-JS на CSS Modules

**До (styled-components):**

```tsx
const Card = styled.div<{ $highlighted?: boolean }>`
  padding: 16px;
  border-radius: 8px;
  background: ${p => p.$highlighted ? '#eff6ff' : '#ffffff'};
  border: 1px solid ${p => p.$highlighted ? '#3b82f6' : '#e5e7eb'};
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
`;
```

**После (CSS Modules):**

```css
/* Card.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #e5e7eb);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.highlighted {
  --card-bg: #eff6ff;
  --card-border: #3b82f6;
}
```

```tsx
import styles from './Card.module.css';
import { cn } from './utils';

function Card({ highlighted, children }) {
  return (
    <div className={cn(styles.card, highlighted && styles.highlighted)}>
      {children}
    </div>
  );
}
```

### Пример 5: `@layer` с ITCSS

```css
@layer settings, generic, elements, objects, components, utilities;

@layer settings {
  :root {
    --color-primary: #3b82f6;
    --space-2: 0.5rem;
    --space-4: 1.5rem;
    --radius-md: 0.5rem;
  }
}

@layer generic {
  *, *::before, *::after { box-sizing: border-box; }
}

@layer components {
  .button { background: var(--color-primary); }
}

@layer utilities {
  .hidden { display: none !important; }
}
```

Каждый уровень ITCSS становится отдельным слоем: утилиты перекрывают компоненты, а настройки (токены) — самый низкий приоритет.

---

## Типичные ошибки и антипаттерны

- **Inline styles для всего.** Потеря псевдоклассов, медиа-запросов, кеширования. Inline — только для truly динамических значений.
- **Смешение подходов без стратегии.** CSS Modules + styled-components + Tailwind в одном проекте — хаос. Выберите один основной подход.
- **Динамические классы через интерполяцию в CSS Modules.** `styles[\`btn-\${variant}\`]` — хрупкий и непроверяемый. Используйте явные маппинги.
- **Глобальный CSS без `@layer` или методологии.** На проекте с 50+ компонентами без системы именования — неизбежные конфликты.
- **Runtime CSS-in-JS для SSR-проектов без настройки.** Забытый `ServerStyleSheet` = стили не попадают в первый HTML.
- **Tailwind без `cva`/`tv`.** Длинный `className` с условной логикой в JSX — нечитаем. Вынесите варианты в `cva`.
- **Хранение стилей в JS-объектах.** `{ color: 'red' }` вместо CSS — потеря кеширования, нет псевдоклассов, нет DevTools.
- **Игнорирование CSS-переменных для динамических значений.** Вместо `style={{ width: value }}` — `style={{ '--width': value }}` + `width: var(--width)` в CSS.
- **Хранение в custom properties значений, которые нельзя интерполировать.** Например, `--radius: 4` без единицы требует `calc(var(--radius) * 1px)`.
- **Путаница наследования и каскада.** Custom properties наследуются, но переопределение в дочернем элементе не влияет на родителя.
- **Смешение примитивных и семантических токенов в одном слое.** Примитивы должны быть стабильными, семантические — адаптироваться под тему.
- **Переусложнённый BEM:** `header__nav__list__item__link`. Вложенность элементов в BEM не отражается в имени; достаточно `header__link`.
- **Дублирование токенов в JS и CSS.** Если цвета хранятся и в теме styled-components, и в CSS-переменных, появляется риск рассинхронизации.

---

## Ключевые тезисы для интервью

- Inline styles дают полный доступ к JS, но не поддерживают псевдоклассы, медиа-запросы и кеширование — только для единичных динамических значений. Глобальный CSS прост и быстр, но требует дисциплины (BEM, `@layer`) на крупных проектах.
- CSS Modules создают локальные классы через хэширование с нулевым runtime и полной поддержкой CSS — оптимальный выбор для React/Next.js.
- Runtime CSS-in-JS (styled-components, Emotion) даёт максимальную гибкость и DX, но создаёт runtime-накладные расходы, увеличивает JS-бандл и усложняет SSR и CSP; zero-runtime (Vanilla Extract, Panda CSS) компилирует стили на этапе сборки в чистый CSS, сохраняя DX.
- Tailwind CSS — utility-first подход: на сборке генерирует минимальный CSS только из используемых утилит, ускоряет разработку и убирает придумывание имён; длинные className лечатся через `cva`.
- Shadow DOM даёт полную изоляцию стилей для Web Components (наружу проникают только custom properties), а `@scope` ограничивает область действия правил без хэширования — нативная инкапсуляция без сборки, но с ограниченной поддержкой браузеров.
- Custom properties живут в runtime браузера, наследуются по DOM и поддерживают области видимости через селекторы — в отличие от переменных препроцессоров, которые компилируются в статические значения. `var(--name, fallback)` не сработает при невалидном значении, а вычисления требуют `calc()`.
- Токены делятся на три уровня: примитивные (цвета, размеры), семантические (ролевые: primary, danger, text) и компонентные (button-bg, card-border) — семантический слой позволяет менять тему, не трогая примитивы. Методологии BEM/CUBE/ITCSS и `@layer` упорядочивают каскад на больших проектах; тренд 2025–2026 — переход от runtime CSS-in-JS к compile-time решениям (CSS Modules + CSS-переменные + `@layer` + Tailwind).

---

## Заключение

Выбор подхода к стилизации — это компромисс между динамичностью, производительностью, инкапсуляцией и DX. Инструменты без runtime-кода (CSS Modules, Vanilla Extract, Tailwind) оптимальны для SSR-проектов и React Server Components. Runtime CSS-in-JS сохраняет ценность для сложной темизации и дизайн-систем с высокой динамикой стилей. CSS-переменные — универсальный мост между статическими стилями и динамическими значениями из JS, а токены и методологии (BEM, CUBE, ITCSS) с `@layer` решают задачу масштабируемости на больших проектах. Понимание trade-offs позволяет выбрать правильный инструмент, а не следовать трендам вслепую.

## Полезные ссылки

- [CSS Modules spec](https://github.com/css-modules/css-modules)
- [styled-components](https://styled-components.com/)
- [Emotion](https://emotion.sh/)
- [Vanilla Extract](https://vanilla-extract.style/)
- [Linaria](https://linaria.dev/)
- [Panda CSS](https://panda-css.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [class-variance-authority](https://cva.style/)
- [CSS @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
- [Shadow DOM and styling](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [var()](https://developer.mozilla.org/en-US/docs/Web/CSS/var)
- [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [BEM Methodology](https://en.bem.info/methodology/)
- [CUBE CSS](https://cube.fyi/)
- [ITCSS](https://itcss.io/)
- [Sprinkles (Vanilla Extract)](https://github.com/vanilla-extract-css/vanilla-extract/tree/master/packages/sprinkles)
- [CSS-in-JS performance comparison](https://github.com/nicolo-ribaudo/css-in-js-perf)
