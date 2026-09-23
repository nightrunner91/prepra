---
title: "Основы Next.js: что это, зачем нужен и как начать"
section: nextjs
description: "Фундамент Next.js для начинающих: что такое Next.js, чем отличается от React, файловый роутинг, серверный рендеринг (SSR), статическая генерация (SSG), инкрементальная статическая регенерация (ISR) и первые шаги."
order: 1
tags: ["nextjs-basics", "ssr", "ssg", "isr", "file-based-routing", "react-framework"]
questions:
  - "Какие задачи production-приложения решает Next.js по сравнению с чистым React и когда стоит выбирать каждый из подходов"
  - "В каком порядке выбирать стратегию рендеринга — CSR, SSR, SSG или ISR — и как частота изменения контента влияет на решение"
  - "Чем серверные компоненты отличаются от клиентских в App Router и почему клиентские компоненты нужно держать как можно меньше"
  - "Как файловый роутинг определяет URL через структуру папок и какую роль играют layout, динамические маршруты и Link"
  - "Как `<Image />` и `next/font` оптимизируют загрузку и почему это важно для Core Web Vitals"
  - "Как создать REST API в Next.js без внешнего бэкенда и какие HTTP-методы поддерживают API Routes"
---

# Основы Next.js: что это, зачем нужен и как начать

React — отличная библиотека для построения пользовательских интерфейсов, но она не решает всех задач production-приложения. Вам нужны роутинг, серверный рендеринг, оптимизация изображений, работа с API, деплой. Next.js — это фреймворк поверх React, который даёт всё это из коробки. В этой статье разберём, что такое Next.js, какие проблемы он решает, как работает файловый роутинг, серверный рендеринг и статическая генерация.

## Содержание

