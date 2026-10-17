---
title: "Data fetching в Nuxt: useFetch, useAsyncData и $fetch"
section: nuxt
description: "Практика data fetching в Nuxt: useFetch, useAsyncData, $fetch, ключи и дедупликация, SSR-safe fetching, cookies, отмена запросов, кэширование и подвохи на собеседовании."
order: 7
tags: ["data-fetching", "useFetch", "useAsyncData", "$fetch", "ssr", "caching"]
questions:
  - "Чем useFetch отличается от useAsyncData + $fetch и когда что выбирать"
  - "Почему $fetch в setup приводит к двойному запросу, а useFetch — нет"
  - "Как работают ключи в useFetch и useAsyncData: дедупликация и разделяемое состояние"
  - "Как передать cookies и заголовки в API при SSR и в чём здесь подвох"
  - "Чем отличаются await, lazy и immediate и как это влияет на навигацию"
  - "Как отменять запросы и защищаться от гонок в Nuxt"
  - "Почему даты и Map/Set доходят по-разному из payload и из API-роутов"
  - "Как кэшировать данные на клиенте и на сервере в Nuxt"
answers:
  - "`useFetch(url, options)` — сахар над `useAsyncData(key, () => $fetch(url))` для простых GET-запросов; `useAsyncData` нужен для произвольной логики, нескольких источников, кастомного ключа и сторонних query-слоёв, а `$fetch` — императивный HTTP-клиент для обработчиков событий и мутаций."
  - "`$fetch` не переносит состояние с сервера на клиент, поэтому при SSR он выполнится и на сервере, и повторно при гидратации; `useFetch`/`useAsyncData` сериализуют результат в payload, и клиент читает его оттуда без повторного запроса."
  - "Ключ — это идентификатор состояния: `useFetch` генерирует его из URL, опций и места вызова, а `useAsyncData` берёт первый аргумент; один и тот же ключ делает запрос один раз за рендер и разделяет `data`/`error`/`status` между компонентами, но требует согласованных опций (`handler`, `transform`, `pick`, `default`, `deep`, `getCachedData`)."
  - "При SSR внутренний `$fetch` не forwarding-ит cookies браузера (риск SSRF и подмены авторизации): `useFetch` с относительным URL проксирует их сам через `useRequestFetch`, а для `useAsyncData` + `$fetch` нужно вручную обернуть его в `useRequestFetch()` или передать `useRequestHeaders(['cookie'])`."
  - "`await` не меняет серверный HTML, но блокирует выполнение после вызова и клиентскую навигацию до готовности данных; без `await` навигация идёт сразу, а состояние грузится в фоне; `lazy: true` откладывает запрос до монтирования, а `immediate: false` вообще не запускает его до вызова `execute()`."
  - "В `useFetch`/`useAsyncData` отмена управляется автоматически: смена реактивных параметров и `dedupe: 'cancel'` прерывают предыдущий запрос через `signal` из хендлера, а `clear()` и `timeout` отменяют текущий; для императивных запросов используется `AbortController` с `$fetch`."
  - "Payload между сервером и клиентом сериализуется через `devalue` и сохраняет `Date`, `Map`, `Set`, `RegExp` и refs, а ответы серверных API-роутов идут через `JSON.stringify`, поэтому `Date` превращается в строку, `Map`/`Set` — в `{}`, а `BigInt` бросает ошибку; обойти это можно методом `toJSON`."
  - "На клиенте данные держит in-memory кэш Nuxt (чтение через `useNuxtData`, переопределение через `getCachedData`, сброс через `clearNuxtData`/`refreshNuxtData`), а на сервере — `defineCachedEventHandler` и `routeRules` с `cache`/`swr`."
---

# Data fetching в Nuxt: useFetch, useAsyncData и $fetch

Загрузка данных — ядро любого full-stack фреймворка. В Nuxt за это отвечают три инструмента: `useFetch` для декларативных запросов в компонентах, `useAsyncData` для произвольной логики и `$fetch` для императивных вызовов. На первый взгляд выбор прост, но именно здесь кроется больше всего production-багов и вопросов на собеседовании: двойные запросы, hydration mismatch, не та реактивность, потерянные cookies и устаревшие данные в кэше.

В этой статье разберём не только «как вызвать», но и trade-offs: где какой инструмент уместен, как работают ключи и дедупликация, как устроен SSR-safe fetching, почему cookies не долетают до API и как это лечить, как отменять запросы и кэшировать данные. В конце — отдельный разбор типичных подвохов на интервью.

## Содержание

