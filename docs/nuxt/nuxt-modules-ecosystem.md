---
title: "Модули и экосистема Nuxt 3"
section: nuxt
description: "Официальные и сторонние модули Nuxt 3, их подключение, создание собственных через defineNuxtModule, инъекция зависимостей и сравнение с Layers."
order: 11
tags: ["nuxt", "nuxt3", "modules", "ecosystem", "nuxt-kit", "defineNuxtModule", "plugins"]
questions:
  - "Что такое Nuxt модуль и чем он отличается от плагина или layer"
  - "Как подключить модуль в nuxt.config.ts"
  - "Какие официальные модули предоставляет команда Nuxt"
  - "Как найти и выбрать сторонний модуль для решения задачи"
  - "Как создать собственный Nuxt модуль через defineNuxtModule"
  - "Что такое meta, configKey и defaults в определении модуля"
  - "Как модуль может добавлять плагины, компоненты и composables"
  - "Чем модули отличаются от Nuxt Layers"
  - "Какие антипаттерны стоит избегать при работе с модулями"
  - "Как протестировать собственный Nuxt модуль"
---

# Модули и экосистема Nuxt 3

Nuxt 3 спроектирован как расширяемый фреймворк, и его главный механизм расширения — **модули**. Модуль позволяет интегрировать сторонние сервисы, добавлять компоненты, composables, плагины и серверные роуты без ручной правки конфигурации проекта. Более 320 модулей доступны в каталоге Nuxt, и понимание их устройства критически важно для работы с фреймворком.

В этой статье разберём, как устроены модули, какие официальные решения предоставляет экосистема, как создавать собственные модули и как выбирать сторонние интеграции.

## Содержание

