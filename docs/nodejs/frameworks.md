---
title: "Fastify и NestJS: плагины против DI"
section: nodejs
description: "Как Fastify и NestJS решают задачи Express: схемы и хуки, плагины и инкапсуляция, модули и DI, guards и interceptors, цена каждого подхода."
order: 13
tags: ["fastify", "nestjs", "dependency-injection", "plugins", "frameworks"]
stacks: []
questions:
  - "Чем контракт маршрута в Fastify отличается от валидации отдельным middleware в Express"
  - "Почему в Fastify важно, на каком хуке выполняется проверка токена или чтение тела"
  - "Как инкапсуляция плагинов Fastify ограничивает видимость декораторов и хуков и зачем нужен `fastify-plugin`"
  - "Зачем серверному приложению DI и как NestJS разрешает граф зависимостей при старте"
  - "Чем guard, pipe и interceptor отличаются по месту в жизненном цикле запроса NestJS"
  - "Почему request-scoped провайдер в NestJS дороже singleton и когда он оправдан"
  - "Почему NestJS считают тяжёлым для маленького сервиса и что именно добавляет накладные расходы"
  - "По каким критериям выбирать между Express, Fastify и NestJS для нового API"
answers:
  - "В Express валидация — отдельный слой, который надо не забыть подключить, а значения `req.query` остаются строками. В Fastify схема привязана к маршруту: она проверяет вход, приводит типы и описывает ответ, поэтому контракт нельзя случайно обойти."
  - "Хуки идут в порядке жизненного цикла: `onRequest` ещё не видит тело, `preValidation` видит его до проверки схемы, `preHandler` — после. Проверку токена обычно ставят в `onRequest` или `preHandler`, а чтение и правку тела — в `preValidation`."
  - "`register` создаёт дочерний контекст: его декораторы и хуки видны вложенным плагинам, но не родителю и соседям, а префикс действует только внутри. `fastify-plugin` отключает изоляцию и поднимает декораторы и хуки в родительский контекст — его берут для инфраструктурных плагинов вроде БД."
  - "DI убирает скрытые импорты: зависимости приходят в конструктор, контейнер создаёт их один раз и подставляет другие реализации в тестах. Nest строит граф по типам и токенам при старте и падает сразу, если зависимость не зарегистрирована."
  - "Guard решает, пускать ли запрос, и работает до пайпов; pipe валидирует и преобразует конкретный параметр; interceptor оборачивает обработчик и может изменить поток ответа до и после него. Фильтры стоят отдельно и ловят только непойманные исключения."
  - "Request-scoped провайдер создаётся на каждый запрос, а его scope поднимается по цепочке потребителей, из-за чего контейнер пересобирает часть графа. Он нужен для контекста запроса (тенант, пользователь), но для stateless-сервисов дороже и бессмысленен."
  - "Nest добавляет TypeScript с декораторами, модули, DI-контейнер, пайпы, guards и interceptors, а также сборку и старт контейнера. Для пяти эндпоинтов это больше кода и церемоний, чем сам бизнес; выгода появляется с ростом числа модулей и команды."
  - "Express берут для простого API, легаси и максимальной совместимости с готовыми middleware; Fastify — для нового контрактного API, где важны скорость, схемы и изоляция плагинов; Nest — для большого долгого продукта с командой, которой нужны единые слои, DI и тестируемость."
---

# Fastify и NestJS: плагины против DI

Express остаётся точкой отсчёта: он даёт минимум решений и максимум свободы. Когда сервис растёт, свобода оборачивается ручной валидацией, самодельной структурой и контрактами, которые расходятся между кодом, документацией и клиентами. Fastify и NestJS предлагают два разных ответа: первый делает контрактом схему маршрута, второй — граф зависимостей и слои. Разберём, как устроены оба подхода, сколько стоит каждый и когда пора уходить с Express.

## Содержание

