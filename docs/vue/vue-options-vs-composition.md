---
title: "Options API vs Composition API"
section: vue
description: "Сравнение Options API и Composition API во Vue 3: история, ключевые различия, когда что использовать и как мигрировать legacy-код."
order: 12
tags: ["vue", "vue3", "options-api", "composition-api", "script-setup", "migration", "typescript"]
questions:
  - "Чем Options API отличается от Composition API по организации кода"
  - "Почему Composition API лучше подходит для сложных компонентов и TypeScript"
  - "Какие ограничения у Options API при выделении и переиспользовании логики фич"
  - "Можно ли смешивать Options API и Composition API в одном проекте"
  - "Как выглядит поэтапная миграция компонента с Options API на Composition API"
  - "В каких случаях Options API всё ещё может быть оправдан"
  - "Как соотнести Options API и Composition API с подходами React"
---

# Options API vs Composition API

Vue 3 предоставляет два способа описать логику компонента: **Options API**, унаследованный от Vue 2, и **Composition API**, появившийся в третьей версии. Хотя оба API поддерживаются официально и будут поддерживаться в обозримом будущем, их философия, эргономика и сферы применения сильно различаются.

Эта статья посвящена сравнению двух подходов. Мы разберём историю появления Composition API, ключевые различия в организации кода, покажем один и тот же компонент на обоих API, обсудим, когда какой подход выбирать, и опишем практичную стратегию миграции внутри действующего проекта. Главная цель — научиться аргументировать выбор API на собеседовании и уверенно читать legacy-код на Options API.

## Содержание

