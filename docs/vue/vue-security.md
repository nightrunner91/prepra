---
title: "Безопасность Vue"
section: vue
description: "Vue: `v-html`, refs, URL-атрибуты, экранирование интерполяций, хранение токенов и защита от XSS в Composition API."
order: 15
tags: ["vue", "security", "v-html", "xss", "dompurify"]
questions:
  - "Как Vue экранирует текстовые интерполяции и какие инструменты (`v-html`, refs, URL-атрибуты) обходят защиту фреймворка"
  - "Почему `v-html` особенно опасен и почему санитизация обязательна"
  - "Как валидировать URL в `:href` и почему `javascript:` протокол — XSS-вектор, который Vue не блокирует"
  - "Как `ref` и прямой доступ к DOM обходят защиту Vue"
  - "Где безопаснее хранить токены и как работают fetch с авторизацией"
  - "Почему `rel=\"noopener noreferrer\"` обязателен для внешних ссылок"
---

# Безопасность Vue

Vue, как и React, автоматически экранирует текстовые интерполяции — но у него есть мощные инструменты (`v-html`, refs), которые требуют осознанного подхода. Статья разбирает границы защиты фреймворка: где Vue защищает по умолчанию, какие директивы и приёмы обходят эту защиту и как строить безопасный код.

## Содержание

