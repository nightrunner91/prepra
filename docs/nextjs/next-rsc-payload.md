---
title: "RSC Payload в Next.js"
section: nextjs
description: "RSC Payload — сериализованный поток данных, который React Server Components отправляют с сервера. Разбираем формат, кэширование, преимущества и ограничения."
order: 9
tags: ["rsc-payload", "react-server-components", "nextjs", "streaming", "hydration", "router-cache"]
questions:
  - "Чем RSC Payload отличается от HTML и JSON"
  - "Какие данные содержит RSC Payload"
  - "Как Next.js использует двойной рендеринг RSC и SSR"
  - "Где и как кэшируется RSC Payload"
  - "Как управлять кэшем через revalidate и router.refresh"
  - "Почему серверные компоненты не имеют доступа к браузерным API"
  - "Как работает селективная гидратация клиентских компонентов"
  - "Как отлаживать RSC Payload в DevTools"
---

# RSC Payload в Next.js

RSC Payload — это формат данных, который React Server Components передают с сервера на клиент вместо обычного JSON или чистого HTML. Понимание его структуры помогает разобраться, как Next.js рендерит страницы, кэширует данные и сокращает объём JavaScript на клиенте. В статье разберём формат потока, механизм двойного рендеринга, уровни кэширования, практические примеры и ограничения серверных компонентов.

## Содержание

