---
title: "UI-киты, headless-компоненты и Storybook"
section: html-css
description: "Как выбирать и строить UI-библиотеки: styled и headless киты, shadcn/ui, API компонентов, доступность, Storybook, иконки, поставка и тестирование дизайн-системы."
order: 11
tags: ["ui-kit", "headless-ui", "storybook", "shadcn", "component-api", "design-system"]
questions:
  - "Чем styled UI-кит отличается от headless-библиотеки и от подхода shadcn/ui"
  - "По каким критериям выбирать UI-библиотеку для продукта"
  - "Почему доступный dropdown или combobox сложно написать самому и что берут на себя headless-примитивы"
  - "Как устроены compound components и зачем библиотеке controlled и uncontrolled режимы"
  - "Чем prop `as` отличается от паттерна `asChild` и какие проблемы решает каждый"
  - "Как описывать варианты компонента без взрыва boolean-пропсов"
  - "Какие задачи решает Storybook помимо витрины компонентов"
  - "Какую стратегию иконок выбрать и почему icon fonts считаются антипаттерном"
  - "Как правильно опубликовать библиотеку компонентов как npm-пакет"
  - "Когда нативные `<dialog>` и Popover API могут заменить библиотечные компоненты"
answers:
  - "Styled-кит (MUI, Ant Design, Vuetify) даёт готовые компоненты со своим визуальным языком; headless-библиотека (Radix, React Aria, Reka UI, Ark UI) даёт только поведение, состояние и доступность без стилей. shadcn/ui — это не зависимость, а CLI, который копирует исходники компонентов на базе headless-примитивов и Tailwind в ваш репозиторий, и вы ими владеете."
  - "Критерии: доступность, степень кастомизации под свою дизайн-систему, совместимость с SSR и RSC (runtime CSS-in-JS там проблемен), размер бандла и tree shaking, темизация через токены, i18n и RTL, лицензия (платные Pro-компоненты) и активность поддержки. Для внутренней админки выигрывает styled-кит, для продукта с собственным брендом — headless плюс свои стили."
  - "Доступный combobox требует ARIA-ролей и связей (`aria-expanded`, `aria-controls`, `aria-activedescendant`), полной клавиатурной навигации, typeahead, управления фокусом, портала с позиционированием и обработкой коллизий, а также корректной работы со скринридерами в разных браузерах. Headless-примитивы реализуют паттерны WAI-ARIA APG, оставляя вам только стили."
  - "Compound components разбивают компонент на части (`Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`), которые делят состояние через контекст, поэтому разметку можно свободно компоновать без десятков пропсов. Controlled-режим (`value` + `onValueChange`) отдаёт состояние родителю, uncontrolled (`defaultValue`) хранит его внутри; библиотека поддерживает оба через хелпер вроде `useControllableState`."
  - "`as` меняет рендерящийся элемент (`<Button as=\"a\">`), но плохо типизируется и смешивает пропсы двух компонентов. `asChild` (Slot) не рендерит свой элемент, а сливает свои пропсы, обработчики, классы и ref с единственным ребёнком: можно передать `<Link>` из роутера и сохранить его типы."
  - "Варианты описывают как перечисления (`variant: 'primary' | 'outline'`, `size: 'sm' | 'md'`), а не как набор `isPrimary`, `isLarge`, `isOutline`, которые дают невалидные комбинации. Утилиты cva или tailwind-variants декларативно маппят варианты на классы, а tailwind-merge разрешает конфликты с переданным `className`."
  - "Storybook — изолированная среда разработки и живая документация: stories фиксируют состояния компонента, controls дают поиграть с пропсами, play-функции выполняют interaction-тесты, addon-a11y прогоняет axe, а Chromatic делает visual regression по тем же stories. Это ещё и общий язык с дизайнерами и QA."
  - "Inline SVG-компоненты или SVG-спрайт с `<use href>` наследуют цвет через `currentColor`, масштабируются и поддерживают tree shaking. Icon fonts рендерятся как текст: размываются при сглаживании, ломаются при блокировке шрифтов, скринридеры читают глифы, а неиспользуемые иконки всё равно загружаются."
  - "Пакет собирают в ESM с декларациями типов, описывают точки входа через `exports`, фреймворк выносят в `peerDependencies`, CSS-файлы отмечают в `sideEffects`, чтобы бандлер не выкинул их при tree shaking. Версионируют по semver через changesets, а breaking changes сопровождают deprecation-периодом и codemod."
  - "`<dialog>` с `showModal()` выводит окно в top layer, делает остальную страницу inert, закрывается по Escape и даёт `::backdrop`; Popover API (`popover` + `popovertarget`) даёт light dismiss и top layer для меню и тултипов без JS. Библиотека остаётся нужна для сложных паттернов (combobox, date picker), позиционирования с коллизиями там, где нет anchor positioning, и единообразного API."
---

# UI-киты, headless-компоненты и Storybook

На позиции UI Engineer спрашивают не «знаете ли вы MUI», а «как бы вы построили или выбрали фундамент для интерфейсов всей компании». Нужно объяснить, почему команда берёт headless-примитивы вместо готового кита, как спроектировать API компонента `Select`, чем `asChild` лучше `as`, как Storybook становится контрактом между дизайном и кодом и как опубликовать библиотеку так, чтобы её было удобно использовать. Статья собирает эту область целиком; токены и способы стилизации разобраны в соседних статьях про [дизайн-токены](./design-tokens-and-figma.md) и [подходы к CSS](./css-styling-approaches.md).

