---
title: "Формы и валидация во Vue"
section: vue
description: "Формы во Vue 3: v-model и defineModel, модификаторы, валидация на composables, vee-validate с zod, FormKit и доступность полей."
order: 18
tags: ["forms", "v-model", "defineModel", "validation", "vee-validate", "formkit"]
questions:
  - "Как `v-model` работает под капотом и почему привязка зависит от типа поля"
  - "Зачем нужен `defineModel` и какой бойлерплейт он убирает по сравнению с props + emit"
  - "Как работают встроенные модификаторы `.lazy`, `.number`, `.trim` и кастомные `modelModifiers`"
  - "Как построить переиспользуемую валидацию поля на composable и когда показывать ошибки"
  - "Как `vee-validate` и zod связывают схему и поля и почему schema-first удобнее ручных проверок"
  - "Что обязательно нужно для доступности формы с точки зрения ARIA и разметки"
  - "Почему клиентская валидация не заменяет серверную"
answers:
  - "`v-model` — сахар над парой prop + событие: для текстовых полей это `:value` плюс `@input`, для `checkbox` и `radio` — `:checked` плюс `@change`, для `<select>` — `:value` плюс `@change`, поэтому одно и то же поле даёт boolean, скаляр или массив значений."
  - "`defineModel()` (Vue 3.4+) автоматически объявляет prop `modelValue` и событие `update:modelValue` и возвращает ref, запись в который эмитит событие; это заменяет ручную связку `props` + `emit` или computed с get/set, а `defineModel('firstName')` делает то же для именованной модели."
  - "`.lazy` переключает привязку с `input` на `change`, `.number` парсит введённое значение как число, `.trim` обрезает пробелы по краям; кастомные модификаторы приходят в prop `modelModifiers` (или `<name>Modifiers`) и обрабатываются в опции `set()` у `defineModel`."
  - "Composable вроде `useField(initial, rules)` держит `value`, `error`, `touched` и `valid`, вычисляет текст ошибки по массиву правил и помечает поле `touched` на `blur`; показывают ошибку только после взаимодействия, а async-проверки дебаунсят и защищают от гонок."
  - "`toTypedSchema(z.object(...))` превращает zod-схему в правила vee-validate, `useForm` управляет состоянием и сабмитом, а `defineField('email')` возвращает привязки и мета для поля; одна схема даёт и валидацию, и TypeScript-типы через `z.infer`."
  - "Каждому полю нужен `<label for>` (или обёртка), при ошибке — `aria-invalid=\"true\"` и `aria-describedby` с id текста ошибки, группы radio/checkbox — в `<fieldset>` с `<legend>`, а сообщение выводят в `role=\"alert\"`; цвет не должен быть единственным сигналом."
  - "Клиентскую проверку легко обойти через ручной запрос или отключённый JavaScript, поэтому она решает задачу UX и снижает нагрузку, а сервер обязан повторно валидировать данные, потому что только он является источником истины."
---

# Формы и валидация во Vue

Формы — место, где реактивность Vue встречается с реальным пользователем: десятки полей, противоречивые правила и ошибки, которые нельзя показать слишком рано или слишком поздно. На старте всё сводится к `v-model`, но в продакшене появляются составные компоненты, схемы валидации, асинхронные проверки и требования доступности.

В этой статье разберём, как `v-model` устроен на разных типах полей, зачем нужен `defineModel` и как с его помощью строить контролируемые компоненты, как работать с модификаторами, как собирать валидацию своими composables, когда брать `vee-validate` с zod или `FormKit`, а также как не забыть про `aria`-атрибуты и связь ошибок с полями.

## Содержание

