---
title: "Паттерны компонентов и файловая структура во Vue"
section: architecture
stacks: ["vue","nuxt"]
description: "Паттерны Vue-компонентов (слоты, provide/inject, scoped slots, composables, v-model) и подходы к организации файлов в проектах Vue и Nuxt 3."
order: 6
tags: ["vue", "composables", "scoped-slots", "provide-inject", "v-model", "nuxt"]
questions:
  - "Как provide/inject реализуют Compound Components и почему это гибче передачи множества пропсов"
  - "Почему composables вытеснили mixins и в каких случаях scoped slots всё ещё полезны"
  - "Как Container/Presentational трансформировался с появлением серверных компонентов и useAsyncData в Nuxt"
  - "Как v-model и defineModel позволяют компоненту работать в controlled и uncontrolled режимах одновременно"
  - "Чем feature-based структура отличается от type-based и когда стоит переходить к Feature-Sliced Design"
  - "Как файловая маршрутизация Nuxt (pages/, layouts/, middleware/, server/api/) организует структуру проекта"
  - "Почему colocation предпочтительнее отдельных `__tests__/` и какие компромиссы у баррел-файлов"
answers:
  - "`Select` раздаёт состояние через `provide(selectKey, ...)`, а подкомпоненты (`SelectTrigger`, `SelectContent`, `SelectItem`) получают его через `inject(selectKey)` — пользователь собирает компонент из частей и контролирует DOM. В отличие от React здесь нет записи `Select.Trigger`: подкомпоненты регистрируются и импортируются отдельно."
  - "Composable (`useMousePosition`) инкапсулирует `ref` и lifecycle-хуки, возвращая чистый API с явными зависимостями, тогда как mixins сливают свойства в компонент «магически» и ломают типизацию. Scoped slots остаются полезны для инверсии контроля над рендерингом — как `#item=\"{ item }\"` в `DataTable`."
  - "В Nuxt данные грузит сервер: `useAsyncData`/`useFetch` выполняют запрос на сервере при SSR, и презентационные компоненты получают данные через пропсы. Серверные компоненты `*.server.vue` уточняют границу, а явные пары «контейнер + презентация» на клиенте стали избыточны."
  - "`defineModel('on')` компилируется в проп `on` и событие `update:on`: если родитель передал `v-model:on` — состояние контролируется извне, иначе компонент управляет им сам через локальный `ref`. Это аналог `<input value>` vs `<input defaultValue>`."
  - "Type-based группирует по техническому назначению (`components/`, `composables/`, `utils/`) и раздувает `components/` при росте проекта. Feature-based держит всё, что относится к фиче, рядом, а к FSD переходят для больших команд: строгие импорты между слоями `app → pages → widgets → features → entities → shared`."
  - "Nuxt задаёт структуру через файловую систему: `pages/` — маршруты (динамические `[id]`, опциональные `[[tab]]`, catch-all `[...slug]`), `layouts/` — обёртки страниц, `middleware/` — навигационные гарды, `server/api/` — API-роуты Nitro. Компоненты, composables и utils автоимпортируются из своих директорий."
  - "Colocation держит тесты Vitest и типы рядом с компонентом (`login-form.spec.ts` в `features/auth/`), поэтому связанное не разбросано. Баррел-файлы `index.ts` удобны для публичных API фич, но в UI-китах с десятками компонентов могут ухудшить tree-shaking бандлера."
---

# Паттерны компонентов и файловая структура во Vue

Композиция — главный способ построения Vue-приложений: вместо наследования и примесей Vue собирает сложный UI из компонентов через слоты, а переиспользуемую логику выносит в composables. В статье разберём ключевые паттерны компонентов (слоты, provide/inject, scoped slots, v-model) и подходы к организации файлов в проектах Vue и Nuxt 3.

> 💡 Есть React-версия этой статьи: [Паттерны компонентов и файловая структура в React](./design-patterns.md). Многие паттерны (feature-based структура, FSD, Container/Presentational) применимы к обоим фреймворкам, но реализуются разными механизмами.

## Содержание

