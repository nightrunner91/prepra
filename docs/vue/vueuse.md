---
title: "Экосистема VueUse"
section: vue
description: "Обзор библиотеки VueUse: готовые composables для состояния, DOM, сенсоров, сети и браузерных API, а также критерии выбора между готовым решением и собственным composable."
order: 14
tags: ["vue", "vue3", "vueuse", "composables", "composition-api", "ecosystem", "script-setup"]
questions:
  - "Что такое VueUse и какую проблему он решает"
  - "Как установить VueUse и подключить отдельные функции с tree-shaking"
  - "Какие категории composables есть в VueUse и что они покрывают"
  - "Как работают useLocalStorage, useFetch, useDark, useMouse и useElementSize"
  - "Как VueUse ведёт себя при SSR и что такое @vueuse/ssr"
  - "Когда стоит использовать готовый composable, а когда писать свой"
  - "Какие антипаттерны встречаются при использовании VueUse"
  - "С чем можно сравнить VueUse в экосистеме React"
---

# Экосистема VueUse

Один из главных выигрышей Composition API во Vue 3 — возможность собирать логику в небольшие переиспользуемые функции, называемые composables. Но писать их с нуля каждый раз не нужно: сообщество уже создало сотни проверенных решений под типичные задачи — работу с DOM, браузерными API, хранилищами, сетью, анимацией и сенсорами. Самая известная и зрелая коллекция таких функций называется **VueUse**.

Эта статья посвящена экосистеме VueUse. Мы разберём, как устроена библиотека, какие категории composables в ней есть, рассмотрим популярные примеры и поговорим о важных нюансах: tree-shaking, SSR, типизация и безопасность. Отдельное внимание уделим вопросу, когда стоит взять готовое решение, а когда лучше написать свой composable.

## Содержание

