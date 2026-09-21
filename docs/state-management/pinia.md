---
title: "Pinia: управление состоянием без Vuex-бойлерплейта"
section: state-management
description: "Pinia — официальная библиотека состояния для Vue 3. defineStore, реактивные геттеры, прямые мутации и плагины вместо Vuex mutations/actions/commit."
order: 4
tags: ["pinia", "state-management", "defineStore", "vuex", "vue"]
questions:
  - "Чем Pinia отличается от Vuex по структуре стора?"
  - "Зачем нужен storeToRefs и когда без него можно обойтись?"
  - "Как плагин Pinia отличается от middleware Zustand?"
  - "Как получить доступ к стору Pinia вне компонента?"
  - "Почему в Pinia можно мутировать состояние напрямую, а в Zustand нельзя?"
  - "Как настроить персистентность через pinia-plugin-persistedstate?"
  - "Когда использовать Options API-стор, а когда Setup API-стор?"
  - "Как работают геттеры в Pinia?"
  - "Как тестировать сторы Pinia изолированно?"
---

# Pinia: управление состоянием без Vuex-бойлерплейта

Vuex был официальным стейт-менеджером Vue долгие годы, но требовал разделения логики на mutations (синхронные) и actions (асинхронные) — лишнюю прослойку, которая усложняла код. Pinia убрала эту прослойку: есть state, getters и actions, причём actions могут быть как синхронными, так и асинхронными. Библиотека официально заменила Vuex для Vue 3, поддерживает Vue DevTools из коробки и весит около 2 КБ. В статье разобраны ключевые концепции, паттерны применения и миграция с Vuex.

## Содержание

