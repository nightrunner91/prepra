---
title: "Методы рендеринга в Next.js: CSR, SSR, SSG, ISR, PPR"
section: performance
description: "Next.js поддерживает CSR, SSR, SSG, ISR, RSC, Streaming и PPR — каждая стратегия решает свои задачи по балансу между производительностью, актуальностью данных и SEO."
order: 4
tags: ["nextjs", "ssr", "ssg", "isr", "ppr", "rsc"]
questions:
  - "Чем SSR отличается от SSG? Когда использовать каждый?"
  - "Что такое ISR и как работает stale-while-revalidate?"
  - "В чём разница между revalidatePath и revalidateTag?"
  - "Что такое React Server Components и чем они отличаются от Client Components?"
  - "Что такое Static Export и чем он отличается от SSG?"
  - "Как работает Partial Prerendering (PPR)?"
  - "Что такое Streaming SSR и зачем нужен Suspense?"
  - "Какой метод рендеринга выбрать для блога, e-commerce, дашборда?"
  - "Какие функции Next.js недоступны при Static Export?"
---

# Методы рендеринга в Next.js: CSR, SSR, SSG, ISR, PPR

Next.js поддерживает несколько стратегий рендеринга, и выбор между ними определяет баланс производительности, актуальности данных и SEO. Каждый метод решает конкретный сценарий: статические блоги, персонализированные дашборды, e-commerce с частыми обновлениями цен.

## Содержание

