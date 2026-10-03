---
title: "Безопасность React"
section: security
description: "React: экранирование JSX, `dangerouslySetInnerHTML`, URL-атрибуты, refs, хранение токенов и защита от XSS в клиентских компонентах."
order: 8
tags: ["react", "security", "xss", "dangerouslysetinnerhtml", "dompurify"]
questions:
  - "Как React экранирует JSX и какие инструменты (`dangerouslySetInnerHTML`, refs, URL-атрибуты) обходят защиту фреймворка"
  - "Почему `dangerouslySetInnerHTML` особенно опасен и почему санитизация обязательна"
  - "Как валидировать URL в `href` и почему `javascript:` протокол — XSS-вектор, который React не блокирует"
  - "Как `ref` и прямой доступ к DOM обходят защиту React"
  - "Где безопаснее хранить токены и как работает fetch с авторизацией"
  - "Почему `rel=\"noopener noreferrer\"` обязателен для внешних ссылок"
answers:
  - "React экранирует значения в JSX через `textContent` вместо `innerHTML`, а кавычки в атрибутах превращает в `&quot;`, поэтому HTML-теги отображаются как текст. Защита заканчивается там, где её обходят вручную: `dangerouslySetInnerHTML`, URL-атрибуты (React не проверяет семантику URL), прямой `innerHTML` через refs и несанитизированные сторонние библиотеки."
  - "`dangerouslySetInnerHTML` вставляет HTML как есть, без экранирования, — это преднамеренный обход защиты, названный в документации не случайно. Использовать его можно только для доверенного контента: пользовательский ввод перед вставкой нужно прогнать через `DOMPurify.sanitize` с белым списком тегов и атрибутов."
  - "React экранирует значения атрибутов, но не проверяет протоколы URL: если в `href` попадает `javascript:alert(document.cookie)`, кавычки экранируются, а протокол остаётся валидным для браузера — JavaScript выполнится при клике. Валидация — `href.startsWith('/') || /^https?:\\/\\//.test(href)` или белый список разрешённых доменов."
  - "Через `ref` получается прямой доступ к DOM, и запись `elRef.current.innerHTML = content` обходит защиту React, вставляя HTML без экранирования. Правильно — санитизировать через `DOMPurify.sanitize(content)` или вообще не использовать `innerHTML`, рендеря контент через JSX."
  - "Токен в памяти (переменная модуля) защищён от XSS лучше, чем в `localStorage`, но теряется при обновлении страницы; для долгоживущих сессий лучше HttpOnly cookie, недоступная из JavaScript. `fetch` с авторизацией добавляет заголовок `Authorization: Bearer <token>`, а настоящую проверку прав делает сервер."
  - "При `target=\"_blank\"` открытая вкладка получает ссылку на `window.opener` и может изменить `location` родительской страницы — это tabnabbing. `rel=\"noopener noreferrer\"` разрывает связь с родительским окном, поэтому он обязателен для всех внешних ссылок."
---

# Безопасность React

React автоматически экранирует значения в JSX — но у него есть мощные инструменты (`dangerouslySetInnerHTML`, refs), которые требуют осознанного подхода. Статья разбирает границы защиты фреймворка: где React защищает по умолчанию, какие приёмы обходят эту защиту и как строить безопасный клиентский код.

## Содержание

