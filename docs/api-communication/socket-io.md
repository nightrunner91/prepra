---
title: "Socket.IO: rooms, namespaces и real-time"
section: api-communication
stacks: []
description: "Socket.IO — библиотека real-time поверх WebSocket: Engine.IO, транспорты и fallback, rooms, namespaces, acknowledgements, middleware, переподключения и масштабирование через Redis adapter."
order: 10
tags: ["socket-io", "engine-io", "websocket", "rooms", "namespaces", "redis-adapter"]
questions:
  - "Чем Socket.IO отличается от нативного WebSocket"
  - "Как Engine.IO выбирает транспорт и зачем нужен fallback на HTTP polling"
  - "Чем rooms отличаются от namespaces"
  - "Как устроены acknowledgements в Socket.IO"
  - "Зачем нужен middleware и как проходит авторизация"
  - "Как Socket.IO переподключается и что даёт connection state recovery"
  - "Как масштабировать Socket.IO на несколько серверов"
  - "Почему при горизонтальном масштабировании нужны sticky sessions"
  - "Какие антипаттерны встречаются при работе с Socket.IO"
answers:
  - "Socket.IO — библиотека поверх WebSocket с встроенным переподключением, rooms, namespaces и fallback на HTTP long-polling, тогда как нативный WebSocket — это просто протокол, где всё это нужно реализовывать вручную."
  - "Engine.IO начинает с HTTP long-polling и, если сеть позволяет, делает upgrade до WebSocket; при недоступности WebSocket соединение продолжает работать на polling — клиент и сервер договариваются о транспорте автоматически."
  - "Namespaces делят соединение на логические каналы по URL (например, /chat и /news), а rooms группируют сокеты внутри одного namespace для рассылки — socket.join(room) и io.to(room).emit() для таргетного вещания."
  - "Acknowledgements — это callback-функция, переданная последним аргументом в emit; сервер вызывает её для подтверждения обработки события и возврата результата клиенту."
  - "io.use(fn) — middleware, выполняемый при подключении: в нём проверяется токен из socket.handshake.auth или заголовков, и next(err) прерывает соединение при неудачной авторизации."
  - "Клиент автоматически переподключается с exponential backoff (reconnectionDelay, reconnectionDelayMax, randomizationFactor); v4.6+ поддерживает connection state recovery — сервер восстанавливает комнаты и недоставленные события после переподключения."
  - "Несколько серверов Socket.IO связываются через Redis adapter (@socket.io/redis-adapter): io.emit и io.to(room).emit рассылаются через Redis Pub/Sub всем нодам кластера."
  - "HTTP long-polling не поддерживает липкость соединения, поэтому нужны sticky sessions на балансировщике, чтобы запросы одного клиента попадали на один и тот же сервер; для WebSocket это не обязательно."
  - "Слушатели, навешанные без отписки, вешание событий на глобальный сокет вместо комнат, авторизация только на клиенте, игнорирование disconnect и хранение сокетов в глобальном состоянии."
---

# Socket.IO: rooms, namespaces и real-time

Socket.IO — самая популярная библиотека для real-time двусторонней связи. Она решает то, что нативный WebSocket оставляет разработчику: переподключения, комнаты, гарантии доставки и fallback на HTTP, когда WebSocket недоступен. Разберём устройство Socket.IO, ключевые абстракции и то, как выжимать из него максимум на практике.

## Содержание

