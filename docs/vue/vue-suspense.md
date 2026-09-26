---
title: "Suspense и async setup"
section: vue
description: "Работа с асинхронными компонентами во Vue 3: <Suspense>, async setup(), fallback, вложенные границы, события Suspense, связь с обработкой ошибок и SSR."
order: 9
tags: ["vue", "vue3", "suspense", "async-setup", "defineAsyncComponent", "fallback", "lazy-loading", "ssr", "error-handling"]
questions:
  - "Какую проблему решает <Suspense> и чем он отличается от ручного флага loading"
  - "Как сделать компонент асинхронным через async setup или defineAsyncComponent"
  - "Что произойдёт, если асинхронный компонент оказаться вне <Suspense>"
  - "Как работает fallback и когда он скрывается"
  - "Какие события эмитит <Suspense> и зачем они нужны"
  - "Как устроены вложенные границы Suspense"
  - "Как обрабатывать ошибки в асинхронных компонентах"
  - "Как Suspense в Vue отличается от Suspense в React"
  - "Какие ограничения есть у Suspense в Vue 3"
---

# Suspense и async setup

Многие интерфейсы не могут отрисоваться без предварительной загрузки данных: профиль пользователя, дашборд, страница товара. В простых случаях разработчик добавляет в компонент флаг `loading`, самостоятельно следит за ошибками и вручную рендерит спиннер. С ростом приложения такой код размножается, превращаясь в однотипный бойлерплейт.

Во Vue 3 для этой задачи есть встроенный компонент `<Suspense>`. Он позволяет **декларативно** указать, что поддерево содержит асинхронные зависимости, и отобразить запасное содержимое — `fallback` — пока эти зависимости не разрешатся. В статье разберём, как работает `<Suspense>` с асинхронным `setup()`, с `defineAsyncComponent`, как устроены вложенные границы, как обрабатывать ошибки и чем это похоже или не похоже на React Suspense.

## Содержание

