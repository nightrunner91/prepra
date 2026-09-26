---
title: "Vue Router"
section: vue
description: "Полное руководство по Vue Router для подготовки к собеседованиям: маршрутизация в SPA, динамические маршруты, вложенные роуты, navigation guards, lazy loading, useRoute и useRouter, сравнение с React Router."
order: 4
tags: ["vue", "vue3", "vue-router", "routing", "spa", "navigation-guards", "lazy-loading", "composition-api"]
questions:
  - "Зачем нужен Vue Router и как он интегрируется с Vue 3"
  - "Как зарегистрировать маршруты и что такое <router-view>"
  - "Чем params отличаются от query в динамических маршрутах"
  - "Какие бывают navigation guards и в каком порядке они вызываются"
  - "Как организовать lazy loading маршрутов в Vue Router"
  - "Когда использовать <router-link>, а когда программную навигацию через useRouter"
  - "Как защитить маршрут с помощью meta-полей и beforeEnter"
  - "Чем Vue Router отличается от React Router по API и концепциям"
---

# Vue Router

Vue Router — официальная библиотека маршрутизации для Vue 3. Она превращает приложение из набора компонентов в полноценное SPA, связывая URL с деревом компонентов и позволяя пользователю перемещаться между "страницами" без перезагрузки браузера. Почти любое Vue-приложение среднего размера и выше рано или поздно сталкивается с роутингом, поэтому знание Vue Router — обязательный пункт на собеседованиях.

В этой статье мы разберём всё, что нужно для уверенной работы с Vue Router: от базовой настройки и регистрации маршрутов до динамических параметров, вложенных роутов, хуков навигации (navigation guards) и lazy loading. Основной фокус — Composition API и `<script setup>`, а также сравнение с React Router, которое помогает быстрее уловить различия, если вы пришли из экосистемы React.

## Содержание

