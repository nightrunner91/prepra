# Тестирование

Раздел посвящён функциональному тестированию фронтенда: от базовых принципов и тестового раннера до компонентных, E2E и визуальных тестов.

## Начни с базы

Если ты только начинаешь знакомиться с тестами — иди по порядку:

1. **[Основы тестирования](./testing-fundamentals.md)** — пирамида, Testing Trophy, FIRST, AAA, TDD, code coverage.
2. **[Vitest](./testing-vitest.md)** — настройка и возможности тестового раннера.
3. **[Мокирование](./testing-mocking.md)** — `vi.fn`, `vi.spyOn`, `vi.mock`, MSW.
4. **[Тестирование React-компонентов](../react/testing-components.md)** — React Testing Library, хуки, события.

## Углубись в детали

После базы переходи к глубоким темам:

- **[Продвинутая стратегия тестирования](./testing-strategy-deep-dive.md)** — модели, risk-based testing, метрики, архитектура тестов.
- **[Подводные камни и антипаттерны](./testing-pitfalls.md)** — flaky-тесты, shared state, моки, false confidence.
- **[E2E с Playwright](./testing-e2e-playwright.md)** — локаторы, действия, ожидания, моки, POM, CI и оптимизация прогонов.
- **[Визуальное тестирование](./testing-visual-regression.md)** — Chromatic, Percy, скриншоты.

## Тестирование по фреймворкам

Фреймворк-специфичные статьи живут в своих разделах:

- **[React-компоненты](../react/testing-components.md)**
- **[Vue-компоненты](../vue/testing-components.md)**
- **[Next.js](../nextjs/testing.md)** — Server Components, Server Actions, Route Handlers.
- **[Nuxt](../nuxt/testing.md)** — компоненты, composables, серверные роуты.

## Не будет лишним

- **[Sentry](./sentry-guide.md)** — мониторинг ошибок в production.

## Смежные разделы

- **[GitLab CI/CD для тестов](../build-and-deployment/gitlab-frontend-testing.md)** — pipeline, cache, artifacts, шардинг, JUnit, Docker.
- **[Тестирование производительности](../performance/performance-testing.md)** — Lighthouse CI, Web Vitals, bundle size, нагрузочные тесты.
- **[Spec-Driven Development](../ai/spec-driven-development.md)** — разработка через спецификации с помощью LLM.
