---
title: "tRPC и типобезопасные API"
section: api-communication
description: "tRPC — end-to-end типизация без codegen: процедуры, роутеры, zod-валидация, React Query, SSR. Сравнение с REST, GraphQL и OpenAPI-кодогенерацией."
order: 9
tags: ["trpc", "end-to-end-type-safety", "typescript", "zod", "react-query", "server-call"]
questions:
  - "Какую проблему решает tRPC и почему ему не нужен codegen"
  - "Что такое процедура и роутер в tRPC"
  - "Чем query отличается от mutation в tRPC"
  - "Зачем нужен context и как он передаётся в процедуры"
  - "Как zod связан с валидацией входных данных в tRPC"
  - "Как middleware реализует авторизацию в tRPC"
  - "Как React Query интегрируется с tRPC и какие хуки генерируются"
  - "Как выполнять серверные вызовы для SSR и почему tRPC не подходит для публичных API"
answers:
  - "tRPC делает клиент и сервер частями одной типизированной программы: типы выводятся из роутера автоматически и не дублируются — не нужен codegen, генерация по схеме или вручную поддерживаемые типы, в отличие от REST (ручные DTO) и GraphQL (нужен codegen)."
  - "Процедура — серверная функция, вызываемая с клиента: query (чтение), mutation (изменение), subscription (подписка); роутер — объект, объединяющий процедуры, а вложенные роутеры собираются в один тип AppRouter, который используется на клиенте."
  - "Query выполняет чтение и кэшируется через React Query, mutation выполняет изменение и после успеха может инвалидировать кэш через utils.invalidate, а subscription устанавливает долгоживущее соединение и слушает события."
  - "Context создаётся на каждый запрос через createContext: в него кладут данные запроса (headers, сессию пользователя, БД) — процедуры и middleware получают ctx и обращаются к авторизации и данным без повторного разбора запроса."
  - "Входные данные процедуры описываются через input: z.object({...}) из zod: tRPC валидирует их на сервере автоматически, а типы вывода zod-схемы попадают в клиент — нарушение схемы отсекается с понятной ошибкой ещё до бизнес-логики."
  - "Middleware оборачивает процедуру: tRPC даёт доступ к ctx и next() — типичный сценарий isAuthed проверяет ctx.user и бросает UNAUTHORIZED при отсутствии сессии, а защищённые процедуры собираются через t.procedure.use(isAuthed)."
  - "tRPC-клиент подключается к React Query через withTRPC: для каждой процедуры генерируются хуки trpc.user.getById.useQuery(), useMutation(), useUtils() для инвалидации — кэширование, ретраи и отмена запросов работают как в обычном TanStack Query."
  - "Серверный вызов выполняется через serverClient (createCallerFactory) с типизированным контекстом для SSR или префетчинга данных на сервере; tRPC не подходит для публичных API — нужен HTTP-контракт (OpenAPI/REST) или язык-независимый формат (GraphQL/gRPC), так как клиент должен быть TypeScript."
---

# tRPC и типобезопасные API

REST отдаёт данные без типов, а фронтенд и бэкенд синхронизируют контракты вручную. tRPC устраняет эту границу: клиент и сервер становятся частями одной типизированной программы, а TypeScript проверяет данные на всём пути — без codegen и дублирования схем. Разберём, как это работает и когда использовать.

## Содержание