1. [Что такое Next.js и зачем он нужен](#что-такое-nextjs-и-зачем-он-нужен)
2. [Создание проекта](#создание-проекта)
3. [Структура проекта](#структура-проекта)
4. [Файловый роутинг](#файловый-роутинг)
5. [Рендеринг: CSR, SSR, SSG, ISR](#рендеринг-csr-ssr-ssg-isr)
6. [Серверные и клиентские компоненты](#серверные-и-клиентские-компоненты)
7. [Оптимизация изображений](#оптимизация-изображений)
8. [Оптимизация шрифтов](#оптимизация-шрифтов)
9. [Метаданные и SEO](#метадамнные-и-seo)
10. [API Routes](#api-routes)
11. [Деплой](#деплой)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Next.js и зачем он нужен

### React — это библиотека, а не фреймворк

React решает одну задачу: построение пользовательских интерфейсов. Но для production-приложения нужно гораздо больше:

- **Роутинг** — навигация между страницами
- **Серверный рендеринг** — генерация HTML на сервере для SEO и быстрой загрузки
- **Оптимизация** — изображения, шрифты, код-сплиттинг
- **Работа с данными** — API routes, server-side data fetching
- **Деплой** — куда и как деплоить приложение

Можно собрать всё это вручную, используя React + React Router + Express + webpack + Babel и десятки других инструментов. Но это долго, сложно и требует поддержки.

### Next.js — фреймворк для React

Next.js — это React-фреймворк, который даёт всё необходимое из коробки:

| Возможность | React (самостоятельно) | Next.js |
|-------------|----------------------|---------|
| Роутинг | Нужен React Router | ✅ Встроенный файловый роутинг |
| SSR | Нужно настраивать вручную | ✅ Встроенный SSR |
| SSG | Нужно настраивать вручную | ✅ Встроенный SSG |
| Оптимизация изображений | Нужен image-loader | ✅ Встроенный `<Image />` |
| Оптимизация шрифтов | Нужно настраивать вручную | ✅ Встроенный `next/font` |
| API Routes | Нужен Express/Fastify | ✅ Встроенный API |
| Code Splitting | Нужен webpack config | ✅ Автоматический |
| SEO | Нужен react-helmet | ✅ Встроенные metadata |

### Когда использовать Next.js

**Используйте Next.js, если:**
- Строите production-приложение (интернет-магазин, блог, SaaS)
- Важно SEO (поисковые движки должны индексировать контент)
- Нужна быстрая первая загрузка (FCP, LCP)
- Нужен серверный рендеринг или статическая генерация
- Нужен встроенный API для работы с данными

**Используйте чистый React (Vite), если:**
- Строите SPA (Single Page Application) — дашборд, админку, внутреннее приложение
- Не важно SEO (приложение за авторизацией)
- Нужна максимальная гибкость и контроль
- Строите библиотеку или компонент

### Кто использует Next.js

Next.js используется в production компаниями: TikTok, Notion, Figma, Hulu, Nike, Twitch, Twitch, Twitch и многими другими.

---

## Создание проекта

### Базовая установка

```bash
# Создать проект с интерактивным выбором настроек
npx create-next-app@latest my-app

# Или сразу с нужными настройками
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Что вас спросит:**
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes** (рекомендуется)
- Would you like to use `src/` directory? → **Yes** (лучшая организация)
- Would you like to use App Router? → **Yes** (современный подход)
- Would you like to customize the default import alias? → **No** (или Yes, если нужно)

### Запуск проекта

```bash
cd my-app

# Разработка
npm run dev

# Сборка для production
npm run build

# Запуск production-сборки
npm start

# Линтинг
npm run lint
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## Структура проекта

```
my-app/
├── src/
│   ├── app/                    # App Router (файловый роутинг)
│   │   ├── layout.tsx          # Корневой layout (обязателен)
│   │   ├── page.tsx            # Главная страница (/)
│   │   ├── globals.css         # Глобальные стили
│   │   ├── about/
│   │   │   └── page.tsx        # Страница /about
│   │   ├── blog/
│   │   │   ├── page.tsx        # Страница /blog
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Динамическая страница /blog/my-post
│   │   └── api/
│   │       └── hello/
│   │           └── route.ts    # API endpoint /api/hello
│   └── components/             # Переиспользуемые компоненты
│       ├── Header.tsx
│       └── Footer.tsx
├── public/                     # Статические файлы (изображения, favicon)
│   ├── favicon.ico
│   └── images/
├── next.config.js              # Конфигурация Next.js
├── package.json
├── tsconfig.json
└── tailwind.config.ts          # Конфигурация Tailwind (если используется)
```

### Ключевые директории

**`src/app/`** — здесь живут все страницы и API routes. Структура папок определяет URL:
- `src/app/page.tsx` → `/`
- `src/app/about/page.tsx` → `/about`
- `src/app/blog/[slug]/page.tsx` → `/blog/my-post`

**`src/components/`** — переиспользуемые компоненты (Header, Footer, Button и т.д.)

**`public/`** — статические файлы, доступные по прямым ссылкам:
- `public/favicon.ico` → `/favicon.ico`
- `public/images/logo.png` → `/images/logo.png`

---

## Файловый роутинг

### Базовая маршрутизация

В Next.js структура папок определяет URL. Чтобы создать страницу, добавьте файл `page.tsx` в директорию `app/`:

```tsx
// src/app/page.tsx — Главная страница (/)
export default function HomePage() {
  return <h1>Добро пожаловать на главную!</h1>;
}

// src/app/about/page.tsx — Страница /about
export default function AboutPage() {
  return <h1>О нас</h1>;
}

// src/app/contact/page.tsx — Страница /contact
export default function ContactPage() {
  return <h1>Контакты</h1>;
}
```

### Динамические маршруты

Для динамических URL (например, `/blog/my-post`) используйте квадратные скобки:

```tsx
// src/app/blog/[slug]/page.tsx
// Этот файл обрабатывает /blog/post-1, /blog/post-2 и т.д.

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Загрузка данных для конкретного поста
  const post = await fetchPost(slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### Вложенные маршруты

```
src/app/
├── page.tsx                    # /
├── about/
│   └── page.tsx                # /about
├── blog/
│   ├── page.tsx                # /blog
│   ├── [slug]/
│   │   └── page.tsx            # /blog/my-post
│   └── category/
│       └── [category]/
│           └── page.tsx        # /blog/category/tech
```

### Layouts

Layout — это обёртка, которая сохраняется при навигации между страницами:

```tsx
// src/app/layout.tsx — корневой layout (обязателен)
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/blog">Blog</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>© 2024 My App</footer>
      </body>
    </html>
  );
}

// src/app/blog/layout.tsx — layout для /blog/*
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-layout">
      <aside>Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}
```

### Навигация

**Link — для навигации между страницами:**

```tsx
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/my-post">Blog Post</Link>
    </nav>
  );
}
```

**useRouter — для программной навигации:**

```tsx
'use client'; // клиентский компонент

import { useRouter } from 'next/navigation';

export default function Button() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/dashboard');
  };
  
  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

---

## Рендеринг: CSR, SSR, SSG, ISR

### Клиентский рендеринг (CSR — Client-Side Rendering)

**Как работает:**
1. Браузер загружает пустой HTML + JavaScript
2. JavaScript выполняется и генерирует DOM
3. Пользователь видит контент

**Плюсы:**
- Быстрая навигация после первой загрузки (SPA)
- Меньше нагрузка на сервер

**Минусы:**
- Медленная первая загрузка (нужно загрузить и выполнить весь JS)
- Плохо для SEO (поисковые движки видят пустой HTML)

**Когда использовать:**
- Дашборды, админки, внутренние приложения
- Приложения за авторизацией

```tsx
'use client'; // клиентский компонент

import { useState, useEffect } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Данные загружаются на клиенте после монтирования
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  if (!data) return <div>Loading...</div>;
  
  return <div>{data.message}</div>;
}
```

### Серверный рендеринг (SSR — Server-Side Rendering)

**Как работает:**
1. При каждом запросе сервер генерирует HTML с данными
2. Браузер получает готовый HTML и показывает его пользователю
3. JavaScript "гидрирует" (hydrates) страницу — делает её интерактивной

**Плюсы:**
- Быстрая первая загрузка (HTML готов сразу)
- Хорошо для SEO (поисковые движки видят полный HTML)

**Минусы:**
- Нагрузка на сервер (нужно генерировать HTML при каждом запросе)
- Медленнее, чем SSG (нужно ждать генерации)

**Когда использовать:**
- Контент часто меняется (новости, лента новостей)
- Данные зависят от пользователя (персонализированные страницы)

```tsx
// Серверный компонент (по умолчанию в App Router)
export default async function Page() {
  // Данные загружаются на сервере при каждом запросе
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store', // не кэшировать
  });
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

### Статическая генерация (SSG — Static Site Generation)

**Как работает:**
1. При сборке (`npm run build`) Next.js генерирует HTML для всех страниц
2. Готовый HTML раздаётся через CDN
3. При запросе браузер получает готовый HTML мгновенно

**Плюсы:**
- Самая быстрая загрузка (HTML готов и кэшируется на CDN)
- Отлично для SEO
- Минимальная нагрузка на сервер

**Минусы:**
- Нужно пересобирать сайт при изменении контента
- Не подходит для часто меняющихся данных

**Когда использовать:**
- Блоги, документация, маркетинговые страницы
- Контент меняется редко (раз в день/неделю)

```tsx
// При сборке Next.js сгенерирует HTML для всех постов
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// Для динамических маршрутов нужно указать, какие страницы генерировать
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  
  return posts.map(post => ({
    slug: post.slug,
  }));
}
```

### Инкрементальная статическая регенерация (ISR — Incremental Static Regeneration)

**Как работает:**
1. При сборке генерируется HTML для некоторых страниц
2. При запросе страницы, которая ещё не сгенерирована, она генерируется на лету
3. Периодически (например, раз в минуту) страницы перегенерируются в фоне

**Плюсы:**
- Быстрая загрузка (как SSG)
- Контент может обновляться без пересборки
- Минимальная нагрузка на сервер

**Минусы:**
- Сложнее настроить
- Небольшая задержка при первом запросе новой страницы

**Когда использовать:**
- Контент меняется периодически (раз в минуту/час)
- Большое количество страниц (тысячи постов)

```tsx
export default async function BlogPage() {
  const data = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // перегенерировать раз в 60 секунд
  });
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

### Сравнение подходов

| Подход | Когда генерируется HTML | Скорость | SEO | Сложность |
|--------|------------------------|----------|-----|-----------|
| CSR | На клиенте после загрузки JS | Медленная первая загрузка | Плохо | Низкая |
| SSR | На сервере при каждом запросе | Средняя | Отлично | Средняя |
| SSG | При сборке (`npm run build`) | Самая быстрая | Отлично | Низкая |
| ISR | При сборке + перегенерация в фоне | Очень быстрая | Отлично | Средняя |

### Что выбрать?

```
Контент меняется часто (каждую секунду/минуту)?
├── Да → SSR
└── Нет → Контент меняется редко (раз в день/неделю)?
    ├── Да → SSG
    └── Нет → Контент меняется периодически (раз в минуту/час)?
        ├── Да → ISR
        └── Нет → SSG
```

---

## Серверные и клиентские компоненты

### Серверные компоненты (по умолчанию)

В App Router все компоненты **серверные** по умолчанию. Это значит, что они выполняются на сервере и отправляют готовый HTML в браузер.

```tsx
// src/app/page.tsx — серверный компонент (по умолчанию)
export default async function HomePage() {
  // Можно напрямую работать с БД, файловой системой и т.д.
  const posts = await db.posts.findMany();
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

**Плюсы серверных компонентов:**
- Меньше JavaScript отправляется в браузер
- Прямой доступ к серверным ресурсам (БД, файловая система)
- Автоматический code splitting
- Лучше для SEO

**Минусы:**
- Нельзя использовать хуки (useState, useEffect)
- Нельзя использовать браузерные API (window, localStorage)
- Нельзя использовать обработчики событий (onClick, onChange)

### Клиентские компоненты

Если нужен интерактив (хуки, события, браузерные API), добавьте директиву `'use client'`:

```tsx
'use client'; // клиентский компонент

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**Когда использовать клиентские компоненты:**
- Нужны хуки (useState, useEffect, useContext)
- Нужны обработчики событий (onClick, onChange)
- Нужно браузерное API (window, localStorage)
- Нужны классы React (Component)

### Композиция серверных и клиентских компонентов

Лучшая практика — держать клиентские компоненты как можно меньше и передавать им данные через props:

```tsx
// src/app/page.tsx — серверный компонент
import ClientCounter from '@/components/ClientCounter';

export default async function HomePage() {
  const data = await fetchSomeData();
  
  return (
    <div>
      <h1>Server Component</h1>
      <p>Data: {data.message}</p>
      
      {/* Клиентский компонент получает данные через props */}
      <ClientCounter initialCount={data.count} />
    </div>
  );
}

// src/components/ClientCounter.tsx — клиентский компонент
'use client';

import { useState } from 'react';

export default function ClientCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

---

## Оптимизация изображений

Next.js предоставляет компонент `<Image />` для автоматической оптимизации изображений:

```tsx
import Image from 'next/image';

export default function Page() {
  return (
    <Image
      src="/images/photo.jpg"
      alt="Description"
      width={800}
      height={600}
      priority // загрузить с приоритетом (для above-the-fold изображений)
    />
  );
}
```

**Что делает `<Image />`:**
- Автоматически конвертирует в современные форматы (WebP, AVIF)
- Генерирует разные размеры для разных экранов (responsive)
- Ленивая загрузка (lazy loading) по умолчанию
- Предотвращает сдвиг layout (Cumulative Layout Shift)

### Изображения с внешних доменов

Если используете изображения с внешних URL (например, CMS), нужно разрешить домены в `next.config.js`:

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
        pathname: '/uploads/**',
      },
    ],
  },
};
```

```tsx
// Теперь можно использовать
<Image
  src="https://images.example.com/uploads/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>
```

---

## Оптимизация шрифтов

Next.js автоматически оптимизирует шрифты через `next/font`:

```tsx
// src/app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  display: 'swap', // показывать fallback-шрифт пока загружается
  variable: '--font-inter', // CSS-переменная для использования
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

**Плюсы `next/font`:**
- Шрифты загружаются локально (нет запросов к Google Fonts)
- Автоматическая оптимизация (preload, preconnect)
- Нулевое влияние на layout (no layout shift)

### Локальные шрифты

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700' },
  ],
  display: 'swap',
});
```

---

## Метаданные и SEO

### Static Metadata

```tsx
// src/app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App — Главная страница',
  description: 'Описание для поисковых движков',
  openGraph: {
    title: 'My App',
    description: 'Описание для соцсетей',
    images: ['/og-image.png'],
  },
};

export default function HomePage() {
  return <h1>Главная</h1>;
}
```

### Dynamic Metadata

```tsx
// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);
  
  return <article>{post.content}</article>;
}
```

---

## API Routes

### Базовый API

Создайте файл `route.ts` в директории `app/api/`:

```tsx
// src/app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello, World!' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body }, { status: 201 });
}
```

### Обработка параметров

```tsx
// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser(params.id);
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const user = await updateUser(params.id, body);
  
  return NextResponse.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await deleteUser(params.id);
  
  return NextResponse.json({ success: true });
}
```

### Query параметры

```tsx
// src/app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const page = searchParams.get('page');
  
  const results = await search(query, page);
  
  return NextResponse.json(results);
}
```

---

## Деплой

### Vercel (рекомендуется)

Vercel — компания, создавшая Next.js. Деплой максимально прост:

1. Запушьте код на GitHub/GitLab/Bitbucket
2. Зайдите на [vercel.com](https://vercel.com)
3. Импортируйте репозиторий
4. Vercel автоматически настроит сборку и деплой

**Плюсы:**
- Автоматический CI/CD
- Глобальный CDN
- Serverless Functions из коробки
- Preview Deployments для каждого PR

### Self-hosted (свой сервер)

```bash
# Сборка
npm run build

# Запуск
npm start
```

Next.js запустится на порту 3000. Используйте reverse proxy (nginx) для продакшена.

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

---

## Ключевые тезисы для интервью

- Next.js — React-фреймворк с роутингом, SSR/SSG/ISR, оптимизацией и API Routes из коробки.
- Файловый роутинг: папки в `app/` = URL; `page.tsx` — страница, `layout.tsx` — обёртка, `[slug]` — динамика.
- CSR → SSR → SSG → ISR: выбор по частоте изменения контента (от часто к редко).
- Серверные компоненты — по умолчанию; `'use client'` — только для интерактива, данные через props.
- `<Image />` — WebP/AVIF/responsive/lazy; `next/font` — локальная загрузка, preload, no layout shift.
- `metadata` / `generateMetadata` — SEO и Open Graph; API Routes (`route.ts`) — встроенный backend.
- Vercel — рекомендуемый деплой (CI/CD, CDN, preview); альтернативы — self-hosted или Docker.

---

## Заключение

Next.js — это мощный фреймворк для React, который решает все задачи production-приложения: роутинг, серверный рендеринг, оптимизация, работа с данными, деплой. В этой статье мы разобрали основы: что такое Next.js, как работает файловый роутинг, чем отличаются CSR/SSR/SSG/ISR, как использовать серверные и клиентские компоненты.

Следующие статьи раздела углубятся в продвинутые темы: data fetching, кэширование, серверные действия (Server Actions), оптимизация производительности, middleware, Edge Runtime и многое другое. Но без понимания основ, которые мы разобрали здесь, эти темы будут непонятны.

Создайте свой первый Next.js-проект, поэкспериментируйте с файловым роутингом, попробуйте SSG и SSR. Только практика поможет закрепить эти знания.

---

## Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs) — официальная документация
- [Next.js Learn](https://nextjs.org/learn) — интерактивный туториал
- [Vercel](https://vercel.com) — рекомендуемая платформа для деплоя
- [Next.js GitHub](https://github.com/vercel/next.js) — исходный код и примеры
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) — примеры проектов
