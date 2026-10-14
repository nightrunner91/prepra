---
title: "Веб-компоненты и UI-киты во Vue"
section: vue
description: "Веб-компоненты во Vue: defineCustomElement, Shadow DOM, стили и ограничения. UI-киты (Element Plus, Vuetify, PrimeVue, Naive UI), дизайн-системы и поставка компонентов в другие фреймворки."
order: 19
tags: ["web-components", "definecustomelement", "shadow-dom", "ui-kits", "design-systems", "custom-elements"]
questions:
  - "Как `defineCustomElement` превращает SFC в custom element и какие ограничения это накладывает"
  - "Чем Shadow DOM отличается от scoped-стилей и почему CSS custom properties проникают сквозь границу"
  - "Как слоты и события работают на границе Shadow DOM и почему `provide`/`inject` ломается"
  - "Когда Web Components — правильный выбор, а когда лучше остаться в рамках Vue-компонентов"
  - "Чем UI-киты (Element Plus, Vuetify, PrimeVue) отличаются от дизайн-системы и когда строить свою"
  - "Как поставлять Vue-компоненты в проекты на других фреймворках и какие проблемы это создаёт"
  - "Какие подводные камни возникают при тестировании и SSR с веб-компонентами"
answers:
  - "`defineCustomElement` компилирует SFC в класс, наследующий `HTMLElement`; Vue самостоятельно монтирует приложение внутри Shadow DOM, но `provide`/`inject` не пересекает границу элемента, а слоты работают только через нативные `<slot>` без scoped-слотов."
  - "Shadow DOM изолирует стили полностью — внешние правила не попадают внутрь, а внутренние не выходят; scoped-стили Vue используют data-атрибуты и остаются в общем документе. CSS custom properties наследуются через shadow boundary, поэтому токены темы пробрасывают наружу."
  - "Нативные `<slot>` в Shadow DOM принимают light DOM-контент, но не передают данные (scoped slots недоступны); события из Shadow DOM всплывают как `CustomEvent` с переоформлённым `target`, поэтому родителю виден только host-элемент, а не внутренняя разметка."
  - "Web Components оправданы для поставки компонентов в гетерогенную среду (несколько фреймворков, виджеты для сторонних сайтов, микрофронтенды); для внутреннего Vue-приложения они добавляют overhead (Shadow DOM, сериализация props, потеря provide/inject) без выгоды."
  - "UI-кит — готовая библиотека компонентов (кнопки, таблицы, модалки) с собственным дизайном; дизайн-система — набор токенов, паттернов и принципов, поверх которых строится кит. Свой кит строят, когда нужен уникальный бренд, строгий контроль доступности или поставка в несколько продуктов."
  - "Через `defineCustomElement` Vue-компонент регистрируется как custom element и используется в React/Angular/Svelte через обычный HTML-тег; проблемы — дублирование рантайма Vue, сериализация props в атрибуты, отсутствие реактивности при передаче объектов, стили через Shadow DOM."
  - "Vue Test Utils не монтирует Shadow DOM по умолчанию, поэтому веб-компоненты тестируют через `@vue/test-utils` с опцией `attachTo` + реальный DOM или отдельными e2e-тестами; при SSR Shadow DOM не рендерится на сервере, и гидратация требует Declarative Shadow DOM или fallback-контента в light DOM."
---

# Веб-компоненты и UI-киты во Vue

Фронтенд давно вышел за рамки одного фреймворка: в одной странице могут соседствовать Vue-приложение, React-виджет и legacy-код на jQuery. Чтобы компоненты пересекали границы фреймворков, нужны стандартные браузерные примитивы — **Web Components**. Vue поддерживает их «из коробки» через `defineCustomElement`, превращая SFC в custom element.

Параллельно существует вопрос выбора UI-кита: Element Plus, Vuetify, PrimeVue, Naive UI — каждый предлагает сотни готовых компонентов. На Senior-собеседовании важно понимать разницу между UI-китом и дизайн-системой, знать, когда строить свой кит, и уметь объяснить trade-offs между нативными веб-компонентами и фреймворк-специфичными решениями.

## Содержание

