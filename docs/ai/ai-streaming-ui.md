---
title: "Streaming UI"
section: ai
description: "SSE, управление потоковыми ответами и UX-паттерны для чат-интерфейсов — технический слой стриминга в LLM-приложениях"
order: 5
tags: ["streaming", "sse", "server-sent-events", "chat-ui", "abortcontroller", "ux"]
questions:
  - "Как LLM API возвращает потоковый ответ"
  - "Что такое Server-Sent Events и чем отличается от WebSocket"
  - "Как управлять состоянием при накоплении стримингового ответа"
  - "Как реализовать прерывание стрима (AbortController)"
  - "Какие UX-паттерны используются при стриминге"
  - "Как обрабатывать ошибки в середине потока"
  - "Почему streaming улучшает воспринимаемую скорость"
---

# Streaming UI

Предыдущая статья разобралась, как устроены агентные паттерны — модель принимает решения, вызывает инструменты, работает в цикле. Но с точки зрения пользователя всё это происходит «внутри». Единственное, что видит пользователь — текст, появляющийся на экране. Streaming UI — это слой между LLM API и интерфейсом: как доставлять ответ модели токен за токеном, управлять состоянием потока, прерывать его и обрабатывать ошибки. Эта статья — о технической реализации и UX-паттернах потоковых ответов.

## Содержание

