---
title: "Дизайн-токены, темизация и Figma"
section: vue
description: "Дизайн-токены: уровни primitive/semantic/component, Style Dictionary pipeline, Figma как source of truth, Figma MCP и Code Connect, runtime theming во Vue, multi-brand и компонентные токены в UI-китах."
order: 20
tags: ["design-tokens", "theming", "figma", "style-dictionary", "figma-mcp", "multi-brand"]
questions:
  - "Как устроена иерархия дизайн-токенов: primitive → semantic → component, и зачем нужен слой aliases"
  - "Какую роль играет Figma как source of truth и чем Figma Variables отличаются от Tokens Studio (Figma Tokens Plugin)"
  - "Как Figma MCP и Code Connect превращают design-to-code из угадывания в переиспользование компонентов"
  - "Что делает Style Dictionary и какие transforms и platforms нужны для генерации CSS, JS и Figma-совместимых артефактов"
  - "Как устроен runtime theming во Vue через CSS custom properties и когда переключать тему атрибут versus класс"
  - "Чем multi-brand отличается от dark mode и какие архитектурные решения это меняет в токенах"
  - "Как организовать CI/CD для токенов: валидация, snapshot-тесты и visual regression"
answers:
  - "Primitive-токены — сырые значения без семантики (`blue-500`, `space-4`), semantic — назначения (`color-surface`, `color-text-default`), aliases — ссылки между токенами; component-токены — привязка к конкретному компоненту (`button-bg`). Семантический слой позволяет менять тему переназначением aliases, не трогая примитивы."
  - "Figma Variables (нативные коллекции и modes) — встроенный способ хранить токены и переключать темы/brand прямо в макете; Tokens Studio (бывший Figma Tokens Plugin) — внешний плагин с JSON-экспортом и интеграцией со Style Dictionary. Variables предпочтительнее для новых проектов, Tokens Studio — когда нужна сложная трансформация или миграция legacy."
  - "Code Connect — маппинг Figma-компонентов на реальные компоненты репозитория через аннотации; Figma MCP (`get_design_context`) возвращает структурированное дерево слоёв с подстановкой настоящих импортов и prop-маппингов. Без Code Connect агент угадывает компонент по картинке, с ним — переиспользует существующий `Button`."
  - "Style Dictionary принимает JSON-словарь токенов и генерирует платформо-специфичные артефакты (CSS custom properties, JS/TS-объекты, SCSS-переменные, Android/iOS) через transforms (camelCase, kebab-case, px→rem) и форматы; config описывает `source` (JSON), `platforms` (css, js, figma) и `transforms` цепочку."
  - "Runtime theming во Vue — переключение набора CSS custom properties на `:root` (или на `[data-theme]`); тема выбирается атрибутом `data-theme=\"dark\"` на `<html>` и переключается через `document.documentElement.setAttribute`, `useCssVars` в SFC или composable `useTheme`; атрибут предпочтительнее класса, так как не влияет на специфичность селекторов."
  - "Multi-brand требует отдельного набора semantic-токенов на каждый бренд (бренд А: `--brand-primary: blue`, бренд Б: `--brand-primary: green`), а dark mode — только переназначение semantic-токенов на те же primitive; architectural-решение: modes в Figma Variables → отдельные JSON-файлы per brand → runtime-переключение через data-атрибут."
  - "CI/CD для токенов: Style Dictionary запускается в build-пайплайне, lint-правила проверяют именование (kebab-case, отсутствие сырых значений в компонентах), snapshot-тесты фиксируют регрессии сгенерированных артефактов, Chromatic/Percy/Loki сравнивают скриншоты компонентов при изменении токенов."
---

# Дизайн-токены, темизация и Figma

Дизайн-система живёт не в коде и не в Figma — она живёт между ними. Код — это то, что видит пользователь; Figma — то, что видит дизайнер. **Дизайн-токены** — мост между этими двумя мирами: именованные значения, которые хранятся в одном месте и генерируются в CSS, JS, iOS, Android и обратно в Figma.

Для UI Engineer это центральная тема. Понимание того, как токены текут из Figma в Vue-компоненты, как устроена runtime-темизация, чем multi-brand отличается от dark mode и как автоматизировать pipeline через Style Dictionary и Figma MCP, — это то, что отличает Senior от Middle.