1. [Что такое Pinia](#что-такое-pinia)
2. [Какую проблему решает Pinia](#какую-проблему-решает-pinia)
3. [Ключевые понятия](#ключевые-понятия)
4. [Базовое использование](#базовое-использование)
5. [Сценарии применения](#сценарии-применения)
6. [Продвинутые возможности](#продвинутые-возможности)
7. [Pinia vs Zustand](#pinia-vs-zustand)
8. [Миграция с Vuex](#миграция-с-vuex)
9. [Лучшие практики](#лучшие-практики)
10. [Антипаттерны](#антипаттерны)
11. [Шпаргалка: Pinia ↔ Zustand](#шпаргалка-pinia--zustand)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)

---

## Что такое Pinia

Pinia — это **официальная библиотека управления состоянием для Vue 3**, заменившая Vuex. Название происходит от испанского «piña» — ананас (отсылка к внутреннему кодовому названию Vuex 5).

```js
import { defineStore } from 'pinia'

const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})
```

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from './stores/counter'

const store = useCounterStore()
const { count, doubled } = storeToRefs(store)
</script>

<template>
  <button @click="store.increment">Count: {{ count }}, Doubled: {{ doubled }}</button>
</template>
```

Ключевые особенности Pinia:
- **Нет mutations** — actions могут быть синхронными и асинхронными.
- **Прямые мутации** — `store.count++` или `store.$patch({ count: 1 })` без `commit`.
- **Vue DevTools** — полная интеграция: просмотр состояния, time travel, hot reload.
- **TypeScript** — типы выводятся автоматически из `state()`.
- **Два стиля** — Options API и Setup API (Composition).
- **Плагины** — глобальное расширение всех сторов.
- **Размер** — ~2 KB (minified + gzipped).

> 💡 **Zustand:** Философски Pinia — это «Zustand для Vue». Обе появились как ответ на избыточный бойлерплейт «официальных» решений (Redux/Vuex). Ключевое архитектурное различие: Zustand использует плоский объект с `create`, а Pinia явно разделяет state/getters/actions. Подробное сравнение — в разделе [Pinia vs Zustand](#pinia-vs-zustand).

---

## Какую проблему решает Pinia

### Проблема 1: Мутации как лишняя прослойка в Vuex

В Vuex мутации — единственный легальный способ изменить состояние. Для асинхронных операций требовались actions, которые вызывали mutations через `commit`. Это создавало двойной бойлерплейт:

```js
// ❌ Vuex: синхронные изменения через mutations + dispatch через actions
const store = createStore({
  state: () => ({ count: 0, user: null }),

  mutations: {
    INCREMENT(state) { state.count++ },
    SET_USER(state, user) { state.user = user },
  },

  actions: {
    increment({ commit }) {
      commit('INCREMENT')
    },
    async fetchUser({ commit }, id) {
      const user = await api.get(`/users/${id}`)
      commit('SET_USER', user.data)
    },
  },
})

// Component.vue
store.dispatch('increment')
store.dispatch('fetchUser', 1)
```

**Проблемы этого подхода:**
1. **Дублирование.** Для каждого изменения нужна mutation + action.
2. **Нет асинхронности в mutations.** Асинхронная логика обязана жить в actions.
3. **Строки вместо функций.** `commit('INCREMENT')` — строковые ключи без автодополнения.

**Pinia решает это:**

```js
// ✅ Pinia: одни actions для всего
const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, user: null }),

  actions: {
    increment() {
      this.count++ // Прямая мутация
    },
    async fetchUser(id) {
      this.user = await api.get(`/users/${id}`).then(r => r.data)
    },
  },
})

// Component.vue
const store = useCounterStore()
store.increment()
await store.fetchUser(1)
```

| Проблема | Решение Pinia |
|---|---|
| Mutation + action для каждого изменения | Один action для синхронного и асинхронного |
| Строковые commit-ключи | Прямые вызовы методов |
| Слабая типизация dispatch/commit | Полный автовывод TypeScript |
| Монолитный модульный стор | Несколько независимых сторов |

### Проблема 2: Типизация в Vuex

Vuex имеет слабую поддержку TypeScript — типы приходилось прописывать вручную для каждого `commit` и `dispatch`:

```ts
// ❌ Vuex + TypeScript: строковые ключи без типов
store.commit('SET_USER', user) // Нет проверки типа аргумента
store.dispatch('fetchUser', id) // Нет автодополнения
```

Pinia выводит типы автоматически:

```ts
// ✅ Pinia + TypeScript: автовывод типов
const store = useUserStore()
store.fetchUser(1)   // TS знает: аргумент — number
store.user           // TS знает: User | null
store.isAdmin        // TS знает: boolean
```

### Проблема 3: Один монолитный стор в Vuex

Vuex поощрял один глобальный стор с namespace-модулями — сложная вложенная структура:

```js
// ❌ Vuex: модули внутри одного стора
const store = createStore({
  modules: { auth: authModule, cart: cartModule, ui: uiModule },
})

store.dispatch('auth/login', credentials)
store.getters['cart/totalItems']
```

Pinia использует несколько независимых сторов:

```js
// ✅ Pinia: независимые сторы
const authStore = useAuthStore()
const cartStore = useCartStore()

authStore.login(credentials)
cartStore.totalItems // геттер
```

---

## Ключевые понятия

### defineStore

`defineStore` создаёт хранилище. Принимает уникальный строковый идентификатор и конфигурацию.

**Options API стиль (классический):**

```js
import { defineStore } from 'pinia'

const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  getters: {
    fullName: (state) => `${state.user?.firstName} ${state.user?.lastName}`,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials) {
      const { user, token } = await api.post('/auth/login', credentials)
      this.user = user
      this.token = token
      this.isAuthenticated = true
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
    },
  },
})
```

**Setup API стиль (Composition):**

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = ref(false)

  const fullName = computed(() =>
    `${user.value?.firstName} ${user.value?.lastName}`
  )
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(credentials) {
    const data = await api.post('/auth/login', credentials)
    user.value = data.user
    token.value = data.token
    isAuthenticated.value = true
  }

  function logout() {
    user.value = null
    token.value = null
    isAuthenticated.value = false
  }

  return { user, token, isAuthenticated, fullName, isAdmin, login, logout }
})
```

Когда что использовать:
- **Options API** — ближе к стилю Vuex-модулей, проще мигрировать с Vuex.
- **Setup API** — полная гибкость Composition API, можно использовать composables внутри стора.

> 💡 **Zustand:** В Zustand нет такого разделения API-стилей — единственный способ создать стор это `create(set, get)`. Pinia даёт выбор: Options API ближе к тому, как выглядит Vuex-модуль; Setup API — к тому, как пишутся Vue composables.

### state

`state` — функция, возвращающая начальное состояние стора. Функция нужна для корректной работы SSR: каждый запрос получает свой экземпляр состояния.

```js
state: () => ({
  items: [],
  loading: false,
  error: null,
  currentPage: 1,
})
```

### getters

Геттеры — вычисляемые свойства стора. Кэшируются Vue, пересчитываются только при изменении зависимостей.

```js
getters: {
  // Простой геттер
  totalItems: (state) => state.items.length,

  // Геттер, принимающий аргумент (через возврат функции)
  getItemById: (state) => {
    return (id) => state.items.find((item) => item.id === id)
  },

  // Геттер с доступом к другому стору
  cartWithDetails(state) {
    const productStore = useProductStore()
    return state.items.map((item) => ({
      ...item,
      product: productStore.getItemById(item.productId),
    }))
  },
}
```

> 💡 **Zustand:** В Zustand нет встроенных геттеров. Вычисляемые значения реализуются через селекторы при чтении или `useMemo` в компоненте. Pinia-геттеры — аналог `computed` в компонентах, только на уровне стора.

### actions

Actions — методы стора для изменения состояния и выполнения асинхронных операций. Внутри action `this` ссылается на сам стор.

```js
actions: {
  // Синхронное действие
  addItem(item) {
    this.items.push(item)
  },

  // Асинхронное действие
  async fetchItems() {
    this.loading = true
    this.error = null
    try {
      this.items = await api.get('/items').then(r => r.data)
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  },

  // Действие, использующее другой стор
  async checkout() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) throw new Error('Not authenticated')
    await api.post('/checkout', { items: this.items, userId: authStore.user.id })
    this.items = []
  },
}
```

### storeToRefs

`storeToRefs` — утилита для деструктуризации стора с сохранением реактивности.

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from './stores/cart'

const store = useCartStore()

// ❌ Без storeToRefs — count теряет реактивность
const { count } = store // count — просто число, не Ref, шаблон не обновится

// ✅ С storeToRefs — count остаётся реактивным Ref
const { count, items } = storeToRefs(store)

// Actions деструктурируются напрямую (они не реактивны по природе)
const { addItem, removeItem } = store
</script>
```

Почему это происходит: Vue отслеживает зависимости через `Proxy`. Деструктуризация «вытаскивает» примитивное значение из Proxy, разрывая реактивную связь. `storeToRefs` оборачивает каждое свойство в `ref`, восстанавливая её.

> 💡 **Zustand:** В React реактивность обеспечивается через подписки хука — деструктуризация не разрывает её. В Vue без `storeToRefs` это частая ошибка у новичков.

### $patch

`$patch` — способ обновить несколько полей состояния атомарно, не заходя в action.

```js
// Объект — обновляет перечисленные поля
store.$patch({ count: 5, name: 'Alice' })

// Функция — для сложных мутаций (массивы, вложенные объекты)
store.$patch((state) => {
  state.items.push({ id: 4, name: 'New Item' })
  state.loading = false
})
```

### $reset

`$reset` сбрасывает стор к начальному состоянию (только в Options API):

```js
store.$reset()
```

---

## Базовое использование

### Установка и настройка

```bash
npm install pinia
```

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### Создание стора

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter',
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
  },

  actions: {
    increment() { this.count++ },
    decrement() { this.count-- },
    reset() { this.$reset() },
  },
})
```

### Использование в компонентах

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
const { count, doubleCount } = storeToRefs(store)
</script>

<template>
  <div>
    <p>Count: {{ count }}, Double: {{ doubleCount }}</p>
    <button @click="store.increment">+</button>
    <button @click="store.decrement">-</button>
    <button @click="store.reset">Reset</button>
  </div>
</template>
```

### Доступ вне компонентов

В Pinia стор вызывается вне компонента так же, как и внутри — после инициализации pinia:

```js
// services/api.js
import { useAuthStore } from '@/stores/auth'

export function setupInterceptors(axios) {
  axios.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })
}
```

> 💡 **Zustand:** `useAuthStore.getState()` в Zustand ≈ `useAuthStore()` в Pinia. Pinia чуть удобнее — вызов стора вне компонентов выглядит идентично вызову внутри, без отдельного `.getState()`.

---

## Сценарии применения

### 1. Глобальное UI-состояние

```js
// stores/ui.js
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    modals: { login: false, settings: false, confirm: false },
    sidebarOpen: false,
    notifications: [],
  }),

  actions: {
    openModal(modal) { this.modals[modal] = true },
    closeModal(modal) { this.modals[modal] = false },
    toggleSidebar() { this.sidebarOpen = !this.sidebarOpen },
    addNotification(notification) {
      this.notifications.push({ ...notification, id: Date.now() })
    },
    removeNotification(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },
  },
})
```

```vue
<script setup>
import { useUIStore } from '@/stores/ui'
const ui = useUIStore()
</script>