1. [Как Vue защищает от XSS по умолчанию](#как-vue-защищает-от-xss-по-умолчанию)
2. [v-html: двустороннее лезвие](#v-html-двустороннее-лезвие)
3. [Динамические атрибуты и URL](#динамические-атрибуты-и-url)
4. [Refs и императивный DOM](#refs-и-императивный-dom)
5. [Composition API и безопасность](#composition-api-и-безопасность)
6. [Чек-лист безопасности Vue](#чек-лист-безопасности-vue)
7. [Терминология](#терминология)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Как Vue защищает от XSS по умолчанию

Vue, как и React, автоматически экранирует текстовые интерполяции `{{ }}`. Это означает, что любые HTML-теги в строке будут отображены как текст, а не выполнены.

```vue
<template>
  <div>{{ userInput }}</div>
</template>

<script setup>
const userInput = "<script>alert('xss')<\/script>";
</script>
```

Результат в DOM:

```html
<div>&lt;script&gt;alert('xss')&lt;/script&gt;</div>
```

Vue использует `textContent` для вставки текста, что безопасно по умолчанию.

### Атрибуты

Динамические атрибуты тоже экранируются:

```vue
<template>
  <div :title="userTitle">hover me</div>
</template>
```

Но Vue **не проверяет семантику URL**. Если `userTitle` содержит `javascript:alert(1)`, Vue экранирует кавычки, но `javascript:` протокол останется валидным для браузера при использовании в `href`.

---

## v-html: двустороннее лезвие

`v-html` — это прямой аналог `dangerouslySetInnerHTML` в React. Он вставляет HTML как есть, без экранирования.

```vue
<template>
  <!-- ❌ Опасно без санитизации -->
  <div v-html="userHtml"></div>
</template>
```

### Правильное использование

```vue
<script setup>
import { computed } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps(['rawHtml']);

const safeHtml = computed(() =>
  DOMPurify.sanitize(props.rawHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href'],
  })
);
</script>

<template>
  <div v-html="safeHtml"></div>
</template>
```

### Предупреждение в документации

Vue официально предупреждает: `v-html` можно использовать только для доверенного контента. Никогда не используйте его для пользовательского ввода без санитизации.

---

## Динамические атрибуты и URL

Vue не валидирует протоколы URL. Это распространённый вектор:

```vue
<template>
  <!-- ❌ Опасно -->
  <a :href="userUrl">link</a>
</template>
```

Если `userUrl = "javascript:alert(document.cookie)"`, при клике выполнится JavaScript.

### Безопасная ссылка

```vue
<script setup>
const props = defineProps(['href']);

const isSafe = computed(() => {
  return props.href.startsWith('/') ||
         /^https?:\/\//.test(props.href);
});
</script>

<template>
  <a v-if="isSafe" :href="href" rel="noopener noreferrer" target="_blank">
    <slot />
  </a>
  <span v-else>
    <slot />
  </span>
</template>
```

### target="_blank" и rel="noopener"

Всегда используйте `rel="noopener noreferrer"` для внешних ссылок. Это защищает от tabnabbing — атаки, при которой открытая вкладка может изменить `window.opener.location` родительской страницы.

---

## Refs и императивный DOM

Когда вы получаете прямой доступ к DOM-элементу через `ref`, вы обходите защиту Vue.

```vue
<script setup>
import { ref, onMounted } from 'vue';

const el = ref(null);

onMounted(() => {
  // ❌ XSS, если content содержит вредоносный HTML
  el.value.innerHTML = props.content;
});
</script>

<template>
  <div ref="el"></div>
</template>
```

Безопасная альтернатива:

```vue
<script setup>
import { ref, onMounted } from 'vue';
import DOMPurify from 'dompurify';

const el = ref(null);

onMounted(() => {
  el.value.innerHTML = DOMPurify.sanitize(props.content);
});
</script>
```

Лучше всего избегать прямой манипуляции `innerHTML` вообще.

---

## Composition API и безопасность

Composition API не меняет принципов безопасности, но делает некоторые паттерны удобнее.

### Хранение токенов

```ts
// composables/useAuth.ts
import { ref } from 'vue';

const accessToken = ref<string | null>(null);

export function useAuth() {
  const setToken = (token: string) => {
    accessToken.value = token;
  };

  return { accessToken, setToken };
}
```

Токен в памяти защищён от XSS лучше, чем в `localStorage`, но теряется при обновлении страницы.

### Fetch с авторизацией

```ts
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { accessToken } = useAuth();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: accessToken.value ? `Bearer ${accessToken.value}` : '',
    },
  });
}
```

---

## Чек-лист безопасности Vue

- [ ] Использовать `{{ }}` вместо `v-html` для пользовательского текста.
- [ ] Санитизировать HTML перед использованием в `v-html`.
- [ ] Валидировать URL в `:href` и `:src`.
- [ ] Использовать `rel="noopener noreferrer"` для внешних ссылок.
- [ ] Избегать `innerHTML` через refs.

---

## Терминология

| Термин | Значение |
|--------|----------|
| **v-html** | Директива Vue для вставки сырого HTML |
| **ref** | Ссылка на DOM-элемент в Vue |
| **Composition API** | API Vue для организации логики компонентов |
| **DOMPurify** | Библиотека санитизации HTML |
| **Tabnabbing** | Атака через window.opener у открытой вкладки |

---

## Ключевые тезисы для интервью

- Vue автоматически экранирует `{{ }}` через `textContent` — прямая аналогия с JSX в React; `v-html` — прямой эквивалент `dangerouslySetInnerHTML`, без DOMPurify — XSS-уязвимость.
- Vue не проверяет протоколы URL: `javascript:alert(1)` в `:href` выполнится при клике; `rel="noopener noreferrer"` для `target="_blank"` защищает от tabnabbing через `window.opener`.
- `innerHTML` через `ref` обходит защиту фреймворка — избегайте прямой манипуляции DOM; токен сессии в памяти (через composable) защищён от XSS лучше, чем в `localStorage`.

## Заключение

Vue предоставляет хорошую базовую защиту от XSS через автоматическое экранирование, но у него есть мощные инструменты — `v-html` и refs — которые требуют осознанного подхода. Санитизация через DOMPurify, валидация URL и аккуратное хранение токенов закрывают основные векторы. Для более глубокого понимания XSS смотрите статью [XSS: анатомия атаки](../security/security-xss-deep-dive.md), а про безопасность Nuxt — [Безопасность Nuxt](../nuxt/nuxt-security.md).

## Полезные ссылки

- [Vue.js — Security](https://vuejs.org/guide/best-practices/security.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [MDN — noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener)
- [XSS: анатомия атаки](../security/security-xss-deep-dive.md)