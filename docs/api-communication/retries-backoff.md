---
title: "Ретраи и exponential backoff"
section: api-communication
description: "Ретраи при сетевых ошибках: exponential backoff с jitter, retry-after, идемпотентность запросов, настройка ретраев в ky, axios и TanStack Query."
order: 5
tags: ["retry", "exponential-backoff", "jitter", "idempotency", "timeout", "tanstack-query"]
questions:
  - "Какие ошибки стоит ретраить, а какие — нет"
  - "Как работает exponential backoff и зачем нужен jitter"
  - "Что такое Retry-After и как его использовать"
  - "Почему безопасно повторять GET и опасно повторять POST"
  - "Что такое идемпотентность и как её обеспечить для POST"
  - "Как настроить ретраи в ky, axios и TanStack Query"
  - "Как timeout связан с ретраями и почему ретраи без лимита опасны"
  - "Как отменить цикл ретраев через AbortController"
answers:
  - "Ретраить стоит временные ошибки: сетевые сбои, timeout, 408/429/5xx, — они могут пройти сами; не стоит ретраить постоянные: 400/401/403/422/404 — повторный запрос даст тот же результат и только зря нагрузит сервер."
  - "Exponential backoff увеличивает задержку между повторами по формуле base * 2^n (например, 1s → 2s → 4s → 8s) с капом (30s) и сбросом счётчика после успеха; jitter добавляет случайность к задержке, чтобы одновременные ретраи клиентов не создавали волны нагрузки на сервер."
  - "Retry-After — HTTP-заголовок ответа 429/503, в котором сервер сообщает клиенту, через сколько секунд (или по какой дате) повторить запрос; его значение приоритетнее любого локального backoff."
  - "GET, PUT, DELETE идемпотентны — повторный вызов даёт тот же результат, поэтому их можно безопасно ретраить; POST создаёт новый ресурс при каждом вызове, и слепой ретрай может создать дубликаты (двойной заказ, двойная оплата)."
  - "Идемпотентность POST достигается через заголовок Idempotency-Key: сервер запоминает ключ и при повторном запросе с тем же ключом возвращает результат первого вызова, не выполняя операцию повторно."
  - "ky ретраит по умолчанию (limit: 2, методы — GET и подобные) и настраивается через retry: { limit, methods, statusCodes }; axios не ретраит из коробки — нужен interceptor или библиотека axios-retry; TanStack Query — через опции retry и retryDelay в useQuery."
  - "Timeout ограничивает время ожидания ответа, а ретраи — число повторных попыток: без timeout запрос может висеть вечно, без лимита ретраев клиент будет долбить мёртвый сервер бесконечно; вместе они делают клиент устойчивым к недоступности."
  - "AbortController передаётся в fetch через signal, и при вызове controller.abort() запрос прерывается, а цикл ретраев останавливается — отмена в React происходит в cleanup useEffect при размонтировании компонента."
---

# Ретраи и exponential backoff

Сеть ненадёжна: сервер может вернуть 503 на секунду, соединение — оборваться, timeout — сработать. Хороший клиент не падает при первом сбое, а аккуратно повторяет запрос с растущей задержкой. Разберём, какие ошибки ретраить, как строить backoff с jitter и настраивать ретраи в ky, axios и TanStack Query.

## Содержание