1. [Fastify: маршрут как контракт](#fastify-маршрут-как-контракт)
2. [Хуки и жизненный цикл запроса](#хуки-и-жизненный-цикл-запроса)
3. [Плагины и инкапсуляция](#плагины-и-инкапсуляция)
4. [Практика: TaskFlow на Fastify](#практика-taskflow-на-fastify)
5. [NestJS: модули и внедрение зависимостей](#nestjs-модули-и-внедрение-зависимостей)
6. [Контроллеры, провайдеры и пайпы](#контроллеры-провайдеры-и-пайпы)
7. [Guards, interceptors и exception filters](#guards-interceptors-и-exception-filters)
8. [Жизненный цикл запроса в NestJS](#жизненный-цикл-запроса-в-nestjs)
9. [Производительность и накладные расходы](#производительность-и-накладные-расходы)
10. [Когда Express, когда Fastify, когда NestJS](#когда-express-когда-fastify-когда-nestjs)
11. [Частые ошибки](#частые-ошибки)
12. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
13. [Заключение](#заключение)
14. [Полезные ссылки](#полезные-ссылки)

---

## Fastify: маршрут как контракт

Fastify вырос из идеи, что HTTP-обработчик — это не только функция, но и описание данных, которые он принимает и возвращает. Маршрут регистрируется объектом, где рядом с `handler` лежит `schema`:

```js
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

const app = Fastify({ logger: true });

const createTaskSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    done: { type: 'boolean', default: false },
  },
};

app.post('/tasks', {
  schema: {
    body: createTaskSchema,
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          done: { type: 'boolean' },
        },
      },
    },
  },
}, async (request, reply) => {
  const task = { id: randomUUID(), ...request.body };
  return reply.code(201).send(task);
});

await app.listen({ port: 3000, host: '0.0.0.0' });
```

Схема здесь — не документация «для галочки», а исполняемый код. На старте Fastify компилирует её в функции валидации и сериализации, поэтому в рантайме почти нет накладных расходов на разбор JSON Schema. Дальше работают три механизма:

- **Валидация запроса.** Ajv проверяет `body`, `querystring`, `params` и `headers`. Ошибка возвращается как `400` с описанием, а в error handler доступна как `error.validation`.
- **Приведение типов.** В query и params всё приходит строками, но Fastify настраивает Ajv с `coerceTypes: 'array'`: `?done=true` превращается в boolean, а повторяющийся ключ — в массив. В Express то же самое пришлось бы разбирать вручную.
- **Сериализация ответа.** Если задана `response`-схема, Fastify использует `fast-json-stringify`: он собирает JSON по известной форме и не включает поля, которых в схеме нет. Это и ускорение, и защита от случайной утечки `passwordHash`.

У схем есть и обратная сторона. По умолчанию Ajv работает с `removeAdditional: true`, поэтому при `additionalProperties: false` лишние поля молча отбрасываются, а не вызывают ошибку. Если приложению важно явно отклонять неизвестные ключи, это поведение настраивают через `ajv.customOptions`, иначе клиент не узнает, что отправил опечатку в имени поля.

В Express валидация — отдельный слой: `express.json()`, затем `validate(schema)`, затем обработчик. Его легко забыть подключить к новому маршруту или подключить после него. В Fastify схема находится в том же объекте, что и обработчик, поэтому новый маршрут без контракта виден на ревью сразу. Из тех же схем `@fastify/swagger` собирает OpenAPI, а type provider (TypeBox, Zod) выводит TypeScript-типы — но это уже надстройки, а не обязательная часть.

Лимит тела у Fastify по умолчанию — 1 МиБ. Он настраивается через `bodyLimit` на инстансе или на конкретном маршруте, и это по-прежнему защита от исчерпания памяти, а не замена валидации.

---

## Хуки и жизненный цикл запроса

Express строит обработку вокруг цепочки middleware. Fastify заменяет её хуками — точками, привязанными к конкретным стадиям запроса. Хук объявляется до маршрута, в том же контексте, и получает объекты `request` и `reply`, а не сырые `IncomingMessage` и `ServerResponse`:

```js
app.decorateRequest('user', null);

app.addHook('onRequest', async (request) => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return;

  try {
    request.user = await verifyToken(header.slice(7));
  } catch {
    const error = new Error('invalid token');
    error.statusCode = 401;
    throw error;
  }
});
```

`decorateRequest` добавляет поле в каждый объект запроса. В TypeScript его тип расширяют через declaration merging — иначе `request.user` не скомпилируется.

Порядок хуков и то, что в каждом доступно:

| Хук | Когда выполняется | Что важно |
|---|---|---|
| `onRequest` | до чтения тела | `request.body` всегда `undefined`; подходит для токена и request-id |
| `preParsing` | тело ещё поток | можно распаковать или преобразовать поток |
| `preValidation` | тело разобрано | можно изменить `request.body` до проверки схемы |
| `preHandler` | схема уже проверена | основное место для авторизации и бизнес-проверок |
| `preSerialization` | перед сериализацией | можно обернуть payload; не вызывается для строк, `Buffer`, стримов и `null` |
| `onSend` | перед отправкой | payload уже сериализован, можно добавить заголовки |
| `onResponse` | ответ отправлен | метрики и логи; писать в ответ уже нельзя |
| `onError` | ошибка до error handler | только логирование и заголовки, менять ошибку нельзя |
| `onTimeout`, `onRequestAbort` | таймаут или уход клиента | очистка ресурсов |

Разница между `onRequest` и `preHandler` — не стилистика. Проверка токена в `onRequest` не тратит время на разбор тела, которое всё равно будет отклонено. Но если политика зависит от тела запроса, её место — `preHandler`, потому что там тело уже разобрано и проверено схемой. А `preValidation` нужен, когда надо нормализовать payload до схемы: например, привести `"done": "false"` к boolean.

Хук может ответить досрочно, и тогда остальная цепочка не выполняется:

```js
app.addHook('preHandler', async (request, reply) => {
  if (!request.user) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
});
```

В async-хуке достаточно вернуть `reply`; в колбэк-версии нужно вызвать `reply.send()` и не вызывать `done()`. Смешивать два стиля нельзя: если функция async, `done` не передаётся, а его вызов приводит к повторному выполнению цепочки. Это одна из самых частых ошибок при переносе кода с Express.

Хуки, как и плагины, подчиняются инкапсуляции. Хук, добавленный внутри плагина с префиксом `/admin`, сработает только на маршрутах этого плагина. Хук на корневом инстансе — на всех. Маршрутные хуки в опциях маршрута выполняются после общих хуков того же типа, что позволяет добавлять локальные проверки поверх глобальных.

---

## Плагины и инкапсуляция

Плагин Fastify — это функция, которая получает дочерний инстанс и опции. `register` создаёт новый контекст: всё, что плагин добавляет через `decorate` и `addHook`, видно его вложенным плагинам, но не родителю и не соседям.

```js
app.register(async (admin) => {
  admin.addHook('onRequest', async (request) => {
    if (request.user?.role !== 'admin') {
      const error = new Error('forbidden');
      error.statusCode = 403;
      throw error;
    }
  });

  admin.get('/stats', async () => ({ tasks: 42 }));
}, { prefix: '/admin' });
```

Запрос `GET /admin/stats` попадёт в этот плагин, а `GET /stats` вернёт `404`: маршрут зарегистрирован с префиксом `/admin`. Проверка роли при этом не сработает на `/tasks`: хук живёт только в контексте `admin`. Это и есть инкапсуляция — не глобальный список middleware, а дерево контекстов.

Инфраструктурные плагины обычно должны быть видны всему приложению. Для этого их оборачивают в `fastify-plugin`:

```js
// plugins/db.js
import fp from 'fastify-plugin';
import { Pool } from 'pg';

async function db(app) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  app.decorate('db', pool);
  app.addHook('onClose', async () => {
    await pool.end();
  });
}

export default fp(db, { name: 'db' });
```

```js
app.register(db);
app.register(tasksRoutes, { prefix: '/tasks' });
```

После регистрации `app.db` доступен в обработчиках и других плагинах. Без `fp` декоратор остался бы внутри плагина, и маршруты в соседнем контексте его бы не увидели. `fastify-plugin` не создаёт новый контекст: декораторы и хуки поднимаются на родительский инстанс. Поэтому его берут для подключения БД, конфигурации, логгера и других общих ресурсов — и не берут для прикладных модулей, которым нужна изоляция.

У плагинов есть жизненный цикл: `onClose` вызывается при `app.close()`, причём хуки дочерних плагинов выполняются раньше родительских. Это делает плагин естественным местом для закрытия пула соединений, очередей и других ресурсов.

Сравнение с Express напрашивается само: `app.use()` добавляет слой в один глобальный конвейер, а `register()` создаёт ограниченный контекст с собственными маршрутами, хуками и декораторами. Плагин можно вынести в пакет, протестировать отдельно и подключить с другим префиксом. Глобальный middleware так не изолировать: он либо применяется ко всем запросам, либо требует ручных проверок пути внутри функции.

---

## Практика: TaskFlow на Fastify

Вернёмся к TaskFlow из статей про [чистый HTTP-сервер](./http-server.md) и [Express](./express.md). Соберём то же API, но с контрактами на уровне маршрутов.

```js
// src/app.js
import Fastify from 'fastify';
import { tasksRoutes } from './routes/tasks.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 16 * 1024,
  });

  app.addSchema({
    $id: 'taskInput',
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      done: { type: 'boolean', default: false },
    },
  });

  app.addSchema({
    $id: 'task',
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      done: { type: 'boolean' },
    },
  });

  app.get('/health', async () => ({ ok: true }));

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: 'not found' });
  });

  app.setErrorHandler((error, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error({ err: error }, 'request failed');

    if (error.validation) {
      return reply.code(422).send({ error: 'validation failed' });
    }

    return reply.code(status).send({
      error: status >= 500 ? 'internal error' : error.message,
    });
  });

  app.register(tasksRoutes, { prefix: '/tasks' });

  return app;
}
```

```js
// src/routes/tasks.js
import { randomUUID } from 'node:crypto';

export async function tasksRoutes(app) {
  const tasks = [];

  app.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: { done: { type: 'boolean' } },
      },
      response: {
        200: { type: 'array', items: { $ref: 'task#' } },
      },
    },
  }, async (request) => {
    const { done } = request.query;
    return done === undefined
      ? tasks
      : tasks.filter((task) => task.done === done);
  });

  app.post('/', {
    schema: {
      body: { $ref: 'taskInput#' },
      response: { 201: { $ref: 'task#' } },
    },
  }, async (request, reply) => {
    const task = { id: randomUUID(), ...request.body };
    tasks.push(task);
    return reply.code(201).send(task);
  });
}
```

```js
// src/server.js
import { buildApp } from './app.js';

const app = await buildApp();
await app.listen({ port: 3000, host: '0.0.0.0' });
```

Что изменилось по сравнению с Express:

- валидация, приведение типов и сериализация описаны рядом с маршрутом, а не в отдельных middleware;
- общие схемы вынесены в `addSchema` и переиспользуются через `$ref`; дочерний плагин видит схемы родителя;
- логгер встроен: `logger: true` включает pino и request-id в каждом логе;
- `setErrorHandler` и `setNotFoundHandler` задают формат ошибок в одном месте;
- `buildApp()` отделён от `listen`, поэтому в тестах приложение поднимается без порта:

```js
const app = await buildApp();
const response = await app.inject({
  method: 'POST',
  url: '/tasks',
  payload: { title: 'первая задача' },
});
```

`app.inject()` — встроенный способ прогнать запрос через реальный роутинг, хуки и схемы без сети. Это заметно быстрее интеграционных тестов через `fetch` и не требует свободного порта.

Обратите внимание на `host: '0.0.0.0'`. По умолчанию Fastify слушает `127.0.0.1`, и в Docker-контейнере это означает, что снаружи порт недоступен. Express с `app.listen(3000)` ведёт себя иначе, поэтому при переносе такой баг всплывает уже на деплое.

---

## NestJS: модули и внедрение зависимостей

NestJS — противоположный полюс. Вместо минималистичного ядра он предлагает готовую архитектуру: модули, контроллеры, провайдеры, пайпы, guards, interceptors и фильтры. Под капотом по умолчанию работает Express, но HTTP-адаптер можно заменить на Fastify.

Единица структуры в Nest — модуль. Он описывает границы: что входит, что предоставляется наружу и что используется внутри. В примере ниже `TASKS_REPOSITORY` — символьный токен (`Symbol('TASKS_REPOSITORY')`), который позволяет внедрять интерфейс репозитория, не привязываясь к конкретному классу.

```ts
// tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TASKS_REPOSITORY } from './tasks.tokens';
import { PostgresTasksRepository } from './postgres-tasks.repository';

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    { provide: TASKS_REPOSITORY, useClass: PostgresTasksRepository },
  ],
  exports: [TasksService],
})
export class TasksModule {}
```

Четыре поля модуля отвечают за разные вещи:

- `imports` — другие модули, чьи экспортированные провайдеры нужны этому;
- `controllers` — классы, которые становятся маршрутами;
- `providers` — рецепты создания зависимостей для DI-контейнера;
- `exports` — то, что модуль отдаёт другим модулям.

Корневой `AppModule` импортирует фича-модули, и из этого графа Nest собирает приложение. Провайдер — это всё, что контейнер умеет создавать: сервис, репозиторий, фабрика, значение. Класс с зависимостями помечают `@Injectable()`, а зависимости принимают через конструктор:

```ts
@Injectable()
export class TasksService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasks: TasksRepository,
  ) {}

  findAll() {
    return this.tasks.findAll();
  }
}
```

Контейнер разрешает зависимости по типу или токену. Если тип известен из метаданных TypeScript, достаточно `private readonly tasks: TasksService`. Если нужен интерфейс, строковый или символьный токен, используют `@Inject(TASKS_REPOSITORY)`. Провайдер можно объявить через `useClass`, `useValue` или `useFactory` — последний удобен для асинхронной инициализации пула или конфигурации.

Зачем DI на сервере, если можно просто импортировать модуль? Причин три. Во-первых, зависимости становятся явными: сервис не ходит в глобальный синглтон, а получает его в конструктор. Во-вторых, в тестах контейнер подменяет реализацию через `overrideProvider`, и сервис проверяется без базы. В-третьих, контейнер управляет жизненным циклом: создаёт singleton один раз, вызывает `onModuleInit` и `onModuleDestroy`, закрывает ресурсы при остановке.

Цена тоже реальна. Граф зависимостей существует в рантайме, а не только в типах: забытый провайдер не поймает компилятор, приложение упадёт на старте. Декораторы и метаданные требуют TypeScript и сборки, а новичку приходится держать в голове, где искать провайдера и почему модуль не видит соседний экспорт.

---

## Контроллеры, провайдеры и пайпы

Контроллер переводит HTTP в вызов сервиса. Он объявляется декоратором `@Controller`, а методы — декораторами HTTP-методов:

```ts
// tasks/dto/create-task.dto.ts
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
```

```ts
// tasks/tasks.controller.ts
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(@Query('done') done?: string) {
    const parsed = done === undefined ? undefined : done === 'true';
    return this.tasks.findAll(parsed);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }
}
```

Сами по себе декораторы только описывают маршрут. Чтобы DTO действительно проверялся, нужен `ValidationPipe` — он опирается на пакеты `class-validator` и `class-transformer`:

```ts
// main.ts
const app = await NestFactory.create(AppModule);

app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

await app.listen(3000);
```

Флаги меняют поведение принципиально:

- `whitelist: true` удаляет из тела поля, которых нет в DTO;
- `forbidNonWhitelisted: true` вместо удаления возвращает `400` — строгий контракт;
- `transform: true` превращает plain object в экземпляр DTO и применяет преобразования типов.

Пайп — это не только валидация. Встроенные `ParseIntPipe`, `ParseUUIDPipe` и `ParseBoolPipe` преобразуют конкретный параметр и возвращают `400` при неверном формате. Пользовательский пайп реализует `PipeTransform` и может, например, превращать `?ids=1,2,3` в массив чисел. Пайп работает на уровне параметра, поэтому его легко применять точечно, не заводя глобальную схему на весь запрос.

Контроллер должен оставаться тонким: достать данные, вызвать сервис, вернуть результат. Бизнес-логика живёт в провайдере, доступ к базе — в репозитории. Если контроллер начинает проверять права, ходить в базу и собирать ответ вручную, DI и тесты теряют смысл: такой код снова зависит от HTTP-контекста.

---

## Guards, interceptors и exception filters

Nest разделяет сквозную логику на несколько типов компонентов. Это главное отличие от Express, где всё — middleware с `(req, res, next)`.

**Guard** отвечает на вопрос «можно ли выполнить этот обработчик». Он реализует `CanActivate` и возвращает boolean, промис или Observable:

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    return roles.includes(request.user?.role);
  }
}
```

```ts
@Post()
@Roles('admin')
@UseGuards(RolesGuard)
create(@Body() dto: CreateTaskDto) {
  return this.tasks.create(dto);
}
```

Здесь `@Roles` — это собственный декоратор поверх `SetMetadata('roles', roles)`, а `RolesGuard` читает метаданные через `Reflector`. Guard выполняется до пайпов, поэтому тело в нём ещё не проверено схемой. Если политика зависит от тела, её место — не guard, а сервис или пайп. Для аутентификации и RBAC это идеальный слой: заголовок и пользователь уже доступны, а обработчик ещё не начал работу.

**Interceptor** оборачивает обработчик и управляет потоком ответа. Он реализует `NestInterceptor` и работает с Observable:

```ts
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const started = performance.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Math.round(performance.now() - started);
        console.log(`${context.getClass().name}: ${ms}ms`);
      }),
    );
  }
}
```

Interceptor подходит для логирования, таймингов, кеширования, таймаутов и преобразования ответа. Он может изменить результат через `map`, выполнить побочное действие через `tap` или перехватить ошибку через `catchError`. В отличие от middleware, он знает, какой класс и метод обрабатывают запрос.

**Exception filter** ловит непойманные исключения и формирует ответ:

```ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      error: exception.message,
    });
  }
}
```

Фильтр срабатывает только на исключениях, которые никто не поймал. Если код обернул вызов в `try/catch` и погасил ошибку, фильтр её не увидит. Порядок поиска фильтра обратный привычному: сначала маршрутный, затем контроллерный, затем глобальный — и если маршрутный фильтр ошибку обработал, остальные её уже не получат.

---

## Жизненный цикл запроса в NestJS

Соберём компоненты в один маршрут. Порядок фиксирован и не зависит от того, как разложены файлы:

1. **Middleware** — глобальный, затем привязанный к модулям. Работает с `req` и `res` почти как в Express.
2. **Guards** — глобальные, контроллерные, маршрутные. Решают, допускать ли запрос.
3. **Interceptors (до обработчика)** — глобальные, контроллерные, маршрутные.
4. **Pipes** — глобальные, контроллерные, маршрутные, затем пайпы конкретных параметров. Валидируют и преобразуют вход.
5. **Обработчик контроллера** — вызывает сервис.
6. **Interceptors (после обработчика)** — в обратном порядке: маршрутные, контроллерные, глобальные.
7. **Exception filters** — маршрутные, контроллерные, глобальные, но только при непойманном исключении.
8. **Ответ клиенту.**

Из этого порядка следуют практические правила:

| Задача | Куда класть | Почему |
|---|---|---|
| request-id, логирование входа | middleware или interceptor | middleware видит сырой запрос, interceptor — контекст обработчика |
| аутентификация и RBAC | guard | выполняется до пайпов и обработчика |
| валидация и преобразование DTO | pipe | работает после guard, до бизнес-логики |
| таймаут, кеш, форма ответа | interceptor | оборачивает вызов и умеет менять поток |
| единый формат ошибок | exception filter | ловит всё непойманное в одном месте |
| подпись вебхука | middleware с raw body | нужен доступ к исходным байтам до парсинга |

Ошибка в middleware — особый случай: маршрут ещё не выбран, поэтому сработают только глобальные фильтры. Ошибка в guard или пайпе уже знает маршрут и может быть обработана более точным фильтром.

Многие вещи, которые в Express делают вручную, здесь разложены по фазам. Но это не отменяет базовых правил HTTP: если обработчик не вернул значение и не отправил ответ, запрос зависнет; если вызвать `@Res()` напрямую, Nest перестанет управлять ответом, и фильтры с interceptors могут не сработать.

---

## Производительность и накладные расходы

Fastify принято противопоставлять Express по скорости. Причины конкретные:

- роутер использует радикс-дерево и не перебирает маршруты по одному;
- схемы компилируются на старте, а не проверяются интерпретатором на каждом запросе;
- `fast-json-stringify` собирает ответ по известной схеме, не обходя объект вслепую;
- логгер pino и парсинг тела встроены, без лишних слоёв middleware.

В синтетических бенчмарках на простых JSON-ответах Fastify обычно обгоняет Express в 1,5–2 раза. На реальном сервисе разница почти всегда меньше: большую часть времени занимают база, внешние API и бизнес-логика, а не сериализация. Бенчмарк «hello world» показывает потолок фреймворка, а не скорость вашего приложения.

NestJS добавляет собственные накладные расходы: DI-контейнер, разрешение зависимостей, пайпы, guards и interceptors на каждом запросе, а также Express под капотом. На микробенчмарках Nest обычно медленнее голого Express, но на фоне похода в базу это редко заметно.

Самый дорогой режим — request-scoped провайдеры. По умолчанию провайдер — singleton: контейнер создаёт его один раз. С `Scope.REQUEST` экземпляр создаётся на каждый запрос, и этот scope «поднимается» по цепочке потребителей: если request-scoped сервис внедрён в контроллер, контроллер тоже становится request-scoped. Для хранения контекста запроса это иногда оправдано, но для обычных stateless-сервисов — лишняя работа и лишняя память.

Nest можно перевести на Fastify-адаптер из `@nestjs/platform-fastify`:

```ts
const app = await NestFactory.create(AppModule, new FastifyAdapter());
```

Приложение получит роутер, парсер и сериализатор Fastify, но слой Nest — guards, pipes, interceptors и DI — останется. Это разумный компромисс, если нужна архитектура Nest и скорость Fastify, но ждать производительности голого Fastify не стоит.

Измерять стоит своё приложение: p95 и p99 latency, event loop lag, потребление памяти и время старта. Для нагрузки подойдут autocannon или k6, для профилирования — `--inspect` и clinic. Подробнее — в статье «Производительность и память».

---

## Когда Express, когда Fastify, когда NestJS

| Критерий | Express | Fastify | NestJS |
|---|---|---|---|
| Порог входа | низкий | средний | высокий |
| Контракт API | вручную | схемы на маршруте | DTO и пайпы |
| Изоляция модулей | нет | плагины и контексты | модули и DI |
| Скорость | базовая | выше | зависит от адаптера |
| Экосистема | огромная | растущая, `@fastify/*` | официальные модули |
| Типизация | по желанию | хорошая | встроенная |

**Express** остаётся разумным выбором для небольшого API, MVP, легаси-сервиса и случаев, где важна совместимость с готовыми middleware. Его легко читать, он почти не навязывает структуру, а Express 5 наконец ловит ошибки из async-обработчиков. Обратная сторона — валидацию, права, логирование и формат ошибок команда проектирует сама.

**Fastify** выигрывает там, где API — публичный контракт. Схемы дают валидацию, приведение типов, сериализацию и OpenAPI из одного источника. Плагины изолируют инфраструктуру и прикладные модули, встроенный pino закрывает логирование, `inject()` упрощает тесты. Цена — дисциплина в схемах и понимание инкапсуляции: `fastify-plugin` не должен становиться способом «сделать всё глобальным».

**NestJS** выбирают для большого и долгого продукта: много доменов, несколько команд, требования к тестируемости и единым соглашениям. Модули и DI дают предсказуемые границы, guards и interceptors — готовые точки для auth, логирования и метрик. Цена — церемонии, TypeScript со сборкой, порог входа и старт приложения. Для сервиса из пяти эндпоинтов это почти всегда избыточно.

Гибрид тоже возможен: Nest на Fastify-адаптере даёт архитектуру Nest и транспорт Fastify. А миграцию с Express лучше делать постепенно — через API-gateway или отдельный сервис, а не переписывать всё сразу. Держать два фреймворка в одном процессе без веской причины не стоит: это удваивает способы делать одно и то же.

---

## Частые ошибки

- **Fastify: ответить дважды.** `reply.send()` в async-обработчике и возврат значения приводят к попытке отправить второй ответ.
- **Fastify: забыть `return reply` в хуке.** Досрочный ответ без возврата `reply` не останавливает цепочку.
- **Fastify: обернуть в `fastify-plugin` всё подряд.** Плагины теряют изоляцию, а декораторы конфликтуют в общем пространстве.
- **Fastify: удивиться пропавшим полям.** `response`-схема не сериализует то, чего в ней нет, а Ajv с `removeAdditional` молча удаляет лишнее.
- **Fastify: слушать `127.0.0.1` в контейнере.** Снаружи порт недоступен, пока не указан `host: '0.0.0.0'`.
- **Nest: забыть `@Injectable()`.** Класс с зависимостями не попадёт в контейнер или получит их `undefined`.
- **Nest: не зарегистрировать провайдера в модуле.** Ошибка появится в рантайме при старте, а не при компиляции.
- **Nest: читать тело в guard.** Guards выполняются до пайпов, поэтому DTO ещё не проверен и не преобразован.
- **Nest: сделать всё request-scoped.** Scope поднимается по цепочке и пересоздаёт часть графа на каждом запросе.
- **Nest: гасить ошибку в `try/catch`.** Exception filter увидит только непойманное исключение.
- **Nest: использовать `@Res()` без необходимости.** Прямой ответ обходит пайплайн Nest и ломает работу interceptors и фильтров.
- **Nest: не включить shutdown hooks.** Без `app.enableShutdownHooks()` `onModuleDestroy` не вызовется при `SIGTERM`, и пул соединений не закроется.

---

## Ключевые тезисы для интервью

- Fastify делает маршрут контрактом: схема валидирует вход, приводит типы, сериализует ответ и отсекает лишние поля.
- Хуки привязаны к стадиям запроса: в `onRequest` тела ещё нет, `preValidation` позволяет его изменить, `preHandler` работает после проверки схемы.
- `register` создаёт изолированный контекст с собственными маршрутами и хуками; `fastify-plugin` поднимает декораторы в родительский контекст и нужен только инфраструктуре.
- Модуль Nest — граница DI: `providers` описывают зависимости, `exports` открывает их другим модулям, контейнер собирает граф при старте и падает при пропущенном токене.
- В Nest сквозная логика разделена: middleware → guards → interceptors → pipes → handler → interceptors → filters; guard не видит валидированное тело.
- DI и request scope стоят денег: request-scoped провайдер создаётся на каждый запрос и поднимает scope по цепочке потребителей.
- Выбор фреймворка определяется контрактом, командой и сроком жизни продукта, а не синтетическим бенчмарком: Express — простота, Fastify — контракт и скорость, Nest — структура для большого приложения.

## Заключение

Express, Fastify и NestJS решают одну задачу разными способами. Express оставляет архитектуру команде, Fastify переносит контракт в маршрут и изолирует плагины, Nest строит приложение из модулей и DI. Первые два ближе к HTTP и работают с привычными `req`/`res`, третий добавляет полноценный фреймворк со своим жизненным циклом. Практический вывод прост: выбирайте инструмент под размер команды и срок жизни сервиса, а не под цифры из hello-world бенчмарка. Если сомневаетесь — начинайте с Fastify для нового API и с Express для небольшого легаси, а Nest берите, когда модулей и людей становится много.

## Полезные ссылки

- [Fastify: Getting Started](https://fastify.dev/docs/latest/Getting-Started/) — первый сервер, маршруты и плагины
- [Fastify: Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) — схемы, Ajv и `fast-json-stringify`
- [Fastify: Hooks](https://fastify.dev/docs/latest/Reference/Hooks/) — полный список хуков и порядок выполнения
- [Fastify: Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/) — контексты плагинов и область видимости
- [Fastify: Plugins](https://fastify.dev/docs/latest/Reference/Plugins/) — `register`, `fastify-plugin` и префиксы
- [NestJS: Modules](https://docs.nestjs.com/modules) — `imports`, `providers`, `exports`
- [NestJS: Providers](https://docs.nestjs.com/providers) — DI, токены и жизненный цикл
- [NestJS: Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle) — порядок middleware, guards, pipes и filters
- [NestJS: Guards](https://docs.nestjs.com/guards) — авторизация на уровне обработчика
- [NestJS: Interceptors](https://docs.nestjs.com/interceptors) — обёртка вызова и преобразование ответа
- [NestJS: Exception filters](https://docs.nestjs.com/exception-filters) — единый формат ошибок
- [Express и middleware](./express.md) — что именно заменяют Fastify и NestJS
- [HTTP-сервер на чистом Node](./http-server.md) — базовый слой, поверх которого работают фреймворки
