# React

Раздел охватывает всё, что нужно для уверенной работы с React: фазы рендеринга, хуки, события, мемоизацию, Suspense, конкурентный режим и внутреннее устройство Fiber.

## Начни с базы

1. **[Основы React](./react-fundamentals.md)** — что такое React, JSX, компоненты, props, state, события, условный рендеринг, списки. Самая база для начинающих.
2. **[Хуки React](./react-hooks.md)** — `useRef`, `useState`, `useReducer`, правила хуков.
3. **[useEffect](./react-useeffect.md)** — жизненный цикл эффектов, зависимости, cleanup.
4. **[useContext](./react-usecontext.md)** — передача данных через дерево компонентов.
5. **[Порядок рендеринга и вызова хуков](./react-rendering-order.md)** — фазы render/commit, порядок хуков, Strict Mode.

## Углубись в детали

- **[Error Boundaries](./react-errorboundary.md)** — перехват ошибок рендеринга и fallback UI.
- **[Синтетические события](./react-synthetic-events.md)** — делегирование событий, доступ к нативным событиям.
- **[Мемоизация](./react-memorization.md)** — `useMemo`, `useCallback`, `React.memo`, React Compiler.
- **[Suspense](./react-suspense.md)** — lazy loading, потоковый рендеринг, Error Boundaries.
- **[HOC](./react-hoc.md)** — композиция, проблемы, сравнение с хуками.
- **[Конкурентные хуки](./react-concurrent-hooks.md)** — `useTransition`, `useDeferredValue`, приоритеты обновлений.

## Не будет лишним

- **[React Fiber](./react-fiber.md)** — внутреннее устройство reconciler для глубокого понимания.
- **[use()](./react-use.md)** — новый хук для Promise и Context.
- **[useImperativeHandle](./react-use-imperative-handle.md)** — управление императивным API дочерних компонентов.
- **[defaultProps и propTypes](./react-defaultprops-proptypes.md)** — legacy-типизация и современная альтернатива.
- **[Preact](./preact.md)** — лёгкий React-совместимый рантайм, миграция через `preact/compat`, Preact Signals, trade-offs.
- **[React Native](./react-native-intro.md)** — компоненты, стилизация, навигация, состояние, нативные модули, Expo vs Bare, публикация.