1. [Что такое Nuxt модули](#что-такое-nuxt-модули)
2. [Подключение модулей](#подключение-модулей)
3. [Официальные модули](#официальные-модули)
4. [Поиск и выбор сторонних модулей](#поиск-и-выбор-сторонних-модулей)
5. [Создание собственного модуля](#создание-собственного-модуля)
6. [Структура модуля](#структура-модуля)
7. [Инъекция зависимостей](#инъекция-зависимостей)
8. [Модули vs Layers](#модули-vs-layers)
9. [Лучшие практики и антипаттерны](#лучшие-практики-и-антипаттерны)
10. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
11. [Заключение](#заключение)
12. [Полезные ссылки](#полезные-ссылки)

---

## Что такое Nuxt модули

Nuxt модуль — это функция, которая выполняется при запуске `nuxt dev` или сборке `nuxt build`. Модули позволяют инкапсулировать повторно используемую логику, интегрировать сторонние сервисы и расширять возможности фреймворка без лишнего boilerplate.

Основные отличия модуля от плагина или layer:

- **Модуль** — выполняется на этапе сборки, управляет конфигурацией Nuxt, добавляет плагины, компоненты, composables и серверные роуты.
- **Плагин** — выполняется на клиенте или сервере при инициализации приложения (во время выполнения).
- **Layer** — структура, идентичная Nuxt-приложению, подключается через `extends` и переиспользует файлы.

Модули используются для интеграции с базами данных, аутентификации, UI-библиотеками, аналитикой, CDN для изображений и другими сервисами, требующими изменения конфигурации фреймворка.

---

## Подключение модулей

Модули подключаются через массив `modules` в `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
  ],
})
```

### Передача опций

Опции модуля передаются через отдельный ключ, указанный в `configKey`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],

  image: {
    quality: 80,
    format: ['webp', 'jpg'],
  },
})
```

### Условное подключение

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    ...(process.env.ANALYTICS === 'true' ? ['@nuxtjs/google-analytics'] : []),
  ],
})
```

### Отключение модуля

Модуль можно отключить, установив значение его `configKey` в `false`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],
  image: false, // отключает модуль
})
```

---

## Официальные модули

Официальные модули имеют префикс `@nuxt/` и поддерживаются командой Nuxt. Вот ключевые из них:

### @nuxt/image

Оптимизация изображений: lazy-loading, responsive-размеры,現代フォーマты (WebP, AVIF), интеграция с CDN-провайдерами.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],
  image: {
    quality: 80,
    screens: { xs: 320, sm: 640, lg: 1024 },
  },
})
```

```vue
<template>
  <NuxtImg src="/hero.jpg" width="1200" height="600" format="webp" />
</template>
```

### @nuxt/content

Файловый CMS для Markdown, YAML, JSON и CSV. Создаёт запросы через SQLite, поддерживает MDC-синтаксис для встраивания Vue-компонентов в Markdown.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
})
```

```vue
<script setup>
const { data: posts } = await useAsyncData('posts', () =>
  queryContent('/blog').sort({ date: -1 }).find()
)
</script>
```

### @nuxtjs/tailwindcss

Интеграция Tailwind CSS с zero-config настройкой, авто-обнаружением конфигурации и поддержкой.dark-mode.

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
})
```

### Другие официальные модули

| Модуль | Назначение |
|---|---|
| `@nuxt/fonts` | Управление веб-шрифтами с оптимизацией загрузки |
| `@nuxt/icon` | 200 000+ иконок из Iconify |
| `@nuxt/scripts` | Безопасная интеграция сторонних скриптов |
| `@nuxt/ui` | UI-библиотека на базе Reka UI и Tailwind CSS |
| `@nuxt/eslint` | Интеграция ESLint с авто-конфигурацией |
| `@nuxt/test-utils` | Утилиты для тестирования Nuxt-приложений |
| `@nuxt/devtools` | Визуальные инструменты для отладки |
| `@nuxt/hints` | Подсказки по производительности и безопасности |

---

## Поиск и выбор сторонних модулей

### Каталог Nuxt

Основной каталог — [nuxt.com/modules](https://nuxt.com/modules). Модули разбиты по категориям: UI, CMS, базы данных, аутентификация, аналитика и другие. Для каждого модуля указаны статистика загрузок, совместимость с версиями Nuxt и автор.

### Критерии выбора

При выборе стороннего модуля оценивайте:

1. **Совместимость** — поддерживает ли модуль Nuxt 3 (поле `compatibility`).
2. **Активность** — дата последнего обновления, количество закрытых issues.
3. **Зависимости** — количество прямых зависимостей, размер бандла.
4. **Документация** — наличие README, примеров использования, сайта документации.
5. **Типизация** — поддержка TypeScript, наличие типов.
6. **Тесты** — наличие unit- и integration-тестов.

### Префиксы

- `@nuxtjs/` — проверенные community-модули, перешедшие в nuxt-modules.
- `nuxt-` — сторонние модули, доступные через npm.
- `@nuxt/` — официальные модули, поддерживаемые командой Nuxt.

---

## Создание собственного модуля

### Стартовый шаблон

Самый быстрый способ начать — использовать官方 шаблон:

```bash
npx nuxi init --template module my-module
```

### Определение модуля

Модуль определяется через `defineNuxtModule` из `@nuxt/kit`:

```ts
// src/module.ts
import { defineNuxtModule, createResolver, addImportsDir, addComponentsDir } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    enabled: true,
    apiKey: '',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (!options.enabled) return

    // Регистрация плагина
    nuxt.options.plugins.push(resolver.resolve('./runtime/plugin'))

    // Регистрация компонентов
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: 'My',
    })

    // Регистрация composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Расширение конфигурации
    nuxt.options.runtimeConfig.public.myModule = {
      apiKey: options.apiKey,
    }
  },
})
```

### Публикация на npm

```bash
npm run prepack   # сборка модуля
npm publish       # публикация
```

После публикации модуль доступен для подключения через `modules` в `nuxt.config.ts` любого Nuxt-проекта.

---

## Структура модуля

Типичная структура модуля:

```
my-module/
├── src/
│   ├── module.ts            # Определение модуля
│   └── runtime/
│       ├── components/      # Компоненты
│       ├── composables/     # Composables
│       ├── plugins/         # Плагины
│       ├── server/          # Серверные роуты
│       └── middleware/       # Middleware
├── package.json
├── nuxt.config.ts           # Конфигурация для dev-режима
└── README.md
```

### Ключевые утилиты Nuxt Kit

| Утилита | Назначение |
|---|---|
| `defineNuxtModule` | Определение модуля с meta, defaults, hooks |
| `createResolver` | Создание resolver для корректных путей |
| `addComponentsDir` | Регистрация директории с компонентами |
| `addImportsDir` | Регистрация composables для auto-import |
| `addServerHandler` | Добавление серверных обработчиков |
| `extendPages` | Расширение страниц проекта |
| `extendViteConfig` | Расширение конфигурации Vite |
| `addComponent` | Регистрация отдельного компонента |

---

## Инъекция зависимостей

Модули могут добавлять в проект:

### Плагины

```ts
nuxt.hook('imports:dirs', (dirs) => {
  dirs.push(resolver.resolve('./runtime/composables'))
})
```

### Компоненты

```ts
addComponentsDir({
  path: resolver.resolve('./runtime/components'),
  prefix: 'My',
  pathPrefix: false,
})
```

### Composables

```ts
addImports([
  { name: 'useMyComposable', from: resolver.resolve('./runtime/composables/useMyComposable') },
])
```

### Серверные роуты

```ts
addServerHandler({
  route: '/api/my-endpoint',
  handler: resolver.resolve('./runtime/server/api/my-endpoint'),
})
```

### Middleware

```ts
nuxt.hook('router:resolve', (router) => {
  router.addRoute({
    path: '/my-route',
    component: resolver.resolve('./runtime/pages/MyPage.vue'),
  })
})
```

---

## Модули vs Layers

| Критерий | Модули | Layers |
|---|---|---|
| Механизм | Программатический API через hooks | Файловая структура, идентичная Nuxt-приложению |
| Подключение | `modules` в `nuxt.config` | `extends` в `nuxt.config` |
| Назначение | Расширение возможностей Nuxt (интеграции, хуки, генерация) | Переиспользование файлов (компоненты, страницы, стили) |
| Сложность создания | Средняя–высокая | Низкая |
| Тестирование | Требует `@nuxt/test-utils` | Тестируется как обычное приложение |
| Переопределение | Через API модуля | Через приоритет наследования |

**Правило**: если нужно добавить интеграцию с внешним сервисом или расширить конфигурацию — модуль. Если нужно переиспользовать компоненты, страницы и стили — layer.

---

## Лучшие практики и антипаттерны

### ✅ Делайте

- Используйте `defineNuxtModule` вместо низкоуровневого определения функции.
- Указывайте `meta.name`, `meta.configKey` и `meta.compatibility` для каждого модуля.
- Задавайте `defaults` для опций модуля, чтобы пользователю не приходилось настраивать всё вручную.
- Используйте `createResolver` для корректного резолвинга путей к файлам модуля.
- Тестируйте модуль изолированно через `npm run dev:prepare` и `npm run dev`.
- Публикуйте модуль в `nuxt-modules` для получения поддомена и помощи сообщества.

### ❌ Не делайте

- Не храните модуль в корне проекта — выносите в отдельный npm-пакет.
- Не используйте глобальные мутации `nuxt.options` без веской причины.
- Не игнорируйте `compatibility.nuxt` — это предотвратит ошибки при обновлении Nuxt.
- Не дублируйте логику, которую уже решает существующий официальный модуль.
- Не создавайте модули для простых вещей, которые решаются через `app.config` или composables.
- Не полагайтесь на порядок выполнения модулей — используйте hooks для зависимости между модулями.

---

## Ключевые тезисы для интервью

- **Nuxt модуль** — функция, выполняющаяся при сборке, расширяющая конфигурацию и добавляющая зависимости в проект.
- Модули подключаются через массив `modules` в `nuxt.config.ts`, опции передаются через отдельный ключ (`configKey`).
- **Официальные модули** (`@nuxt/`) поддерживаются командой Nuxt: `@nuxt/image`, `@nuxt/content`, `@nuxt/ui`, `@nuxt/fonts` и другие.
- Сторонние модули ищутся в каталоге [nuxt.com/modules](https://nuxt.com/modules) по категориям, совместимости и активности.
- Создание модуля начинается с `npx nuxi init --template module`, определение — через `defineNuxtModule` из `@nuxt/kit`.
- `meta` содержит имя, `configKey` и `compatibility`; `defaults` задаёт значения опций по умолчанию; `setup` — логика инициализации.
- Модули добавляют компоненты через `addComponentsDir`, composables через `addImports`, плагины через `nuxt.options.plugins`.
- **Модули vs Layers**: модули — для программного расширения Nuxt, layers — для переиспользования файлов и структуры.
- Используйте `createResolver` для корректных путей, `moduleDependencies` для声明 зависимостей между модулями.
- Публикация в `nuxt-modules` даёт поддомен, поддержку сообщества и лучшую discoverability.

---

## Заключение

Модули — основа расширяемости Nuxt 3. Понимание их устройства позволяет не только эффективно использовать существующую экосистему из 320+ решений, но и создавать собственные интеграции. Начните с официальных модулей для типичных задач (изображения, контент, UI), при необходимости изучите каталог community-модулей, а для специфичных требований — создайте свой модуль через `defineNuxtModule` и опубликуйте в npm.

---

## Полезные ссылки

- [Nuxt Modules Catalog](https://nuxt.com/modules) — официальный каталог модулей
- [Module Author Guide](https://nuxt.com/docs/guide/going-further/modules) — руководство по созданию модулей
- [Nuxt Kit: Modules API](https://nuxt.com/docs/api/kit/modules) — программный API для модулей
- [Nuxt Modules GitHub](https://github.com/nuxt/modules) — репозиторий сообщества модулей
- [@nuxt/image](https://image.nuxt.com) — документация модуля изображений
- [@nuxt/content](https://content.nuxt.com) — документация файлового CMS
- [@nuxtjs/tailwindcss](https://tailwindcss.nuxtjs.org) — документация Tailwind интеграции
