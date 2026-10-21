# Шпаргалка: Хранилища

## Браузерные хранилища

- **localStorage vs sessionStorage:** 5–10 МБ, бессрочно / до закрытия вкладки, только строки (JSON)
- **Web Storage:** синхронный API (блок main thread), QuotaExceededError, событие `storage`
- **Cookies:** 4 КБ, автоотправка с каждым запросом, max-age / expires
- **Атрибуты cookie:** `HttpOnly` (от XSS), `SameSite=Strict/Lax` (от CSRF), `Secure` (HTTPS)
- **IndexedDB:** async NoSQL, транзакции, индексы, бинарные данные, гигабайты, офлайн
- **Токены:** localStorage + XSS → кража · HttpOnly cookie
- **Комбинация:** cookie (токен), localStorage (тема), sessionStorage (форма), IndexedDB (кэш)

## Flux и Redux Toolkit

- **Flux:** single source of truth, dispatch(action) → reducer → новый state, DevTools (time travel)
- **Reducer:** чистая функция, иммутабельность, сериализуемый state (без функций, Promise, Date)
- **createSlice:** action creators + reducer, тип `name/reducerName`, Immer (мутация черновика)
- **createAsyncThunk:** pending / fulfilled / rejected → `extraReducers`, rejectWithValue
- **Middleware:** `store => next => action`, configureStore (thunk, immutable / serializable check)
- **Селекторы:** `createSelector` (мемоизация), `createEntityAdapter` (`{ ids, entities }`)
- **RTK Query:** автогенерация хуков, providesTags / invalidatesTags, keepUnusedDataFor

## Zustand

- **create(set, get):** хук без Provider, стор вне дерева React, `useStore.getState()`
- **Селекторы:** `useStore(s => s.field)` vs `useStore()` (ре-рендер на всё) · vs Context
- **set():** новый объект / функция от state, прямая мутация → нет ре-рендера
- **Middleware:** persist (`partialize`), devtools (Redux DevTools), immer (черновики)
- **Структура:** доменные сторы (auth, cart, ui) · ловушка: стор внутри компонента

## TanStack Query

- **Server state:** кэш, дедупликация, фоновое обновление, retry, loading / error
- **queryKey:** кэш + дедупликация + инвалидация, стабильность, частичное совпадение
- **staleTime vs gcTime:** свежесть → refetch (focus, mount, reconnect) / жизнь кэша после отписки
- **useMutation:** onMutate (`setQueryData`, snapshot) → onError (откат) → onSettled (invalidate)
- **Запросы:** `enabled: !!id`, useInfiniteQuery (`getNextPageParam`), prefetch, keepPreviousData
- **Ловушки:** queryFn без throw, fetch в `useEffect`, нет QueryClientProvider

## Vuex и Pinia

- **Vuex:** state → mutations (sync, snapshot в DevTools) → actions (async, commit / dispatch)
- **Модули Vuex:** `namespaced: true`, `commit('auth/SET_USER')`, rootState / rootGetters
- **strict mode:** ошибка при мутации вне mutations, только dev (производительность)
- **Минусы Vuex:** бойлерплейт mutations, строковые ключи без типов, монолитный стор
- **Pinia:** `defineStore(id)`, без mutations, прямые мутации (Proxy), getters (как computed)
- **Options vs Setup store:** объект (как Vuex) / функция (composables, без `$reset`)
- **storeToRefs:** деструктуризация → потеря реактивности, actions без обёртки
- **API стора:** `$patch` (объект / функция, атомарно), `$reset`, `$subscribe`, `pinia.use`
- **Тесты и миграция:** `setActivePinia(createPinia())` · Vuex + Pinia вместе, по модулю

## Выбор подхода

- **Client vs server state:** UI (модалки, тема, корзина) vs данные с API (кэш, инвалидация)
- **Связки:** Zustand + TanStack Query, Pinia + VueQuery, RTK + RTK Query
- **Локальное vs глобальное:** `useState` (input, dropdown) vs стор (auth, корзина)
- **Мутабельность:** Pinia (прямая мутация) vs Zustand / Redux (новый объект, Immer)
- **Redux vs Zustand:** строгость, DevTools, легаси vs минимум бойлерплейта, без Provider
- **Антипаттерны:** серверный кэш в сторе, подписка на весь стор, монолитный стор