1. [Как streaming работает в LLM API](#как-streaming-работает-в-llm-api)
2. [Server-Sent Events: протокол и формат](#server-sent-events-протокол-и-формат)
3. [Управление состоянием при потоковом ответе](#управление-состоянием-при-потоковом-ответе)
4. [Прерывание стрима: AbortController](#прерывание-стрима-abortcontroller)
5. [Обработка ошибок в середине потока](#обработка-ошибок-в-середине-потока)
6. [UX-паттерны: индикация, прерывание, retry](#ux-паттерны-индикация-прерывание-retry)
7. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
8. [Заключение](#заключение)
9. [Полезные ссылки](#полезные-ссылки)

---

## Как streaming работает в LLM API

### Проблема: генерация занимает время

LLM генерирует ответ токен за токеном. Для ответа в 500 токенов при скорости 50 токенов/сек это 10 секунд. Если ждать полного ответа перед показом — пользователь увидит пустой экран 10 секунд, затем весь текст сразу. Воспринимаемая latency = 10 секунд.

Со стримингом пользователь видит первый токен через 300–800 мс (TTFT), а затем текст появляется постепенно. Воспринимаемая latency = 300–800 мс. Содержимое то же самое, но ощущение — мгновенный отклик.

### Два режима API

Почти все LLM API предлагают два режима:

```ts
// Non-streaming: ждём полный ответ
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  messages: [{ role: "user", content: "Объясни React Server Components" }],
});
// response.content[0].text — полный текст, 10 секунд ожидания

// Streaming: получаем токены по мере генерации
const stream = await client.messages.stream({
  model: "claude-sonnet-4-6",
  messages: [{ role: "user", content: "Объясни React Server Components" }],
});
// Токены приходят по одному, первый — через ~500мс
```

### Что происходит под капотом

При стриминге сервер не закрывает HTTP-соединение после первого байта. Он держит connection open и отправляет данные порциями по мере генерации. Каждый «chunk» — это один или несколько токенов. Клиент читает поток через `ReadableStream` и обрабатывает каждый chunk по мере поступления.

```
Non-streaming:
Клиент → Запрос → Сервер → [генерация 10 сек] → Ответ (500 токенов) → Клиент

Streaming:
Клиент → Запрос → Сервер → токен₁ → токен₂ → ... → токен₅₀₀ → [done] → Клиент
                              ↑ первый токен через ~500мс, остальные каждые ~20мс
```

Клиент получает те же 500 токенов, но начинает отображать их через 500мс вместо 10 секунд.

---

## Server-Sent Events: протокол и формат

### Что такое SSE

Server-Sent Events — протокол поверх HTTP, при котором сервер отправляет события клиенту через одно долгое соединение. Клиент открывает соединение один раз и получает данные непрерывно.

SSE — однонаправленный: сервер → клиент. Если клиенту нужно отправить данные, он делает обычный HTTP-запрос.

### Формат SSE

Каждое событие — текстовый блок в теле HTTP-ответа с `Content-Type: text/event-stream`:

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_123","model":"claude-sonnet-4-6"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"React"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" Server"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" Components"}}

event: message_stop
data: {"type":"message_stop"}

```

Каждое событие отделено двойным переносом строки. Поле `event` — тип события, поле `data` — JSON-данные.

### SSE vs WebSocket

| Критерий | SSE | WebSocket |
|----------|-----|-----------|
| Направление | Сервер → клиент | Двусторонний |
| Протокол | HTTP | WS (отдельный протокол) |
| Переподключение | Встроенный браузер | Нужно писать вручную |
| Формат данных | Текст (обычно JSON) | Текст или бинарные данные |
| Простота | Простой HTTP-запрос | Нужен отдельный сервер/хендлшер |
| Использование для LLM | Чат-стриминг, SSE от API | Чат с двусторонней связью, real-time collaboration |

Для LLM-стриминга SSE достаточно: клиент отправляет промпт через POST-запрос, сервер возвращает поток токенов через SSE. Двусторонняя связь не нужна — клиент не отправляет данные в процессе генерации.

### Чтение SSE на клиенте

```ts
async function streamCompletion(prompt: string, onToken: (text: string) => void) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE-события разделены двойным переносом строки
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? ""; // последнее может быть неполным

    for (const event of events) {
      const dataLine = event.split("\n").find(line => line.startsWith("data: "));
      if (!dataLine) continue;

      const data = JSON.parse(dataLine.slice(6));
      if (data.type === "content_block_delta" && data.delta?.text) {
        onToken(data.delta.text);
      }
    }
  }
}
```

Ключевой момент: `reader.read()` возвращает управление, как только приходит очередной chunk. Мы накапливаем данные в буфере, разделяем на события по `\n\n` и обрабатываем каждое.

---

## Управление состоянием при потоковом ответе

### Проблема накопления

Каждый chunk содержит только новый фрагмент текста. UI должен отображать полный накопленный ответ. Это требует состояния, которое обновляется по каждому токену.

### React: накопление через state

```tsx
function ChatMessage({ prompt }: { prompt: string }) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let accumulated = "";
    setIsStreaming(true);

    streamCompletion(prompt, (token) => {
      accumulated += token;
      setContent(accumulated);
    }).finally(() => {
      setIsStreaming(false);
    });
  }, [prompt]);

  return (
    <div className="message">
      <MarkdownRenderer content={content} />
      {isStreaming && <span className="cursor">▊</span>}
    </div>
  );
}
```

Проблема: `setState` на каждый токен вызывает ре-рендер. При 50 токенах/сек это 50 ре-рендеров в секунду. Для простого компонента — не проблема. Для сложного Markdown-рендера с подсветкой синтаксиса — может тормозить.

### Оптимизация: батчинг обновлений

```tsx
function ChatMessage({ prompt }: { prompt: string }) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let accumulated = "";
    let pendingUpdate = false;
    setIsStreaming(true);

    streamCompletion(prompt, (token) => {
      accumulated += token;

      // Обновляем state не чаще чем раз в кадр
      if (!pendingUpdate) {
        pendingUpdate = true;
        requestAnimationFrame(() => {
          setContent(accumulated);
          pendingUpdate = false;
        });
      }
    }).finally(() => {
      setIsStreaming(false);
    });
  }, [prompt]);

  return (
    <div className="message">
      <MarkdownRenderer content={content} />
      {isStreaming && <span className="cursor">▊</span>}
    </div>
  );
}
```

`requestAnimationFrame` группирует обновления: вместо 50 `setState` в секунду — максимум 60 (по числу кадров). Пользователь не заметит разницы, а нагрузка на React снизится.

### React: useRef для критичных к производительности сценариев

Если Markdown-рендер всё равно тормозит, можно обновлять DOM напрямую, минуя React:

```tsx
function StreamingMessage({ prompt }: { prompt: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let accumulated = "";
    setIsStreaming(true);

    streamCompletion(prompt, (token) => {
      accumulated += token;
      // Обновляем DOM напрямую — без ре-рендера
      if (contentRef.current) {
        contentRef.current.innerHTML = renderMarkdown(accumulated);
      }
    }).finally(() => {
      setIsStreaming(false);
    });
  }, [prompt]);

  return (
    <div className="message">
      <div ref={contentRef} />
      {isStreaming && <span className="cursor">▊</span>}
    </div>
  );
}
```

Это выход из React-модели, но для стриминга — оправданный: ре-рендерить весь компонент на каждый токен избыточно.

### Состояние чата: список сообщений

Полный чат — это список сообщений, каждое из которых может быть в состоянии стриминга:

```ts
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming: boolean;
}