## Содержание

1. [Что такое дизайн-токены](#что-такое-дизайн-токены)
2. [Уровни токенов: primitive, semantic, component](#уровни-токенов-primitive-semantic-component)
3. [Типы токенов](#типы-токенов)
4. [Figma как source of truth](#figma-как-source-of-truth)
5. [Figma MCP и Code Connect](#figma-mcp-и-code-connect)
6. [Style Dictionary pipeline](#style-dictionary-pipeline)
7. [W3C Design Token Format](#w3c-design-token-format)
8. [Runtime theming во Vue](#runtime-theming-во-vue)
9. [Multi-brand и white-label](#multi-brand-и-white-label)
10. [Компонентные токены в UI-китах](#компонентные-токены-в-ui-китах)
11. [Токены и CI/CD](#токены-и-cicd)
12. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)
15. [Полезные ссылки](#полезные-ссылки)

---

## Что такое дизайн-токены

**Дизайн-токен** — именованное значение, которое представляет элемент дизайна: цвет, отступ, радиус, тень, типографику, анимацию. Токены — не CSS-классы и не стили: это **атомарные решения**, из которых собирается интерфейс.

```json
{
  "color": {
    "blue": { "500": { "value": "#3b82f6" } }
  },
  "space": {
    "4": { "value": "1rem" }
  }
}
```

Токены отличаются от обычных CSS-переменных **источником истины**. CSS custom properties — это формат доставки токенов в браузер; сами токены живут в JSON, Figma Variables или Style Dictionary и генерируются в несколько платформ.

Ключевые принципы:

- **Single source of truth.** Значение определяется один раз, используется везде.
- **Платформо-агностичность.** Один JSON генерируется в CSS, Swift, Kotlin, JS.
- **Семантическое именование.** Токены называются по назначению (`color-surface`), не по значению (`blue-500`).
- **Версионируемость.** Токены живут в репозитории, проходят review, релизятся через semver.

---

## Уровни токенов: primitive, semantic, component

Токены организуются в три (иногда четыре) уровня:

### Primitive tokens (global tokens)

Сырые значения без семантики. Это палитра и шкала:

```json
{
  "color": {
    "blue": { "50": { "value": "#eff6ff" } },
    "blue": { "500": { "value": "#3b82f6" } },
    "blue": { "900": { "value": "#1e3a8a" } }
  },
  "space": {
    "1": { "value": "0.25rem" },
    "2": { "value": "0.5rem" },
    "4": { "value": "1rem" }
  }
}
```

Примитивы **не используются напрямую в компонентах**. Это строительный материал.

### Semantic tokens (alias tokens)

Токены, привязанные к назначению. Ссылаются на примитивы через **aliases**:

```json
{
  "color": {
    "surface": { "value": "{color.white}" },
    "surface-alt": { "value": "{color.gray.50}" },
    "text-default": { "value": "{color.gray.900}" },
    "text-muted": { "value": "{color.gray.500}" },
    "primary": { "value": "{color.blue.500}" },
    "border": { "value": "{color.gray.200}" }
  }
}
```

Именно семантические токены используются в компонентах. Смена темы — это переназначение семантических токенов на другие примитивы.

### Component tokens

Токены для конкретного компонента, когда семантических недостаточно:

```json
{
  "button": {
    "bg-primary": { "value": "{color.primary}" },
    "text-primary": { "value": "{color.text-inverse}" },
    "border-radius": { "value": "{radius.md}" },
    "padding-x": { "value": "{space.4}" }
  }
}
```

Компонентные токены нужны, когда один семантический токен не покрывает варианты: у кнопки `primary` и `secondary` разные фоны, но оба ссылаются на семантический слой.

### Иерархия

```
Primitive (blue-500)
    ↓ alias
Semantic (color-primary)
    ↓ alias
Component (button-bg-primary)
```

Каждый уровень инкапсулирует изменения. Смена `blue-500` с `#3b82f6` на `#2563eb` не затрагивает компоненты. Смена `color-primary` на `green-500` меняет все первичные кнопки, но не трогает примитивы.

---

## Типы токенов

| Категория | Примеры | Назначение |
|---|---|---|
| **Color** | `color-surface`, `color-text-default`, `color-border`, `color-primary` | Цвета фона, текста, границ, акцентов |
| **Spacing** | `space-xs`, `space-sm`, `space-md`, `space-lg` | Отступы, padding, margin, gap |
| **Typography** | `font-family-base`, `font-size-md`, `line-height-normal`, `font-weight-bold` | Шрифты, размеры, межстрочные интервалы |
| **Border Radius** | `radius-sm`, `radius-md`, `radius-lg`, `radius-full` | Скругления углов |
| **Shadow** | `shadow-sm`, `shadow-md`, `shadow-lg` | Тени (elevation) |
| **Border** | `border-width-default`, `border-style-default` | Толщина и стиль границ |
| **Motion** | `duration-fast`, `duration-normal`, `easing-default` | Длительность и easing анимаций |
| **Breakpoint** | `breakpoint-sm`, `breakpoint-md`, `breakpoint-lg` | Медиа-запросы (не CSS custom properties — генерируются в JS/Tailwind) |
| **Z-index** | `z-index-dropdown`, `z-index-modal`, `z-index-toast` | Слои наложения |
| **Size** | `size-icon-sm`, `size-input-height` | Размеры иконок, инпутов |

Не все токены становятся CSS custom properties. Breakpoints, например, генерируются в JS-объекты для Tailwind или в SCSS-переменные для `@media`.

---

## Figma как source of truth

Дизайн-система начинается в Figma. Дизайнер рисует компоненты, используя токены, и эти токены должны синхронизироваться с кодом.

### Figma Variables (нативные)

Нативный механизм Figma для хранения токенов:

- **Collections** — группы переменных (Colors, Spacing, Typography).
- **Modes** — варианты значений в одной коллекции (Light, Dark, Brand A, Brand B).
- **Aliases** — переменные могут ссылаться на другие переменные.
- **Типы:** Color, Number, String, Boolean.

```
Collection: Colors
  Mode: Light
    surface = #ffffff
    text-default = #111827
  Mode: Dark
    surface = #111827
    text-default = #f9fafb
```

Переменные используются в компонентах Figma через `variable references`. При смене mode все компоненты автоматически пересчитываются.

### Tokens Studio (Figma Tokens Plugin)

До появления Figma Variables (2023) единственным способом были плагины. **Tokens Studio** (бывший Figma Tokens Plugin) — самый зрелый:

- Хранит токены в JSON-формате, совместимом со Style Dictionary.
- Экспортирует JSON для pipeline.
- Поддерживает aliases, themes, sets.
- Синхронизируется с Git (через GitHub/GitLab integration).

**Когда Figma Variables, когда Tokens Studio:**

| Аспект | Figma Variables | Tokens Studio |
|---|---|---|
| Поддержка | Нативная, без плагина | Через плагин |
| Modes | Встроенные | Через sets и themes |
| Экспорт в Style Dictionary | Через REST API | Нативный JSON |
| Legacy | Нет | Да, для старых файлов |
| Сложные трансформации | Нет | Да |

Для новых проектов — Figma Variables. Для legacy или сложной трансформации — Tokens Studio.

---

## Figma MCP и Code Connect

Figma MCP (Model Context Protocol) — сервер, который позволяет AI-агенту читать Figma-файлы и возвращать структурированный контекст. Подробно — в [MCP: Model Context Protocol](../ai/mcp.md) и [Design-to-code](../ai/greenfield-with-ai.md). Здесь — как MCP встраивается в токен-pipeline.

### Code Connect

**Code Connect** — аннотации в Figma, которые связывают Figma-компонент с кодом в репозитории:

```tsx
// Button.figma.tsx
import { Button } from './Button';

figma.connect(Button, {
  props: {
    variant: figma.enum('variant', {
      primary: 'primary',
      secondary: 'secondary',
    }),
    size: figma.enum('size', {
      sm: 'sm',
      md: 'md',
      lg: 'lg',
    }),
    children: figma.string('label'),
  },
  imports: ['import { Button } from "@ui/button"'],
});
```

Когда агент вызывает `get_design_context` по ссылке на Figma-фрейм, MCP-сервер возвращает не просто дерево слоёв, а **код с реальными импортами и prop-маппингами**:

```tsx
// Сгенерировано Figma MCP с Code Connect
import { Button } from '@ui/button';

function Screen() {
  return <Button variant="primary" size="md">Save</Button>;
}
```

### MCP и токены

Ключ к качеству — **что агент видит в контексте**. Если в Figma используются токены (через Variables или Tokens Studio), MCP возвращает имена токенов, а не сырые значения:

```json
{
  "layer": "Button",
  "props": {
    "bg": "color-primary",
    "text": "color-text-inverse"
  }
}
```

Агент генерирует код с `var(--color-primary)`, а не с `#3b82f6`. Это и есть разница между «угадай по картинке» и «переиспользуй дизайн-систему».

### Практический workflow

1. Дизайнер создаёт Figma-компонент, использует Variables для токенов.
2. Разработчик настраивает Code Connect для этого компонента.
3. В CI Style Dictionary генерирует CSS custom properties из Figma Variables (через Figma REST API).
4. Агент получает ссылку на Figma-фрейм, вызывает `get_design_context`, и в результате — готовый код с вашими компонентами и токенами.

---

## Style Dictionary pipeline

**Style Dictionary** (Amazon) — инструмент, который превращает JSON-токены в платформо-специфичные артефакты. Это центр pipeline.

### Архитектура pipeline

```
Figma Variables / Tokens Studio
         ↓ (REST API / JSON export)
    tokens.json
         ↓
   Style Dictionary
    ↓     ↓     ↓
  CSS    JS   iOS/Android
custom   TS   Swift/Kotlin
props  object
```

### Конфигурация

```js
// style-dictionary.config.js
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
      }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6',
      }],
    },
    figma: {
      transformGroup: 'figma',
      buildPath: 'dist/figma/',
      files: [{
        destination: 'tokens.json',
        format: 'json/flat',
      }],
    },
  },
};
```

### Transforms

Transforms — функции, которые преобразуют значения:

| Transform | Что делает |
|---|---|
| `name/cti/camel` | Имена в camelCase: `colorSurface` |
| `name/cti/kebab` | Имена в kebab-case: `color-surface` |
| `size/pxToRem` | `16px` → `1rem` |
| `color/css/hex` | RGB → hex |
| `color/hex8android` | Hex для Android (с alpha в начале) |
| `content/icon` | Unicode иконки для iOS |

### Кастомные transforms

```js
import StyleDictionary from 'style-dictionary';

StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => token.type === 'spacing',
  transformer: (token) => `${token.value}px`,
});
```

### Figma Tokens Plugin ↔ Style Dictionary

Tokens Studio экспортирует JSON в формате, совместимом со Style Dictionary:

```json
{
  "color": {
    "surface": {
      "value": "#ffffff",
      "type": "color"
    },
    "primary": {
      "value": "{color.blue.500}",
      "type": "color"
    }
  }
}
```

Style Dictionary разрешает aliases (`{color.blue.500}` → `#3b82f6`) и генерирует артефакты.

---

## W3C Design Token Format

**Design Tokens Community Group (DTCG)** работает над стандартом формата токенов. Текущий черновик — `$value`, `$type`, `$description`:

```json
{
  "color": {
    "surface": {
      "$value": "#ffffff",
      "$type": "color",
      "$description": "Default surface color"
    },
    "primary": {
      "$value": "{color.blue.500}",
      "$type": "color"
    }
  }
}
```

Style Dictionary 4+ поддерживает DTCG-формат. Figma Variables могут экспортироваться в DTCG через плагины.

Почему это важно: стандарт позволяет инструментам разных вендоров (Figma, Framer, Storybook) обмениваться токенами без кастомных трансформаций.

---

## Runtime theming во Vue

Сгенерированные CSS custom properties нужно переключать в runtime. Во Vue это делается через data-атрибуты или классы на `<html>`.

### Паттерн: data-атрибут

```css
/* tokens.css */
:root {
  --color-surface: #ffffff;
  --color-text-default: #111827;
}

[data-theme="dark"] {
  --color-surface: #111827;
  --color-text-default: #f9fafb;
}
```

```vue
<!-- App.vue -->
<script setup>
import { ref, watch } from 'vue';

const theme = ref<'light' | 'dark'>('light');

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}, { immediate: true });
</script>
```

Почему атрибут, а не класс:

- Не влияет на специфичность селекторов.
- Легче комбинировать (theme + brand + reduced-motion).
- Семантически яснее.

### Composable `useTheme`

```ts
// composables/useTheme.ts
import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const theme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'system'
  );

  const resolved = ref<'light' | 'dark'>(
    theme.value === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme.value
  );

  watch([theme, resolved], ([t, r]) => {
    document.documentElement.setAttribute('data-theme', r);
    localStorage.setItem('theme', t);
  }, { immediate: true });

  function setTheme(t: Theme) {
    theme.value = t;
    resolved.value = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
  }

  return { theme, resolved, setTheme };
}
```

### `useCssVars` для компонентов

Если компонент принимает пропсы и хочет пробросить их в CSS:

```vue
<script setup>
import { useCssVars } from 'vue';

const props = defineProps<{ accentColor: string }>();

useCssVars(() => ({
  'button-accent': props.accentColor,
}));
</script>

<template>
  <button class="btn">Click me</button>
</template>

<style scoped>
.btn {
  background: var(--button-accent);
}
</style>
```

Это runtime-связь между props и CSS custom properties. Подробнее — в [Стилизация во Vue](./styling.md).

---

## Multi-brand и white-label

**Dark mode** — переназначение semantic-токенов на те же primitive. **Multi-brand** — отдельный набор semantic-токенов на каждый бренд.

### Архитектура multi-brand

```json
// tokens/brand-a/semantic.json
{
  "color": {
    "primary": { "value": "{color.blue.500}" },
    "surface": { "value": "{color.white}" }
  }
}

// tokens/brand-b/semantic.json
{
  "color": {
    "primary": { "value": "{color.green.500}" },
    "surface": { "value": "{color.gray.50}" }
  }
}
```

Style Dictionary генерирует отдельный CSS-файл на бренд:

```css
/* tokens-brand-a.css */
[data-brand="a"] {
  --color-primary: #3b82f6;
  --color-surface: #ffffff;
}

/* tokens-brand-b.css */
[data-brand="b"] {
  --color-primary: #22c55e;
  --color-surface: #f9fafb;
}
```

### Runtime-переключение

```ts
function setBrand(brand: 'a' | 'b') {
  document.documentElement.setAttribute('data-brand', brand);
}
```

### Figma modes для brands

В Figma Variables это modes:

```
Collection: Colors
  Mode: Brand A
    primary = {blue.500}
  Mode: Brand B
    primary = {green.500}
```

Дизайнер переключает mode в Figma и видит оба бренда. Style Dictionary экспортирует каждый mode в отдельный файл.

---

## Компонентные токены в UI-китах

UI-киты (Element Plus, Vuetify, PrimeVue) используют токены для темизации. Рассмотрим, как это устроено.

### Element Plus

Element Plus использует CSS custom properties:

```css
:root {
  --el-color-primary: #409eff;
  --el-color-success: #67c23a;
  --el-font-size-base: 14px;
  --el-border-radius-base: 4px;
}
```

Переопределение:

```css
:root {
  --el-color-primary: #3b82f6;
}
```

### Vuetify

Vuetify 3 использует JavaScript-объект для темы:

```ts
import { createVuetify } from 'vuetify';

export default createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#409eff',
          secondary: '#67c23a',
        },
      },
      dark: {
        colors: {
          primary: '#3b82f6',
          secondary: '#22c55e',
        },
      },
    },
  },
});
```

Vuetify генерирует CSS custom properties runtime, что даёт гибкость, но добавляет overhead.

### PrimeVue (unstyled mode)

PrimeVue 4+ поддерживает unstyled-режим, где стили полностью кастомизируются через passthrough-токены:

```vue
<Button
  severity="primary"
  :pt="{
    root: { class: 'px-4 py-2 rounded bg-blue-600 text-white' }
  }"
/>
```

Это подход, при котором UI-кит не навязывает стили, а даёт хуки для вашей дизайн-системы.

### Компонентные токены в своём UI-ките

Если вы строите свой UI-кит, паттерн:

```vue
<!-- Button.vue -->
<script setup>
const props = defineProps<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}>();
</script>

<template>
  <button :class="['btn', `btn--${variant}`, `btn--${size}`]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  background: var(--button-bg);
  color: var(--button-text);
  padding: var(--button-padding);
  border-radius: var(--button-border-radius);
}

.btn--primary {
  --button-bg: var(--color-primary);
  --button-text: var(--color-text-inverse);
}

.btn--secondary {
  --button-bg: var(--color-surface-alt);
  --button-text: var(--color-text-default);
}

.btn--sm {
  --button-padding: var(--space-2) var(--space-3);
}

.btn--md {
  --button-padding: var(--space-3) var(--space-4);
}

.btn--lg {
  --button-padding: var(--space-4) var(--space-5);
}
</style>
```

Компонентные токены (`--button-bg`) ссылаются на семантические (`--color-primary`), которые ссылаются на primitive (`--blue-500`). Это даёт три уровня кастомизации:

1. **Primitive:** сменить `blue-500` → все синие элементы меняются.
2. **Semantic:** сменить `color-primary` на `green-500` → все primary-элементы меняются.
3. **Component:** сменить `--button-bg` → только кнопка меняется.

---

## Токены и CI/CD

Токены — код. Они должны проходить через CI/CD, как любой другой код.

### Pipeline

```
Figma (дизайнер обновляет Variables)
    ↓
Figma REST API / Tokens Studio export
    ↓
tokens.json в репозитории
    ↓
CI: Style Dictionary build
    ↓
CI: lint (именование, типы, отсутствующие aliases)
    ↓
CI: snapshot-тесты (CSS/JS артефакты не изменились)
    ↓
CI: visual regression (Chromatic/Percy/Loki)
    ↓
npm publish / deploy
```

### Lint-правила

```js
// scripts/lint-tokens.js
import tokens from '../tokens.json' assert { type: 'json' };

function lintTokens(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (value.value) {
      // Проверка: значение — не сырой hex, а alias
      if (/^#[0-9a-f]{6}$/i.test(value.value) && path.includes('component')) {
        throw new Error(
          `Component token ${path}.${key} uses raw value ${value.value}. Use alias instead.`
        );
      }
    }
    if (typeof value === 'object' && !value.value) {
      lintTokens(value, `${path}.${key}`);
    }
  }
}

lintTokens(tokens);
```

### Snapshot-тесты

```ts
// tests/tokens.snapshot.test.ts
import { describe, it, expect } from 'vitest';
import tokens from '../dist/js/tokens.js';

describe('design tokens', () => {
  it('matches snapshot', () => {
    expect(tokens).toMatchSnapshot();
  });
});
```

Если дизайнер меняет `blue-500` с `#3b82f6` на `#2563eb`, snapshot падает. Это сигнал, что токены изменились, и нужно проверить visual regression.

### Visual regression

Инструменты Chromatic, Percy, Loki сравнивают скриншоты компонентов до и после изменения токенов:

```ts
// chromatic test
import { composeStories } from '@storybook/react';
import * as stories from './Button.stories';

const { Primary, Secondary } = composeStories(stories);

test('Primary button should not change visually', async () => {
  const image = await Primary.compose().snapshot();
  expect(image).toMatchImageSnapshot();
});
```

Если изменение токенов намеренное — апрувните снимок в Chromatic. Если нет — откатите.

---

## Лучшие практики и антипаттерны

### Делайте

- **Используйте Figma Variables** для новых проектов — нативная поддержка modes и aliases.
- **Настройте Code Connect** для ключевых компонентов — без него Figma MCP угадывает.
- **Храните токены в репозитории**, а не только в Figma — версионируемость и review.
- **Разделяйте уровни токенов**: primitive, semantic, component. Не пропускайте semantic.
- **Используйте aliases** в semantic и component — это даёт гибкость при смене темы.
- **Автоматизируйте pipeline** через Style Dictionary и CI — ручная генерация устаревает.
- **Тестируйте токены** через snapshot-тесты и visual regression.
- **Документируйте токены** в Storybook или VitePress с живыми примерами.

### Не делайте

- **Не используйте primitive-токены в компонентах** (`color-blue-500` вместо `color-primary`).
- **Не хардкодьте значения** в компонентах (`background: #3b82f6` — антипаттерн).
- **Не создавайте компонентные токены без необходимости** — если хватает semantic, не плодите сущности.
- **Не генерируйте токены вручную** — автоматизируйте через Style Dictionary.
- **Не игнорируйте visual regression** — изменение токена может сломать контраст или spacing.
- **Не смешивайте runtime theming с CSS Modules** — они не комбинируются предсказуемо.
- **Не храните токены только в Figma** — без экспорта в репозиторий нет версионируемости.

---

## Ключевые тезисы для интервью

- Дизайн-токены — именованные значения дизайна, организованные в три уровня: primitive (сырые значения), semantic (назначения со ссылками на primitive через aliases) и component (привязка к конкретному компоненту). Семантический слой позволяет менять тему переназначением aliases, не трогая примитивы.
- Figma Variables — нативный механизм для хранения токенов с modes (Light, Dark, Brand A) и aliases; Tokens Studio — внешний плагин с JSON-экспортом для Style Dictionary. Для новых проектов предпочтительнее Variables.
- Figma MCP через `get_design_context` возвращает структурированное дерево слоёв с подстановкой реальных импортов и prop-маппингов из Code Connect — без Code Connect агент угадывает компонент по картинке, с ним переиспользует существующий.
- Style Dictionary принимает JSON-токенов и генерирует платформо-специфичные артефакты (CSS custom properties, JS/TS, Swift, Kotlin) через transforms (camelCase, kebab-case, px→rem) и форматы; конфигурация описывает source, platforms и transforms.
- Runtime theming во Vue — переключение набора CSS custom properties через data-атрибут (`data-theme="dark"`) на `<html>`; атрибут предпочтительнее класса, так как не влияет на специфичность и комбинируется с `data-brand`.
- Multi-brand требует отдельного набора semantic-токенов на каждый бренд (отдельные JSON-файлы → отдельные CSS-файлы → runtime-переключение через `data-brand`); dark mode — только переназначение semantic-токенов на те же primitive.
- CI/CD для токенов: Style Dictionary в build-пайплайне, lint (именование, отсутствие сырых значений в компонентах), snapshot-тесты артефактов, visual regression через Chromatic/Percy/Loki — изменение токена триггерит проверку контраста и spacing.

---

## Заключение

Дизайн-токены — это мост между Figma и кодом. Они организуются в три уровня (primitive → semantic → component), хранятся в JSON или Figma Variables, генерируются через Style Dictionary в CSS, JS и другие платформы, и поставляются в Vue-приложение как CSS custom properties. Runtime theming переключает наборы токенов через data-атрибуты, multi-brand требует отдельного набора semantic-токенов на каждый бренд.

Figma MCP и Code Connect превращают design-to-code из угадывания в переиспользование компонентов, но только при условии, что токены настроены. CI/CD для токенов включает lint, snapshot-тесты и visual regression — это защита от незаметных изменений контраста и spacing.

Для UI Engineer важно понимать не просто «что такое токены», а как они текут из Figma в Vue, как устроена runtime-темизация, чем multi-brand отличается от dark mode, и как автоматизировать pipeline. Это то, что отличает Senior от Middle на собеседовании.

---

## Полезные ссылки

- [Style Dictionary](https://amzn.github.io/style-dictionary/) — официальная документация.
- [Design Tokens W3C Community Group](https://design-tokens.github.io/community-group/format/) — спецификация формата токенов.
- [Figma Variables](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-variables-in-Figma) — руководство по Variables.
- [Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/) — документация MCP-сервера.
- [Figma Code Connect](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/) — интеграция кода с Figma.
- [Tokens Studio](https://tokens.studio/) — плагин для работы с токенами в Figma.
- [Chromatic](https://www.chromatic.com/) — visual regression testing.
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/) — W3C инициатива.
- [Figma REST API](https://www.figma.com/developers/api) — для автоматизации экспорта Variables.
