---
title: "Оптимизация производительности в Next.js"
section: nextjs
description: "Разбираем встроенные механизмы оптимизации Next.js: next/link, next/image, next/font, next/script, рендеринг, кэширование, code splitting и SEO."
order: 6
tags: ["nextjs", "next-link", "next-image", "next-font", "dynamic-imports", "caching"]
questions:
  - "Как работает prefetching в `next/link` и как его контролировать"
  - "Какие пропсы `next/image` обязательны и зачем нужен `priority`"
  - "В чём преимущества `next/font` перед обычным подключением шрифтов"
  - "Какие стратегии загрузки есть у `next/script` и когда их применять"
  - "Как выбрать между SSG, SSR и ISR в Next.js"
  - "Как работают Data Cache, Router Cache и Full Route Cache"
  - "Как генерировать метаданные страниц и sitemap в App Router"
  - "Когда стоит использовать `dynamic()` и `ssr: false`"
  - "Зачем нужен `@next/bundle-analyzer` и Edge Runtime"
---

# Оптимизация производительности в Next.js

Производительность современных приложений во многом определяется на уровне фреймворка: от способа загрузки скриптов и изображений до стратегии рендеринга. Next.js поставляется с набором встроенных инструментов — `next/link`, `next/image`, `next/font`, `next/script`, кэшированием и динамическими импортами — которые позволяют ускорить приложение без самописных решений. В статье разберём, как эти механизмы работают, когда их стоит применять и на что обращать внимание при подготовке к собеседованию.

## Содержание

