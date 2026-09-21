---
title: "Vuex: классический стейт-менеджер Vue"
section: state-management
description: "Vuex — официальный стейт-менеджер Vue 2 и Vue 3 до появления Pinia. state, mutations, getters, actions, модули с namespaced и миграция на Pinia."
order: 6
tags: ["vuex", "state-management", "vue", "flux", "pinia"]
questions:
  - "Зачем во Vuex разделены mutations и actions?"
  - "Почему mutations обязаны быть синхронными?"
  - "Как работает namespaced в модулях Vuex?"
  - "Чем mapState и mapGetters отличаются от прямого обращения через store?"
  - "Как правильно обновить вложенный объект в state Vuex?"
  - "Как получить доступ к store вне компонента?"
  - "В чём разница между Vuex 3 и Vuex 4?"
  - "Почему команда Vue заменила Vuex на Pinia?"
  - "Как тестировать mutations, getters и actions изолированно?"
  - "Когда стоит остаться на Vuex, а когда мигрировать на Pinia?"
---

# Vuex: классический стейт-менеджер Vue

Vuex долгое время был официальным стейт-менеджером Vue и построен на архитектуре Flux: единый стор, mutations как единственный легальный способ изменить состояние, actions для асинхронных операций и модули с namespaced для декомпозиции. С Vue 3 официальную роль перенял [Pinia](./pinia.md), но десятки тысяч проектов до сих пор живут на Vuex, и понимание его концепций необходимо для миграции и работы с легаси. В статье разобраны все ключевые понятия Vuex, паттерны применения и подробная схема перехода на Pinia.

## Содержание

