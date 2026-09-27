# Производительность

Раздел посвящён тому, как измерять, анализировать и ускорять фронтенд: от метрик и методов рендеринга до виртуализации, Web Workers и браузерной архитектуры.

## Начни с базы

1. **[Метрики производительности](./web-performance-metrics.md)** — Core Web Vitals, TTFB, FCP, LCP, CLS, инструменты.
2. **[Методы рендеринга](./rendering-methods.md)** — CSR, SSR, SSG, ISR, SWR, Streaming, гидратация, CDN, HTTP-кэширование. Общие концепции; реализация во фреймворках — в разделах [Next.js](../nextjs/nextjs-rendering-methods.md) и [Nuxt](../nuxt/nuxt-rendering-modes.md).
3. **[Браузерная архитектура](./browser-architecture.md)** — процессы, потоки, Site Isolation, сетевой путь, TTFB.

## Углубись в детали

- **[Тестирование производительности](./performance-testing.md)** — Lighthouse CI, Web Vitals, bundle size, нагрузочные тесты.
- **[Гидратация](./hydration.md)** — как работает hydration, hydration mismatch и способы борьбы.
- **[Виртуализация списков](./list_virtualization.md)** — react-window, react-virtuoso, vue-virtual-scroller.
- **[Оптимизация бандла](./bundle-optimization.md)** — анализ бандла, tree shaking, code splitting, vendor chunks, bundle budget.

## Не будет лишним

- **[Web Workers](./web_workers.md)** — вынос тяжёлых вычислений из основного потока.
