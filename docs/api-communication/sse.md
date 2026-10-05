---
title: "Server-Sent Events: real-time через HTTP"
section: api-communication
stacks: []
description: "Server-Sent Events (SSE) — односторонний real-time через обычный HTTP: EventSource, авто-переподключение, форматы событий, реализация в React и Next.js, сравнение с WebSocket."
order: 7
tags: ["sse", "eventsource", "real-time", "event-stream", "streaming", "websocket"]
questions:
  - "Чем SSE отличается от WebSocket и long polling"
  - "Какой Content-Type и формат данных использует SSE"
  - "Какие поля есть у события SSE: data, event, id, retry"
  - "Как EventSource автоматически переподключается и что такое Last-Event-ID"
  - "Чем onmessage отличается от addEventListener при именованных событиях"
  - "Как управлять жизненным циклом EventSource в React"
  - "Какие ограничения есть у SSE при масштабировании и в HTTP/2"
  - "Когда SSE предпочтительнее WebSocket"
answers:
  - "SSE передаёт данные только от сервера к клиенту через обычный HTTP с авто-переподключением, WebSocket — двусторонний постоянный протокол с ручным переподключением и поддержкой бинарных данных, а long polling удерживает соединение до появления данных и требует новой пары запрос-ответ на каждое событие."
  - "Сервер отвечает с заголовком Content-Type: text/event-stream и держит соединение открытым, а данные передаются текстом в формате event stream: строки data:, event:, id:, retry:, разделённые пустой строкой."
  - "data: — тело события, event: — имя события для addEventListener, id: — идентификатор, который передаётся в Last-Event-ID при переподключении, retry: — задержка переподключения в миллисекундах. Множественные строки data: объединяются в одно событие через перенос строки."
  - "EventSource автоматически переподключается при обрыве соединения: если сервер прислал id:, браузер отправляет заголовок Last-Event-ID с последним полученным id, чтобы сервер восстановил пропущенные события, а retry: задаёт задержку повтора."
  - "onmessage — универсальный обработчик для всех событий без имени, addEventListener('имя', handler) обрабатывает именованные события: сервер отправляет event: имя, и событие не попадает в onmessage."
  - "EventSource создаётся в useEffect, хранится в useRef, обработчики onopen/onmessage/onerror регистрируются, а в cleanup вызывается source.close() — это гарантирует, что соединение не утечёт при размонтировании."
  - "Каждое SSE-соединение держит открытый HTTP-ответ: при тысячах клиентов сервер держит тысячи соединений, а в HTTP/2 все потоки идут через одно TCP-соединение и многие прокси отключают буферизацию ответов, что ломает стриминг."
  - "Когда нужна односторонняя доставка сервер → клиент, без бинарных данных и без двусторонней низколатентной связи: SSE проще WebSocket — встроенный reconnect, работает поверх HTTP/2, проходит через прокси и CDN, поддерживается нативно браузером."
---

# Server-Sent Events: real-time через HTTP

Server-Sent Events (SSE) — технология доставки обновлений от сервера к клиенту через обычный HTTP. Сервер открывает одно соединение и постепенно отправляет события, а браузер переподключается автоматически. Разберём формат событий, EventSource API, реализацию в React и Next.js, ограничения и сравнение с WebSocket.

## Содержание

