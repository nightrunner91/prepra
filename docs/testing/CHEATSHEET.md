# Шпаргалка: Тестирование

## Модели и принципы

- **Пирамида vs Trophy:** unit → integration → E2E vs static → unit → integration (основа) → E2E
- **Выбор уровня:** уверенность vs стоимость, risk-based (цена ошибки), shift-left / shift-right
- **FIRST:** Fast, Isolated, Repeatable, Self-validating, Timely · AAA (Arrange → Act → Assert)
- **TDD:** Red → Green → Refactor · избыточен для прототипов
- **Принцип:** поведение vs реализация · smoke, regression, sanity, acceptance

## Vitest и моки

- **Vitest vs Jest:** конфиг Vite, нативный ESM и TS, Jest-совместимый API
- **Test doubles:** dummy, fake (in-memory), stub (ответ), spy (наблюдение), mock (замена)
- **vi.fn / spyOn / mock:** с нуля / обёртка метода / весь модуль (hoisting → `vi.hoisted`)
- **Очистка:** clear (история) → reset (+ реализация) → restore (оригинал), `afterEach`
- **Что мокировать:** границы (сеть, время, storage, браузерные API) vs внутренние модули
- **MSW:** перехват на уровне сети, handlers + `server.use()`, `onUnhandledRequest`
- **Детерминизм:** `vi.useFakeTimers`, `setSystemTime`, фабрики данных, `it.each`

## Компоненты: React и Vue

- **Queries:** getByRole → getByLabelText → getByText → getByTestId (последний резерв)
- **getBy / queryBy / findBy:** есть / отсутствие / асинхронное появление
- **userEvent vs fireEvent:** реальная цепочка событий vs одиночное событие
- **Async и хуки:** findBy, `waitFor`, MSW · `renderHook`, `act`, кастомный render (провайдеры)
- **Vue Test Utils:** `mount` + `global` (plugins, provide, stubs), `trigger`, `setValue`
- **Vue-проверки:** `emitted()`, v-model (`update:modelValue`), `flushPromises` · не `wrapper.vm`

## Next.js и Nuxt

- **Принцип:** бизнес-логика, а не фреймворк · серверный код → unit-функции
- **Next.js:** Server Component (async → JSX), Server Action, Route Handler (вызов GET / POST)
- **Моки Next:** `next/navigation`, `next/headers` (cookies), `revalidatePath` · в setup-файле
- **Nuxt:** `environment: 'nuxt'`, `mountSuspended` (useFetch, useAsyncData), `mockNuxtImport`
- **Nuxt server:** `registerEndpoint` (реализм) vs прямой вызов h3-обработчика (скорость)

## E2E и визуальные тесты

- **Playwright:** auto-waiting, ленивые локаторы, retry-assertions · `waitForResponse` vs sleep
- **Архитектура E2E:** POM, `storageState` + setup project, данные через API, а не UI
- **Скорость:** `fullyParallel`, шардинг, `retries` только в CI, `page.route`, Trace Viewer
- **Snapshot vs визуальная регрессия:** DOM-структура vs пиксели (`toHaveScreenshot`)
- **Стабильные скриншоты:** маски динамики, без анимаций, шрифты, baseline в репо
- **Инструменты:** Storybook (изоляция), Chromatic (ревью), Percy · viewports, темы

## Ловушки и метрики

- **Flaky:** время, гонки, селекторы, shared state, сеть → чинить причину, не retries
- **Антипаттерны:** CSS-селекторы, зависимые тесты, snapshot всего, избыточные моки, без assert
- **False confidence:** слабые asserts, только happy path · негативные сценарии
- **Coverage:** statements, branches (строже), functions, lines · метрика, не цель
- **Метрики:** flaky rate, время прогона, escape rate, MTTR

## CI и production

- **GitLab pipeline:** lint → typecheck → unit → build → e2e · stages vs jobs (параллельно)
- **cache vs artifacts:** между pipeline (node_modules) vs между job (сборка, отчёты)
- **Ускорение CI:** `needs` (DAG), `rules`, `parallel: matrix`, Docker-образ Playwright, JUnit
- **Sentry:** init первым импортом, ErrorBoundary, breadcrumbs, release, source maps (не публично)
- **Sentry-ловушки:** `tracesSampleRate` ≤ 0.1, `beforeSend` (PII), AdBlock → tunnel