1. [CSR — Client-Side Rendering](#1-csr--client-side-rendering-рендеринг-на-клиенте)
2. [SSR — Server-Side Rendering](#2-ssr--server-side-rendering-рендеринг-на-сервере)
3. [SSG — Static Site Generation](#3-ssg--static-site-generation-статическая-генерация)
4. [ISR — Incremental Static Regeneration](#4-isr--incremental-static-regeneration-инкрементальная-статическая-регенерация)
5. [RSC — React Server Components](#5-rsc--react-server-components-серверные-компоненты-react)
6. [Streaming SSR](#6-streaming-ssr-потоковый-серверный-рендеринг)
7. [Static Export](#7-static-export-статический-экспорт)
8. [PPR — Partial Prerendering](#8-ppr--partial-prerendering-частичный-пререндеринг)
9. [Сравнительная таблица](#сравнительная-таблица)
10. [Рекомендации по выбору](#рекомендации-по-выбору)
11. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
12. [Заключение](#заключение)

---

## 1. CSR — Client-Side Rendering (Рендеринг на клиенте)

**Что это:** Страница рендерится полностью в браузере с помощью JavaScript.

**Когда использовать:**
- Дашборды, приватные страницы
- Интерактивные приложения без SEO-требований
- Контент, не требующий индексации

**Как включить:**
```tsx
'use client'

import { useState, useEffect } from 'react'

export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{data?.title}</div>
}
```

**Плюсы:**
- Мгновенная навигация после первой загрузки
- Снижает нагрузку на сервер

**Минусы:**
- Плохо для SEO (поисковики видят пустую страницу)
- Долгая первая загрузка ([FCP](#fcp), [LCP](#lcp))
- Зависимость от JavaScript

---

## 2. SSR — Server-Side Rendering (Рендеринг на сервере)

**Что это:** Страница генерируется на сервере при каждом запросе.

**Когда использовать:**
- Динамический контент, который часто меняется
- Персонализированные страницы
- Данные, которые должны быть актуальными при каждом запросе

**Как включить:**
```tsx
// app/page.tsx
export const dynamic = 'force-dynamic' // Отключает кэширование

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  const posts = await data.json()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

**Плюсы:**
- SEO-friendly (полный HTML при первом запросе)
- Всегда актуальные данные
- Быстрая первая отрисовка

**Минусы:**
- Нагрузка на сервер при каждом запросе
- Медленнее, чем статические страницы
- Требует серверной инфраструктуры

---

## 3. SSG — Static Site Generation (Статическая генерация)

**Что это:** Страницы генерируются один раз при сборке проекта и раздаются как статические файлы.

**Когда использовать:**
- Блоги, документация
- Маркетинговые страницы
- Контент, который редко меняется

**Как включить:**
```tsx
// app/posts/page.tsx
export const dynamic = 'force-static' // По умолчанию в Next.js

export default async function Page() {
  const posts = await getAllPosts() // Выполняется при сборке

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

**Для динамических маршрутов:**
```tsx
// app/posts/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())
  
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}
```

**Плюсы:**
- Максимальная производительность (CDN)
- Отличное SEO
- Низкая нагрузка на сервер

**Минусы:**
- Долгая сборка при большом количестве страниц
- Контент устаревает до следующей сборки

---

## 4. ISR — Incremental Static Regeneration (Инкрементальная статическая регенерация)

**Что это:** Комбинация SSG и SSR. Страницы генерируются статически, но могут обновляться в фоне с заданной периодичностью.

**Когда использовать:**
- Контент, который обновляется периодически (раз в минуту/час/день)
- Большие сайты, где полная пересборка нецелесообразна
- E-commerce (цены, наличие товаров)

**Как включить:**
```tsx
// app/page.tsx
export const revalidate = 60 // Обновлять каждые 60 секунд

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // Или через опции fetch
  })

  return <div>{data.title}</div>
}
```

**On-Demand Revalidation (по запросу):**

Механизм принудительного обновления кэша ISR-страницы по событию, без ожидания истечения `revalidate`.

**Как это работает:**
1. Страница сгенерирована статически и лежит в кэше
2. Происходит событие (например, добавлена новая статья в CMS)
3. Вызывается API-эндпоинт, который очищает кэш для конкретной страницы
4. Следующий запрос к странице генерирует её заново и кладёт свежую версию в кэш

**revalidatePath** — очищает кэш конкретного пути:
```tsx
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { path } = await request.json()
  
  revalidatePath(path) // Очищает кэш для /posts/my-article
  
  return Response.json({ revalidated: true, now: Date.now() })
}
```

**revalidateTag** — очищает кэш по тегу (более гибкий подход):
```tsx
// app/posts/page.tsx
export default async function Page() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] } // Помечаем данные тегом
  }).then(res => res.json())
  
  return <PostsList posts={posts} />
}

// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  revalidateTag('posts') // Очищает ВСЕ данные с тегом 'posts'
  
  return Response.json({ revalidated: true })
}
```

**Практический сценарий (CMS + Webhook):**
```tsx
// app/api/webhook/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')
  
  if (secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 })
  }
  
  const { event, data } = await request.json()
  
  if (event === 'post.updated') {
    revalidateTag(`post-${data.id}`) // Обновляем конкретный пост
    revalidatePath('/') // Обновляем главную (список постов)
  }
  
  return Response.json({ revalidated: true })
}
```

**Разница между Path и Tag:**

| Подход | Когда использовать |
|--------|-------------------|
| `revalidatePath` | Знаешь точный URL страницы |
| `revalidateTag` | Нужно обновить несколько страниц/компонентов с одними данными |

**Пример с тегами:**
```tsx
// app/posts/page.tsx — использует тег 'posts'
const posts = await fetchPosts({ next: { tags: ['posts'] } })

// app/posts/[slug]/page.tsx — использует тег конкретного поста
const post = await fetchPost(slug, { next: { tags: [`post-${slug}`] } })

// app/api/revalidate/route.ts
revalidateTag('posts') // Обновит список постов
revalidateTag('post-my-article') // Обновит только конкретный пост
```

**Поведение stale-while-revalidate:**
1. Запрос к странице с невалидным кэшем → stale-while-revalidate
2. Пользователь получает старую версию (мгновенно)
3. В фоне генерируется новая версия
4. Следующие запросы получают свежую версию

Это означает, что **первый пользователь после ревалидации может увидеть устаревший контент**, но последующие — уже актуальный.

**Плюсы:**
- Производительность SSG + актуальность SSR
- Не нужна полная пересборка
- Гибкость в выборе частоты обновления

**Минусы:**
- Пользователь может увидеть устаревший контент (до revalidate)
- Сложнее в настройке, чем чистый SSG

---

## 5. RSC — React Server Components (Серверные компоненты React)

**Что это:** Компоненты, которые выполняются исключительно на сервере. Не отправляются в бандл клиента.

**Когда использовать:**
- Получение данных напрямую из компонента (БД, API, файловая система)
- Работа с конфиденциальными данными (токены, ключи API, секреты)
- Тяжёлые зависимости (не нужно тащить в клиентский бандл)
- Статический контент (блоги, документация, маркетинговые страницы)
- Компоненты, которые не требуют интерактивности (карточки, списки, навигация)
- Композиция с клиентскими компонентами (обёртка для передачи данных)
- Оптимизация размера бандла (большие библиотеки остаются на сервере)
- Прямой доступ к backend-ресурсам без API-слоя
- По умолчанию все компоненты в App Router — серверные

**Как использовать:**
```tsx
// app/page.tsx — Серверный компонент (по умолчанию)
import { db } from '@/lib/db' // Прямой доступ к БД

export default async function Page() {
  const users = await db.user.findMany() // Async/await прямо в компоненте
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

**Клиентский компонент (когда нужен интерактив):**
```tsx
// components/Counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**Плюсы:**
- Нулевой размер бандла для серверных компонентов
- Прямой доступ к backend-ресурсам
- Автоматический code splitting
- Улучшенная безопасность (секреты не попадают в клиент)

**Минусы:**
- Нет доступа к хукам (useState, useEffect)
- Нет доступа к браузерным API (window, localStorage)
- Нет обработчиков событий

**Практическое соотношение RSC и Client Components:**

В реальном Next.js проекте **большинство компонентов — серверные (RSC)**. Типичное соотношение: **70-80% RSC, 20-30% Client Components**.

**Почему так:**
- Страницы, layouts, компоненты данных — всё это RSC по умолчанию
- Клиентские компоненты нужны только там, где есть интерактивность (формы, модальные окна, слайдеры, дропдауны)
- RSC лучше для производительности (меньше JavaScript на клиенте)

**Типичные Client Components:**
- Формы с валидацией
- Модальные окна, дропдауны, табы
- Слайдеры, карусели
- Компоненты с локальным состоянием (счётчики, toggle)
- Обработчики событий (onClick, onChange, onSubmit)
- Использование хуков (useState, useEffect, useRef)

**Типичные RSC:**
- Страницы (app/**/page.tsx)
- Layouts (app/**/layout.tsx)
- Компоненты получения данных
- Статические компоненты (карточки, списки, навигация)
- Обёртки для клиентских компонентов

**Терминология:**
- **RSC** — React Server Components (серверные компоненты)
- **Client Components** — клиентские компоненты (официальное название)
- Термин **RCC** (React Client Components) **не используется официально**, но иногда встречается в сообществах. Правильно говорить просто "Client Components" или "клиентские компоненты".

---

## 6. Streaming SSR (Потоковый серверный рендеринг)

**Что это:** Разновидность SSR, где HTML отправляется частями (чанками) по мере готовности компонентов.

**Когда использовать:**
- Страницы с тяжёлыми компонентами
- Когда нужно показать контент как можно быстрее
- Использование Suspense для graceful degradation

**Как включить:**
```tsx
// app/page.tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Главная страница</h1>
      
      <Suspense fallback={<div>Загрузка...</div>}>
        <SlowComponent /> {/* Рендерится позже */}
      </Suspense>
    </div>
  )
}

async function SlowComponent() {
  const data = await fetchSlowData() // Блокирующий запрос
  return <div>{data.content}</div>
}
```

**Плюсы:**
- Быстрый Time to First Byte (TTFB)
- Прогрессивная загрузка контента
- Лучший пользовательский опыт

**Минусы:**
- Сложнее в отладке
- Требует поддержки Suspense на клиенте

---

## 7. Static Export (Статический экспорт)

**Что это:** Режим деплоя, при котором Next.js приложение экспортируется как полностью статический сайт (HTML, CSS, JS файлы), который можно хостить на любом статическом сервере без Node.js.

**Отличие от SSG:**
- SSG — это стратегия рендеринга (страницы генерируются при сборке)
- Static Export — это режим вывода (всё приложение становится статическим)
- При Static Export ВСЕ страницы принудительно становятся SSG
- SSG может работать в обычном Next.js с сервером, Static Export — нет

**Когда использовать:**
- Хостинг без Node.js (GitHub Pages, Netlify static, Vercel static, S3)
- Полностью статические сайты (блоги, документация, лендинги)
- Когда не нужны динамические функции сервера
- Снижение затрат на инфраструктуру

**Как включить:**
```js
// next.config.js
module.exports = {
  output: 'export', // Включает статический экспорт
}
```

**Что НЕ работает с Static Export:**
- SSR (серверный рендеринг)
- ISR (инкрементальная регенерация)
- API Routes (`app/api/**`)
- Middleware
- Image Optimization (через `next/image` default loader)
- Dynamic Routes без `generateStaticParams`
- Rewrites, redirects (на уровне сервера)
- On-demand revalidation

**Ограничения динамических маршрутов:**
```tsx
// app/posts/[slug]/page.tsx
// Обязательна generateStaticParams для всех динамических маршрутов
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())
  
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function Page({ params }: { params: { slug: string } }) {
  // ...
}
```

**Плюсы:**
- Можно хостить где угодно (любой статический хостинг)
- Не нужен Node.js сервер
- Минимальные затраты на инфраструктуру
- Максимальная производительность (CDN)
- Простой деплой

**Минусы:**
- Нет динамических функций (SSR, ISR, API routes)
- Все данные должны быть доступны при сборке
- Долгая сборка при большом количестве страниц
- Нет on-demand revalidation
- Ограничения на динамические маршруты

**Сравнение с SSG:**

| Аспект | SSG | Static Export |
|--------|-----|---------------|
| Тип | Стратегия рендеринга | Режим деплоя |
| Сервер | Может быть | Не нужен |
| ISR | Поддерживается | Не поддерживается |
| API Routes | Поддерживаются | Не поддерживаются |
| Хостинг | Node.js сервер или CDN | Любой статический хостинг |

**Практический пример:**
```js
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true, // Отключает оптимизацию изображений
  },
}
```

**Команда сборки:**
```bash
npm run build
# Создаёт папку 'out' с статическими файлами
```

---

## 8. PPR — Partial Prerendering (Частичный пререндеринг)

**Что это:** Гибридная стратегия, при которой страница имеет статическую оболочку (генерируется при сборке) и динамические части (рендерятся на сервере при запросе). Использует `Suspense` для определения границ.

**Когда использовать:**
- Страницы с общей статической структурой (header, footer, sidebar) и динамическим контентом
- Персонализированные страницы (статический layout + динамические данные пользователя)
- E-commerce (статическая карточка товара + динамические отзывы/цены)
- Когда нужно избежать client-side fetching для динамических данных

**Как включить:**
```js
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // Глобальное включение PPR
  },
}
```

```tsx
// app/page.tsx
import { Suspense } from 'react'

export const experimental_ppr = true // Или на уровне страницы

export default function Page() {
  return (
    <div>
      {/* Статическая оболочка — рендерится при сборке */}
      <header>Навигация</header>
      <main>
        <h1>Главная страница</h1>
        
        {/* Динамическая часть — рендерится на сервере при запросе */}
        <Suspense fallback={<div>Загрузка...</div>}>
          <UserProfile /> {/* Персонализированный контент */}
        </Suspense>
        
        {/* Ещё одна динамическая часть */}
        <Suspense fallback={<div>Загрузка...</div>}>
          <RecentPosts /> {/* Динамические данные */}
        </Suspense>
      </main>
      <footer>Футер</footer>
    </div>
  )
}

async function UserProfile() {
  const user = await fetchUser() // Выполняется при каждом запросе
  return <div>Привет, {user.name}!</div>
}

async function RecentPosts() {
  const posts = await fetchRecentPosts() // Выполняется при каждом запросе
  return <ul>{posts.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

**Как это работает:**
1. При сборке генерируется статическая оболочка (header, footer, layout, всё вне `Suspense`)
2. При запросе страницы сервер мгновенно отдаёт статическую оболочку
3. Динамические части (внутри `Suspense`) рендерятся на сервере параллельно
4. Клиент получает статический HTML сразу, динамические части подгружаются через streaming

**Плюсы:**
- Мгновенная первая отрисовка (статическая оболочка кэшируется)
- Динамический контент без client-side fetching
- Лучший UX: пользователь видит контент сразу, динамические части загружаются прогрессивно
- Меньше нагрузки на сервер, чем SSR (статическая часть не рендерится при каждом запросе)
- Автоматическое определение статических/динамических границ через `Suspense`

**Минусы:**
- Экспериментальная функция (может измениться в будущих версиях)
- Требует явного использования `Suspense` для динамических частей
- Сложнее в отладке, чем чистый SSG или SSR
- Не все хостинги поддерживают PPR (нужен Node.js сервер)

**Сравнение с другими методами:**

| Аспект | SSR | SSG | ISR | PPR |
|--------|-----|-----|-----|-----|
| Статическая часть | Нет | Вся страница | Вся страница | Оболочка |
| Динамическая часть | Вся страница | Нет | Нет | Только в `Suspense` |
| Рендеринг при запросе | Да | Нет | Периодически | Только динамические части |
| Производительность | Средняя | Максимальная | Максимальная | Высокая |
| Актуальность данных | Всегда | При сборке | Периодически | Всегда (для динамических частей) |

**Практический пример (e-commerce):**
```tsx
// app/product/[id]/page.tsx
import { Suspense } from 'react'

export const experimental_ppr = true

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Статические данные (могут быть кэшированы)
  const product = await fetchProduct(params.id)
  
  return (
    <div>
      {/* Статическая часть */}
      <h1>{product.name}</h1>
      <img src={product.image} alt={product.name} />
      <p>{product.description}</p>
      
      {/* Динамическая часть (цена, наличие) */}
      <Suspense fallback={<div>Проверка наличия...</div>}>
        <ProductStock productId={params.id} />
      </Suspense>
      
      {/* Динамическая часть (отзывы) */}
      <Suspense fallback={<div>Загрузка отзывов...</div>}>
        <ProductReviews productId={params.id} />
      </Suspense>
    </div>
  )
}

async function ProductStock({ productId }: { productId: string }) {
  const stock = await fetchStock(productId) // Актуальные данные при каждом запросе
  return <div>В наличии: {stock.count} шт.</div>
}

async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await fetchReviews(productId) // Актуальные отзывы
  return <ul>{reviews.map(review => <li key={review.id}>{review.text}</li>)}</ul>
}
```

**Когда НЕ использовать PPR:**
- Полностью статические страницы (используй SSG)
- Полностью динамические страницы (используй SSR)
- Когда нужен полный контроль над кэшированием (используй ISR)
- Когда хостинг не поддерживает Node.js (используй Static Export)

---

## Сравнительная таблица

| Метод | SEO | Скорость | Актуальность | Сложность |
|-------|-----|----------|--------------|-----------|
| CSR   | Плохо | Медленная [FCP](#fcp) | Всегда | Низкая |
| SSR   | Отлично | Быстрая | Всегда | Средняя |
| SSG   | Отлично | Максимальная | При сборке | Низкая |
| ISR   | Отлично | Максимальная | Периодически | Средняя |
| RSC   | Отлично | Максимальная | Зависит от данных | Средняя |
| Streaming | Отлично | Быстрая TTFB | Всегда | Высокая |
| Static Export | Отлично | Максимальная | При сборке | Низкая |
| PPR   | Отлично | Высокая | Всегда (динамические части) | Высокая |

---

## Рекомендации по выбору

- **Блог/документация** → SSG или Static Export
- **E-commerce** → ISR + RSC или PPR (для страниц товаров)
- **Дашборд** → CSR + RSC
- **Новости/соцсеть** → SSR или ISR
- **Лендинг** → SSG или Static Export
- **Админка** → CSR
- **GitHub Pages / статический хостинг** → Static Export
- **Персонализированные страницы** → PPR (статический layout + динамический контент)
- **Страницы с общей структурой и динамическими данными** → PPR

---

## Сноски

<a id="fcp"></a>
**FCP (First Contentful Paint)** — время до первого отображения любого контента на экране (текст, изображение, SVG). Показывает, насколько быстро пользователь видит, что страница "загружается".

<a id="lcp"></a>
**LCP (Largest Contentful Paint)** — время до отрисовки самого крупного видимого элемента (обычно главное изображение или заголовок). Ключевая метрика воспринимаемой скорости загрузки.

---

## Ключевые тезисы для интервью

- CSR рендерит страницу в браузере: плохо для SEO, быстрая навигация после первой загрузки.
- SSR генерирует HTML на каждый запрос: SEO-friendly, всегда актуальные данные, нагрузка на сервер.
- SSG генерирует HTML при сборке: максимальная производительность, данные устаревают до следующей сборки.
- ISR = SSG + периодическое обновление: stale-while-revalidate — первый пользователь после ревалидации видит старую версию.
- `revalidatePath` инвалидирует конкретный URL; `revalidateTag` — все данные с заданным тегом.
- RSC выполняются только на сервере, не попадают в JS-бандл клиента; хуки и браузерные API в них недоступны.
- В App Router ~70-80% компонентов — серверные (RSC), клиентские нужны только для интерактивности.
- Streaming SSR отправляет HTML чанками через Suspense, улучшая TTFB на страницах с тяжёлыми компонентами.
- Static Export: всё приложение — статические файлы без Node.js; SSR, ISR и API Routes недоступны.
- PPR: статическая оболочка при сборке + динамические части через Suspense при запросе.

## Заключение

Правильный выбор стратегии рендеринга — один из ключевых архитектурных решений в Next.js проекте. SSG и Static Export дают максимальную производительность для контента, не требующего актуальности. ISR добавляет периодическое обновление без полной пересборки. SSR гарантирует свежие данные при каждом запросе. RSC сокращают JS-бандл, вынося логику на сервер. PPR объединяет всё: статическая оболочка + динамические части по запросу. Для большинства проектов оптимален гибридный подход: SSG/ISR для публичных страниц, RSC + Client Components для интерактивных разделов.

## Полезные ссылки

- [Next.js Rendering Documentation](https://nextjs.org/docs/app/building-your-application/rendering)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
