# Типизация кастомных хуков и async-паттерны в React

Кастомные хуки — основной механизм переиспользования логики в React. TypeScript превращает их из удобного инструмента в контракт: вы точно знаете, что хук принимает, что возвращает, и как ведёт себя при разных входных данных. Async-паттерны добавляют свою сложность: AbortController, типизация ответов API, обработка ошибок в эффектах.

## Почему `useEffect` не может быть async

Это ограничение связано с **моделью рендеринга React**, а не с TypeScript.

React вызывает функции-компоненты синхронно. Каждый `useEffect` должен вернуть либо `void` (ничего), либо **cleanup-функцию** — синхронную функцию, которая вызывается при размонтировании или перед повторным запуском эффекта.

```typescript
// ❌ Ошибка: useEffect не может быть async
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);

// ✅ Правильно: async-функция внутри useEffect
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  loadData();
}, []);
```

Почему React не поддерживает async-эффекты: если `useEffect` возвращает Promise, React не может знать, когда эффект «завершится». Cleanup-функция должна быть вызвана синхронно при размонтировании — если эффект ещё не завершился, React не может корректно очистить ресурсы.

## Типизация возвращаемых значений

Хуки возвращают данные через кортежи или объекты. Выбор влияет на типобезопасность и удобство использования.

### Кортежи — для простых случаев

```tsx
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

const [isOpen, toggleOpen] = useToggle(false);
```

Тип `[boolean, () => void]` — кортеж фиксированной длины. Без явного указания TypeScript вывел бы `(boolean | (() => void))[]` — массив, где каждый элемент может быть чем угодно.

### Объекты — для сложных случаев

```tsx
interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

function useCounter(initial = 0): UseCounterReturn {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, increment, decrement, reset };
}

const { count, increment, reset } = useCounter(10);
```

| Подход | Когда использовать |
|---|---|
| Кортеж | 1-2 значения, порядок важен |
| Объект | 3+ поля, нужна гибкость, частичная деструктуризация |

## Дженерики в хуках

Дженерики позволяют создавать хуки, работающие с любыми типами, сохраняя типобезопасность.

```tsx
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

const [theme, setTheme] = useLocalStorage("theme", "light"); // T = string
const [user, setUser] = useLocalStorage<User>("user", null); // T = User | null
```

### Дженерики с ограничениями

```tsx
interface HasId {
  id: string;
}

function useItemsById<T extends HasId>(items: T[]): Map<string, T> {
  return useMemo(() => {
    const map = new Map<string, T>();
    items.forEach(item => map.set(item.id, item));
    return map;
  }, [items]);
}
```

### Дженерики с несколькими параметрами

```tsx
function useAsync<TData, TError = Error>(
  asyncFn: () => Promise<TData>
): {
  data: TData | null;
  error: TError | null;
  isLoading: boolean;
  execute: () => Promise<void>;
} {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err as TError);
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn]);

  return { data, error, isLoading, execute };
}
```

## Перегрузки хуков

Перегрузки позволяют хуку возвращать разные типы в зависимости от входных параметров.

```tsx
function useCounter(initial: number): { count: number; set: (value: number) => void };
function useCounter(initial: number, asTuple: true): [number, (value: number) => void];
function useCounter(initial: number, asTuple?: boolean) {
  const [count, setCount] = useState(initial);
  const set = useCallback((value: number) => setCount(value), []);

  if (asTuple) {
    return [count, set] as const;
  }
  return { count, set };
}

const { count, set } = useCounter(0);        // объект
const [count, set] = useCounter(0, true);    // кортеж
```

## Async в компонентах

### Базовый паттерн

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to load user");
        const data = await response.json();
        if (isMounted) {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

### Почему нужен cleanup

Флаг `isMounted` предотвращает обновление состояния после размонтирования. Это важно по двум причинам:

**1. React Strict Mode.** В development-режиме React монтирует, размонтирует и снова монтирует каждый компонент. Без cleanup вы получите двойной запрос и потенциальную гонку состояний.

**2. React Concurrent Features.** React может прервать рендеринг и начать заново. Если запрос завершился, но компонент уже размонтирован, `setState` вызовет warning (а в React 18 — может привести к непредсказуемому поведению).

### AbortController

Флаг `isMounted` предотвращает обновление состояния, но **не отменяет запрос**. Для отмены используется AbortController:

```tsx
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Запрос отменён — не ошибка
        }
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();

    return () => {
      controller.abort(); // Отменяет запрос при размонтировании
    };
  }, [query]);

  return (
    <div>
      {isLoading && <Spinner />}
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

`AbortError` — специальное исключение при отмене запроса. Его нужно обрабатывать отдельно, чтобы не показывать пользователю ошибку.

## Fetch-машина: state machine

Fetch-машина — паттерн моделирования состояний загрузки через **discriminated unions**. Это не просто удобный способ организовать код — это **конечный автомат** (state machine), который гарантирует корректность состояний.

### Проблема обычного подхода

Обычный подход — три независимых поля:

```tsx
const [data, setData] = useState<User | null>(null);
const [error, setError] = useState<Error | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

Это допускает **бессмысленные состояния**:
- `data` и `error` одновременно не null
- `isLoading = true` и `error` не null
- Все три поля null

TypeScript не может гарантировать, что вы обработали все комбинации.

### Решение: discriminated unions

```tsx
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

Каждый вариант — **допустимое состояние**. Невозможные состояния исключены на уровне типов:
- При `status: "success"` — `data` гарантированно существует
- При `status: "error"` — `error` гарантированно существует
- Нельзя иметь `data` и `error` одновременно

### Реализация

```tsx
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

type FetchAction<T> =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: T }
  | { type: "FETCH_ERROR"; error: Error }
  | { type: "RESET" };