1. [Что такое Suspense и зачем нужен](#что-такое-suspense-и-зачем-нужен)
2. [Асинхронный `setup()`](#асинхронный-setup)
3. [Базовое использование `<Suspense>`](#базовое-использование-suspense)
4. [`fallback` и правила рендера](#fallback-и-правила-рендера)
5. [События `<Suspense>`](#события-suspense)
6. [Вложенные границы Suspense](#вложенные-границы-suspense)
7. [`defineAsyncComponent` и Suspense](#defineasynccomponent-и-suspense)
8. [Обработка ошибок](#обработка-ошибок)
9. [Suspense и SSR](#suspense-и-ssr)
10. [Сравнение с React Suspense](#сравнение-с-react-suspense)
11. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Suspense и зачем нужен

`<Suspense>` — это специальный встроенный компонент Vue 3, который ждёт разрешения асинхронных зависимостей в своём поддереве и показывает fallback, пока идёт загрузка. Он не загружает данные сам: он лишь **координирует** состояние компонентов, которые уже что-то асинхронно делают.

Что считается асинхронной зависимостью:

| Источник | Пример |
|---|---|
| Асинхронный `setup()` | `async setup() { const data = await fetchData(); return { data }; }` |
| Асинхронный `<script setup>` | `<script setup>` с `await` на верхнем уровне |
| Асинхронный компонент | `defineAsyncComponent(() => import('./Heavy.vue'))` |

Без `<Suspense>` асинхронный компонент должен был бы сам управлять состоянием загрузки. С `<Suspense>` логика "пока не готово — покажи спиннер" выносится на уровень родителя и применяется к целому поддереву.

### Проблема ручного управления loading

Рассмотрим классический подход без Suspense:

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const props = defineProps({ userId: Number });

const user = ref(null);
const loading = ref(false);
const error = ref(null);

watchEffect(async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/users/${props.userId}`);
    user.value = await res.json();
  } catch (e) {
    error.value = e;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error">Ошибка: {{ error.message }}</p>
    <div v-else>
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    </div>
  </div>
</template>
```

Проблемы:

1. **Бойлерплейт.** `loading`, `error`, ручная очистка — в каждом компоненте.
2. **Состояние гонки.** При быстрой смене `userId` старый ответ может прийти позже нового. В примере выше `user.value` перезаписывается, и последовательность ответов может привести к несоответствию.
3. **Разрозненный UI.** Каждый компонент рисует свой спиннер в своём углу. Нет единой точки управления.
4. **Waterfall на уровне компонентов.** Родитель ждёт свои данные, рендерит дочерний компонент, тот начинает свою загрузку.

`<Suspense>` решает первые три проблемы, частично помогает и с четвёртой, если начинать загрузку до монтирования дочерних компонентов.

---

## Асинхронный `setup()`

В Composition API функция `setup()` может быть асинхронной. Если `setup()` возвращает `Promise`, Vue считает компонент асинхронным и требует, чтобы он находился внутри `<Suspense>`.

### Явный `setup()`

```vue
<script>
import { ref } from 'vue';

export default {
  async setup() {
    const res = await fetch('/api/user');
    const user = await res.json();

    const count = ref(0);

    return { user, count };
  },
};
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
    <button @click="count++">{{ count }}</button>
  </div>
</template>
```

В этом примере компонент приостановится до тех пор, пока `fetch` не завершится. Пока идёт загрузка, `<Suspense>` покажет `fallback`.

### `<script setup>` с `await`

В `<script setup>` достаточно использовать `await` на верхнем уровне, чтобы компонент стал асинхронным:

```vue
<script setup>
const res = await fetch('/api/user');
const user = await res.json();
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

Под капотом компилятор SFC превращает такой `<script setup>` в асинхронный `setup()`.

### Что можно делать в async setup

Внутри async setup работают все обычные Composition API-инструменты: `ref`, `reactive`, `computed`, `watch`, lifecycle-хуки. Но есть важные ограничения:

- Компонент **обязан** быть обёрнут в `<Suspense>`, иначе Vue выдаст предупреждение в консоли.
- Хуки жизненного цикла, зарегистрированные в async setup, регистрируются асинхронно: `onMounted` сработает только после разрешения `setup`.
- Асинхронный setup не подходит для компонентов, которым нужно сразу показать хоть какой-то UI и догрузить данные позже.

---

## Базовое использование `<Suspense>`

Синтаксис минимален: оборачиваете асинхронное поддерево в `<Suspense>` и передаёте `fallback` через слот `fallback`.

```vue
<script setup>
import UserProfile from './UserProfile.vue';
import AppSpinner from './AppSpinner.vue';
</script>

<template>
  <Suspense>
    <template #default>
      <UserProfile :user-id="42" />
    </template>
    <template #fallback>
      <AppSpinner />
    </template>
  </Suspense>
</template>
```

Пока `UserProfile` не разрешит свои асинхронные зависимости, пользователь видит `<AppSpinner />`. Как только все асинхронные зависимости внутри `default` слота разрешатся, Vue заменит fallback на основное содержимое.

### Короткая запись

Если fallback — это простой текст или один компонент, можно использовать сокращённую форму:

```vue
<template>
  <Suspense>
    <UserProfile :user-id="42" />
    <template #fallback>
      <AppSpinner />
    </template>
  </Suspense>
</template>
```

Важно: содержимое без имени слота попадает в слот `default`. Именованный слот `#fallback` обязателен.

### Несколько асинхронных компонентов

Один `<Suspense>` может содержать несколько асинхронных компонентов. Fallback будет показан до тех пор, пока **все** асинхронные зависимости не разрешатся.

```vue
<template>
  <Suspense>
    <template #default>
      <main>
        <UserProfile :user-id="42" />
        <UserOrders :user-id="42" />
        <UserStats :user-id="42" />
      </main>
    </template>
    <template #fallback>
      <AppSpinner />
    </template>
  </Suspense>
</template>
```

Пользователь увидит страницу целиком, только когда загрузятся профиль, заказы и статистика. Если нужно показывать каждый блок по готовности, используются вложенные `<Suspense>`.

---

## `fallback` и правила рендера

### Когда показывается fallback

Fallback отображается в следующих случаях:

1. При первоначальном монтировании, если в поддереве есть неразрешённые асинхронные зависимости.
2. При смене ключевых реактивных зависимостей, если это приводит к повторной приостановке.
3. Если в поддереве появляется новый асинхронный компонент.

### Когда fallback скрывается

Как только **все** асинхронные зависимости внутри `default` разрешились, Vue скрывает fallback и показывает основное содержимое.

### fallback — это тоже Vue-компонент

Fallback может быть полноценным компонентом: спиннером, скелетоном или даже мини-страницей с анимацией. Главное — не перегружать его логикой, потому что он рендерится вместо всего поддерева.

### Рекомендации по fallback

- **Будьте конкретны.** "Загрузка..." хуже, чем "Загружаем профиль пользователя...". Лучше показывать скелетон, похожий на финальный UI.
- **Учитывайте доступность.** Добавляйте `role="status"` и `aria-live="polite"`, чтобы скринридеры озвучивали изменение.
- **Не перегружайте анимацией.** fallback должен быть лёгким: он рендерится вместо всего поддерева.
- **Избегайте сложной логики в fallback.** fallback — это временное состояние, а не полноценная страница.

---

## События `<Suspense>`

`<Suspense>` эмитит три события, которые позволяют родителю отслеживать состояние загрузки:

| Событие | Когда срабатывает |
|---|---|
| `@pending` | Поддерево вошло в состояние ожидания, показывается fallback |
| `@resolve` | Все асинхронные зависимости разрешились, fallback скрывается |
| `@fallback` | Поддерево снова перешло к fallback (например, при смене ключа) |

### Пример использования событий

```vue
<script setup>
import { ref } from 'vue';
import UserProfile from './UserProfile.vue';

const loadCount = ref(0);
const isPending = ref(false);

function onPending() {
  isPending.value = true;
}

function onResolve() {
  isPending.value = false;
  loadCount.value++;
}
</script>

<template>
  <div>
    <p>Состояние: {{ isPending ? 'загрузка' : 'готово' }}</p>
    <p>Загрузок: {{ loadCount }}</p>

    <Suspense @pending="onPending" @resolve="onResolve">
      <template #default>
        <UserProfile :user-id="42" />
      </template>
      <template #fallback>
        <p>Загружаем профиль...</p>
      </template>
    </Suspense>
  </div>
</template>
```

События полезны для:

- Обновления глобального индикатора загрузки.
- Логирования времени загрузки.
- Аналитики: сколько раз пользователь видел fallback.

### Разница между `@pending` и `@fallback`

`@pending` срабатывает при первой приостановке. `@fallback` срабатывает всякий раз, когда поддерево возвращается к fallback после того, как уже было разрешено. Практически чаще всего используют `@pending` и `@resolve` как пару.

---

## Вложенные границы Suspense

Вложенные `<Suspense>` позволяют создавать иерархию загрузки: общий спиннер для страницы и локальные спиннеры для отдельных блоков.

```vue
<template>
  <Suspense>
    <template #default>
      <div class="layout">
        <header>
          <UserHeader />
        </header>

        <Suspense>
          <template #default>
            <UserFeed />
          </template>
          <template #fallback>
            <FeedSkeleton />
          </template>
        </Suspense>

        <Suspense>
          <template #default>
            <UserSidebar />
          </template>
          <template #fallback>
            <SidebarSkeleton />
          </template>
        </Suspense>
      </div>
    </template>
    <template #fallback>
      <FullPageLoader />
    </template>
  </Suspense>
</template>
```

Как это работает: внешний `<Suspense>` ждёт `UserHeader` и оба внутренних `<Suspense>`. Внутренние границы разрешаются независимо и не блокируют друг друга. Если `UserFeed` загружается дольше, пользователь уже видит шапку и боковую панель со своими спиннерами.

### Когда использовать вложенность

| Сценарий | Решение |
|---|---|
| Страница состоит из независимых блоков | Несколько `<Suspense>` на одном уровне |
| Есть общий layout, а контент грузится отдельно | Внешний `<Suspense>` для layout, внутренний — для контента |
| Нужен глобальный лоадер, пока ничего не готово | Один `<Suspense>` на уровне приложения |
| Нужен локальный лоадер для виджета | `<Suspense>` внутри виджета |

---

## `defineAsyncComponent` и Suspense

`defineAsyncComponent` — это способ загрузить компонент лениво. Он часто используется вместе с `<Suspense>`, но важно понимать: **асинхронный компонент и асинхронный `setup` — это разные механизмы**.

| Механизм | Что делает | Типичный сценарий |
|---|---|---|
| `async setup()` | Компонент ждёт данные перед первым рендером | Загрузка данных для страницы |
| `defineAsyncComponent` | Компонент ждёт, пока сам код компонента загрузится | Code splitting, lazy loading |

### Базовый пример lazy loading

```vue
<script setup>
import { defineAsyncComponent } from 'vue';

const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'));
</script>

<template>
  <Suspense>
    <template #default>
      <HeavyChart />
    </template>
    <template #fallback>
      <p>Загружаем график...</p>
    </template>
  </Suspense>
</template>
```

`defineAsyncComponent(() => import('./HeavyChart.vue'))` возвращает обёртку, которая начинает загрузку компонента только при первом рендере. Пока компонент загружается, `<Suspense>` показывает fallback.

### Опции defineAsyncComponent

`defineAsyncComponent` принимает объект с дополнительными настройками:

```js
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200,
  timeout: 3000,
  suspensible: true,
});
```

| Опция | Описание |
|---|---|
| `loader` | Функция, возвращающая Promise с компонентом |
| `loadingComponent` | Компонент, показываемый во время загрузки (если нет `<Suspense>`) |
| `errorComponent` | Компонент, показываемый при ошибке загрузки |
| `delay` | Задержка в мс перед показом `loadingComponent` |
| `timeout` | Максимальное время ожидания загрузки |
| `suspensible` | Если `true`, компонент участвует в `<Suspense>`. Если `false`, управляется своими `loadingComponent`/`errorComponent` |

### suspensible: false

Если установить `suspensible: false`, асинхронный компонент не будет влиять на ближайший `<Suspense>`. Вместо этого будут использоваться собственные `loadingComponent` и `errorComponent`:

```js
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  suspensible: false,
});
```

Это удобно, когда нужна независимая логика загрузки отдельного виджета, не связанная с общим Suspense.

### Комбинирование async setup и defineAsyncComponent

Компонент может быть одновременно и асинхронно загружаемым, и иметь async setup:

```vue
<!-- HeavyChart.vue -->
<script setup>
const data = await fetch('/api/chart-data').then(r => r.json());
</script>

<template>
  <canvas ref="canvas" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { defineAsyncComponent } from 'vue';

const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'));
</script>

<template>
  <Suspense>
    <HeavyChart />
    <template #fallback>
      <p>Загружаем график...</p>
    </template>
  </Suspense>
</template>
```

Здесь `<Suspense>` ждёт сразу две вещи: загрузку кода компонента и разрешение его async setup.

---

## Обработка ошибок

`<Suspense>` сам по себе не ловит ошибки. Если async setup бросает исключение или `defineAsyncComponent` падает по `timeout`, ошибка всплывает вверх по дереву компонентов. Для её перехвата используется хук `onErrorCaptured` или глобальный `app.config.errorHandler`.

### onErrorCaptured

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref(null);

onErrorCaptured((err, instance, info) => {
  error.value = err;
  return false; // предотвращаем дальнейшее всплытие
});
</script>

<template>
  <div v-if="error" class="error">
    <p>Не удалось загрузить раздел: {{ error.message }}</p>
    <button @click="error = null">Повторить</button>
  </div>
  <Suspense v-else>
    <template #default>
      <UserDashboard />
    </template>
    <template #fallback>
      <p>Загрузка...</p>
    </template>
  </Suspense>
</template>
```

`onErrorCaptured` вызывается, когда ошибка происходит в поддереве. Возвращение `false` останавливает всплытие ошибки дальше.

### Error Boundary pattern

Чтобы не повторять `onErrorCaptured` в каждом компоненте, можно сделать универсальный компонент-обёртку:

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref(null);

onErrorCaptured((err) => {
  error.value = err;
  return false;
});

function reset() {
  error.value = null;
}

defineExpose({ reset });
</script>

<template>
  <div v-if="error" class="error-boundary">
    <slot name="error" :error="error" :reset="reset">
      <p>Что-то пошло не так: {{ error.message }}</p>
      <button @click="reset">Попробовать снова</button>
    </slot>
  </div>
  <slot v-else />
</template>
```

Использование:

```vue
<template>
  <ErrorBoundary>
    <Suspense>
      <template #default>
        <UserDashboard />
      </template>
      <template #fallback>
        <p>Загрузка дашборда...</p>
      </template>
    </Suspense>
  </ErrorBoundary>
</template>
```

### Важный нюанс: порядок ErrorBoundary и Suspense

Если `<ErrorBoundary>` находится внутри `<Suspense>`, а ошибка произошла в async setup, `<Suspense>` сначала покажет fallback, а когда ошибка всплывёт, `<ErrorBoundary>` перехватит её. Это может привести к мельканию fallback.

Если `<ErrorBoundary>` оборачивает `<Suspense>`, как в примере выше, ошибка перехватывается сразу, и fallback не мелькает.

### Глобальный errorHandler

Для логирования и аварийного fallback на уровне приложения используется `app.config.errorHandler`:

```js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err);
  reportToSentry(err, { info, component: instance?.$options?.name });
};

app.mount('#app');
```

`errorHandler` не останавливает всплытие ошибки в консоль, но позволяет централизованно её обработать.

---

## Suspense и SSR

Vue 3 поддерживает `<Suspense>` при серверном рендеринге, и это одна из его сильных сторон. SSR с Suspense работает в потоковом режиме: сервер начинает отправлять HTML до завершения всех асинхронных операций.

### Как это работает

1. Сервер рендерит приложение.
2. Когда встречает `<Suspense>` с неразрешёнными зависимостями, вставляет на его место fallback-HTML.
3. Продолжает рендерить остальную страницу и отправляет её в браузер.
4. Когда асинхронные данные готовы, сервер отправляет дополнительный HTML-чанк, который заменяет fallback на клиенте.

### Пример SSR с Suspense

```vue
<template>
  <div id="app">
    <header>Статический header</header>

    <Suspense>
      <template #default>
        <AsyncComments />
      </template>
      <template #fallback>
        <div class="skeleton">Загрузка комментариев...</div>
      </template>
    </Suspense>
  </div>
</template>
```

Пользователь сразу видит header и скелетон комментариев, не дожидаясь окончания всех запросов.

### Ограничения SSR

- Асинхронные операции в async setup должны быть совместимы с SSR. Обычно используют специальные composables или фреймворки вроде Nuxt, которые управляют состоянием загрузки на сервере.
- В SSR не рекомендуется использовать `setTimeout` или другие таймеры в async setup, потому что они замедлят ответ сервера.
- Потоковый SSR требует правильной настройки сервера и Vue SSR runtime.

### Гидратация

На клиенте Vue получает HTML с fallback и размеченные асинхронные чанки. После гидратации Vue заменяет fallback на настоящий контент, когда данные будут готовы. Если данные уже есть в сериализованном состоянии, компонент может отрендериться сразу без повторного запроса.

---

## Сравнение с React Suspense

Vue `<Suspense>` и React `<Suspense>` решают похожие задачи, но у них разная ментальная модель и механика.

| Аспект | Vue Suspense | React Suspense |
|---|---|---|
| Механизм приостановки | Асинхронный `setup()` или `defineAsyncComponent` | Выброс промиса во время рендера (throw-on-promise) |
| Триггер | Промис, возвращаемый из setup | Промис, выброшенный из компонента или прочитанный через `use()` |
| Вложенность | Поддерживается | Поддерживается |
| SSR | Потоковый SSR с заменой fallback | Потоковый SSR, selective hydration |
| Error handling | `onErrorCaptured`, `app.config.errorHandler` | `ErrorBoundary` |
| Data fetching | Внутри async setup | Через интеграции с библиотеками (React Query, Relay) |
| Стабильность | Стабилен в Vue 3, но с ограничениями | Основа Concurrent React, активно развивается |

### Когда какая модель удобнее

- **Vue Suspense** проще для небольших задач: загрузили данные в setup, обернули в Suspense — готово. Не нужна специальная библиотека.
- **React Suspense** глубже интегрирован с конкурентным рендерингом и экосистемой data fetching. Для больших приложений с кэшированием и сложными зависимостями это даёт больше контроля.

---

## Лучшие практики и антипаттерны

### Лучшие практики

1. **Используйте Suspense для целых страниц или крупных блоков, а не для каждой мелочи.**

   ```vue
   <!-- Хорошо: страница обёрнута целиком -->
   <Suspense>
     <UserPage :id="userId" />
     <template #fallback>
       <PageSkeleton />
     </template>
   </Suspense>
   ```

2. **Показывайте скелетоны вместо абстрактных спиннеров.**

   Скелетон повторяет форму финального UI и снижает восприятие задержки.

3. **Разделяйте загрузку кода и загрузку данных.**

   `defineAsyncComponent` откладывает загрузку кода. Async setup загружает данные. Используйте оба механизма осознанно.

4. **Оборачивайте Suspense в ErrorBoundary.**

   ```vue
   <ErrorBoundary>
     <Suspense>
       <AsyncContent />
       <template #fallback><Skeleton /></template>
     </Suspense>
   </ErrorBoundary>
   ```

5. **Используйте вложенные Suspense для независимых блоков.**

   Это позволяет показывать готовые части интерфейса, не дожидаясь самой медленной.

6. **Не забывайте про доступность.**

   fallback должен быть заметен для скринридеров и иметь понятный текст.

### Антипаттерны

1. **Асинхронный setup без Suspense.**

   ```vue
   <!-- Плохо: компонент с await на верхнем уровне без <Suspense> -->
   <script setup>
   const user = await fetchUser();
   </script>
   ```

   Vue покажет предупреждение, а пользователь увидит неопределённое поведение. Всегда оборачивайте async компоненты в `<Suspense>`.

2. **Слишком большие границы Suspense.**

   Если обернуть всё приложение в один `<Suspense>` с одним спиннером, пользователь будет долго смотреть на пустой экран.

3. **Использование Suspense для частых мелких обновлений.**

   Suspense подходит для начальной загрузки, а не для кнопки "Загрузить ещё" или чата. Для них лучше ручное состояние.

4. **Отсутствие обработки ошибок.**

   Без `onErrorCaptured` или ErrorBoundary упавший async setup может уронить всё приложение или оставить пользователя на вечном спиннере.

5. **Выполнение побочных эффектов в async setup.**

   ```vue
   <!-- Плохо: сайд-эффект внутри async setup -->
   <script setup>
   const data = await fetchData();
   localStorage.setItem('lastVisit', Date.now()); // лучше в onMounted
   </script>
   ```

   Побочные эффекты лучше выполнять в lifecycle-хуках, особенно при SSR.

6. **Игнорирование отмены запросов.**

   Если компонент размонтируется до разрешения async setup, запрос не отменится автоматически. Для fetch используйте `AbortController`:

   ```vue
   <script setup>
   import { onUnmounted } from 'vue';

   const controller = new AbortController();

   onUnmounted(() => {
     controller.abort();
   });

   const res = await fetch('/api/data', { signal: controller.signal });
   const data = await res.json();
   </script>
   ```

---

## Ключевые тезисы для интервью

1. `<Suspense>` — встроенный компонент Vue 3, который показывает fallback, пока в его поддереве есть неразрешённые асинхронные зависимости.
2. Асинхронными зависимостями считаются async `setup()`, `<script setup>` с `await` на верхнем уровне и `defineAsyncComponent`.
3. Компонент с async setup обязательно должен находиться внутри `<Suspense>`, иначе Vue выдаст предупреждение.
4. `<Suspense>` имеет два слота: `default` — основное содержимое, `fallback` — запасной UI на время загрузки.
5. `<Suspense>` эмитит события `@pending`, `@resolve` и `@fallback`, что позволяет отслеживать состояние загрузки.
6. Вложенные `<Suspense>` разрешаются независимо и позволяют создавать иерархию загрузки.
7. `defineAsyncComponent` используется для lazy loading кода компонента, а async setup — для загрузки данных.
8. `<Suspense>` не ловит ошибки. Для перехвата ошибок используют `onErrorCaptured` или ErrorBoundary pattern.
9. В SSR `<Suspense>` работает в потоковом режиме: сервер отправляет fallback сразу, а настоящий контент позже.
10. В React Suspense работает через throw-on-promise и тесно связан с конкурентным рендерингом; во Vue — через асинхронный setup.
11. Suspense не заменяет полноценное управление состоянием: для частых обновлений, форм и чатов лучше использовать явное состояние `loading`/`error`.

---

## Заключение

`<Suspense>` во Vue 3 — это простой и эффективный способ декларативно управлять состоянием загрузки для асинхронных компонентов. В сочетании с async `setup` он позволяет загружать данные до первого рендера, убирая бойлерплейт ручных флагов `loading`. Вложенные границы дают гибкость: можно показывать общий лоадер для страницы и локальные — для отдельных виджетов.

Важно помнить: `<Suspense>` — это инструмент координации, а не data fetching. Он не заменяет Pinia, VueQuery или собственные composables для управления сетью. Он решает задачу "что показать, пока данные или код ещё не готовы", и решает её хорошо — особенно в SSR-сценариях и при lazy loading компонентов.

---

## Полезные ссылки

- [Vue Docs: Suspense](https://vuejs.org/guide/built-ins/suspense.html) — официальная документация.
- [Vue Docs: Async Components](https://vuejs.org/guide/components/async.html) — lazy loading и `defineAsyncComponent`.
- [Vue Docs: `<script setup>`](https://vuejs.org/api/sfc-script-setup.html) — асинхронный `<script setup>`.
- [Vue Docs: Error Handling](https://vuejs.org/guide/best-practices/production-deployment.html#error-handling) — обработка ошибок в приложении.
- [Vue SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html) — серверный рендеринг.
- [Nuxt Docs: Suspense](https://nuxt.com/docs/api/components/suspense) — Suspense в Nuxt.
- [React Docs: Suspense](https://react.dev/reference/react/Suspense) — для сравнения с React.
