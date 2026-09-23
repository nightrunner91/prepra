---
title: "Redux Toolkit: предсказуемое состояние, слайсы, RTK Query"
section: state-management
description: "Redux Toolkit — современный способ писать Redux без бойлерплейта. createSlice, createAsyncThunk, RTK Query, Immer и правила иммутабельности."
order: 5
tags: ["redux", "redux-toolkit", "rtk", "rtk-query", "state-management", "flux"]
questions:
  - "Как архитектура Flux в Redux (единый стор, чистые reducers, однонаправленный поток) обеспечивает предсказуемость и работу DevTools"
  - "Как createSlice устраняет бойлерплейт классического Redux и почему в reducers можно писать «мутации» благодаря Immer"
  - "Как createAsyncThunk обрабатывает асинхронные операции и чем отличается от RTK Query для работы с серверными данными"
  - "Как middleware в Redux формирует цепочку между dispatch и reducer и что configureStore включает по умолчанию"
  - "Как RTK Query организует кэширование, инвалидацию через теги и автогенерацию хуков для запросов"
  - "Когда состояние должно оставаться в useState, а когда выносится в Redux — какие данные действительно нуждаются в глобальном сторе"
---

# Redux Toolkit: предсказуемое состояние, слайсы, RTK Query

Redux долго был стандартом управления состоянием в React, но платил за это жёстким бойлерплейтом: константы, action creators, редьюсеры, switch/case, `mapStateToProps`. Redux Toolkit (RTK) — официальная надстройка от команды Redux — решает эту боль: `createSlice` генерирует actions и reducer из одного объекта, Immer позволяет писать «мутации», а `RTK Query` заменяет самописный слой запросов. В статье разобраны Redux Toolkit, RTK Query, миграция с классического Redux и границы применения по сравнению с Zustand и TanStack Query.

## Содержание