1. [Проблема: типобезопасность через сеть](#проблема-типобезопасность-через-сеть)
2. [Как работает tRPC](#как-работает-trpc)
3. [Процедуры и роутеры](#процедуры-и-роутеры)
4. [Валидация входных данных через zod](#валидация-входных-данных-через-zod)
5. [Context и middleware](#context-и-middleware)
6. [Клиент и React Query](#клиент-и-react-query)
7. [Серверные вызовы и SSR](#серверные-вызовы-и-ssr)
8. [Подписки](#подписки)
9. [Подключение в Next.js](#подключение-в-nextjs)
10. [Оптимизация загрузки типов](#оптимизация-загрузки-типов)
11. [tRPC vs REST vs GraphQL](#trpc-vs-rest-vs-graphql)
12. [Когда использовать tRPC](#когда-использовать-trpc)
13. [Лучшие практики](#лучшие-практики)
14. [Антипаттерны](#антипаттерны)

---

## Проблема: типобезопасность через сеть

В монолитном TypeScript-приложении компилятор проверяет данные на каждом шаге. Как только появляется HTTP-граница, типы исчезают: сервер отдаёт JSON, клиент доверяет тому, что пришло.

Способы вернуть типы:

- **Ручные DTO-типы на клиенте** — дублирование, рассинхрон, «клиент верит, что сервер вернёт ровно это».
- **Codegen по OpenAPI/Swagger** (`openapi-typescript`, `orval`, `openapi-generator`) — типы генерируются из схемы, но нужен генератор в CI, и генерация идёт после бэкенда.
- **GraphQL + codegen** — типы выводятся из схемы, но опять генератор, бэкенд на любом языке, своя сложность.
- **tRPC** — тип определяется один раз на сервере и **выводится** на клиенте через `typeof`. Никакого codegen: одна кодовая база, один язык, компилятор проверяет всё.

tRPC — это RPC поверх HTTP: клиент вызывает серверные функции напрямую, как локальные, а транспорт, сериализация и типы скрыты под капотом.

---

## Как работает tRPC

Минимальная схема:

```ts
// server
const t = initTRPC.context<Context>().create();

const appRouter = t.router({
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Привет, ${input.name}!`),
});

export type AppRouter = typeof appRouter;
```

```ts
// client
const trpc = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/api/trpc' })] });

const result = await trpc.hello.query({ name: 'Вася' });
// result: string — TypeScript знает это без codegen
```

Ключевой момент: `AppRouter` — это **тип**. Клиент получает его через `import type`, и для всех процедур выводятся входы и выходы. Если сервер изменил схему — клиент перестанет компилироваться.

---

## Процедуры и роутеры

**Процедура** — серверная функция, доступная клиенту. Три вида:

```ts
const t = initTRPC.create();

const appRouter = t.router({
  // чтение
  getUser: t.procedure.input(z.string()).query(async ({ input }) => {
    return db.user.findUnique({ where: { id: input } });
  }),

  // изменение
  updateUser: t.procedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      return db.user.update({ where: { id: input.id }, data: { name: input.name } });
    }),

  // подписка (real-time)
  onUserUpdate: t.procedure.subscription(() => {
    return observable((emit) => {
      const unsub = events.on('user-update', (user) => emit.next(user));
      return () => unsub();
    });
  }),
});
```

**Роутер** — объект, группирующий процедуры. Роутеры вкладываются:

```ts
const userRouter = t.router({
  getById: t.procedure.input(z.string()).query(...),
  update: t.procedure.input(...).mutation(...),
});

const appRouter = t.router({
  user: userRouter,          // trpc.user.getById.query(...)
  post: t.router({ list: t.procedure.query(...) }), // trpc.post.list.query()
});
```

Иерархия роутеров переносится на клиент: `trpc.user.getById` — типобезопасный путь к процедуре.

---

## Валидация входных данных через zod

Входные данные описываются через zod-схемы. tRPC валидирует их **на сервере автоматически** перед выполнением процедуры, а типы схемы попадают в клиент.

```ts
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

const appRouter = t.router({
  createUser: t.procedure
    .input(userSchema)
    .mutation(async ({ input }) => {
      // input уже валиден и типизирован
      return db.user.create({ data: input });
    }),
});
```

Что это даёт:

- **Безопасность**: кривые данные отсекаются до бизнес-логики с понятной ошибкой.
- **Один источник истины**: схема = типы = валидация. Не нужно отдельно писать интерфейс.
- **Подсказки на клиенте**: IDE автокомплитит поля ввода.

---

## Context и middleware

**Context** создаётся на каждый запрос и содержит всё, что нужно процедурам: данные заголовков, сессию, соединение с БД.

```ts
import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

async function createContext({ req }: CreateNextContextOptions) {
  const session = await getSession({ req });
  return { session };
}

type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create();
```

Процедура обращается к контексту через `ctx`:

```ts
const getUser = t.procedure.query(({ ctx }) => {
  return ctx.session?.user; // тип выведен из контекста
});
```

**Middleware** оборачивает процедуру, получает `ctx` и может вернуть ошибку или изменить контекст:

```ts
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

// защищённые процедуры
const protectedProcedure = t.procedure.use(isAuthed);

const updateProfile = protectedProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return db.user.update({ where: { id: ctx.user.id }, data: { name: input.name } });
  });
```

Ошибки через `TRPCError` — стандартизированные коды (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`), которые клиент получает типизированными.

---

## Клиент и React Query

Для React tRPC подключается к TanStack Query — генерируются хуки для каждой процедуры.

```tsx
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/router';

const trpc = createTRPCReact<AppRouter>();

function UserProfile({ userId }: { userId: string }) {
  // useQuery обёртка над trpc.user.getById
  const { data, isLoading } = trpc.user.getById.useQuery(userId);

  // useMutation
  const utils = trpc.useUtils();
  const update = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getById.invalidate(); // обновить кэш
    },
  });

  return (
    <div>
      {isLoading ? 'Загрузка...' : data?.name}
      <button onClick={() => update.mutate({ id: userId, name: 'Новое имя' })}>
        Сохранить
      </button>
    </div>
  );
}
```

Вся мощь TanStack Query работает из коробки: кэширование, ретраи, отмена запросов через `AbortSignal`, фоновое обновление. Хуки выводят типы из роутера — ошибки, данные и аргументы типизированы.

---

## Серверные вызовы и SSR

Для SSR данные нужно получить до рендера страницы. tRPC умеет выполнять процедуры на сервере без HTTP-транспорта через `createCallerFactory`.

```ts
import { createCallerFactory } from '@trpc/server';
import { appRouter } from '@/server/router';
import { createContext } from '@/server/context';

const createCaller = createCallerFactory(appRouter);

export async function getServerSideData() {
  const caller = createCaller(await createContext());
  const user = await caller.user.getById('42');
  return { user };
}
```

Это же используется для **префетчинга** в React Query на сервере: данные заливаются в кэш до рендера, а клиент гидратирует его — нет повторных запросов.

---

## Подписки

Подписки tRPC дают real-time события. На сервере — через `observable`, на клиенте — через `useSubscription`.

```ts
// сервер
onOrderStatus: t.procedure.subscription(({ ctx }) => {
  return observable((emit) => {
    const unsub = orderEvents.subscribe((order) => emit.next(order));
    return () => unsub();
  });
}),
```

```tsx
// клиент
function OrderTracker({ orderId }: { orderId: string }) {
  trpc.onOrderStatus.useSubscription(undefined, {
    onData: (order) => {
      console.log('Новый статус:', order.status);
    },
  });
  return null;
}
```

Под капотом — WebSocket или SSE, но для разработчика это прозрачно: подписка выглядит как обычный вызов процедуры.

---

## Подключение в Next.js

В Next.js App Router tRPC монтируется как Route Handler и вызывается через `httpBatchLink`.

```ts
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/router';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

`httpBatchLink` **объединяет несколько вызовов за тик в один HTTP-запрос** — меньше round-trip'ов, быстрее интерфейс.

```ts
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers: () => ({ Authorization: `Bearer ${token}` }),
    }),
  ],
});
```

---

## Оптимизация загрузки типов

`AppRouter` тянет за собой типы серверных зависимостей. Без аккуратности клиентский бандл или время компиляции страдают.

- **Импортируй тип, а не значение**: `import type { AppRouter }` — клиент не должен импортировать серверный код.
- **`import { initTRPC }` — только на сервере**. Тип `AppRouter` из роутера — на клиент через отдельный файл `type Router = typeof appRouter`.
- **Ссылки-заглушки**: если роутер ссылается на серверные типы, которые не нужны клиенту, — используй абстракцию с `any` в строго типизированном месте, чтобы компилятор не тянул транзитивные зависимости.

```ts
// router.ts
export const appRouter = t.router({ ... });
export type AppRouter = typeof appRouter;

// _app.ts (клиентская точка входа)
import type { AppRouter } from './router';
```

---

## tRPC vs REST vs GraphQL

| Критерий | tRPC | REST | GraphQL |
|----------|------|------|---------|
| Типизация | Автоматическая (typeof) | Ручная/через codegen | Codegen из схемы |
| Codegen | Не нужен | Часто нужен | Нужен |
| Язык клиента | Только TypeScript | Любой | Любой |
| Контракт для третьих сторон | Нет | OpenAPI | Схема |
| Кэширование | TanStack Query | HTTP-кэш, TanStack Query | Apollo, HTTP (сложно) |
| Real-time | Подписки | Long Polling/SSE/WS | Subscriptions |
| Простота | Низкий порог | Средний | Высокий порог |

tRPC выигрывает там, где клиент и сервер — TypeScript и принадлежат одной команде. REST/GraphQL — где нужен публичный контракт, сторонние клиенты или бэкенд не на TS.

---

## Когда использовать tRPC

**Подходит:**

- Full-stack Next.js/Nuxt приложения в монорепо.
- Клиент и сервер на TypeScript в одной команде.
- Проекты, где важна скорость разработки и type safety без codegen.
- Внутренние API, админки, SaaS-приложения.

**Не подходит:**

- Публичные API для третьих сторон — нужен HTTP-контракт (OpenAPI).
- Клиенты не на TypeScript (mobile, сторонние сервисы).
- Бэкенд-команда пишет не на TS.
- Строгое разделение команды фронтенда и бэкенда — tRPC сращивает код.

---

## Лучшие практики

### 1. Валидируй входы zod на каждой процедуре

Вход без `.input()` — вход без валидации и без типов для клиента.

### 2. Группируй процедуры в роутеры по доменам

`user`, `post`, `billing` — иерархия роутеров делает клиент читаемым.

### 3. Защищай процедуры через middleware

`isAuthed` в одном месте вместо проверок в каждой процедуре.

### 4. Используй `httpBatchLink`

Объединение запросов снижает нагрузку на сеть и сервер.

### 5. Инвалидируй кэш по узкой гранулярности

`utils.user.getById.invalidate()` точнее, чем `utils.user.invalidate()` — меньше лишних запросов.

### 6. Типизируй ошибки

`TRPCError` с кодами — клиент получает типизированные ошибки, а не строки.

---

## Антипаттерны

### 1. Процедуры-«гиганты» без input

```ts
// ❌ Плохо: всё в одном месте, без типов входов
updateEverything: t.procedure.mutation(({ ctx }) => { ... });
```

### 2. Импорт серверного кода на клиент

```ts
// ❌ Плохо: тянет серверные зависимости в бандл
import { appRouter } from '@/server/router';
```

### 3. Возврат сырых сущностей БД

Возвращай DTO или `select` из Prisma — не отдавай пароли и внутренние поля.

### 4. Подписки без отписки

Подписка должна возвращать функцию отписки — иначе утечка соединений.

### 5. tRPC для публичного API

Открывать tRPC наружу без HTTP-контракта — нельзя: внешние клиенты не смогут работать с ним.

---

## Ключевые тезисы для интервью

- tRPC — end-to-end типизация через `typeof` роутера, без codegen и дублирования типов.
- Процедуры бывают query (чтение), mutation (изменение), subscription (real-time).
- Входы валидируются zod на сервере, типы схемы попадают на клиент.
- Context создаётся на каждый запрос и передаётся в процедуры и middleware.
- Middleware (`isAuthed`) централизует авторизацию через `TRPCError`.
- React Query интегрируется автоматически: `useQuery`, `useMutation`, `useUtils().invalidate()`.
- SSR-вызовы — через `createCallerFactory` и серверный caller без HTTP.
- `httpBatchLink` объединяет вызовы за тик в один запрос.
- tRPC работает только в TypeScript-проектах и не подходит для публичных API.
- REST/GraphQL выигрывают, когда нужен контракт для сторонних клиентов.

## Заключение

tRPC стирает границу между фронтендом и бэкендом: типы выводятся автоматически, валидация происходит на сервере, а React Query берёт на себя кэширование. Это самый быстрый путь к типобезопасному full-stack приложению в Next.js — но ценой привязки к TypeScript с обеих сторон.

Ключевое для Middle+ разработчика:

- Понимать процедуры, роутеры, context и middleware.
- Уметь строить защищённые и валидируемые API без codegen.
- Знать сильные стороны (скорость, типы) и ограничения (публичные API, чужие клиенты).
- Сравнивать с REST и GraphQL и выбирать инструмент под задачу.

## Полезные ссылки

- [tRPC Documentation](https://trpc.io/)
- [tRPC: Quickstart](https://trpc.io/docs/quickstart)
- [TanStack Query + tRPC](https://tanstack.com/query/latest/docs/framework/react/guides/trpc)
- [Zod](https://zod.dev/)