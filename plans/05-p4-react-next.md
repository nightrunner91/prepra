# P4 — React/Next, добивка и выпуск (4 недели, 11 статей)

Цель: усилить главный стек (React 65.9%, Next.js 31.7%), привести React-раздел
к явной лестнице и выпустить версию 1.2.0 с новым позиционированием.

Зависимости: P1–P3. Миграций разделов нет.

Итог: React 27 статей, Next.js 17, финальный QA и релиз.

---

## 1. `react` (+7, перенумерация всех 24)

Сначала перенумеровать существующие 17 статей по таблице ниже (меняется только
`order`, ссылки не зависят от него), затем добавить новые.

| order | slug | title | L | Статус |
|---|---|---|---|---|
| 1 | `fundamentals` | Основы React: компоненты, JSX, props, state | 2 | есть |
| 2 | `hooks` | Хуки React: useState, useReducer, useRef | 2 | есть |
| 3 | `rendering-order` | Порядок рендеринга и вызова хуков | 2 | есть |
| 4 | `useeffect` | useEffect: эффекты, зависимости, cleanup | 3 | есть |
| 5 | `usecontext` | useContext: данные через дерево компонентов | 3 | есть |
| 6 | `component-api-patterns` | Паттерны API компонентов | 3 | **новая** |
| 7 | `state-architecture` | Архитектура состояния: server state vs client state | 3 | **новая** |
| 8 | `forms-and-validation` | Формы и валидация в React | 3 | **новая** |
| 9 | `synthetic-events` | Синтетические события | 3 | есть |
| 10 | `errorboundary` | Error Boundary | 3 | есть |
| 11 | `memorization` | Мемоизация: useMemo, useCallback, React.memo | 3 | есть |
| 12 | `react-compiler` | React Compiler | 4 | **новая** |
| 13 | `suspense` | Suspense: ленивая загрузка и стриминг | 4 | есть |
| 14 | `concurrent-hooks` | useTransition и useDeferredValue | 4 | есть |
| 15 | `server-components` | React Server Components | 4 | **новая** |
| 16 | `react-19-actions` | React 19: actions, формы, оптимистичный UI | 4 | **новая** |
| 17 | `use` | use(): Promise и Context | 4 | есть |
| 18 | `use-imperative-handle` | useImperativeHandle | 4 | есть |
| 19 | `react-production-profiling` | Профилирование React в проде | 5 | **новая** |
| 20 | `fiber` | React Fiber | 5 | есть |
| 21 | `hoc` | HOC: композиция и ограничения | 4 | есть |
| 22 | `defaultprops-proptypes` | defaultProps и propTypes | 3 | есть |
| 23 | `preact` | Preact как замена React | 4 | есть |
| 24 | `native-intro` | React Native для React-разработчика | 4 | есть |

Содержание новых:
- **6** — compound components, headless-паттерн, slots, controlled/uncontrolled,
  «прокси-пропсы», когда API компонента ломает пользователей.
- **7** — три вида состояния (server / client / URL / form); где TanStack Query,
  где Zustand, где `useState`; почему один глобальный store — антипаттерн
  по умолчанию. Опирается на перенесённые `tanstack-query` и `zustand`.
- **8** — controlled vs uncontrolled; `useActionState` и `useFormStatus`;
  схемы zod на клиенте; ошибки полей и серверные ошибки; доступность.
- **12** — что компилятор делает с мемоизацией; когда он не поможет; миграция;
  как измерять эффект (не «стало красивее»).
- **15** — RSC-модель: что выполняется на сервере, границы `use client`,
  сериализация пропсов, `Suspense` и стриминг; чем отличается от SSR.
- **16** — actions, `useOptimistic`, `useActionState`; откат оптимистичного
  обновления; связка с Server Actions Next.js (кросс-ссылка).
- **19** — React DevTools Profiler в проде: `Profiler` API, метрики, INP-
  вклад, бюджеты, что оптимизировать первым.

Обновить README: 3 секции, ссылки в новом порядке.

---

## 2. `nextjs` (+4)

Существующие orders 1–13 не трогаем.