## Содержание

1. [Ландшафт UI-библиотек](#ландшафт-ui-библиотек)
2. [Как выбрать UI-библиотеку](#как-выбрать-ui-библиотеку)
3. [Headless-компоненты и доступность](#headless-компоненты-и-доступность)
4. [Проектирование API компонентов](#проектирование-api-компонентов)
5. [Модель shadcn/ui](#модель-shadcnui)
6. [Платформа вместо библиотеки](#платформа-вместо-библиотеки)
7. [Storybook](#storybook)
8. [Иконки и SVG](#иконки-и-svg)
9. [Поставка библиотеки компонентов](#поставка-библиотеки-компонентов)
10. [Качество и тестирование UI-кита](#качество-и-тестирование-ui-кита)
11. [Практические задачи на собеседовании](#практические-задачи-на-собеседовании)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Ландшафт UI-библиотек

UI-библиотеки различаются тем, **сколько решений они принимают за вас**: от «всё готово, включая внешний вид» до «только поведение и доступность».

```
Больше контроля                                               Быстрее старт
◀──────────────────────────────────────────────────────────────────────────▶
Свои компоненты   Headless-примитивы   Copy-paste (shadcn)   Styled-киты
с нуля            Radix, React Aria,   код в вашем репо      MUI, Ant Design,
                  Reka UI, Ark UI                            Vuetify, PrimeVue
```

### Styled-киты

Готовые компоненты с собственным визуальным языком и темизацией.

| Библиотека | Экосистема | Особенности |
|---|---|---|
| **MUI (Material UI)** | React | Material Design, огромный набор, MUI X (DataGrid, Date Pickers) с платными Pro/Premium-версиями |
| **Ant Design** | React (есть порты на Vue) | Enterprise-админки, богатые таблицы и формы |
| **Mantine** | React | Много компонентов и хуков, хорошая документация |
| **Chakra UI** | React | Style props; v3 построен на Ark UI |
| **Vuetify** | Vue | Material Design для Vue |
| **PrimeVue / PrimeReact** | Vue, React | Большой набор, styled и unstyled режимы |
| **Element Plus, Naive UI, Quasar** | Vue | Популярны для админок и кроссплатформенных приложений |

**Сильные стороны**: быстрый старт, сложные компоненты из коробки (таблицы, date picker, tree view).
**Слабые стороны**: кастомизация под свой бренд превращается в борьбу с чужими стилями, узнаваемый «шаблонный» вид, иногда тяжёлый бандл и runtime CSS-in-JS.

### Headless-библиотеки

Дают **поведение, состояние, клавиатурную навигацию и ARIA**, но не дают стилей.

| Библиотека | Экосистема | Подход |
|---|---|---|
| **Radix UI Primitives** | React | Compound components, `asChild`, data-атрибуты состояния |
| **Base UI** | React | Unstyled-компоненты от авторов Radix, MUI и Floating UI |
| **React Aria (Adobe)** | React | Хуки и компоненты с очень глубокой проработкой a11y и i18n |
| **Headless UI** | React, Vue | От авторов Tailwind, небольшой набор компонентов |
| **Reka UI** (бывший Radix Vue) | Vue | Порт идей Radix во Vue |
| **Ark UI** | React, Vue, Solid, Svelte | Построен на Zag.js: логика компонентов в виде фреймворк-независимых state machines |

### Copy-paste и владение кодом

**shadcn/ui** (и порты shadcn-vue, shadcn-svelte) — не npm-зависимость, а CLI, который копирует исходники компонентов в ваш проект. Под капотом headless-примитивы и Tailwind. Подробно — в разделе [модель shadcn/ui](#модель-shadcnui).

### Web Components

Фреймворк-независимые киты на Custom Elements: **Web Awesome** (развитие Shoelace), **Lit**-based дизайн-системы (Adobe Spectrum Web Components, Material Web). Выбирают, когда один кит нужен сразу в React, Vue, Angular и legacy. Детали интеграции — в статье [Веб-компоненты и UI-киты во Vue](../vue/web-components-and-ui-kits.md).

### Специализированные инструменты

UI-инженер редко пишет эти вещи с нуля:

| Задача | Инструменты |
|---|---|
| Позиционирование поповеров, тултипов | Floating UI |
| Таблицы | TanStack Table (headless), AG Grid |
| Виртуализация списков | TanStack Virtual, vue-virtual-scroller |
| Формы | React Hook Form, TanStack Form, VeeValidate, FormKit |
| Анимации | Motion (бывший Framer Motion), Vue `<Transition>`, View Transitions API |
| Иконки | Lucide, Heroicons, Iconify, unplugin-icons |
| Варианты классов | cva, tailwind-variants, tailwind-merge, clsx |
| Графики | Recharts, ECharts, visx, Chart.js |
| Toasts | Sonner, vue-sonner |
| Command palette | cmdk |

---

## Как выбрать UI-библиотеку

### Критерии

| Критерий | Что проверить |
|---|---|
| **Доступность** | Следует ли WAI-ARIA APG, тестировалась ли со скринридерами, работает ли клавиатура везде |
| **Кастомизация** | Можно ли полностью перекрасить под свою дизайн-систему без `!important` и переопределения внутренних классов |
| **Стилизация и SSR** | Runtime CSS-in-JS (Emotion, styled-components) плохо совместим с React Server Components и строгим CSP (подробнее — в [подходах к CSS](./css-styling-approaches.md)) |
| **Бандл** | Tree shaking, импорт по компонентам, вес базовых зависимостей |
| **Темизация** | Токены через CSS custom properties, dark mode, multi-brand |
| **i18n** | RTL, локализация дат и чисел, переводимые строки внутри компонентов |
| **Покрытие** | Есть ли сложные компоненты, которые нужны (data grid, date range picker, tree) |
| **Лицензия** | MIT или коммерческая, платные Pro-компоненты |
| **Поддержка** | Частота релизов, открытые issues, bus factor, политика breaking changes |
| **Lock-in** | Насколько больно уходить: свои обёртки над китом снижают риск |

### Матрица решений

| Ситуация | Разумный выбор |
|---|---|
| Внутренняя админка, B2B-дашборд, сжатые сроки | Styled-кит: Ant Design, MUI, PrimeVue, Element Plus |
| Продукт с сильным собственным брендом | Headless (Radix, Base UI, React Aria, Reka UI) + свои стили и токены |
| Стартап на React + Tailwind | shadcn/ui как отправная точка дизайн-системы |
| Несколько фреймворков в компании | Web Components или Ark UI/Zag.js + общие токены |
| Высокие требования к доступности (госсектор, банки) | React Aria или проверенная headless-библиотека + аудит |
| Огромные таблицы с группировкой и Excel-подобным поведением | AG Grid или MUI X, а не самописная таблица |

### Обёртка над китом

Даже при выборе стороннего кита продуктовый код не должен импортировать его напрямую:

```tsx
// packages/ui/src/button.tsx — публичный API вашей дизайн-системы
import { Button as MuiButton } from '@mui/material';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  onClick?: () => void;
};

const variantMap = { primary: 'contained', secondary: 'outlined', danger: 'contained' } as const;

export function Button({ variant = 'primary', size = 'md', ...rest }: ButtonProps) {
  return (
    <MuiButton
      variant={variantMap[variant]}
      color={variant === 'danger' ? 'error' : 'primary'}
      size={size === 'sm' ? 'small' : 'medium'}
      {...rest}
    />
  );
}
```

Обёртка сужает API до того, что разрешено дизайн-системой, и позволяет сменить кит, не переписывая сотни экранов.

---

## Headless-компоненты и доступность

### Почему не написать самому

`<select>` выглядит как задача на вечер, пока не открыть [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) для combobox. Нужно реализовать:

- роли и связи: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`, `aria-selected`;
- клавиатуру: стрелки, Home/End, Enter, Escape, Tab, typeahead (переход по первым буквам);
- фокус: где он находится при открытии и после закрытия, что происходит при клике снаружи;
- позиционирование: портал в `body`, flip при нехватке места снизу, ширина по триггеру, обновление при скролле и ресайзе;
- мобильные и скринридерные особенности: VoiceOver, NVDA и JAWS ведут себя по-разному;
- RTL, disabled-опции, группы, виртуализацию длинных списков.

Headless-библиотека берёт это на себя, а вы отвечаете только за внешний вид.

### Ключевые техники доступности

| Техника | Где нужна |
|---|---|
| **Focus trap** | Модальные окна: Tab не уходит за пределы диалога |
| **Return focus** | После закрытия диалога или меню фокус возвращается на триггер |
| **Roving tabindex** | Toolbar, tabs, radio group: в группу попадаем одним Tab, внутри — стрелками; у активного `tabindex="0"`, у остальных `-1` |
| **`aria-activedescendant`** | Combobox, listbox: DOM-фокус остаётся в инпуте, а «виртуальный» указывает на опцию |
| **Live regions** | Toasts, результаты поиска: `aria-live="polite"` объявляет изменения |
| **`inert`** | Блокирует фокус и взаимодействие с фоном под модалкой |
| **`:focus-visible`** | Видимый фокус для клавиатуры без обводки при клике мышью |

Подробнее о семантике и ARIA — в статье [Семантический HTML и доступность](./html-semantics-accessibility.md).

### Пример: Radix Dialog

```tsx
import * as Dialog from '@radix-ui/react-dialog';

export function DeleteDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="btn btn-danger">Удалить</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Удалить проект?</Dialog.Title>
          <Dialog.Description>Действие нельзя отменить.</Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="btn">Отмена</button>
            </Dialog.Close>
            <button className="btn btn-danger" onClick={onConfirm}>Удалить</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Focus trap, возврат фокуса, Escape, `aria-labelledby` и `aria-describedby`, блокировка скролла и `aria-hidden` для фона работают без дополнительного кода.

### Тот же паттерн во Vue: Reka UI

```vue
<script setup lang="ts">
import {
  DialogRoot, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription, DialogClose,
} from 'reka-ui';

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <DialogRoot>
    <DialogTrigger as-child>
      <button class="btn btn-danger">Удалить</button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content">
        <DialogTitle>Удалить проект?</DialogTitle>
        <DialogDescription>Действие нельзя отменить.</DialogDescription>
        <DialogClose as-child>
          <button class="btn">Отмена</button>
        </DialogClose>
        <button class="btn btn-danger" @click="emit('confirm')">Удалить</button>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

### Стилизация через data-атрибуты

Headless-компоненты отражают состояние в атрибутах, и стили пишутся без JS-логики:

```css
.accordion-trigger[data-state='open'] .chevron {
  transform: rotate(180deg);
}

.menu-item[data-highlighted] {
  background: var(--color-surface-hover);
}

.menu-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.dialog-content[data-state='open'] {
  animation: dialog-in 150ms ease-out;
}
```

В Tailwind то же самое записывается вариантами `data-[state=open]:rotate-180`.

---

## Проектирование API компонентов

Для UI Engineer это центральная тема: компонент дизайн-системы используют сотни разработчиков, и неудачный API тиражируется на весь продукт.

### Принципы

- **Предсказуемость**: одинаковые имена во всей библиотеке (`size`, `variant`, `disabled`, `onValueChange`), а не `small` в одном месте и `compact` в другом.
- **Близость к платформе**: `Button` принимает все атрибуты `<button>` (`type`, `aria-*`, `data-*`), `Input` — все атрибуты `<input>`.
- **Композиция вместо конфигурации**: лучше `Card.Header` + `Card.Body`, чем `<Card title subtitle headerAction footerLeft footerRight />`.
- **Безопасные дефолты**: `type="button"` у кнопки (иначе она сабмитит форму), обязательный доступный label.
- **Escape hatches**: `className`, `style`, проброс `ref` и остальных пропсов на корневой элемент.

### Варианты вместо boolean-пропсов

```tsx
// ❌ Взрыв boolean-пропсов: что значит <Button primary outline danger small large />?
<Button primary outline small />

// ✅ Перечисления: невалидные комбинации невозможны на уровне типов
<Button variant="outline" size="sm" />
```

### Compound components

```tsx
import { createContext, useContext, useId, type ReactNode } from 'react';

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

type RootProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs.Root>');
  return ctx;
}

function Root({ value, defaultValue, onValueChange, children }: RootProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value: current, setValue: setCurrent, baseId }}>
      {children}
    </TabsContext.Provider>
  );
}

function List({ children, ...props }: { children: ReactNode; 'aria-label'?: string }) {
  // Упрощённо: в реальной реализации здесь roving tabindex и обработка стрелок
  return <div role="tablist" {...props}>{children}</div>;
}

function Trigger({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, setValue, baseId } = useTabs();
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? 'active' : 'inactive'}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

function Content({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, baseId } = useTabs();
  if (active !== value) return null;
  return (
    <div role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`}>
      {children}
    </div>
  );
}

export const Tabs = { Root, List, Trigger, Content };
```

Пользователь сам компонует разметку: может добавить иконку в триггер, бейдж, обёртку для скролла, не дожидаясь новых пропсов. Во Vue ту же роль играют `provide`/`inject` и слоты.

### Controlled и uncontrolled

Компонент библиотеки должен работать в обоих режимах, как нативный `<input>` с `value` и `defaultValue`:

```tsx
// Uncontrolled: состояние внутри
<Tabs.Root defaultValue="profile">…</Tabs.Root>

// Controlled: состояние у родителя (синхронизация с URL, стором)
<Tabs.Root value={tab} onValueChange={setTab}>…</Tabs.Root>
```

```tsx
import { useCallback, useState } from 'react';

type Options<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
};

export function useControllableState<T>({ value, defaultValue, onChange }: Options<T>) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue] as const;
}
```

Во Vue 3.4+ эту задачу решает `defineModel()`: он работает и с `v-model`, и без него, храня локальное значение, если родитель не передал проп.

### Полиморфизм: `as` vs `asChild`

```tsx
// Подход 1: prop `as`
<Button as="a" href="/docs">Документация</Button>
<Button as={RouterLink} to="/docs">Документация</Button>
```

Проблемы: сложная типизация (пропсы `Button` смешиваются с пропсами `RouterLink`), конфликты имён пропсов, медленный TypeScript на больших объединениях типов.

```tsx
// Подход 2: asChild (Slot)
<Button asChild>
  <RouterLink to="/docs">Документация</RouterLink>
</Button>
```

`Button` не рендерит свой `<button>`, а передаёт классы, обработчики, ARIA-атрибуты и ref единственному ребёнку. Упрощённая реализация Slot:

```tsx
import { cloneElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

type SlotProps = HTMLAttributes<HTMLElement> & { children?: ReactNode };

export function Slot({ children, ...slotProps }: SlotProps) {
  if (!isValidElement<HTMLAttributes<HTMLElement>>(children)) return null;
  const childProps = children.props;

  return cloneElement(children, {
    ...slotProps,
    ...childProps,
    className: cn(slotProps.className, childProps.className),
    onClick: (event) => {
      childProps.onClick?.(event);
      if (!event.defaultPrevented) slotProps.onClick?.(event);
    },
  });
}

export function Button({ asChild, variant, size, className, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

Реальная реализация (`@radix-ui/react-slot`) также объединяет ref и стили и корректно обрабатывает все обработчики событий.

### Варианты через cva

```ts
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-6 text-base',
        icon: 'size-9',
      },
    },
    compoundVariants: [{ variant: 'ghost', size: 'icon', class: 'rounded-full' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
```

```ts
// cn.ts — объединение классов с разрешением конфликтов Tailwind
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Без `tailwind-merge` вызов `cn('px-4', 'px-2')` оставит оба класса, и победит тот, что объявлен в CSS позже, а не тот, что передал пользователь.

### ref и проброс пропсов

- В React 19 `ref` передаётся как обычный проп, а в React 18 нужен `forwardRef`. Без проброса ref компонент нельзя использовать с поповерами, анимациями и фокус-менеджментом.
- Остальные пропсы (`...rest`) пробрасываются на корневой DOM-элемент, чтобы работали `aria-*`, `data-testid` и обработчики.
- Во Vue атрибуты пробрасываются автоматически через `$attrs` (fallthrough); при нескольких корневых элементах их нужно явно привязать через `v-bind="$attrs"` и `inheritAttrs: false`.

---

## Модель shadcn/ui

### Как это работает

```bash
npx shadcn@latest init                 # создаёт components.json, утилиту cn, CSS-переменные темы
npx shadcn@latest add button dialog    # копирует исходники в src/components/ui/
```

```
src/
├── components/ui/
│   ├── button.tsx      ← ваш код: можно менять что угодно
│   └── dialog.tsx      ← обёртка над headless-примитивом + Tailwind-классы
└── lib/utils.ts        ← cn()
```

Компоненты используют семантические CSS-переменные (`--primary`, `--background`, `--ring`), поэтому тема меняется на уровне токенов. **Registry** позволяет компании публиковать свои компоненты в том же формате и раздавать их командам через тот же CLI.

### Плюсы и минусы

| Плюсы | Минусы |
|---|---|
| Полное владение кодом: нет борьбы с чужими стилями и ожидания фикса в upstream | Обновления не приходят через `npm update`: изменения upstream переносятся вручную |
| Доступность от headless-примитивов | Каждая команда может «уплыть» в своей копии компонентов |
| Хорошая отправная точка для своей дизайн-системы | Привязка к Tailwind |
| Отлично работает с AI-инструментами: код компонентов виден в репозитории | Сложные компоненты (data grid, date range) всё равно приходится собирать из других библиотек |

Ответ на собеседовании: shadcn/ui — это **способ быстро стартовать собственную дизайн-систему**, а не готовый кит. Для нескольких продуктов компании его компоненты обычно выносят в общий пакет `@acme/ui`, иначе копии разойдутся.

---

## Платформа вместо библиотеки

Браузеры закрыли часть задач, ради которых раньше подключали библиотеки. UI Engineer должен знать, где хватит платформы.

### `<dialog>`

```html
<button type="button" id="open">Удалить</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Удалить проект?</h2>
  <form method="dialog">
    <button value="cancel">Отмена</button>
    <button value="confirm">Удалить</button>
  </form>
</dialog>
```

```js
const dialog = document.getElementById('confirm');
document.getElementById('open').addEventListener('click', () => dialog.showModal());
dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'confirm') deleteProject();
});
```

`showModal()` даёт:

- **top layer**: окно поверх всего без войны `z-index` (подробнее про stacking — в статье [Positioning и stacking context](./css-positioning-stacking.md));
- **inert** для остальной страницы: фокус и клики не уходят на фон;
- закрытие по Escape (событие `cancel`), псевдоэлемент `::backdrop`;
- `<form method="dialog">` закрывает окно и записывает `value` кнопки в `returnValue`.

Блокировку скролла фона нужно добавить вручную:

```css
html:has(dialog[open]:modal) {
  overflow: hidden;
}
```

### Popover API

```html
<button popovertarget="user-menu">Аккаунт</button>
<div id="user-menu" popover>
  <a href="/profile">Профиль</a>
  <a href="/logout">Выйти</a>
</div>
```

Без JavaScript работают: открытие и закрытие, light dismiss (клик снаружи, Escape), top layer, связь триггера с поповером для доступности. Popover API входит в Baseline с 2024 года.

**CSS Anchor Positioning** (`anchor-name`, `position-anchor`, `position-try-fallbacks`) позволяет привязать поповер к триггеру и переворачивать его при нехватке места без JS. Поддержка браузерами ещё неравномерна, поэтому проверяйте caniuse и держите фолбэк на Floating UI.

### Когда библиотека всё ещё нужна

- Combobox с асинхронным поиском, date picker, multi-select, tree view: платформенных аналогов с нужным UX нет.
- Сложное позиционирование (вложенные меню, виртуальные элементы, коллизии со скроллящимися контейнерами).
- Единый API и поведение во всей дизайн-системе, включая анимацию выхода и тестируемость.

---

## Storybook

### Зачем он UI-команде

- **Изолированная разработка**: компонент разрабатывается вне приложения, без авторизации, бэкенда и навигации до нужного экрана.
- **Каталог состояний**: loading, error, empty, длинные тексты, RTL, тёмная тема — каждое состояние оформлено как story.
- **Живая документация**: autodocs генерирует страницу с пропсами и примерами из типов и stories.
- **Тесты**: interaction-тесты через play-функции, проверки a11y, visual regression по тем же stories.
- **Контракт с дизайном и QA**: дизайнер ревьюит компонент в опубликованном Storybook до попадания в продукт.

### Component Story Format (CSF3)

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Сохранить', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outline', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LongLabel: Story = {
  args: { children: 'Очень длинный текст кнопки, который проверяет перенос и обрезку' },
};

export const ClickCallsHandler: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Сохранить' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
```

Импорты указаны для Storybook 9: утилиты тестирования — из `storybook/test`, типы — из пакета фреймворка. В Storybook 8 те же утилиты импортировались из `@storybook/test`.

### Основные возможности

| Возможность | Назначение |
|---|---|
| **args и controls** | Пропсы story, редактируемые в UI |
| **decorators** | Обёртки: провайдер темы, роутер, i18n, layout |
| **globals и toolbar** | Переключатели темы, локали, направления текста для всех stories |
| **parameters** | Настройки viewport, backgrounds, layout, а также MSW-моки запросов |
| **loaders** | Асинхронная подготовка данных перед рендером |
| **play** | Сценарий взаимодействия и проверки |
| **addon-a11y** | Проверка axe-core для каждой story |
| **addon-vitest** | Запуск stories как тестов в Vitest browser mode (Storybook 9) |
| **Chromatic** | Visual regression и ревью UI-изменений в PR |

Глобальный декоратор для темы:

```tsx
// .storybook/preview.tsx
import type { Preview } from '@storybook/react-vite';
import '../src/styles/tokens.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      toolbar: { title: 'Тема', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => (
      <div data-theme={context.globals.theme} className="sb-theme-wrapper">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

### Альтернативы

- **Histoire** — легковесная альтернатива для Vue и Svelte на Vite.
- **Ladle** — быстрая React-альтернатива с совместимым форматом stories.
- **Docs-сайты** (VitePress, Nextra, Astro Starlight) — для документации дизайн-системы с guidelines, а Storybook остаётся рабочей средой разработки.

Связь Storybook с Figma (Code Connect, Figma-аддон) и pipeline токенов разобраны в статье [Дизайн-токены, темизация и Figma](./design-tokens-and-figma.md).

---

## Иконки и SVG

### Стратегии

| Стратегия | Плюсы | Минусы |
|---|---|---|
| **SVG как компоненты** (`lucide-react`, unplugin-icons, SVGR) | Tree shaking, пропсы, типы | SVG попадает в JS-бандл |
| **SVG-спрайт** + `<use href>` | Один кэшируемый файл, SVG не попадает в JS | Внешний спрайт не работает cross-origin, сложнее анимировать части иконки |
| **`<img src="icon.svg">`** | Просто, кэшируется | Нельзя перекрасить через `currentColor` |
| **CSS mask-image** | Цвет через `background-color`, нет SVG в DOM | Нет a11y-семантики, только одноцветные иконки |
| **Icon fonts** | Исторически популярны | Антипаттерн, см. ниже |

### Почему icon fonts устарели

- Браузер рендерит их как текст: субпиксельное сглаживание размывает иконки.
- При блокировке шрифтов (настройки доступности, медленная сеть, ошибка CORS) пользователь видит квадраты или случайные символы.
- Скринридеры могут зачитать символ из Private Use Area.
- Загружается весь набор, даже если используются три иконки.

### Спрайт

```html
<!-- icons.svg -->
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="search" viewBox="0 0 24 24">
    <path d="M11 4a7 7 0 1 0 4.9 12l4.5 4.5 1.4-1.4-4.5-4.5A7 7 0 0 0 11 4Z" fill="currentColor"/>
  </symbol>
</svg>

<!-- использование -->
<svg class="icon" aria-hidden="true" focusable="false">
  <use href="/icons.svg#search"></use>
</svg>
```

```css
.icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  flex-shrink: 0;
}
```

`1em` и `currentColor` делают иконку частью текста: она масштабируется с `font-size` и наследует цвет, включая `:hover` и тёмную тему.

### Доступность иконок

```html
<!-- Декоративная иконка рядом с текстом: скрыть от скринридера -->
<button>
  <svg aria-hidden="true" class="icon">…</svg>
  Поиск
</button>

<!-- Кнопка только с иконкой: доступное имя обязательно -->
<button aria-label="Закрыть">
  <svg aria-hidden="true" class="icon">…</svg>
</button>

<!-- Смысловая самостоятельная иконка -->
<svg role="img" aria-labelledby="warn-title">
  <title id="warn-title">Предупреждение</title>
  …
</svg>
```

Перед добавлением в библиотеку SVG прогоняют через **SVGO**: удаляются метаданные из редакторов, лишние группы, жёстко заданные `fill`, которые мешают `currentColor`.

---

## Поставка библиотеки компонентов

### Структура в монорепо

```
packages/
├── tokens/        → @acme/tokens  (Style Dictionary → CSS variables, TS)
├── icons/         → @acme/icons   (SVG → компоненты)
├── ui/            → @acme/ui      (компоненты)
└── eslint-config/ → правила использования дизайн-системы
apps/
├── storybook/
├── web/
└── admin/
```

Подробнее про организацию — в статье про [монорепозитории](../architecture/monorepos.md).

### package.json

```json
{
  "name": "@acme/ui",
  "version": "3.2.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/button.d.ts",
      "import": "./dist/button.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

| Поле | Зачем |
|---|---|
| `exports` | Явные точки входа; закрывает доступ к внутренним файлам; условие `types` идёт первым |
| `sideEffects` | Бандлер может выкинуть неиспользуемые модули при tree shaking, но CSS-импорты нельзя выкидывать |
| `peerDependencies` | React или Vue предоставляет приложение; иначе в бандле окажутся две копии React и сломаются хуки и контекст |
| `files` | В npm публикуется только `dist` |

Сборка: Vite library mode, tsup или tsdown для ESM с `.d.ts`. CommonJS-сборку сегодня часто не делают, если все потребители используют современные бандлеры.

### Как поставлять стили

| Подход | Особенности |
|---|---|
| Готовый `styles.css` | Просто для потребителя, но грузится CSS всех компонентов |
| CSS на компонент + импорт внутри JS | Tree shaking стилей, но требует бандлера, понимающего CSS-импорты, и `sideEffects` |
| Tailwind preset / `@source` на пакет | Потребитель генерирует классы сам; требует Tailwind в приложении |
| CSS-in-JS с zero-runtime (Vanilla Extract, Panda CSS) | Типобезопасные стили, на выходе статический CSS |

Стили библиотеки удобно помещать в каскадный слой (`@layer acme-ui`): тогда стили приложения без слоя всегда побеждают без повышения специфичности. Подробнее — в статье [Каскад и специфичность](./css-cascade-specificity.md).

### Версионирование и эволюция API

- **Semver**: изменение API, визуальных отступов или DOM-структуры, на которую завязаны тесты потребителей, может оказаться breaking change.
- **Changesets**: в каждом PR файл с описанием изменения и типом bump, автоматический changelog и релиз (связь с Conventional Commits — в статье [Git: ветки, rebase и командный workflow](../build-and-deployment/git-workflow.md)).
- **Deprecation-период**: старый проп работает ещё минимум один мажор и предупреждает в dev-режиме:

```ts
if (import.meta.env.DEV && props.kind) {
  console.warn('[acme/ui] Button: prop `kind` is deprecated, use `variant` instead. Will be removed in v4.');
}
```

- **Codemods** (jscodeshift, ast-grep) автоматически переписывают код потребителей при мажорном обновлении.
- **Adoption-метрики**: сколько экранов используют компоненты дизайн-системы, а сколько — самописные аналоги. Правила ESLint (`no-restricted-imports`) запрещают прямой импорт стороннего кита в обход дизайн-системы.

---

## Качество и тестирование UI-кита

| Уровень | Инструмент | Что ловит |
|---|---|---|
| Статический анализ | TypeScript, ESLint (`jsx-a11y`, `vuejs-accessibility`), Stylelint | Ошибки типов, отсутствующие `alt` и label, сырые цвета вместо токенов |
| Unit и компонентные | Vitest + Testing Library | Поведение: клик, клавиатура, controlled/uncontrolled, ARIA-атрибуты |
| Interaction | Storybook play + addon-vitest | Сценарии в реальном браузере на тех же stories |
| Accessibility | axe-core (addon-a11y, `@axe-core/playwright`) + ручная проверка | Автоматика ловит около трети проблем; клавиатуру и скринридер проверяют вручную |
| Visual regression | Chromatic, Playwright `toHaveScreenshot`, Lost Pixel | Непреднамеренные визуальные изменения, особенно после правки токенов |
| Бандл | size-limit, bundlewatch | Рост веса пакета в PR |

Тестировать нужно **поведение через доступные роли**, а не внутреннюю структуру:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

it('switches panels with keyboard arrows', async () => {
  const user = userEvent.setup();
  render(
    <Tabs.Root defaultValue="a">
      <Tabs.List aria-label="Настройки">
        <Tabs.Trigger value="a">Профиль</Tabs.Trigger>
        <Tabs.Trigger value="b">Безопасность</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="a">Панель профиля</Tabs.Content>
      <Tabs.Content value="b">Панель безопасности</Tabs.Content>
    </Tabs.Root>,
  );

  await user.tab();
  expect(screen.getByRole('tab', { name: 'Профиль' })).toHaveFocus();

  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Безопасность' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Панель безопасности');
});
```

Подробнее — в разделе про тестирование: [визуальная регрессия](../testing/visual-regression.md), [компонентные тесты React](../testing/react-testing-components.md) и [Vue](../testing/vue-testing-components.md).

---

## Практические задачи на собеседовании

На UI Engineer-интервью практическая часть часто состоит из одной из задач ниже. Оценивают не только работоспособность, но и API, доступность и крайние случаи.

### Спроектировать API компонента

«Спроектируйте `Select` / `DatePicker` / `Toast` для дизайн-системы» — сначала проговорите требования, потом код:

1. **Сценарии**: одиночный и множественный выбор, поиск, асинхронная загрузка опций, группы, disabled-опции.
2. **API**: controlled и uncontrolled (`value`, `defaultValue`, `onValueChange`), compound-части или `options`-массив (и почему), `size`, `variant`, `disabled`, `invalid`, интеграция с формами (`name`, нативный `<input type="hidden">` для отправки формы).
3. **Доступность**: роль combobox или listbox, клавиатура, label и сообщения об ошибке через `aria-describedby`.
4. **Состояния**: loading, empty, error, длинные значения, RTL, мобильная версия.
5. **Стилизация**: токены, data-атрибуты состояния, `className` на каждой части.
6. **Тестирование и документация**: stories для каждого состояния, interaction-тесты, a11y-проверки.

### Чек-лист для модального окна

- [ ] `role="dialog"` и `aria-modal="true"` (или нативный `<dialog>` с `showModal()`)
- [ ] `aria-labelledby` на заголовок
- [ ] Фокус переходит внутрь при открытии (на первый интерактивный элемент или на сам диалог)
- [ ] Focus trap: Tab и Shift+Tab циклятся внутри
- [ ] Escape закрывает окно
- [ ] Фокус возвращается на триггер после закрытия
- [ ] Фон недоступен (`inert`) и не скроллится
- [ ] Рендер в портал или top layer, нет конфликтов `z-index` и `overflow: hidden` родителей
- [ ] Анимация уважает `prefers-reduced-motion`

### Другие типовые задачи

- Сверстать компонент по макету с вариантами и тёмной темой на CSS custom properties.
- Сделать доступные Tabs или Accordion с клавиатурной навигацией.
- Сделать Tooltip: показ по hover **и** focus, задержка, `aria-describedby`, не закрывать при наведении на сам тултип.
- Найти проблемы в готовом компоненте (code review): отсутствие `type="button"`, `div` с `onClick` вместо кнопки, потерянный ref, хардкод цветов, отсутствующий label.
- Автокомплит с debounce, отменой устаревших запросов и клавиатурной навигацией.

---

## Ключевые тезисы для интервью

- UI-библиотеки различаются уровнем контроля: styled-киты дают готовый вид, headless — только поведение и доступность, shadcn/ui копирует исходники в ваш репозиторий.
- Выбор кита определяют доступность, кастомизация под свою дизайн-систему, совместимость с SSR и RSC, бандл, темизация, лицензия и поддержка; продуктовый код работает с обёрткой, а не с китом напрямую.
- Доступные combobox, dialog и menu требуют ролей ARIA, клавиатурной навигации, focus trap, возврата фокуса и позиционирования, поэтому headless-примитивы почти всегда выгоднее самописных.
- Хороший API компонента предсказуем, близок к платформе, построен на композиции, описывает варианты перечислениями и пробрасывает ref и остальные пропсы.
- Compound components делят состояние через контекст, а `useControllableState` или `defineModel` дают controlled и uncontrolled режимы одним API.
- `asChild` сливает пропсы, обработчики и ref с ребёнком и типизируется проще, чем полиморфный `as`.
- `<dialog>`, Popover API и anchor positioning закрывают часть задач без JS, но сложные паттерны по-прежнему требуют библиотек.
- Storybook — это рабочая среда, документация и тестовая платформа: stories, controls, play-функции, a11y-проверки и visual regression на одних и тех же данных.
- Иконки поставляют как SVG-компоненты или спрайт с `currentColor`; icon fonts — антипаттерн из-за рендеринга, доступности и веса.
- Библиотека публикуется как ESM с `exports`, `types`, `peerDependencies` и `sideEffects` для CSS, версионируется по semver через changesets, а breaking changes проходят через deprecation и codemods.

---

## Заключение

UI Engineer отвечает не за отдельные компоненты, а за фундамент, на котором строят интерфейсы другие разработчики. Поэтому на собеседовании важно показать системное мышление:

1. Выбор между styled-китом, headless-примитивами и собственной библиотекой — это компромисс между скоростью, контролем и стоимостью поддержки.
2. Доступность и API компонентов важнее внешнего вида: их ошибки тиражируются на весь продукт.
3. Платформа (`<dialog>`, Popover API) всё больше заменяет JS-решения, и это стоит учитывать при проектировании.
4. Storybook, тесты, visual regression и аккуратная поставка пакета превращают набор компонентов в продукт для других команд.

Попробуйте собрать мини-дизайн-систему: `Button` с cva-вариантами и `asChild`, доступные `Tabs` с compound API и `Dialog` на headless-примитиве, оформите stories с play-функциями и a11y-аддоном и опубликуйте пакет в монорепо с changesets.

## Полезные ссылки

- [WAI-ARIA Authoring Practices Guide — Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Base UI](https://base-ui.com/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)
- [Reka UI](https://reka-ui.com/)
- [Ark UI](https://ark-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Floating UI](https://floating-ui.com/)
- [Storybook Docs](https://storybook.js.org/docs)
- [Component Story Format](https://storybook.js.org/docs/api/csf)
- [MDN — `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [MDN — Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [class-variance-authority](https://cva.style/docs)
- [Node.js — Package entry points (`exports`)](https://nodejs.org/api/packages.html#package-entry-points)