<template>
  <header>
    <button @click="ui.toggleSidebar">
      {{ ui.sidebarOpen ? 'Close' : 'Open' }} Sidebar
    </button>
    <button @click="ui.openModal('login')">Login</button>
  </header>
</template>
```

### 2. Состояние корзины (E-commerce)

```js
// stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    addItem(product) {
      const existing = this.items.find((i) => i.id === product.id)
      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...product, quantity: 1 })
      }
    },

    removeItem(productId) {
      this.items = this.items.filter((i) => i.id !== productId)
    },

    updateQuantity(productId, quantity) {
      const item = this.items.find((i) => i.id === productId)
      if (item) item.quantity = quantity
    },

    clearCart() { this.items = [] },
  },
})
```

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const { items, totalItems, totalPrice } = storeToRefs(cartStore)
</script>

<template>
  <div>
    <p>{{ totalItems }} items — ${{ totalPrice }}</p>
    <div v-for="item in items" :key="item.id">
      <span>{{ item.name }} × {{ item.quantity }}</span>
      <button @click="cartStore.removeItem(item.id)">Remove</button>
    </div>
    <button @click="cartStore.clearCart" :disabled="cartStore.isEmpty">
      Clear Cart
    </button>
  </div>
</template>
```

### 3. Аутентификация

