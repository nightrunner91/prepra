# Шпаргалка: Архитектура

## Принципы кода

- **DRY / KISS / YAGNI:** один источник истины, начинать с простого, без «на всякий случай»
- **Конфликт:** абстракция ради DRY → нарушение KISS, premature abstraction → нарушение YAGNI
- **Дублирование vs абстракция:** 3 похожих куска дешевле функции с 15 параметрами
- **Признаки нарушения:** фикс в нескольких файлах, код сложнее задачи, мёртвые ветки
- **SOLID во фронте:** S → hooks / composables, O → композиция / слоты, L и I → типы, D → инъекция
- **Меры SOLID:** S и O почти всегда, I и D ситуативно · не для прототипа и MVP

## MVC, MVP, MVVM

- **MVC:** Model, View, Controller (посредник) · Massive View Controller · Express, Rails
- **MVP:** Presenter, пассивная View без доступа к Model · много boilerplate
- **MVVM:** ViewModel, двустороннее связывание · скрытые binding · Vue, Knockout, Angular
- **React:** компонент = state + JSX + handlers, однонаправленный поток · hooks как ViewModel
- **Vue и стор:** `ref` (ViewModel), шаблон, `v-model` · Redux / Pinia как внешний Model

## GoF во фронтенде

- **Абстрактная фабрика:** Context + фабрики (темы, A/B) · provide/inject + `<component :is>`
- **Декоратор:** HOC, обёртки, hooks · директивы (`v-focus`), composables
- **Синглтон:** антипаттерн (тесты, SSR-утечка между запросами) · ES-модуль = синглтон
- **Observer:** реактивность (`useState`, `ref`, `watch`), `useSyncExternalStore`, EventBus

## Паттерны компонентов

- **Композиция:** children / слоты (дефолтный, именованные `#header`), композиция vs наследование
- **Compound Components:** Context / provide-inject (Symbol-ключ), контроль над DOM · Radix
- **Переиспользование логики:** custom hooks / composables вытеснили render props / mixins
- **Render props / scoped slots:** инверсия контроля над рендерингом (`#item="{ item }"`)
- **Container / Presentational:** Server Components / `useAsyncData` → данные, клиент → UI
- **Control Props:** controlled vs uncontrolled (`value` / `defaultValue`), `defineModel`

## Структура проекта

- **Подходы:** type-based → feature-based → domain (Screaming Architecture) → FSD
- **FSD:** app → pages → widgets → features → entities → shared (импорт только вниз)
- **Файловый роутинг:** Next.js (route groups, parallel routes) · Nuxt (`pages/`, layouts, Nitro)
- **Практики:** colocation vs `__tests__/`, алиасы, barrel `index.ts` (ломает tree shaking)
- **Антипаттерны:** God Component, prop drilling, циклические зависимости, импорт внутренностей

## Монорепозитории

- **Монорепо vs полирепо:** независимые пакеты + общие зависимости, один git
- **Workspaces:** npm / pnpm / Yarn, симлинки, `workspace:*` · pnpm против фантомных зависимостей
- **Turborepo vs Nx:** граф задач, remote cache · Nx (генераторы, плагины, distributed)
- **CI:** affected-команды · зависимости однонаправленные (`web → ui → utils`), без циклов
- **Когда не нужно:** один проект, маленькая команда

## Микрофронтенды и BFF

- **Микрофронтенды:** независимый деплой, команда на домен · вертикальное vs горизонтальное
- **Композиция:** build-time (переиспользование) vs runtime (автономия), сервер, маршруты
- **Module Federation:** host, remote, `remoteEntry.js` · `shared` + singleton (одна копия React)
- **Изоляция:** Web Components (Shadow DOM, CSS vars проникают), iframe (ломает URL / history)
- **Ловушки:** version skew (semver, `strictVersion`) · связь через URL, CustomEvent, не общий стор
- **BFF:** сервис под клиент, агрегация, over- / under-fetching, Anti-Corruption Layer
- **BFF vs API Gateway:** client-specific трансформация vs единая точка входа (routing, auth)
- **BFF в Next.js:** Server Components (встроенный BFF), Route Handlers, Server Actions