1. [Что такое SSE](#что-такое-sse)
2. [Формат события](#формат-события)
3. [EventSource API](#eventsource-api)
4. [Именованные события](#именованные-события)
5. [Серверная часть на Node.js](#серверная-часть-на-nodejs)
6. [Реализация в React](#реализация-в-react)
7. [SSE в Next.js](#sse-в-nextjs)
8. [Авто-переподключение и Last-Event-ID](#авто-переподключение-и-last-event-id)
9. [Обработка ошибок](#обработка-ошибок)
10. [CORS и авторизация](#cors-и-авторизация)
11. [Ограничения и масштабирование](#ограничения-и-масштабирование)
12. [SSE vs WebSocket vs Long Polling](#sse-vs-websocket-vs-long-polling)
13. [Лучшие практики](#лучшие-практики)
14. [Антипаттерны](#антипаттерны)

---

## Что такое SSE

**Server-Sent Events** — механизм, при котором сервер открывает одно HTTP-соединение и отправляет события клиенту по мере их появления. Клиент слушает поток через `EventSource`.

Ключевые свойства:

- **Односторонняя передача**: только сервер → клиент.
- **Обычный HTTP**: никакого нового протокола, как у WebSocket.
- **Автоматическое переподключение**: браузер сам восстанавливает оборванное соединение.
- **Текстовый формат**: передача UTF-8 строк, без бинарных данных.

SSE удобен для: лент уведомлений, новостей, тикеров курсов, логов задач, прогресса загрузки, подписок на изменения данных — всего, где сервер толкает данные, а клиент только принимает.

---

## Формат события

Ответ сервера идёт с заголовком `Content-Type: text/event-stream`. Тело — последовательность блоков, разделённых пустой строкой. Каждый блок состоит из строк-полей:

| Поле | Назначение |
|------|------------|
| `data:` | Тело события (может быть несколько строк — они склеиваются через `\n`). |
| `event:` | Имя события для `addEventListener`. По умолчанию — `message`. |
| `id:` | Идентификатор события, отправляется в `Last-Event-ID` при переподключении. |
| `retry:` | Задержка переподключения в миллисекундах. |

```text
data: {"message": "Первый пошёл"}

data: {"message": "Второй"}
id: 42

event: order-status
data: {"orderId": "123", "status": "shipped"}
```

Строка без двоеточия или с `:` в начале — комментарий и игнорируется; это удобно для heartbeat-запросов: `: ping`.

---

## EventSource API

`EventSource` — нативный браузерный API, наследник `EventTarget`. Никаких библиотек не нужно.

```js
const source = new EventSource('/api/events');

source.onopen = () => console.log('Соединение открыто');
source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Событие:', data);
};
source.onerror = () => console.log('Ошибка соединения');

// Закрыть вручную
source.close();
```

Свойства:

- `readyState` — `CONNECTING (0)`, `OPEN (1)`, `CLOSED (2)`.
- `url` — URL потока.
- `withCredentials` — передавать ли cookies при кросс-доменных запросах.

В отличие от `WebSocket`, у `EventSource` нет стадии рукопожатия и методов `send` — соединение всегда инициирует клиент, а данные только принимаются.

---

## Именованные события

Когда сервер шлёт поле `event:`, событие получает имя. Обработчик `onmessage` на него не сработает — нужен `addEventListener`.

```js
const source = new EventSource('/api/events');

source.addEventListener('order-status', (event) => {
  const data = JSON.parse(event.data);
  console.log('Статус заказа:', data);
});

source.addEventListener('user-offline', (event) => {
  console.log('Пользователь офлайн');
});
```

Полезно, когда в одном потоке идут разные типы событий: уведомления, изменение статуса, heartbeat.

---

## Серверная часть на Node.js

SSE требует сервера, который умеет держать соединение открытым и писать в поток. Простейший пример на Express:

```js
const express = require('express');
const app = express();

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (data, id) => {
    res.write(`id: ${id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let counter = 0;
  const interval = setInterval(() => {
    send({ time: Date.now() }, ++counter);
  }, 1000);

  // Закрыть соединение при обрыве клиента
  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(3000);
```

Важные детали:

- **`Cache-Control: no-cache`** — прокси не должны кэшировать поток.
- **`Connection: keep-alive`** — держать соединение.
- **Очистка ресурсов** по `req.on('close')` — иначе интервалы утекают.
- **Heartbeat** — периодический комментарий `: ping` или пустое событие, чтобы соединение не убивалось прокси по таймауту бездействия.

---

## Реализация в React

`EventSource` — клиентская концепция, поэтому создаётся в `useEffect`, а закрывается в cleanup.

```jsx
import { useEffect, useRef, useState } from 'react';

function useEventSource(url) {
  const [messages, setMessages] = useState([]);
  const sourceRef = useRef(null);

  useEffect(() => {
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    source.onerror = () => {
      // EventSource сам переподключится
      console.log('SSE connection lost');
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [url]);

  const close = () => sourceRef.current?.close();

  return { messages, close };
}
```

### Приостановка при скрытии вкладки

Как и в long polling, не стоит держать поток в фоне:

```jsx
useEffect(() => {
  const source = new EventSource(url);

  const handleVisibility = () => {
    if (document.hidden) {
      source.close();
    } else {
      // Пересоздать поток
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => {
    source.close();
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}, [url]);
```

---

## SSE в Next.js

В App Router поток реализуется через Route Handler: серверный код держит `ReadableStream` и пишет в него события, а клиент читает их через `fetch` или `EventSource`.

```ts
// app/api/events/route.ts
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      send(JSON.stringify({ message: 'Поток открыт' }));

      const interval = setInterval(() => {
        send(JSON.stringify({ time: Date.now() }));
      }, 1000);

      // req.signal срабатывает при отмене/обрыве
      // здесь — упрощённо, через обработку сигнала
    },
    cancel() {
      // клиент закрыл соединение — очистить ресурсы
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

Особенности Next.js:

- На **Vercel** долгоживущие потоки не работают — serverless-функции ограничены по времени выполнения. SSE нужно деплоить на Node.js-хостинг (самостоятельный сервер, Fly.io, Railway) или использовать edge-платформы, поддерживающие стриминг.
- Route Handler может слушать `req.signal` через `request.signal` из аргумента, чтобы корректно закрыть поток при отмене запроса клиентом.

---

## Авто-переподключение и Last-Event-ID

Главное преимущество SSE перед WebSocket — переподключение встроено в браузер. При обрыве `EventSource` автоматически пытается восстановить соединение.

Если сервер отправлял `id:` для событий, браузер при переподключении передаёт заголовок **`Last-Event-ID`** с последним полученным id. Сервер может прочитать его и отправить пропущенные события — клиент не потеряет данные за время обрыва.

```js
// Express: читаем Last-Event-ID
app.get('/api/events', (req, res) => {
  const lastEventId = req.headers['last-event-id'];
  // Отправить события с id > lastEventId, затем продолжить поток
});
```

Задержку повтора задаёт сервер через `retry:` или клиент — не задаёт вообще: у `EventSource` нет API для настройки backoff, в отличие от WebSocket, где задержку переподключения пишете вы сами. Если нужен свой алгоритм — `close()` и создание нового `EventSource` с собственной паузой.

---

## Обработка ошибок

`onerror` срабатывает при обрыве соединения, сетевой ошибке и недоступности сервера. Важно понимать: **EventSource переподключается сам**, поэтому в обработчике обычно не нужно создавать новый источник.

```js
source.onerror = (error) => {
  console.log('Состояние:', source.readyState);
  // CONNECTING — браузер уже пытается переподключиться
};
```

Если сервер отвечает не `text/event-stream` (например, 404 или 500), `EventSource` не бросает исключение, а молча переходит в `CONNECTING` и пробует снова — бесконечно. Чтобы остановить цикл, нужен `close()`:

```js
source.onerror = (error) => {
  // Сервер недоступен — прекратить попытки
  source.close();
  console.error('SSE failed');
};
```

Проверку успешного старта делайте в `onopen` — это единственная гарантия, что поток реально открылся.

---

## CORS и авторизация

`EventSource` не позволяет управлять заголовками запроса — только cookies. Это ограничение важно для двух сценариев.

### Кросс-доменные потоки

```js
// Сервер должен отдавать CORS-заголовки
Access-Control-Allow-Origin: https://app.example.com

// И клиент передаёт cookies
const source = new EventSource('https://api.example.com/events', {
  withCredentials: true,
});
```

### Авторизация через токен в заголовке

Токен в `Authorization` передать нельзя — `EventSource` не даёт установить заголовки. Обходные пути:

- **Cookie** вместо Bearer-токена (удобно при `withCredentials`).
- **Прокси**: свой сервер принимает авторизацию и пересылает запрос к SSE-эндпоинту.
- **`fetch` + ReadableStream**: вместо `EventSource` читать поток через `fetch`, где заголовки можно задать любые:

```js
const response = await fetch('/api/events', {
  headers: { Authorization: `Bearer ${token}` },
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

Но тогда теряется встроенное переподключение и `Last-Event-ID` — приходится реализовывать их вручную.

---

## Ограничения и масштабирование

### 1. Ограничение на число соединений

HTTP/1.1 позволяет браузеру держать ~6 соединений на домен. Каждое SSE-соединение — одно из них. Несколько параллельных потоков с одного домена могут исчерпать лимит. Решения: разные поддомены, HTTP/2 (одно TCP-соединение на множество потоков) или консолидация потоков.

### 2. Проблемы с HTTP/2 и прокси

В HTTP/2 все потоки идут через одно TCP-соединение, и многие прокси буферизуют ответ целиком, прежде чем отдать его клиенту — стриминг ломается. Настраивайте прокси на отключение буферизации (`X-Accel-Buffering: no` для nginx) или зажимайте соединение.

### 3. Нагрузка на сервер

Каждый клиент — открытый HTTP-ответ, держащийся потенциально часами. При тысячах клиентов нужны асинхронные серверы, грамотный heartbeat и таймауты бездействия.

### 4. Только текст, только в одну сторону

Бинарные данные (аудио, изображения, большие payload) не передать напрямую — только base64. Двусторонний обмен — тоже нет. Для этих задач WebSocket.

---

## SSE vs WebSocket vs Long Polling

| Критерий | SSE | WebSocket | Long Polling |
|----------|-----|-----------|--------------|
| Протокол | HTTP | WebSocket (поверх TCP) | HTTP |
| Направление | Сервер → клиент | Двустороннее | Сервер → клиент |
| Авто-переподключение | Встроено | Ручная реализация | Ручная реализация |
| Last-Event-ID (догонка событий) | Да | Нет | Нет |
| Бинарные данные | Нет (только текст) | Да | Нет |
| Заголовки запроса | Нельзя задать | Можно | Можно |
| Совместимость с прокси/CDN | Хорошая | Может блокироваться | Хорошая |
| Сложность | Низкая | Выше | Средняя |

**Правило выбора:**

```
Нужны real-time обновления?
├── Только сервер → клиент, текстовые данные → SSE (проще всего)
├── Двусторонняя связь или бинарные данные → WebSocket
└── SSE недоступен (старые браузеры, нет контроля заголовков) → Long Polling
```

---

## Лучшие практики

### 1. Используй SSE для односторонних обновлений

Не тяни WebSocket туда, где данные идут только от сервера: уведомления, тикеры, логи.

### 2. Задавай `id:` каждому событию

Это даёт надёжное восстановление через `Last-Event-ID` при обрыве.

### 3. Держи heartbeat

Пустой комментарий `: ping` каждые 15–30 секунд не даёт прокси убить соединение по таймауту бездействия.

### 4. Чисти ресурсы в cleanup

В React — `source.close()` в cleanup `useEffect`, на сервере — очистка интервалов по `req.on('close')`.

### 5. Останавливай поток на скрытой вкладке

`visibilitychange` экономит трафик и соединения.

### 6. Авторизация через cookie или прокси

`EventSource` не умеет заголовки — продумай auth до внедрения.

---

## Антипаттерны

### 1. Бесконечный цикл переподключения при недоступном сервере

```js
// ❌ Плохо: браузер будет переподключаться вечно
source.onerror = () => {};

// ✅ Хорошо: прекратить попытки, если сервер мёртв
source.onerror = () => source.close();
```

### 2. Парсинг JSON без try/catch

```js
// ❌ Плохо: битое событие уронит обработчик
source.onmessage = (e) => setData(JSON.parse(e.data));

// ✅ Хорошо
source.onmessage = (e) => {
  try {
    setData(JSON.parse(e.data));
  } catch (err) {
    console.error('Invalid SSE payload', err);
  }
};
```

### 3. Создание EventSource на каждый рендер

```jsx
// ❌ Плохо: соединение открывается и закрывается на каждом рендере
const source = new EventSource(url);

// ✅ Хорошо: в useEffect с cleanup
useEffect(() => {
  const source = new EventSource(url);
  return () => source.close();
}, [url]);
```

### 4. Запуск нескольких потоков с одного домена

Некоторые браузеры ограничивают число соединений на домен — не открывай десятки SSE-потоков; объединяй события в один поток с именованными событиями.

### 5. Ожидание «двусторонности»

Попытка отправить данные клиент → сервер через SSE невозможна — для этого нужен обычный HTTP-запрос или WebSocket.

---

## Ключевые тезисы для интервью

- SSE — односторонний real-time через обычный HTTP, без нового протокола.
- Ответ идёт с `Content-Type: text/event-stream`, события разделяются пустой строкой.
- Поля события: `data`, `event`, `id`, `retry`; несколько строк `data:` склеиваются в одно событие.
- `EventSource` автоматически переподключается и передаёт `Last-Event-ID` при обрыве.
- `onmessage` — только для безымянных событий; именованные обрабатывает `addEventListener`.
- `EventSource` нельзя настроить заголовки запроса — только cookies (`withCredentials`).
- В HTTP/1.1 ограничение ~6 соединений на домен, а HTTP/2 и прокси могут ломать стриминг из-за буферизации.
- Каждое соединение держит открытый HTTP-ответ — при масштабировании нужны асинхронные серверы и heartbeat.
- В Next.js долгоживущие SSE-потоки несовместимы с serverless-функциями Vercel.
- Для двусторонней связи и бинарных данных — WebSocket; SSE — для потока сервер → клиент.

## Заключение

SSE — самый простой способ получать обновления от сервера в реальном времени: нативный `EventSource`, авто-переподключение и `Last-Event-ID` из коробки. Он проигрывает WebSocket в двусторонности и бинарных данных, но выигрывает в простоте и совместимости с HTTP-инфраструктурой.

Ключевое для Middle+ разработчика:

- Понимать формат event stream и разницу `data`/`event`/`id`/`retry`.
- Уметь корректно управлять жизненным циклом `EventSource` в React.
- Знать ограничения: число соединений, буферизация прокси, отсутствие заголовков.
- Чётко выбирать между SSE, WebSocket и long polling по направлению данных и требованиям.

## Полезные ссылки

- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [MDN: EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [WHATWG: Server-sent events spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)