1. [next/link — Оптимизация навигации](#nextlink--оптимизация-навигации)
2. [next/image — Оптимизация изображений](#nextimage--оптимизация-изображений)
3. [next/font — Оптимизация шрифтов](#nextfont--оптимизация-шрифтов)
4. [next/script — Оптимизация скриптов](#nextscript--оптимизация-скриптов)
5. [Оптимизация рендеринга](#оптимизация-рендеринга)
6. [Кэширование в Next.js](#кэширование-в-nextjs)
7. [Metadata API — SEO оптимизация](#metadata-api--seo-оптимизация)
8. [Sitemap — Карта сайта для SEO](#sitemap--карта-сайта-для-seo)
9. [Dynamic Imports — Code Splitting](#dynamic-imports--code-splitting)
10. [Оптимизация third-party библиотек](#оптимизация-third-party-библиотек)
11. [Bundle Analysis](#bundle-analysis)
12. [Edge Runtime](#edge-runtime)
13. [Дополнительные оптимизации](#дополнительные-оптимизации)
14. [Чек-лист оптимизации](#чек-лист-оптимизации)
15. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
16. [Заключение](#заключение)
17. [Полезные ссылки](#полезные-ссылки)

---

## next/link — Оптимизация навигации

### Как работает Link

Компонент `<Link>` в Next.js автоматически оптимизирует навигацию между страницами через **prefetching** — предварительную загрузку страниц в фоне.

```tsx
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Главная</Link>
      <Link href="/about">О нас</Link>
      <Link href="/blog">Блог</Link>
    </nav>
  )
}
```

### Prefetching в Next.js

Next.js использует два типа prefetching:

**1. В viewport prefetching (автоматический)**
- Когда ссылка появляется в viewport, Next.js предварительно загружает страницу
- Работает только в production build
- Загружает только код и данные для страницы

**2. Hover/Touch prefetching**
- При наведении мыши или касании на ссылку
- Происходит мгновенно, улучшает UX

### Контроль prefetching

```tsx
// Отключить prefetching
<Link href="/heavy-page" prefetch={false}>
  Тяжелая страница
</Link>

// Условный prefetching
<Link 
  href="/dashboard" 
  prefetch={user?.isAuthenticated}
>
  Dashboard
</Link>
```

### Атрибут replace

Заменяет текущую запись в истории браузера вместо добавления новой:

```tsx
// Пользователь не сможет вернуться назад к этой странице
<Link href="/login" replace>
  Войти
</Link>
```

### Scroll behavior

```tsx
// Отключить автоматический скролл вверх
<Link href="/page" scroll={false}>
  Перейти без скролла
</Link>
```

### Лучшие практики для Link

1. **Оборачивайте только `<a>` теги** — Link уже рендерит `<a>`
2. **Не оборачивайте `<button>`** — используйте `router.push()` вместо этого
3. **Используйте prefetch={false}** для тяжелых страниц, которые редко посещаются
4. **Динамические маршруты** — prefetch работает, но загружает только общий код

```tsx
// Правильно
<Link href="/about">
  <a>О нас</a>  {/* В Next.js 13+ <a> не нужен */}
</Link>

// Неправильно - двойной <a>
<Link href="/about">
  <a>
    <a>О нас</a>
  </a>
</Link>
```

## next/image — Оптимизация изображений

### Зачем нужен Image

Компонент `<Image>` автоматически оптимизирует изображения:
- **Resize** — изменение размера для разных устройств
- **Format optimization** — конвертация в WebP/AVIF
- **Lazy loading** — загрузка только при появлении в viewport
- **Prevention of layout shift** — предотвращение сдвигов макета

### Базовое использование

```tsx
import Image from 'next/image'

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="Мой аватар"
      width={500}
      height={500}
    />
  )
}
```

### Ключевые пропсы

**Обязательные:**
- `src` — путь к изображению
- `alt` — альтернативный текст (accessibility)
- `width` и `height` — размеры (для предотвращения layout shift)

**Опциональные:**
```tsx
<Image
  src="/photo.jpg"
  alt="Фото"
  width={800}
  height={600}
  quality={75}              // Качество (1-100, по умолчанию 75)
  priority={true}           // Приоритетная загрузка (для above-the-fold)
  placeholder="blur"        // Плейсхолдер при загрузке
  blurDataURL="data:..."    // Blur hash для placeholder
  sizes="(max-width: 768px) 100vw, 50vw"  // Размеры для responsive
/>
```

### Priority — критически важно

Используйте `priority` для изображений, которые видны сразу (above-the-fold):

```tsx
// Hero image - загружается сразу
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
/>

// Остальные изображения загружаются лениво
<Image
  src="/content.jpg"
  alt="Content"
  width={800}
  height={600}
/>
```

### Responsive images

```tsx
<Image
  src="/photo.jpg"
  alt="Responsive photo"
  width={1200}
  height={800}
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  style={{
    width: '100%',
    height: 'auto',
  }}
/>
```

### Fill — для контейнеров с фиксированным размером

```tsx
<div style={{ position: 'relative', width: '300px', height: '300px' }}>
  <Image
    src="/avatar.jpg"
    alt="Avatar"
    fill
    style={{
      objectFit: 'cover',
      objectPosition: 'center',
    }}
  />
</div>
```

### Placeholder blur

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

### Оптимизация внешних изображений

Для изображений с внешних доменов нужна конфигурация:

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
        port: '',
        pathname: '/account123/**',
      },
    ],
  },
}
```

```tsx
<Image
  src="https://images.example.com/photo.jpg"
  alt="External photo"
  width={800}
  height={600}
/>
```

### Лучшие практики для Image

1. **Всегда указывайте width и height** — предотвращает layout shift
2. **Используйте priority для above-the-fold изображений**
3. **Настройте sizes для responsive** — браузер выбирает оптимальный размер
4. **Используйте placeholder="blur"** для улучшения UX
5. **Оптимизируйте исходные изображения** — Image не заменяет базовую оптимизацию
6. **Используйте современные форматы** — WebP/AVIF автоматически

## next/font — Оптимизация шрифтов

### Зачем нужен Font

Компонент `next/font` автоматически оптимизирует шрифты:
- **Self-hosting** — шрифты хостятся локально, без внешних запросов
- **Zero layout shift** — шрифты загружаются до рендеринга
- **Automatic font optimization** — удаление неиспользуемых символов

### Google Fonts

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Локальные шрифты

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: [
    {
      path: '../fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={myFont.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Применение к конкретным элементам

```tsx
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export default function Heading() {
  return (
    <h1 className={roboto.className}>
      Заголовок с Roboto
    </h1>
  )
}
```

### CSS переменные

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter)' }}>
        {children}
      </body>
    </html>
  )
}
```

### Лучшие практики для Font

1. **Используйте только нужные веса** — не загружайте все варианты
2. **Указывайте subsets** — загружайте только нужные символы
3. **Используйте display: 'swap'** — показывает fallback шрифт до загрузки
4. **Предпочитайте variable fonts** — один файл для всех весов
5. **Self-hosting быстрее** — нет внешних запросов

## next/script — Оптимизация скриптов

### Стратегии загрузки

```tsx
import Script from 'next/script'

// beforeInteractive - загружается до гидратации (для критических скриптов)
<Script
  src="https://example.com/critical.js"
  strategy="beforeInteractive"
/>

// afterInteractive - загружается после гидратации (по умолчанию)
<Script
  src="https://example.com/analytics.js"
  strategy="afterInteractive"
/>

// lazyOnload - загружается когда браузер idle
<Script
  src="https://example.com/chat.js"
  strategy="lazyOnload"
/>

// worker - загружается в web worker (experimental)
<Script
  src="https://example.com/heavy.js"
  strategy="worker"
/>
```

### Inline scripts

```tsx
<Script id="inline-script">
  {`
    console.log('Inline script loaded');
  `}
</Script>
```

### Обработка событий

```tsx
<Script
  src="https://example.com/script.js"
  onReady={() => {
    console.log('Script ready');
  }}
  onLoad={() => {
    console.log('Script loaded');
  }}
  onError={(e) => {
    console.error('Script error', e);
  }}
/>
```

### Лучшие практики для Script

1. **beforeInteractive** — только для критических скриптов (analytics, security)
2. **afterInteractive** — по умолчанию для большинства скриптов
3. **lazyOnload** — для некритичных скриптов (chat widgets, social)
4. **Не используйте strategy="beforeInteractive"** вне `_app.js` или `_document.js`
5. **Группируйте скрипты** — используйте один Script для нескольких функций

## Оптимизация рендеринга

### Статическая генерация (SSG)

```tsx
// Генерируется на build time
export default function BlogPost({ post }) {
  return <article>{post.title}</article>
}

export async function getStaticProps() {
  const post = await fetchPost()
  
  return {
    props: { post },
    revalidate: 3600, // ISR - ревалидация каждый час
  }
}
```

### Server-Side Rendering (SSR)

```tsx
// Генерируется на каждый запрос
export default function Dashboard({ data }) {
  return <div>{data.value}</div>
}

export async function getServerSideProps(context) {
  const data = await fetchData(context.req)
  
  return {
    props: { data },
  }
}
```

### Streaming и Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Главная страница</h1>
      
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}

async function SlowComponent() {
  const data = await fetchSlowData()
  return <div>{data.content}</div>
}

function Loading() {
  return <div>Загрузка...</div>
}
```

### Когда что использовать

**SSG (Static Site Generation):**
- Контент меняется редко
- Блоги, документация, маркетинговые страницы
- Максимальная производительность

**SSR (Server-Side Rendering):**
- Динамический контент
- Персонализированные страницы
- Данные меняются на каждый запрос

**ISR (Incremental Static Regeneration):**
- Контент меняется периодически
- Можно обновлять без пересборки
- Лучшее из обоих миров

## Кэширование в Next.js

### Data Cache

```tsx
// Кэширование данных
export async function getStaticProps() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Кэшировать на 1 час
  })
  
  return { props: { data } }
}
```

### Router Cache

```tsx
// Отключить кэширование маршрута
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return <div>Всегда свежая страница</div>
}
```

### Full Route Cache

```tsx
// Кэшировать весь маршрут
export const dynamic = 'force-static'

export default function CachedPage() {
  return <div>Эта страница кэшируется полностью</div>
}
```

### Управление кэшем

```tsx
import { revalidatePath, revalidateTag } from 'next/cache'

export async function revalidateData() {
  'use server'
  
  // Ре-валидировать конкретный путь
  revalidatePath('/blog')
  
  // Ре-валидировать по тегу
  revalidateTag('blog-posts')
}
```

## Metadata API — SEO оптимизация

### Как работает generateMetadata

Функция `generateMetadata()` автоматически генерирует `<meta>` теги в `<head>` страницы. Вам не нужно вручную писать HTML — Next.js делает это за вас.

**Что происходит под капотом:**

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  }
}
```

Next.js автоматически превратит это в:

```html
<head>
  <title>Мой пост</title>
  <meta name="description" content="Краткое описание поста" />
  <meta property="og:title" content="Мой пост" />
  <meta property="og:image" content="https://example.com/image.jpg" />
</head>
```

### Статические metadata

Используйте когда данные известны на build time:

```tsx
export const metadata = {
  title: 'Моя страница',
  description: 'Описание страницы',
  openGraph: {
    title: 'Моя страница',
    description: 'Описание для соцсетей',
    images: ['/og-image.png'],
  },
}

export default function Page() {
  return <div>Контент</div>
}
```

### Динамические metadata

Используйте когда данные зависят от параметров маршрута:

```tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.id)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  }
}

export default function BlogPost({ params }) {
  return <div>Контент поста</div>
}
```

### Template pattern — единый формат заголовков

Используйте `template` в layout для автоматического добавления суффикса ко всем заголовкам:

```tsx
// app/layout.tsx
export const metadata = {
  title: {
    template: '%s | Мой сайт',
    default: 'Мой сайт',
  },
}

// app/about/page.tsx
export const metadata = {
  title: 'О нас', // Станет "О нас | Мой сайт"
}

// app/blog/page.tsx
export const metadata = {
  title: 'Блог', // Станет "Блог | Мой сайт"
}
```

### Где размещать metadata

**В `page.tsx`** — для конкретной страницы:

```tsx
// app/page.tsx
export const metadata = {
  title: 'Главная',
}

export default function HomePage() {
  return <div>Главная страница</div>
}
```

**В `layout.tsx`** — применяется ко всем дочерним страницам:

```tsx
// app/layout.tsx
export const metadata = {
  title: 'Мой сайт',
  description: 'Общее описание сайта',
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### Что можно возвращать

```tsx
return {
  // Базовые
  title: 'Заголовок страницы',
  description: 'Описание',
  
  // Open Graph (для соцсетей — Facebook, VK, LinkedIn)
  openGraph: {
    title: 'OG Заголовок',
    description: 'OG Описание',
    images: ['/og-image.png'],
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Заголовок',
    description: 'Twitter Описание',
    images: ['/twitter-image.png'],
  },
  
  // Robots — управление индексацией
  robots: {
    index: true,
    follow: true,
  },
  
  // Canonical URL — предотвращает дубликаты
  alternates: {
    canonical: 'https://example.com/page',
  },
  
  // Иконки
  icons: {
    icon: '/favicon.ico',
  },
}
```

### Важные моменты

1. **Вызывается на сервере** — можно делать запросы к БД, API
2. **Не имеет доступа к `request`** — используйте `headers()` из `next/headers`
3. **Наследуется** — metadata из layout применяется ко всем дочерним страницам
4. **Переопределяется** — metadata в page.tsx переопределяет layout.tsx

### Пример с контекстом запроса

```tsx
import { headers } from 'next/headers'

export async function generateMetadata({ params }) {
  const headersList = headers()
  const host = headersList.get('host')
  
  return {
    title: 'Страница',
    alternates: {
      canonical: `https://${host}/${params.slug}`,
    },
  }
}
```

## Sitemap — Карта сайта для SEO

### Что такое sitemap

Sitemap (sitemap.xml) — это XML-файл, который сообщает поисковым системам о всех страницах сайта, их приоритете и частоте обновления. Next.js предоставляет встроенный способ генерации sitemap через файл `app/sitemap.ts`.

### Базовая генерация sitemap

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://example.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```

Next.js автоматически сгенерирует файл `sitemap.xml` по адресу `https://example.com/sitemap.xml`.

### Динамический sitemap с данными из БД

Для сайтов с динамическим контентом (блог, магазин) генерируйте sitemap из реальных данных:

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

async function getAllPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function sitemap(): MetadataRoute.Sitemap {
  const posts = await getAllPosts()

  const staticRoutes = [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  const blogRoutes = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes]
}
```

### Sitemap Index — для больших сайтов

Если у вас более 50 000 URL, нужно разбить sitemap на несколько файлов и создать sitemap index:

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com/sitemap/posts.xml',
      lastModified: new Date(),
    },
    {
      url: 'https://example.com/sitemap/pages.xml',
      lastModified: new Date(),
    },
  ]
}
```

### Параметры sitemap

Каждый URL в sitemap поддерживает следующие поля:

```tsx
{
  url: string,                // Обязательный — полный URL страницы
  lastModified?: string | Date, // Когда страница последний раз обновлялась
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority?: number,          // Приоритет от 0.0 до 1.0 (по умолчанию 0.5)
  alternates?: {              // Альтернативные версии страницы
    languages?: Record<string, string>, // hreflang ссылки
  },
}
```

### Sitemap с альтернативными языками (hreflang)

Для мультиязычных сайтов добавьте hreflang ссылки:

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com/about',
      lastModified: new Date(),
      alternates: {
        languages: {
          'en-US': 'https://example.com/en/about',
          'ru-RU': 'https://example.com/ru/about',
          'de-DE': 'https://example.com/de/about',
        },
      },
    },
  ]
}
```

### Robots.txt — указание на sitemap

Добавьте ссылку на sitemap в `robots.txt`:

```tsx
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

### Лучшие практики для sitemap

1. **Генерируйте динамически** — sitemap должен отражать реальное состояние сайта
2. **Указывайте lastModified** — помогает поисковикам понимать свежесть контента
3. **Используйте changeFrequency** — `daily` для блога, `monthly` для статических страниц
4. **Приоритеты имеют смысл** — главная страница = 1.0, важные разделы = 0.8, остальные = 0.5
5. **Разбивайте на несколько файлов** — если URL больше 50 000
6. **Добавьте в robots.txt** — поисковики найдут sitemap автоматически
7. **Кэшируйте при необходимости** — для больших сайтов используйте ISR

## Dynamic Imports — Code Splitting

### Что такое Code Splitting

Code splitting — это процесс разделения вашего кода на отдельные части (чанки), которые загружаются по требованию. Вместо одного большого бандла, который загружается сразу, Next.js создает несколько меньших файлов, которые загружаются только когда они нужны.

**Как работает под капотом:**

```tsx
// Обычный импорт — весь код загружается сразу
import HeavyChart from './HeavyChart' // Добавляет ~200KB к основному бандлу

// Динамический импорт — код загружается только когда компонент используется
const HeavyChart = dynamic(() => import('./HeavyChart')) // Загружается отдельным чанком
```

Когда вы используете `dynamic()`, Webpack создает отдельный файл (чанк) для этого компонента. Этот чанк загружается только когда компонент действительно нужен пользователю.

### Базовое использование

```tsx
import dynamic from 'next/dynamic'

// Динамический импорт компонента
const HeavyComponent = dynamic(() => import('../components/HeavyComponent'))

export default function Page() {
  return (
    <div>
      <h1>Легкая часть</h1>
      <HeavyComponent />
    </div>
  )
}
```

**Что происходит:**
1. При загрузке страницы загружается только основной бандл
2. Когда React достигает `<HeavyComponent />`, браузер загружает отдельный чанк
3. Компонент рендерится

### С loading компонентом

Пока чанк загружается, можно показать loading состояние:

```tsx
const HeavyComponent = dynamic(
  () => import('../components/HeavyComponent'),
  {
    loading: () => <div>Загрузка тяжелого компонента...</div>,
  }
)
```

### Отключение SSR (ssr: false)

Некоторые компоненты работают только на клиенте (используют `window`, `document`, браузерные API). Для них нужно отключить серверный рендеринг:

```tsx
const MapComponent = dynamic(
  () => import('../components/MapComponent'),
  {
    ssr: false, // Компонент рендерится только на клиенте
    loading: () => <div>Загрузка карты...</div>,
  }
)
```

**Когда использовать `ssr: false`:**
- Компоненты используют `window`, `document`, `localStorage`
- Библиотеки которые не поддерживают SSR (Leaflet,某些 chart libraries)
- Компоненты которые зависят от размера окна браузера

### Реальные примеры

#### Карта (Leaflet/Mapbox)

```tsx
import dynamic from 'next/dynamic'

const Map = dynamic(
  () => import('../components/Map'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Загрузка карты...
      </div>
    ),
  }
)

export default function Page() {
  return (
    <div>
      <h1>Наша локация</h1>
      <Map />
    </div>
  )
}

// components/Map.tsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function Map() {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[51.505, -0.09]} />
    </MapContainer>
  )
}
```

#### Rich Text Editor

```tsx
const RichTextEditor = dynamic(
  () => import('../components/RichTextEditor'),
  { ssr: false }
)

export default function BlogEditor() {
  const [content, setContent] = useState('')
  
  return (
    <div>
      <h1>Редактор статьи</h1>
      <RichTextEditor value={content} onChange={setContent} />
    </div>
  )
}
```

#### График (Chart.js/Recharts)

```tsx
const SalesChart = dynamic(
  () => import('../components/SalesChart'),
  {
    loading: () => <div style={{ height: '300px' }}>Загрузка графика...</div>,
  }
)

export default function Dashboard() {
  return (
    <div>
      <h2>Продажи за месяц</h2>
      <SalesChart data={salesData} />
    </div>
  )
}
```

### Условная загрузка компонентов

Загружайте компоненты только когда они действительно нужны:

```tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const CommentsSection = dynamic(() => import('../components/Comments'))

export default function Article({ article }) {
  const [showComments, setShowComments] = useState(false)
  
  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
      
      {!showComments ? (
        <button onClick={() => setShowComments(true)}>
          Показать комментарии
        </button>
      ) : (
        <CommentsSection articleId={article.id} />
      )}
    </article>
  )
}
```

**Преимущества:**
- Комментарии загружаются только если пользователь хочет их читать
- Экономия трафика и ускорение начальной загрузки

### Динамический импорт библиотек

Для внешних библиотек используйте `useEffect` + динамический импорт:

```tsx
'use client'

import { useEffect, useState } from 'react'

export default function Chart() {
  const [Chart, setChart] = useState(null)
  
  useEffect(() => {
    // Загружаем библиотеку только на клиенте
    import('chart.js/auto').then((mod) => {
      setChart(() => mod.Chart)
    })
  }, [])
  
  useEffect(() => {
    if (!Chart) return
    
    const ctx = document.getElementById('myChart')
    const chart = new Chart(ctx, {
      type: 'bar',
      data: { /* ... */ }
    })
    
    return () => chart.destroy()
  }, [Chart])
  
  if (!Chart) return <div>Загрузка библиотеки графиков...</div>
  
  return <canvas id="myChart" />
}
```

### Загрузка по скроллу (Intersection Observer)

Загружайте компоненты когда они появляются в viewport:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const HeavyGallery = dynamic(() => import('../components/Gallery'))

export default function Page() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div>
      <h1>Наша галерея</h1>
      <p>Прокрутите вниз чтобы увидеть галерею</p>
      
      <div ref={ref} style={{ minHeight: '500px' }}>
        {isVisible ? (
          <HeavyGallery />
        ) : (
          <div>Галерея появится здесь...</div>
        )}
      </div>
    </div>
  )
}
```

### Сравнение с обычным импортом

```tsx
// Обычный импорт
import HeavyComponent from './HeavyComponent'

export default function Page() {
  return <HeavyComponent />
}

// Размер бандла: ~500KB (включая HeavyComponent)
// Время загрузки: сразу при открытии страницы
```

```tsx
// Динамический импорт
const HeavyComponent = dynamic(() => import('./HeavyComponent'))

export default function Page() {
  return <HeavyComponent />
}

// Размер бандла: ~300KB (без HeavyComponent)
// Размер отдельного чанка: ~200KB
// Время загрузки: HeavyComponent загружается только когда нужен
```

### Когда использовать Dynamic Imports

**Используйте когда:**
- Компонент большой (>50KB)
- Компонент используется редко (модальные окна, сложные формы)
- Компонент не работает с SSR
- Пользователь может не увидеть компонент сразу
- Библиотека работает только на клиенте

**НЕ используйте когда:**
- Компонент маленький (<10KB)
- Компонент критичен для первого рендера (header, navigation)
- Компонент всегда виден на странице
- Вы хотите SEO для этого контента

### Лучшие практики

1. **Не динамизируйте всё** — мелкие компоненты лучше импортировать статически
2. **Всегда добавляйте loading состояние** — улучшает UX
3. **Используйте `ssr: false` только когда необходимо** — теряется SEO
4. **Тестируйте с отключенным JavaScript** — убедитесь что базовый контент доступен
5. **Анализируйте bundle** — используйте `@next/bundle-analyzer` для поиска тяжелых компонентов
6. **Группируйте связанные компоненты** — если несколько компонентов всегда используются вместе, импортируйте их в одном файле

### Пример с группировкой

```tsx
// components/Editor/index.tsx
import dynamic from 'next/dynamic'

export const RichTextEditor = dynamic(() => import('./RichTextEditor'))
export const MarkdownEditor = dynamic(() => import('./MarkdownEditor'))
export const CodeEditor = dynamic(() => import('./CodeEditor'))

// page.tsx
import { RichTextEditor, MarkdownEditor } from '../components/Editor'

export default function Page() {
  return (
    <div>
      <RichTextEditor />
      <MarkdownEditor />
    </div>
  )
}
```

## Оптимизация third-party библиотек

### Избегайте больших зависимостей

```tsx
// Плохо - загружает всю библиотеку
import { BigNumber } from 'bignumber.js'

// Хорошо - загружает только нужное
import BigNumber from 'bignumber.js/lib/bignumber'
```

### Используйте tree-shaking

```tsx
// Плохо
import _ from 'lodash'
_.debounce(fn, 300)

// Хорошо
import { debounce } from 'lodash-es'
debounce(fn, 300)
```

### Conditionally load libraries

```tsx
'use client'

import { useEffect, useState } from 'react'

export function RichTextEditor() {
  const [Editor, setEditor] = useState(null)
  
  useEffect(() => {
    // Загружаем только когда компонент монтируется
    import('react-quill').then((mod) => {
      setEditor(() => mod.default)
    })
  }, [])
  
  if (!Editor) return <textarea />
  
  return <Editor />
}
```

## Bundle Analysis

### Анализ бандла

```bash
# Установите анализатор
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ваши настройки
})