1. [Что такое Socket.IO](#что-такое-socketio)
2. [Как работает: Engine.IO и транспорты](#как-работает-engineio-и-транспорты)
3. [Сервер и клиент: базовое использование](#сервер-и-клиент-базовое-использование)
4. [События и broadcast](#события-и-broadcast)
5. [Rooms: комнаты](#rooms-комнаты)
6. [Namespaces: пространства имён](#namespaces-пространства-имён)
7. [Acknowledgements](#acknowledgements)
8. [Middleware и авторизация](#middleware-и-авторизация)
9. [Переподключения и recovery](#переподключения-и-recovery)
10. [Масштабирование: Redis adapter](#масштабирование-redis-adapter)
11. [Socket.IO vs нативный WebSocket](#socketio-vs-нативный-websocket)
12. [Лучшие практики](#лучшие-практики)
13. [Антипаттерны](#антипаттерны)

---

## Что такое Socket.IO

**Socket.IO** — библиотека для real-time событийного взаимодействия клиента и сервера. Она состоит из двух частей:

- **Серверная** — `socket.io` (Node.js), поверх HTTP-сервера.
- **Клиентская** — `socket.io-client` (браузер, Node.js, React Native).

Socket.IO **не является реализацией протокола WebSocket**: это собственный протокол поверх него. Он добавляет поверх WebSocket то, чего нет в нативном API:

- автоматическое переподключение с exponential backoff;
- fallback на HTTP long-polling, если WebSocket недоступен;
- комнаты (`rooms`) и пространства имён (`namespaces`);
- подтверждения доставки событий (`acknowledgements`);
- heartbeat (ping/pong) для обнаружения «мёртвых» соединений;
- пакетную передачу и бинарные данные.

## Как работает: Engine.IO и транспорты

Socket.IO построен на нижнем слое **Engine.IO** — он отвечает за транспорт, heartbeat и переподключение. Протокол взаимодействия:

```
Клиент                        Сервер
   │  GET /socket.io/?EIO=4   │
   │ ───────────────────────▶ │  HTTP long-polling (handshake)
   │  {sid, upgrades}         │
   │ ◀─────────────────────── │
   │  WebSocket upgrade       │
   │ ───────────────────────▶ │  если сеть позволяет
   │  upgrade successful      │
   │ ◀─────────────────────── │
   │  постоянный транспорт    │
```

**Как выбирается транспорт:**

1. Клиент начинает с **HTTP long-polling** — это единственный транспорт, который не блокируется файрволами и прокси.
2. Сервер в handshake отвечает списком доступных upgrade-транспортов (обычно `["websocket"]`).
3. Клиент выполняет **upgrade** до WebSocket. Если он не удаётся — соединение продолжает работать на polling.

```
Клиент
  ├── polling (всегда доступен)
  └── └── websocket (после upgrade)
```

**Heartbeat.** Engine.IO периодически шлёт `ping`/`pong` с сервера, чтобы не держать мёртвые соединения. По умолчанию `pingInterval: 25000` мс, `pingTimeout: 20000` мс. Если в течение `pingInterval + pingTimeout` от клиента нет `pong`, сервер закрывает соединение.

```ts
import { Server } from "socket.io";

const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 20000,
});
```

## Сервер и клиент: базовое использование

### Сервер (Node.js)

```ts
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "https://app.example.com" },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, reason);
  });
});

httpServer.listen(3000);
```

### Клиент (браузер)

```ts
import { io } from "socket.io-client";

const socket = io("https://api.example.com", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
});

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});
```

## События и broadcast

Socket.IO — событийная модель: клиент и сервер обмениваются именованными событиями через `emit`/`on`.

```ts
// Сервер
io.on("connection", (socket) => {
  socket.on("chat:message", (payload) => {
    // ответ конкретному клиенту
    socket.emit("chat:reply", { ok: true });

    // рассылка всем, кроме отправителя
    socket.broadcast.emit("chat:message", payload);

    // рассылка всем подключённым
    io.emit("chat:message", payload);
  });
});
```

```
io.emit(...)               → всем клиентам
socket.broadcast.emit(...) → всем, кроме отправителя
socket.emit(...)           → только отправителю
io.to(room).emit(...)      → всем в комнате
```

**Пакетная передача.** `socket.volatile.emit()` отправляет событие, только если соединение в состоянии `open` — сообщение теряется без очереди, подходит для не критичных данных (позиция курсора, метрики).

## Rooms: комнаты

**Rooms** — способ группировать сокеты для таргетной рассылки. Каждый сокет по умолчанию находится в комнате, названной его `socket.id`. Комнаты живут в рамках namespace и не пересекаются между серверами кластера без adapter.

```ts
io.on("connection", (socket) => {
  // войти в комнату
  socket.join("room:news");

  // покинуть комнату
  socket.leave("room:news");
});

// рассылка в комнату
io.to("room:news").emit("news:update", data);

// рассылка в несколько комнат
io.to("room:news").to("room:sports").emit("update", data);
```

**Типичные сценарии:**

- `room:user:<id>` — персональные уведомления конкретному пользователю;
- `room:chat:<chatId>` — сообщения в конкретном чате;
- `room:lobby` — общая комната для всех, кому нужен общий поток.

```ts
// Присоединение к комнате чата
socket.on("chat:join", (chatId) => {
  socket.join(`room:chat:${chatId}`);
});

// Отправка в конкретный чат
io.to(`room:chat:${chatId}`).emit("chat:message", message);
```

## Namespaces: пространства имён

**Namespaces** — изоляция соединений по URL-префиксу на одном сервере. Это разные «каналы» со своими сокетами, событиями и middleware, но общий transport-level канал.

```
/socket.io/chat   → namespace "/chat"
/socket.io/news   → namespace "/news"
/socket.io/       → namespace "/" (по умолчанию)
```

```ts
// Сервер
const chatIo = io.of("/chat");
chatIo.on("connection", (socket) => {
  console.log("Chat client:", socket.id);
});

const newsIo = io.of("/news");
newsIo.on("connection", (socket) => {
  console.log("News client:", socket.id);
});
```

```ts
// Клиент
const chatSocket = io("https://api.example.com/chat");
const newsSocket = io("https://api.example.com/news");
```

**Когда нужны namespaces:**

- разным модулям приложения нужны разные наборы событий;
- хотите разную авторизацию и middleware для разных каналов;
- хотите изолировать ошибки: падение одного namespace не роняет другие.

**Rooms vs Namespaces:** namespaces делят соединение на логические каналы, rooms группируют сокеты *внутри* namespace для рассылки.

## Acknowledgements

**Acknowledgements** — встроенный механизм подтверждения: вы передаёте callback последним аргументом в `emit`, сервер вызывает его с результатом обработки.

```ts
// Клиент
socket.emit("chat:create", { title: "Hello" }, (response) => {
  console.log("Server confirmed:", response.id);
});
```

```ts
// Сервер
socket.on("chat:create", (payload, callback) => {
  const chat = createChat(payload);
  // подтверждение клиенту
  callback({ ok: true, id: chat.id });
});
```

**Как это работает:**

```
Клиент: emit("chat:create", data, cb)
Сервер: on("chat:create", (data, callback) => callback(result))
Клиент: cb(result)  ← вызывается с ответом сервера
```

Acknowledgements превращают «fire and forget» события в запрос-ответ поверх WebSocket и полезны для операций, где клиенту нужен результат (создание сущности, валидация, ошибки). Обработайте случай, когда сервер не отвечает — добавьте timeout:

```ts
const response = await socket.timeout(5000).emitWithAck("chat:create", payload);
```

## Middleware и авторизация

**Middleware** выполняется при подключении нового сокета, до событий `connection`. Типичная задача — проверка токена.

```ts
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!isValidToken(token)) {
    return next(new Error("Unauthorized"));
  }

  socket.data.user = getUserByToken(token);
  next();
});
```

```ts
// Клиент передаёт токен через auth
const socket = io("https://api.example.com", {
  auth: { token: localStorage.getItem("token") },
});
```

- Токен можно передать в `auth`, в query-параметрах или в заголовках (`socket.handshake.headers`).
- Данные пользователя кладутся в `socket.data` — к ним есть доступ в любых обработчиках.
- При ошибке `next(new Error(...))` клиент получает `connect_error`, и по умолчанию переподключение не происходит (можно включить через `reconnectionAttempts`).

## Переподключения и recovery

### Автоматическое переподключение

Клиент Socket.IO переподключается сам с exponential backoff. Управляется опциями:

| Опция | По умолчанию | Смысл |
|---|---|---|
| `reconnection` | `true` | включать переподключение |
| `reconnectionAttempts` | `Infinity` | число попыток |
| `reconnectionDelay` | `1000` | стартовая задержка |
| `reconnectionDelayMax` | `5000` | кап задержки |
| `randomizationFactor` | `0.5` | случайный разброс (jitter) |

```ts
const socket = io("https://api.example.com", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
});
```

### Connection State Recovery

С версии **4.6** сервер может восстанавливать состояние после переподключения:

- комнаты, в которых был сокет;
- недоставленные события (буфер).

```ts
const io = new Server(httpServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 минуты
    skipMiddlewares: true,
  },
});
```

```ts
// Клиент
socket.on("connect", () => {
  // socket.recovered === true, если состояние восстановлено сервером
  if (socket.recovered) return;
  // иначе загружаем недостающие данные заново
  loadMissingMessages();
});
```

## Масштабирование: Redis adapter

Один сервер Socket.IO держит ограниченное число соединений. Для горизонтального масштабирования серверы связываются через **Redis adapter**: события и рассылки в комнаты распространяются через Redis Pub/Sub на все ноды кластера.

```ts
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
});
```

```
                  ┌──────────────┐
   Клиент ───────▶│  Node 1 (io) │──┐
                  └──────────────┘  │  Redis Pub/Sub
                  ┌──────────────┐  │
   Клиент ───────▶│  Node 2 (io) │──┤
                  └──────────────┘  │
                  ┌──────────────┐  │
   Клиент ───────▶│  Node 3 (io) │──┘
                  └──────────────┘
```

Теперь `io.emit()` и `io.to(room).emit()` на любой ноде рассылаются всем клиентам кластера.

### Sticky sessions

Для HTTP long-polling запросы одного клиента должны попадать на один и тот же сервер — это **sticky sessions** на балансировщике. Для чистого WebSocket это не обязательно, но polling-транспорт без sticky sessions ломается.

```
Load Balancer (sticky)
   ├── Node 1  ← клиент A (все polling-запросы)
   ├── Node 2  ← клиент B
   └── Node 3  ← клиент C
```

Для Redis adapter достаточно одного adapter-конфига на всех нодах и sticky sessions на балансировщике.

## Socket.IO vs нативный WebSocket

| | Нативный WebSocket | Socket.IO |
|---|---|---|
| Протокол | Стандартный (RFC 6455) | Собственный поверх WebSocket |
| Fallback | Нет | HTTP long-polling |
| Переподключение | Ручное | Автоматическое с backoff |
| Rooms / Namespaces | Ручная реализация | Встроенные |
| Acknowledgements | Нет | Встроенные |
| Пакетная передача | Нет | `volatile`, бинарные данные |
| Размер клиента | 0 KB | ~40 KB |
| Совместимость | Любой WebSocket-сервер | Только Socket.IO-сервер |

**Когда Socket.IO:** нужны переподключения, комнаты и fallback «из коробки», Node.js на сервере.

**Когда нативный WebSocket:** лёгкий клиент, стандартный протокол, интеграция с не-Node.js сервером, полный контроль.

## Лучшие практики

### 1. Используйте комнаты вместо глобального broadcast

Не шлите `io.emit()` на всех — рассылайте через `io.to(room)`. Это и производительность, и приватность.

```ts
// ❌
io.emit("update", data);

// ✅
io.to(`room:user:${userId}`).emit("update", data);
```

### 2. Валидируйте входные данные

События приходят с клиента — проверяйте payload до обработки (zod, валидация в middleware).

```ts
socket.on("chat:message", (payload) => {
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) return;
  io.to(`room:chat:${parsed.data.chatId}`).emit("chat:message", parsed.data);
});
```

### 3. Отписывайте слушателей при unmount

Клиентские слушатели, навешанные без отписки, утекают.

```ts
useEffect(() => {
  socket.on("chat:message", onMessage);
  return () => {
    socket.off("chat:message", onMessage);
  };
}, []);
```

### 4. Используйте acknowledgements для критичных операций

Для операций, где нужен результат, используйте callback или `emitWithAck` с timeout — так клиент узнает об ошибке, а не молча потеряет событие.

### 5. Настраивайте reconnection под задачу

Для коротких уведомлений достаточно нескольких попыток; для длинных сессий — больше попыток и recovery.

### 6. Храните состояние в `socket.data`, не в глобальных переменных

Метаданные о клиенте (user, roomId) кладите в `socket.data` — они переживают middleware и доступны в обработчиках.

## Антипаттерны

### 1. Слушатели без отписки

```ts
// ❌ Каждый вызов добавляет новый слушатель
function subscribe() {
  socket.on("chat:message", handleMessage);
}

// ✅ Отписка при размонтировании
function subscribe() {
  socket.on("chat:message", handleMessage);
  return () => socket.off("chat:message", handleMessage);
}
```

### 2. Авторизация только на клиенте

Проверка токена должна быть на сервере (middleware), иначе любой может подключиться.

### 3. Глобальный broadcast вместо комнат

`io.emit()` на всех клиентов — антипаттерн для приватных данных; лишняя нагрузка и утечка информации.

### 4. Игнорирование `disconnect`

Не обработанный `disconnect` оставляет мусор в состоянии и «призрачные» комнаты.

### 5. Хранение сокетов в глобальном состоянии

```ts
// ❌ Глобальная коллекция сокетов
const sockets = [];
io.on("connection", (socket) => sockets.push(socket));

// ✅ Комнаты — встроенный механизм
socket.join(`room:user:${userId}`);
```

---

## Ключевые тезисы для интервью

- Socket.IO — библиотека поверх WebSocket с собственным протоколом, а не реализация WebSocket.
- Нижний слой Engine.IO отвечает за транспорт: начинает с HTTP long-polling, затем upgrade до WebSocket.
- Heartbeat (ping/pong) в Engine.IO по умолчанию `pingInterval` 25000 мс и `pingTimeout` 20000 мс.
- `io.emit` — всем, `socket.broadcast.emit` — всем кроме отправителя, `socket.emit` — отправителю.
- Rooms группируют сокеты внутри namespace для таргетной рассылки через `io.to(room).emit`.
- Namespaces делят соединение на логические каналы по URL-префиксу (`io.of("/chat")`).
- Acknowledgements — callback последним аргументом `emit`, сервер вызывает его с результатом.
- Middleware через `io.use()` проверяет подключение до события `connection`, авторизация — через `socket.handshake.auth`.
- Клиент переподключается автоматически с exponential backoff и jitter.
- Connection State Recovery (4.6+) восстанавливает комнаты и недоставленные события после переподключения.
- Горизонтальное масштабирование — через Redis adapter (@socket.io/redis-adapter) с рассылкой через Redis Pub/Sub.
- Для HTTP long-polling при нескольких серверах обязательны sticky sessions.

## Заключение

Socket.IO решает задачи real-time там, где нативный WebSocket заставляет всё писать вручную: переподключения, комнаты, namespaces, acknowledgements и fallback на polling. Понимание Engine.IO и транспортов объясняет, почему библиотека работает там, где WebSocket падает. На практике ключевое — комнаты вместо глобального broadcast, middleware для авторизации, аккуратная отписка слушателей и Redis adapter для горизонтального масштабирования. Если нужен лёгкий стандартный протокол и не-Node.js сервер — выбирайте нативный WebSocket.

## Полезные ссылки

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery/)
- [Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)