1. [v-model на нативных элементах](#v-model-на-нативных-элементах)
2. [defineModel и контролируемые компоненты](#definemodel-и-контролируемые-компоненты)
3. [Несколько v-model и модификаторы](#несколько-v-model-и-модификаторы)
4. [Валидация своими руками: composables](#валидация-своими-руками-composables)
5. [vee-validate и schema-валидация](#vee-validate-и-schema-валидация)
6. [FormKit и schema-driven формы](#formkit-и-schema-driven-формы)
7. [Доступность форм](#доступность-форм)
8. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## v-model на нативных элементах

`v-model` — синтаксический сахар над парой «значение + событие». То, во что он разворачивается, зависит от типа поля, и это первое, что спрашивают на собеседовании.

Для текстовых полей и `textarea` привязка идёт к `value` и событию `input`:

```vue
<script setup>
import { ref } from 'vue';

const email = ref('');
const bio = ref('');
</script>

<template>
  <input v-model="email" />
  <textarea v-model="bio"></textarea>
</template>
```

`textarea` использует `v-model`, а не интерполяцию: содержимое `<textarea>{{ bio }}</textarea>` во Vue не работает как двусторонняя привязка.

### Checkbox

У чекбокса поведение разное в зависимости от того, что связано:

```vue
<script setup>
import { ref } from 'vue';

const agreed = ref(false);          // одиночный чекбокс → boolean
const skills = ref([]);             // группа чекбоксов → массив
const picked = ref('yes');          // кастомные значения
</script>

<template>
  <input type="checkbox" v-model="agreed" />

  <input type="checkbox" value="vue" v-model="skills" />
  <input type="checkbox" value="ts" v-model="skills" />

  <input type="checkbox" v-model="picked" true-value="yes" false-value="no" />
</template>
```

- Если `v-model` привязан к boolean — чекбокс включает/выключает его.
- Если к массиву — отмеченные `value` добавляются и удаляются из массива.
- `true-value` / `false-value` задают значения вместо `true` / `false`.

### Radio и select

У radio и `select` значение берётся из `value`, а изменение приходит по `change`:

```vue
<script setup>
import { ref } from 'vue';

const plan = ref('pro');
const cities = ref([]);
const user = ref(null);
</script>

<template>
  <input type="radio" value="free" v-model="plan" />
  <input type="radio" value="pro" v-model="plan" />

  <select v-model="cities" multiple>
    <option value="msk">Москва</option>
    <option value="spb">Санкт-Петербург</option>
  </select>

  <!-- :value позволяет привязать объект -->
  <select v-model="user">
    <option :value="{ id: 1, name: 'Анна' }">Анна</option>
    <option :value="{ id: 2, name: 'Борис' }">Борис</option>
  </select>
</template>
```

Когда для `<option>` используется `:value` с объектом, Vue кладёт объект в отдельное свойство элемента и сравнивает значения, а не строки. У `multiple`-селекта модель — массив.

> Начальное значение `select` без совпадающей опции рендерится «ничем выбранным». Для объектов всегда инициализируйте модель тем же значением (или `null`).

Весь механизм `v-model` как сахар над событием подробно разобран в статье [События во Vue](./events.md).

---

## defineModel и контролируемые компоненты

Во Vue `v-model` **контролируем**: значением владеет состояние родителя, а поле только отображает его и сообщает об изменениях событиями. Это отличается от терминологии React, где «неконтролируемое» поле хранит значение в DOM; во Vue такой сценарий (шаблонная ссылка + чтение DOM вручную) нужен редко, потому что источником истины всегда выступает реактивная модель.

Чтобы сделать свой компонент совместимым с `v-model`, исторически требовалось вручную объявить prop и событие:

```vue
<!-- BaseInput.vue: ручной вариант -->
<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <input
    :value="props.modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
```

Начиная с Vue 3.4 для этого есть макрос `defineModel()`, который сам объявляет prop и событие и возвращает ref:

```vue
<!-- BaseInput.vue -->
<script setup lang="ts">
const model = defineModel<string>();
</script>

<template>
  <input v-model="model" />
</template>
```

Запись в `model` эмитит `update:modelValue`, поэтому компонент работает с `<BaseInput v-model="email" />` без ручной связки. Макрос принимает типы, обязательность и дефолт:

```ts
const model = defineModel<string>();                      // string | undefined
const required = defineModel<string>({ required: true }); // string
const withDefault = defineModel<string>({ default: '' });
```

Типизация `defineModel` и генерация типов — часть темы [TypeScript во Vue](../typescript/vue.md). Если по какой-то причине вы не используете макрос, эквивалент на computed get/set описан в статье про [события](./events.md).

---

## Несколько v-model и модификаторы

Компонент может поддерживать несколько моделей сразу. Имя модели задаётся аргументом:

```vue
<!-- UserForm.vue -->
<script setup lang="ts">
const firstName = defineModel<string>('firstName');
const lastName = defineModel<string>('lastName');
</script>

<template>
  <input v-model="firstName" placeholder="Имя" />
  <input v-model="lastName" placeholder="Фамилия" />
</template>
```

```vue
<!-- использование -->
<UserForm v-model:first-name="first" v-model:last-name="last" />
```

Именованная модель `firstName` превращается в prop `firstName` и событие `update:firstName`.

### Встроенные модификаторы

| Модификатор | Действие |
|---|---|
| `.lazy` | Слушать `change` вместо `input` |
| `.number` | Приводить значение к числу |
| `.trim` | Обрезать пробелы по краям |

```vue
<template>
  <input v-model.trim="name" />
  <input v-model.number="age" type="number" />
  <input v-model.lazy="search" />
</template>
```

Особенности:

- `.lazy` удобен для полей, где валидация или запрос должны происходить по завершению ввода, а не на каждый символ.
- `.number` использует `parseFloat`; если значение не парсится, останется исходная строка. Для `type="number"` без модификатора `v-model` всё равно вернёт строку.
- `.trim` не влияет на значение по умолчанию, пока пользователь не изменит поле.

### Кастомные модификаторы

Модификаторы на компоненте приходят в специальный prop. При использовании `defineModel` их получают вторым элементом кортежа и обрабатывают в опции `set()`:

```vue
<!-- TitleInput.vue -->
<script setup lang="ts">
const [title, titleModifiers] = defineModel<string>('title', {
  set(value) {
    if (titleModifiers.capitalize && value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  },
});
</script>

<template>
  <input v-model="title" />
</template>
```

```vue
<!-- использование: первая буква будет заглавной -->
<TitleInput v-model:title.capitalize="heading" />
```

Для модели по умолчанию модификаторы лежат в `modelModifiers`, для именованной — в `<name>Modifiers`. Если макрос не используется, этот prop объявляют вручную и читают `props.modelModifiers.capitalize`. Кастомные модификаторы удобны для нормализации (капитализация, фильтрация символов), но не стоит складывать в них бизнес-логику — это роль валидации.

---

## Валидация своими руками: composables

Простейшая форма валидируется прямо в компоненте, но при росте числа полей логику выносят в composable — это идиоматично для Composition API и переиспользуется между формами.

```ts
// useField.ts
import { ref, computed, type Ref } from 'vue';

type Rule<T> = (value: T) => string | true;

export function useField<T>(initial: T, rules: Rule<T>[]) {
  const value = ref(initial) as Ref<T>;
  const touched = ref(false);

  const error = computed(() => {
    for (const rule of rules) {
      const result = rule(value.value);
      if (result !== true) return result;
    }
    return '';
  });

  const valid = computed(() => error.value === '');
  const showError = computed(() => touched.value && !valid.value);

  return { value, error, valid, touched, showError };
}
```

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useField } from './useField';

const email = useField('', [
  (v) => (v.length > 0 ? true : 'Введите email'),
  (v) => (/\S+@\S+\.\S+/.test(v) ? true : 'Некорректный email'),
]);

const formValid = computed(() => email.valid.value);

function submit() {
  if (!formValid.value) return;
  // отправка
}
</script>

<template>
  <form @submit.prevent="submit">
    <input
      v-model="email.value.value"
      type="email"
      @blur="email.touched.value = true"
    />
    <span v-if="email.showError.value">{{ email.error.value }}</span>
    <button :disabled="!formValid">Отправить</button>
  </form>
</template>
```

Ключевые принципы ручной валидации:

- **Показывайте ошибку после взаимодействия.** Флага `touched` достаточно, чтобы не пугать пользователя красным сразу. Правила UX и псевдоклассы `:user-invalid` разобраны в [общей статье про формы](../html-css/html-forms-validation.md).
- **Разделяйте синхронные и асинхронные правила.** Async-проверка (занят ли логин) должна дебаунситься и защищаться от гонок, чтобы устаревший ответ не перезаписал актуальный. Это та же проблема, что и при отмене запросов — подробности в [статье про отмену запросов](../api-communication/request-abortion.md), а готовый дебаунс есть в [VueUse](./vueuse.md) (`useDebounceFn`).
- **Не дублируйте состояние.** Значение поля живёт в `v-model`, ошибки — производные от него через `computed`, а не отдельные `ref`.

Для крупных форм удобно подняться на уровень выше и агрегировать поля в `useForm`: он хранит все `useField`, реализует `submit`, `reset` и `isDirty`.

---

## vee-validate и schema-валидация

Ручные composables хороши, пока правила локальны. Когда нужно много форм и согласованность с бэкендом, берут **schema-first** подход с `vee-validate` и zod/yup.

```ts
// forms/signup.ts
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Минимум 8 символов'),
  }),
);

export function useSignupForm() {
  const { handleSubmit, errors, defineField } = useForm({
    validationSchema: schema,
  });

  const [email, emailAttrs] = defineField('email');
  const [password, passwordAttrs] = defineField('password');

  const onSubmit = handleSubmit(async (values) => {
    await api.post('/signup', values);
  });

  return { email, emailAttrs, password, passwordAttrs, errors, onSubmit };
}
```

```vue
<script setup lang="ts">
import { useSignupForm } from './forms/signup';

const { email, emailAttrs, password, passwordAttrs, errors, onSubmit } =
  useSignupForm();
</script>

<template>
  <form @submit="onSubmit">
    <label for="email">Email</label>
    <input
      id="email"
      v-model="email"
      v-bind="emailAttrs"
      :aria-invalid="!!errors.email"
      aria-describedby="email-error"
    />
    <span v-if="errors.email" id="email-error" role="alert">
      {{ errors.email }}
    </span>

    <label for="password">Пароль</label>
    <input
      id="password"
      type="password"
      v-model="password"
      v-bind="passwordAttrs"
      :aria-invalid="!!errors.password"
      aria-describedby="password-error"
    />
    <span v-if="errors.password" id="password-error" role="alert">
      {{ errors.password }}
    </span>

    <button type="submit">Зарегистрироваться</button>
  </form>
</template>
```

Почему схема выгоднее набора отдельных проверок:

- **Единый источник правил.** Те же ограничения описывают тип данных: `z.infer<typeof schema>` даёт TypeScript-тип значений формы, который можно переиспользовать в API-клиенте и тестах.
- **Сообщения рядом с правилом.** Тексты ошибок задаются в схеме, а не размазаны по шаблону.
- **Смена библиотеки не ломает форму.** `vee-validate` умеет работать и с yup, и с zod через `toTypedSchema`; если схемы ещё нет, можно объявлять правила напрямую в `useForm`.
- **Компонент `Field`.** Вместо `defineField` можно использовать `<Field name="email" v-slot="{ field, errors }">`, но для свободной разметки удобнее привязки.

Schema-first отлично ложится на команды, где валидация уже описана на сервере: одну схему держат в общем пакете и переиспользуют на клиенте.

---

## FormKit и schema-driven формы

Если нужен готовый компонентный слой — метки, ошибки, доступность и темизация «из коробки» — смотрят в сторону `FormKit`. Он подключается плагином и предоставляет собственный набор полей:

```ts
// main.ts
import { createApp } from 'vue';
import { plugin, defaultConfig } from '@formkit/vue';
import App from './App.vue';

createApp(App).use(plugin, defaultConfig).mount('#app');
```

```vue
<template>
  <FormKit type="form" @submit="submitHandler">
    <FormKit
      type="email"
      name="email"
      label="Email"
      validation="required|email"
      validation-visibility="blur"
    />
    <FormKit
      type="password"
      name="password"
      label="Пароль"
      validation="required|length:8"
    />
  </FormKit>
</template>
```

Что даёт FormKit:

- **Встроенная доступность.** Метки, `aria-invalid`, `aria-describedby` и live-регион для ошибок уже связаны между полем и сообщением.
- **Декларативная валидация.** Правила вида `required|email` задаются строкой, а кастомные добавляются в конфиг.
- **Темизация.** Разметка полей вынесена в «секции», которые переопределяются без правки логики.

Обратная сторона — **ориентация на фреймворк**: свои соглашения, разметка и вес в бандле. Форма оправдывает себя на больших продуктах с типовыми формами; для пары полей это лишняя зависимость. Тот же принцип, что и при выборе готовых composables в [VueUse](./vueuse.md): сначала оцените, сколько кода реально экономите.

---

## Доступность форм

Форма — это интерфейс для всех пользователей, включая тех, кто работает со скринридером и только с клавиатуры. Vue не делает форму доступной автоматически, поэтому разметку и атрибуты нужно закладывать осознанно. Подробный разбор паттернов — в статье [Доступные компоненты во Vue](./accessibility.md); здесь отметим обязательный минимум для формы.

```vue
<script setup lang="ts">
import { ref } from 'vue';

const email = ref('');
const error = ref('');

function onBlur() {
  error.value = /\S+@\S+\.\S+/.test(email.value) ? '' : 'Некорректный email';
}
</script>

<template>
  <div class="field">
    <label for="email">Email</label>
    <input
      id="email"
      type="email"
      v-model="email"
      :aria-invalid="!!error"
      :aria-describedby="error ? 'email-error' : undefined"
      @blur="onBlur"
    />
    <p v-if="error" id="email-error" role="alert">{{ error }}</p>
  </div>
</template>
```

Чек-лист доступной формы:

- **Метка.** `<label for="id">` связывает текст с полем; для групп используйте `<fieldset>` и `<legend>`. Placeholder не заменяет метку.
- **Ошибки.** `aria-invalid="true"` и `aria-describedby`, указывающий на id текста ошибки, дают скринридеру прочитать подсказку вместе с полем; сам текст выводят в `role="alert"` или live-регион, чтобы изменение объявлялось.
- **Группы.** Radio и checkbox объединяют в `<fieldset>` с `<legend>` — иначе непонятно, к чему относится выбор.
- **Клавиатура и фокус.** Форма должна проходиться табом по порядку, а при ошибке отправки фокус переводят на первое невалидное поле.
- **Цвет — не сигнал.** Ошибку нельзя показывать только красной рамкой: нужен текст и, желательно, иконка.
- **Запрет двойной отправки.** Пока запрос идёт, кнопку блокируют (`:disabled`) или переводят в состояние загрузки.

Для простых ограничений сначала используйте нативную валидацию браузера (`required`, `type="email"`, `pattern`) и Constraint Validation API — это бесплатный слой UX, разобранный в [статье про Constraint Validation API](../html-css/html-forms-validation.md). Кастомные компоненты, заменяющие `<input>`, обязаны воспроизводить эти атрибуты и пробрасывать `$attrs`.

---

## Лучшие практики и антипаттерны

### Делайте

- **Единый источник истины.** Значение поля живёт в `v-model`; производные (ошибки, «грязность») считайте через `computed`, а не дублируйте в отдельных `ref`.
- **Используйте `defineModel`** для кастомных полей — это короче и типобезопаснее ручной связки props + emit.
- **Валидируйте на `blur` и `submit`**, а ошибку показывайте после взаимодействия; повторная проверка на `input` — только у уже тронутого поля.
- **Выносите правила в схему** (zod/yup), когда форм много; одна схема даёт и валидацию, и типы.
- **Дебаунсьте async-проверки** и защищайте их от гонок.
- **Нормализуйте данные в модели** (`.trim`, капитализация через кастомный модификатор), а не разбросанными строками в шаблоне.
- **Закладывайте доступность сразу**: label, `aria-invalid`, `aria-describedby`, `fieldset`.

### Не делайте

- **Не мутируйте props.** Кастомное поле сообщает об изменении событием, а не правит входящее значение.
- **Не валидируйте на каждый символ без необходимости.** Это шумно и дорого; для тяжёлых проверок нужен debounce.
- **Не показывайте ошибки до взаимодействия.** Пустая форма с красными полями при загрузке — классический антипаттерн.
- **Не дублируйте состояние.** Отдельный `ref` рядом с `v-model` быстро рассинхронизируется.
- **Не полагайтесь только на клиентскую валидацию.** Она обходится; сервер обязан проверять данные повторно.
- **Не смешивайте ручную валидацию и `FormKit`/`vee-validate` в одной форме.** Выберите один слой и не размазывайте правила по компонентам.

```vue
<!-- ❌ мутация prop и дублирование состояния -->
<script setup>
const props = defineProps(['modelValue']);
const local = ref(props.modelValue);
watch(() => props.modelValue, (v) => (local.value = v));
</script>

<template>
  <input v-model="local" @input="$emit('update:modelValue', local)" />
</template>
```

---

## Ключевые тезисы для интервью

- `v-model` — сахар над prop + событие, и привязка зависит от типа поля: текстовые поля используют `:value`/`@input`, checkbox и radio — `:checked`/`@change`, `select` — `:value`/`@change`; поэтому модель бывает boolean, скаляром или массивом.
- Во Vue `v-model` контролируем по умолчанию: источник истины — реактивная модель, а не DOM; `defineModel()` (3.4+) сам объявляет prop и `update`-событие и возвращает ref, заменяя ручную связку и computed get/set.
- Модификаторы `.lazy`, `.number`, `.trim` покрывают типовые преобразования, а кастомные приходят в `modelModifiers` / `<name>Modifiers` и обрабатываются в `set()`; именованные модели (`v-model:first-name`) позволяют держать несколько `v-model` на компоненте.
- Валидацию строят вокруг состояния поля (`value`, `error`, `touched`): ошибку показывают после `blur`, а async-проверки дебаунсят и защищают от гонок, чтобы устаревший ответ не перезаписал актуальный.
- `vee-validate` + zod дают schema-first валидацию: `toTypedSchema` связывает схему с формой, а `z.infer` превращает её в TypeScript-тип, общий для клиента и тестов; `FormKit` — готовый schema-driven слой с a11y и темизацией, но более opinionated.
- Доступность формы держится на `<label for>`, `aria-invalid`, `aria-describedby` до текста ошибки, `<fieldset>`/`<legend>` для групп и `role="alert"` для сообщений; клиентская валидация — это UX, а безопасность обеспечивает серверная проверка.

---

## Заключение

Формы во Vue начинаются с `v-model`, но надёжное решение строится из нескольких слоёв. `v-model` управляет значением, `defineModel` делает кастомные поля совместимыми с ним без бойлерплейта, модификаторы нормализуют ввод, а валидация живёт либо в переиспользуемых composables, либо в schema-first связке `vee-validate` + zod (или в готовом `FormKit`).

Практические правила просты: держите единый источник истины, показывайте ошибки после взаимодействия, выносите правила в схему и не забывайте про `aria`-атрибуты и фокус. И помните, что клиентская валидация улучшает опыт, но последнее слово всегда за сервером.

Попробуйте собрать форму регистрации на `useField`, а затем переписать её же на zod-схеме — так вы почувствуете, когда ручная валидация ещё уместна, а когда Schema-first экономит время.

---

## Полезные ссылки

- [Vue Docs — Form Input Bindings](https://vuejs.org/guide/essentials/forms.html)
- [Vue Docs — Component v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue API — defineModel](https://vuejs.org/api/sfc-script-setup.html#definemodel)
- [vee-validate](https://vee-validate.logaretm.com/v4/)
- [Zod](https://zod.dev/)
- [FormKit](https://formkit.com/)
- [WAI-ARIA Authoring Practices — Forms](https://www.w3.org/WAI/ARIA/apg/)
