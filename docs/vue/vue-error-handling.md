---
title: "Обработка ошибок"
section: vue
description: "Обработка ошибок в Vue 3: app.config.errorHandler, onErrorCaptured, error boundary pattern, ошибки в асинхронном коде, SSR и сравнение с React."
order: 10
tags: ["vue", "vue3", "error-handling", "onErrorCaptured", "errorHandler", "error-boundary", "ssr", "async"]
questions:
  - "Какие типы ошибок перехватывает app.config.errorHandler"
  - "Что такое error boundary во Vue и как его реализовать через onErrorCaptured"
  - "Как остановить распространение ошибки вверх по дереву компонентов"
  - "Почему onErrorCaptured не ловит ошибки в обработчиках событий и async setup"
  - "Как обрабатывать ошибки при асинхронной загрузке данных в компоненте"
  - "Какие особенности обработки ошибок в SSR у Vue 3"
  - "Чем Vue Error Boundary отличается от React Error Boundary"
  - "Как правильно логировать ошибки в production"
  - "Какие антипаттерны встречаются при обработке ошибок во Vue"
---

# Обработка ошибок

Любое приложение рано или поздно сталкивается с ошибками: некорректный ответ API, неожиданное значение в пропсе, ошибка внутри сторонней библиотеки, сбой при гидратации на сервере. Важно не только предотвратить ошибки тестами и валидацией, но и подготовить механизмы, которые позволят приложению gracefully деградировать вместо полного падения интерфейса.

Vue 3 предоставает несколько инструментов для работы с ошибками. Глобальный `app.config.errorHandler` перехватывает ошибки внутри реактивной системы и жизненного цикла. Хук `onErrorCaptured` позволяет строить локальные «границы ошибок» — error boundaries. При SSR есть свои нюансы: ошибки могут возникать на сервере, но проявляться в браузере.

В этой статье разберём, какие ошибки ловит Vue сам, где нужна явная обработка, как построить error boundary, как работать с асинхронными ошибками и SSR, а также сравним подход с React.

## Содержание