# Запустите анализ
ANALYZE=true npm run build
```

### Оптимизация на основе анализа

1. **Identify large bundles** — найдите большие модули
2. **Split code** — разделите на чанки
3. **Remove unused code** — удалите неиспользуемые зависимости
4. **Use lighter alternatives** — замените тяжелые библиотеки

## Edge Runtime

### Использование Edge Runtime

```tsx
export const runtime = 'edge'

export default function EdgePage() {
  return <div>Эта страница выполняется на Edge</div>
}
```

### Когда использовать Edge

**Подходит:**
- Низкая задержка (latency)
- Геолокация
- A/B тестирование
- Простые страницы

**Не подходит:**
- Тяжелые вычисления
- Node.js API
- Большие зависимости

## Дополнительные оптимизации

### Оптимизация API Routes

```tsx
// Используйте кэширование
export async function GET(request) {
  const data = await fetchData()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600',
    },
  })
}
```

### Middleware оптимизация

```tsx
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Легкая логика - быстрое выполнение
  const country = request.geo?.country || 'US'
  
  const response = NextResponse.next()
  response.headers.set('x-country', country)
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
}
```

### Оптимизация Client Components

```tsx
'use client'

import { memo, useState } from 'react'

// Мемоизация компонента
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* тяжелый рендеринг */}</div>
})