1. [Композиция компонентов](#композиция-компонентов)
2. [Compound Components](#compound-components)
3. [Scoped Slots (Render Props)](#scoped-slots-render-props)
4. [Composables](#composables)
5. [Container / Presentational](#container--presentational)
6. [State Reducer](#state-reducer)
7. [Control Props: v-model и defineModel](#control-props-v-model-и-definemodel)
8. [Props Collection](#props-collection)
9. [Структура файлов: подходы](#структура-файлов-подходы)
10. [Структура файлов в Nuxt 3](#структура-файлов-в-nuxt-3)
11. [Организация общего кода](#организация-общего-кода)
12. [Лучшие практики](#лучшие-практики)
13. [Антипаттерны](#антипаттерны)
14. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
15. [Заключение](#заключение)
16. [Полезные ссылки](#полезные-ссылки)

---

## Композиция компонентов

Во Vue сложное поведение строится через вложение компонентов, а «дыры» для контента предоставляют слоты. Слоты — это эквивалент `children` в React.

### Дефолтный слот

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- Использование -->
<Card>
  <h2>Заголовок</h2>
  <p>Содержимое карточки</p>
</Card>
```

### Именованные слоты

Когда нужно несколько «слотов» для разных частей UI:

```vue
<!-- Dialog.vue -->
<template>
  <div class="dialog">
    <header class="dialog__header"><slot name="header" /></header>
    <main class="dialog__body"><slot /></main>
    <footer class="dialog__footer"><slot name="footer" /></footer>
  </div>
</template>

<!-- Использование -->
<Dialog>
  <template #header><h2>Подтверждение</h2></template>
  <p>Вы уверены?</p>
  <template #footer><Button @click="handleConfirm">Да</Button></template>
</Dialog>
```

Композиция через слоты позволяет менять поведение компонента без его изменения — ключевой принцип гибкой архитектуры.

---

## Compound Components

**Compound Components** (составные компоненты) — паттерн, при котором несколько компонентов работают вместе, разделяя неявное состояние через `provide`/`inject`. Пользователь API собирает компонент из частей, получая максимальную гибкость.

### Зачем нужен

Представьте `<Select>` с фиксированным API:

```vue
<!-- ❌ Жёсткий API — нельзя кастомизировать internals -->
<Select
  :items="items"
  :render-item="renderItem"
  :render-trigger="renderTrigger"
/>
```

Compound-подход даёт полный контроль над структурой:

```vue
<!-- ✅ Compound Components — полная гибкость -->
<Select v-model="selected" :items="items">
  <SelectTrigger>
    <SelectValue placeholder="Выберите..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem v-for="item in items" :key="item.id" :value="item.id">
      <Avatar :src="item.avatar" />
      <span>{{ item.name }}</span>
    </SelectItem>
  </SelectContent>
</Select>
```

В отличие от React, во Vue нет записи `Select.Trigger` через статические свойства — подкомпоненты импортируются и регистрируются отдельно (как в Radix Vue, Ark UI).

### Реализация через provide/inject

Ключ выносится в отдельный модуль, чтобы родитель и подкомпоненты ссылались на один символ:

```js
// select-context.js
export const selectKey = Symbol('select')
```

```vue
<!-- Select.vue -->
<script setup>
import { provide, ref, readonly } from 'vue'
import { selectKey } from './select-context'

const props = defineProps({
  items: { type: Array, required: true },
  modelValue: { type: [String, Number], default: null },
})
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

provide(selectKey, {
  items: props.items,
  isOpen: readonly(isOpen),
  toggle: () => (isOpen.value = !isOpen.value),
  close: () => (isOpen.value = false),
  select: (value) => {
    emit('update:modelValue', value)
    isOpen.value = false
  },
})
</script>

<template>
  <div class="select">
    <slot />
  </div>
</template>
```

```vue
<!-- SelectTrigger.vue -->
<script setup>
import { inject } from 'vue'
import { selectKey } from './select-context'

const { isOpen, toggle } = inject(selectKey)
</script>

<template>
  <button class="select__trigger" type="button" @click="toggle">
    <slot />
  </button>
</template>
```

```vue
<!-- SelectContent.vue -->
<script setup>
import { inject } from 'vue'
import { selectKey } from './select-context'

const { isOpen } = inject(selectKey)
</script>

<template>
  <div v-if="isOpen" class="select__content">
    <slot />
  </div>
</template>
```

```vue
<!-- SelectItem.vue -->
<script setup>
import { inject } from 'vue'
import { selectKey } from './select-context'

const props = defineProps({ value: { type: [String, Number], required: true } })
const { select } = inject(selectKey)
</script>

<template>
  <div class="select__item" @click="select(value)">
    <slot />
  </div>
</template>
```

### Когда использовать

- Библиотечные компоненты с кастомизацией (Radix Vue, Ark UI, Headless UI)
- Компоненты, где количество вариантов конфигурации слишком велико для пропсов
- Когда нужно дать пользователю контроль над структурой DOM

### Когда НЕ использовать

- Простые компоненты с 2–3 пропсами — проще передать их явно
- Когда составные части не разделяют состояние
- Для доступа к родителю на 1–2 уровня — это prop drilling, а не композиция

> 💡 **Популярные библиотеки на Compound Components:** Radix Vue, Ark UI, Headless UI. Все они предоставляют «headless» API — логику и доступность без стилей.

---

## Scoped Slots (Render Props)

**Scoped Slots** — паттерн, при котором компонент пробрасывает данные в слот-функцию. Родитель решает, как отрендерить эти данные, а компонент — откуда их взять. Это прямой аналог render props в React.

```vue
<!-- DataTable.vue -->
<script setup>
defineProps({ items: Array })
defineEmits(['select'])
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" @click="$emit('select', item)">
      <slot name="item" :item="item" />
    </li>
  </ul>
</template>
```

```vue
<!-- Использование: родитель полностью контролирует рендеринг строки -->
<DataTable :items="users" @select="openProfile">
  <template #item="{ item }">
    <Avatar :src="item.avatar" />
    <span>{{ item.name }}</span>
  </template>
</DataTable>
```

### Scoped Slots vs Composables

Composables инкапсулируют логику и возвращают данные, а scoped slots дают контроль над рендерингом конкретного элемента:

```vue
<!-- ❌ Логика в компоненте вместо composable — сложно переиспользовать -->
<MouseTracker>
  <template #default="{ x, y }">
    <p>Cursor: {{ x }}, {{ y }}</p>
  </template>
</MouseTracker>

<!-- ✅ Composables — современный подход для переиспользования логики -->
<script setup>
// composables/useMousePosition.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMousePosition() {
  const x = ref(0)
  const y = ref(0)

  function handleMove(e) {
    x.value = e.clientX
    y.value = e.clientY
  }

  onMounted(() => window.addEventListener('mousemove', handleMove))
  onUnmounted(() => window.removeEventListener('mousemove', handleMove))

  return { x, y }
}
</script>

<script setup>
const { x, y } = useMousePosition()
</script>

<template>
  <p>Cursor: {{ x }}, {{ y }}</p>
</template>
```

### Когда scoped slots всё ещё полезны

- В библиотеках, где нужно инвертировать контроль над рендерингом (`#item`, `#trigger`)
- Когда рендер тесно связан с конкретным местом в разметке
- Для таблиц, списков, virtualization и других data-driven компонентов

---

## Composables

**Composables** — функции, инкапсулирующие состояние и побочные эффекты с помощью Composition API. Это основной паттерн переиспользования логики в современном Vue.

### Паттерн: абстракция API-запросов

```js
// composables/useApi.js
import { ref, watch, onUnmounted } from 'vue'

export function useApi(url) {
  const data = ref(null)
  const error = ref(null)
  const isLoading = ref(true)

  let controller

  async function load() {
    controller = new AbortController()
    isLoading.value = true
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(res.statusText)
      data.value = await res.json()
      error.value = null
    } catch (e) {
      if (e.name !== 'AbortError') error.value = e
    } finally {
      isLoading.value = false
    }
  }

  watch(load, { immediate: true })
  onUnmounted(() => controller?.abort())

  return { data, error, isLoading, refresh: load }
}
```

### Паттерн: композиция composables

Composables можно комбинировать, создавая более высокоуровневые абстракции:

```js
// composables/useAuth.js
import { ref, watch } from 'vue'

export function useAuth() {
  const user = ref(null)
  const { data, isLoading } = useApi('/api/me')

  watch(data, (d) => {
    if (d) user.value = d.user
  })

  async function login(credentials) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    const body = await res.json()
    user.value = body.user
  }

  function logout() {
    user.value = null
    fetch('/api/logout', { method: 'POST' })
  }

  return { user, isLoading, login, logout }
}
```

### Composables vs Mixins

До Composition API Vue 2 переиспользование логики строилось на mixins:

```js
// mixins/useMouse.js — Mixin
export const mouseMixin = {
  data: () => ({ x: 0, y: 0 }),
  mounted() { window.addEventListener('mousemove', this.handleMove) },
  beforeUnmount() { window.removeEventListener('mousemove', this.handleMove) },
  methods: {
    handleMove(e) { this.x = e.clientX; this.y = e.clientY }
  }
}
```

Проблемы mixins:

- **Магическое слияние**: `data` и `methods` разных mixins слепливаются, конфликты имён решаются тихо
- **Скрытые зависимости**: компонент «получает» `x`, `y`, `handleMove` из ниоткуда
- **Проблемы с типами** и сложная отладка «откуда взялось это свойство»

Composables решают это явной передачей зависимостей и возвратом значений — за что вытеснили mixins в Vue 3.

---

## Container / Presentational

Паттерн разделения компонентов на два типа:

- **Container (умный)** — отвечает за данные, логику, побочные эффекты
- **Presentational (глупый)** — отвечает только за отображение, получает всё через пропсы

```vue
<!-- Presentational — ничего не знает об источнике данных -->
<script setup>
defineProps({ users: Array, isLoading: Boolean })
defineEmits(['select'])
</script>

<template>
  <Spinner v-if="isLoading" />
  <ul v-else>
    <li v-for="user in users" :key="user.id" @click="$emit('select', user)">
      {{ user.name }}
    </li>
  </ul>
</template>
```

```vue
<!-- Container — загружает данные и передаёт в презентационный -->
<script setup>
const { data: users, isLoading } = useApi('/api/users')
const router = useRouter()
</script>

<template>
  <UserList
    :users="users"
    :is-loading="isLoading"
    @select="(user) => router.push(`/users/${user.id}`)"
  />
</template>
```

### Актуальность в 2026

С появлением SSR-данных в Nuxt и серверных компонентов паттерн **трансформировался**:

- В Nuxt запросы выполняются на сервере через `useAsyncData`/`useFetch`, поэтому страницы-контейнеры грузят данные ещё до клиента
- Компоненты остаются презентационными — получают данные через пропсы
- Серверные компоненты `*.server.vue` рендерятся на сервере и уточняют границу «что тянет данные»

```vue
<!-- pages/users/index.vue — данные грузит сервер при SSR -->
<script setup>
const { data: users, status } = await useFetch('/api/users')
</script>

<template>
  <UserList :users="users" :is-loading="status === 'pending'" />
</template>
```

Паттерн по-прежнему полезен для понимания разделения ответственности, но явное создание пар «контейнер + презентация» на клиенте стало избыточным.

---

## State Reducer

Паттерн **State Reducer** позволяет потребителю компонента контролировать, как обновляется внутреннее состояние, не меняя поведение по умолчанию.

```vue
<!-- Toggle.vue -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ reducer: { type: Function, default: null } })

const on = ref(false)

const defaultReducer = (state, action) => {
  switch (action.type) {
    case 'toggle': return !state.on
    case 'reset': return false
    default: return state.on
  }
}

const applyReducer = computed(() => (state, action) =>
  props.reducer
    ? props.reducer(defaultReducer, state, action)
    : defaultReducer(state, action),
)

const toggle = () => { on.value = applyReducer({ on: on.value }, { type: 'toggle' }) }
const reset = () => { on.value = applyReducer({ on: on.value }, { type: 'reset' }) }
</script>

<template>
  <slot :on="on" :toggle="toggle" :reset="reset" />
</template>
```

```vue
<!-- Использование: отключаем toggle при определённом условии -->
<Toggle :reducer="(defaultReducer, state, action) => {
  if (state.on && action.type === 'toggle') return state
  return defaultReducer(state, action)
}">
  <template #default="{ on, toggle }">
    <button @click="toggle">{{ on ? 'ON' : 'OFF' }}</button>
  </template>
</Toggle>
```

Этот паттерн часто встречается в headless UI-библиотеках, где нужно дать пользователю контроль над поведением без переписывания всей логики.

---

## Control Props: v-model и defineModel

Паттерн **Control Props** позволяет компоненту работать в двух режимах:

- **Uncontrolled** — компонент сам управляет своим состоянием
- **Controlled** — состояние управляется извне через пропсы и события

Во Vue это нативно выражается через `v-model` — сахар для `:modelValue` + `@update:modelValue`.

### v-model изнутри

```vue
<!-- Родитель -->
<Input v-model="name" />

<!-- Эквивалентно -->
<Input :modelValue="name" @update:modelValue="(v) => (name = v)" />
```

### defineModel (Vue 3.4+)

```vue
<!-- Toggle.vue -->
<script setup>
const on = defineModel('on', { default: false })
</script>

<template>
  <button type="button" @click="on = !on">{{ on ? 'ON' : 'OFF' }}</button>
</template>
```

```vue
<!-- Uncontrolled — компонент управляет состоянием сам -->
<Toggle />

<!-- Controlled — состояние живёт в родителе -->
<script setup>
const isOn = ref(false)
</script>
<template>
  <Toggle v-model:on="isOn" />
</template>
```

`defineModel('on')` компилируется в проп `on` и событие `update:on`. Если родитель передал `v-model:on` — компонент работает в controlled-режиме, иначе использует внутренний `ref`.

### Ручная реализация (Vue 3.0–3.3)

```vue
<script setup>
const props = defineProps({ on: { type: Boolean, default: false } })
const emit = defineEmits(['update:on'])

const toggle = () => emit('update:on', !props.on)
</script>
```

### Когда использовать

- Библиотечные компоненты (формы, модалки, аккордеоны, поля ввода)
- Когда нужно поддержать оба режима использования
- Для совместимости с управляемыми и неуправляемыми формами

---

## Props Collection

Паттерн **Props Collection** группирует связанные пропсы в объект, упрощая API:

```vue
<!-- ❌ Много отдельных пропсов -->
<DataTable
  :sort-field="'name'"
  :sort-order="'asc'"
  @sort-field-change="setSortField"
  @sort-order-change="setSortOrder"
  :filter-text="filterText"
  @filter-text-change="setFilterText"
/>

<!-- ✅ Группировка в объекты -->
<DataTable
  :sort="{ field: 'name', order: 'asc' }"
  :filter="{ text: '' }"
/>
```

```vue
<!-- DataTable.vue -->
<script setup>
defineProps({
  sort: { type: Object, required: true }, // { field, order }
  filter: { type: Object, default: () => ({ text: '' }) },
})
</script>
```

---

## Структура файлов: подходы

Организация файлов — одна из самых субъективных тем во Vue-разработке. Здесь подходы те же, что и в других фреймворках, но с другой терминологией: `hooks/` → `composables/`, `pages/` → `pages/` или `views/`.

### 1. По типу (Type-based)

Группировка по техническому назначению файлов:

```
src/
├── components/
│   ├── Button.vue
│   ├── Modal.vue
│   └── Input.vue
├── composables/
│   ├── useAuth.ts
│   └── useFetch.ts
├── services/
│   └── api.ts
├── utils/
│   └── format.ts
├── views/
│   ├── Home.vue
│   └── Dashboard.vue
└── types/
    └── index.ts
```

**Плюсы:** Простая навигация, понятна для маленьких проектов.
**Минусы:** При росте проекта папки `components/` раздуваются до сотен файлов. Связанные файлы разбросаны по разным директориям.

### 2. По фиче (Feature-based)

Группировка по бизнес-домену:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.vue
│   │   │   └── SignupForm.vue
│   │   ├── composables/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.vue
│   │   │   └── ProductList.vue
│   │   ├── composables/
│   │   │   └── useProducts.ts
│   │   ├── api/
│   │   │   └── productsApi.ts
│   │   └── index.ts
│   └── cart/
│       ├── components/
│       ├── composables/
│       │   └── useCart.ts
│       ├── store/
│       │   └── cartStore.ts
│       └── index.ts
├── shared/
│   ├── components/
│   │   ├── Button.vue
│   │   └── Modal.vue
│   ├── composables/
│   │   └── useDebounce.ts
│   ├── utils/
│   │   └── format.ts
│   └── types/
│       └── api.ts
└── app/
    ├── App.vue
    ├── providers.ts
    └── router.ts
```

**Плюсы:** Всё, что относится к фиче, в одном месте. Легко удалить фичу целиком. Масштабируется.
**Минусы:** Дублирование инфраструктуры (каждая фича имеет свою `components/`, `composables/`).

### 3. Feature-Sliced Design (FSD)

Популярная в СНГ-сообществе методология:

```
src/
├── app/              # инициализация приложения, провайдеры, роутинг
├── processes/        # сквозные бизнес-процессы (авторизация, оплата)
├── pages/            # страницы приложения
├── widgets/          # самостоятельные блоки UI (Sidebar, Header)
├── features/         # части функциональности (LikeButton, AddToCart)
├── entities/         # бизнес-сущности (User, Product, Order)
└── shared/           # переиспользуемый код (UI-kit, lib, API-клиент)
```

Каждый слой может импортировать только из слоёв ниже. Нарушение границ — ошибка архитектуры.

**Плюсы:** Строгие правила, предсказуемая структура, хорошо для больших команд.
**Минусы:** Много уровней абстракции, избыточно для проектов < 50 страниц.

---

## Структура файлов в Nuxt 3

Nuxt 3 навязывает структуру через файловую систему и автоимпорты:

```
app/
├── app.vue                      # корневой компонент
├── assets/                      # стили, шрифты
├── components/                  # автоимпорт
│   ├── AppButton.vue
│   └── base/
│       └── BaseModal.vue
├── composables/                 # автоимпорт (useX)
│   └── useAuth.ts
├── layouts/                     # обёртки страниц
│   ├── default.vue
│   └── auth.vue
├── middleware/                  # навигационные гарды
│   ├── auth.ts
│   └── guest.ts
├── pages/                       # файловая маршрутизация
│   ├── index.vue
│   ├── login.vue
│   ├── register.vue
│   ├── users/
│   │   ├── index.vue            # /users
│   │   └── [id].vue             # /users/42 — динамический сегмент
│   ├── settings/
│   │   └── [[tab]].vue          # опциональный сегмент
│   └── [...slug].vue            # catch-all / 404
├── plugins/
├── server/                      # Nitro server
│   ├── api/
│   │   ├── users/
│   │   │   ├── index.get.ts     # GET /api/users
│   │   │   └── [id].get.ts      # GET /api/users/:id
│   │   └── webhooks/
│   │       └── stripe.post.ts   # POST /api/webhooks/stripe
│   └── routes/
├── utils/                       # автоимпорт утилит
└── nuxt.config.ts
```

### Ключевые механизмы Nuxt

- **Файловая маршрутизация**: `pages/` превращается в роуты. Динамические `[id]`, опциональные `[[tab]]`, catch-all `[...slug]`
- **Nested routes**: родитель-обёртка `pages/users.vue` рендерит `<NuxtPage />` и оборачивает `pages/users/index.vue` и `pages/users/[id].vue`
- **Layouts**: выбор через `definePageMeta({ layout: 'auth' })`, по умолчанию `default.vue`
- **Middleware**: файлы в `middleware/` применяются через `definePageMeta({ middleware: 'auth' })`
- **Автоимпорт**: компоненты, composables и utils подхватываются из своих директорий без ручных импортов
- **Server routes**: `server/api/` и `server/routes/` — бэкенд на Nitro рядом с фронтендом (BFF-подход)
- **Data fetching**: `useFetch`/`useAsyncData` выполняются на сервере при SSR и кешируются

В отличие от Next.js App Router, в Nuxt нет route groups и intercepting routes — их роль выполняют layouts и nested routes.

---

## Организация общего кода

### UI-кит (shared/components/ui)

Базовые компоненты без бизнес-логики:

```
components/ui/
├── AppButton.vue
├── AppInput.vue
├── AppDialog.vue
├── DropdownMenu.vue
├── Toast.vue
└── index.ts
```

Эти компоненты:

- Не знают о бизнес-домене
- Не делают API-запросов
- Не используют глобальное состояние
- Принимают всё через пропсы и события

### Composables (shared/composables)

Переиспользуемые composables без привязки к фиче:

```
composables/
├── useDebounce.ts
├── useMediaQuery.ts
├── useClickOutside.ts
├── useLocalStorage.ts
└── useIntersectionObserver.ts
```

### Утилиты (shared/utils)

Чистые функции и конфигурация:

```
utils/
├── format.ts        # format, parse, validate
├── constants.ts     # enum, конфиг
├── api/
│   ├── client.ts    # настроенный fetch/axios
│   └── endpoints.ts # URL-ы API
└── validators/
    ├── auth.ts      # Zod-схемы
    └── product.ts
```

---

## Лучшие практики

### 1. `<script setup>` как дефолт

Composition API с `<script setup>` — стандарт Vue 3: компилятор-макросы (`defineProps`, `defineEmits`, `defineModel`) не требуют импортов и дают лучшую типизацию.

### 2. Именование composables и возврат реактивных значений

- Каждый composable начинается с `use` — это конвенция автоимпорта Nuxt
- Возвращайте refs согласованно: либо всегда `.value` на месте вызова, либо разворачивайте в `reactive`

### 3. provide/inject с Symbol-ключами

```ts
// keys.ts
export const themeKey = Symbol('theme')
```

Строковые ключи коллизируют, Symbol гарантирует уникальность — особенно важно в библиотеках.

### 4. Colocation — держите связанное рядом

```
features/auth/
├── login-form.vue
├── login-form.spec.ts
├── login-form.stories.ts
├── use-login.ts
├── login.schema.ts
└── types.ts
```

Тесты (Vitest), сторибуки, схемы валидации и типы живут рядом с компонентом, а не в отдельных `__tests__/`, `__stories__/` директориях.

### 5. Абсолютные импорты через алиасы

```ts
// nuxt.config.ts / vite.config.ts
export default defineConfig({
  alias: {
    '@': '/app',
    '~': '/app',
  },
})
```

```ts
// ✅ Читаемый импорт
import { useAuth } from '~/features/auth'
import { AppButton } from '~/components/ui'

// ❌ Относительный импорт через 4 уровня
import { AppButton } from '../../../../components/ui'
```

### 6. Единая точка входа для API

```ts
// utils/api.ts
const apiClient = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: await getAuthHeaders() })
    if (!res.ok) throw new ApiError(res)
    return res.json()
  },
  async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new ApiError(res)
    return res.json()
  },
}
```

Все запросы проходят через один клиент — легко добавить interceptors, логирование, обработку ошибок.

### 7. Баррел-файлы для публичных API

```ts
// features/auth/index.ts
export { default as LoginForm } from './components/login-form.vue'
export { default as SignupForm } from './components/signup-form.vue'
export { useAuth } from './composables/use-auth'
export type { User, AuthState } from './types'
```

> ⚠️ Баррел-файлы могут ухудшить tree-shaking в бандлерах. Используйте их для публичных API модулей, но не для `components/ui/` с десятками компонентов.

---

## Антипаттерны

### 1. God Component

Один компонент, который делает всё:

```vue
<script setup>
// ❌ 500+ строк, вся бизнес-логика в одном месте
const users = ref([])
const products = ref([])
const orders = ref([])
const filters = ref({})
const sort = ref({})
const page = ref(1)
const modal = ref(null)
const handleUserClick = () => { /* ... */ }
const handleProductDelete = () => { /* ... */ }
// ... десятки обработчиков и запросов
</script>

<template>
  <!-- 500 строк шаблона -->
</template>
```

Разбивайте на компоненты, composables и утилиты.

### 2. Микс абьюз (вместо composables)

```js
// ❌ mixins/use-filters.js + mixins/use-sort.js + mixins/use-pagination.js
// Свойства сливаются «магически», конфликты имён решаются тихо
```

Composables дают явные зависимости и типизацию — используйте их вместо цепочек mixins.

### 3. Глубокий prop drilling

```vue
<!-- ❌ Пробрасываем isLoading через 5 уровней пропсов -->
<Page :is-loading="loading">
  <Dashboard :is-loading="loading">
    <Widget :is-loading="loading">
      <Table :is-loading="loading">
```

Используйте `provide`/`inject` для глубоких зависимостей или вынесите состояние в Pinia.

### 4. Императивный DOM через refs

```vue
<script setup>
// ❌ Дёргаем DOM вручную, когда есть декларативные решения
const listEl = ref(null)
const scrollToBottom = () => listEl.value.scrollTo(...)
</script>
```

Отдайте предпочтение декларативному подходу: `v-if`, `v-for`, computed, `Transition`.

### 5. Случайная структура

```
src/
├── components/
│   ├── NewButton.vue
│   ├── old_modal.vue
│   ├── userCard.vue
│   └── temp/
│       └── test.vue
├── utils/
│   ├── helpers.ts
│   ├── helpers2.ts
│   └── old_helpers.ts
└── api/
    ├── api.ts
    └── newApi.ts
```

Нет конвенции именования, дублирование, временные файлы становятся постоянными.

### 6. Circular Dependencies

```ts
// user.ts
import type { Order } from './order'
export type User = { orders: Order[] }

// order.ts
import type { User } from './user'
export type Order = { user: User }
```

Используйте `import type`, интерфейсы или рефакторите в общий файл типов.

---

## Ключевые тезисы для интервью

- Композиция в Vue строится через слоты: дефолтный — базовая «дыра», именованные (`#header`, `#footer`) — несколько слотов для разных частей UI. Это аналог `children` в React.
- Compound Components реализуются через `provide`/`inject` с Symbol-ключом: родитель раздаёт состояние, подкомпоненты его инжектят. В отличие от React, нет записи `Select.Trigger` — части импортируются отдельно.
- Scoped slots — аналог render props: компонент пробрасывает данные в слот-функцию (`#item="{ item }"`), давая инверсию контроля над рендерингом. Для переиспользования логики их вытеснили composables.
- Composables вытеснили mixins: инкапсулируют состояние и lifecycle-хуки с явными зависимостями, без магического слияния `data`/`methods`.
- Container/Presentational трансформировался: в Nuxt данные грузит сервер через `useAsyncData`/`useFetch` при SSR, компоненты остаются презентационными, а `*.server.vue` уточняет границу.
- `v-model` — сахар для `:modelValue` + `@update:modelValue`. `defineModel` позволяет компоненту работать в controlled и uncontrolled режимах — аналог `<input value>` vs `<input defaultValue>`.
- Feature-based структура масштабируется лучше type-based: всё, что относится к фиче, живёт рядом. Feature-Sliced Design формализует это строгими правилами импортов между слоями (app → pages → widgets → features → entities → shared).
- Nuxt задаёт структуру через файловую систему: `pages/` с динамическими маршрутами `[id]`, `[[tab]]`, `[...slug]`, layouts, middleware и server routes на Nitro. Автоимпорт компонентов, composables и utils.
- Colocation (тесты Vitest, типы, схемы рядом с компонентом) удобнее отдельных `__tests__/`. Баррел-файлы (`index.ts`) полезны для публичных API, но могут ломать tree-shaking в UI-китах.

## Заключение

Vue-паттерны — это словарь, на котором разговаривают senior-разработчики Vue-экосистемы: слоты вместо наследования, composables вместо mixins, `provide`/`inject` вместо глубокого prop drilling, `v-model` как нативный механизм controlled/uncontrolled. Структура файлов — не догма, а компромисс между простотой навигации и масштабируемостью: для маленьких проектов достаточно type-based, для средних — feature-based, для больших — FSD или domain-driven подход. В Nuxt многое уже решено файловой системой и автоимпортами — важно не бороться с конвенцией, а использовать её.

## Полезные ссылки

- [Vue Docs — Slots](https://vuejs.org/guide/components/slots.html)
- [Vue Docs — Provide/Inject](https://vuejs.org/guide/components/provide-inject.html)
- [Vue Docs — Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue Docs — v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue Docs — Renderless Components](https://vuejs.org/guide/components/slots.html#renderless-components)
- [Nuxt Docs — Directory Structure](https://nuxt.com/docs/guide/directory-structure/nuxt)
- [Nuxt Docs — Pages](https://nuxt.com/docs/guide/directory-structure/pages)
- [Feature-Sliced Design](https://feature-sliced.design/)