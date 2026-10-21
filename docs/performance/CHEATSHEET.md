# Шпаргалка: Производительность

## Метрики

- **Core Web Vitals:** LCP (< 2.5 с), INP (< 200 мс), CLS (< 0.1)
- **Цепочка:** TTFB (< 800 мс) → FCP (< 1.8 с) → LCP · TTFB сдвигает всё вправо
- **INP vs FID:** любое взаимодействие → следующий кадр, худший случай vs только первый ввод
- **CLS:** картинки без размеров, вставки выше контента, шрифты · width/height, aspect-ratio
- **TBT:** long tasks > 50 мс между FCP и TTI → деление задач, code splitting · TBT ↓ → INP ↓
- **Lab vs field:** Lighthouse, DevTools vs CrUX, `web-vitals`

## Браузер и сеть

- **Процессы:** Browser (UI, сеть, хранилища), Renderer (вкладка), GPU · IPC, sandbox
- **Site Isolation:** renderer на сайт, защита от Spectre vs расход памяти
- **Потоки renderer:** Main (JS, layout, paint), Compositor (`transform` / `opacity`), Raster
- **URL → HTML:** DNS → TCP (1 RTT) → TLS (1 RTT в 1.3) → HTTP → Renderer
- **TTFB:** DNS + TCP + TLS + server + latency · CDN, серверный кэш, HTTP/2, keep-alive
- **CRP:** DOM → CSSOM → Render Tree → Layout → Paint → Composite

## Рендеринг и гидратация

- **CSR / SSR / SSG:** браузер (без SEO) / каждый запрос (нагрузка) / сборка (устаревание)
- **ISR:** SSG + фоновая регенерация по TTL, первый после истечения видит старое, on-demand
- **ISR vs SWR:** уровень страницы vs уровень ответа / API
- **Streaming SSR:** HTML чанками через Suspense, медленный компонент не блокирует остальное
- **Выбор:** блог → SSG, e-commerce → ISR / SSR, дашборд → CSR · гибрид, Edge (V8 Isolate)
- **Hydration:** серверный HTML + JS → обработчики без пересоздания DOM · бандл → TBT, TTI
- **Mismatch:** `Date.now()`, `Math.random()`, `window`, локаль → `useEffect`
- **Меньше гидратации:** Selective Hydration (по взаимодействию), PPR, RSC (без JS)

## Бандл и кэш

- **Tree shaking:** только ESM · ломают CJS, side effects, `export *` · `sideEffects: false`
- **Code splitting:** маршруты, тяжёлые компоненты, условия · `import()`, prefetch
- **Vendor chunks:** по категориям + `contenthash` → обновление инвалидирует один чанк
- **Дубликаты:** разные версии, CJS + ESM · bundle analyzer → dedupe, `overrides` / `resolutions`
- **Сжатие:** Brotli (−15–20% к gzip), предварительное сжатие при сборке
- **Cache-Control:** `max-age` (браузер) vs `s-maxage` (CDN), `immutable`, `stale-while-revalidate`
- **Ревалидация:** ETag / Last-Modified → If-None-Match / If-Modified-Since → 304 · CDN и для HTML

## Разгрузка Main Thread

- **Виртуализация:** видимые + overscan (5–10), padding имитирует высоту, переиспользование узлов
- **Ловушки списков:** index как key, dynamic vs fixed height (measure), оправдана от ~500 элементов
- **Библиотеки:** react-window (минимум) vs react-virtuoso (sticky, infinite, autoscroll)
- **Web Worker:** отдельный поток, без DOM, `postMessage` (structured clone) · comlink
- **Transferable:** `ArrayBuffer`, без копирования, передача владения
- **Worker vs useTransition:** отдельный поток vs отсрочка на main · порог > 100 мс, > 10 МБ
- **Виды воркеров:** Dedicated, Shared (вкладки одного origin), Service (сеть, офлайн, PWA)

## Тестирование

- **Lab vs RUM:** Lighthouse CI (регрессии в PR) vs `web-vitals` в production
- **Бюджеты:** size-limit, лимиты чанков, щедрые пороги (minScore 0.9) → не flaky
- **k6:** virtual users, `stages` (разминка → пик → остывание), `sleep`, `thresholds` (p95)
- **Profiler:** React / Vue, overhead, только baseline · headless быстрее реального устройства
- **Антипаттерны:** score = 1.0, только десктоп, оптимизация без измерений