1. [Что такое Redux](#что-такое-redux)
2. [Какую проблему решает Redux](#какую-проблему-решает-redux)
3. [Ключевые понятия](#ключевые-понятия)
4. [Базовое использование](#базовое-использование)
5. [Сценарии применения](#сценарии-применения)
6. [Продвинутые возможности](#продвинутые-возможности)
7. [RTK Query](#rtk-query)
8. [Redux vs Zustand](#redux-vs-zustand)
9. [Миграция с классического Redux](#миграция-с-классического-redux)
10. [Лучшие практики](#лучшие-практики)
11. [Антипаттерны](#антипаттерны)
12. [Шпаргалка: Redux Toolkit ↔ Zustand](#шпаргалка-redux-toolkit--zustand)
13. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
14. [Заключение](#заключение)

---

## Что такое Redux

Redux — это **предсказуемый контейнер состояния** для JavaScript-приложений, построенный на архитектуре Flux. Ядро библиотеки состоит из одного стора, редьюсеров (чистых функций) и однонаправленного потока данных: компонент диспатчит action → редьюсер вычисляет новое состояние → подписчики уведомляются.

**Redux Toolkit (RTK)** — официальная надстройка, устраняющая бойлерплейт классического Redux. С 2020 года это рекомендованный способ писать Redux; писать «чистый» Redux сегодня — антипаттерн.

```jsx
import { createSlice, configureStore } from '@reduxjs/toolkit'
import { Provider, useSelector, useDispatch } from 'react-redux'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
    decrement: (state) => { state.value -= 1 },
    incrementByAmount: (state, action) => { state.value += action.payload },
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions
export const store = configureStore({ reducer: { counter: counterSlice.reducer } })

function Counter() {
  const value = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()
  return <button onClick={() => dispatch(increment())}>Count: {value}</button>
}
```

Ключевые особенности Redux Toolkit:
- **createSlice** — actions и reducer из одного объекта, без констант и switch/case.
- **Immer внутри** — можно писать `state.value += 1`, RTK превратит это в иммутабельное обновление.
- **createAsyncThunk** — стандартный способ для асинхронных действий (pending/fulfilled/rejected).
- **RTK Query** — встроенный слой для API-запросов с кэшированием и инвалидацией.
- **DevTools** — интеграция из коробки, time travel, экспорт/импорт состояния.
- **TypeScript** — типы генерируются из слайса.
- **Строгий однонаправленный поток** — единственный источник истины, предсказуемые обновления.
- **Размер** — RTK ~13 KB + react-redux ~6 KB (minified + gzipped).

> 💡 **Zustand:** Redux Toolkit и [Zustand](./zustand.md) — конкуренты в мире React. Redux даёт больше «инфраструктуры» (middleware, DevTools, RTK Query, строгий поток данных), Zustand — минимализм и гибкость. В новых проектах команды всё чаще выбирают Zustand для UI-состояния и TanStack Query для серверных данных; Redux остаётся выбором крупных легаси-приложений и команд, ценящих предсказуемость и tooling.

---

## Какую проблему решает Redux

### Проблема 1: Разбросанное и непредсказуемое состояние

Без централизованного стора состояние живёт в десятках компонентов, синхронизировать его между удалёнными частями UI сложно, а причины изменений теряются.

```jsx
// ❌ Prop drilling + локальное состояние в каждом компоненте
function App() {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [notifications, setNotifications] = useState([])
  return (
    <Layout
      user={user} setUser={setUser}
      cart={cart} setCart={setCart}
      notifications={notifications} setNotifications={setNotifications}
    />
  )
}
```

Redux централизует состояние: один стор, единственный источник истины.

```jsx
// ✅ Redux: единый стор, компоненты подписываются на нужные части
const user = useSelector((state) => state.auth.user)
const cartCount = useSelector((state) => state.cart.items.length)
```

### Проблема 2: Непонятные изменения состояния

В обычном React нет «истории» изменений — если баг случился, непонятно, кто и когда его вызвал. Redux требует, чтобы каждое изменение происходило через диспатч action:

```jsx
// ❌ Обычный React: mutation могла произойти где угодно
setState({ ...state, user: { ...state.user, role: 'admin' } })

// ✅ Redux: каждое изменение — action с типом и payload
dispatch(userRoleChanged({ userId: 1, role: 'admin' }))
// В DevTools видно: время, action, diff состояния, стек вызовов
```

Каждое изменение — именованное событие, история хранится в DevTools, time travel работает из коробки.

### Проблема 3: Бойлерплейт классического Redux

Классический Redux требовал писать вручную константы, action creators, редьюсеры со switch/case, connect/mapStateToProps.

```jsx
// ❌ Классический Redux: 4 файла ради счётчика
// types.js
export const INCREMENT = 'counter/INCREMENT'
export const INCREMENT_BY = 'counter/INCREMENT_BY'

// actions.js
export const increment = () => ({ type: INCREMENT })
export const incrementBy = (amount) => ({ type: INCREMENT_BY, payload: amount })

// reducer.js
const initialState = { value: 0 }
export default function counterReducer(state = initialState, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + 1 }
    case INCREMENT_BY:
      return { ...state, value: state.value + action.payload }
    default:
      return state
  }
}

// store.js
import { createStore, combineReducers } from 'redux'
const rootReducer = combineReducers({ counter: counterReducer })
export const store = createStore(rootReducer)
```

Redux Toolkit решает это через `createSlice`:

```jsx
// ✅ Redux Toolkit: один файл, никаких констант и switch
import { createSlice } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
    incrementBy: (state, action) => { state.value += action.payload },
  },
})

export const { increment, incrementBy } = counterSlice.actions
export default counterSlice.reducer
```

| Проблема классического Redux | Решение Redux Toolkit |
|---|---|
| Константы для типов actions | Тип генерируется из `name/reducerName` |
| Отдельные action creators | Генерируются автоматически из `reducers` |
| switch/case в редьюсере | Ключи объекта = типы actions |
| Ручной spread для иммутабельности | Immer позволяет писать «мутации» |
| Ручная настройка DevTools и middleware | `configureStore` включает всё по умолчанию |
| Callback hell в асинхронных действиях | `createAsyncThunk` + жизненный цикл |

---

## Ключевые понятия

### Store

Store — единственное хранилище всего состояния приложения. Создаётся через `configureStore`, который автоматически подключает DevTools, `redux-thunk` и проверки на иммутабельность/сериализуемость.

```jsx
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
})

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

Три главных метода стора:
- `getState()` — текущее состояние.
- `dispatch(action)` — отправить action.
- `subscribe(listener)` — подписаться на изменения (обычно вызывается react-redux, не вами).

### Actions

Action — простой объект с обязательным полем `type` и опциональным `payload`. В Redux Toolkit action creators генерируются автоматически из `createSlice`.

```jsx
// createSlice сгенерирует эти actions:
counterSlice.actions.increment()
// → { type: 'counter/increment' }

counterSlice.actions.incrementBy(5)
// → { type: 'counter/incrementBy', payload: 5 }
```

Соглашение об именовании: `имя_слайса/имя_action` — типы уникальны в рамках приложения, легко искать в DevTools.

### Reducers

Reducer — чистая функция `(state, action) => newState`. В классическом Redux требовалось возвращать новый объект; в Redux Toolkit Immer превращает «мутации» в иммутабельные обновления.

```jsx
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    itemAdded: (state, action) => {
      // Выглядит как мутация — но Immer создаст новый state
      state.items.push(action.payload)
    },
    itemRemoved: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    quantityChanged: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find((i) => i.id === id)
      if (item) item.quantity = quantity
    },
  },
})
```

Правила reducers:
- **Чистые функции** — без побочных эффектов (API, timers, Math.random).
- **Только `state` и `action`** — не читайте из глобальных переменных.
- **Возвращайте state или мутируйте черновик Immer** — но не оба одновременно.

> 💡 **Zustand:** В Zustand роль reducers играют функции, передаваемые в `create`, а мутации требуют явного `set()`. В Redux Toolkit reducer — часть слайса, а Immer имитирует Vue-подобную «мутабельность» поверх иммутабельной модели.

### Dispatch

Dispatch — единственный способ изменить state. Принимает action и передаёт его через middleware в редьюсеры.

```jsx
const dispatch = useDispatch()

// Синхронный action
dispatch(increment())
dispatch(incrementBy(5))

// Асинхронный thunk (это тоже action, только функция)
dispatch(fetchUser(1))
```

### Selectors

Selector — функция `(state) => value`, извлекающая часть состояния. Используются с хуком `useSelector` для подписки компонента.

```jsx
// Простой селектор
const user = useSelector((state) => state.auth.user)

// Селектор с вычислением
const cartTotal = useSelector((state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
)
```

**Reselect** и `createSelector` мемоизируют вычисляемые селекторы:

```jsx
import { createSelector } from '@reduxjs/toolkit'

const selectCartItems = (state) => state.cart.items
const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

// Компонент перерендерится только при изменении items
const total = useSelector(selectCartTotal)
```

> 💡 **Zustand:** В Zustand селекторы обязательны для оптимизации ре-рендеров. В Redux + react-redux аналогичная роль: без селектора компонент подписывается на весь стор и рендерится при любом изменении. Обе библиотеки требуют осознанной работы с подписками — это плата за отсутствие встроенной реактивности в React.

### Middleware

Middleware — цепочка обработчиков между `dispatch` и `reducer`. Обычно используется для логирования, асинхронных операций и side effects.

```jsx
import { configureStore } from '@reduxjs/toolkit'

const loggerMiddleware = (store) => (next) => (action) => {
  console.log('dispatching', action)
  const result = next(action)
  console.log('next state', store.getState())
  return result
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(loggerMiddleware),
})
```

Стандартные middleware в `configureStore` (включены по умолчанию):
- `redux-thunk` — асинхронные actions-функции.
- `serializableCheck` — предупреждает о несериализуемых значениях в state/actions.
- `immutableCheck` — ловит случайные мутации state вне Immer.

---

## Базовое использование

### Установка

```bash
npm install @reduxjs/toolkit react-redux
```

### Настройка стора

```jsx
// app/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import cartReducer from '@/features/cart/cartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
})
```

```jsx
// main.jsx
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

### Создание слайса

```jsx
// features/counter/counterSlice.js
import { createSlice } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
    decrement: (state) => { state.value -= 1 },
    incrementByAmount: (state, action) => { state.value += action.payload },
    reset: () => ({ value: 0 }),
  },
})

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions
export default counterSlice.reducer
```

### Использование в компонентах

```jsx
// features/counter/Counter.jsx
import { useSelector, useDispatch } from 'react-redux'
import { increment, decrement, incrementByAmount, reset } from './counterSlice'

function Counter() {
  const value = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()
  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
      <button onClick={() => dispatch(reset())}>Reset</button>
    </div>
  )
}
```

### Типизированные хуки (TypeScript)

Стандартный паттерн — создать типизированные обёртки над `useSelector` и `useDispatch`:

```ts
// app/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

```tsx
// В компонентах используем их вместо голых хуков
const value = useAppSelector((state) => state.counter.value)
const dispatch = useAppDispatch()
```

### Доступ вне React

```jsx
import { store } from '@/app/store'
import { logout } from '@/features/auth/authSlice'

// Читаем состояние
const token = store.getState().auth.token

// Диспатчим action
store.dispatch(logout())

// Пример: axios-interceptor
axios.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

> 💡 **Zustand:** В Zustand доступ вне компонентов — через `useStore.getState()`. В Redux — через импорт `store` и `store.getState()` / `store.dispatch()`. Оба подхода похожи, но Redux требует единственного стора на приложение, а Zustand поощряет несколько независимых.

---

## Сценарии применения

### 1. Аутентификация

```jsx
// features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials)
      localStorage.setItem('token', data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') ?? null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.status = 'idle'
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { logout } = authSlice.actions
export const selectIsAuthenticated = (state) => !!state.auth.token
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'
export default authSlice.reducer
```

### 2. Корзина (E-commerce)

```jsx
// features/cart/cartSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    itemAdded: (state, action) => {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) existing.quantity += 1
      else state.items.push({ ...action.payload, quantity: 1 })
    },
    itemRemoved: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    quantityChanged: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find((i) => i.id === id)
      if (item) item.quantity = quantity
    },
    cartCleared: (state) => { state.items = [] },
  },
})

const selectCartItems = (state) => state.cart.items
export const selectCartCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, i) => sum + i.quantity, 0)
)
export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

export const { itemAdded, itemRemoved, quantityChanged, cartCleared } = cartSlice.actions
export default cartSlice.reducer
```

### 3. Глобальное UI-состояние

```jsx
// features/ui/uiSlice.js
import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    modals: { login: false, settings: false },
    sidebarOpen: false,
    notifications: [],
  },
  reducers: {
    modalOpened: (state, action) => { state.modals[action.payload] = true },
    modalClosed: (state, action) => { state.modals[action.payload] = false },
    sidebarToggled: (state) => { state.sidebarOpen = !state.sidebarOpen },
    notificationAdded: {
      reducer: (state, action) => { state.notifications.push(action.payload) },
      prepare: (message, type = 'info') => ({
        payload: { id: nanoid(), message, type, createdAt: Date.now() },
      }),
    },
    notificationRemoved: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload)
    },
  },
})

export const {
  modalOpened, modalClosed, sidebarToggled,
  notificationAdded, notificationRemoved,
} = uiSlice.actions
export default uiSlice.reducer
```

`prepare` позволяет обогащать payload перед попаданием в reducer (генерация id, timestamps, форматирование).

### 4. Нормализованные списки (createEntityAdapter)

Для коллекций сущностей RTK предоставляет `createEntityAdapter` — генератор нормализованного стора с CRUD-редьюсерами и селекторами.

```jsx
import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.createdAt - a.createdAt,
})

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState({ status: 'idle' }),
  reducers: {
    postAdded: postsAdapter.addOne,
    postUpdated: postsAdapter.updateOne,
    postRemoved: postsAdapter.removeOne,
    postsReceived: postsAdapter.setAll,
  },
})

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts)

export const { postAdded, postUpdated, postRemoved, postsReceived } = postsSlice.actions
export default postsSlice.reducer
```

Состояние хранится как `{ ids: [...], entities: { [id]: entity } }` — быстрый доступ по id, O(1) обновления, готовые селекторы.

---

## Продвинутые возможности

### createAsyncThunk

Стандартный способ описать асинхронное действие. Генерирует три action-типа: `pending`, `fulfilled`, `rejected`, которые обрабатываются в `extraReducers`.

```jsx
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue, signal }) => {
    try {
      const { data } = await api.get('/users', { signal })
      return data
    } catch (err) {
      if (err.name === 'CanceledError') throw err
      return rejectWithValue(err.response?.data)
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.status = 'loading' })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})
```

Thunk API даёт доступ к `dispatch`, `getState`, `rejectWithValue`, `signal` (для отмены) и `extra` (внедрённые зависимости):

```jsx
export const submitOrder = createAsyncThunk(
  'orders/submit',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { auth, cart } = getState()
    if (!auth.token) return rejectWithValue('Not authenticated')
    const { data } = await api.post('/orders', { items: cart.items })
    dispatch(cartCleared())
    return data
  }
)
```

> ⚠️ **Ограничение:** `createAsyncThunk` — это низкоуровневый механизм для side-effects, но он **не заменяет кэш**. Для API-запросов, требующих кэширования, инвалидации, повторных попыток и пагинации, используйте [RTK Query](#rtk-query) или [TanStack Query](./tanstack-query.md).

### Listener Middleware

Реактивный аналог thunks — реагирует на диспатч конкретных actions.

```jsx
import { createListenerMiddleware } from '@reduxjs/toolkit'
import { login, logout } from './authSlice'

const listenerMiddleware = createListenerMiddleware()

listenerMiddleware.startListening({
  actionCreator: login.fulfilled,
  effect: async (action, { dispatch }) => {
    // Побочный эффект после успешного логина
    dispatch(fetchUserSettings())
    dispatch(fetchNotifications())
  },
})

listenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    // Чистим кэш при выходе
    localStorage.removeItem('user-preferences')
  },
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault().prepend(listenerMiddleware.middleware),
})
```

Listener Middleware — рекомендуемая замена `redux-saga` в новых проектах: проще API, тот же async/await, без генераторов.

### createSelector (Reselect)

Мемоизированные селекторы для дорогих вычислений. Компонент перерендерится, только если результат селектора изменился по ссылке.

```jsx
import { createSelector } from '@reduxjs/toolkit'

const selectProducts = (state) => state.products.list
const selectFilter = (state) => state.products.filter

export const selectFilteredProducts = createSelector(
  [selectProducts, selectFilter],
  (products, filter) => {
    if (filter === 'all') return products
    return products.filter((p) => p.category === filter)
  }
)

// В компоненте
const filtered = useSelector(selectFilteredProducts)
```

Без `createSelector` фильтрация вернёт новый массив на каждый рендер — компонент будет перерендериваться, даже если данные не менялись.

### Redux Persist

Сохранение состояния в localStorage/sessionStorage.

```bash
npm install redux-persist
```

```jsx
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'settings'], // Сохраняем только эти слайсы
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})
export const persistor = persistStore(store)
```

```jsx
import { PersistGate } from 'redux-persist/integration/react'

<Provider store={store}>
  <PersistGate loading={<Spinner />} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

### TypeScript

Redux Toolkit имеет одну из лучших TypeScript-историй среди стейт-менеджеров: типы выводятся из `initialState`, `PayloadAction<T>` обеспечивает типизацию action.payload.

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: number
  name: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userSet: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    tokenSet: (state, action: PayloadAction<string>) => {
      state.token = action.payload
    },
  },
})
```

Типы для стора и dispatch:

```ts
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### DevTools

Redux DevTools подключается автоматически через `configureStore`. Возможности:
- Time travel — переход между состояниями.
- Diff — что изменилось в state после каждого action.
- Экспорт/импорт истории — можно передать баг вместе с состоянием.
- Тестирование — генерация тестов из последовательности actions.
- Замер производительности — сколько времени занял каждый reducer.

---

## RTK Query

RTK Query — встроенный в Redux Toolkit слой для работы с API. Он берёт на себя кэширование, повторные запросы, инвалидацию, пагинацию — задачи, которые в чистом Redux решались вручную через thunks.

```jsx
// services/pokemonApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  tagTypes: ['Pokemon'],
  endpoints: (builder) => ({
    getPokemonByName: builder.query({
      query: (name) => `pokemon/${name}`,
      providesTags: (result, error, name) => [{ type: 'Pokemon', id: name }],
    }),
    updatePokemon: builder.mutation({
      query: ({ name, ...patch }) => ({
        url: `pokemon/${name}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { name }) => [{ type: 'Pokemon', id: name }],
    }),
  }),
})

export const { useGetPokemonByNameQuery, useUpdatePokemonMutation } = pokemonApi
```

```jsx
// app/store.js
import { pokemonApi } from '@/services/pokemonApi'

export const store = configureStore({
  reducer: {
    [pokemonApi.reducerPath]: pokemonApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(pokemonApi.middleware),
})
```

```jsx
// Компонент
function Pokemon({ name }) {
  const { data, isLoading, error, refetch } = useGetPokemonByNameQuery(name)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <div>{data.name} — {data.height}m</div>
}
```

Что даёт RTK Query из коробки:
- **Кэш** — одинаковые запросы дедуплицируются, результат кэшируется по ключу.
- **Автогенерация хуков** — `useGetXxxQuery`, `useUpdateXxxMutation` из endpoints.
- **Теги для инвалидации** — `invalidatesTags` в мутации сбрасывает кэш связанных запросов.
- **Polling и рефетчи** — `pollingInterval`, `refetchOnFocus`, `refetchOnReconnect`.
- **Оптимистичные обновления** — через `onQueryStarted` и `updateQueryData`.
- **Автоматические subscription** — кэш очищается через `keepUnusedDataFor` секунд после того, как отписался последний компонент.

> 💡 **RTK Query vs TanStack Query:** [TanStack Query](./tanstack-query.md) — фреймворк-агностична, богаче фичами (infinite queries, suspense, hydration для SSR из коробки), лучше DX. RTK Query — часть Redux экосистемы, идеально, если уже используете Redux и не хотите ещё одну зависимость. Если начинаете с нуля и не нуждаетесь в остальной Redux-инфраструктуре — берите TanStack Query.

---

## Redux vs Zustand

Redux Toolkit и [Zustand](./zustand.md) решают одну задачу — глобальное состояние в React — но с разной философией. Выбор между ними — компромисс между инфраструктурой и минимализмом.

### Сравнительная таблица

| Характеристика | Redux Toolkit | Zustand |
|---|---|---|
| **Философия** | Строгая архитектура Flux | Минимализм и гибкость |
| **Создание стора** | `createSlice` + `configureStore` | `create((set, get) => ({...}))` |
| **Провайдер** | Обязателен `<Provider store={store}>` | Не требуется |
| **Число сторов** | Обычно один (единый rootReducer) | Много независимых |
| **Изменение состояния** | `dispatch(action)` через reducer | Прямой вызов `set()` |
| **«Мутации»** | Разрешены (Immer в reducers) | Требуется иммутабельность (или Immer) |
| **Асинхронность** | `createAsyncThunk` + `extraReducers` | Async-функция внутри стора |
| **Кэш API** | RTK Query (встроен) | Нет; используйте TanStack Query |
| **Селекторы** | `useSelector` (обязательно) | `useStore(s => ...)` (обязательно) |
| **DevTools** | Redux DevTools (авто) | Redux DevTools (через middleware) |
| **Мемоизация** | Reselect / createSelector | Ручная (useMemo / shallow) |
| **Middleware** | Мощная система (thunk, listener, RTK Query) | Тонкая обёртка стора |
| **Размер** | ~13 KB RTK + ~6 KB react-redux | ~1 KB |
| **Бойлерплейт** | Умеренный (createSlice сокращает) | Минимальный |
| **Кривая обучения** | Средняя (Flux, actions, thunks, RTK Query) | Пологая (один хук) |
| **Строгость** | Высокая (единый поток, action-типы) | Низкая (полная свобода) |

### Когда выбирать Redux Toolkit

- Большое приложение с множеством связанных доменов и сложной логикой.
- Команда ценит предсказуемость: строгий поток, история действий, tooling.
- Есть код на Redux, миграция дорога — RTK совместим с классическим Redux.
- Нужна RTK Query как единый слой запросов, а тянуть TanStack Query отдельно не хочется.
- Требуется расширенная отладка: time travel, экспорт state, генерация тестов.

### Когда выбирать Zustand

- Небольшое или среднее приложение, где полный Redux-стек избыточен.
- Нужно быстро добавить глобальное UI-состояние без провайдера.
- Команда предпочитает минимализм и хочет писать меньше кода.
- Уже используется TanStack Query для серверных данных — глобальный стор нужен только для UI.

> 💡 **Тренд:** Начиная с 2022 года новые проекты чаще выбирают связку **Zustand + TanStack Query** вместо Redux Toolkit. Redux остаётся в крупных легаси-приложениях и там, где команда осознанно хочет строгой архитектуры и DevTools-возможностей.

---

## Миграция с классического Redux

Redux Toolkit полностью совместим с классическим Redux — можно мигрировать постепенно, слайс за слайсом.

### Классический Redux

```jsx
// constants/actionTypes.js
export const TODO_ADDED = 'todos/added'
export const TODO_TOGGLED = 'todos/toggled'

// actions/todos.js
export const addTodo = (text) => ({
  type: TODO_ADDED,
  payload: { id: Date.now(), text, done: false },
})
export const toggleTodo = (id) => ({ type: TODO_TOGGLED, payload: id })

// reducers/todos.js
const initialState = { items: [] }
export default function todosReducer(state = initialState, action) {
  switch (action.type) {
    case TODO_ADDED:
      return { ...state, items: [...state.items, action.payload] }
    case TODO_TOGGLED:
      return {
        ...state,
        items: state.items.map((t) =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        ),
      }
    default:
      return state
  }
}

// store.js
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'
import todosReducer from './reducers/todos'

const rootReducer = combineReducers({ todos: todosReducer })
export const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunk))
)
```

### Redux Toolkit (эквивалент)

```jsx
// features/todos/todosSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit'

const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    added: {
      reducer: (state, action) => { state.items.push(action.payload) },
      prepare: (text) => ({ payload: { id: nanoid(), text, done: false } }),
    },
    toggled: (state, action) => {
      const todo = state.items.find((t) => t.id === action.payload)
      if (todo) todo.done = !todo.done
    },
  },
})

export const { added: todoAdded, toggled: todoToggled } = todosSlice.actions
export default todosSlice.reducer

// app/store.js
import { configureStore } from '@reduxjs/toolkit'
import todosReducer from '@/features/todos/todosSlice'

export const store = configureStore({
  reducer: { todos: todosReducer },
})
// DevTools и thunk включены автоматически
```

Ключевые изменения при миграции:
- `createStore` + `combineReducers` → `configureStore`.
- Файлы constants + actions + reducers → один `createSlice`.
- Ручные spread-обновления → мутации через Immer.
- Ручное подключение DevTools и thunk → включены по умолчанию.
- `mapStateToProps` / `mapDispatchToProps` → хуки `useSelector` / `useDispatch`.

Постепенная миграция: в один стор можно комбинировать `createSlice`-редьюсеры и старые reducers — переписывайте слайсы по одному.

---

## Лучшие практики

### 1. Используйте createSlice, не createStore

Классический `createStore` устарел. `configureStore` включает всё необходимое: DevTools, thunk, проверки иммутабельности и сериализуемости.

```jsx
// ❌ Устаревшее
import { createStore } from 'redux'
const store = createStore(reducer)

// ✅ Современное
import { configureStore } from '@reduxjs/toolkit'
const store = configureStore({ reducer: { ... } })
```

### 2. Именуйте actions как события, а не сеттеры

Actions описывают, **что произошло**, а не **как обновить state**. Это делает историю в DevTools читаемой и позволяет одному action обновить несколько слайсов.

```jsx
// ❌ Плохо: actions как сеттеры
reducers: {
  setUser: (state, action) => { state.user = action.payload },
  setToken: (state, action) => { state.token = action.payload },
  setError: (state, action) => { state.error = action.payload },
}

// ✅ Хорошо: actions как события
reducers: {
  userLoggedIn: (state, action) => {
    state.user = action.payload.user
    state.token = action.payload.token
    state.error = null
  },
  userLoggedOut: (state) => {
    state.user = null
    state.token = null
  },
}
```

### 3. Мемоизируйте селекторы через createSelector

Селекторы, возвращающие новые массивы/объекты, вызовут ре-рендер на каждое обновление стора. `createSelector` мемоизирует результат.

```jsx
// ❌ Плохо: новый массив на каждый рендер
const activeTodos = useSelector((state) => state.todos.items.filter((t) => !t.done))

// ✅ Хорошо: мемоизированный селектор
export const selectActiveTodos = createSelector(
  [(state) => state.todos.items],
  (items) => items.filter((t) => !t.done)
)
const activeTodos = useSelector(selectActiveTodos)
```

### 4. Разделяйте состояние по фичам (Feature Slice Design)

Организуйте код по фичам, а не по типам файлов:

```
❌ src/
  actions/
  reducers/
  selectors/
  components/

✅ src/
  features/
    auth/
      authSlice.js
      LoginForm.jsx
      selectors.js
    cart/
      cartSlice.js
      CartPage.jsx
```

Каждая фича — самодостаточный модуль: слайс, компоненты, селекторы, тесты.

### 5. Держите state сериализуемым

Redux State должен быть JSON-сериализуемым: без функций, классов, Date, Map, Set. Это нужно для DevTools, персистентности и SSR.

```jsx
// ❌ Плохо: Date-объект в state
initialState: { createdAt: new Date() }

// ✅ Хорошо: timestamp
initialState: { createdAt: Date.now() }
```

### 6. Тестируйте reducers и thunks изолированно

Reducers — чистые функции, их можно тестировать без стора и React.

```jsx
import counterReducer, { increment, incrementByAmount } from './counterSlice'

test('increment increases value by 1', () => {
  const initialState = { value: 0 }
  const newState = counterReducer(initialState, increment())
  expect(newState.value).toBe(1)
})

test('incrementByAmount adds payload to value', () => {
  const initialState = { value: 5 }
  const newState = counterReducer(initialState, incrementByAmount(10))
  expect(newState.value).toBe(15)
})
```

Thunks тестируются через мок-стор или реальный `configureStore`:

```jsx
import { configureStore } from '@reduxjs/toolkit'
import authReducer, { login } from './authSlice'

test('login succeeds and updates state', async () => {
  const store = configureStore({ reducer: { auth: authReducer } })
  await store.dispatch(login({ email: 'a@b.c', password: 'pass' }))
  expect(store.getState().auth.status).toBe('succeeded')
  expect(store.getState().auth.user).toBeDefined()
})
```

---

## Антипаттерны

### 1. Хранить всё в Redux

Redux — не универсальный контейнер. Локальное состояние компонента (значение input, открыто ли выпадающее меню, ховер) должно оставаться в `useState`.

```jsx
// ❌ Плохо: локальный toggle в Redux
dispatch(dropdownToggled('user-menu'))

// ✅ Хорошо: локальный state
const [isOpen, setIsOpen] = useState(false)
```

Правило: **если состояние нужно только одному компоненту — не тащите его в Redux**.

### 2. Использовать Redux для серверного состояния без RTK Query

Ручной thunk для загрузки данных быстро превращается в самописный слой кэша с багами: нет дедупликации запросов, нет инвалидации, нет polling.

```jsx
// ❌ Плохо: ручное кэширование через thunks
export const fetchUser = createAsyncThunk('users/fetch', async (id, { getState }) => {
  const cached = getState().users.entities[id]
  if (cached) return cached // Нет TTL, нет invalidation
  return await api.get(`/users/${id}`)
})

// ✅ Хорошо: RTK Query
const { data: user } = useGetUserQuery(id)
```

### 3. Мутировать state вне createSlice

Immer работает только внутри reducers `createSlice` и `createAsyncThunk.extraReducers`. Вне этого контекста прямая мутация — гарантированный баг.

```jsx
// ❌ Плохо: мутация state снаружи
const state = store.getState()
state.cart.items.push(newItem) // Компонент не перерендерится

// ✅ Хорошо: через dispatch
store.dispatch(itemAdded(newItem))
```

### 4. Класть несериализуемые значения в state или actions

Функции, классы, промисы, DOM-элементы, Date — всё это ломает DevTools, персистентность и SSR. `configureStore` предупредит через `serializableCheck`.

```jsx
// ❌ Плохо: promise в payload
dispatch({ type: 'user/loading', payload: fetchUser(id) })

// ✅ Хорошо: используйте createAsyncThunk или RTK Query
dispatch(fetchUser(id))
```

### 5. Подписка на весь стор

`useSelector` без селектора возвращает весь стор — компонент будет перерендериваться при любом изменении.

```jsx
// ❌ Плохо
const state = useSelector((s) => s)
return <div>{state.user.name}</div>

// ✅ Хорошо: точечная подписка
const userName = useSelector((s) => s.user.name)
return <div>{userName}</div>
```

### 6. Один гигантский слайс

Один слайс на всё приложение сводит на нет преимущества модульности.

```jsx
// ❌ Плохо
const appSlice = createSlice({
  name: 'app',
  initialState: { user: null, cart: [], products: [], ui: {}, notifications: [] },
  reducers: { /* 30+ редьюсеров */ },
})

// ✅ Хорошо: отдельные слайсы по доменам
const authSlice = createSlice({ name: 'auth', ... })
const cartSlice = createSlice({ name: 'cart', ... })
const uiSlice = createSlice({ name: 'ui', ... })
```

### 7. Писать классический Redux в новом проекте

Ручные константы, action creators, switch/case в reducer, `createStore` вместо `configureStore` — это устаревший стиль. Redux Toolkit — официально рекомендованный API с 2020 года.

---

## Шпаргалка: Redux Toolkit ↔ Zustand

| Концепт | Redux Toolkit | Zustand |
|---|---|---|
| **Фреймворк** | React (через react-redux) | React (framework-agnostic ядро) |
| **Создание стора** | `createSlice` + `configureStore` | `create((set, get) => ({...}))` |
| **Провайдер** | `<Provider store={store}>` | Не требуется |
| **Число сторов** | Один rootReducer | Много независимых |
| **Чтение состояния** | `useSelector(s => s.field)` | `useStore(s => s.field)` |
| **Изменение состояния** | `dispatch(actionCreator(payload))` | `set({ field: value })` |
| **«Мутации»** | Разрешены в reducers (Immer) | Требуется иммутабельность (или Immer middleware) |
| **Асинхронные действия** | `createAsyncThunk` + `extraReducers` | `async` внутри стора |
| **Доступ вне компонентов** | `store.getState()` / `store.dispatch()` | `useStore.getState()` |
| **Кэш API** | RTK Query (встроен) | Нет; используйте TanStack Query |
| **Мемоизация селекторов** | `createSelector` (Reselect) | Ручная (`useMemo`, `shallow`) |
| **Middleware** | Мощная система (thunk, listener, RTK Query) | Тонкий middleware-обёртки |
| **Персистентность** | `redux-persist` | `persist` middleware |
| **DevTools** | Redux DevTools (авто) | Redux DevTools (middleware) |
| **TypeScript** | `PayloadAction<T>`, вывод из `initialState` | Дженерик `create<State>(...)` |
| **Размер** | ~19 KB (RTK + react-redux) | ~1 KB |
| **Бойлерплейт** | Умеренный | Минимальный |

> 🎯 **Главный вывод:** Redux Toolkit и Zustand делят одну задачу, но продают разные ценности. Redux — «предсказуемость и tooling за счёт кода», Zustand — «минимализм за счёт свободы». Если вы знаете один — второй освоите за пару часов: разница в API, но не в идеях (подписки, селекторы, иммутабельность).

---

## Ключевые тезисы для интервью

- Redux — предсказуемый стор на архитектуре Flux: единственный источник истины, изменения через actions, чистые reducers, однонаправленный поток данных. Redux Toolkit устраняет бойлерплейт: `createSlice`, `configureStore`, Immer, `createAsyncThunk`, RTK Query.
- `createSlice` генерирует action creators и reducer из одного объекта (`slice/reducerName`); в reducers можно писать «мутации» благодаря Immer — под капотом создаётся новый иммутабельный state.
- `createAsyncThunk` описывает асинхронное действие с автогенерацией pending/fulfilled/rejected actions, обрабатываемых в `extraReducers`. Middleware — цепочка между dispatch и reducer; `configureStore` включает `redux-thunk`, проверки иммутабельности и сериализуемости.
- Selectors + `createSelector` (Reselect) мемоизируют производные данные и предотвращают лишние ре-рендеры.
- RTK Query — встроенный слой запросов и кэш: автогенерация хуков, теги для инвалидации, polling, оптимистичные обновления. `createEntityAdapter` даёт нормализованный стор `{ ids, entities }` с CRUD-редьюсерами.
- Локальное состояние (input, dropdown, hover) — в `useState`; Redux — для действительно глобальных данных. В reducers и state запрещены несериализуемые значения (функции, промисы, Date) — иначе сломаются DevTools, персистентность и SSR.
- Тренд 2020+: новые проекты выбирают Zustand + TanStack Query; Redux остаётся в крупных легаси и там, где важна строгость архитектуры и DevTools.

## Заключение

Redux Toolkit — современное лицо Redux. Он сохранил всё, за что Redux любят (предсказуемость, DevTools, строгий поток данных), и убрал всё, за что критиковали (константы, action creators, switch/case, ручные spread-обновления). Immer позволяет писать мутации, `createSlice` — сократить код в разы, RTK Query — забыть про самописный слой запросов.

**Ключевые преимущества:**
- `createSlice` устраняет 80% бойлерплейта классического Redux
- Immer превращает «мутации» в иммутабельные обновления
- RTK Query — встроенный кэш и слой запросов
- Лучшие в классе DevTools: time travel, экспорт state, генерация тестов
- Строгая архитектура, предсказуемые обновления, читаемая история действий

**Когда использовать:**
- Крупные приложения со сложной логикой и множеством связанных доменов
- Команды, ценящие строгость и предсказуемость
- Проекты, где нужна расширенная отладка через Redux DevTools
- Миграция или поддержка существующего кода на Redux

**Когда рассмотреть альтернативы:**
- Маленькое или среднее приложение — [Zustand](./zustand.md) даст ту же гибкость с минимумом кода
- Основная работа с серверными данными — [TanStack Query](./tanstack-query.md) закроет 90% потребностей
- Vue-проект — [Pinia](./pinia.md) предоставляет аналогичную модель, адаптированную под Vue-реактивность

**Рекомендуемый паттерн 2026:** Если начинаете новый React-проект без легаси, связка **Zustand (UI-состояние) + TanStack Query (серверные данные)** покроет большинство сценариев с меньшим кодом. Redux Toolkit остаётся оправданным выбором для крупных приложений, команд с уже наработанными Redux-паттернами и там, где ценится строгая архитектура и tooling.
