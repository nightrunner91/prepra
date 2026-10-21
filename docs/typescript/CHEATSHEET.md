# Шпаргалка: TypeScript

## Основы

- **TS vs JS:** типы только в compile time, structural typing, type erasure
- **Особые типы:** any vs unknown (проверка перед использованием), void vs never (не завершилась)
- **interface vs type:** extends, declaration merging vs union, tuple, примитивы
- **tsconfig:** `strict` (`strictNullChecks`), target, module, paths
- **Компиляция:** transpile (esbuild, Vite) vs type check (`tsc --noEmit`)
- **Возврат функций:** inference vs явный тип (публичный API), `Promise<T>` у async

## Enum и декораторы

- **Enum:** единственный runtime-объект · numeric (reverse mapping) vs string
- **Альтернативы enum:** union литералов, `as const` + `typeof X[keyof typeof X]`
- **Ловушки enum:** `const enum` + `isolatedModules`, string enum ≠ литерал
- **Декораторы:** AOP, NestJS · при определении класса, снизу вверх
- **Legacy vs Stage 3:** `experimentalDecorators` vs TS 5.0+ · `(target, key)` vs `(value, context)`

## Сужение типов

- **Narrowing:** typeof, instanceof, in, сужение по веткам if / switch
- **Discriminated union:** поле-литерал (`kind`) → switch без guard
- **Type predicate:** `value is T` (контракт, не проверка), `filter(isUser)` → `User[]`
- **Assertion function:** `asserts value is T` → throw, сужение до конца scope
- **Exhaustiveness:** `const _x: never = value` в default · внешние данные → Zod, `z.infer`

## Generics

- **Generic:** переменная для типа, `identity<T>(value: T): T` vs any
- **Inference:** вывод из аргументов, явный `<T>`, нет `instanceof T`
- **Constraints:** `T extends HasId`, `K extends keyof T` → `T[K]`, default `T = ...`
- **Ловушки:** избыточные дженерики, имена `TData` / `TError` при 3+ параметрах

## Трансформации типов

- **Conditional:** `T extends U ? X : Y`, distributive по union
- **infer:** только в extends, `=> infer R`, `(infer E)[]`, `[infer F, ...infer Rest]`
- **Mapped types:** `[K in keyof T]`, `?` / `readonly` / `-?` / `-readonly`
- **Utility:** Partial, Required, Readonly (поверхностный), `Record<K, V>`, Pick vs Omit
- **Union и функции:** Exclude / Extract, NonNullable, ReturnType, Parameters, Awaited
- **Комбинации:** `Partial<Pick<T, K>>`, `Omit<T, K> & Partial<T>`

## TypeScript в React

- **Props:** interface / type, дефолты в деструктуризации, `React.ComponentProps`
- **События и children:** `React.ChangeEvent<HTMLInputElement>` · ReactNode vs ReactElement
- **Хуки:** `useState<User | null>(null)`, `useRef<HTMLDivElement>(null)`, useReducer + union
- **Компоненты:** generic `List<T>`, `createContext<T>` + хук с null-check, ref как пропс (19)
- **Async:** `catch (err: unknown)`, AbortController, idle → loading → success / error

## TypeScript во Vue

- **Props / emits:** `defineProps<Props>()`, withDefaults, `defineEmits<T>()`, `defineModel<T>()`
- **Реактивность:** `ref<User | null>(null)`, reactive (не для примитивов и union)
- **Generic и refs:** `generic="T"`, useTemplateRef, `InstanceType<typeof Child>`
- **provide / inject:** `InjectionKey<T>` · проверка: vue-tsc vs tsc