interface ChatState {
  messages: Message[];
  activeStreamId: string | null;
}

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "send":
      return {
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: "user", content: action.text, isStreaming: false },
          { id: crypto.randomUUID(), role: "assistant", content: "", isStreaming: true },
        ],
        activeStreamId: state.messages[state.messages.length - 1]?.id ?? null,
      };

    case "token":
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, content: msg.content + action.token }
            : msg
        ),
      };

    case "complete":
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, isStreaming: false }
            : msg
        ),
        activeStreamId: null,
      };

    default:
      return state;
  }
}
```

Reducer инкапсулирует все переходы состояния. Компонент отправляет действия, reducer обновляет состояние — предсказуемо и тестируемо.

---

## Прерывание стрима: AbortController

### Зачем прерывать

Пользователь отправил запрос, передумал и нажал «Стоп». Генерация продолжается, токены приходят, но пользователю они не нужны. Без прерывания сервер продолжит генерировать, а клиент — потреблять, расходуя токены и деньги.

### AbortController

`AbortController` — стандартный механизм прерывания `fetch`. Создаём контроллер, передаём его `signal` в `fetch`, вызываем `abort()` для отмены.

```ts
function useChatStream() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (text: string) => {
    // Прерываем предыдущий стрим, если есть
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "send", text });
    const assistantId = state.messages.at(-1)?.id ?? "";

    try {
      await streamCompletion(text, (token) => {
        dispatch({ type: "token", messageId: assistantId, token });
      }, controller.signal);

      dispatch({ type: "complete", messageId: assistantId });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Пользователь нажал «Стоп» — не ошибка
        dispatch({ type: "complete", messageId: assistantId });
      } else {
        dispatch({ type: "error", messageId: assistantId, error });
      }
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { state, send, stop };
}
```

### Прерывание на стороне сервера

Клиентский `abort()` закрывает HTTP-соединение. Сервер обнаруживает разрыв при следующей записи в поток и прекращает генерацию. Но это не мгновенно: если сервер уже отправил запрос в LLM API, он будет генерировать до тех пор, пока LLM не закончит или пока сервер не обнаружит разрыв.

```ts
// Серверный обработчик с поддержкой отмены
app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;

  // Если клиент отключился — прерываем
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (aborted) {
      // Клиент отключился — прекращаем
      break;
    }

    if (event.type === "content_block_delta") {
      res.write(`event: content_block_delta\ndata: ${JSON.stringify(event)}\n\n`);
    }
  }

  res.end();
});
```

Без проверки `aborted` сервер будет генерировать до конца, даже если клиент давно отключился. Это расход токенов впустую.

---

## Обработка ошибок в середине потока

### Типы ошибок при стриминге

1. **Ошибка до начала стрима** — HTTP 4xx/5xx, сеть недоступна. Обрабатывается как обычный fetch-error.
2. **Ошибка в середине стрима** — соединение обрывается, сервер возвращает malformed JSON, timeout. Часть ответа уже показана пользователю.
3. **Ошибка LLM** — модель возвращает `error` event в потоке (rate limit, content policy, internal error).

### Обработка ошибки в середине

Самый сложный случай: пользователь уже видит часть ответа. Нельзя просто очистить экран — потеряется контекст. Нужно показать то, что успело сгенерироваться, и обозначить ошибку.

```ts
async function streamCompletion(
  prompt: string,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ completed: boolean; partialContent: string }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) {
    throw new StreamError(`HTTP ${response.status}`, 0);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const data = parseSSEData(event);

        if (data.type === "error") {
          throw new StreamError(data.error.message, accumulated.length);
        }

        if (data.type === "content_block_delta" && data.delta?.text) {
          accumulated += data.delta.text;
          onToken(data.delta.text);
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { completed: false, partialContent: accumulated };
    }
    throw error;
  }

  return { completed: true, partialContent: accumulated };
}
```

### Отображение ошибки в UI

```tsx
function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="message">
      <MarkdownRenderer content={message.content} />

      {message.isStreaming && <span className="cursor">▊</span>}

      {message.error && (
        <div className="message-error">
          <span>Ошибка: {message.error.message}</span>
          <button onClick={() => retry(message.id)}>Повторить</button>
        </div>
      )}
    </div>
  );
}
```

Частичный ответ остаётся на экране. Пользователь видит, что модель успела сгенерировать, и может повторить запрос.

### Retry: повторная отправка

```ts
function retryMessage(messageId: string) {
  // Находим сообщение и удаляем ошибку
  dispatch({ type: "retry", messageId });

  // Находим соответствующий промпт пользователя
  const userMessage = findPrecedingUserMessage(messageId);

  // Повторяем запрос
  send(userMessage.content, messageId);
}
```

Retry переиспользует промпт пользователя и создаёт новый assistant-message взамен ошибочного. Старое сообщение с частичным контентом удаляется.

---

## UX-паттерны: индикация, прерывание, retry

### Индикатор генерации

Пользователь должен видеть, что генерация идёт. Три уровня индикации:

```tsx
// 1. Курсор — мигающий символ в конце текста
{isStreaming && <span className="cursor animate-pulse">▊</span>}