1. [Обзор инструментов для data fetching](#обзор-инструментов-для-data-fetching)
2. [useFetch: практические сценарии](#usefetch-практические-сценарии)
3. [useAsyncData и $fetch: когда что](#useasyncdata-и-fetch-когда-что)
4. [Ключи, дедупликация и разделяемое состояние](#ключи-дедупликация-и-разделяемое-состояние)
5. [SSR-safe fetching и гидратация](#ssr-safe-fetching-и-гидратация)
6. [Заголовки, cookies и авторизация на сервере](#заголовки-cookies-и-авторизация-на-сервере)
7. [Обработка ошибок](#обработка-ошибок)
8. [Отмена запросов и защита от гонок](#отмена-запросов-и-защита-от-гонок)
9. [Ленивый fetching, await и immediate](#ленивый-fetching-await-и-immediate)
10. [Запросы на клиенте](#запросы-на-клиенте)
11. [Кэширование и переиспользование данных](#кэширование-и-переиспользование-данных)
12. [Оптимизация payload и сериализация](#оптимизация-payload-и-сериализация)
13. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
14. [Подвохи на собеседовании](#подвохи-на-собеседовании)
15. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
16. [Заключение](#заключение)
17. [Полезные ссылки](#полезные-ссылки)

---

## Обзор инструментов для data fetching

Nuxt 3 предлагает три основных способа работы с HTTP:

| Инструмент | Назначение | Где использовать |
|---|---|---|
| `useFetch` | Декларативная загрузка данных в `<script setup>` | Страницы и компоненты, простые GET-запросы |
| `useAsyncData` | Обёртка для произвольной асинхронной функции | Сложная логика, несколько источников, кастомный ключ |
| `$fetch` | Императивный HTTP-клиент (ofetch) | Обработчики событий, POST/PUT/DELETE, вызовы из функций |

Связь между ними иерархическая: `useFetch(url, options)` — это почти буквально `useAsyncData(key, () => $fetch(url), options)`, а `useAsyncData` использует `$fetch` для выполнения запроса. Поэтому инструменты не конкурируют, а решают разные задачи.

Правило выбора:

- Нужны данные в компоненте при рендере и SSR — `useFetch`.
- Нужна произвольная логика (несколько запросов, сторонний SDK, кастомный ключ) — `useAsyncData` + `$fetch`.
- Запрос идёт в ответ на действие пользователя или это мутация — `$fetch`.

### Почему нельзя просто `$fetch` в setup

Если вызвать `$fetch` прямо в `<script setup>`, Nuxt выполнит его на сервере при SSR, а затем **повторно на клиенте при гидратации**, потому что `$fetch` не переносит состояние из серверного рендера в браузер. Это лишний сетевой запрос, задержка до интерактивности и возможный hydration mismatch.

```vue
<script setup>
// ❌ При SSR запрос уйдёт дважды: на сервере и снова на клиенте
const data = await $fetch('/api/item')

// ✅ Один запрос на сервере, данные приезжают в payload
const { data } = await useAsyncData('item', () => $fetch('/api/item'))

// ✅ То же самое, короче
const { data } = await useFetch('/api/item')
</script>
```

---

## useFetch: практические сценарии

`useFetch` — самый простой способ загрузить данные: он разрешает URL, выполняет запрос через `$fetch`, добавляет результат в payload и отдаёт реактивные `data`, `status`, `error`.

### Базовый пример

```vue
<!-- pages/users.vue -->
<script setup>
const { data: users, status, error, refresh } = await useFetch('/api/users')
</script>

<template>
  <div>
    <p v-if="status === 'pending'">Загрузка...</p>
    <p v-else-if="error">Ошибка: {{ error.message }}</p>
    <ul v-else>
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>
    <button @click="refresh()">Обновить</button>
  </div>
</template>
```

### Возвращаемые поля

| Поле | Описание |
|---|---|
| `data` | Реактивные данные; до загрузки — `undefined` (или значение из `default`). |
| `status` | `idle` \| `pending` \| `success` \| `error` — полный статус запроса. |
| `pending` | `true`, пока идёт запрос (производное от `status`). |
| `error` | Объект ошибки или `undefined`. |
| `refresh` / `execute` | Функция повторного запуска. `execute` — семантический алиас для отложенных запросов. |
| `clear` | Сбрасывает `data`, `error`, `status` и отменяет активный запрос. |

Обратите внимание: `data` — это `undefined` до завершения, а не пустой массив. Если рендерить `v-for` по `data` без проверки `status`, получите ошибку. Решается опцией `default`.

### Ключевые опции

```ts
await useFetch('/api/users', {
  method: 'GET',
  key: 'users',            // явный ключ для разделяемого состояния (см. раздел о ключах)
  lazy: false,             // true — не блокировать навигацию
  server: true,            // выполнять ли запрос на сервере при SSR
  immediate: true,         // false — не запускать до execute()
  default: () => [],       // значение data до загрузки
  transform: (data) => data.map(normalizeUser),
  pick: ['id', 'name'],    // оставить в payload только эти поля
  dedupe: 'cancel',        // политика при повторном запуске: cancel | defer
  timeout: 10_000,         // (v4.2+) таймаут запроса в мс
  watch: [page],           // перезапуск при изменении зависимостей
})
```

### Реактивные параметры: три разных механизма

Здесь чаще всего путаются. Есть три способа перезапустить запрос, и работают они по-разному.

**1. Реактивный `query` — автоматический watch.** Все опции fetch могут быть `ref`/`computed`, и Nuxt сам следит за ними:

```vue
<script setup>
const page = ref(1)

// page реактивен → при изменении запрос перезапустится автоматически
const { data: posts, status } = await useFetch('/api/posts', {
  query: { page },
})

function nextPage() {
  page.value++
}
</script>
```

**2. Computed URL — когда URL собирается из реактивных значений:**

```vue
<script setup>
const route = useRoute()

// URL пересобирается при каждом изменении route.params.id
const { data: user } = await useFetch(() => `/api/users/${route.params.id}`)
</script>
```

**3. Опция `watch` — для «внешних» зависимостей.** Важный подвох: `watch` **не меняет URL**, он лишь перезапускает уже построенный запрос. Так делать неправильно:

```vue
<script setup>
const id = ref(1)

// ❌ watch перезапустит запрос, но URL уже зафиксирован на /api/users/1
const { data } = await useFetch(`/api/users/${id.value}`, { watch: [id] })
</script>
```

Нужен computed URL или реактивный `query`. А `watch: false` полностью отключает автоматический перезапуск при изменении реактивных опций.

### Практический сценарий: поиск с debounce

Опции `debounce` у `useFetch` нет — задержку делают на уровне реактивного источника (например, через `refDebounced` из VueUse):

```vue
<script setup>
import { refDebounced } from '@vueuse/core'

const search = ref('')
const debouncedSearch = refDebounced(search, 300)

// запрос уходит только после паузы ввода
const { data: results, status } = await useFetch('/api/search', {
  query: { q: debouncedSearch },
})
</script>
```

### Практический сценарий: зависимые запросы и waterfall

Последовательные `await useFetch` выполняются по очереди — каждый ждёт предыдущий:

```vue
<script setup>
const route = useRoute()

// 1) курс, 2) только потом уроки — два последовательных round-trip
const { data: course } = await useFetch(`/api/courses/${route.params.id}`)
const { data: lessons } = await useFetch(`/api/courses/${route.params.id}/lessons`)
</script>
```

Trade-off: если второй запрос не зависит от *данных* первого, а только от тех же параметров, такое последовательное ожидание — лишний waterfall. Независимые запросы лучше объединить в один `useAsyncData` с `Promise.all` (см. следующий раздел), чтобы они шли параллельно.

### Когда использовать useFetch

- URL известен на этапе setup.
- Нужен SSR-safe data fetching с минимумом boilerplate.
- Не требуется тонкий контроль над логикой запроса.

---

## useAsyncData и $fetch: когда что

`useAsyncData` даёт больше контроля: принимает произвольную функцию-хендлер и даёт доступ к `signal` для отмены. Внутри обычно используется `$fetch`.

### Базовый пример

```vue
<script setup>
const { data, error } = await useAsyncData('users', () => $fetch('/api/users'))
</script>
```

### Когда useFetch не подходит

Если CMS или сторонний сервис предоставляет собственный query-слой (SDK, GraphQL-клиент, ORM), `useFetch` неудобен. `useAsyncData` позволяет обернуть любой вызов и всё равно получить преимущества payload и гидратации:

```vue
<script setup>
// Пример: свой query-слой вместо $fetch
const { data, error } = await useAsyncData('users', () => cms.getUsers())
</script>
```

### Комбинирование нескольких запросов

Независимые запросы запускаются параллельно через `Promise.all`, а `signal` из хендлера делает их отменяемыми:

```vue
<script setup>
const { data: dashboard } = await useAsyncData('dashboard', async (_nuxtApp, { signal }) => {
  const [users, orders] = await Promise.all([
    $fetch('/api/users', { signal }),
    $fetch('/api/orders', { signal }),
  ])

  return { users, orders }
})
// dashboard.value.users, dashboard.value.orders
</script>
```

Такой вариант предпочтительнее двух последовательных `useFetch`: один ключ, один lifecycle, параллельная загрузка.

### Хендлер должен быть без побочных эффектов

`useAsyncData` создан для загрузки и кэширования данных, а не для побочных действий. Нельзя вкладывать в него вызовы Pinia-экшенов или мутации — это приводит к непредсказуемым повторным выполнениям. Для побочных эффектов есть `callOnce`:

```vue
<script setup>
const offersStore = useOffersStore()

// ❌ побочный эффект внутри data-composable
// await useAsyncData(() => offersStore.getOffer(route.params.slug))

// ✅ для побочных эффектов
await callOnce(() => offersStore.loadIfNeeded())
</script>
```

Ещё нюанс: хендлер обязан возвращать truthy-значение. Если вернуть `undefined` или `null`, запрос может продублироваться на клиенте.

### $fetch vs fetch

`$fetch` — обёртка над `ofetch`. Она даёт:

- Автоматический парсинг JSON и stringify тела.
- Интерцепторы запроса/ответа (`onRequest`, `onResponseError` и др.).
- Отмену через `AbortController` / `signal`.
- Одинаковый API на сервере и клиенте.
- Инстансы: `$fetch.create({ baseURL, headers })` и `$fetch.raw(url)` (полный ответ с заголовками).

```ts
// $fetch в обработчике события
async function submitForm(values) {
  const result = await $fetch('/api/contact', {
    method: 'POST',
    body: values,
  })
}
```

### Разница между useFetch и useAsyncData

| | `useFetch` | `useAsyncData` |
|---|---|---|
| Синтаксис | `useFetch(url, options)` | `useAsyncData(key, fetcher)` |
| URL | Передаётся первым аргументом | Задаётся внутри хендлера |
| Реактивный URL | Да, автоматически | Вручную через `watch`/computed key |
| Гибкость | Меньше | Больше: несколько запросов, свой query-слой |
| Когда использовать | Простые GET-запросы | Сложная логика, несколько источников, кастомные ключи |

---

## Ключи, дедупликация и разделяемое состояние

Ключ — центральное понятие обоих composables. Он определяет, когда запросы дедуплицируются, какие компоненты делят состояние и что попадает в payload.

### Как формируются ключи

- **`useFetch`** генерирует ключ из **URL + опций + места вызова в исходниках**. Следствие: два `useFetch` с одним URL, но в разных компонентах — это **разные ключи и два отдельных запроса**. Если URL и опции совпадают, но это разные места в коде — тоже разные запросы.
- **`useAsyncData`** берёт первым аргументом строку-ключ. Если первый аргумент — функция, ключ генерируется автоматически по файлу и номеру строки.

```vue
<!-- ComponentA.vue -->
<script setup>
// ключ = авто (A) → отдельный запрос
const { data } = await useFetch('/api/random')
</script>
```

Чтобы **разделить** данные между компонентами, нужно передать одинаковый явный ключ:

```vue
<!-- ComponentA.vue и ComponentB.vue -->
<script setup>
// общий ключ → один запрос, общие data/error/status
const { data } = await useFetch('/api/random', { key: 'random' })
</script>
```

### Разделяемое состояние и согласованность опций

Один ключ — общие `data`, `error`, `status`, `pending`. Это накладывает ограничения: часть опций **обязана совпадать** во всех вызовах с этим ключом, иначе Nuxt покажет предупреждение в dev.

| Обязаны совпадать | Могут отличаться |
|---|---|
| `handler`, `transform`, `pick`, `default` | `server`, `lazy`, `immediate` |
| `deep`, `getCachedData`, `middleware` | `dedupe`, `watch`, `enabled`, `serialize` |

Нужны независимые экземпляры — используйте разные ключи.

### Реактивные ключи

Ключ может быть `ref`, `computed` или геттером — при изменении данные перезапрашиваются, а старое состояние очищается, если на него больше никто не подписан:

```ts
const userId = ref('123')

const { data: user } = useAsyncData(
  computed(() => `user-${userId.value}`),
  () => fetchUser(userId.value),
)

userId.value = '456' // данные перезапрашиваются под новый ключ
```

### Дедупликация при повторном запуске: `dedupe`

По умолчанию `dedupe: 'cancel'`: новый запуск **отменяет** предыдущий незавершённый запрос. Это то, что защищает от гонок при быстрой смене параметров. `dedupe: 'defer'` вместо отмены дождётся предыдущего запроса и выполнит последний:

```ts
const { data } = await useFetch('/api/search', {
  query: { q },
  dedupe: 'defer', // не отменять, а дождаться и выполнить последний
})
```

### Подвох с кастомными composables

Если обернуть `useAsyncData` в собственный composable без явного ключа, автоматический ключ будет одинаковым для всех мест вызова этого composable — состояния «склеятся». В своих composables **всегда задавайте ключ явно**:

```ts
export function useCurrentUser() {
  return useAsyncData('current-user', () => $fetch('/api/me'))
}
```

---

## SSR-safe fetching и гидратация

Главная причина существования `useFetch`/`useAsyncData` — корректная работа на сервере и клиенте без двойной загрузки.

### Как это работает на сервере

1. Nitro получает запрос.
2. Vue рендерит компонент и выполняет `useFetch`.
3. Внутренний `$fetch` на сервере **вызывает функцию API-роута напрямую**, без сетевого запроса (эмуляция).
4. Результат сериализуется в payload (`__NUXT__`).
5. Клиент получает HTML с готовыми данными и читает их из payload вместо повторного запроса.

### Что реально меняет `await`

Распространённое заблуждение, что без `await` данные не попадут в серверный HTML. На сервере Nuxt **в любом случае** дожидается результата (через `<Suspense>` и `onServerPrefetch`), поэтому HTML всегда приходит с данными. `await` влияет на другое:

| | С `await` | Без `await` |
|---|---|---|
| Код после вызова | ждёт готовности `data` | выполняется сразу, `data` пока `undefined` |
| Клиентская навигация | блокируется до готовности данных | происходит сразу, состояние грузится в фоне |
| Ответственность | ни на чём | обработка `status`/`error` на вас |

### Дедупликация при SSR

Если несколько компонентов вызывают `useAsyncData` с одинаковым ключом, запрос выполняется один раз за рендер — это важно для SSR.

### Hydration mismatch

Если серверный и клиентский HTML расходятся, Vue выдаёт предупреждение о hydration mismatch. Причины при data fetching:

- Недетерминированный хендлер: `Date.now()`, `Math.random()`, чтение `window`/`localStorage`.
- Данные, которые на сервере есть, а на клиенте нет (и наоборот) — например, `server: false`.
- Разные query-параметры на сервере и клиенте.

Держите хендлер детерминированным, а клиентские вещи прячьте в `onMounted`, `<ClientOnly>` или `onNuxtReady`.

### Когда запрос выполняется только на клиенте

- `ssr: false` в `nuxt.config.ts`/`routeRules`.
- Опция `server: false`.
- Запрос внутри обработчика события, а не в setup.
- Компонент обёрнут в `<ClientOnly>`.

---

## Заголовки, cookies и авторизация на сервере

Один из самых частых подвохов. В браузере `$fetch` автоматически отправляет cookies. При SSR всё иначе: из соображений безопасности (SSRF и подмена авторизации) внутренний `$fetch` **не включает cookies браузера и не прокидывает `Set-Cookie` из ответа**.

### useFetch проксирует headers сам, а $fetch — нет

`useFetch` с **относительным** URL на сервере автоматически использует `useRequestFetch`, который проксирует заголовки и cookies клиента (кроме тех, что проксировать нельзя, например `host`):

```vue
<script setup>
// на сервере Nuxt сам проксирует cookies в /api/echo
const { data } = await useFetch('/api/echo')
</script>
```

А вот `useAsyncData` + чистый `$fetch` так **не делает** — cookies нужно прокинуть вручную:

```vue
<script setup>
// ✅ проксируем заголовки и cookies вручную
const requestFetch = useRequestFetch()
const { data } = await useAsyncData(() => requestFetch('/api/cookies'))

// либо точечно — только cookie
const headers = useRequestHeaders(['cookie'])
const { data: me } = await useAsyncData(() => $fetch('/api/me', { headers }))
</script>
```

### Опасные заголовки

Не проксируйте всё подряд на внешние API. Заголовки, которые передавать нельзя: `host`, `accept`, `content-length`, `content-md5`, `content-type`, `x-forwarded-host`, `x-forwarded-port`, `x-forwarded-proto`, `cf-connecting-ip`, `cf-ray`.

### Обратный проксинг: Set-Cookie к клиенту

Если внутренний запрос устанавливает cookie, которую нужно отдать браузеру, это делается вручную:

```ts
import { appendResponseHeader } from 'h3'
import type { H3Event } from 'h3'

export const fetchWithCookie = async (event: H3Event, url: string) => {
  const res = await $fetch.raw(url)
  for (const cookie of res.headers.getSetCookie()) {
    appendResponseHeader(event, 'set-cookie', cookie)
  }
  return res._data
}
```

### Практический вывод для авторизации

Токен в `localStorage` недоступен на сервере, поэтому SSR-авторизация строится на **cookie**: `useFetch('/api/me')` на сервере доедет до API с cookie пользователя, а на клиенте — тоже. Это делает защищённые страницы корректными и при SSR, и при гидратации.

---

## Обработка ошибок

Nuxt предоставляет несколько уровней обработки ошибок при data fetching.

### Локальная обработка через error

```vue
<script setup>
const { data, status, error } = await useFetch('/api/users')
</script>

<template>
  <div>
    <p v-if="status === 'pending'">Загрузка...</p>
    <p v-else-if="error">{{ error.statusCode }}: {{ error.message }}</p>
    <ul v-else>
      <li v-for="user in data" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>
```

Важное отличие: `$fetch` **бросает** ошибку, а `useFetch`/`useAsyncData` её **перехватывают** и кладут в `error`. Поэтому `try/catch` вокруг `useFetch` не нужен, а вокруг `$fetch` — нужен. У ошибки `$fetch` (ofetch) доступны `status`, `statusText`, `data`; у `NuxtError` из `useFetch` — `statusCode`, `statusMessage`, `message`, `data`.

### Ошибки на стороне API

В серверных обработчиках используйте `createError`, чтобы отдать осмысленную ошибку и корректный HTTP-код:

```ts
// server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const user = findUserById(id)

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден',
      data: { resource: 'user', id },
    })
  }

  return user
})
```

Поле `data` долетает до клиента в `error.data` — удобно для кодов валидации.

### Глобальная обработка: своя реализация $fetch

Интерцепторы удобно собирать в плагине с отдельным инстансом `$fetch`, который затем используется в приложении или в кастомном `useFetch`:

```ts
// plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      const token = useCookie('token').value
      if (token) options.headers.set('Authorization', `Bearer ${token}`)
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    },
  })

  nuxtApp.provide('api', api)
})
```

Для редкого случая — централизованного редиректа при 401 — подойдёт и общий `createUseFetch` с предустановленными `baseURL` и авторизацией.

### Показ страницы ошибки

На клиенте можно прервать рендер и показать `error.vue`:

```ts
// throw останавливает выполнение, showError — нет
throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })
```

Подробнее про `error.vue`, `showError`/`throwError` и `clearError` — в статье «Обработка ошибок в Nuxt 3».

---

## Отмена запросов и защита от гонок

Отмена нужна, чтобы избежать гонок и лишней работы при быстрой смене фильтров, страниц или уходе со страницы.

### Отмена в useFetch и useAsyncData

Эти composables управляют жизненным циклом сами. Хендлер получает `signal` вторым аргументом — передавайте его в `$fetch`, чтобы запрос был отменяемым:

```ts
const { data, refresh, clear } = await useAsyncData('users', (_nuxtApp, { signal }) =>
  $fetch('/api/users', { signal }),
)
```

`signal` срабатывает, когда:

- выполняется новый запрос с `dedupe: 'cancel'`;
- вызывается `clear()`;
- превышен `timeout`.

При смене реактивных параметров (`query`, computed URL, `watch`) предыдущий запрос отменяется автоматически, поэтому явный `AbortController` внутри `useFetch`/`useAsyncData` обычно не нужен. Можно и вручную отменить конкретный `refresh`, передав свой сигнал:

```ts
const controller = new AbortController()
refresh({ signal: controller.signal })
controller.abort() // отменяет конкретный refresh
```

### Ручная отмена с $fetch и AbortController

Для императивных запросов используйте `AbortController` и проверку типа ошибки:

```vue
<script setup>
let controller

async function search(query) {
  controller?.abort()
  controller = new AbortController()

  try {
    return await $fetch('/api/search', {
      query: { q: query },
      signal: controller.signal,
    })
  } catch (error) {
    if (isAbortError(error)) return // отмена — не настоящая ошибка
    throw error
  }
}
</script>
```

### Практический сценарий: гонка при быстром вводе

Классическая гонка: пользователь быстро меняет фильтр, и ответ на старый запрос приходит позже ответа на новый — в UI попадают устаревшие данные. В Nuxt это лечится реактивным `query` (дефолтный `dedupe: 'cancel'` отменяет предыдущий запрос) — отдельный код не нужен:

```vue
<script setup>
const filters = reactive({ city: 'Москва', type: 'flat' })

const { data } = await useFetch('/api/listings', {
  query: filters, // при изменении любого поля предыдущий запрос отменяется
})
</script>
```

---

## Ленивый fetching, await и immediate

По умолчанию `useFetch`/`useAsyncData` блокируют навигацию до завершения запроса. Это хорошо для SEO и критичных данных, но плохо для второстепенных блоков.

### useLazyFetch и useLazyAsyncData

```vue
<script setup>
const { status, data: posts } = useLazyFetch('/api/posts')
</script>

<template>
  <div>
    <h1>Блог</h1>
    <p v-if="status === 'pending'">Загрузка постов...</p>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>
```

`lazy: true` откладывает запрос до монтирования компонента и не блокирует навигацию: страница рендерится сразу, данные подгружаются после.

### Отложенный запуск: immediate: false

Если запрос должен стартовать по действию пользователя, используйте `immediate: false` и `execute()`; `status` при этом равен `idle`:

```vue
<script setup>
const { data, execute, status } = await useFetch('/api/report', {
  immediate: false,
})

async function loadReport() {
  await execute()
}
</script>
```

### Сводная таблица

| Вариант | Блокирует навигацию | Когда запускается | Управление состоянием |
|---|---|---|---|
| `await useFetch` | Да | сразу в setup | `await` даёт готовые данные |
| без `await` | Нет | сразу в setup | сами через `status`/`error` |
| `lazy: true` / `useLazyFetch` | Нет | при монтировании | сами через `status`/`error` |
| `immediate: false` | — | вручную `execute()` | `status: 'idle'` до запуска |

### Подвох: `await` + `lazy`

Это независимые вещи, и вместе они ведут себя неочевидно. На сервере `await useLazyFetch(...)` всё равно дождётся данных и заблокирует серверный рендер, а вот при **клиентской навигации** `await` разрешится немедленно, не дожидаясь запроса — `data` останется дефолтной, а состояние нужно отслеживать через `status`.

```vue
<script setup>
// ⚠️ на клиенте await не дождётся данных — это lazy
const { data, status } = await useLazyFetch('/api/posts')
</script>
```

Если нужно дождаться данных и заблокировать навигацию — уберите `lazy`, а не полагайтесь на `await`.

---

## Запросы на клиенте

Не все запросы должны выполняться на сервере.

### $fetch в обработчиках событий

```vue
<script setup>
async function createUser(formData) {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: formData,
  })

  await navigateTo(`/users/${user.id}`)
}
</script>
```

### useFetch с server: false

```vue
<script setup>
const { data } = await useFetch('/api/analytics', {
  server: false,
})
</script>
```

Подвох: при `server: false` данные **не** загружаются до завершения гидратации, поэтому даже `await useFetch(...)` на клиенте на первом рендере вернёт `data === undefined`. Первый рендер работает с дефолтом, и `status` нужно обрабатывать. Зато при последующих клиентских переходах такие запросы дожидаются до загрузки страницы.

### Когда выполнять запросы на клиенте

- Запросы, зависящие от браузерных API: `localStorage`, `navigator.geolocation`.
- Чувствительные данные, которые не должны попадать в SSR-HTML и payload.
- Аналитика и персонализация на основе клиентского состояния.
- POST/PUT/DELETE в ответ на действия пользователя.

---

## Кэширование и переиспользование данных

### In-memory кэш и useNuxtData

`useFetch`/`useAsyncData` держат состояние в памяти клиентского приложения по ключу. Достать его из другого места можно через `useNuxtData(key)`:

```ts
const { data: cached } = useNuxtData('users')
```

### getCachedData

По умолчанию `getCachedData` при гидратации читает `nuxtApp.payload.data[key]`, а после — `nuxtApp.static.data[key]` (последнее работает только с `experimental.payloadExtraction`). Практический рецепт: чтобы при клиентской навигации (например, «назад») не перезапрашивать данные, переопределите чтение на payload:

```ts
const { data } = await useFetch('/api/posts', {
  key: 'posts',
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
})
```

Trade-off: так данные могут «застыть» и оказаться устаревшими. Кэш стоит применять для редко меняющихся данных, а для критичных — оставлять перезапрос.

### Глобальный сброс: refreshNuxtData и clearNuxtData

```ts
// перезапросить всё (или по ключу)
await refreshNuxtData()
await refreshNuxtData('users')

// очистить кэш и разрушить связанные refs
clearNuxtData('users')
```

Типичный сценарий: после мутации (`$fetch` POST) сбросить связанный кэш — `await refreshNuxtData('users')` — вместо ручного `refresh()` в каждом компоненте.

### Кэширование на сервере

Тяжёлые и редко меняющиеся данные кэшируют в Nitro:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/posts': { swr: 60 },        // stale-while-revalidate: отдать старое, обновить в фоне
    '/api/static-data': { cache: { maxAge: 60 * 5 } },
  },
})
```

Либо точечно — через `defineCachedEventHandler`(подробнее — в статье про Nitro).

---

## Оптимизация payload и сериализация

### pick, transform и deep

`pick` оставляет в payload только нужные поля, `transform` преобразует данные после получения:

```ts
const { data: mountains } = await useFetch('/api/mountains', {
  pick: ['title', 'description'],
})

const { data: users } = await useFetch('/api/users', {
  transform: (users) => users.map(u => ({ id: u.id, name: u.name })),
})
```

Важно понимать trade-off: `pick` и `transform` **не уменьшают сам запрос** — сервер всё равно отдаёт полный объект. Они уменьшают только payload, передаваемый из сервера в клиент в HTML. То есть `transform` можно (и нужно) использовать и на клиентских запросах — он просто приводит данные к нужной форме.

Опция `deep` по умолчанию `false`: данные возвращаются в shallow ref ради производительности. Если нужна глубокая реактивность — включайте `deep: true`, но помните, что это дороже и должно совпадать у всех вызовов с общим ключом.

### Сериализация payload с сервера

Данные, которые `useAsyncData` переносит в payload, сериализуются через `devalue`, поэтому переживают передачу не только примитивы, но и `Date`, `Map`, `Set`, `RegExp`, а также `ref`/`reactive` и `NuxtError`.

### Подвох: payload vs API-роуты

А вот ответы **серверных API-роутов** (`server/api/*`), которые вы получаете через `$fetch`/`useFetch`, сериализуются обычным `JSON.stringify`. Последствия:

- `Date` превращается в строку (тип на клиенте — `string`, не `Date`);
- `Map` и `Set` становятся `{}`;
- `undefined` в объекте отбрасывается;
- `BigInt` бросает ошибку.

```ts
// server/api/foo.ts
export default defineEventHandler(() => new Date())
```

```vue
<script setup>
// тип data выведется как string, хотя на сервере был Date
const { data } = await useFetch('/api/foo')
</script>
```

Обойти конверсию можно методом `toJSON` (Nuxt уважает его возвращаемый тип) или вернуть строку, сериализованную сторонней библиотекой (`superjson`), и распарсить её в `transform`.

### Не кладите секреты в payload

Всё, что попадает в `useAsyncData`/`useState`, оказывается в HTML payload, доступном пользователю. Не передавайте туда токены, приватные ключи и любые секреты.

---

## Лучшие практики и антипаттерны

### Делайте

- Используйте `useFetch` для декларативной загрузки в setup, а `$fetch` — для событий и мутаций.
- Объединяйте независимые запросы одним `useAsyncData` с `Promise.all`.
- Задавайте явные ключи в `useAsyncData` и в собственных composables.
- Передавайте `signal` в `$fetch` внутри хендлера, чтобы запрос был отменяемым.
- Используйте реактивный `query`/computed URL — не пытайтесь менять URL через `watch`.
- Прокидывайте cookies на сервере через `useRequestFetch`/`useRequestHeaders`.
- Применяйте `pick`/`transform` для уменьшения payload и приведения данных к форме.
- Обрабатывайте `status` и `error` состояния.
- Для второстепенных данных — `useLazyFetch`, для действий пользователя — `immediate: false`.
- Кэшируйте тяжёлые серверные роуты через `routeRules` или `defineCachedEventHandler`.

### Не делайте

- Не используйте `$fetch` напрямую в `<script setup>` для начальной загрузки — это двойной запрос и отсутствие payload.
- Не вызывайте `useFetch`/`useAsyncData` после первого `await` в setup — теряется Nuxt-контекст; для императивных запросов берите `$fetch`.
- Не полагайтесь на то, что два `useFetch` с одним URL в разных компонентах разделят данные — ключи разные.
- Не вкладывайте побочные эффекты (Pinia-экшены, мутации) в хендлер `useAsyncData` — для этого есть `callOnce`.
- Не используйте `useFetch` для мутаций POST/PUT/DELETE.
- Не proxируйте все заголовки на внешние API — только необходимые.
- Не отдавайте секреты в payload.
- Не кэшируйте пользовательские данные без корректного ключа и стратегии инвалидации.

---

## Подвохи на собеседовании

Список вопросов-ловушек, которые чаще всего проверяют глубину понимания.

**1. Почему `$fetch` в setup делает двойной запрос, а `useFetch` — нет?**
`$fetch` не переносит состояние с сервера на клиент, поэтому при гидратации выполняется снова. `useFetch`/`useAsyncData` сериализуют результат в payload, и клиент читает его оттуда.

**2. `useFetch` — это что под капотом?**
Сахар: `useFetch(url, options)` ≈ `useAsyncData(key, () => $fetch(url), options)`. Именно поэтому у них одинаковые возвращаемые значения и набор опций.

**3. Разделят ли данные два `useFetch` с одним URL в разных компонентах?**
Нет. Автоключ `useFetch` включает URL, опции **и место вызова**. Разные компоненты → разные ключи → два запроса. Чтобы разделить — одинаковый явный `key`.

**4. `watch: [id]` изменит URL запроса?**
Нет. `watch` только перезапускает запрос, URL уже построен при вызове. Для динамического URL нужен computed URL или реактивный `query`.

**5. `await useFetch` и `useFetch` без `await` — в чём разница при SSR?**
В серверном HTML — ни в чём: Nuxt дожидается данных в обоих случаях. Разница в клиентской навигации и в коде после вызова.

**6. Что будет, если `await`-ить `useLazyFetch`?**
На сервере он всё равно заблокирует рендер, а на клиентской навигации `await` разрешится сразу, не дожидаясь данных — `data` будет дефолтной. Так делать не нужно.

**7. Почему cookies не доходят до API при SSR?**
Внутренний `$fetch` на сервере по соображениям безопасности не forwarding-ит cookies. `useFetch` с относительным URL проксирует их сам через `useRequestFetch`, а `useAsyncData` + `$fetch` требует ручной передачи `useRequestFetch()`/`useRequestHeaders(['cookie'])`.

**8. Как отменяется предыдущий запрос при быстрой смене фильтра?**
Смена реактивных параметров и `dedupe: 'cancel'` (по умолчанию) отменяют предыдущий запрос через `signal`, если хендлер его пробрасывает в `$fetch`.

**9. Чем `dedupe: 'cancel'` отличается от `'defer'`?**
`cancel` прерывает предыдущий незавершённый запрос и запускает новый; `defer` ждёт его завершения и затем выполняет последний.

**10. Что происходит с `Date` при передаче через payload и через API-роут?**
Через payload (`useAsyncData`) `Date` сохраняется благодаря `devalue`. Через API-роут — превращается в строку, потому что там `JSON.stringify` (`Map`/`Set` → `{}`, `BigInt` → ошибка).

**11. Обязан ли хендлер `useAsyncData` что-то возвращать?**
Да, truthy-значение. Возврат `undefined`/`null` может привести к дублированию запроса на клиенте.

**12. Можно ли использовать `useFetch` для POST?**
Технически да, но не нужно: `useFetch` рассчитан на идемпотентные запросы, мутации выполняйте через `$fetch` в обработчике события.

---

## Ключевые тезисы для интервью

- `useFetch` — сахар над `useAsyncData` + `$fetch`; `$fetch` в setup даёт двойной запрос, а composables переносят данные через payload и не повторяют запрос при гидратации.
- `await` не меняет серверный HTML (Nuxt ждёт данные всегда), но определяет поведение кода после вызова и клиентскую навигацию; `lazy` и `immediate: false` — это отдельные флаги, а не то же самое.
- Ключ определяет дедупликацию, разделяемое состояние и кэш: `useFetch` строит его из URL, опций и места вызова, поэтому для общего состояния нужен явный `key`, а опции с одинаковым ключом должны совпадать.
- При SSR внутренний `$fetch` не прокидывает cookies из соображений безопасности: `useFetch` с относительным URL проксирует их автоматически, а `useAsyncData` + `$fetch` — только через `useRequestFetch`.
- Отмена управляется `signal`: смена реактивных параметров и `dedupe: 'cancel'` прерывают предыдущий запрос; `dedupe: 'defer'` дожидается и выполняет последний, что защищает от гонок.
- Payload сериализуется через `devalue` (Date/Map/Set/RegExp сохраняются), а API-роуты — через `JSON.stringify` (Date → строка, Map/Set → `{}`, BigInt → ошибка).
- Клиентское кэширование строится на ключах (`useNuxtData`, `getCachedData`, `refreshNuxtData`/`clearNuxtData`), серверное — на `routeRules` и `defineCachedEventHandler`.

---

## Заключение

Выбор инструмента в Nuxt — это выбор точки на шкале контроля: `useFetch` для простых декларативных запросов, `useAsyncData` для сложной логики и сторонних query-слоёв, `$fetch` для императивных вызовов и мутаций.

Глубина приходит из понимания механики: ключи и дедупликация, payload и сериализация, реактивный `query` против `watch`, отмена через `signal`, проксинг cookies при SSR и кэширование. Именно на этих деталях ломаются production-приложения и строятся вопросы на собеседовании.

Практический совет: возьмите свой реальный сценарий — пагинацию с фильтрами или авторизованную страницу — и прогоните его через все режимы (`lazy`, `server: false`, реактивный `query`) с включённым Nuxt DevTools (вкладка Payload). Наблюдение за тем, что реально уезжает в payload и когда уходят запросы, закрепляет материал лучше любого чтения.

---

## Полезные ссылки

- [Nuxt Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) — официальное руководство по загрузке данных
- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) — API reference
- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) — API reference
- [$fetch](https://nuxt.com/docs/api/utils/dollarfetch) — API reference
- [useRequestFetch](https://nuxt.com/docs/api/composables/use-request-fetch) — проксирование заголовков и cookies
- [ofetch](https://github.com/unjs/ofetch) — HTTP-клиент, лежащий в основе `$fetch`
- [Nuxt Server Directory](https://nuxt.com/docs/guide/directory-structure/server) — серверные роуты и API
