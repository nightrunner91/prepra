# Тестирование

Раздел посвящён функциональному тестированию фронтенда: от базовых принципов и тестового раннера до компонентных, E2E и визуальных тестов.

## Начни с базы

Если ты только начинаешь знакомиться с тестами — иди по порядку:

1. **[Основы тестирования](./fundamentals.md)** — пирамида, Testing Trophy, FIRST, AAA, TDD, code coverage.
2. **[Стратегия тестирования](./strategy-deep-dive.md)** — модели, risk-based testing, метрики, архитектура тестов.
3. **[Vitest](./vitest.md)** — настройка и возможности тестового раннера.
4. **[Мокирование](./mocking.md)** — `vi.fn`, `vi.spyOn`, `vi.mock`, MSW.

## Углубись в детали

После базы переходи к глубоким темам:

- **[Тестирование React](./react-testing-components.md)** — React Testing Library, хуки, события, провайдеры.
- **[Тестирование Next.js](./nextjs-testing.md)** — Server Components, Server Actions, Route Handlers.
- **[Тестирование Vue](./vue-testing-components.md)** — Vue Test Utils, composables, события, Pinia.
- **[Тестирование Nuxt](./nuxt-testing.md)** — тесты компонентов, composables и серверных роутов.
- **[Подводные камни и антипаттерны](./pitfalls.md)** — flaky-тесты, shared state, моки, false confidence.
- **[E2E с Playwright](./e2e-playwright.md)** — локаторы, действия, ожидания, моки, POM, CI и оптимизация прогонов.
- **[Визуальное тестирование](./visual-regression.md)** — Chromatic, Percy, скриншоты.
- **[GitLab CI/CD для тестов](./gitlab-ci-cd.md)** — pipeline, cache, artifacts, шардинг, JUnit, Docker.

## Не будет лишним

- **[Sentry](./sentry-guide.md)** — мониторинг ошибок в production.