1. [Стандарт Web Components](#стандарт-web-components)
2. [`defineCustomElement` во Vue](#definecustomelement-во-vue)
3. [Стили и Shadow DOM](#стили-и-shadow-dom)
4. [Слоты и события через границу](#слоты-и-события-через-границу)
5. [`provide`/`inject` и ограничения](#provideinject-и-ограничения)
6. [UI-киты в экосистеме Vue](#ui-киты-в-экосистеме-vue)
7. [Дизайн-система vs UI-кит](#дизайн-система-vs-ui-кит)
8. [Поставка компонентов в другие фреймворки](#поставка-компонентов-в-другие-фреймворки)
9. [Тестирование и SSR](#тестирование-и-ssr)
10. [Когда Web Components, а когда нет](#когда-web-components-а-когда-нет)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Стандарт Web Components

**Web Components** — это три браузерных стандарта, которые вместе позволяют создавать переиспользуемые элементы без фреймворка:

- **Custom Elements** — API для регистрации собственных HTML-тегов. Класс наследует `HTMLElement` и определяет методы `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`.

- **Shadow DOM** — инкапсулированное DOM-дерево и CSS-область внутри элемента. Внешние стили не проникают внутрь, внутренние — наружу (кроме CSS custom properties).

- **HTML Templates** — теги `<template>` и `<slot>` для декларативной разметки, которая не рендерится, пока не активирована.

```js
class MyButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        button { padding: 8px 16px; border-radius: 4px; }
      </style>
      <button><slot>Click me</slot></button>
    `;
  }

  static get observedAttributes() {
    return ['variant'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'variant') {
      const btn = this.shadowRoot.querySelector('button');
      btn.dataset.variant = newValue;
    }
  }
}

customElements.define('my-button', MyButton);
```

Использование в любом HTML:

```html
<my-button variant="primary">Сохранить</my-button>
```

Ключевые свойства:

- **Фреймворк-агностичность.** Custom element работает в React, Vue, Angular, Svelte или чистом HTML.
- **Инкапсуляция стилей.** Shadow DOM полностью изолирует CSS.
- **Сериализация через атрибуты.** Props — только строки или JSON; объекты не передаются напрямую.
- **Нет встроенной реактивности.** Изменение атрибута вызывает `attributeChangedCallback`, но не перерисовывает фреймворк-компонент автоматически.

---

## `defineCustomElement` во Vue

Vue упрощает создание custom elements: `defineCustomElement` принимает SFC (или компонент с `setup`) и возвращает класс для `customElements.define`.

```vue
<!-- MyButton.ce.vue -->
<script setup>
import { ref } from 'vue';

const props = defineProps<{ variant?: string }>();
const count = ref(0);
</script>

<template>
  <button :data-variant="variant" @click="count++">
    <slot>Click me</slot>
    <span v-if="count"> ({{ count }})</span>
  </button>
</template>

<style scoped>
button {
  padding: 8px 16px;
  border-radius: 4px;
}
</style>
```

Регистрация:

```js
import { defineCustomElement } from 'vue';
import MyButton from './MyButton.ce.vue';

customElements.define('my-button', defineCustomElement(MyButton));
```

Файлы с суффиксом `.ce.vue` (custom element) — соглашение. Vite и Vue CLI распознают их и включают стили в Shadow DOM автоматически.

Под капотом `defineCustomElement`:

1. Создаёт класс, наследующий `HTMLElement`.
2. В `connectedCallback` монтирует Vue-приложение внутри Shadow DOM.
3. Синхронизирует атрибуты с props.
4. Пробрасывает содержим элемента (light DOM) в нативные `<slot>`.
5. В `disconnectedCallback` размонтирует приложение и освобождает ресурсы.

### Конфигурация

`defineCustomElement` принимает второй аргумент — опции:

```js
customElements.define(
  'my-button',
  defineCustomElement(MyButton, {
    // app-level конфигурация через setup компонента
    // или через provide/inject внутри SFC
  })
);
```

Для регистрации плагинов и `provide`-значений, доступных внутри custom element, используют `setup` компонента или `app.provide` через обёртку.

---

## Стили и Shadow DOM

Shadow DOM — главное отличие веб-компонента от Vue-компонента. Стили внутри Shadow DOM полностью изолированы:

- Внешние глобальные стили **не проникают** внутрь.
- Внутренние стили **не выходят** наружу.
- **CSS custom properties** — единственное исключение: они наследуются через shadow boundary.

```css
/* Внутри Shadow DOM */
:host {
  display: inline-block;
}

:host([variant="primary"]) {
  --btn-bg: var(--color-primary, #1976d2);
}

button {
  background: var(--btn-bg, #ccc);
  color: var(--color-text, #333);
}
```

Ключевые селекторы:

- `:host` — ссылается на сам custom element.
- `:host(.active)` — host с определённым классом.
- `:host-context(.dark)` — host внутри элемента с классом `.dark`.
- `::slotted(.icon)` — контент, переданный в слот (light DOM).

### Темизация через CSS custom properties

Поскольку custom properties проникают сквозь Shadow DOM, они — основной механизм темизации:

```css
/* Глобально */
:root {
  --color-primary: #1976d2;
  --color-text: #333;
}

.dark {
  --color-primary: #90caf9;
  --color-text: #eee;
}
```

Компонент использует эти переменные через `var()`, и тема хоста автоматически применяется внутри Shadow DOM. Это тот же подход, что и в scoped-стилях Vue (`vue/styling.md`), но с полной изоляцией.

---

## Слоты и события через границу

### Слоты

Custom elements используют **нативные HTML-слоты**, а не Vue-слоты. Это значит:

- `<slot>` принимает light DOM-контент между тегами custom element.
- **Named slots** работают через `slot="name"`:

```html
<my-card>
  <h2 slot="header">Заголовок</h2>
  <p>Содержимое карточки</p>
  <button slot="footer">OK</button>
</my-card>
```

- **Scoped slots недоступны.** Нативные слоты не умеют передавать данные из Shadow DOM в light DOM. Это фундаментальное ограничение: паттерн «ребёнок отдаёт данные, родитель рендерит» в веб-компонентах не работает.

### События

События из Shadow DOM всплывают до host-элемента, но с важным нюансом: `event.target` переоформляется на host, когда событие пересекает shadow boundary. Родитель видит только custom element, а не внутреннюю разметку.

```js
// Внутри компонента
const emit = defineEmits<{ change: [value: string] }>();

function onChange(e) {
  emit('change', e.target.value);
}

// Наружу
const el = document.querySelector('my-input');
el.addEventListener('change', (e) => {
  console.log(e.detail); // значение в e.detail для CustomEvent
});
```

Для кастомных событий Vue использует `CustomEvent` с данными в `e.detail`. Для встроенных событий (`click`, `input`) `target` — это host-элемент.

---

## `provide`/`inject` и ограничения

`provide`/`inject` во Vue работает через дерево компонентов. Custom element создаёт **отдельное Vue-приложение** внутри Shadow DOM, и это приложение изолировано от внешнего.

Что работает:

- `provide`/`inject` **внутри** custom element — компоненты внутри SFC обмениваются данными нормально.
- `provide` внутри `setup` компонента или через обёртку — значения доступны всем компонентам внутри custom element.

Что **не** работает:

- `inject` из внешнего Vue-приложения — outer app и inner app не связаны через дерево компонентов.
- Компонент снаружи custom element не может `inject` значения, `provide`-данные внутри него.

Для коммуникации между внешним приложением и custom element используют:

- **Атрибуты** — для простых значений (строки, числа, булевы).
- **Свойства (properties)** — для объектов и функций (устанавливаются напрямую через JS).
- **События** — для обратного потока данных.

```js
// Установка свойства напрямую
const el = document.querySelector('my-table');
el.data = [/* массив данных */];
el.onRowClick = (row) => { /* callback */ };
```

Для передачи реактивных данных из внешнего Vue-приложения используется `watch`, который синхронизирует `ref` с свойством custom element.

---

## UI-киты в экосистеме Vue

Для большинства проектов Web Components — избыточный выбор. Вместо них используют **UI-киты** — библиотеки готовых Vue-компонентов.

### Популярные UI-киты

| Библиотека | Особенности | Размер |
|---|---|---|
| **Element Plus** | Полный набор компонентов, enterprise-ориентирован, TypeScript, SSR-поддержка | Средний |
| **Vuetify** | Material Design 3, extensive theming, SSR, Nuxt-модуль | Большой |
| **PrimeVue** | 90+ компонентов, несколько тем (Material, Bootstrap, custom), unstyled-режим | Средний |
| **Naive UI** | TypeScript-first, tree-shakable, SSR-friendly, составные компоненты | Средний |
| **Quasar** | Full-stack framework с UI-китом, CLI, Electron/Cordova/Capacitor | Большой |
| **Vant** | Mobile-first, лёгкий, 60+ компонентов | Малый |

### Сравнение подходов

```vue
<!-- Element Plus -->
<script setup>
import { ElButton } from 'element-plus';
</script>

<template>
  <ElButton type="primary" @click="submit">Сохранить</ElButton>
</template>
```

```vue
<!-- Vuetify -->
<script setup>
import { useTheme } from 'vuetify';
const theme = useTheme();
</script>

<template>
  <v-btn color="primary" @click="submit">Сохранить</v-btn>
</template>
```

```vue
<!-- PrimeVue (unstyled mode) -->
<script setup>
import { Button } from 'primevue/button';
</script>

<template>
  <Button severity="primary" @click="submit" :pt="{
    root: { class: 'px-4 py-2 rounded bg-blue-600 text-white' }
  }">Сохранить</Button>
</template>
```

### Критерии выбора

- **Element Plus** — если нужен enterprise-кит с таблицами, формами и модальными окнами «из коробки».
- **Vuetify** — если проект на Material Design и нужна богатая система тем.
- **PrimeVue** — если важна гибкость: unstyled-режим позволяет применять свои стили без борьбы с встроенными.
- **Naive UI** — если критичен TypeScript и tree-shaking.
- **Quasar** — если нужен full-stack с поддержкой мобильных платформ.
- **Vant** — для мобильных приложений.

---

## Дизайн-система vs UI-кит

**UI-кит** — библиотека готовых компонентов с фиксированным дизайном. **Дизайн-система** — набор принципов, токенов, паттернов и компонентов, построенных вокруг бренда и продуктовых задач.

| Аспект | UI-кит | Дизайн-система |
|---|---|---|
| Дизайн | Фиксированный (Material, Bootstrap и т.д.) | Уникальный или кастомизируемый |
| Токены | Ограниченная настройка через CSS variables | Полная система: цвета, spacing, typography, shadows |
| Компоненты | Готовые к использованию | Строятся на основе токенов и паттернов |
| Документация | API reference | Storybook + принципы + примеры использования |
| Контроль версий | Semver, changelog | Дизайн-токены версионируются отдельно от кода |
| Доступность | Обычно WCAG AA | WCAG AAA, тестирование на реальных пользователях |

### Когда строить свою дизайн-систему

- **Несколько продуктов** с общим брендом (веб, мобильное, email).
- **Строгие требования** к доступности (государственные сайты, финансовый сектор).
- **Уникальный дизайн**, не укладывающийся в Material/Bootstrap.
- **Команда 10+ разработчиков**, которым нужна единая точка истины.

### Когда достаточно UI-кита

- Один продукт или MVP.
- Стандартный дизайн (Material, Bootstrap).
- Команда 1-5 разработчиков.
- Нет ресурсов на поддержку дизайн-системы.

### Структура дизайн-системы

```
design-system/
├── tokens/          # CSS custom properties, JSON-токены
│   ├── colors.css
│   ├── spacing.css
│   └── typography.css
├── components/      # Vue-компоненты на основе токенов
│   ├── Button/
│   │   ├── Button.vue
│   │   ├── Button.test.ts
│   │   └── Button.stories.ts
│   └── Input/
├── patterns/        # Составные паттерны (Form, Card, Modal)
├── utils/           # Хелперы (mergeClasses, useTheme)
└── docs/            # Storybook или VitePress
```

---

## Поставка компонентов в другие фреймворки

Когда Vue-компоненты нужно использовать в React, Angular или чистом HTML, есть три стратегии:

### 1. Web Components через `defineCustomElement`

```js
import { defineCustomElement } from 'vue';
import VueButton from './Button.vue';

const ButtonCE = defineCustomElement(VueButton);
customElements.define('vue-button', ButtonCE);
```

Использование в React:

```jsx
function App() {
  return <vue-button variant="primary">Click me</vue-button>;
}
```

**Плюсы:** фреймворк-агностичность, изоляция стилей.
**Минусы:** дублирование рантайма Vue, сериализация props, нет scoped slots.

### 2. Wrapper-компоненты

React-обёртка над Vue-компонентом:

```jsx
import { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import VueButton from './Button.vue';

function VueButtonWrapper({ variant, children, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    const app = createApp(VueButton, { variant, onClick });
    app.mount(ref.current);
    return () => app.unmount();
  }, [variant, onClick]);

  return <div ref={ref}>{children}</div>;
}
```

**Плюсы:** полный контроль, нет Shadow DOM.
**Минусы:** ручное управление жизненным циклом, дублирование зависимостей.

### 3. Micro-frontend через Module Federation

Для крупных проектов — загрузка Vue-приложения как удалённого модуля через Module Federation (см. `architecture/micro-frontends.md`). Компонент монтируется в контейнер на странице.

### Проблемы поставки

- **Дублирование рантайма.** Каждый Vue-компонент как custom element тянет свою копию Vue.
- **Сериализация props.** Объекты и функции не передаются через атрибуты — только свойства (properties).
- **Отсутствие реактивности.** Изменение props в React не обновляет Vue-компонент автоматически — нужна синхронизация через `watch`.
- **Стили.** Shadow DOM изолирует, но CSS custom properties нужно пробрасывать осознанно.

---

## Тестирование и SSR

### Тестирование

Vue Test Utils по умолчанию не монтирует Shadow DOM. Для тестирования веб-компонентов:

```ts
import { mount } from '@vue/test-utils';
import MyButton from './MyButton.ce.vue';

describe('MyButton', () => {
  it('renders slot content', async () => {
    const wrapper = mount(MyButton, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' },
      attachTo: document.body, // реальный DOM для Shadow DOM
    });

    expect(wrapper.shadowRoot?.querySelector('button')).toBeTruthy();
    expect(wrapper.text()).toContain('Click me');

    wrapper.unmount();
  });
});
```

Альтернатива — e2e-тесты через Playwright или Cypress, которые работают с реальным браузером и Shadow DOM.

### SSR

Shadow DOM **не рендерится на сервере**. Custom elements монтируются только на клиенте, что создаёт проблемы:

- **Flash of undefined content.** Браузер показывает пустой элемент, пока JS не загрузится и не зарегистрирует custom element.
- **Гидратация.** Vue не может гидратировать Shadow DOM, потому что серверный HTML не содержит shadow root.

Решения:

- **Declarative Shadow DOM** — браузерный стандарт, позволяющий серверу отправить HTML с shadow root через `<template shadowrootmode="open">`.
- **Fallback-контент** в light DOM, который заменяется после монтирования custom element.
- **Отложенное монтирование** — custom element регистрируется после загрузки JS, а fallback отображается до этого момента.

```vue
<my-button>
  <button>Click me</button> <!-- fallback до монтирования -->
</my-button>
```

---

## Когда Web Components, а когда нет

### Используйте Web Components, если:

- **Гетерогенная среда.** Несколько фреймворков на одной странице (Vue + React + legacy).
- **Поставка виджетов.** Компоненты для сторонних сайтов (чат, форма обратной связи).
- **Микрофронтенды.** Независимый деплой частей интерфейса (см. `architecture/micro-frontends.md`).
- **Дизайн-система как продукт.** Поставка компонентов для внешних команд.

### Оставайтесь в рамках Vue-компонентов, если:

- **Однофреймворковое приложение.** Весь проект на Vue.
- **Сложная логика.** Scoped slots, `provide`/`inject`, composables — всё это не работает через границу custom element.
- **Производительность критична.** Shadow DOM добавляет overhead на монтирование и стили.
- **SSR важен.** Custom elements не рендерятся на сервере без дополнительной работы.

### Промежуточный вариант

Использовать UI-кит внутри Vue-приложения, а для поставки наружу — экспортировать отдельные компоненты как Web Components:

```js
// Внутреннее использование
import { ElButton } from 'element-plus';

// Поставка наружу
import { defineCustomElement } from 'vue';
import { defineComponent } from 'vue';

const ExportedButton = defineComponent({
  components: { ElButton },
  template: '<ElButton v-bind="$attrs"><slot /></ElButton>',
});

customElements.define('ui-button', defineCustomElement(ExportedButton));
```

---

## Лучшие практики и антипаттерны

### Делайте

- **Используйте `.ce.vue`-суффикс** для файлов custom elements — это соглашение, которое понимают сборщики.
- **Пробрасывайте токены через CSS custom properties**, а не хардкод в Shadow DOM.
- **Документируйте атрибуты и события** custom element, как API компонента.
- **Тестируйте в реальном браузере**, а не только в jsdom — Shadow DOM ведёт себя иначе.
- **Используйте UI-киты** для внутренних Vue-приложений, а Web Components — для поставки наружу.
- **Стройте дизайн-систему**, когда продуктов несколько или требования к доступности строги.

### Не делайте

- **Не оборачивайте каждый Vue-компонент в custom element** для внутреннего использования — это overhead без выгоды.
- **Не передавайте объекты через атрибуты** — только через свойства (properties).
- **Не рассчитывайте на `provide`/`inject` через границу** custom element.
- **Не игнорируйте fallback-контент** для SSR — пользователь увидит пустое место.
- **Не смешивайте scoped-стили Vue и Shadow DOM** без понимания, что они работают по-разному.
- **Не выбирайте UI-кит без оценки** tree-shaking, SSR-поддержки и доступности.

---

## Ключевые тезисы для интервью

- `defineCustomElement` компилирует SFC в класс `HTMLElement`, который монтирует Vue-приложение внутри Shadow DOM; стили инкапсулированы, но `provide`/`inject` и scoped slots не пересекают границу элемента.
- Shadow DOM полностью изолирует CSS, кроме CSS custom properties, которые наследуются через shadow boundary и используются для темизации; селекторы `:host`, `:host-context`, `::slotted` работают с host-элементом и light DOM-контентом.
- Нативные HTML-слоты принимают контент, но не передают данные (scoped slots недоступны); события из Shadow DOM переоформляются в `CustomEvent` с `target` на host-элементе.
- UI-киты (Element Plus, Vuetify, PrimeVue) дают готовые компоненты с фиксированным дизайном; дизайн-система — это токены, паттерны и принципы, поверх которых строится кит под уникальный бренд.
- Поставка Vue-компонентов в другие фреймворки через Web Components дублирует рантайм Vue, сериализует props в атрибуты и теряет реактивность — для внутренних проектов это избыточно.
- Vue Test Utils не монтирует Shadow DOM по умолчанию, поэтому веб-компоненты тестируют с `attachTo: document.body` или через e2e-тесты; при SSR Shadow DOM не рендерится, и требуется Declarative Shadow DOM или fallback-контент.
- Web Components оправданы для гетерогенной среды, виджетов и микрофронтендов; для однофреймворкового Vue-приложения достаточно UI-кита и `vue/styling.md`-механизмов.

---

## Заключение

Веб-компоненты и UI-киты решают разные задачи. Web Components — это стандарт браузера для поставки компонентов в гетерогенную среду; Vue поддерживает их через `defineCustomElement`, но с ограничениями: нет `provide`/`inject` через границу, нет scoped slots, стили изолированы через Shadow DOM. UI-киты (Element Plus, Vuetify, PrimeVue) — это готовые Vue-компоненты для внутренних проектов, а дизайн-система — надстройка, которая унифицирует токены, паттерны и доступность.

На Senior-собеседовании важно объяснить, когда Web Components — правильный выбор (микрофронтенды, виджеты, несколько фреймворков), а когда достаточно UI-кита (большинство Vue-приложений). Понимание trade-offs между инкапсуляцией Shadow DOM и гибкостью Vue-компонентов, знание механизмов темизации через CSS custom properties и умение выбрать стратегию поставки компонентов — ключевые компетенции UI Engineer.

---

## Полезные ссылки

- [Web Components — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Custom Elements — Vue.js Guide](https://vuejs.org/guide/extras/web-components.html)
- [defineCustomElement API](https://vuejs.org/api/custom-elements.html#definecustomelement)
- [Shadow DOM — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [Element Plus](https://element-plus.org/)
- [Vuetify](https://vuetifyjs.com/)
- [PrimeVue](https://primevue.org/)
- [Naive UI](https://www.naiveui.com/)
- [Shadow DOM и стили — CSS Tricks](https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/)
- [Testing Web Components — Open WC](https://open-wc.org/docs/testing/testing-package/)
