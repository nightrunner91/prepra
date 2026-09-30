# Тестирование

Раздел посвящён функциональному тестированию фронтенда: от базовых принципов и тестового раннера до компонентных, E2E и визуальных тестов.

## Начни с базы

Если ты только начинаешь знакомиться с тестами — иди по порядку:

1. **[Основы тестирования](./testing-fundamentals.md)** — пирамида, Testing Trophy, FIRST, AAA, TDD, code coverage.
2. **[Vitest](./testing-vitest.md)** — настройка и возможности тестового раннера.
3. **[Мокирование](./testing-mocking.md)** — `vi.fn`, `vi.spyOn`, `vi.mock`, MSW.

## Углубись в детали

После базы переходи к глубоким темам:

- **[Тестирование React-компонентов](./react-testing-components.md)** — React Testing Library, хуки, события, провайдеры.
- **[Тестирование в Next.js](./nextjs-testing.md)** — Server Components, Server Actions, Route Handlers.
- **[Тестирование Vue-компонентов](./vue-testing-components.md)** — Vue Test Utils, composables, события, Pinia.
- **[Тестирование в Nuxt 3](./nuxt-testing.md)** — тесты компонентов, composables и серверных роутов.
- **[Продвинутая стратегия тестирования](./testing-strategy-deep-dive.md)** — модели, risk-based testing, метрики, архитектура тестов.
- **[Подводные камни и антипаттерны](./testing-pitfalls.md)** — flaky-тесты, shared state, моки, false confidence.
- **[E2E с Playwright](./testing-e2e-playwright.md)** — локаторы, действия, ожидания, моки, POM, CI и оптимизация прогонов.
- **[Визуальное тестирование](./testing-visual-regression.md)** — Chromatic, Percy, скриншоты.
- **[GitLab CI/CD для тестов](./gitlab-ci-cd.md)** — pipeline, cache, artifacts, шардинг, JUnit, Docker.

## Не будет лишним

- **[Sentry](./sentry-guide.md)** — мониторинг ошибок в production.