```js
// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    fullName: (state) =>
      state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
  },

  actions: {
    async login(credentials) {
      try {
        const { user, token } = await api.post('/auth/login', credentials)
        this.user = user
        this.token = token
        this.isAuthenticated = true
        localStorage.setItem('token', token)
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    },

    async fetchCurrentUser() {
      if (!this.token) return
      try {
        this.user = await api.get('/auth/me').then(r => r.data)
        this.isAuthenticated = true
      } catch {
        this.logout()
      }
    },
  },
})
```

### 4. Настройки и тема

```js
// stores/settings.js
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light',
    language: 'ru',
    fontSize: 16,
  }),

  actions: {
    setTheme(theme) {
      this.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
    },
    setLanguage(language) { this.language = language },
    resetSettings() { this.$reset() },
  },
})
```

```vue
<script setup>
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()
</script>

<template>
  <button @click="settings.setTheme(settings.theme === 'light' ? 'dark' : 'light')">
    Current: {{ settings.theme }}
  </button>
</template>
```

---

## Продвинутые возможности

### Setup API (Composition Style)

Setup-стор — это `defineStore` с функцией-фабрикой вместо объекта. Позволяет использовать composables и полную мощь Composition API:

```js
// stores/todos.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTodosStore = defineStore('todos', () => {
  const items = ref([])
  const loading = ref(false)
  const filter = ref('all')

  const filteredItems = computed(() => {
    if (filter.value === 'active') return items.value.filter((t) => !t.done)
    if (filter.value === 'done') return items.value.filter((t) => t.done)
    return items.value
  })

  const remaining = computed(() => items.value.filter((t) => !t.done).length)

  async function fetchTodos() {
    loading.value = true
    items.value = await api.get('/todos').then(r => r.data)
    loading.value = false
  }

  function toggleTodo(id) {
    const todo = items.value.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }

  function setFilter(newFilter) { filter.value = newFilter }

  return { items, loading, filter, filteredItems, remaining, fetchTodos, toggleTodo, setFilter }
})
```

### Плагины