// 2. Skeleton — плейсхолдер, пока не пришёл первый токен
{isStreaming && content === "" && (
  <div className="skeleton">
    <div className="skeleton-line w-3/4" />
    <div className="skeleton-line w-1/2" />
    <div className="skeleton-line w-2/3" />
  </div>
)}

// 3. Индикатор в header — «Модель думает...»
{isStreaming && (
  <div className="status-bar">
    <Spinner />
    <span>Генерация ответа...</span>
    <button onClick={stop}>Стоп</button>
  </div>
)}
```

Skeleton особенно важен: без него пользователь видит пустое место и не понимает, идёт ли генерация или произошёл сбой.

### Кнопка «Стоп»

Кнопка прерывания должна быть доступна всегда во время стрима и исчезать сразу после завершения:

```tsx
function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  return (
    <div className="chat-input">
      {isStreaming ? (
        <button onClick={onStop} className="btn-stop">
          <StopIcon /> Остановить
        </button>
      ) : (
        <button onClick={() => onSend(inputValue)} className="btn-send">
          <SendIcon /> Отправить
        </button>
      )}
      <textarea value={inputValue} onChange={handleInput} />
    </div>
  );
}
```

Переключение «Отправить → Стоп» — стандартный паттерн чат-интерфейсов. Пользователь интуитивно понимает: кнопка меняет поведение в зависимости от состояния.

### Автоскролл

При стриминге текст появляется постепенно. Если пользователь находится внизу — скроллим вниз автоматически. Если пользователь отскроллил вверх для чтения — не трогаем.

```tsx
function ChatWindow({ messages }: { messages: Message[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Если пользователь находится в 100px от низа — считаем, что он «внизу»
      isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserScrolledUp.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div ref={containerRef} className="chat-window">
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
    </div>
  );
}
```

### Disable ввода во время стрима

Пока идёт генерация, новая отправка невозможна — сервер обрабатывает предыдущий запрос. Ввод блокируем, но показываем, что он заблокирован:

```tsx
<textarea
  value={inputValue}
  onChange={handleInput}
  disabled={isStreaming}
  placeholder={isStreaming ? "Дождитесь окончания ответа..." : "Введите сообщение..."}
  className={isStreaming ? "input-disabled" : ""}
/>
```

Альтернатива — очередь запросов: пользователь может написать следующий вопрос, пока генерируется ответ. Но это усложняет серверную часть и редко нужно для LLM-чатов.

---

## Ключевые тезисы для интервью

- Streaming в LLM API возвращает токены по мере генерации через одно HTTP-соединение; воспринимаемая latency снижается с полного времени генерации до TTFT (300–800 мс).
- Server-Sent Events — однонаправленный протокол поверх HTTP (сервер → клиент); для LLM-стриминга достаточно, потому что клиент отправляет промпт через обычный POST, а получает поток токенов через SSE.
- SSE отличается от WebSocket: однонаправленный, поверх HTTP, с встроенным переподключением; WebSocket — двусторонний, отдельный протокол, нужен для real-time collaboration.
- Состояние при стриминге накапливается: каждый chunk содержит только новый токен, UI отображает полный накопленный ответ; `requestAnimationFrame` батчит обновления state для снижения нагрузки на React.
- `AbortController` прерывает `fetch` на клиенте; сервер обнаруживает разрыв соединения при следующей записи и прекращает генерацию, экономя токены.
- Ошибка в середине потока — частичный ответ остаётся на экране, пользователь видит, что модель успела сгенерировать, и может повторить запрос через retry.
- UX-паттерны стриминга: skeleton до первого токена, мигающий курсор во время генерации, кнопка «Стоп», автоскролл с учётом позиции пользователя, блокировка ввода во время генерации.
- Автоскролл при стриминге учитывает позицию пользователя: если он отскроллил вверх для чтения — автоскролл не срабатывает, чтобы не сбивать с контекста.

---

## Заключение

Streaming UI — мост между LLM API и пользовательским восприятием. Техническая сторона: SSE-протокол, `ReadableStream` для чтения, `AbortController` для прерывания, управление состоянием при накоплении токенов. UX-сторона: индикация генерации, кнопка «Стоп», автоскролл, обработка ошибок без потери контекста.

Ключевые выводы:

- **Streaming снижает воспринимаемую latency** с 10 секунд до 500 мс — содержимое то же, но пользователь получает отклик мгновенно.
- **SSE — правильный выбор для LLM-стриминга** — проще WebSocket, работает поверх HTTP, однонаправленности достаточно.
- **AbortController обязателен** — без него пользователь не может прервать генерацию, а сервер расходует токены впустую.
- **Ошибки в середине потока — нормальное состояние** — частичный ответ сохраняется, пользователь может повторить.
- **Состояние чата — reducer** — предсказуемые переходы: send → token → complete/error → retry.

Следующая статья — RAG-паттерн — рассматривает, как давать модели актуальные знания, которых не было в обучающей выборке.

---

## Полезные ссылки

- [MDN — Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — спецификация и использование SSE в браузере
- [MDN — ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) — API для чтения потоковых данных
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — механизм прерывания fetch-запросов
- [Anthropic — Streaming](https://docs.anthropic.com/en/api/streaming) — документация по стримингу в API Anthropic
- [Vercel AI SDK — useChat](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot) — хук для чат-стриминга с управлением состоянием из коробки