1. [Что такое VueUse](#что-такое-vueuse)
2. [Установка и подключение](#установка-и-подключение)
3. [Категории composables](#категории-composables)
4. [Состояние и хранилища: `useStorage`, `useLocalStorage`](#состояние-и-хранилища-usestorage-uselocalstorage)
5. [Темы и UI: `useDark`, `useColorMode`, `useToggle`](#темы-и-ui-usedark-usecolormode-usetoggle)
6. [Сеть и асинхронность: `useFetch`](#сеть-и-асинхронность-usefetch)
7. [DOM и размеры: `useMouse`, `useWindowSize`, `useElementSize`](#dom-и-размеры-usemouse-usewindowsize-useelementsize)
8. [Производительность ввода: `useDebounceFn`, `useThrottleFn`](#производительность-ввода-usedebouncefn-usethrottlefn)
9. [Адаптив и видимость: `useMediaQuery`, `useBreakpoints`, `useIntersectionObserver`](#адаптив-и-видимость-usemediaquery-usebreakpoints-useintersectionobserver)
10. [Анимация и таймеры: `useTransition`, `useIntervalFn`](#анимация-и-таймеры-usetransition-useintervalfn)
11. [Другие полезные composables](#другие-полезные-composables)
12. [SSR и безопасность](#ssr-и-безопасность)
13. [Tree-shaking и размер бандла](#tree-shaking-и-размер-бандла)
14. [Свой composable или VueUse](#свой-composable-или-vueuse)
15. [Сравнение с React](#сравнение-с-react)
16. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
17. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
18. [Заключение](#заключение)
19. [Полезные ссылки](#полезные-ссылки)

---

## Что такое VueUse

**VueUse** — это коллекция из более чем 200 готовых composables для Vue 3 (и Vue 2.7+ с ограниченной поддержкой). Библиотека создана Энтони Фу и поддерживается активным сообществом. Все функции написаны на TypeScript, хорошо документированы и покрыты тестами.

VueUse не заменяет собственные composables, но значительно ускоряет разработку. Вместо того чтобы каждый раз писать обёртку над `localStorage`, обработчик `resize` или логику переключения темы, можно взять проверенное решение и сосредоточиться на бизнес-логике.

Главные принципы VueUse:

- **Composition API first.** Все функции рассчитаны на использование внутри `setup()` или `<script setup>`.
- **Tree-shakable.** Импортируете только то, что используете.
- **SSR-aware.** Большинство composables корректно работают с серверным рендерингом, избегая обращений к `window` на сервере.
- **TypeScript-friendly.** Полная типизация из коробки.
- **Без внешних зависимостей.** Основной пакет `@vueuse/core` не тянет за собой тяжёлые библиотеки.

---

## Установка и подключение

Установка стандартная:

```bash
npm install @vueuse/core
# или
yarn add @vueuse/core
# или
pnpm add @vueuse/core
```

После установки composables импортируются как обычные функции:

```vue
<script setup>
import { useMouse } from '@vueuse/core';

const { x, y } = useMouse();
</script>

<template>
  <p>Мышь: {{ x }}, {{ y }}</p>
</template>
```

Каждый composable импортируется отдельно, поэтому сборщик может удалить неиспользуемый код. Это важно, потому что вся библиотека весила бы много, но реальное приложение использует лишь небольшую часть.

### Автоимпорт

В проектах на Nuxt можно включить автоимпорт через модуль `@vueuse/nuxt`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vueuse/nuxt'],
});
```

После этого composables доступны без явного импорта:

```vue
<script setup>
const { x, y } = useMouse();
</script>
```

Для Vite есть плагин `unplugin-auto-import`, который тоже поддерживает пресет `vueuse`.

---

## Категории composables

VueUse делит функции на логические группы. Это помогает быстро найти нужное решение.

| Категория | Примеры | Что покрывает |
|---|---|---|
| State | `useStorage`, `useLocalStorage`, `useSessionStorage`, `useRefHistory` | Локальное состояние, хранилища, undo/redo |
| Elements | `useMouse`, `useWindowSize`, `useElementSize`, `useElementBounding` | Размеры, позиции, события DOM |
| Browser | `useClipboard`, `usePermission`, `useFullscreen`, `useFetch` | Браузерные API и сеть |
| Sensors | `useMouse`, `useKeyStroke`, `useDeviceMotion`, `useGeolocation` | Сенсоры и ввод пользователя |
| Animation | `useTransition`, `useIntervalFn`, `useTimeoutFn` | Анимация и таймеры |
| Component | `useVModel`, `useSlots`, `useAttrs` | Интеграция с компонентами |
| Watch | `watchDebounced`, `watchThrottled`, `watchPausable` | Расширения над `watch` |
| Reactivity | `useCounter`, `useToggle`, `useCycleList` | Реактивные примитивы |
| Utilities | `useDateFormat`, `usePermission`, `useBase64` | Вспомогательные функции |
| RxJS | `useObservable`, `useSubscription` | Интеграция с RxJS |

Далее рассмотрим наиболее востребованные функции из разных категорий.

---

## Состояние и хранилища: `useStorage`, `useLocalStorage`

`useStorage` — универсальный composable для синхронизации реактивного значения с `localStorage`, `sessionStorage` или любым другим хранилищем.

```vue
<script setup>
import { useStorage } from '@vueuse/core';

const name = useStorage('my-app-name', 'Guest');

// name — это ref, при изменении записывается в localStorage
name.value = 'Alice';
</script>

<template>
  <input v-model="name" />
  <p>Привет, {{ name }}</p>
</template>
```

Преимущества по сравнению с ручной реализацией:

- Автоматическая сериализация и десериализация.
- Поддержка произвольных типов через `StorageSerializers`.
- Синхронизация между вкладками через событие `storage`.
- SSR-safe: на сервере возвращается значение по умолчанию.

`useLocalStorage` и `useSessionStorage` — это сокращения для `useStorage` с конкретным хранилищем:

```js
import { useLocalStorage, useSessionStorage } from '@vueuse/core';

const theme = useLocalStorage('theme', 'light');
const token = useSessionStorage('token', null);
```

Если в хранилище окажется некорректный JSON, `useStorage` поймает ошибку и вернёт значение по умолчанию. Для сложных типов можно передать свой сериализатор через опцию `serializer`.

---

## Темы и UI: `useDark`, `useColorMode`, `useToggle`

Переключение тёмной темы — одна из самых частых задач, и VueUse предлагает для неё готовое решение.

```vue
<script setup>
import { useDark, useToggle } from '@vueuse/core';

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <button @click="toggleDark()">
    {{ isDark ? '🌙 Тёмная' : '☀️ Светлая' }}
  </button>
</template>
```

`useDark` автоматически:

- определяет системные предпочтения через `prefers-color-scheme`;
- добавляет или удаляет CSS-класс `dark` на `html`;
- сохраняет выбор пользователя в `localStorage`;
- корректно работает при SSR.

`useToggle` — простой composable для переключения булева `ref`:

```js
const isOpen = ref(false);
const toggle = useToggle(isOpen);

toggle(); // true
toggle(); // false
toggle(false); // принудительно false
```

Если нужно больше режимов, чем светлая/тёмная тема, используется `useColorMode`: он позволяет добавлять произвольные режимы вроде «sepia» или «high-contrast».

---

## Сеть и асинхронность: `useFetch`

`useFetch` — обёртка над `fetch` с реактивным состоянием загрузки, ошибками и автоматическим выполнением запроса.

```vue
<script setup>
import { useFetch } from '@vueuse/core';

const { data, error, isFetching, abort } = useFetch('https://api.example.com/posts');
</script>

<template>
  <div>
    <p v-if="isFetching">Загрузка...</p>
    <p v-else-if="error">Ошибка: {{ error.message }}</p>
    <ul v-else>
      <li v-for="post in data" :key="post.id">{{ post.title }}</li>
    </ul>
    <button @click="abort">Отменить</button>
  </div>
</template>
```

---

## DOM и размеры: `useMouse`, `useWindowSize`, `useElementSize`

Эти composables оборачивают браузерные события в реактивные значения.

### `useMouse`

```vue
<script setup>
import { useMouse } from '@vueuse/core';

const { x, y } = useMouse();
</script>
```

`x` и `y` автоматически обновляются при движении мыши. Composable сам подписывается на событие и отписывается при размонтировании компонента.

### `useWindowSize`

```vue
<script setup>
import { useWindowSize } from '@vueuse/core';

const { width, height } = useWindowSize();
</script>
```

Удобно для адаптивной вёрстки, когда нужно принимать решения на основе текущего размера окна.

### `useElementSize`

```vue
<script setup>
import { ref } from 'vue';
import { useElementSize } from '@vueuse/core';

const el = ref(null);
const { width, height } = useElementSize(el);
</script>

<template>
  <div ref="el">
    Размер: {{ width }} x {{ height }}
  </div>
</template>
```

Под капотом используется `ResizeObserver`, поэтому изменения отслеживаются эффективнее, чем через `resize`-событие окна.

---

## Производительность ввода: `useDebounceFn`, `useThrottleFn`

При работе с частыми событиями — ввод в поле поиска, скролл, ресайз — важно ограничивать частоту вызова функций.

### `useDebounceFn`

```vue
<script setup>
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const query = ref('');

const search = useDebounceFn(async (q) => {
  const results = await api.search(q);
  // обработка результатов
}, 300);

watch(query, (newQuery) => search(newQuery));
</script>
```

Функция `search` вызовется только после того, как пользователь перестанет печатать на 300 мс.

### `useThrottleFn`

```vue
<script setup>
import { useThrottleFn } from '@vueuse/core';

const onScroll = useThrottleFn(() => {
  // логика при скролле
}, 100);
</script>
```

Throttle гарантирует, что функция не выполняется чаще указанного интервала, даже если события продолжают приходить.

### Разница на собеседовании

| Подход | Когда вызывается | Пример использования |
|---|---|---|
| Debounce | После паузы в потоке событий | Поиск по вводу, автосохранение |
| Throttle | Не чаще заданного интервала | Скролл, ресайз, прогресс-бар |

VueUse также предоставляет `watchDebounced` и `watchThrottled` — удобные обёртки над `watch` с встроенным debounce/throttle.

---

## Адаптив и видимость: `useMediaQuery`, `useBreakpoints`, `useIntersectionObserver`

### `useMediaQuery`

```vue
<script setup>
import { useMediaQuery } from '@vueuse/core';

const isMobile = useMediaQuery('(max-width: 768px)');
</script>

<template>
  <p>{{ isMobile ? 'Мобильная версия' : 'Десктоп' }}</p>
</template>
```

`isMobile` — это `ref<boolean>`, который обновляется при изменении медиа-условия.

### `useBreakpoints`

Для стандартных брейкпоинтов удобнее `useBreakpoints`:

```vue
<script setup>
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greater('md');
</script>
```

VueUse предоставляет готовые наборы брейкпоинтов: `breakpointsTailwind`, `breakpointsBootstrapV5`, `breakpointsVuetify` и другие.

### `useIntersectionObserver`

```vue
<script setup>
import { ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

const target = ref(null);
const targetIsVisible = ref(false);

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    targetIsVisible.value = isIntersecting;
  },
  { threshold: 0.5 }
);
</script>

<template>
  <div ref="target">
    {{ targetIsVisible ? 'Видно' : 'Не видно' }}
  </div>
</template>
```

Этот composable используется для ленивой загрузки изображений, бесконечного скролла и аналитики видимости блоков.

---

## Анимация и таймеры: `useTransition`, `useIntervalFn`

### `useTransition`

```vue
<script setup>
import { ref } from 'vue';
import { useTransition } from '@vueuse/core';

const source = ref(0);
const output = useTransition(source, {
  duration: 1000,
  transition: [0.4, 0, 0.2, 1], // ease-out
});

source.value = 100; // output плавно изменится от 0 до 100 за 1 секунду
</script>
```

`useTransition` возвращает плавно интерполированное значение между двумя числами. Это удобно для анимации счётчиков, прогресс-баров и графиков.

### `useIntervalFn`

```js
import { useIntervalFn } from '@vueuse/core';

const { pause, resume, isActive } = useIntervalFn(() => {
  // выполняется каждую секунду
}, 1000);
```

Composable автоматически очищает таймер при размонтировании компонента, что защищает от утечек памяти. Похожий `useTimeoutFn` выполняет функцию один раз через заданную задержку.

---

## Другие полезные composables

Помимо рассмотренных, в VueUse есть множество специализированных функций:

| Composable | Назначение |
|---|---|
| `useClipboard` | Копирование текста в буфер обмена |
| `useFullscreen` | Полноэкранный режим |
| `usePermission` | Проверка разрешений браузера |
| `useWebSocket` | Работа с WebSocket |
| `useFileDialog` | Диалог выбора файлов |
| `useVModel` | Удобная работа с `v-model` |
| `useFocus`, `useActiveElement` | Управление фокусом |
| `useMagicKeys` | Отслеживание клавиатурных комбинаций |

Каждый из них решает одну конкретную задачу и избавляет от написания шаблонного кода.

---

## SSR и безопасность

VueUse изначально проектировался с учётом SSR. Большинство composables:

- не обращаются к `window`, `document` и `navigator` на сервере;
- возвращают безопасные значения по умолчанию, если браузерный API недоступен;
- откладывают подписку на события до клиентского монтирования.

Например, `useWindowSize` на сервере вернёт стандартные значения `width: 0`, `height: 0`, а на клиенте — реальный размер окна.

Для сложных сценариев есть отдельный пакет `@vueuse/ssr`, который помогает передавать состояние с сервера на клиент и избегать гидратационных несоответствий.

### Безопасность

При работе с `useStorage` и `useFetch` важно помнить об уязвимостях:

- Данные из `localStorage` не являются доверенными. Не храните там токены без дополнительной проверки и не выполняйте `eval` над сохранёнными значениями.
- `useFetch` по умолчанию не экранирует HTML. Если вы выводите `data` через `v-html`, рискуете получить XSS.
- Браузерные разрешения (`usePermission`) запрашиваются у пользователя; не пытайтесь обойти это ограничение.

---

## Tree-shaking и размер бандла

VueUse спроектирован так, чтобы в бандл попадали только используемые функции. Это работает благодаря:

- именованным экспортам вместо одного большого объекта;
- модульной структуре пакета;
- отсутствию тяжёлых зависимостей в `@vueuse/core`.

Некоторые composables зависят от сторонних библиотек — например, `useSortable` требует `sortablejs`. Эти зависимости подключаются отдельно через `@vueuse/integrations`. Автоимпорт не увеличивает бандл, если функция не используется.

При необходимости можно импортировать функцию из подпакета:

```js
import { useMouse } from '@vueuse/core/useMouse';
```

---

## Свой composable или VueUse

Не всегда нужно тянуть в проект внешнюю зависимость. Вот критерии, которые помогают решить.

### Используйте VueUse, если

- Задача типичная: темы, хранилище, размеры окна, debounce, clipboard.
- Нужна кроссбраузерность и обработка краевых случаев.
- Важна SSR-совместимость из коробки.
- Хочется сэкономить время на тестировании и документации.

### Пишите свой composable, если

- Логика специфична для домена приложения.
- Вам нужен нестандартный контракт, который VueUse не предоставляет.
- Вы хотите избежать лишней зависимости в маленькой библиотеке или пакете.
- Готовое решение тянет за собой слишком много кода или сторонних зависимостей.

Например, `useFetch` подходит для простых GET-запросов, но для сложного кэширования, авторизации и отмены запросов лучше обернуть HTTP-клиент в собственный composable или использовать TanStack Query.

---

## Сравнение с React

В экосистеме React есть аналогичные коллекции хуков: `react-use`, `ahooks`, `usehooks-ts`, `mantine-hooks`. VueUse ближе всего к `react-use` по охвату, но отличается архитектурно.

| Аспект | VueUse | React-хуки |
|---|---|---|
| Базовая модель | Composables поверх Vue-реактивности | Hooks поверх рендер-цикла React |
| Правила вызова | Можно вызывать в composables и setup, гибче | Строгие правила Hooks: только на верхнем уровне компонента |
| Зависимости | Автоматическое отслеживание в `computed`/`watch` | Явные массивы зависимостей в `useEffect`/`useMemo` |
| SSR | Встроенная поддержка, избегает `window` на сервере | Требует осторожности, часто нужны отдельные библиотеки |
| Размер | Tree-shakable, модульная структура | Зависит от библиотеки; многие пакеты не tree-shakable |
| Типизация | Полная TypeScript-поддержка из коробки | Хорошая, но иногда требует дополнительных типов |

Сравнение помогает понять, почему VueUse-функции часто выглядят проще: реактивная система Vue берёт на себя большую часть работы по отслеживанию зависимостей и перерисовке.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- **Импортируйте только нужные функции.** Это сохраняет tree-shaking и читаемость.
- **Используйте автоимпорт в Nuxt или Vite.** Это уменьшает шаблонный код, но убедитесь, что вся команда понимает, откуда берутся функции.
- **Проверяйте SSR-поведение.** Особенно для composables, работающих с DOM и браузерными API.
- **Оборачивайте внешние API в собственный composable, если логика повторяется.** Даже если основа — VueUse, добавьте доменные имена и контракты.
- **Используйте `@vueuse/integrations` для сторонних библиотек.** Там собраны обёртки над `sortablejs`, `qrcode`, `fuse.js` и другими.

### ❌ Не делайте

- **Не подключайте VueUse ради одной простой функции.** Иногда собственный `computed` или `ref` проще и дешевле.
- **Не забывайте про очистку побочных эффектов.** Хотя VueUse обычно чистит сам, проверяйте это в собственных обёртках.
- **Не доверяйте данным из `localStorage`.** Всегда валидируйте и обрабатывайте ошибки сериализации.
- **Не используйте `useFetch` для сложной работы с API без дополнительной абстракции.** Для кэширования, инвалидации и синхронизации состояния лучше подойдут TanStack Query или Pinia.
- **Не смешивайте composables с неожиданными побочными эффектами.** Composable должен иметь чёткий контракт и предсказуемое поведение.

---

## Ключевые тезисы для интервью

1. **VueUse** — это коллекция из более чем 200 готовых composables для Vue 3, написанная на TypeScript и поддерживающая tree-shaking.
2. Основные категории VueUse: State, Elements, Browser, Sensors, Animation, Component, Watch, Reactivity, Utilities, RxJS.
3. Популярные composables: `useStorage`, `useDark`, `useFetch`, `useMouse`, `useElementSize`, `useDebounceFn`, `useMediaQuery`, `useIntersectionObserver`, `useTransition`.
4. VueUse корректно работает с SSR: избегает обращений к `window`/`document` на сервере и возвращает безопасные значения по умолчанию.
5. Библиотека tree-shakable, поэтому в бандл попадают только импортированные функции.
6. Используйте VueUse для типичных задач; пишите свой composable, когда логика специфична для домена или требует нестандартного контракта.
7. `@vueuse/integrations` содержит обёртки над сторонними библиотеками вроде `sortablejs` и `qrcode`.
8. `useFetch` хорош для простых сценариев; для сложного управления данными предпочтительны TanStack Query или собственная абстракция.
9. Composables в Vue свободнее React hooks: их можно вызывать в других composables, а зависимости отслеживаются автоматически.
10. При работе с `useStorage` и браузерными API не доверяйте внешним данным и учитывайте безопасность.

---

## Заключение

VueUse — это один из самых полезных инструментов в экосистеме Vue 3. Он демонстрирует силу Composition API на практике: сотни небольших, хорошо протестированных функций покрывают большинство рутинных задач фронтенд-разработки. Знание VueUse ускоряет разработку, но главное — оно помогает понять, как правильно проектировать собственные composables.

Для собеседований важно не только перечислить известные функции, но и объяснить, когда стоит брать готовое решение, а когда писать своё, как VueUse работает с SSR и tree-shaking, и чем composables в Vue отличаются от hooks в React. В следующей статье раздела мы рассмотрим создание проекта и структуру Vue-приложения с помощью Vite.

---

## Полезные ссылки

- [VueUse](https://vueuse.org/) — официальная документация и каталог функций.
- [VueUse Functions](https://vueuse.org/functions.html) — полный список composables с поиском.
- [Composables в Vue](https://vuejs.org/guide/reusability/composables.html) — официальное руководство по написанию собственных composables.
- [@vueuse/integrations](https://vueuse.org/integrations/README.html) — обёртки над сторонними библиотеками.
- [@vueuse/ssr](https://vueuse.org/ssr/README.html) — рекомендации по работе с SSR.
- [VueUse на GitHub](https://github.com/vueuse/vueuse) — исходный код и примеры.