Плагин Pinia — функция, расширяющая все сторы глобально через `pinia.use(...)`.

```js
// plugins/logger.js
export function loggerPlugin({ store }) {
  store.$onAction(({ name, args, after, onError }) => {
    console.log(`[${store.$id}] action "${name}" called with:`, args)
    after((result) => {
      console.log(`[${store.$id}] action "${name}" finished:`, result)
    })
    onError((error) => {
      console.error(`[${store.$id}] action "${name}" failed:`, error)
    })
  })
}

// main.js
const pinia = createPinia()
pinia.use(loggerPlugin)
app.use(pinia)
```

**Плагин персистентности (pinia-plugin-persistedstate):**

```bash
npm install pinia-plugin-persistedstate
```

```js
// main.js
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// stores/cart.js
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  persist: true, // Сохраняет весь стор в localStorage
})

// Расширенная настройка
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, token: null }),
  persist: {
    key: 'auth-storage',
    storage: localStorage,
    pick: ['token'], // Сохраняем только токен
  },
})
```

> 💡 **Zustand:** Плагины Pinia применяются глобально ко всем сторам через `pinia.use(...)`. Middleware Zustand оборачивает конкретный стор: `create(devtools(persist(...)))`. Pinia-подход удобен для логирования и аналитики; Zustand-подход гибче, когда нужно разное поведение для разных сторов.

### Подписки на изменения

**$subscribe** — подписка на изменения state:

```js
const cartStore = useCartStore()

cartStore.$subscribe((mutation, state) => {
  // Синхронизируем корзину с localStorage при каждом изменении
  localStorage.setItem('cart', JSON.stringify(state.items))
})
```

**$onAction** — подписка на вызов actions:

```js
authStore.$onAction(({ name, after, onError }) => {
  if (name === 'login') {
    after(() => router.push('/dashboard'))
    onError((error) => console.error('Login failed:', error))
  }
})
```

### Взаимодействие между сторами

Сторы могут ссылаться друг на друга внутри actions:

```js
// stores/order.js
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { useAuthStore } from './auth'

export const useOrderStore = defineStore('order', {
  state: () => ({ orders: [], processing: false }),

  actions: {
    async placeOrder() {
      const cartStore = useCartStore()
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) throw new Error('Must be logged in')
      if (cartStore.isEmpty) throw new Error('Cart is empty')

      this.processing = true
      try {
        const order = await api.post('/orders', {
          items: cartStore.items,
          userId: authStore.user.id,
        })
        this.orders.push(order.data)
        cartStore.clearCart()
        return order.data
      } finally {
        this.processing = false
      }
    },
  },
})
```

### TypeScript

Pinia автоматически выводит типы из `state()`:

```ts
// stores/user.ts
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

interface UserState {
  user: User | null
  users: User[]
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    users: [],
    loading: false,
  }),

  getters: {
    isAdmin: (state): boolean => state.user?.role === 'admin',
    getUserById: (state) => {
      return (id: number): User | undefined =>
        state.users.find((u) => u.id === id)
    },
  },

  actions: {
    async fetchUsers(): Promise<void> {
      this.loading = true
      this.users = await api.get<User[]>('/users').then(r => r.data)
      this.loading = false
    },
  },
})

// Использование с типами
const store = useUserStore()
store.user       // User | null
store.users      // User[]
store.isAdmin    // boolean
store.getUserById(1) // User | undefined
```

> 💡 **Zustand:** В Zustand тип передаётся явным дженериком: `create<AuthState>(...)`. В Pinia тип выводится автоматически из возвращаемого типа `state: (): UserState => ({...})` — аннотировать нужно только саму функцию state.

### DevTools

Pinia полностью интегрируется с Vue DevTools без дополнительной настройки:

```js
// Достаточно создать pinia — DevTools подключится автоматически
const pinia = createPinia()
app.use(pinia)
```

DevTools предоставляет:
- Просмотр состояния всех сторов в реальном времени
- Time travel — просмотр истории изменений
- Вызов actions напрямую из DevTools
- Hot module replacement (HMR) — обновление стора без перезагрузки

---

## Pinia vs Zustand