1. [Что такое Vuex](#что-такое-vuex)
2. [Какую проблему решает Vuex](#какую-проблему-решает-vuex)
3. [Ключевые понятия](#ключевые-понятия)
4. [Базовое использование](#базовое-использование)
5. [Модули](#модули)
6. [Сценарии применения](#сценарии-применения)
7. [Продвинутые возможности](#продвинутые-возможности)
8. [Vuex 3 vs Vuex 4](#vuex-3-vs-vuex-4)
9. [Миграция на Pinia](#миграция-на-pinia)
10. [Лучшие практики](#лучшие-практики)
11. [Антипаттерны](#антипаттерны)
12. [Шпаргалка: Vuex ↔ Pinia](#шпаргалка-vuex--pinia)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)

---

## Что такое Vuex

Vuex — это **централизованный стейт-менеджер для Vue-приложений**, построенный на архитектуре Flux с однонаправленным потоком данных: компонент диспатчит action или коммитит mutation → mutation изменяет state → реактивная система Vue уведомляет подписчиков.

```js
import { createStore } from 'vuex'

const store = createStore({
  state: () => ({ count: 0 }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  mutations: {
    INCREMENT(state) { state.count++ },
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => commit('INCREMENT'), 1000)
    },
  },
})
```

```vue
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const count = computed(() => store.state.count)
const doubled = computed(() => store.getters.doubled)
</script>

<template>
  <button @click="store.commit('INCREMENT')">Count: {{ count }}, Doubled: {{ doubled }}</button>
</template>
```

Ключевые особенности Vuex:
- **Единый стор** — один глобальный объект состояния на всё приложение.
- **Mutations синхронны** — изменения state происходят только через них, что делает поток данных предсказуемым.
- **Actions для асинхронности** — все побочные эффекты (запросы, таймеры) живут здесь и вызывают mutations через `commit`.
- **Getters** — вычисляемые свойства стора, аналог `computed` для state.
- **Модули с namespaced** — декомпозиция большого стора на изолированные части.
- **Vue DevTools** — просмотр state, time travel, экспорт/импорт снимков.
- **Строгий режим** (`strict: true`) — падает при мутациях state вне mutations.

> 💡 **Pinia:** Vuex и [Pinia](./pinia.md) — предшественник и наследник. Философское различие: Vuex настаивает на явном разделении «синхронное изменение → mutation» и «асинхронное действие → action», Pinia объединяет их в actions. Подробное сравнение — в разделе [Миграция на Pinia](#миграция-на-pinia).

---

## Какую проблему решает Vuex

### Проблема 1: Разбросанное состояние между компонентами

До Vuex состояние жило в `data()` компонентов, а для общего доступа приходилось поднимать его к общему предку и пробрасывать пропсами вниз, а события — через `$emit` вверх. С ростом дерева это превращалось в prop drilling.

```vue
<!-- ❌ Без стейт-менеджера: prop drilling через 5 уровней -->
<App :user="user" @login="onLogin">
  <Layout :user="user" @login="onLogin">
    <Header :user="user" @login="onLogin">
      <UserMenu :user="user" @login="onLogin" />
    </Header>
  </Layout>
</App>
```

Vuex выносит `user` в глобальный стор — любой компонент читает его через `store.state.user` и коммитит изменения через `store.commit('SET_USER', user)`.

### Проблема 2: Непредсказуемые изменения state

Если каждый компонент может напрямую менять общее состояние, отследить, «кто и когда изменил X», становится невозможно. Vuex вводит контракт: **state изменяется только через mutations**, mutations — синхронные функции с явным именем и payload.

```js
// ✅ Все изменения проходят через mutations — их видно в DevTools
store.commit('cart/ADD_ITEM', { id: 1, name: 'Book' })
store.commit('auth/SET_USER', user)
```

В DevTools каждая mutation отображается как событие с payload, и можно откатить состояние к любой точке (time travel).

### Проблема 3: Смешение синхронного и асинхронного кода

Вписав `await` внутрь функции, изменяющей state, легко потерять контроль над порядком обновлений. Vuex разделяет ответственность:

- **Actions** — принимают контекст (`commit`, `dispatch`, `state`, `getters`), выполняют асинхронную работу, диспатчат mutations.
- **Mutations** — синхронные и «чистые» изменения state.

```js
// actions отвечают за побочные эффекты
async fetchUser({ commit }, id) {
  commit('SET_LOADING', true)
  try {
    const user = await api.get(`/users/${id}`)
    commit('SET_USER', user.data)
  } finally {
    commit('SET_LOADING', false)
  }
}
```

Такое разделение делает mutations легко тестируемыми (они синхронные и без побочных эффектов), а actions — заменяемыми (их можно мокать).

### Проблема 4: Отладка большого стейта

Vuex Devtools отображает:
- Дерево state в реальном времени.
- Список mutations с payload и меткой времени.
- Time travel — переход к любому предыдущему состоянию.
- Экспорт/импорт снимка стора для баг-репортов.

---

## Ключевые понятия

### state

`state` — единый объект состояния приложения. В Vuex 4 задаётся функцией для корректной работы SSR:

```js
state: () => ({
  user: null,
  cart: { items: [] },
  ui: { sidebarOpen: false },
})
```

Доступ из компонента:

```vue
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const user = computed(() => store.state.user)
</script>
```

### mutations

Mutations — единственный легальный способ изменить state. Обязательно синхронные. Имя по конвенции — SCREAMING_SNAKE_CASE, чтобы визуально отличать от обычных методов.

```js
mutations: {
  SET_USER(state, user) {
    state.user = user
  },
  ADD_ITEM(state, item) {
    state.cart.items.push(item)
  },
  REMOVE_ITEM(state, itemId) {
    state.cart.items = state.cart.items.filter((i) => i.id !== itemId)
  },
}
```

Вызов из компонента:

```js
store.commit('SET_USER', user)
store.commit('ADD_ITEM', { id: 1, name: 'Book' })
```

**Почему mutations обязаны быть синхронными:** Vuex DevTools сопоставляет каждый snapshot состояния с mutation, которая его вызвала. Если внутри mutation оказалась асинхронщина, DevTools не сможет однозначно связать событие и изменение state — время между `commit` и реальным обновлением станет неопределённым.

### getters

Getters — вычисляемые свойства стора. Кэшируются Vue и пересчитываются только при изменении зависимостей — так же, как `computed` в компонентах.

```js
getters: {
  totalItems: (state) => state.cart.items.length,

  totalPrice: (state) => state.cart.items.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  ),

  // Геттер, использующий другой геттер
  cartSummary: (state, getters) =>
    `${getters.totalItems} items — $${getters.totalPrice}`,

  // Геттер с аргументом (возвращает функцию)
  getItemById: (state) => (id) =>
    state.cart.items.find((i) => i.id === id),
}
```

Доступ:

```js
store.getters.totalItems
store.getters.getItemById(5)
```

### actions

Actions — методы для асинхронных операций и любых сценариев, где нужно скоординировать несколько mutations. Первый аргумент — контекст (`{ commit, dispatch, state, getters, rootState, rootGetters }`), второй — payload.

```js
actions: {
  async fetchUser({ commit }, id) {
    commit('SET_LOADING', true)
    try {
      const { data } = await api.get(`/users/${id}`)
      commit('SET_USER', data)
    } catch (err) {
      commit('SET_ERROR', err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Action, вызывающий другой action
  async loginAndFetchProfile({ dispatch }, credentials) {
    const user = await dispatch('login', credentials)
    await dispatch('fetchProfile', user.id)
  },
}
```

Вызов:

```js
await store.dispatch('fetchUser', 1)
```

`dispatch` возвращает то, что вернул action (обычно Promise) — это позволяет цеплять `await`.

### helpers: mapState, mapGetters, mapMutations, mapActions

Утилиты для Options API, которые «раскрывают» части стора в компонент:

```js
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState(['user', 'loading']),
    ...mapState({ isAdminUser: (state) => state.user?.role === 'admin' }),
    ...mapGetters(['totalItems', 'totalPrice']),
  },
  methods: {
    ...mapMutations(['ADD_ITEM', 'REMOVE_ITEM']),
    ...mapActions(['fetchUser', 'login']),
  },
}
```

В Composition API (`<script setup>`) map-хелперы не нужны — используется `useStore()` и `computed`.

---

## Базовое использование

### Установка

Vuex 4 (для Vue 3):

```bash
npm install vuex@4
```

Vuex 3 (для Vue 2):

```bash
npm install vuex@3
```

### Создание стора

```js
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: () => ({
    count: 0,
    user: null,
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
    isAuthenticated: (state) => !!state.user,
  },

  mutations: {
    INCREMENT(state) { state.count++ },
    DECREMENT(state) { state.count-- },
    SET_USER(state, user) { state.user = user },
  },

  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_USER', data.user)
      return data.user
    },

    logout({ commit }) {
      commit('SET_USER', null)
    },
  },
})
```

### Подключение к приложению

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

### Использование в компоненте (Composition API)

```vue
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const count = computed(() => store.state.count)
const doubleCount = computed(() => store.getters.doubleCount)

function increment() { store.commit('INCREMENT') }
async function login() {
  await store.dispatch('login', { email: 'a@b.com', password: '...' })
}
</script>

<template>
  <div>
    <p>Count: {{ count }}, Doubled: {{ doubleCount }}</p>
    <button @click="increment">+</button>
    <button @click="login">Login</button>
  </div>
</template>
```

### Использование вне компонентов

Стор можно импортировать напрямую как объект — он уже создан на уровне модуля:

```js
// services/api.js
import store from '@/store'

export function setupInterceptors(axios) {
  axios.interceptors.request.use((config) => {
    const token = store.state.auth.token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  axios.interceptors.response.use(null, (error) => {
    if (error.response?.status === 401) {
      store.dispatch('auth/logout')
    }
    return Promise.reject(error)
  })
}
```

---

## Модули

Vuex поощряет декомпозицию большого стора на **модули** — каждый модуль имеет свой state, mutations, getters и actions.

### Регистрация модулей

```js
// store/modules/auth.js
export default {
  namespaced: true,
  state: () => ({ user: null, token: null }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  mutations: {
    SET_USER(state, user) { state.user = user },
    SET_TOKEN(state, token) { state.token = token },
  },
  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_USER', data.user)
      commit('SET_TOKEN', data.token)
    },
  },
}

// store/modules/cart.js
export default {
  namespaced: true,
  state: () => ({ items: [] }),
  getters: {
    total: (state) => state.items.reduce((s, i) => s + i.price, 0),
  },
  mutations: {
    ADD_ITEM(state, item) { state.items.push(item) },
    CLEAR(state) { state.items = [] },
  },
  actions: {
    checkout({ state, commit, rootGetters }) {
      const user = rootGetters['auth/isAuthenticated']
      if (!user) throw new Error('Not authenticated')
      return api.post('/checkout', { items: state.items })
        .then(() => commit('CLEAR'))
    },
  },
}

// store/index.js
import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'

export default createStore({
  modules: { auth, cart },
})
```

### namespaced: true

Ключевое отличие модулей — параметр `namespaced`. Без него все getters, mutations и actions регистрируются в глобальном пространстве имён и легко конфликтуют. С `namespaced: true` они изолируются под префиксом:

```js
// Без namespaced (не рекомендуется):
store.commit('SET_USER', user)          // Из auth
store.getters.isAuthenticated
store.dispatch('login', credentials)

// С namespaced: true (рекомендуется):
store.commit('auth/SET_USER', user)
store.getters['auth/isAuthenticated']
store.dispatch('auth/login', credentials)
```

### Доступ к rootState и rootGetters

Внутри namespaced-модуля `state` и `getters` — локальные. Чтобы дотянуться до других модулей, используются `rootState` и `rootGetters`:

```js
// modules/cart.js
actions: {
  async checkout({ state, commit, rootState, rootGetters, dispatch }) {
    // Прямой доступ к state другого модуля
    const userId = rootState.auth.user?.id

    // Геттер другого модуля через строковый ключ
    const isAdmin = rootGetters['auth/isAdmin']

    // Диспатч action другого модуля — нужен { root: true }
    await dispatch('notifications/add', 'Order placed', { root: true })
  },
}
```

### mapHelpers с namespace

Первым аргументом передаётся namespace:

```js
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('auth', ['user', 'token']),
  },
  methods: {
    ...mapActions('auth', ['login', 'logout']),
  },
}
```

### Динамическая регистрация модулей

Модули можно регистрировать и удалять во время работы приложения — полезно для code splitting:

```js
// При загрузке фичи регистрируем её модуль
store.registerModule('feature', featureModule)

// После выхода с фичи — удаляем, освобождая память
store.unregisterModule('feature')
```

---

## Сценарии применения

### 1. Аутентификация

```js
// store/modules/auth.js
export default {
  namespaced: true,

  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    fullName: (state) =>
      state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
  },

  mutations: {
    SET_USER(state, user) { state.user = user },
    SET_TOKEN(state, token) {
      state.token = token
      if (token) localStorage.setItem('token', token)
      else localStorage.removeItem('token')
    },
  },

  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_USER', data.user)
      commit('SET_TOKEN', data.token)
    },

    logout({ commit }) {
      commit('SET_USER', null)
      commit('SET_TOKEN', null)
    },

    async fetchCurrentUser({ commit, state, dispatch }) {
      if (!state.token) return
      try {
        const { data } = await api.get('/auth/me')
        commit('SET_USER', data)
      } catch {
        dispatch('logout')
      }
    },
  },
}
```

### 2. Корзина (E-commerce)

```js
// store/modules/cart.js
export default {
  namespaced: true,

  state: () => ({ items: [] }),

  getters: {
    totalItems: (state) => state.items.reduce((s, i) => s + i.quantity, 0),
    totalPrice: (state) => state.items.reduce((s, i) => s + i.price * i.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  mutations: {
    ADD_ITEM(state, product) {
      const existing = state.items.find((i) => i.id === product.id)
      if (existing) existing.quantity++
      else state.items.push({ ...product, quantity: 1 })
    },
    REMOVE_ITEM(state, id) {
      state.items = state.items.filter((i) => i.id !== id)
    },
    UPDATE_QUANTITY(state, { id, quantity }) {
      const item = state.items.find((i) => i.id === id)
      if (item) item.quantity = quantity
    },
    CLEAR(state) { state.items = [] },
  },

  actions: {
    async checkout({ state, commit, rootGetters }) {
      if (!rootGetters['auth/isAuthenticated']) throw new Error('Login required')
      await api.post('/checkout', { items: state.items })
      commit('CLEAR')
    },
  },
}
```

### 3. Глобальное UI-состояние

```js
// store/modules/ui.js
export default {
  namespaced: true,

  state: () => ({
    theme: 'light',
    sidebarOpen: false,
    modals: { login: false, settings: false },
    notifications: [],
  }),

  mutations: {
    SET_THEME(state, theme) {
      state.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
    },
    TOGGLE_SIDEBAR(state) { state.sidebarOpen = !state.sidebarOpen },
    OPEN_MODAL(state, name) { state.modals[name] = true },
    CLOSE_MODAL(state, name) { state.modals[name] = false },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push({ ...notification, id: Date.now() })
    },
    REMOVE_NOTIFICATION(state, id) {
      state.notifications = state.notifications.filter((n) => n.id !== id)
    },
  },

  actions: {
    notify({ commit }, { message, type = 'info', timeout = 3000 }) {
      const id = Date.now()
      commit('ADD_NOTIFICATION', { id, message, type })
      setTimeout(() => commit('REMOVE_NOTIFICATION', id), timeout)
    },
  },
}
```

### 4. Работа с формами и валидацией

```js
// store/modules/form.js
export default {
  namespaced: true,

  state: () => ({
    fields: { email: '', password: '' },
    errors: {},
    submitting: false,
  }),

  mutations: {
    SET_FIELD(state, { field, value }) {
      state.fields[field] = value
    },
    SET_ERRORS(state, errors) { state.errors = errors },
    SET_SUBMITTING(state, value) { state.submitting = value },
    RESET(state) {
      state.fields = { email: '', password: '' }
      state.errors = {}
    },
  },

  actions: {
    async submit({ state, commit }) {
      commit('SET_ERRORS', {})
      commit('SET_SUBMITTING', true)
      try {
        await api.post('/register', state.fields)
        commit('RESET')
      } catch (err) {
        commit('SET_ERRORS', err.response?.data?.errors || {})
      } finally {
        commit('SET_SUBMITTING', false)
      }
    },
  },
}
```

---

## Продвинутые возможности

### Строгий режим

`strict: true` заставляет Vuex выбрасывать ошибку при любой мутации state вне mutations. Это отладочная опция — она заметно замедляет приложение, поэтому включается только в development:

```js
export default createStore({
  strict: process.env.NODE_ENV !== 'production',
  state: () => ({ ... }),
})
```

### Плагины

Плагин Vuex — функция, получающая инстанс стора и подписывающаяся на события через `store.subscribe` и `store.subscribeAction`:

```js
// plugins/logger.js
export function loggerPlugin(store) {
  store.subscribe((mutation, state) => {
    console.log(`[${mutation.type}]`, mutation.payload)
  })

  store.subscribeAction({
    before: (action) => console.log(`Action started: ${action.type}`),
    after: (action) => console.log(`Action finished: ${action.type}`),
    error: (action, error) => console.error(`Action failed: ${action.type}`, error),
  })
}

// store/index.js
export default createStore({
  plugins: [loggerPlugin],
  // ...
})
```

**Плагин персистентности (`vuex-persistedstate`):**

```bash
npm install vuex-persistedstate
```

```js
import createPersistedState from 'vuex-persistedstate'

export default createStore({
  plugins: [
    createPersistedState({
      paths: ['auth.token', 'cart.items'], // Сохранять только эти пути
      storage: window.localStorage,
    }),
  ],
  // ...
})
```

### Подписки

```js
// Ручная подписка на mutations
const unsubscribe = store.subscribe((mutation, state) => {
  if (mutation.type === 'cart/ADD_ITEM') {
    localStorage.setItem('cart', JSON.stringify(state.cart.items))
  }
})

// Отписка
unsubscribe()
```

### Watch

Vuex поддерживает `store.watch` для отслеживания вычисляемых значений:

```js
const unwatch = store.watch(
  (state, getters) => getters['cart/totalItems'],
  (newValue, oldValue) => {
    console.log(`Cart items: ${oldValue} → ${newValue}`)
  }
)
```

### Hot Module Replacement для модулей

```js
if (module.hot) {
  module.hot.accept(['./modules/auth', './modules/cart'], () => {
    store.hotUpdate({
      modules: {
        auth: require('./modules/auth').default,
        cart: require('./modules/cart').default,
      },
    })
  })
}
```

### TypeScript

Vuex имеет ограниченную поддержку TypeScript — типы приходится описывать вручную для каждого `commit` и `dispatch`. Официальный способ — расширить типы через модуль-аугментацию:

```ts
// store/types.ts
import { Store } from 'vuex'

export interface RootState {
  auth: AuthState
  cart: CartState
}

export interface AuthState {
  user: User | null
  token: string | null
}

// Расширяем типы Vue
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}
```

```ts
// В компоненте типы всё равно теряются на commit/dispatch:
store.commit('auth/SET_USER', user) // string-ключ без проверок
```

Это одна из ключевых причин появления Pinia — там типы выводятся автоматически.

---

## Vuex 3 vs Vuex 4

Vuex 4 — почти идентичен Vuex 3 по API, но адаптирован под Vue 3.

| Аспект | Vuex 3 (Vue 2) | Vuex 4 (Vue 3) |
|---|---|---|
| **Создание стора** | `new Vuex.Store({...})` | `createStore({...})` |
| **Подключение** | `new Vue({ store })` | `app.use(store)` |
| **Composition API** | Нет (без `@vue/composition-api`) | `useStore()` |
| **TypeScript** | Слабый вывод | Улучшен, но всё ещё требует ручной аннотации |
| **Реактивность** | Vue 2 reactivity (Object.defineProperty) | Vue 3 Proxy |
| **SSR-совместимость state** | Функция обязательна | Функция обязательна |

Пример Vuex 3:

```js
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export default new Vuex.Store({
  state: { count: 0 },
  mutations: {
    INCREMENT(state) { state.count++ },
  },
})

// main.js
new Vue({ store, render: (h) => h(App) }).$mount('#app')
```

Пример Vuex 4:

```js
import { createStore } from 'vuex'

export default createStore({
  state: () => ({ count: 0 }),
  mutations: {
    INCREMENT(state) { state.count++ },
  },
})

// main.js
const app = createApp(App)
app.use(store)
app.mount('#app')
```

Миграция с Vuex 3 на Vuex 4 в 90% случаев ограничивается заменой конструктора и обёртывания state в функцию.

---

## Миграция на Pinia

Официально команда Vue рекомендует мигрировать с Vuex на [Pinia](./pinia.md) во всех новых проектах. Ниже — пошаговая схема переноса.

### Шаг 1: Заменить структуру модуля на defineStore

**Vuex-модуль:**

```js
// store/modules/auth.js
export default {
  namespaced: true,

  state: () => ({ user: null, token: null }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  mutations: {
    SET_USER(state, user) { state.user = user },
    SET_TOKEN(state, token) { state.token = token },
  },

  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_USER', data.user)
      commit('SET_TOKEN', data.token)
    },
    logout({ commit }) {
      commit('SET_USER', null)
      commit('SET_TOKEN', null)
    },
  },
}
```

**Pinia-стор:**

```js
// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, token: null }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials) {
      const { data } = await api.post('/auth/login', credentials)
      this.user = data.user
      this.token = data.token
    },
    logout() {
      this.user = null
      this.token = null
    },
  },
})
```

### Шаг 2: Убрать mutations

Каждая mutation превращается либо в прямую мутацию внутри action, либо в отдельный action:

```js
// ❌ Vuex
mutations: { SET_USER(state, user) { state.user = user } }
actions: {
  async login({ commit }, creds) {
    const user = await api.post('/auth/login', creds)
    commit('SET_USER', user.data)
  }
}

// ✅ Pinia
actions: {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    this.user = data // Прямая мутация — Vue Proxy отследит
  }
}
```

### Шаг 3: Заменить вызовы в компонентах

| Vuex | Pinia |
|---|---|
| `store.state.auth.user` | `authStore.user` |
| `store.getters['auth/isAdmin']` | `authStore.isAdmin` |
| `store.commit('auth/SET_USER', user)` | `authStore.user = user` |
| `store.dispatch('auth/login', creds)` | `authStore.login(creds)` |
| `mapState('auth', ['user'])` | `storeToRefs(authStore)` |
| `mapActions('auth', ['login'])` | `const { login } = authStore` |

**Пример компонента до миграции:**

```vue
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const user = computed(() => store.state.auth.user)
const isAdmin = computed(() => store.getters['auth/isAdmin'])

async function login(credentials) {
  await store.dispatch('auth/login', credentials)
}

function logout() {
  store.dispatch('auth/logout')
}
</script>
```

**После миграции:**

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { user, isAdmin } = storeToRefs(authStore)
const { login, logout } = authStore
</script>
```

### Шаг 4: Обработать взаимодействие между сторами

Vuex: `rootGetters['auth/isAdmin']` и `dispatch('notif/add', payload, { root: true })`.

Pinia: просто импортировать другой стор и вызвать.

```js
// stores/cart.js
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    async checkout() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) throw new Error('Not authenticated')
      await api.post('/checkout', { items: this.items, userId: authStore.user.id })
      this.items = []
    },
  },
})
```

### Шаг 5: Постепенная миграция

Vuex и Pinia могут сосуществовать в одном приложении — оба подключаются через `app.use()`. Стратегия:

1. Добавить Pinia в проект (`app.use(createPinia())`), не удаляя Vuex.
2. Переносить модули по одному — начать с самых изолированных (settings, ui).
3. Для каждого перенесённого модуля обновить компоненты.
4. Удалить Vuex после миграции последнего модуля.

### Шаблон соответствия

| Vuex | Pinia |
|---|---|
| `createStore({ modules })` | Несколько `defineStore()` |
| `namespaced: true` | Автоматически (по id стора) |
| `state: () => ({...})` | `state: () => ({...})` |
| `getters: { x: state => ... }` | `getters: { x: state => ... }` |
| `mutations: { SET_X(state, val) }` | Прямая мутация в action |
| `actions: { fn({ commit }, p) }` | `actions: { fn(p) { this.x = p } }` |
| `commit('mod/MUT', p)` | `store.x = p` |
| `dispatch('mod/act', p)` | `store.act(p)` |
| `mapState`, `mapGetters` | `storeToRefs(store)` |
| `mapActions` | Прямая деструктуризация |
| `rootGetters['other/x']` | `useOtherStore().x` |
| `store.watch` | `store.$subscribe` |
| `store.subscribe` | `store.$subscribe` |
| `store.subscribeAction` | `store.$onAction` |

---

## Лучшие практики

### 1. Всегда используйте namespaced в модулях

```js
// ✅ Изоляция и явные пути
{ namespaced: true, state, mutations, actions }
```

Без namespaced конфликтуют имена, а вызовы вроде `commit('SET_USER')` становятся неоднозначными.

### 2. Именуйте mutations в UPPER_SNAKE_CASE

Это конвенция, отличающая mutations от обычных функций и помогающая читать логи DevTools.

```js
// ✅ Хорошо
mutations: {
  SET_USER(state, user) { ... },
  ADD_TO_CART(state, item) { ... },
}
```

### 3. Держите mutations простыми и синхронными

Одна mutation = одно понятное изменение. Не смешивайте несколько несвязанных обновлений и никогда не используйте `await`.

```js
// ❌ Плохо
mutations: {
  UPDATE_ALL(state, payload) {
    state.user = payload.user
    state.cart = payload.cart
    state.settings = payload.settings // Три несвязанных изменения
  }
}

// ✅ Хорошо — раздельные mutations, action их координирует
actions: {
  hydrateApp({ commit }, data) {
    commit('auth/SET_USER', data.user, { root: true })
    commit('cart/SET_ITEMS', data.cart, { root: true })
    commit('settings/SET_ALL', data.settings, { root: true })
  }
}
```

### 4. Выносите бизнес-логику в actions

Компонент должен вызывать один action, а не оркестрировать несколько mutations.

```js
// ❌ Плохо: компонент знает внутреннюю структуру
store.commit('SET_LOADING', true)
try {
  const user = await api.get('/user')
  store.commit('SET_USER', user)
} finally {
  store.commit('SET_LOADING', false)
}

// ✅ Хорошо: action инкапсулирует логику
await store.dispatch('fetchUser')
```

### 5. Используйте getters для производных данных

Не дублируйте вычисления в компонентах — вынесите их в getters, они кэшируются.

```js
// ✅ Один источник правды
getters: {
  totalPrice: (state) =>
    state.items.reduce((s, i) => s + i.price * i.quantity, 0)
}
```

### 6. Включайте strict mode в разработке

```js
strict: process.env.NODE_ENV !== 'production'
```

Это ловит случайные прямые мутации state.

### 7. Тестируйте mutations, getters и actions изолированно

```js
// tests/auth.test.js
import authModule from '@/store/modules/auth'

describe('auth mutations', () => {
  it('SET_USER assigns user', () => {
    const state = { user: null }
    authModule.mutations.SET_USER(state, { id: 1, name: 'Alice' })
    expect(state.user).toEqual({ id: 1, name: 'Alice' })
  })
})

describe('auth getters', () => {
  it('isAuthenticated returns true when user exists', () => {
    const state = { user: { id: 1 } }
    expect(authModule.getters.isAuthenticated(state)).toBe(true)
  })
})

describe('auth actions', () => {
  it('login commits SET_USER on success', async () => {
    const commit = jest.fn()
    api.post = jest.fn().mockResolvedValue({ data: { user: { id: 1 }, token: 'x' } })

    await authModule.actions.login({ commit }, { email: 'a@b.com' })

    expect(commit).toHaveBeenCalledWith('SET_USER', { id: 1 })
    expect(commit).toHaveBeenCalledWith('SET_TOKEN', 'x')
  })
})
```

---

## Антипаттерны

### 1. Асинхронный код в mutations

```js
// ❌ Плохо: mutation обязана быть синхронной
mutations: {
  async FETCH_USER(state, id) {
    state.user = await api.get(`/users/${id}`) // ломает DevTools
  }
}

// ✅ Хорошо: асинхронность — в action
actions: {
  async fetchUser({ commit }, id) {
    const user = await api.get(`/users/${id}`)
    commit('SET_USER', user.data)
  }
}
```

### 2. Мутация state вне mutations

```vue
<script setup>
const store = useStore()

// ❌ Плохо: в strict mode упадёт с ошибкой
store.state.user.name = 'Alice'

// ✅ Хорошо: через mutation
store.commit('SET_USER_NAME', 'Alice')
</script>
```

### 3. Модули без namespaced

```js
// ❌ Плохо: mutations разных модулей могут конфликтовать по имени
const auth = { mutations: { SET(state, x) { state.user = x } } }
const cart = { mutations: { SET(state, x) { state.items = x } } }
// commit('SET', x) вызовет обе

// ✅ Хорошо: namespaced изолирует
const auth = { namespaced: true, mutations: { SET(...) {...} } }
```

### 4. Хранение серверного кэша в Vuex

```js
// ❌ Плохо: ручная реализация кэширования, инвалидации, повторных попыток
const products = {
  state: () => ({ items: [], loading: false, error: null }),
  actions: {
    async fetch({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ITEMS', await api.get('/products'))
      commit('SET_LOADING', false)
    }
  }
}

// ✅ Хорошо: используйте TanStack Query / VueQuery для серверного состояния
import { useQuery } from '@tanstack/vue-query'

useQuery({
  queryKey: ['products'],
  queryFn: () => api.get('/products').then((r) => r.data),
})
```

### 5. Огромный монолитный стор

```js
// ❌ Плохо: всё в одном месте, тесты и рефакторинг превращаются в кошмар
createStore({
  state: () => ({
    user: null, cart: [], products: [], orders: [],
    theme: 'light', notifications: [], ...
  }),
})

// ✅ Хорошо: разделение по доменам через модули
createStore({
  modules: { auth, cart, products, orders, ui, notifications },
})
```

### 6. Обход dispatch через прямой вызов action

```js
// ❌ Плохо: обход системы событий, ломает DevTools и middleware
authModule.actions.login({ commit }, credentials)

// ✅ Хорошо: только через dispatch
store.dispatch('auth/login', credentials)
```

### 7. Регистрация одного модуля дважды

Vuex 4 запретил регистрацию одноимённых модулей — раньше это молча приводило к неопределённому поведению.

```js
// ❌ Плохо: конфликт имён при динамической регистрации
store.registerModule('auth', authModule)
store.registerModule('auth', anotherAuthModule) // Ошибка в Vuex 4
```

---

## Шпаргалка: Vuex ↔ Pinia

| Концепт | Vuex | Pinia |
|---|---|---|
| **Создание стора** | `createStore({ modules })` | Несколько `defineStore()` |
| **Идентификация** | Ключ модуля в `modules` | Первый аргумент `defineStore('id', ...)` |
| **Изоляция** | `namespaced: true` | Автоматически по id |
| **State** | `state: () => ({...})` | `state: () => ({...})` |
| **Getters** | `getters: { x: state => ... }` | `getters: { x: state => ... }` |
| **Изменение state** | `mutations` + `commit('MUT')` | Прямая мутация в action |
| **Асинхронные действия** | `actions: { fn({ commit }, p) }` | `actions: { async fn(p) { this.x = ... } }` |
| **Чтение из компонента** | `store.state.mod.field` | `store.field` |
| **Вызов действия** | `store.dispatch('mod/act', p)` | `store.act(p)` |
| **Деструктуризация** | `mapState`, `mapGetters` | `storeToRefs(store)` |
| **Взаимодействие сторов** | `rootGetters`, `dispatch(..., { root: true })` | Импорт и вызов другого стора |
| **Плагины** | `plugins: [...]` в `createStore` | `pinia.use(plugin)` |
| **DevTools** | Vuex Devtools | Vue DevTools (встроено) |
| **TypeScript** | Ручные типы, слабый вывод | Автовывод из state |
| **Персистентность** | `vuex-persistedstate` | `pinia-plugin-persistedstate` |
| **Размер** | ~10 KB | ~2 KB |
| **Статус** | Legacy / maintenance | Официальный (Vue 3) |

> 🎯 **Главный вывод:** Vuex решил задачу централизованного состояния для Vue, но платил за это бойлерплейтом — двойным слоем mutations/actions, строковыми ключами и слабой типизацией. Pinia сохранила философию Vuex (state / getters / actions), убрала лишний слой mutations и получила автоматический вывод типов TypeScript. Понимать Vuex по-прежнему необходимо для работы с легаси-проектами и грамотной миграции.

---

## Ключевые тезисы для интервью

- Vuex построен на архитектуре Flux: state изменяется только через mutations, mutations вызываются только через commit, асинхронщина живёт в actions.
- Mutations обязаны быть синхронными — иначе DevTools не сможет корректно сопоставить событие и snapshot состояния.
- Getters — вычисляемые свойства стора, кэшируются реактивной системой Vue и пересчитываются только при изменении зависимостей.
- Actions принимают контекст (`{ commit, dispatch, state, getters, rootState, rootGetters }`) и могут возвращать Promise — это позволяет цеплять `await store.dispatch(...)`.
- Модули с `namespaced: true` изолируют своё пространство имён — обращение идёт через `commit('mod/MUT')`, `dispatch('mod/act')`, `getters['mod/x']`.
- `rootState` и `rootGetters` дают доступ к другим модулям изнутри namespaced-модуля; `dispatch(..., { root: true })` вызывает action другого модуля.
- Строгий режим (`strict: true`) выбрасывает ошибку при мутациях state вне mutations — обязателен в dev, отключается в production ради производительности.
- Vuex 4 адаптирован под Vue 3: `createStore()` вместо `new Vuex.Store()`, `useStore()` в Composition API, реактивность через Proxy.
- TypeScript в Vuex работает слабо: `commit` и `dispatch` принимают строковые ключи без строгой типизации — одна из главных причин появления Pinia.
- Официальный путь миграции: Vuex → Pinia. Оба стейт-менеджера могут сосуществовать, что позволяет переносить модули постепенно.

## Заключение

Vuex сыграл ключевую роль в истории Vue-экосистемы: он привнёс предсказуемый Flux-поток данных, единый глобальный стор и глубокую интеграцию с DevTools. Строгое разделение синхронных mutations и асинхронных actions делает поток изменений прозрачным и отладку простой, а модули с namespaced позволяют масштабировать стор на большие приложения.

Одновременно Vuex платит за строгость бойлерплейтом: каждое изменение требует mutation + action, строковые ключи `commit` и `dispatch` слабо поддерживаются TypeScript, а модули с их синтаксисом `rootGetters` и `{ root: true }` быстро становятся неудобными. Именно эти боли решает [Pinia](./pinia.md), заменившая Vuex как официальный стейт-менеджер Vue 3.

**Когда всё ещё оправдан Vuex:**
- Большой легаси-проект на Vue 2 с Vuex 3, где миграция обойдётся дороже поддержки.
- Vue 3 приложение уже на Vuex 4 без критичной потребности мигрировать.
- Команда ценит явное разделение mutations/actions и готова платить за это бойлерплейтом.

**Когда мигрировать на Pinia:**
- Новый проект — Pinia безусловный дефолт.
- Существующий проект активно развивается, TypeScript-типизация и DX критичны.
- Команде надоел бойлерплейт mutations/commit и слабый вывод типов.

**Рекомендация:** для нового кода — Pinia; для легаси на Vuex — плановая миграция модуль за модулем, начиная с самых изолированных (settings, ui, notifications). Vuex и Pinia спокойно сосуществуют в одном приложении, поэтому переход не обязан быть big-bang-релизом.