| order | slug | title | L | Что раскрыть |
|---|---|---|---|---|
| 14 | `next-as-backend` | Next.js как бэкенд: где граница | 4 | route handlers vs отдельный сервис; когда монолит достаточно; BFF; деплой и масштабирование; цена связанности |
| 15 | `server-actions-security` | Server Actions: безопасность и паттерны | 4 | что приходит из браузера; авторизация внутри экшена; CSRF; валидация; идемпотентность; типичные дыры |
| 16 | `authjs` | Auth.js и сессии в Next.js | 4 | провайдеры; session vs JWT; middleware и защита роутов; refresh; logout; что не хранить в токене |
| 17 | `streaming-in-production` | Стриминг и Suspense в продакшене | 4 | где стримить; `loading.tsx` и границы; ошибки в потоке; кэш и стриминг; метрики TTFB и INP |

Кросс-ссылки: `14` ↔ `nextjs/monolith-direct-db`, `15` ↔ `security/api-security`,
`16` ↔ `security/oauth-oidc-practice`, `17` ↔ `performance/hydration`.

---

## 3. Заморозка Vue

1. В `docs/vue/README.md` первая строка после заголовка:
   > Раздел поддерживается как справочник по второму стеку. Новые статьи не
   > выходят; приоритет платформы — React, Node.js и System Design.
2. `sections.ts`: `vue` остаётся в группе `legacy`, `market` 17.1.
3. На странице раздела — бейдж «второй стек» (если бейджи уже есть из P0).
4. CHEATSHEET пересобрать один раз после P0-слияния и больше не трогать.
5. Не добавлять Vue в треки A/B; только `vue-legacy` как ссылка.

---

## 4. Опционально: backfill `level`/`requires` для старых 182 статей

Не блокирует релиз. Если делаем:
- скрипт читает frontmatter, ставит `level` по эвристике раздела и `order`
  (например `order 1–3` → L2, `4–10` → L3, `11+` → L4), автор проходит
  выборочно по 20 статьям и правит;
- `requires` заполнять только там, где очевидно (RSC → suspense, fiber);
- после backfill включить фильтр по `level` в мок-интервью (маленький PR:
  `presets.ts` + `selection.ts` + UI-переключатель).

Без backfill `level` работает только в новых разделах — это допустимо.

---

## 5. Релиз 1.2.0

- [ ] `README.md`: позиционирование «от фронтенда к Product Engineer»,
      актуальные счётчики, новые разделы, `/tracks`, стек статей
- [ ] `Hero.astro` / FAQ: убрать обещания, которых нет
- [ ] `package.json` версия 1.2.0 (в `site/`), бейдж в README
- [ ] Lighthouse: не ниже текущих порогов (проверить `lighthouserc.js`)
- [ ] Поиск: новые разделы попадают в `search-index.json` (сам собирается из
      коллекций — проверить ранжирование по запросу «node», «postgres», «system design»)
- [ ] Мок-интервью: все пресеты собираются, старые сессии в localStorage не падают
- [ ] Мобильная навигация: 6 групп не ломают меню
- [ ] Sitemap/канонические: старые `/nuxt/*` и `/state-management/*` ведут на новые
- [ ] Git tag `v1.2.0`, релиз через скилл `github-releaser`

---

## 6. Критерии приёмки P4

- [ ] React: 24 статьи, `order` 1–24 без дублей, README соответствует
- [ ] Next.js: 17 статей
- [ ] Vue README содержит дисклеймер о заморозке
- [ ] `npm run build` зелёный, битых ссылок 0
- [ ] все пресеты собираются, `/tracks` ссылается только на существующие статьи
- [ ] релиз 1.2.0 опубликован

## 7. Что дальше (вне плана)

- перепроверка рынка через 6 месяцев (обновить README §7 и бейджи);
- Python/FastAPI как отдельный трек — только если появится спрос в новой выборке;
- исполняемый SQL-раннер (sql.js в Web Worker) — если практикум упрётся в потолок;
- readiness score по треку (прочитано × вопросы × мок-интервью);
- задачи типа «code review» и «system design» в практикуме.