Pinia и [Zustand](./zustand.md) решают одну задачу — управление клиентским состоянием — но для разных фреймворков. Если вы знаете один, второй освоить значительно проще.

### Сравнительная таблица

| Характеристика | Pinia | Zustand |
|---|---|---|
| **Фреймворк** | Vue 3 | React |
| **Создание стора** | `defineStore('id', { state, getters, actions })` | `create((set, get) => ({...}))` |
| **Структура** | state / getters / actions | плоский объект |
| **Мутации** | Прямые (`this.count++`) | Через `set()` (иммутабельность) |
| **Реактивность** | Vue Proxy (автоматически) | React re-render через подписки |
| **Селекторы** | Не нужны | Обязательны для оптимизации |
| **Деструктуризация** | Через `storeToRefs()` | Напрямую из хука |
| **Геттеры** | `getters: { x: state => ... }` | Вычисляется в компоненте / useMemo |
| **Плагины** | Глобальные (`pinia.use(...)`) | Per-store middleware |
| **DevTools** | Vue DevTools (встроено) | Redux DevTools (через middleware) |
| **TypeScript** | Автовывод из `state()` | Дженерик `create<State>(...)` |
| **Провайдер** | `createPinia()` + `app.use()` | Не требуется |
| **Размер** | ~2 KB | ~1 KB |
| **Персистентность** | `pinia-plugin-persistedstate` | `persist` middleware |

### Главное различие: мутабельность

Это фундаментальное архитектурное отличие двух библиотек.

**В Zustand — иммутабельность обязательна:**

```js
// Zustand: нужно возвращать новый объект
addItem: (item) => set((state) => ({
  items: [...state.items, item] // ✅ новый массив
}))

// Zustand: прямая мутация — антипаттерн (компонент не перерендерится)
addItem: (item) => {
  const state = useStore.getState()
  state.items.push(item) // ❌ не работает
}
```

**В Pinia — прямые мутации — это норма:**

```js
// Pinia: прямая мутация через Vue Proxy — стандарт
addItem(item) {
  this.items.push(item) // ✅ Vue отслеживает мутацию через Proxy
}
```

Причина: Vue использует `Proxy` для отслеживания изменений на уровне свойств. Любое изменение через `this.prop = ...` или `this.arr.push(...)` автоматически вызывает обновление. React не имеет такой системы, поэтому Zustand требует явного создания новых объектов.

> 💡 **Правило:** Если пишете на Vue — используйте Pinia. Если на React — Zustand. Если знаете один, второй освоите за день.

---

## Миграция с Vuex

### Vuex 4

```js
// store/index.js
import { createStore } from 'vuex'

export const store = createStore({
  state: () => ({ user: null, count: 0 }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    doubleCount: (state) => state.count * 2,
  },

  mutations: {
    SET_USER(state, user) { state.user = user },
    INCREMENT(state) { state.count++ },
  },

  actions: {
    async login({ commit }, credentials) {
      const user = await api.post('/auth/login', credentials)
      commit('SET_USER', user.data)
    },
    increment({ commit }) {
      commit('INCREMENT')
    },
  },
})

// Component.vue
import { useStore } from 'vuex'
const store = useStore()
store.dispatch('login', credentials)
store.commit('INCREMENT')
const user = computed(() => store.state.user)
const isAuth = computed(() => store.getters.isAuthenticated)
```

### Pinia (эквивалент)

```js
// stores/auth.js
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async login(credentials) {
      this.user = await api.post('/auth/login', credentials).then(r => r.data)
    },
  },
})

// stores/counter.js
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() { this.count++ },
  },
})

// Component.vue
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useCounterStore } from '@/stores/counter'

const authStore = useAuthStore()
const counterStore = useCounterStore()
const { user } = storeToRefs(authStore)
const { count, doubleCount } = storeToRefs(counterStore)

authStore.login(credentials)
counterStore.increment()
const isAuth = computed(() => authStore.isAuthenticated)
```

Ключевые изменения при миграции:
- `commit('MUTATION', payload)` → прямая мутация `this.field = value`
- `dispatch('action', payload)` → `store.action(payload)`
- Модули (`modules: { auth }`) → отдельные `defineStore` файлы
- `mapState`, `mapGetters`, `mapActions` → `storeToRefs` + прямые вызовы

