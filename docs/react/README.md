# React

Раздел охватывает всё, что нужно для уверенной работы с React: фазы рендеринга, хуки, события, мемоизацию, Suspense, конкурентный режим и внутреннее устройство Fiber.

## Начни с базы

1. **[Основы React](./fundamentals.md)** — что такое React, JSX, компоненты, props, state, события, условный рендеринг, списки. Самая база для начинающих.
2. **[Хуки React](./hooks.md)** — `useRef`, `useState`, `useReducer`, правила хуков.
3. **[useEffect](./useeffect.md)** — жизненный цикл эффектов, зависимости, cleanup.
4. **[useContext](./usecontext.md)** — передача данных через дерево компонентов.
5. **[Порядок рендеринга и вызова хуков](./rendering-order.md)** — фазы render/commit, порядок хуков, Strict Mode.

## Углубись в детали

- **[Error Boundaries](./errorboundary.md)** — перехват ошибок рендеринга и fallback UI.
- **[Синтетические события](./synthetic-events.md)** — делегирование событий, доступ к нативным событиям.
- **[Мемоизация](./memorization.md)** — `useMemo`, `useCallback`, `React.memo`, React Compiler.
- **[Suspense](./suspense.md)** — lazy loading, потоковый рендеринг, Error Boundaries.
- **[HOC](./hoc.md)** — композиция, проблемы, сравнение с хуками.
- **[Конкурентные хуки](./concurrent-hooks.md)** — `useTransition`, `useDeferredValue`, приоритеты обновлений.

## Не будет лишним

- **[React Fiber](./fiber.md)** — внутреннее устройство reconciler для глубокого понимания.
- **[use()](./use.md)** — новый хук для Promise и Context.
- **[useImperativeHandle](./use-imperative-handle.md)** — управление императивным API дочерних компонентов.
- **[defaultProps и propTypes](./defaultprops-proptypes.md)** — legacy-типизация и современная альтернатива.
- **[Preact](./preact.md)** — лёгкий React-совместимый рантайм, миграция через `preact/compat`, Preact Signals, trade-offs.
- **[React Native](./native-intro.md)** — компоненты, стилизация, навигация, состояние, нативные модули, Expo vs Bare, публикация.