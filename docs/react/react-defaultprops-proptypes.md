---
title: "defaultProps и propTypes в React"
section: react
description: "Классические механизмы React для валидации и задания значений по умолчанию для пропсов. С появлением TypeScript уступили место compile-time проверке, но необходимы для работы с legacy-кодом."
order: 2
tags: ["defaultprops", "proptypes", "prop-types", "typescript", "validation"]
questions:
  - "Как работает propTypes и какие валидаторы доступны"
  - "Что делает .isRequired при валидации пропсов"
  - "Почему propTypes игнорируется в production-сборке"
  - "Как работает порядок разрешения props: JSX → defaultProps → undefined"
  - "Почему defaultProps deprecated для функциональных компонентов в React 19+"
  - "Чем TypeScript лучше propTypes для типизации пропсов"
  - "Как во Vue аналогичные механизмы встроены в defineProps"
---

# defaultProps и propTypes в React

`propTypes` и `defaultProps` — классические механизмы React для валидации и задания значений по умолчанию для пропсов компонентов. С появлением TypeScript они уступили место compile-time проверке, но понимание этих API необходимо для работы с legacy-кодом и классами. В этой статье разберём оба механизма, их современные альтернативы и сравнение с Vue.

## Содержание

1. [propTypes](#proptypes)
2. [defaultProps](#defaultprops)
3. [Современная альтернатива: TypeScript](#современная-альтернатива-typescript)
4. [Сравнение с Vue](#сравнение-с-vue)
5. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
6. [Заключение](#заключение)

---

## propTypes

`propTypes` — статическое свойство компонента для декларирования типов и валидации props. Работает только в runtime (не в compile-time).

```jsx
import PropTypes from 'prop-types';

function Button({ label, onClick, size }) {
  return <button onClick={onClick} className={size}>{label}</button>;
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};
```

### Встроенные валидаторы

| Валидатор | Описание |
|-----------|----------|
| `PropTypes.string` | Строка |
| `PropTypes.number` | Число |
| `PropTypes.bool` | Булевое значение |
| `PropTypes.func` | Функция |
| `PropTypes.object` | Объект |
| `PropTypes.array` | Массив |
| `PropTypes.node` | Любой рендеримый узел |
| `PropTypes.element` | React-элемент |
| `PropTypes.instanceOf(Class)` | Экземпляр класса |
| `PropTypes.oneOf(['a', 'b'])` | Одно из значений (enum) |
| `PropTypes.oneOfType([...])` | Один из типов |
| `PropTypes.arrayOf(...)` | Массив определённого типа |
| `PropTypes.shape({...})` | Объект с конкретной формой |
| `PropTypes.exact({...})` | Объект без лишних ключей |

### `.isRequired`

Добавление `.isRequired` к любому валидатору делает prop обязательным. В консоли появится предупреждение, если prop не передан.

```jsx
Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
```

> **Примечание:** `propTypes` игнорируется в production-сборке. Валидация работает только в development.

---

## defaultProps

`defaultProps` — статическое свойство, задающее значения по умолчанию для props, если они не были переданы.

```jsx
function Button({ label, size, disabled }) {
  return <button disabled={disabled} className={size}>{label}</button>;
}

Button.defaultProps = {
  label: 'Click me',
  size: 'md',
  disabled: false,
};
```

### Порядок разрешения props

1. Значение, переданное в JSX (`<Button label="Submit" />`)
2. Значение из `defaultProps`
3. `undefined`

### defaultProps с функциональными компонентами

```jsx
function Greeting({ name = 'World', greeting = 'Hello' }) {
  return <h1>{greeting}, {name}!</h1>;
}
```

Parameters with defaults (деструктуризация с дефолтами) — современный и рекомендуемый способ. `defaultProps` считается устаревшим подходом для функциональных компонентов.

### defaultProps с class-компонентами

```jsx
class Button extends React.Component {
  static defaultProps = {
    size: 'md',
    disabled: false,
  };

  render() {
    const { size, disabled, label } = this.props;
    return <button disabled={disabled} className={size}>{label}</button>;
  }
}
```

---

## Современная альтернатива: TypeScript

React-сообщество постепенно отказывается от `propTypes` в пользу TypeScript, который даёт compile-time проверку:

```tsx
interface ButtonProps {
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function Button({ label, onClick, size = 'md' }: ButtonProps) {
  return <button onClick={onClick} className={size}>{label}</button>;
}
```

Преимущества TypeScript перед propTypes:
- Проверка на этапе компиляции, а не runtime
- Автодополнение в IDE
- Не нужен дополнительный пакет `prop-types`
- Более выразительная система типов (generics, union types, utility types)

---

## Сравнение с Vue

### Vue: `defineProps` + `defineEmits` (Composition API)

```vue
<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>
```

### Vue: TypeScript с `defineProps`

```vue
<script setup lang="ts">
interface Props {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
});
</script>
```

### Таблица соответствий

| Концепция | React | Vue 3 |
|-----------|-------|-------|
| Объявление типов props | `Component.propTypes = {...}` | `defineProps({...})` или `defineProps<T>()` |
| Значения по умолчанию | `Component.defaultProps = {...}` или деструктуризация | `withDefaults()` или `defineProps` с `default` |
| Обязательные props | `PropTypes.string.isRequired` | `required: true` в options API |
| Валидация значений | `PropTypes.oneOf([...])` | `validator: (val) => ...` |
| Runtime-валидация | `prop-types` (отдельный пакет) | Встроена в Vue (dev-only) |
| Compile-time проверка | TypeScript | TypeScript (`lang="ts"`) |
| Вложенная валидация | `PropTypes.shape({...})` | Нет встроенного аналога |
| Массив определённого типа | `PropTypes.arrayOf(...)` | `type: Array` (без параметризации) |

### Ключевые различия

**1. Где объявляются**

```jsx
// React — ВНЕ компонента (или как static property)
Button.propTypes = { ... };
Button.defaultProps = { ... };
```

```vue
<!-- Vue — ВНУТРИ <script setup> -->
<script setup>
const props = defineProps({ ... });
</script>
```

**2. Объединение типов и дефолтов**

```jsx
// React — раздельно
Button.propTypes = { size: PropTypes.string };
Button.defaultProps = { size: 'md' };
// Или через деструктуризацию
function Button({ size = 'md' }) { ... }
```

```vue
<!-- Vue — вместе -->
<script setup>
defineProps({
  size: { type: String, default: 'md' }
});
</script>
```

**3. Валидация**

```jsx
// React — через prop-types (нужна установка)
import PropTypes from 'prop-types';
Button.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};
```

```vue
<!-- Vue — встроено, без дополнительных пакетов -->
<script setup>
defineProps({
  size: {
    type: String,
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
});
</script>
```

**4. Предупреждения**

Оба фреймворка выводят предупреждения в консоль только в development-режиме. В production валидация отключена.

**5. React 19+ — defaultProps для функциональных компонентов**

Начиная с React 19, `defaultProps` для функциональных компонентов **deprecated**. Рекомендуется использовать значения по умолчанию через деструктуризацию:

```jsx
// React 19+ (рекомендуется)
function Button({ size = 'md', label = 'Click' }) { ... }

// React 19+ (deprecated для функциональных компонентов)
Button.defaultProps = { size: 'md' };
```

Для class-компонентов `defaultProps` остаётся поддерживаемым.

---

## Ключевые тезисы для интервью

- `propTypes` — runtime-валидация пропсов, работает только в development-режиме.
- `defaultProps` задаёт значения по умолчанию; для функциональных компонентов deprecated в React 19+.
- Порядок разрешения props: JSX → defaultProps → undefined.
- Современная альтернатива `propTypes` — TypeScript с compile-time проверкой.
- В Vue `defineProps` объединяет типы и дефолты, валидация встроена без доп. пакетов.
- React 19+ рекомендует деструктуризацию с дефолтами вместо `defaultProps` для функциональных компонентов.
- `propTypes` игнорируется в production-сборке.

## Заключение

`propTypes` и `defaultProps` — исторически важные API React, которые в 2026 году в значительной степени заменены TypeScript. Для функциональных компонентов `defaultProps` deprecated — используйте деструктуризацию с дефолтами. `propTypes` остаётся в legacy-коде, но новые проекты должны использовать TypeScript для compile-time типизации. Во Vue аналогичные механизмы (`defineProps`, `withDefaults`) встроены в фреймворк и не требуют отдельных пакетов.

## Полезные ссылки

- [TypeScript with React](https://react.dev/learn/typescript)
- [prop-types (npm)](https://www.npmjs.com/package/prop-types)
- [Vue defineProps](https://vuejs.org/api/sfc-script-setup.html#defineprops)