1. [Зачем нужен роутер в SPA](#зачем-нужен-роутер-в-spa)
2. [Установка и создание роутера](#установка-и-создание-роутера)
3. [Регистрация маршрутов](#регистрация-маршрутов)
4. [`<router-view>` и `<router-link>`](#router-view-и-router-link)
5. [Динамические маршруты и параметры](#динамические-маршруты-и-параметры)
6. [Вложенные маршруты](#вложенные-маршруты)
7. [Режимы истории](#режимы-истории)
8. [Scroll behavior и переходы](#scroll-behavior-и-переходы)
9. [Navigation guards](#navigation-guards)
10. [Обработка ошибок навигации](#обработка-ошибок-навигации)
11. [Lazy loading и code splitting](#lazy-loading-и-code-splitting)
12. [Мета-поля и защита маршрутов](#мета-поля-и-защита-маршрутов)
13. [Программная навигация через `useRouter`](#программная-навигация-через-userouter)
14. [Текущий маршрут через `useRoute`](#текущий-маршрут-через-useroute)
15. [Сравнение с React Router](#сравнение-с-react-router)
16. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
17. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
18. [Заключение](#заключение)
19. [Полезные ссылки](#полезные-ссылки)

---

## Зачем нужен роутер в SPA

Одностраничное приложение (SPA) загружает HTML один раз, а дальше всю навигацию выполняет JavaScript. Без роутера пришлось бы вручную показывать и скрывать компоненты в зависимости от состояния, теряя при этом привычную для пользователя модель работы с браузером: кнопки "Назад"/"Вперёд", закладки, история, обновление страницы.

Vue Router решает эти задачи:

- **Связывает URL с компонентами.** Каждому пути (`/`, `/about`, `/users/42`) соответствует свой компонент.
- **Обновляет браузерную историю.** Переход между маршрутами использует `history.pushState` или хэш, не перегружая страницу.
- **Поддерживает вложенность.** Один маршрут может содержать другие, образуя layout'ы и вложенные страницы.
- **Предоставляет хуки навигации.** Можно отменить переход, перенаправить пользователя или подгрузить данные до смены маршрута.
- **Делает код разделяемым.** Каждый маршрут можно загружать отдельным чанком (lazy loading).

В Vue Router маршрут — это не просто строка, а объект конфигурации, который описывает путь, компонент, дочерние маршруты, мета-информацию и хуки.

---

## Установка и создание роутера

### Установка

Если вы создавали проект через `npm create vue@latest`, Vue Router можно выбрать на этапе scaffolding. Для ручной установки используется npm или yarn:

```bash
npm install vue-router@4
```

Версия `4.x` предназначена для Vue 3. Версия `3.x` работает только с Vue 2.

### Создание экземпляра роутера

Обычно роутер выносят в отдельный файл, например `src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AboutView from '../views/AboutView.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

Затем роутер подключается в `main.ts` через `app.use(router)`:

```ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
```

`createRouter` — это фабрика, которая принимает конфигурацию и возвращает экземпляр роутера. Два обязательных поля: `history` (стратегия работы с историей браузера) и `routes` (массив маршрутов).

---

## Регистрация маршрутов

Каждый маршрут — объект с обязательным полем `path` и одним из способов указать компонент: `component`, `components` (для именованных видов) или `redirect`.

### Базовый маршрут

```ts
const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
];
```

### Именованные маршруты

Имя позволяет ссылаться на маршрут не по строке пути, а по идентификатору. Это удобно при рефакторинге: путь можно изменить в одном месте, а все ссылки останутся рабочими.

```ts
const routes = [
  {
    path: '/users/:id',
    name: 'UserProfile',
    component: UserProfileView,
  },
];
```

Для перехода по имени используется объект:

```vue
<template>
  <router-link :to="{ name: 'UserProfile', params: { id: 42 } }">
    Профиль пользователя
  </router-link>
</template>
```

### Перенаправления

```ts
const routes = [
  { path: '/home', redirect: '/' },
  { path: '/old-users/:id', redirect: '/users/:id' },
];
```

`redirect` может быть строкой, объектом с `name` или функцией, которая получает текущий маршрут и возвращает новый путь.

### Псевдонимы (alias)

Алиас позволяет открывать тот же компонент по нескольким путям, не меняя URL:

```ts
const routes = [
  {
    path: '/users',
    component: UsersView,
    alias: ['/people', '/customers'],
  },
];
```

При переходе на `/people` будет отображён `UsersView`, но URL останется `/people`. Это отличается от `redirect`, который меняет адрес.

### Маршрут "ловушка" (catch-all)

Для страницы 404 используется параметр с регулярным выражением:

```ts
const routes = [
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView },
];
```

`pathMatch` — это имя параметра, `(.*)*` — регулярное выражение, которое совпадает с любым путём любой глубины. Два звёздочки означают, что параметр будет массивом сегментов (`['a', 'b']` для `/a/b`), что полезно, если нужно восстановить исходный путь.

---

## `<router-view>` и `<router-link>`

### `<router-view>`

Это компонент-«гнездо», в котором Vue Router рендерит компонент текущего маршрута. В минимальном `App.vue` он выглядит так:

```vue
<template>
  <header>
    <nav>
      <router-link to="/">Главная</router-link>
      <router-link to="/about">О нас</router-link>
    </nav>
  </header>

  <main>
    <router-view />
  </main>
</template>
```

`<router-view>` можно сделать именованным, чтобы в одном layout'е рендерить несколько независимых областей:

```ts
const routes = [
  {
    path: '/',
    components: {
      default: HomeView,
      sidebar: SidebarView,
    },
  },
];
```

```vue
<template>
  <div class="layout">
    <router-view name="sidebar" />
    <router-view />
  </div>
</template>
```

### `<router-link>`

`<router-link>` рендерит ссылку, которая перехватывает клик и выполняет навигацию через роутер, не перегружая страницу.

```vue
<router-link to="/">Главная</router-link>
<router-link :to="{ name: 'UserProfile', params: { id: 42 } }">Профиль</router-link>
```

Полезные пропсы:

| Пропс | Описание |
|---|---|
| `to` | Путь строкой или объект маршрута. |
| `replace` | Заменяет текущую запись истории вместо добавления новой. |
| `active-class` / `exact-active-class` | CSS-классы для активной ссылки. |
| `custom` | Отключает рендеринг `<a>`, позволяет обернуть свой компонент через `v-slot`. |

По умолчанию ссылка получает класс `router-link-active`, если её путь входит в текущий маршрут, и `router-link-exact-active`, если совпадает точно. Это удобно для стилизации меню.

---

## Динамические маршруты и параметры

Динамические сегменты обозначаются двоеточием. Они позволяют одному маршруту обрабатывать множество URL:

```ts
const routes = [
  { path: '/users/:id', component: UserView },
];
```

URL `/users/42` и `/users/alice` оба попадут в этот маршрут, а значение сегмента будет доступно через `route.params.id`.

### Доступ к параметрам внутри компонента

```vue
<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

// route.params.id — строка
console.log(route.params.id);
</script>

<template>
  <h1>Пользователь {{ $route.params.id }}</h1>
</template>
```

В шаблоне параметры доступны через глобальный объект `$route`. В `<script setup>` предпочтительнее использовать `useRoute()`.

### params vs query

| | `params` | `query` |
|---|---|---|
| Расположение в URL | `/users/:id` | `?search=vue&page=2` |
| Объявляется в `path` | Да | Нет |
| Тип значения | Всегда строка | Всегда строка |
| Подходит для | Идентификаторов ресурсов | Фильтров, поиска, пагинации |

```vue
<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

// /search?q=vue&page=2
const q = route.query.q;       // "vue"
const page = route.query.page; // "2"
</script>
```

### Реактивность параметров

`route.params` и `route.query` — реактивные объекты. Если параметр меняется (например, переход с `/users/42` на `/users/43` внутри того же маршрута), компонент не пересоздаётся по умолчанию, но `route.params.id` обновится. Поэтому важно не полагаться на значение только при `onMounted`, если оно может меняться:

```vue
<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const user = ref(null);

async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  user.value = await res.json();
}

// При первой загрузке и при смене params.id
watch(() => route.params.id, (newId) => {
  if (newId) fetchUser(newId);
}, { immediate: true });
</script>
```

### Параметры с регулярками

Можно ограничить формат сегмента:

```ts
const routes = [
  { path: '/users/:id\\d+', component: UserView }, // только цифры
];
```

В JavaScript-строке обратный слеш нужно экранировать, поэтому пишется `\\d+`.

---

## Вложенные маршруты

Вложенные маршруты позволяют строить layout'ы: родительский компонент содержит `<router-view>`, в котором рендерятся дочерние маршруты.

```ts
const routes = [
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      { path: '', component: DashboardHome },
      { path: 'profile', component: DashboardProfile },
      { path: 'settings', component: DashboardSettings },
    ],
  },
];
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <aside>
      <router-link to="/dashboard">Главная</router-link>
      <router-link to="/dashboard/profile">Профиль</router-link>
      <router-link to="/dashboard/settings">Настройки</router-link>
    </aside>

    <section>
      <router-view />
    </section>
  </div>
</template>
```

Дочерние пути не начинаются со слэша — они добавляются к пути родителя. `path: ''` означает, что при переходе на `/dashboard` внутри layout'а отобразится `DashboardHome`.

Вложенность может быть любой глубины, но на практике редко нужно больше двух-трёх уровней, чтобы не усложнять навигацию.

---

## Режимы истории

Vue Router 4 предлагает три режима работы с URL:

### createWebHistory

Использует History API (`history.pushState`). URL выглядит естественно: `/about`, `/users/42`. Требует настройки сервера: при прямом заходе на `/about` сервер должен отдать `index.html`, иначе будет 404.

```ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

### createWebHashHistory

Добавляет `#` в URL: `/#/about`, `/#/users/42`. Работает без настройки сервера, потому что всё после `#` не отправляется на сервер. Используется в простых статических развёртываниях или Electron.

```ts
import { createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
```

### createMemoryHistory

История хранится в памяти, URL не меняет адресную строку браузера. Используется в SSR и тестах.

```ts
import { createMemoryHistory } from 'vue-router';

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
```

| Режим | URL | Нужна настройка сервера | Где использовать |
|---|---|---|---|
| `createWebHistory` | `/about` | Да | Современные SPA и SSR |
| `createWebHashHistory` | `/#/about` | Нет | Статика, Electron, legacy |
| `createMemoryHistory` | Не виден | Нет | SSR, тесты |

---

## Scroll behavior и переходы

По умолчанию Vue Router сохраняет поведение браузера: при переходе на новый маршрут страница не прокручивается вверх автоматически. В SPA это часто нежелательно, потому что пользователь может оказаться внизу новой "страницы". Для управления прокруткой в `createRouter` передаётся опция `scrollBehavior`:

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // При нажатии "Назад" возвращаем сохранённую позицию
    if (savedPosition) {
      return savedPosition;
    }

    // Если в маршруте есть hash — прокручиваем к якорю
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }

    // По умолчанию — вверх страницы
    return { top: 0, left: 0 };
  },
});
```

`scrollBehavior` может возвращать объект с координатами, объект с селектором `el`, или Promise, если прокрутка должна быть отложена (например, дождаться анимации перехода).

```ts
scrollBehavior(to, from, savedPosition) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ top: 0, behavior: 'smooth' });
    }, 300);
  });
}
```

Важно: `scrollBehavior` не работает с `createMemoryHistory`, потому что у неё нет реального DOM-окна.

---

## Navigation guards

Navigation guards — это хуки, которые вызываются при переходе между маршрутами. Они позволяют отменить переход, перенаправить пользователя или выполнить асинхронную работу до смены маршрута.

Vue Router вызывает guards в строгом порядке:

1. **Глобальные `beforeEach`** — в порядке регистрации.
2. **Guards в конфигурации маршрута** — `beforeEnter` для входящего маршрута.
3. **Guards в компоненте** — `beforeRouteEnter`, `beforeRouteUpdate`, `beforeRouteLeave`.
4. **Глобальные `beforeResolve`**.
5. **Глобальные `afterEach`** — вызываются после завершения перехода.

### Глобальные guards

```ts
router.beforeEach((to, from, next) => {
  // to — куда идём
  // from — откуда пришли
  // next — функция для продолжения/отмены/перенаправления

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

router.afterEach((to, from) => {
  // Например, смена title страницы
  document.title = to.meta.title || 'My App';
});
```

В Vue Router 4 `next` всё ещё поддерживается, но рекомендуется возвращать значение: `return false` отменяет переход, `return { name: 'Login' }` перенаправляет.

```ts
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
});
```

### beforeEnter на маршруте

```ts
const routes = [
  {
    path: '/admin',
    component: AdminView,
    beforeEnter: (to, from) => {
      if (!isAdmin()) return { name: 'Forbidden' };
    },
  },
];
```

`beforeEnter` вызывается только при входе на маршрут. Если параметр маршрута меняется, но компонент остаётся тот же, `beforeEnter` повторно не вызывается — для этого есть `beforeRouteUpdate`.

### Guards внутри компонента

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('У вас есть несохранённые изменения. Покинуть страницу?');
  if (!answer) return false;
});

onBeforeRouteUpdate(async (to) => {
  // Маршрут тот же, но params.id изменился
  await fetchUser(to.params.id);
});
</script>
```

| Guard | Когда вызывается |
|---|---|
| `onBeforeRouteLeave` | Перед уходом с маршрута текущего компонента. |
| `onBeforeRouteUpdate` | Когда маршрут обновился, но компонент тот же. |
| `beforeRouteEnter` | Только в Options API, перед входом на маршрут (нет доступа к `this`). |

### Guards в Options API (legacy)

В Options API guards объявляются как опции компонента, а не как импортируемые хуки:

```vue
<script>
export default {
  beforeRouteEnter(to, from, next) {
    // Компонент ещё не создан, this недоступен
    next((vm) => {
      // Коллбэк вызывается после создания экземпляра
      vm.loadData();
    });
  },

  beforeRouteUpdate(to, from, next) {
    // this доступен
    this.loadData(to.params.id);
    next();
  },

  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('Покинуть страницу?');
      if (!answer) return next(false);
    }
    next();
  },
};
</script>
```

В Composition API эти же задачи решаются через `onBeforeRouteUpdate` и `onBeforeRouteLeave`, а `beforeRouteEnter` заменяется на логику в `setup` или `onMounted`.

---

## Обработка ошибок навигации

Vue Router возвращает Promise из методов `push` и `replace`. Если переход отменяется guard'ом или ленивый компонент не загружается, Promise отклоняется. В production важно обрабатывать такие ситуации, чтобы в консоли не появлялись необработанные ошибки.

```ts
router.push('/protected').catch((err) => {
  if (err.name !== 'NavigationCancelled') {
    console.error('Navigation error:', err);
  }
});
```

Глобальная обработка ошибок навигации:

```ts
router.onError((err, to, from) => {
  console.error('Router error:', err, to, from);
  // Можно перенаправить на страницу ошибки
});
```

Если асинхронный компонент маршрута не загрузился (например, сетевая ошибка), `router.onError` получит эту ошибку. Для лучшего UX можно показать fallback-страницу или предложить пользователю повторить попытку.

---

## Lazy loading и code splitting

Vue Router позволяет загружать компоненты маршрутов асинхронно, разбивая приложение на чанки. Это снижает начальную нагрузку: пользователь загружает только тот код, который нужен для текущего маршрута.

```ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
];
```

`import()` возвращает Promise, и роутер дождётся его разрешения перед тем, как отобразить компонент.

### Именованные чанки

Чтобы Webpack/Vite сгруппировал несколько маршрутов в один чанк, можно использовать "волшебные" комментарии Webpack:

```ts
const routes = [
  {
    path: '/dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/DashboardView.vue'),
  },
  {
    path: '/dashboard/profile',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/ProfileView.vue'),
  },
];
```

В Vite аналогичные комментарии тоже работают и используются для именования выходных файлов.

### Совместимость с Suspense

Асинхронные компоненты маршрутов автоматически оборачиваются в `<Suspense>`, если в дереве выше есть `<Suspense>`. Это позволяет показывать fallback во время загрузки чанка. Более подробно `<Suspense>` разбирается в статье [Suspense и async setup](./vue-suspense.md).

---

## Мета-поля и защита маршрутов

Поле `meta` позволяет хранить произвольные данные о маршруте: заголовок, флаги доступа, роли, настройки layout'а.

```ts
const routes = [
  {
    path: '/admin',
    component: AdminView,
    meta: { requiresAuth: true, role: 'admin', title: 'Админка' },
  },
  {
    path: '/profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
];
```

Доступ к `meta` осуществляется через `to.meta` в guards и через `route.meta` в компонентах.

### Пример защиты авторизацией

```ts
router.beforeEach((to, from) => {
  const isAuthenticated = useAuthStore().isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    };
  }
});
```

### Проверка ролей

```ts
router.beforeEach((to, from) => {
  const user = useAuthStore().user;
  const requiredRole = to.meta.role;

  if (requiredRole && user?.role !== requiredRole) {
    return { name: 'Forbidden' };
  }
});
```

Мета-поля наследуются дочерними маршрутами только если явно не переопределены. Для сложных сценариев инспектируют всю цепочку `to.matched`, где каждый элемент содержит `meta` соответствующего маршрута.

---

## Программная навигация через `useRouter`

`<router-link>` подходит для статических ссылок, но часто навигация происходит в ответ на действие: успешный логин, отправка формы, результат API-запроса. Для этого используется `useRouter()`.

```vue
<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}

function replaceWithProfile() {
  router.replace('/profile');
}

function goBack() {
  router.back();
}

async function login() {
  await authenticate();
  router.push({ name: 'Dashboard' });
}
</script>
```

### Основные методы

| Метод | Описание |
|---|---|
| `push(to)` | Добавляет новую запись в историю. |
| `replace(to)` | Заменяет текущую запись истории. |
| `back()` / `forward()` / `go(n)` | Работа с историей браузера. |
| `resolve(to)` | Возвращает объект маршрута без перехода. |

`router.push` возвращает Promise, который разрешается после завершения навигации или отклоняется, если переход был отменён guard'ом.

---

## Текущий маршрут через `useRoute`

`useRoute()` возвращает текущий маршрут — реактивный объект с полной информацией о URL.

```vue
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const userId = computed(() => route.params.id);
const searchQuery = computed(() => route.query.q);
const isExact = computed(() => route.path === '/users');
</script>
```

### Полезные свойства `route`

| Свойство | Описание |
|---|---|
| `path` | Полный путь без query и hash. |
| `fullPath` | Полный путь включая query и hash. |
| `params` | Параметры динамических сегментов. |
| `query` | Query-параметры. |
| `hash` | Хэш-фрагмент. |
| `name` | Имя маршрута. |
| `matched` | Массив всех совпавших маршрутов (включая родителей). |
| `meta` | Мета-информация маршрута. |

Важно помнить, что `route.params` и `route.query` — это объекты, поэтому для надёжной реактивности в `watch` и `computed` лучше обращаться к конкретным полям через функцию:

```ts
// ✅ Реактивно отслеживает конкретный параметр
watch(() => route.params.id, fetchUser);

// ❌ Не отслеживает изменение отдельных параметров
watch(route.params, fetchUser);
```

---

## Сравнение с React Router

Если вы знакомы с React Router, многие концепции Vue Router покажутся похожими, но API отличается.

| Аспект | Vue Router 4 | React Router 6 |
|---|---|---|
| Объявление маршрутов | Массив объектов `routes` в `createRouter` | JSX `<Route>` внутри `<Routes>` или объект `useRoutes` |
| Точка входа | `<router-view>` | `<Outlet />` |
| Ссылки | `<router-link>` | `<Link>` |
| Программная навигация | `useRouter()` | `useNavigate()` |
| Текущий маршрут | `useRoute()` | `useLocation()` / `useParams()` |
| Хуки навигации | `beforeEach`, `beforeEnter`, `onBeforeRouteLeave` | `<Navigate>`, `loader` в data API, собственные обёртки |
| Lazy loading | `() => import(...)` в `component` | `React.lazy()` + `<Suspense>` |
| Режимы истории | Встроены (`createWebHistory`, `createWebHashHistory`) | Зависят от `<BrowserRouter>`, `<HashRouter>`, `<MemoryRouter>` |

### Ключевые различия

**1. Декларативность маршрутов**

В React Router маршруты часто описываются прямо в JSX компонента `App`:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
</Routes>
```

В Vue Router маршруты — это обычно отдельный массив конфигурации, который подключается к приложению:

```ts
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
];
```

Это делает Vue Router более похожим на классические роутеры вроде Angular UI-Router.

**2. Guards вынесены на уровень конфигурации**

В Vue Router guards могут жить прямо в объекте маршрута (`beforeEnter`) или быть глобальными. В React Router до версии 6 защищённые маршруты реализовывались через собственные обёртки, а в версии 6 концепция guards перенесена в data API и `loader`/`action`.

**3. Автоматическая интеграция с Suspense**

Асинхронные компоненты маршрутов Vue Router работают вместе с `<Suspense>` без дополнительных обёрток. В React нужно явно обернуть `React.lazy()` в `<Suspense>`.

**4. `$route` в шаблоне**

Vue предоставляет глобальный `$route` и `$router` в шаблоне, что удобно для простых случаев. В React все данные о маршруте получаются через хуки внутри компонента.

---

## Лучшие практики и антипаттерны

### Лучшие практики

**1. Используйте именованные маршруты**

Ссылки по имени выживают при изменении путей:

```vue
<router-link :to="{ name: 'UserProfile', params: { id } }">Профиль</router-link>
```

**2. Выносите конфигурацию роутера в отдельный файл**

Файл `src/router/index.ts` упрощает навигацию по проекту и тестирование.

**3. Загружайте тяжёлые страницы лениво**

```ts
{
  path: '/reports',
  component: () => import('../views/ReportsView.vue'),
}
```

**4. Используйте `meta` для метаданных, а не для бизнес-логики**

`meta` хорошо подходит для флагов авторизации и заголовков страниц. Сложную проверку прав лучше делегировать стору или сервису.

**5. Всегда проверяйте `to.meta.requiresAuth` в `beforeEach`, а не в каждом компоненте**

Централизованная проверка проще для поддержки и тестирования.

**6. Используйте `watch` на конкретные параметры маршрута**

```ts
watch(() => route.params.id, loadData, { immediate: true });
```

### Антипаттерны

**1. Парсинг `route.fullPath` вручную**

Всегда используйте `route.params`, `route.query` и `route.hash`. Ручной парсинг строки хрупок и избыточен.

**2. Синхронная тяжёлая логика в `beforeEach` без необходимости**

Глобальный `beforeEach` блокирует любой переход. Если нужно подгрузить данные, делайте это в компоненте или в `beforeEnter` конкретного маршрута.

**3. Использование `window.location` вместо `router.push`**

`window.location.href = '/profile'` перезагружает страницу и ломает SPA-опыт. Используйте `router.push`.

**4. Забывание про реактивность `route.params`**

Если вы читаете `route.params.id` только в `onMounted`, то при переходе с `/users/1` на `/users/2` внутри того же компонента данные не обновятся.

**5. Глубокая вложенность маршрутов без необходимости**

Более двух-трёх уровней вложенности усложняет понимание путей. Если layout повторяется, иногда проще использовать именованные виды или динамические компоненты.

---

## Ключевые тезисы для интервью

1. **Vue Router 4** — официальный роутер для Vue 3, создаётся через `createRouter` с указанием `history` и `routes`.
2. **Режимы истории:** `createWebHistory` (чистые URL, нужна настройка сервера), `createWebHashHistory` (с `#`, не требует сервера), `createMemoryHistory` (для SSR и тестов).
3. **Динамические маршруты** задаются через `:`: `/users/:id`. Параметры доступны в `route.params`, query-параметры — в `route.query`.
4. **`params` и `query` всегда строки**, даже если в URL переданы числа. При необходимости приводите типы вручную.
5. **Navigation guards** вызываются в строгом порядке: глобальные `beforeEach` → `beforeEnter` маршрута → компонентные guards → `beforeResolve` → `afterEach`.
6. **Lazy loading** делается через `() => import('../views/View.vue')`, что разбивает бандл на чанки.
7. **`useRouter()`** используется для программной навигации (`push`, `replace`, `back`), **`useRoute()`** — для чтения текущего маршрута.
8. **Мета-поля** хранят произвольную информацию о маршруте и часто используются для защиты авторизацией и ролями.
9. **Вложенные маршруты** (`children`) позволяют создавать layout'ы с несколькими уровнями навигации.
10. **Vue Router vs React Router:** Vue Router использует декларативный массив конфигурации, встроенные guards и глобальные `$route`/`$router` в шаблоне; React Router ориентирован на JSX-роуты и хуки внутри компонентов.

---

## Заключение

Vue Router — это зрелое и предсказуемое решение для маршрутизации в Vue 3. Он связывает URL с компонентами, управляет историей браузера, поддерживает вложенные layout'и и предоставляет мощную систему хуков навигации. Для подготовки к собеседованиям важно уверенно чувствовать себя в четырёх вещах: создании маршрутов, работе с `useRoute`/`useRouter`, понимании порядка вызова navigation guards и организации lazy loading.

Следующие статьи раздела продолжат углубление в экосистему Vue: [Жизненный цикл компонента](./vue-lifecycle.md), [События во Vue](./vue-events.md), [Компоненты, слоты и композиция](./vue-components-slots.md) и [Suspense](./vue-suspense.md).

---

## Полезные ссылки

- [Vue Router — официальная документация](https://router.vuejs.org/)
- [Руководство по миграции с Vue Router 3 на 4](https://router.vuejs.org/guide/migration/)
- [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)
- [Nested Routes](https://router.vuejs.org/guide/essentials/nested-routes.html)
- [React Router — документация](https://reactrouter.com/)