---

## Лучшие практики

### 1. Используйте storeToRefs для деструктуризации

```vue
<script setup>
// ❌ Плохо: потеря реактивности
const { count, name } = useCounterStore()

// ✅ Хорошо: storeToRefs сохраняет реактивность
const store = useCounterStore()
const { count, name } = storeToRefs(store)
const { increment, reset } = store // Actions — без storeToRefs
</script>
```

### 2. Разделяйте сторы по доменам

```js
// ❌ Плохо: один стор для всего
export const useAppStore = defineStore('app', {
  state: () => ({ user: null, cart: [], theme: 'light', notifications: [] }),
})

// ✅ Хорошо: отдельные сторы
export const useAuthStore = defineStore('auth', { ... })
export const useCartStore = defineStore('cart', { ... })
export const useSettingsStore = defineStore('settings', { ... })
export const useUIStore = defineStore('ui', { ... })
```

### 3. Используйте $patch для атомарных обновлений

```js
// ❌ Плохо: несколько отдельных мутаций
this.loading = false
this.error = null
this.items = data

// ✅ Хорошо: атомарно через $patch
this.$patch({ loading: false, error: null, items: data })
```

### 4. Обрабатывайте ошибки в actions

```js
actions: {
  async fetchUser(id) {
    this.loading = true
    this.error = null
    try {
      this.user = await api.get(`/users/${id}`).then(r => r.data)
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  },
}
```

### 5. Тестируйте сторы изолированно

```js
// tests/cart.test.js
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds items to cart', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Product', price: 10 })
    expect(store.totalItems).toBe(1)
    expect(store.totalPrice).toBe(10)
  })

  it('removes items from cart', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Product', price: 10 })
    store.removeItem(1)
    expect(store.isEmpty).toBe(true)
  })
})
```

`setActivePinia(createPinia())` — обязательный шаг перед каждым тестом: создаёт свежий экземпляр Pinia и активирует его.

---

## Антипаттерны

### 1. Деструктуризация без storeToRefs

```vue
<script setup>
// ❌ Плохо: count — примитив, не обновится в шаблоне
const { count } = useCounterStore()

// ✅ Хорошо
const { count } = storeToRefs(useCounterStore())
</script>
```

### 2. Неуникальный id стора

```js
// ❌ Плохо: одинаковый id вызовет конфликт — оба вернут один стор
export const useStoreA = defineStore('store', { ... })
export const useStoreB = defineStore('store', { ... })

// ✅ Хорошо
export const useAuthStore = defineStore('auth', { ... })
export const useCartStore = defineStore('cart', { ... })
```

### 3. Использование Pinia для серверного состояния

```js
// ❌ Плохо: ручное кэширование, нет повторных запросов, нет инвалидации
export const useProductStore = defineStore('products', {
  state: () => ({ items: [], loading: false }),
  actions: {
    async fetchProducts() {
      this.loading = true
      this.items = await api.get('/products')
      this.loading = false
    },
  },
})

// ✅ Хорошо: используйте VueQuery / TanStack Query для серверных данных
import { useQuery } from '@tanstack/vue-query'

function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })
}
```

### 4. Мутация state вне actions

```vue
<script setup>
// ❌ Плохо: прямая мутация из компонента (обходит DevTools, не логируется)
const store = useCartStore()
store.items.push(newItem)

// ✅ Хорошо: через action или $patch
store.addItem(newItem)
store.$patch((state) => { state.items.push(newItem) })
</script>
```

### 5. Один монолитный стор

```js
// ❌ Плохо: сложно тестировать и масштабировать
export const useAppStore = defineStore('app', {
  state: () => ({
    user: null, cart: [], products: [], orders: [],
    theme: 'light', sidebarOpen: false, notifications: [],
  }),
})

// ✅ Хорошо: разделение по ответственности
export const useAuthStore = defineStore('auth', { ... })
export const useCartStore = defineStore('cart', { ... })
export const useSettingsStore = defineStore('settings', { ... })
```

---

## Шпаргалка: Pinia ↔ Zustand