export default function Page() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveComponent data={data} />
    </div>
  )
}
```

## Чек-лист оптимизации

### Производительность

- [ ] Использовать `<Link>` вместо `<a>` для внутренней навигации
- [ ] Настроить `prefetch` для критических ссылок
- [ ] Использовать `<Image>` для всех изображений
- [ ] Добавить `priority` для above-the-fold изображений
- [ ] Оптимизировать шрифты через `next/font`
- [ ] Использовать правильные стратегии для `<Script>`
- [ ] Включить Streaming и Suspense
- [ ] Настроить ISR для динамического контента

### Bundle Size

- [ ] Проанализировать bundle с `@next/bundle-analyzer`
- [ ] Использовать dynamic imports для тяжелых компонентов
- [ ] Удалить неиспользуемые зависимости
- [ ] Использовать tree-shaking совместимые импорты
- [ ] Загружать библиотеки условно

### Кэширование

- [ ] Настроить Data Cache для API запросов
- [ ] Использовать Router Cache appropriately
- [ ] Настроить Full Route Cache для статических страниц
- [ ] Использовать `revalidatePath` и `revalidateTag`

### SEO

- [ ] Настроить Metadata API для всех страниц
- [ ] Добавить Open Graph теги
- [ ] Оптимизировать title и description
- [ ] Создать sitemap.xml через app/sitemap.ts
- [ ] Добавить ссылку на sitemap в robots.txt
- [ ] Использовать семантический HTML

### Edge Cases

- [ ] Тестировать на медленных сетях
- [ ] Проверять Lighthouse score
- [ ] Мониторить Core Web Vitals
- [ ] Оптимизировать для мобильных устройств

---

## Ключевые тезисы для интервью

- `next/link` автоматически prefetchит страницы при попадании в viewport или при наведении, но для тяжёлых страниц prefetch можно отключить.
- `next/image` оптимизирует размер, формат и порядок загрузки изображений, а явные `width`/`height` предотвращают layout shift.
- `priority` в `next/image` используется для изображений above-the-fold, остальные загружаются лениво.
- `next/font` самостоятельно хостит шрифты, убирает внешние запросы и снижает layout shift за счёт правильного `display`.
- `next/script` предлагает стратегии `beforeInteractive`, `afterInteractive`, `lazyOnload` и `worker`, позволяя контролировать порядок загрузки скриптов.
- SSG подходит для редко меняющегося контента, SSR — для персонализированных данных, ISR совмещает преимущества обоих подходов.
- Next.js использует несколько уровней кэша: Data Cache, Router Cache и Full Route Cache; валидировать их можно через `revalidatePath` и `revalidateTag`.
- Metadata API позволяет декларативно задавать `<meta>`-теги, Open Graph, Twitter Card и canonical URL на уровне страницы и layout.
- Sitemap и robots.txt можно генерировать через `app/sitemap.ts` и `app/robots.ts`, что упрощает SEO-настройку.
- `dynamic()` откладывает загрузку компонентов и библиотек, а `ssr: false` используется только для компонентов, завязанных на браузерные API.
- Tree-shaking, условная загрузка библиотек и анализ бандла помогают уменьшить размер клиентского JavaScript.
- Edge Runtime ускоряет ответ за счёт близости к пользователю, но не подходит для тяжёлых вычислений и Node.js API.

## Заключение

Next.js предоставляет мощные инструменты оптимизации из коробки. Ключ к максимальной производительности — понимание того, как работают эти инструменты и когда их применять. Используйте чек-лист выше для аудита вашего приложения и постепенно внедряйте оптимизации.

Помните: **измеряйте перед оптимизацией**. Используйте Lighthouse, Web Vitals и реальные метрики пользователей для определения узких мест. Не оптимизируйте то, что не измеряли.

## Полезные ссылки

- [Next.js — Optimizing](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Next.js Link](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Font](https://nextjs.org/docs/app/api-reference/components/font)
- [Next.js Script](https://nextjs.org/docs/app/api-reference/components/script)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Web Vitals](https://web.dev/vitals/)