1. [Какие ошибки возникают во Vue](#какие-ошибки-возникают-во-vue)
2. [Глобальная обработка: `app.config.errorHandler`](#глобальная-обработка-appconfigerrorhandler)
3. [Локальная граница ошибок: `onErrorCaptured`](#локальная-граница-ошибок-onerrorcaptured)
4. [Паттерн Error Boundary](#паттерн-error-boundary)
5. [Что `onErrorCaptured` не ловит](#что-onerrorcaptured-не-ловит)
6. [Асинхронные ошибки](#асинхронные-ошибки)
7. [Ошибки в дочерних компонентах и `Suspense`](#ошибки-в-дочерних-компонентах-и-suspense)
8. [Обработка ошибок в SSR](#обработка-ошибок-в-ssr)
9. [Сравнение с React](#сравнение-с-react)
10. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)
13. [Полезные ссылки](#полезные-ссылки)

---

## Какие ошибки возникают во Vue

Прежде чем настраивать обработку, полезно понять, где именно может возникнуть ошибка. В Vue 3 ошибки можно разделить на несколько категорий:

| Категория | Пример | Кто обычно ловит |
|---|---|---|
| Ошибка рендера | Обращение к `null.name` в шаблоне | `errorHandler`, `onErrorCaptured` |
| Ошибка в хуке жизненного цикла | `onMounted(() => { throw new Error() })` | `errorHandler`, `onErrorCaptured` |
| Ошибка в `watch` / `watchEffect` | Исключение внутри колбэка вотчера | `errorHandler`, `onErrorCaptured` |
| Ошибка в обработчике события | `@click="throwError"` | **Не ловится Vue автоматически** |
| Ошибка в асинхронном коде | Необработанный `reject` в `fetch` | **Не ловится Vue автоматически** |
| Ошибка в `async setup` | `await` бросает исключение | `<Suspense>` + error handler |
| Ошибка пользовательского хука директивы | `mounted` директивы бросает исключение | `errorHandler`, `onErrorCaptured` |
| SSR-ошибка | Ошибка при рендере на сервере | `errorHandler` + логирование SSR |

Ключевой момент: Vue перехватывает ошибки только внутри своей «зоны ответственности» — рендер, реактивные эффекты, хуки жизненного цикла и пользовательские директивы. Всё, что происходит в колбэках событий DOM, `setTimeout`, `Promise.then` без `await` в `setup`, требует явного `try/catch`.

### Пример ошибки рендера

```vue
<script setup>
import { ref } from 'vue';

const user = ref(null);
// Представим, что user так и не загрузился
</script>

<template>
  <!-- Ошибка: Cannot read properties of null (reading 'name') -->
  <h1>{{ user.name }}</h1>
</template>
```

Если не настроен ни глобальный, ни локальный обработчик, такая ошибка пойдёт в консоль и может сломать рендер всего компонента.

---

## Глобальная обработка: `app.config.errorHandler`

Самый простой способ централизованно обрабатывать ошибки — указать `errorHandler` при создании приложения. Этот обработчик вызывается для ошибок, произошедших в:

- функциях рендера компонентов;
- хуках жизненного цикла (`onMounted`, `onUpdated`, `onUnmounted` и др.);
- функциях `watch` и `watchEffect`;
- хуках пользовательских директив (`mounted`, `updated` и т.д.).

```ts
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  // err — объект ошибки
  // instance — компонент, в котором произошла ошибка (может быть null)
  // info — строка с типом ошибки, например "render function", "mounted hook"

  console.error('Глобальная ошибка Vue:', err);
  console.error('Компонент:', instance);
  console.error('Инфо:', info);

  // Отправка в Sentry / LogRocket / свой бэкенд
  // reportError(err, { component: instance?.$options?.name, info });
};

app.mount('#app');
```

### Параметр `info`

Параметр `info` помогает понять контекст ошибки:

| Значение `info` | Когда возникает |
|---|---|
| `"render function"` | Ошибка в функции рендера компонента |
| `"updated hook"` | Ошибка в `onUpdated` |
| `"mounted hook"` | Ошибка в `onMounted` |
| `"unmounted hook"` | Ошибка в `onUnmounted` |
| `"watch getter"` | Ошибка в getter-функции `watch` |
| `"watch callback"` | Ошибка в колбэке `watch` |
| `"directive hook"` | Ошибка в хуке пользовательской директивы |
| `"component event handler"` | Ошибка в обработчике пользовательского события компонента (`emits`) — **редко** |

Важно: `errorHandler` **не перехватывает** ошибки в:

- обработчиках нативных DOM-событий (`@click` и т.п.);
- асинхронных колбэках (`setTimeout`, `Promise.then`, `fetch` без `await`);
- ошибках, брошенных внутри самого `errorHandler`.

Если нужно централизованно ловить все ошибки, включая синхронные и асинхронные, придётся комбинировать `errorHandler` с `window.onerror` и `window.onunhandledrejection`.

### Логирование в production

В production обработчик ошибки обычно отправляет отчёт во внешний сервис. Рекомендуется сохранять:

- стектрейс;
- имя компонента;
- `info` (контекст);
- версию приложения и окружение;
- дополнительные метаданные: маршрут, состояние хранилища и т.д.

```ts
app.config.errorHandler = (err, instance, info) => {
  const componentName = instance
    ? (instance.$options?.name ?? instance.$.type?.name ?? 'Anonymous')
    : 'unknown';

  myErrorTracker.capture(err, {
    tags: { framework: 'vue3', component: componentName },
    extra: { info, url: window.location.href },
  });
};
```

---

## Локальная граница ошибок: `onErrorCaptured`

Если глобальный обработчик перехватывает ошибки на уровне приложения, то `onErrorCaptured` работает локально — в компоненте и его потомках. Это Composition API-аналог Options API-хука `errorCaptured`.

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref(null);

onErrorCaptured((err, instance, info) => {
  error.value = err;

  // Если вернуть false, ошибка не пойдёт дальше вверх по дереву
  // Если ничего не возвращать или вернуть true/undefined — распространение продолжится
  return false;
});
</script>

<template>
  <div v-if="error">
    <p>Произошла ошибка: {{ error.message }}</p>
    <button @click="error = null">Попробовать снова</button>
  </div>
  <slot v-else />
</template>
```

Такой компонент можно использовать как обёртку:

```vue
<template>
  <ErrorBoundary>
    <RiskyComponent />
  </ErrorBoundary>
</template>
```

### Принцип работы

`onErrorCaptured` срабатывает, когда ошибка возникает в любом дочернем компоненте ниже по дереву. Обработчики вызываются от ближайшего предка к корню, пока кто-то не вернёт `false` или пока ошибка не достигнет `app.config.errorHandler`.

Это позволяет строить иерархические границы ошибок: одна граница для виджета дашборда, другая — для всей страницы, третья — для маленького UI-блока.

### Возврат `false`

Возвращение `false` из `onErrorCaptured` означает: «ошибка обработана, дальше её передавать не нужно». Это эквивалент `event.stopPropagation()` для ошибок.

```vue
<script setup>
import { onErrorCaptured } from 'vue';

onErrorCaptured((err) => {
  showToast(err.message);
  // Остановить всплытие
  return false;
});
</script>
```

Если не вернуть `false`, после выполнения обработчика ошибка продолжит всплытие к родительским компонентам и, в конечном итоге, к `app.config.errorHandler`.

---

## Паттерн Error Boundary

Error Boundary — это компонент, который:

1. Перехватывает ошибки внутри своих детей через `onErrorCaptured`.
2. Показывает fallback UI вместо упавшего поддерева.
3. Позволяет сбросить состояние ошибки и перерендерить детей.

### Реализация

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref(null);
const errorInfo = ref('');

onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;

  // Логируем, но не всплываем
  return false;
});

function reset() {
  error.value = null;
  errorInfo.value = '';
}

function retry() {
  reset();
  // Если нужно пересоздать дочерние компоненты, можно изменить :key
}

defineExpose({ reset });
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h2>Что-то пошло не так</h2>
    <p>{{ error.message }}</p>
    <p class="error-info">Контекст: {{ errorInfo }}</p>
    <button @click="retry">Повторить</button>
  </div>
  <slot v-else />
</template>
```

### Принудительный перерендер детей

Одна из проблем error boundary — после восстановления Vue не всегда пересоздаёт внутреннее состояние детей. Чтобы гарантировать «чистый» перезапуск, можно использовать `key`:

```vue
<template>
  <ErrorBoundary :key="boundaryKey">
    <RiskyComponent />
  </ErrorBoundary>
  <button @click="boundaryKey++">Сбросить границу</button>
</template>

<script setup>
import { ref } from 'vue';

const boundaryKey = ref(0);
</script>
```

При изменении `key` Vue уничтожит старый экземпляр `ErrorBoundary` и создаст новый, что гарантирует сброс его внутреннего состояния.

### Где ставить границы

Не стоит оборачивать каждый компонент в error boundary — это усложнит интерфейс. Обычно границы ставят на уровне:

- отдельных виджетов дашборда;
- форм с потенциально опасной валидацией;
- сторонних интеграций (карты, чаты, редакторы);
- страницы целиком — как последняя линия обороны.

---

## Что `onErrorCaptured` не ловит

Хотя `onErrorCaptured` и `errorHandler` покрывают много сценариев, есть важные исключения. Ошибки в следующих местах нужно обрабатывать вручную:

### Обработчики событий

```vue
<script setup>
function handleClick() {
  throw new Error('Ошибка в обработчике события');
}
</script>

<template>
  <button @click="handleClick">Нажми</button>
</template>
```

Эта ошибка **не попадёт** в `onErrorCaptured`. Нужен `try/catch` внутри обработчика.

```vue
<script setup>
import { ref } from 'vue';

const error = ref(null);

function handleClick() {
  try {
    riskyOperation();
  } catch (e) {
    error.value = e.message;
  }
}
</script>
```

### Асинхронные колбэки вне `async setup`

```vue
<script setup>
import { ref } from 'vue';

const data = ref(null);

function loadData() {
  fetch('/api/data')
    .then((res) => res.json())
    .then((json) => {
      data.value = json;
    });
  // Если fetch упадёт, ошибка останется необработанной
}
</script>
```

Нужно добавить `.catch()` или использовать `try/catch` с `await`.

### Вызовы в `setTimeout` / `setInterval`

```vue
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  setTimeout(() => {
    throw new Error('Ошибка в setTimeout');
  }, 1000);
});
</script>
```

`onErrorCaptured` не поймает это, потому что выполнение происходит вне Vue-контекста. Оборачивайте тело таймера в `try/catch`.

### Ошибки в `errorHandler`

Если сам глобальный обработчик бросит исключение, Vue не сможет его поймать. Внутри `errorHandler` не стоит делать рискованных операций — только логирование и безопасные уведомления.

---

## Асинхронные ошибки

Асинхронный код — самое частое место для ошибок. В Composition API с `<script setup>` обычно используют `try/catch` с `await`.

### Базовый подход

```vue
<script setup>
import { ref, onMounted } from 'vue';

const user = ref(null);
const loading = ref(false);
const error = ref(null);

async function fetchUser(id) {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    user.value = await res.json();
  } catch (e) {
    error.value = e;
    // Можно также отправить в трекер ошибок
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchUser(1));
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error">Ошибка: {{ error.message }}</p>
  <div v-else>
    <p>{{ user.name }}</p>
  </div>
</template>
```

### Отделение UI-ошибок от бизнес-логики

Хорошая практика — не смешивать логику загрузки и обработку ошибок с шаблоном. Локальное состояние `loading`/`error` можно вынести в composable:

```ts
// composables/useAsync.ts
import { ref, watchEffect } from 'vue';

export function useAsync(promiseFactory, deps = []) {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function execute(...args) {
    loading.value = true;
    error.value = null;
    try {
      data.value = await promiseFactory(...args);
    } catch (e) {
      error.value = e;
      throw e; // позволяет внешнему коду тоже отреагировать
    } finally {
      loading.value = false;
    }
  }

  watchEffect(() => {
    execute();
  });

  return { data, loading, error, execute };
}
```

```vue
<script setup>
import { useAsync } from '@/composables/useAsync';

const { data: user, loading, error } = useAsync(
  () => fetch('/api/users/1').then((r) => r.json()),
  []
);
</script>
```

### `onErrorCaptured` и `async setup`

Если компонент использует асинхронный `setup` с `<Suspense>`, ошибка в `await` не будет поймана `onErrorCaptured` родительского компонента напрямую. Вместо этого она всплывает к ближайшему `<Suspense>`, и её нужно ловить через `onErrorCaptured` в обёртке вокруг `<Suspense>` или глобальный `errorHandler`.

```vue
<script setup>
import { onErrorCaptured } from 'vue';

onErrorCaptured((err) => {
  console.error('Ошибка в Suspense:', err);
  return false;
});
</script>

<template>
  <Suspense>
    <AsyncComponent />
    <template #fallback>
      <p>Загрузка...</p>
    </template>
  </Suspense>
</template>
```

---

## Ошибки в дочерних компонентах и `Suspense`

`<Suspense>` не предоставляет встроенного механизма для отлова ошибок внутри асинхронных компонентов. Если `AsyncComponent` упадёт во время загрузки или в `async setup`, `<Suspense>` не покажет fallback-ошибку — нужна отдельная error boundary.

### Комбинация Suspense + Error Boundary

```vue
<template>
  <ErrorBoundary>
    <Suspense>
      <UserProfile :id="userId" />
      <template #fallback>
        <p>Загрузка профиля...</p>
      </template>
    </Suspense>
  </ErrorBoundary>
</template>
```

Здесь:

- `<Suspense>` отвечает за состояние загрузки и fallback во время ожидания.
- `ErrorBoundary` перехватывает ошибки рендера и `async setup` и показывает UI ошибки.

Это похоже на React, где `Suspense` и `Error Boundary` используются вместе, но выполняют разные роли.

---

## Обработка ошибок в SSR

В SSR-приложениях (например, на Nuxt или ручной SSR-настройке) ошибки могут возникать на сервере. Vue предоставляет несколько механизмов для их обработки.

### `app.config.errorHandler` на сервере

Глобальный обработчик работает и во время серверного рендера. Он получает те же параметры: `err`, `instance`, `info`.

```ts
// server.ts
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import App from './App.vue';

export function render(url, context) {
  const app = createSSRApp(App);

  app.config.errorHandler = (err, instance, info) => {
    console.error('[SSR Error]', err);
    // Записываем в логи сервера, но не падаем
  };

  return renderToString(app, context);
}
```

### `renderToString` и `onErrorCaptured`

`onErrorCaptured` в корневом компоненте или в обёртке тоже работает на сервере. Однако нужно помнить, что состояние компонента не сохраняется между сервером и клиентом автоматически: если на сервере произошла ошибка и была показана fallback-заглушка, клиент должен получить согласованное состояние, иначе гидратация сломается.

### SSR и асинхронные ошибки

Если в `async setup` возникает ошибка на сервере, `<Suspense>` при рендере будет ждать разрешения промисов. Если промис rejected, Vue вызовет `errorHandler`. Важно не прятать ошибку полностью, а передать информацию в `context`, чтобы клиент мог показать осмысленный UI.

```ts
const app = createSSRApp(App);

app.config.errorHandler = (err, instance, info) => {
  context.errors = context.errors || [];
  context.errors.push({ message: err.message, info });
};
```

### Гидратация

Если на сервере произошла ошибка и был отрендерен fallback, а на клиенте компонент пытается загрузиться заново, может возникнуть mismatch при гидратации. Стратегии:

- передавать флаг ошибки из серверного `context` в клиентский `window.__INITIAL_STATE__`;
- на клиенте сразу показывать UI ошибки без попытки перерендера;
- использовать `client-only` компоненты для частей, которые невозможно отрендерить на сервере.

---

## Сравнение с React

В React для обработки ошибок используются `componentDidCatch`, статический `getDerivedStateFromError` и Error Boundaries-классовые компоненты. В функциональных компонентах прямого аналога долго не было, появились только экспериментальные хуки.

| Аспект | Vue 3 | React |
|---|---|---|
| Глобальный обработчик | `app.config.errorHandler` | `console.error` + `window.onerror`, нет встроенного глобального Vue-аналога |
| Локальная граница | `onErrorCaptured` / `errorCaptured` | `componentDidCatch` / `getDerivedStateFromError` |
| Всплытие ошибок | От потомка к родителю, `return false` останавливает | От потомка к родителю, только классовый Error Boundary ловит |
| Ловит ошибки рендера | Да | Да |
| Ловит ошибки в обработчиках событий | Нет | Нет |
| Ловит асинхронные ошибки | Нет (кроме `async setup` внутри Vue-контекста) | Нет |
| Интеграция с Suspense | Error Boundary оборачивает Suspense | Error Boundary + Suspense используются вместе |
| SSR | `errorHandler` + `renderToString` | `componentDidCatch` в серверном рендере ограничен |

Главное отличие в удобстве: в Vue `onErrorCaptured` можно использовать прямо в `<script setup>`, не создавая отдельный классовый компонент. В React классический Error Boundary требует класса. В остальном ментальная модель похожа: граница — это компонент-обёртка, который перехватывает ошибки в поддереве.

---

## Лучшие практики и антипаттерны

### Правильно

1. **Настройте глобальный `errorHandler`** — как минимум для логирования в production.
2. **Используйте `onErrorCaptured` для изоляции критичных блоков** — виджеты, формы, сторонние интеграции.
3. **Всегда обрабатывайте асинхронные операции** — `try/catch` или `.catch()`.
4. **Возвращайте `false` из `onErrorCaptured`, если ошибка обработана** — чтобы не дублировать логи.
5. **Передавайте контекст в трекер** — имя компонента, `info`, маршрут, версия.
6. **Делайте fallback UI понятным пользователю** — не показывайте сырые стектрейсы.
7. **Предусматривайте retry** — дайте возможность перезагрузить упавший блок.
8. **В SSR согласовывайте состояние ошибки между сервером и клиентом** — избегайте mismatch при гидратации.

### Неправильно

1. **Молчаливое глушение ошибок**

```ts
// Плохо
app.config.errorHandler = () => {};
```

Так вы потеряете возможность диагностировать проблемы в production.

2. **Смешивание логики и обработки ошибок в шаблоне**

```vue
<!-- Плохо: сложно тестировать и переиспользовать -->
<script setup>
import { ref, watchEffect } from 'vue';
const data = ref(null);
const error = ref(null);
watchEffect(async () => {
  try {
    data.value = await fetchData();
  } catch (e) {
    error.value = e;
  }
});
</script>
```

Лучше вынести в composable.

3. **Оборачивание всего приложения в одну границу**

Одна глобальная error boundary — это последняя линия обороны, но не замена локальным границам. Если упадёт маленький виджет, не стоит скрывать всю страницу.

4. **Попытка ловить ошибки событий через `onErrorCaptured`**

```vue
<script setup>
// Бесполезно
onErrorCaptured((err) => {
  console.log(err);
});

function handleClick() {
  throw new Error('Не поймается');
}
</script>
```

5. **Вызов рискованного кода внутри `errorHandler`**

Если логирование само по себе упадёт, приложение останется без защиты.

---

## Ключевые тезисы для интервью

1. Vue 3 предоставляет `app.config.errorHandler` для глобальной обработки ошибок рендера, хуков жизненного цикла, вотчеров и хуков директив.
2. `onErrorCaptured` — Composition API-хук для создания локальных error boundaries; возврат `false` останавливает всплытие ошибки.
3. Ошибки в обработчиках событий, `setTimeout`, `Promise.then` и других асинхронных колбэках Vue не ловит автоматически — нужен `try/catch`.
4. Error Boundary в Vue — это компонент с `onErrorCaptured`, который показывает fallback UI вместо упавшего поддерева.
5. `<Suspense>` управляет состоянием загрузки, но не обрабатывает ошибки — для этого его оборачивают в Error Boundary.
6. В SSR `app.config.errorHandler` работает и на сервере, но состояние ошибки нужно согласовывать с клиентом для избежания проблем гидратации.
7. Глобальный обработчик не должен молча глушить ошибки — его задача: логировать и, при необходимости, показывать fallback.
8. Локальные error boundaries предпочтительнее одной глобальной, потому что они изолируют сбои и сохраняют работоспособность остального интерфейса.
9. Асинхронные ошибки обычно выносят в composables, чтобы отделить бизнес-логику от UI.
10. В React Error Boundary делают через классовый компонент; в Vue достаточно `<script setup>` с `onErrorCaptured`.

---

## Заключение

Обработка ошибок в Vue 3 строится на двух столпах: глобальный `app.config.errorHandler` и локальный `onErrorCaptured`. Первый нужен для централизованного логирования и мониторинга, второй — для создания изолированных границ ошибок, которые не дают отказу одного блока разрушить весь интерфейс.

Главное помнить, что Vue не волшебным образом ловит все ошибки. Всё, что происходит вне Vue-контекста — обработчики событий, таймеры, промисы без `await` — требует явной обработки. В SSR добавляется ещё один сложности: ошибки могут возникнуть на сервере, а проявиться при гидратации, поэтому важно передавать состояние ошибки на клиент.

Правильно спроектированная обработка ошибок делает приложение устойчивым: пользователь видит понятное сообщение, разработчик получает диагностику, а критичные части интерфейса продолжают работать даже при сбоях в соседних блоках.

---

## Полезные ссылки

- [Vue Docs — Error Handling](https://vuejs.org/guide/best-practices/error-handling.html)
- [Vue API — onErrorCaptured](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)
- [Vue API — app.config.errorHandler](https://vuejs.org/api/application.html#app-config-errorhandler)
- [Vue SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html)
- [Vue Docs — Suspense](https://vuejs.org/guide/built-ins/suspense.html)
- [Nuxt Docs — Error Handling](https://nuxt.com/docs/getting-started/error-handling)
- [React Docs — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