1. [История двух API](#история-двух-api)
2. [Ключевые различия](#ключевые-различия)
3. [Один компонент на двух API](#один-компонент-на-двух-api)
4. [Когда использовать Options API](#когда-использовать-options-api)
5. [Когда использовать Composition API](#когда-использовать-composition-api)
6. [Миграция внутри проекта](#миграция-внутри-проекта)
7. [Сравнение с React](#сравнение-с-react)
8. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## История двух API

### Options API — классический подход Vue

С самых первых версий Vue компоненты описывались через объект с заранее определёнными опциями: `data`, `methods`, `computed`, `watch`, `props`, `emits`, `mounted`, `created` и другими. Этот стиль стал называться **Options API** уже после появления альтернативы.

Options API хорошо подходил для небольших компонентов: у каждой части компонента было своё чёткое место. Состояние живёт в `data`, обработчики — в `methods`, вычисления — в `computed`. Разработчик, открывший файл, сразу понимал, куда смотреть.

Проблемы начинались с ростом компонента. Логика одной фичи — например, загрузки пользователя — размазывалась по `data`, `computed`, `watch`, `methods` и `mounted`. При чтении приходилось постоянно прыгать между секциями. Повторное использование такой логики через mixins приводило к неявным зависимостям, коллизиям имён и сложностям с отладкой.

### Composition API — ответ на сложность

Composition API впервые был предложен в 2018 году как RFC для Vue 3 и стал стабильным с релизом Vue 3.0 в сентябре 2020. Вместо разделения кода по опциям он предлагает группировать код по логическим задачам внутри функции `setup()` или блока `<script setup>`.

Сначала Composition API воспринимался как альтернатива для продвинутых сценариев, но со временем он стал основным стилем для новых проектов. Особенно после появления `<script setup>` в Vue 3.2, который сильно сократил шаблонный код, и макросов `defineProps`, `defineEmits`, `defineExpose`, `defineOptions`.

Сегодня официальная документация Vue рекомендует использовать Composition API + `<script setup>` для новых проектов, а Options API позиционировать как legacy, необходимый для поддержки старого кода.

---

## Ключевые различия

### Организация кода

В Options API код организован по типу сущности: состояние, вычисления, методы, хуки жизненного цикла. В Composition API код организован по задачам: загрузка пользователя, обработка формы, подписка на события.

Это главное визуальное и концептуальное отличие. Options API говорит: «сначала собери все данные, потом все методы». Composition API говорит: «собери всё, что относится к одной фиче, вместе».

### Доступ к `this`

В Options API `this` указывает на экземпляр компонента. Через него можно получить доступ к `this.data`, `this.props`, `this.$emit`, `this.$refs` и другим свойствам. Это удобно, но делает код менее предсказуемым при использовании стрелочных функций или TypeScript.

В Composition API `this` недоступен. Всё, что нужно, передаётся явно: `props` — через `defineProps`, события — через `defineEmits`, ссылки — через реактивные refs. Это устраняет магию `this`, но требует явного импорта хелперов.

### Реактивность

В Options API реактивное состояние объявляется в `data()`. Vue делает его реактивным автоматически. Работа с примитивами и объектами выглядит естественно: `this.count++`, `this.user.name = 'Alice'`.

В Composition API разработчик сам выбирает инструмент: `ref` для примитивов и объектов, `reactive` для объектов, `computed` для производных. Доступ к `ref` внутри скрипта требует `.value`, что является особенностью, к которой нужно привыкнуть.

### Переиспользование логики

В Options API переиспользование логики исторически решалось через mixins. Mixin — это объект с опциями, который объединяется с компонентом. Проблемы mixins:

- неявные зависимости: компонент использует данные из mixin, но это не видно сразу;
- коллизии имён: два mixin могут объявить одно и то же свойство;
- сложность отладки: источник поведения неочевиден.

Composition API заменяет mixins на **composables** — функции с префиксом `use`, которые инкапсулируют реактивное состояние и побочные эффекты. Composables явно импортируются, возвращают только то, что нужно, и легко комбинируются.

### Поддержка TypeScript

Options API можно типизировать, но это менее естественно. Типы `props`, `data` и `computed` приходится описывать через декораторы или JSDoc, а `this` не всегда выводится корректно.

Composition API с `<script setup lang="ts">` даёт почти обычный TypeScript-опыт: `defineProps<{ title: string }>()`, типизированные composables, автодополнение и проверка типов без лишних обёрток.

### Tree-shaking

Composition API лучше дружит с tree-shaking. Импортированные функции из `vue` могут быть удалены сборщиком, если не используются. Options API предполагает регистрацию опций на объекте компонента, что менее дружелюбно к статическому анализу.

### Жизненный цикл

В Options API хуки жизненного цикла — это опции компонента: `mounted`, `updated`, `unmounted` и т.д.

В Composition API это функции с префиксом `on`: `onMounted`, `onUpdated`, `onUnmounted`. Их можно вызывать внутри composables, что делает управление побочными эффектами более модульным.

---

## Один компонент на двух API

Чтобы почувствовать разницу, рассмотрим компонент, который загружает пользователя по `userId`, показывает статус загрузки и вычисляет полное имя.

### Options API

```vue
<!-- UserProfileOptions.vue -->
<template>
  <div>
    <p v-if="loading">Loading...</p>
    <div v-else-if="user">
      <h2>{{ fullName }}</h2>
      <p>{{ user.email }}</p>
    </div>
    <p v-else>User not found</p>
  </div>
</template>

<script>
import { fetchUserById } from './api';

export default {
  name: 'UserProfileOptions',

  props: {
    userId: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      user: null,
      loading: false,
    };
  },

  computed: {
    fullName() {
      if (!this.user) return '';
      return `${this.user.firstName} ${this.user.lastName}`;
    },
  },

  watch: {
    userId: {
      immediate: true,
      handler(newId) {
        this.loadUser(newId);
      },
    },
  },

  mounted() {
    this.loadUser(this.userId);
  },

  methods: {
    async loadUser(id) {
      this.loading = true;
      try {
        this.user = await fetchUserById(id);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
```

Логика загрузки пользователя размазана по `data`, `computed`, `watch`, `methods` и `mounted`. Компонент небольшой, но даже здесь приходится прыгать между секциями.

### Composition API с `<script setup>`

```vue
<!-- UserProfileComposition.vue -->
<template>
  <div>
    <p v-if="loading">Loading...</p>
    <div v-else-if="user">
      <h2>{{ fullName }}</h2>
      <p>{{ user.email }}</p>
    </div>
    <p v-else>User not found</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { fetchUserById } from './api';

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

// --- Загрузка пользователя ---
const user = ref(null);
const loading = ref(false);

const fullName = computed(() => {
  if (!user.value) return '';
  return `${user.value.firstName} ${user.value.lastName}`;
});

const loadUser = async (id) => {
  loading.value = true;
  try {
    user.value = await fetchUserById(id);
  } finally {
    loading.value = false;
  }
};

watch(() => props.userId, (newId) => {
  loadUser(newId);
}, { immediate: true });

onMounted(() => {
  loadUser(props.userId);
});
</script>
```

Здесь вся логика загрузки пользователя сгруппирована в одном месте. Читая компонент сверху вниз, вы видите последовательность: входные параметры, состояние, производное состояние, метод, реакция на изменение `userId`, загрузка при монтировании.

### Ещё короче: выносим логику в composable

С Composition API логику загрузки пользователя можно вынести в `useUser`:

```ts
// composables/useUser.ts
import { ref, computed, watch, onMounted } from 'vue';
import { fetchUserById } from '../api';

export function useUser(userIdRef) {
  const user = ref(null);
  const loading = ref(false);

  const fullName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName} ${user.value.lastName}`;
  });

  const loadUser = async (id) => {
    loading.value = true;
    try {
      user.value = await fetchUserById(id);
    } finally {
      loading.value = false;
    }
  };

  watch(userIdRef, (newId) => {
    loadUser(newId);
  }, { immediate: true });

  onMounted(() => {
    loadUser(userIdRef.value);
  });

  return { user, loading, fullName, loadUser };
}
```

```vue
<!-- UserProfileComposition.vue -->
<script setup>
import { toRef } from 'vue';
import { useUser } from './composables/useUser';

const props = defineProps({ userId: { type: String, required: true } });
const userIdRef = toRef(props, 'userId');

const { user, loading, fullName } = useUser(userIdRef);
</script>
```

Этот composable можно использовать в других компонентах: странице пользователя, модальном окне, форме редактирования. В Options API достичь такой же чистоты переиспользования сложнее.

---

## Когда использовать Options API

Несмотря на то что Composition API — современный стандарт, Options API остаётся поддерживаемым и иногда уместным.

### Старые проекты на Vue 2

Если проект на Vue 2 и полноценная миграция невозможна, новые компоненты часто пишутся в том же стиле, что и существующие. Vue 2.7 добавила часть Composition API, но полный переход на `<script setup>` возможен только при миграции на Vue 3.

### Небольшие компоненты без сложной логики

Для простых компонентов вроде кнопки, бейджа или иконки Options API может быть компактнее. Однако даже в таких случаях `<script setup>` обычно не длиннее, а TypeScript-поддержка лучше.

### Обучение новичков

Некоторые преподаватели считают, что Options API проще для первого знакомства с Vue, потому что у него жёсткая структура: «сюда клади данные, сюда — методы». Это спорный тезис, но он встречается.

### Библиотеки и плагины с поддержкой Vue 2

Если библиотека должна работать и в Vue 2, и в Vue 3, иногда проще писать на Options API, чтобы минимизировать различия в runtime.

**Вывод:** Options API оправдан в legacy-коде, простых компонентах и ситуациях, когда совместимость с Vue 2 важнее современных практик. Для новых проектов на Vue 3 предпочтительнее Composition API.

---

## Когда использовать Composition API

Composition API становится очевидным выбором в большинстве современных сценариев.

### Сложные компоненты

Если компонент решает несколько задач одновременно — загружает данные, управляет формой, слушает события клавиатуры, обновляет URL — Composition API позволяет сгруппировать каждую задачу в понятный блок. Это снижает когнитивную нагрузку при чтении.

### TypeScript

Если проект использует TypeScript, Composition API с `<script setup lang="ts">` даёт лучший вывод типов, типизированные пропсы и emits, типизированные composables. Options API в этом плане уступает.

### Переиспользование логики

Когда одна и та же логика нужна в нескольких компонентах, composables — более чистое решение, чем mixins. Они явно объявляют зависимости, не создают коллизий имён и хорошо тестируются изолированно.

### Интеграция с внешними реактивными системами

Composition API проще интегрируется с внешними сторами, RxJS-подобными потоками или собственными реактивными примитивами. `ref`, `computed`, `watch`, `watchEffect` можно комбинировать с любым JavaScript-кодом.

### Новые проекты на Vue 3

Официальная рекомендация Vue: используйте Composition API + `<script setup>` для новых проектов. Это обеспечивает лучшую поддержку инструментов, актуальные примеры в документации и совместимость с экосистемой composables, включая VueUse.

---

## Миграция внутри проекта

Редко удаётся переписать весь проект за раз. Обычно миграция идёт постепенно: компонент за компонентом, фича за фичей.

### Можно ли смешивать API в одном проекте

Да. В одном проекте могут соседствовать компоненты на Options API и компоненты на Composition API. Vue не накладывает ограничений на уровне приложения. Это позволяет мигрировать постепенно, не замораживая разработку новых фич.

### Нельзя смешивать в одном компоненте

Нельзя одновременно использовать `setup()` и `<script setup>` в одном компоненте. Можно использовать обычный `<script>` для объявления опций вроде `name` или `inheritAttrs` вместе с `<script setup>`, но это не полноценное смешивание двух API для логики компонента.

```vue
<script>
// Этот блок используется только для мета-опций
export default {
  name: 'LegacyWrapper',
  inheritAttrs: false,
};
</script>

<script setup>
// Основная логика на Composition API
import { ref } from 'vue';
const count = ref(0);
</script>
```

### Стратегия миграции

**1. Не трогайте ради тренда**

Работающий код на Options API не обязан быть переписан немедленно. Миграция имеет смысл, когда компонент усложняется, когда нужна TypeScript-типизация или когда фича активно развивается.

**2. Выносите логику в composables первым делом**

Даже если компонент остаётся на Options API, общую логику можно вынести в composable и вызывать его из `setup()`. Это сокращает дублирование и облегчает будущий переход.

```vue
<script>
import { useUser } from './composables/useUser';

export default {
  props: ['userId'],
  setup(props) {
    const { user, loading, fullName } = useUser(() => props.userId);
    return { user, loading, fullName };
  },
};
</script>
```

**3. Мигрируйте компоненты по приоритету**

Начинайте с компонентов, которые:

- содержат несколько логических фич;
- активно изменяются;
- нуждаются в TypeScript;
- копируются между проектами.

Простые презентационные компоненты можно оставить на Options API, если они не мешают.

**4. Сохраняйте публичный API компонента**

При миграции важно сохранить `props`, `emits` и экспонируемые методы. Это позволяет заменить реализацию без изменения родительских компонентов.

**5. Покрывайте тестами до и после**

Миграция — хороший повод убедиться, что компонент покрыт тестами. Тесты фиксируют поведение и помогают не сломать логику при переносе.

### Пример миграции шаг за шагом

Исходный компонент на Options API:

```vue
<script>
export default {
  props: ['initialCount'],
  data() {
    return { count: this.initialCount };
  },
  methods: {
    increment() { this.count++; },
    decrement() { this.count--; },
  },
};
</script>
```

Шаг 1: вынести логику счётчика в composable:

```ts
// composables/useCounter.ts
import { ref } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  return { count, increment, decrement };
}
```

Шаг 2: переписать компонент на `<script setup>`:

```vue
<script setup>
import { useCounter } from './composables/useCounter';

const props = defineProps({
  initialCount: { type: Number, default: 0 },
});

const { count, increment, decrement } = useCounter(props.initialCount);
</script>
```

Теперь логика счётчика переиспользуемая, протестированная изолированно и легко мигрируемая между компонентами.

---

## Сравнение с React

Хотя Vue и React — разные фреймворки, параллели между их подходами помогают быстрее понять различия внутри Vue.

| Аспект | Options API | Composition API | Аналог в React |
|---|---|---|---|
| **Организация кода** | По опциям: `data`, `methods`, `computed` | По фичам внутри `setup()` | Классовые компоненты / функции с hooks |
| **Доступ к экземпляру** | `this` | Нет `this`, всё явно | `this` в классах / нет в функциях |
| **Состояние** | `data()` | `ref`, `reactive` | `useState`, `useReducer` |
| **Производное состояние** | `computed` | `computed` | `useMemo` |
| **Побочные эффекты** | `watch`, lifecycle hooks | `watch`, `watchEffect`, lifecycle hooks | `useEffect` |
| **Переиспользование логики** | Mixins | Composables | HOC, render props, custom hooks |
| **Поддержка TypeScript** | Средняя | Отличная | Отличная с hooks |
| **Место в экосистеме** | Legacy, но поддерживается | Современный стандарт | Hooks — современный стандарт |

Options API ближе к классовым компонентам React: жёсткая структура, `this`, lifecycle-методы. Composition API ближе к React Hooks: функции, явные зависимости, композиция. Главное отличие от React Hooks — в Vue composables можно вызывать более свободно, а зависимости в `computed` и `watchEffect` отслеживаются автоматически.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- **Используйте Composition API + `<script setup>` для новых проектов.** Это официальная рекомендация и современный стандарт.
- **Читайте Options API без фобии.** Legacy-код никуда не денется; умение понимать `data`, `computed`, `watch`, `methods` и lifecycle-опции обязательно для собеседований.
- **Выносите общую логику в composables.** Даже в проекте с Options API composables помогают избавиться от дублирования.
- **Мигрируйте постепенно.** Не переписывайте всё сразу ради архитектурной чистоты.
- **Сохраняйте контракт компонента.** При миграции не меняйте `props`, `emits` и экспонируемые методы без необходимости.
- **Используйте TypeScript при миграции.** Переход на Composition API — хороший момент, чтобы добавить типизацию.

### ❌ Не делайте

- **Не пишите новые компоненты на Options API без веской причины.** Это усложняет поддержку и снижает согласованность кодовой базы.
- **Не смешивайте `setup()` и `<script setup>` в одном компоненте.** Vue это запрещает, и такой код не скомпилируется.
- **Не используйте mixins в новом коде.** Composables решают те же задачи чище.
- **Не мигрируйте ради миграции.** Работающий простой компонент на Options API может оставаться как есть.
- **Не забывайте про `.value` при работе с `ref` в Composition API.** Это типичная ошибка при переходе с Options API.
- **Не копируйте `this`-паттерны в Composition API.** Вместо `this.$emit` используйте `defineEmits`, вместо `this.$refs` — шаблонные refs.

---

## Ключевые тезисы для интервью

1. **Options API** — классический стиль Vue, где логика разбивается по опциям `data`, `methods`, `computed`, `watch`, lifecycle hooks. Он остаётся поддерживаемым, но позиционируется как legacy.
2. **Composition API** — современный стиль, где код группируется по логическим фичам внутри `setup()` или `<script setup>`. Это основной рекомендуемый подход для новых проектов на Vue 3.
3. Главное различие в организации кода: Options API группирует по типам сущностей, Composition API — по задачам.
4. В Options API используется `this` и доступ к экземпляру компонента; в Composition API `this` отсутствует, а всё передаётся явно.
5. Переиспользование логики в Options API исторически делалось через mixins, которые имеют проблемы с неявными зависимостями и коллизиями имён. Composition API заменяет их на composables.
6. Composition API лучше подходит для TypeScript, сложных компонентов, тестирования логики изолированно и интеграции с внешними реактивными системами.
7. В одном проекте можно смешивать компоненты на Options API и Composition API, что позволяет мигрировать постепенно.
8. Нельзя одновременно использовать `setup()` и `<script setup>` в одном компоненте. Можно использовать обычный `<script>` для мета-опций рядом с `<script setup>`.
9. Миграция эффективнее всего идёт через выделение composables и перепись наиболее сложных или часто изменяемых компонентов первыми.
10. Options API ближе к классовым компонентам React, а Composition API — к React Hooks, хотя Vue-composables свободнее в вызове и используют автоматическое отслеживание зависимостей.

---

## Заключение

Options API и Composition API — это не два враждующих лагеря, а два этапа развития Vue. Options API сделал фреймворк популярным благодаря простоте и понятной структуре. Composition API решает проблемы масштабирования и TypeScript-типизации, которые становятся критичными в больших приложениях.

Для подготовки к собеседованиям важно уметь читать и понимать оба подхода. Интервьюер может показать компонент на Options API и спросить, как бы он выглядел на Composition API, или наоборот. Умение объяснить, почему Composition API предпочтительнее для новых проектов, и как мигрировать legacy-код безболезненно, сильно повышает вашу ценность как разработчика.

Используйте Composition API + `<script setup>` для нового кода, сохраняйте Options API для поддержки legacy и мигрируйте постепенно, начиная с самых болезненных компонентов.

---

## Полезные ссылки

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) — официальное сравнение Options API и Composition API.
- [Options API](https://vuejs.org/api/options-state.html) — документация по классическому API.
- [Composition API](https://vuejs.org/api/composition-api-setup.html) — документация по Composition API.
- [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) — подробное руководство по синтаксису.
- [Composables](https://vuejs.org/guide/reusability/composables.html) — рекомендации по переиспользованию логики.
- [Migration from Vue 2](https://vuejs.org/guide/migration/introduction.html) — официальное руководство по миграции, включая работу с Options API.
- [VueUse](https://vueuse.org/) — библиотека готовых composables, демонстрирующая мощь Composition API.