function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading" };
    case "FETCH_SUCCESS":
      return { status: "success", data: action.data };
    case "FETCH_ERROR":
      return { status: "error", error: action.error };
    case "RESET":
      return { status: "idle" };
  }
}

function useFetch<T>(url: string) {
  const [state, dispatch] = useReducer(fetchReducer<T>, { status: "idle" });

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_START" });
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: T = await response.json();
        dispatch({ type: "FETCH_SUCCESS", data });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        dispatch({
          type: "FETCH_ERROR",
          error: err instanceof Error ? err : new Error("Unknown error"),
        });
      }
    };

    fetchData();
    return () => controller.abort();
  }, [url]);

  return { ...state, refetch: () => dispatch({ type: "RESET" }) };
}
```

### Использование с exhaustiveness checking

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { status, data, error, refetch } = useFetch<User>(`/api/users/${userId}`);

  switch (status) {
    case "idle":
    case "loading":
      return <Spinner />;
    case "success":
      return <div>{data.name}</div>; // ✅ data гарантированно существует
    case "error":
      return (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      );
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
```

TypeScript проверяет, что все варианты обработаны. Если добавить новое состояние в `FetchState`, компилятор выдаст ошибку в `default`.

## Типизация API-ответов

`response.json()` возвращает `Promise<any>`. TypeScript не проверяет, что данные соответствуют ожидаемому типу. Решение — type guard:

```tsx
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data &&
    "email" in data
  );
}

async function fetchUserSafe(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();

  if (!isUser(data)) {
    throw new Error("Invalid user data");
  }

  return data;
}
```

### Generic fetch-обёртка

```tsx
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return response.json();
}

const users = await apiFetch<User[]>("/api/users");
```

## Обработка ошибок

```tsx
function handleError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(`API error ${err.status}:`, err.data);
    showToast(`Error: ${err.statusText}`);
  } else if (err instanceof TypeError && err.message.includes("fetch")) {
    showToast("No internet connection");
  } else if (err instanceof Error) {
    console.error("Unexpected error:", err.message);
    showToast("Something went wrong");
  } else {
    showToast("Unknown error");
  }
}
```

## Типичные ошибки

### 1. Async useEffect

```tsx
// ❌ useEffect не может быть async
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);

// ✅ async-функция внутри useEffect
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  loadData();
}, []);
```

### 2. Отсутствие cleanup

```tsx
// ❌ Утечка памяти: обновление состояния после размонтирования
useEffect(() => {
  fetchData().then(data => setData(data));
}, []);

// ✅ Cleanup: AbortController или isMounted
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal).then(data => setData(data));
  return () => controller.abort();
}, []);
```

### 3. Неправильная типизация catch

```tsx
// ❌ TypeScript не позволяет типизировать err в catch
try {
  await fetchData();
} catch (err: Error) { // Ошибка компиляции
  console.error(err.message);
}

// ✅ catch (err: unknown) + type guard
try {
  await fetchData();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}
```

### 4. Игнорирование AbortError

```tsx
// ❌ AbortError обрабатывается как обычная ошибка
try {
  const response = await fetch(url, { signal });
  const data = await response.json();
  setData(data);
} catch (err) {
  setError(err); // AbortError тоже попадает сюда
}

// ✅ Проверка на AbortError
try {
  const response = await fetch(url, { signal });
  const data = await response.json();
  setData(data);
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") {
    return; // Запрос отменён — не ошибка
  }
  setError(err);
}
```

### 5. Кортеж без явного типа

```tsx
// ❌ Тип выводится как (string | number)[]
function useCounter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1);
  return [count, increment];
}

// ✅ Явный тип кортежа
function useCounter(): [number, () => void] {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1);
  return [count, increment];
}
```

### 6. Независимые поля состояния вместо discriminated union

```tsx
// ❌ Допускает бессмысленные состояния
const [data, setData] = useState<User | null>(null);
const [error, setError] = useState<Error | null>(null);
const [isLoading, setIsLoading] = useState(false);

// ✅ Discriminated union — только допустимые состояния
type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```