1. [Что такое RSC Payload](#что-такое-rsc-payload)
2. [Механизм работы](#механизм-работы)
3. [Кэширование RSC Payload](#кэширование-rsc-payload)
4. [Преимущества RSC Payload](#преимущества-rsc-payload)
5. [Ограничения](#ограничения)
6. [Практические примеры](#практические-примеры)
7. [Отладка RSC Payload](#отладка-rsc-payload)
8. [Сравнение с альтернативами](#сравнение-с-альтернативами)
9. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
10. [Заключение](#заключение)
11. [Полезные ссылки](#полезные-ссылки)

---

## Что такое RSC Payload

**RSC Payload** — это сериализованный поток данных, который React Server Components отправляют с сервера клиенту. Это не HTML и не JSON в привычном смысле, а специальный бинарный формат, содержащий:

- Сериализованное дерево React-элементов
- Результаты `async`/`await` операций (данные из БД, API и т.д.)
- Инструкции по гидратации клиентских компонентов
- Ссылки на чанки (chunks) клиентского JavaScript

## Механизм работы

### 1. Серверный рендеринг

```
┌─────────────────────────────────────────────────┐
│                   СЕРВЕР                         │
│                                                  │
│  1. Запрос от клиента (URL)                      │
│  2. Выполнение Server Components                 │
│  3. Fetch данных, запросы к БД                   │
│  4. Сериализация в RSC Payload                   │
│  5. Отправка клиенту                             │
└─────────────────────────────────────────────────┘
```

### 2. Формат RSC Payload

RSC Payload использует **поточный формат** на основе тегов:

```
// Пример упрощённой структуры RSC Payload
0:["$","div",null,{"children":[["$","h1",null,{"children":"Hello"}],"$","p",null,{"children":"World"}]}]
1:I{"id":"./src/ClientComponent.js","chunks":["chunk1.js"],"name":"default"}
2:["$","$L1",null,{"data":"..."}]
```

**Теги:**
- `0:`, `1:`, `2:` — ID элементов дерева
- `$` — React-элемент
- `$L` — ссылка на клиентский компонент (Lazy)
- `$S` — ссылка на серверный компонент
- `I` — инструкция по импорту клиентского модуля

### 3. Процесс загрузки

```
Клиент → Запрос → Сервер
                         ↓
                  RSC Payload (поток)
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
    Серверные компоненты         Клиентские компоненты
    (уже выполнены)              (требуют гидратации)
         ↓                               ↓
         └───────────────┬───────────────┘
                         ↓
              HTML + RSC Payload в браузере
                         ↓
                   Гидратация React
```

### 4. Двойной рендеринг

Next.js использует **два рендера**:

1. **RSC Render** — создаёт RSC Payload (сервер)
2. **SSR Render** — преобразует RSC Payload в HTML (сервер)

```javascript
// Упрощённо
const rscPayload = await renderToReadableStream(<App />);
const html = await renderToReadableStream(rscPayload); // SSR
```

## Кэширование RSC Payload

### Где кэшируется?

| Уровень | Механизм | Время жизни |
|---------|----------|-------------|
| **Сервер** | Full Route Cache | До ревалидации |
| **CDN/Edge** | HTTP Cache Headers | Контролируется `Cache-Control` |
| **Клиент** | Browser Cache API | До очистки кэша |
| **Клиент** | Memory Cache | До перезагрузки страницы |

### Как кэшируется?

#### 1. Full Route Cache (серверный)

```javascript
// next.config.js
module.exports = {
  experimental: {
    // Включено по умолчанию в Next.js 14+
  }
}

// Отключение кэша для конкретного маршрута
export const dynamic = 'force-dynamic';
export const revalidate = 0; // или false
```

**Что кэшируется:**
- RSC Payload
- Рендеренный HTML
- Результаты `fetch` запросов (без `cache: 'no-store'`)

#### 2. Клиентский кэш (Router Cache)

```javascript
// Next.js кэширует RSC Payload в браузере
// при навигации между страницами

// Кэш хранится в:
// - sessionStorage (для back/forward навигации)
// - Memory (для prefetch)
```

**Механизм Router Cache:**

```
1. Пользователь переходит на /about
2. RSC Payload загружается с сервера
3. RSC Payload сохраняется в Router Cache
4. Пользователь переходит на /contact
5. Пользователь возвращается на /about
6. RSC Payload берётся из кэша (без запроса к серверу)
```

#### 3. Prefetching

```javascript
import Link from 'next/link';

// При hover или viewport — prefetch
<Link href="/about">About</Link>

// Явный prefetch
<Link href="/about" prefetch={true}>About</Link>

// Без prefetch
<Link href="/about" prefetch={false}>About</Link>
```

**Что происходит при prefetch:**
1. Загружается RSC Payload (не HTML)
2. Сохраняется в Router Cache
3. При навигации — мгновенный переход

### Управление кэшем

#### Серверные компоненты

```javascript
// app/page.js
export const revalidate = 60; // Реvalидация каждые 60 секунд

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { 
      revalidate: 3600, // Кэш на 1 час
      tags: ['data'] // Тег для on-demand revalidation
    }
  });
  
  return <div>{/* ... */}</div>;
}
```

#### On-Demand Revalidation

```javascript
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
  // Реvalидация по пути
  revalidatePath('/about');
  
  // Реvalидация по тегу
  revalidateTag('data');
  
  return Response.json({ revalidated: true });
}
```

#### Клиентские компоненты

```javascript
'use client';
import { useRouter } from 'next/navigation';

export default function ClientComponent() {
  const router = useRouter();
  
  const handleUpdate = async () => {
    // Обновление данных
    await fetchData();
    
    // Принудительная реvalидация RSC Payload
    router.refresh(); // Запрашивает новый RSC Payload
    
    // Очистка Router Cache
    router.refresh(); // Сбрасывает кэш
  };
  
  return <button onClick={handleUpdate}>Обновить</button>;
}
```

## Преимущества RSC Payload

### 1. Меньший размер

```
Традиционный SSR:  HTML + JSON данные + JS бандл
RSC Payload:       HTML + RSC Payload (компактный бинарный формат)
```

**Пример:**
- Обычный JSON: `{"user":{"name":"John","age":30}}`
- RSC Payload: `0:["$","div",null,{"children":"John"}]` (только UI-дерево)

### 2. Streaming

```javascript
// Сервер может отправлять RSC Payload по частям
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent /> {/* Будет отправлен, когда будет готов */}
    </Suspense>
  );
}
```

### 3. Селективная гидратация

```
RSC Payload содержит:
- Серверные компоненты (уже выполнены, не требуют JS)
- Клиентские компоненты (требуют гидратации)

Результат: Меньше JS на клиенте
```

## Ограничения

### 1. Нет доступа к браузерным API

```javascript
// Server Component — НЕЛЬЗЯ
'use server';

export default function ServerComponent() {
  // ❌ Ошибка
  const width = window.innerWidth;
  localStorage.setItem('key', 'value');
  
  return <div>...</div>;
}
```

### 2. Нет интерактивности

```javascript
// Server Component — НЕЛЬЗЯ
'use server';

export default function ServerComponent() {
  // ❌ Не работает
  const [count, setCount] = useState(0);
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 3. Кэш может устаревать

```javascript
// Проблема: данные в кэше устарели
// Решение: использовать revalidate или on-demand revalidation

export const revalidate = 60; // или
revalidateTag('my-data');
```

## Практические примеры

### Пример 1: Базовое использование

```javascript
// app/page.js (Server Component по умолчанию)
export default async function Page() {
  const data = await fetch('https://api.example.com/posts');
  const posts = await data.json();
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

**Что происходит:**
1. Сервер выполняет `fetch`
2. Создаёт RSC Payload с данными
3. Отправляет клиенту
4. Клиент рендерит HTML

### Пример 2: Клиентский компонент в Server Component

```javascript
// app/page.js
import LikeButton from './LikeButton'; // Клиентский компонент

export default async function Page() {
  const post = await getPost();
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <LikeButton postId={post.id} /> {/* Гидратируется на клиенте */}
    </article>
  );
}

// app/LikeButton.js
'use client';

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  );
}
```

### Пример 3: Управление кэшем

```javascript
// app/products/page.js
export const revalidate = 3600; // 1 час

export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { 
      revalidate: 3600,
      tags: ['products']
    }
  }).then(res => res.json());
  
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

// app/api/revalidate-products/route.js
import { revalidateTag } from 'next/cache';

export async function POST() {
  revalidateTag('products');
  return Response.json({ revalidated: true });
}
```

## Отладка RSC Payload

### Chrome DevTools

```javascript
// В Network tab можно увидеть:
// - RSC Payload (тип: document, размер: ~5-20KB)
// - HTML (тип: document)
// - JS чанки (тип: script)

// В Performance tab:
// - Время выполнения Server Components
// - Время гидратации
```

### Логирование

```javascript
// Middleware для логирования RSC Payload
export function middleware(request) {
  const response = NextResponse.next();
  
  console.log('RSC Payload headers:', {
    'rsc': request.headers.get('rsc'),
    'next-router-prefetch': request.headers.get('next-router-prefetch'),
  });
  
  return response;
}
```

## Сравнение с альтернативами

| Подход | Размер | Streaming | Селективная гидратация |
|--------|--------|-----------|------------------------|
| **RSC Payload** | Минимальный | ✅ | ✅ |
| **SSR (HTML)** | Большой | ✅ | ❌ |
| **CSR (JSON)** | Средний | ❌ | ❌ |
| **Static (HTML)** | Большой | ❌ | ❌ |

## Ключевые тезисы для интервью

- RSC Payload — сериализованный поток, который React Server Components отправляют с сервера клиенту, а не HTML или JSON.
- Формат потока содержит сериализованное дерево React-элементов, результаты асинхронных операций, инструкции по гидратации и ссылки на JS-чанки.
- Next.js использует двойной рендеринг: RSC Render создаёт Payload, SSR Render превращает его в HTML.
- RSC Payload кэшируется на сервере (Full Route Cache), CDN/Edge (HTTP-заголовки), в браузере (Cache API, Memory) и Router Cache.
- Кэшем управляют через `revalidate`, `revalidateTag`, `revalidatePath` и `router.refresh()`.
- Серверные компоненты не имеют доступа к браузерным API и не могут хранить состояние или обработчики событий.
- RSC Payload уменьшает размер передаваемых данных, поддерживает streaming и селективную гидратацию клиентских компонентов.
- Prefetch загружает RSC Payload заранее и сохраняет его в Router Cache для мгновенной навигации.
- В DevTools RSC Payload виден как document-запрос, а заголовки `rsc` и `next-router-prefetch` помогают отлаживать навигацию.

## Заключение

**RSC Payload** — это ключевой механизм React Server Components, который:

1. **Экономит трафик** — передаёт только необходимые данные
2. **Ускоряет загрузку** — поддерживает streaming
3. **Уменьшает JS бандл** — серверные компоненты не требуют JS на клиенте
4. **Умное кэширование** — многоуровневая система кэширования
5. **Гибкость** — комбинация серверных и клиентских компонентов

**Когда использовать:**
- ✅ Данные доступны на сервере (БД, API)
- ✅ Нужна SEO-оптимизация
- ✅ Важна скорость загрузки
- ✅ Есть статический контент

**Когда НЕ использовать:**
- ❌ Полностью интерактивные приложения (SPA)
- ❌ Данные только на клиенте (localStorage, Web APIs)
- ❌ Частые обновления в реальном времени

## Полезные ссылки

- [React Server Components](https://react.dev/reference/react-server)
- [Next.js Rendering: Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js Link Component](https://nextjs.org/docs/app/api-reference/components/link)