1. [Как React защищает от XSS по умолчанию](#как-react-защищает-от-xss-по-умолчанию)
2. [dangerouslySetInnerHTML: двустороннее лезвие](#dangerouslysetinnerhtml-двустороннее-лезвие)
3. [Динамические атрибуты и URL](#динамические-атрибуты-и-url)
4. [Refs и императивный DOM](#refs-и-императивный-dom)
5. [Хранение токенов и авторизация](#хранение-токенов-и-авторизация)
6. [Чек-лист безопасности React](#чек-лист-безопасности-react)
7. [Терминология](#терминология)
8. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
9. [Заключение](#заключение)
10. [Полезные ссылки](#полезные-ссылки)

---

## Как React защищает от XSS по умолчанию

React автоматически экранирует значения, вставленные в JSX. Любые HTML-теги в строке будут отображены как текст, а не выполнены.

```jsx
function Comment({ userInput }) {
  return <div>{userInput}</div>;
}
```

Если `userInput` содержит `"<script>alert('xss')<\/script>"`, в DOM попадёт экранированный текст:

```html
<div>&lt;script&gt;alert('xss')&lt;/script&gt;</div>
```

React экранирует и значения атрибутов: `"` → `&quot;`, `&` → `&amp;` и так далее. Значение становится безопасным для вставки в HTML.

### Где защита заканчивается

React не проверяет **семантику URL**. Если в `href` попадает `javascript:alert(1)`, React экранирует кавычки, но протокол останется валидным для браузера — при клике выполнится JavaScript. То же касается прямого доступа к DOM через refs и несанитизированных сторонних библиотек.

---

## dangerouslySetInnerHTML: двустороннее лезвие

`dangerouslySetInnerHTML` — прямой аналог `v-html` во Vue. Он вставляет HTML как есть, без экранирования.

```jsx
// ❌ Опасно без санитизации
<div dangerouslySetInnerHTML={{ __html: userHtml }} />
```

### Правильное использование

```jsx
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(rawHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
  ALLOWED_ATTR: ['href'],
});

// ✅ Санитизированный HTML
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

### Предупреждение в документации

React официально предупреждает: `dangerouslySetInnerHTML` можно использовать только для доверенного контента. Никогда не используйте его для пользовательского ввода без санитизации через DOMPurify или аналоги.

---

## Динамические атрибуты и URL

React не валидирует протоколы URL. Это распространённый вектор:

```jsx
// ❌ Опасно
<a href={userUrl}>link</a>
```

Если `userUrl = "javascript:alert(document.cookie)"`, при клике выполнится JavaScript.

### Безопасная ссылка

```jsx
function SafeLink({ href, children }) {
  const isSafe = href.startsWith('/') || /^https?:\/\//.test(href);

  if (!isSafe) return <span>{children}</span>;

  return (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}
```

Для более строгой защиты используйте библиотеку санитизации URL или белый список разрешённых доменов.

### target="_blank" и rel="noopener"

Всегда используйте `rel="noopener noreferrer"` для внешних ссылок. Это защищает от tabnabbing — атаки, при которой открытая вкладка может изменить `window.opener.location` родительской страницы.

---

## Refs и императивный DOM

Когда вы получаете прямой доступ к DOM-элементу через `ref`, вы обходите защиту React.

```jsx
// ❌ XSS, если content содержит вредоносный HTML
const elRef = useRef(null);

useEffect(() => {
  elRef.current.innerHTML = content;
}, []);
```

Безопасная альтернатива:

```jsx
const elRef = useRef(null);

useEffect(() => {
  elRef.current.innerHTML = DOMPurify.sanitize(content);
}, []);
```

Лучше всего избегать прямой манипуляции `innerHTML` вообще: рендерите контент через JSX, а HTML-строки не превращайте в разметку без санитизации.

---

## Хранение токенов и авторизация

### Хранение токенов

```tsx
// auth/access-token.ts
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}
```

Токен в памяти защищён от XSS лучше, чем в `localStorage`, но теряется при обновлении страницы. Для долгоживущих сессий предпочтительнее HttpOnly cookies — они не доступны JavaScript вообще.

### Fetch с авторизацией

```ts
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}
```

Клиентская проверка авторизации — лишь адаптация UI. Настоящую проверку прав выполняет сервер.

---

## Чек-лист безопасности React

- [ ] Использовать JSX-интерполяцию `{}` вместо `dangerouslySetInnerHTML` для пользовательского текста.
- [ ] Санитизировать HTML перед использованием в `dangerouslySetInnerHTML`.
- [ ] Валидировать URL в `href` и `src`.
- [ ] Использовать `rel="noopener noreferrer"` для внешних ссылок.
- [ ] Избегать `innerHTML` через refs.
- [ ] Хранить токены в памяти или HttpOnly cookies, а не в `localStorage`.

---

## Терминология

| Термин | Значение |
|--------|----------|
| **dangerouslySetInnerHTML** | Свойство React для вставки сырого HTML |
| **ref** | Ссылка на DOM-элемент в React |
| **DOMPurify** | Библиотека санитизации HTML |
| **Tabnabbing** | Атака через window.opener у открытой вкладки |
| **HttpOnly cookie** | Cookie, недоступная JavaScript и защищённая от XSS |

---

## Ключевые тезисы для интервью

- React автоматически экранирует значения в JSX и атрибуты — прямая аналогия с интерполяциями `{{ }}` во Vue; `dangerouslySetInnerHTML` — прямой эквивалент `v-html`, без DOMPurify — XSS-уязвимость.
- React не проверяет протоколы URL: `javascript:alert(1)` в `href` выполнится при клике; `rel="noopener noreferrer"` для `target="_blank"` защищает от tabnabbing через `window.opener`.
- `innerHTML` через `ref` обходит защиту фреймворка — избегайте прямой манипуляции DOM; токен сессии в памяти защищён от XSS лучше, чем в `localStorage`, а HttpOnly cookies — лучше памяти.

## Заключение

React предоставляет хорошую базовую защиту от XSS через автоматическое экранирование JSX, но у него есть мощные инструменты — `dangerouslySetInnerHTML` и refs — которые требуют осознанного подхода. Санитизация через DOMPurify, валидация URL и аккуратное хранение токенов закрывают основные векторы. Для более глубокого понимания XSS смотрите статью [XSS: анатомия атаки](./xss-deep-dive.md), а про безопасность Vue — [Безопасность Vue](./vue.md).

## Полезные ссылки

- [React — JSX](https://react.dev/learn/writing-markup-with-jsx)
- [React — dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-set-inner-html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [MDN — noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener)
- [XSS: анатомия атаки](./xss-deep-dive.md)
- [Безопасность фронтенда: обзор](./overview.md)