| Концепт | Pinia | Zustand |
|---|---|---|
| **Фреймворк** | Vue 3 | React |
| **Создание стора** | `defineStore('id', { state, getters, actions })` | `create((set, get) => ({...}))` |
| **Чтение состояния** | `store.field` (прямой доступ) | `useStore(s => s.field)` (селектор) |
| **Изменение состояния** | `this.field = newValue` (мутация) | `set({ field: newValue })` |
| **Иммутабельность** | Не нужна (нативная реактивность Vue) | Обязательна (Immer опционально) |
| **Асинхронные действия** | `async action() { this.x = await f() }` | `async () => { set({ x: await f() }) }` |
| **Доступ к текущему состоянию** | `this` внутри actions | `get()` |
| **Доступ вне компонентов** | `useStore()` (после init pinia) | `useStore.getState()` |
| **Деструктуризация** | `storeToRefs(store)` для реактивности | Напрямую через хук |
| **Геттеры** | `getters: { x: state => ... }` | Inline / useMemo |
| **Персистентность** | `pinia-plugin-persistedstate` | `persist(...)` middleware |
| **DevTools** | Vue DevTools (автоматически) | Redux DevTools (через middleware) |
| **Плагины/расширения** | Глобальные плагины | Per-store middleware |
| **Несколько сторов** | Несколько `defineStore()` | Несколько `create()` |
| **Провайдер** | `createPinia()` + `app.use()` | Не требуется |
| **Размер** | ~2 KB | ~1 KB |

> 🎯 **Главный вывод:** Если вы знаете Zustand — вы уже знаете 80% философии Pinia. Разница в деталях: Pinia заточена под реактивную модель Vue, Zustand — под иммутабельную модель React. Прямые мутации и `storeToRefs` в Pinia — это следствие встроенной реактивности Vue; селекторы и `set()` в Zustand — плата за её отсутствие.

---

## Ключевые тезисы для интервью

- Pinia — официальная замена Vuex для Vue 3: нет mutations, actions могут быть синхронными и асинхронными.
- defineStore принимает уникальный string-id и конфигурацию в виде объекта (Options API) или функции (Setup API).
- state — функция, возвращающая начальное состояние; это гарантирует независимые экземпляры на сервере (SSR).
- getters — вычисляемые свойства стора, кэшируются Vue и пересчитываются только при изменении зависимостей.
- В Pinia прямые мутации через `this.field = value` — стандарт: Vue отслеживает их через Proxy автоматически.
- storeToRefs() нужен при деструктуризации стора — без него реактивные свойства превращаются в примитивы.
- $patch({ ... }) обновляет несколько полей атомарно; $patch(fn) используется для сложных мутаций с массивами.
- Плагины Pinia применяются глобально через pinia.use(...) и расширяют все сторы (логирование, персистентность, аналитика).
- Для тестирования стора нужно вызвать setActivePinia(createPinia()) перед каждым тестом.
- Серверное состояние (данные с API) лучше доверить TanStack Query / VueQuery; Pinia — для UI-состояния.

## Заключение

Pinia — современный и эргономичный стейт-менеджер для Vue 3, который убрал главную боль Vuex: двойной бойлерплейт mutations/actions. Прямые мутации через Vue Proxy, автовывод TypeScript-типов и встроенная интеграция с DevTools делают его продуктивным инструментом без лишней настройки.

**Ключевые преимущества:**
- Нет mutations — одни actions для синхронного и асинхронного кода
- Прямые мутации `this.field = value` без `commit`
- Автоматический TypeScript из `state()`
- Vue DevTools без дополнительных пакетов
- Плагины для глобального расширения всех сторов

**Когда использовать:**
- Глобальное UI-состояние (модальные окна, боковые панели)
- Состояние корзины, аутентификации, настроек
- Любое клиентское состояние в Vue-приложении

**Когда использовать TanStack Query / VueQuery:**
- Загрузка данных с API
- Кэширование и инвалидация
- Мутации с оптимистичными обновлениями
- Пагинация и бесконечная прокрутка

**Рекомендуемый паттерн:** Используйте Pinia для клиентского состояния и VueQuery для серверного состояния. Вместе они заменяют Vuex в большинстве современных Vue-приложений.