1. [Зачем нужны ретраи](#зачем-нужны-ретраи)
2. [Какие ошибки ретраить](#какие-ошибки-ретраить)
3. [Exponential backoff](#exponential-backoff)
4. [Jitter](#jitter)
5. [Retry-After](#retry-after)
6. [Идемпотентность](#идемпотентность)
7. [Ручная реализация на fetch](#ручная-реализация-на-fetch)
8. [Ретраи в HTTP-клиентах](#ретраи-в-http-клиентах)
9. [Ретраи в TanStack Query](#ретраи-в-tanstack-query)
10. [Timeout и отмена](#timeout-и-отмена)
11. [Лучшие практики](#лучшие-практики)
12. [Антипаттерны](#антипаттерны)

---

## Зачем нужны ретраи

Временные сбои — норма жизни любого сервиса:

- обрыв соединения, DNS-проблемы на стороне сети;
- timeout из-за перегрузки сервера;
- рестарт пода, деплой, миграция;
- rate limiting (429).

Большинство таких ошибок проходит через секунды. Ретрай — механизм, который повторяет запрос автоматически, вместо того чтобы показывать пользователю ошибку при первом же сбое.

Без ретраев пользователь видит «Что-то пошло не так» из-за секундного сбоя. С ретраями клиент тихо дожидается восстановления и получает данные.

---

## Какие ошибки ретраить

Главное правило: **ретраим временное, не ретраим постоянное**.

### Стоит ретраить

| Ошибка | Почему |
|--------|--------|
| Сетевые сбои (`TypeError: fetch failed`) | Сеть временно недоступна |
| Timeout | Сервер перегружен, но может ожить |
| 408 Request Timeout | Сервер не успел ответить в срок |
| 429 Too Many Requests | Rate limit — повторять после паузы (см. Retry-After) |
| 500, 502, 503, 504 | Временные сбои инфраструктуры |

### Не стоит ретраить

| Ошибка | Почему |
|--------|--------|
| 400 Bad Request | Данные клиента некорректны — повтор не поможет |
| 401 Unauthorized | Нужна авторизация, а не повтор |
| 403 Forbidden | Нет прав |
| 404 Not Found | Ресурса нет |
| 422 Unprocessable Entity | Бизнес-валидация провалена |

Повтор постоянной ошибки — впустую потраченная нагрузка на сервер и лишний шум в логах.

---

## Exponential backoff

Ретраить с фиксированной задержкой плохо: при массовом сбое все клиенты повторят запросы одновременно — **thundering herd**. Поэтому задержка растёт экспоненциально:

```
1s → 2s → 4s → 8s → 16s → 32s (cap)
```

Формула: `delay = min(base * 2^attempt, cap)`.

```js
function backoff(attempt) {
  return Math.min(1000 * 2 ** attempt, 30000);
}
```

Правила:

- **Сброс счётчика** после успешного запроса — иначе задержки будут бесконечно расти.
- **Кап** (30–60 с) — бесконечный рост задержки бессмыслен.
- **Ограничение числа попыток** — 3–5 ретраев достаточно; дальше пользователю показывают ошибку.

---

## Jitter

Jitter — случайное отклонение задержки. Без него даже экспоненциальный backoff не спасает: клиенты, стартовавшие одновременно, всё равно «встречаются» на одинаковых задержках.

Полный jitter — случайное значение от 0 до текущей задержки:

```js
function backoffWithJitter(attempt) {
  const base = Math.min(1000 * 2 ** attempt, 30000);
  return base / 2 + Math.random() * (base / 2);
}
```

Или просто:

```js
function backoffWithJitter(attempt) {
  return Math.min(1000 * 2 ** attempt, 30000) * (0.5 + Math.random() * 0.5);
}
```

Плюс jitter: нагрузка на сервер при массовом сбое «размазывается» во времени, а не бьёт волной.

---

## Retry-After

Когда сервер ограничивает клиента (429) или перегружен (503), он может сказать, **когда** повторить, через заголовок `Retry-After`:

```text
HTTP/1.1 429 Too Many Requests
Retry-After: 120
```

Значение — секунды или HTTP-дата. Клиент должен уважать его:

```js
async function fetchWithRetry(url) {
  const response = await fetch(url);
  if (response.status === 429 || response.status === 503) {
    const retryAfter = response.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter, 10) : 5;
    await sleep(seconds * 1000);
    return fetchWithRetry(url);
  }
  return response;
}
```

`Retry-After` приоритетнее локального backoff — сервер лучше знает, когда освободится.

---

## Идемпотентность

Ретраить безопасно только то, что можно повторять без побочных эффектов.

**Идемпотентные методы** — повторный вызов даёт тот же результат:

- `GET` — чтение, безопасно;
- `PUT` — полная замена ресурса, повтор идентичен;
- `DELETE` — повтор удаляет уже удалённое, результат тот же.

**Неидемпотентный** — `POST`: каждый вызов создаёт новый ресурс. Слепой ретрай POST приводит к дубликатам: два заказа, двойная оплата.

### Idempotency-Key

Решение для POST — заголовок `Idempotency-Key`: клиент генерирует уникальный ключ и шлёт его с запросом. Сервер запоминает ключ → ответ и при повторе возвращает сохранённый результат, не выполняя операцию заново.

```js
async function createOrder(payload) {
  const idempotencyKey = crypto.randomUUID();

  try {
    return await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Ретрай с тем же ключом — сервер вернёт тот же заказ, а не создаст новый
    return await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  }
}
```

---

## Ручная реализация на fetch

Базовая реализация ретрая с backoff и jitter:

```js
async function fetchWithRetry(url, options = {}, retries = 3) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && shouldRetry(response.status)) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt === retries) throw error;

      const delay = backoffWithJitter(attempt);
      await sleep(delay);
      attempt++;
    }
  }
}

function shouldRetry(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

Внимание к деталям:

- Не ретраим `AbortError` — это отмена, а не сбой.
- Не ретраим 4xx — кроме 408/429.
- Считаем попытки, а не ретраим бесконечно.

---

## Ретраи в HTTP-клиентах

### ky

Ретраи встроены по умолчанию: `limit: 2`, по умолчанию повторяются только безопасные методы (`GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS`, `TRACE`) и не повторяется `POST`.

```js
import ky from 'ky';

const api = ky.extend({
  retry: {
    limit: 4,
    methods: ['get', 'post'],
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 3000, // максимальная задержка между ретраями
  },
});
```

### axios

Из коробки ретраев нет — нужен interceptor или библиотека `axios-retry`.

```js
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(1000 * 2 ** retryCount, 30000),
  retryCondition: (error) => {
    return !error.response || error.response.status >= 500 || error.response.status === 429;
  },
});
```

`axios-retry` сам не ретраит `POST` — это защита от дубликатов; для идемпотентных случаев конфигурация расширяется.

---

## Ретраи в TanStack Query

TanStack Query ретраит по умолчанию (3 попытки) с экспоненциальным backoff. Настройка через опции `useQuery`:

```ts
useQuery({
  queryKey: ['user', userId],
  queryFn: async ({ signal }) => {
    const response = await fetch(`/api/users/${userId}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  retry: 3,                         // число попыток или false для отключения
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

`retry` может быть функцией — условие по типу ошибки:

```ts
retry: (failureCount, error) => {
  // не ретраим ошибки валидации
  if (error.message.includes('400')) return false;
  return failureCount < 3;
},
```

Мутации ретраят по тем же правилам — но для `POST` стоит сокращать ретраи или использовать `Idempotency-Key`.

---

## Timeout и отмена

Ретраи не работают без двух соседей: timeout и отмена.

**Timeout** — предельное время ожидания ответа. Запрос, висящий 120 секунд, хуже мгновенной ошибки.

```js
function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}
```

**Отмена** — остановка цикла ретраев при размонтировании компонента. `AbortError` нужно проверять и не ретраить:

```js
async function fetchWithRetry(url, options = {}, retries = 3) {
  // ...
  catch (error) {
    if (error.name === 'AbortError') throw error; // не ретраим отмену
    // ...
  }
}
```

В React сигнал передаётся в `useEffect` и обрывается в cleanup — цикл ретраев прекращается вместе с компонентом.

---

## Лучшие практики

### 1. Ретрай только временные ошибки

Сеть, 408/429/5xx — да; 4xx (кроме 408/429) — нет.

### 2. Экспоненциальный backoff с jitter

`min(base * 2^attempt, cap) * (0.5 + random * 0.5)` — размазывает нагрузку.

### 3. Ограничивай число попыток

3–5 ретраев достаточно. Бесконечный цикл превращает сбой в DDoS.

### 4. Уважай Retry-After

Сервер сам говорит, когда повторить — не игнорируй.

### 5. Не ретрай неидемпотентные операции без ключа

POST без `Idempotency-Key` = риск дубликатов.

### 6. Не ретрай AbortError

Отмена — не ошибка, это осознанное действие пользователя или компонента.

### 7. Логируй ретраи

`console.warn('[retry] attempt', attempt, 'delay', delay)` — иначе сбои невидимы.

---

## Антипаттерны

### 1. Мгновенный ретрай без задержки

```js
// ❌ Плохо: при сбое — сразу повтор, снова и снова
catch (error) {
  fetch(url); // долбим сервер в цикле
}
```

### 2. Ретрай без лимита

```js
// ❌ Плохо: мёртвый сервер дёргается вечно
while (true) {
  try { await fetch(url); break; } catch {}
}
```

### 3. Ретрай POST без Idempotency-Key

```js
// ❌ Плохо: двойной заказ при первом же таймауте
catch (error) {
  await fetch('/api/orders', { method: 'POST', body: payload });
}
```

### 4. Ретрай 400/401

```js
// ❌ Плохо: валидация не станет успешной от повторов
catch (error) {
  if (error.status === 400) retry(); // бессмысленно
}
```

### 5. Ретрай AbortError как ошибку

```js
// ❌ Плохо: ретраим то, что пользователь отменил
catch (error) {
  if (error.name === 'AbortError') retry();
}
```

---

## Ключевые тезисы для интервью

- Ретраим временные ошибки (сеть, 408/429/5xx), не ретраим постоянные (400/401/403/404/422).
- Exponential backoff: `min(base * 2^attempt, cap)`, счётчик сбрасывается после успеха.
- Jitter размазывает одновременные ретраи и защищает сервер от thundering herd.
- `Retry-After` сообщает, когда повторять 429/503, и приоритетнее локального backoff.
- GET/PUT/DELETE идемпотентны; POST — нет, для него нужен `Idempotency-Key`.
- ky ретраит из коробки, axios — через interceptor/`axios-retry`.
- TanStack Query: `retry` и `retryDelay` в `useQuery`; `retry` может быть функцией-условием.
- `AbortError` — отмена, а не сбой; ретраить его нельзя.
- Без timeout и лимита попыток ретраи превращаются в атаку на сервер.

## Заключение

Ретраи делают клиент устойчивым к временным сбоям сети и сервера. Правильная реализация — это три компонента: отбор ретраируемых ошибок, экспоненциальный backoff с jitter и лимит попыток. Плюс идемпотентность для небезопасных методов и уважение к `Retry-After`.

Ключевое для Middle+ разработчика:

- Уметь отличать временные ошибки от постоянных.
- Строить backoff с jitter и капом, не забывая сброс счётчика.
- Настраивать ретраи в ky, axios и TanStack Query.
- Защищать POST через `Idempotency-Key`.
- Комбинировать ретраи с timeout и отменой через `AbortController`.

## Полезные ссылки

- [MDN: fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN: Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
- [ky: Retry](https://github.com/sindresorhus/ky#retry)
- [TanStack Query: retry](https://tanstack.com/query/latest/docs/framework/react/guides/retries)
- [AWS Architecture Blog: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)