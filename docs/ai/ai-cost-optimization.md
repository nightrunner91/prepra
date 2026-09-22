---
title: "Кэширование и оптимизация стоимости"
section: ai
description: "Prompt caching, батчинг, выбор модели — как управлять экономикой LLM-запросов в продакшне"
order: 10
tags: ["prompt-caching", "cost-optimization", "batching", "model-selection", "monitoring"]
questions:
  - "Как работает prompt caching и когда он выгоден"
  - "Что нужно сделать чтобы кэш работал эффективно"
  - "Как батчинг запросов снижает стоимость"
  - "Как выбрать модель исходя из трейдоффа cost / quality / latency"
  - "Какие метрики важны для мониторинга стоимости в продакшне"
  - "Как структурировать промпты чтобы максимизировать cache hit rate"
  - "Когда оптимизация стоимости становится приоритетом"
---

# Кэширование и оптимизация стоимости

Предыдущая статья разобрала безопасность LLM-приложений — attack surface, специфичный для AI, и способы его закрытия. Но у безопасности есть экономическое измерение. Защита стоит токенов: canary tokens, фильтрация вывода, разделение контекста — всё это увеличивает длину промпта. А каждый токен — деньги. LLM-приложения масштабируются линейно с количеством токенов, и то, что на прототипе стоило копейки, в продакшне превращается в тысячи долларов в месяц. Оптимизация стоимости — не «сжать пояса после релиза». Это архитектурная дисциплина, которую нужно закладывать на этапе проектирования. Эта статья — о механизмах снижения затрат: prompt caching, батчинге, выборе модели и мониторинге расходов.

## Содержание

1. [Prompt caching: как работает и когда выгоден](#prompt-caching-как-работает-и-когда-выгоден)
2. [Структура промпта для максимального cache hit rate](#структура-промпта-для-максимального-cache-hit-rate)
3. [Батчинг запросов](#батчинг-запросов)
4. [Выбор модели: трейдофф cost / quality / latency](#выбор-модели-трейдофф-cost--quality--latency)
5. [Мониторинг стоимости в продакшне](#мониторинг-стоимости-в-продакшне)
6. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
7. [Заключение](#заключение)
8. [Полезные ссылки](#полезные-ссылки)

---

## Prompt caching: как работает и когда выгоден

### Что кэшируется

LLM-провайдеры (Anthropic, OpenAI, Google) поддерживают кэширование промптов. Идея: если несколько запросов начинаются с одинакового префикса, провайдер кэширует обработку этого префикса и при повторных запросах берёт результат из кэша.

```
Запрос 1: [system prompt (2K)] + [examples (1K)] + [user message₁ (200)] → полная обработка
Запрос 2: [system prompt (2K)] + [examples (1K)] + [user message₂ (200)] → кэш на первых 3K
Запрос 3: [system prompt (2K)] + [examples (1K)] + [user message₃ (200)] → кэш на первых 3K
```

Кэшируется не «ответ модели», а **precomputed KV-cache** — внутренние представления префикса, которые модель вычисляет один раз и переиспользует. Это не влияет на качество ответа: модель генерирует тот же результат, что и без кэша.

### Сколько стоит кэш

Типичная структура ценообразования (на примере Anthropic Claude):

| Тип токенов | Множитель | Пример (Sonnet) |
|---|---|---|
| Input без кэша | 1× | $3 / 1M токенов |
| Cache write | 1.25× | $3.75 / 1M токенов |
| Cache read (hit) | 0.1× | $0.30 / 1M токенов |
| Output | 5× (от input) | $15 / 1M токенов |

Первый запрос, который записывает кэш, стоит на 25% дороже обычного. Последующие запросы, которые читают кэш, стоят на 90% дешевле для кэшированной части.

```ts
// Расчёт стоимости с prompt caching
function calculateCachedCost(
  cacheWriteTokens: number,    // токены, записанные в кэш (первый запрос)
  cacheReadTokens: number,     // токены, читаемые из кэша (повторные запросы)
  uncachedInputTokens: number, // токены без кэша (меняющаяся часть)
  outputTokens: number,
  prices: {
    input: number;
    cacheWrite: number;
    cacheRead: number;
    output: number;
  },
): number {
  const writeCost = (cacheWriteTokens / 1_000_000) * prices.cacheWrite;
  const readCost = (cacheReadTokens / 1_000_000) * prices.cacheRead;
  const uncachedCost = (uncachedInputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;

  return writeCost + readCost + uncachedCost + outputCost;
}

// Пример: system prompt 2K токенов кэшируется, 100 запросов в день
const daily = calculateCachedCost(
  2_000,                    // cache write: один раз в день
  2_000 * 99,               // cache read: 99 оставшихся запросов
  500 * 100,                // uncached: user message + dynamic context
  2_000 * 100,              // output
  { input: 3, cacheWrite: 3.75, cacheRead: 0.30, output: 15 },
);
// Без кэша: (2000 + 500) * 100 / 1M * 3 + 200 * 100 / 1M * 15 = $0.75 + $0.30 = $1.05/день
// С кэшем: 2000/1M*3.75 + 2000*99/1M*0.30 + 500*100/1M*3 + 200*100/1M*15
//         = $0.0075 + $0.0594 + $0.15 + $0.30 = $0.52/день
// Экономия: ~50%
```

### Когда кэш выгоден

Кэш выгоден, когда:

1. **Большой статический префикс** — system prompt, few-shot примеры, описания инструментов. Чем больше кэшируемая часть, тем больше экономия.
2. **Много повторных запросов** — кэш окупается при повторном использовании. Один запрос — кэш не нужен.
3. **Стабильный префикс** — если префикс меняется между запросами, кэш не попадает (cache miss).

Кэш **не** выгоден, когда:

1. **Каждый запрос уникален** — нет повторяющегося префикса.
2. **Префикс маленький** — system prompt 200 токенов; накладные расходы на cache write не окупаются.
3. **Запросы единичные** — один запрос в час; кэш не успевает окупиться.

### TTL кэша

Кэш не вечен. У каждого провайдера свой TTL (time to live):

- **Anthropic** — 5 минут с последнего cache read. Каждый hit продлевает TTL.
- **OpenAI** — 5-10 минут (автоматический кэш для точных префиксов).
- **Google (Gemini)** — автоматический кэш с аналогичным TTL.

```ts
// Если между запросами проходит больше TTL — кэш истекает
// Запрос 1 в t=0: cache write
// Запрос 2 в t=3min: cache hit (TTL продлён до t=8min)
// Запрос 3 в t=9min: cache miss (TTL истёк в t=8min) → cache write снова

// Стратегия: поддерживать «heartbeat» — периодические запросы для продления TTL
// Если трафик неравномерный — добавляем фоновый запрос раз в TTL-1 минуту
```

### Явный и неявный кэш

**Anthropic** требует явного указания кэшируемых блоков через `cache_control`:

```ts
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: STATIC_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // явно кэшируем этот блок
        },
        {
          type: "text",
          text: currentUserMessage,
          // без cache_control — не кэшируется
        },
      ],
    },
  ],
});

// В ответе приходит usage с информацией о кэше:
// usage: {
//   cache_creation_input_tokens: 2000,  // записано в кэш
//   cache_read_input_tokens: 2000,      // прочитано из кэша
//   input_tokens: 500,                  // без кэша
//   output_tokens: 200,
// }
```

**OpenAI** кэширует автоматически для точных префиксов (с 2024 года). Не требует явного указания, но префикс должен совпадать побайтно.

### Что ломает кэш

Кэш работает на **префиксном совпадении**. Любое изменение в кэшируемой части — cache miss:

```ts
// ЛОМАЕТ КЭШ: динамическое содержимое в начале промпта
const badMessages = [
  {
    role: "system",
    content: `Ты — помощник. Сейчас ${new Date().toISOString()}. [инструкции]`,
    // Дата меняется каждую секунду → кэш не работает никогда
  },
  // ...
];

// ЛОМАЕТ КЭШ: разные порядок или форматирование
// "Ты — помощник.\nОтвечай кратко." ≠ "Ты — помощник. Отвечай кратко."
// Пробелы, переносы, порядок предложений — всё важно

// ЛОМАЕТ КЭШ: разные модели
// Кэш привязан к модели. claude-sonnet-4-6 и claude-haiku-4-5 — разные кэши
```

---

## Структура промпта для максимального cache hit rate

### Принцип: стабильное в начало, меняющееся в конец

Как показано в статье об управлении контекстом, порядок сообщений влияет на качество ответа. Но порядок влияет и на кэш-эффективность. Правило: **содержимое, которое не меняется между запросами — в начало; содержимое, которое меняется — в конец**.

```
┌─────────────────────────────────────────────────────────────────────┐
│  КЭШИРУЕМЫЙ ПРЕФИКС (не меняется)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. System prompt (инструкции, правила, ограничения)                │
│  2. Few-shot примеры                                                │
│  3. Описание инструментов (для агентов)                             │
│  4. Статические справочные данные                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ДИНАМИЧЕСКАЯ ЧАСТЬ (меняется каждый запрос)                        │
├─────────────────────────────────────────────────────────────────────┤
│  5. RAG-документы (зависят от запроса)                              │
│  6. История диалога (растёт с каждым сообщением)                    │
│  7. Текущее сообщение пользователя                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Структура для чат-приложения

```ts
// Оптимальная структура для чата с prompt caching
function buildCachedMessages(
  systemPrompt: string,          // статический
  fewShotExamples: string,       // статические
  toolDescriptions: string,      // статические
  history: Message[],            // динамическая
  retrievedDocs: string,         // динамическая
  currentMessage: string,        // динамическая
): Message[] {
  return [
    {
      role: "system",
      content: `${systemPrompt}\n\n${fewShotExamples}\n\n${toolDescriptions}`,
      // Весь system prompt — один кэшируемый блок
    },
    // История — динамическая, но растёт постепенно
    // При каждом новом сообщении кэш на system prompt сохраняется
    ...history,
    // RAG-документы — меняются каждый запрос
    { role: "user", content: `[Контекст]:\n${retrievedDocs}` },
    // Текущее сообщение — всегда в конце
    { role: "user", content: currentMessage },
  ];
}

// При вызове — помечаем system для кэширования (Anthropic)
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  messages: buildCachedMessages(/* ... */),
  // cache_control на system prompt
});
```

### Структура для агентных вызовов

Агентные вызовы — особый случай. Описание инструментов может быть большим (10-20 инструментов × 200 токенов = 2-4K токенов). Это идеальный кандидат на кэширование.

```ts
// Агент: описание инструментов — статическое, кэшируется
const toolDefinitions = [
  {
    name: "search",
    description: "Поиск по базе знаний",
    input_schema: { /* ... */ },
  },
  {
    name: "calculate",
    description: "Математические вычисления",
    input_schema: { /* ... */ },
  },
  // ... ещё 15 инструментов
];

// Каждый вызов агента:
// [system prompt + tool definitions] → кэш (4K токенов)
// [история + текущий запрос + результаты инструментов] → без кэша
```

### Антипаттерны, ломающие кэш

```ts
// 1. Динамическое в system prompt
const bad1 = `Ты — помощник. ID сессии: ${sessionId}. [инструкции]`;
// sessionId меняется → кэш ломается

// 2. Случайный порядок инструментов
const bad2 = tools.sort(() => Math.random() - 0.5);
// Случайный порядок → префикс не совпадает → cache miss

// 3. Форматирование с переменными
const bad3 = `
  Инструкция 1
  ${condition ? "Дополнительное правило" : ""}
  Инструкция 2
`;
// condition меняется → префикс меняется → cache miss

// ПРАВИЛЬНО: всё динамическое — после кэшируемого префикса
const good = {
  system: "Инструкция 1\nИнструкция 2", // всегда одинаковый
  user: `${condition ? "Дополнительное правило" : ""}\n${actualQuery}`,
};
```

### Кэш и summarization истории

В статье об управлении контексте рассматривалась summarization — сжатие старой истории в резюме. С точки зрения кэша: резюме — динамическая часть (оно меняется по мере роста истории). Но system prompt + few-shot примеры — стабильны.

```ts
// После summarization:
// [system prompt (2K)] → кэш hit (тот же, что и до summarization)
// [резюме истории (500)] → без кэша (меняется)
// [последние сообщения (2K)] → без кэша
// [текущий запрос (200)] → без кэша

// Итого: 2K из 4.7K — кэш hit (42%)
// Без кэша: 4.7K × цена input
// С кэшем: 2K × 0.1× цена + 2.7K × цена = 0.2K + 2.7K = 2.9K эквивалент
// Экономия: ~38%
```

---

## Батчинг запросов

### Что такое батчинг

Батчинг — объединение нескольких запросов в один вызов API для снижения стоимости. Некоторые провайдеры предлагают асинхронные API с 50% скидкой на батчевые запросы.

```ts
// OpenAI Batch API: 50% скидка, ответ в течение 24 часов
const batch = await openai.batches.create({
  input_file_id: fileId,  // файл с запросами
  endpoint: "/v1/chat/completions",
  completion_window: "24h",
});

// Файл содержит массив запросов:
// {"custom_id": "1", "method": "POST", "url": "/v1/chat/completions", "body": {...}}
// {"custom_id": "2", "method": "POST", "url": "/v1/chat/completions", "body": {...}}
// ...
```

### Когда батчинг применим

Батчинг подходит для задач, где latency не критична:

```ts
const batchSuitableTasks = [
  "Классификация набора документов (не в реальном времени)",
  "Генерация метаданных для загруженных файлов",
  "Массовая суммаризация (ночью, результат утром)",
  "Оценка качества (evals) — не интерактивная",
  "Индексация контента для RAG",
];

const batchUnsuitableTasks = [
  "Чат-приложение — пользователь ждёт ответ",
  "Автодополнение — latency должна быть < 1с",
  "Реалтайм-модерация — нужна мгновенная реакция",
];
```

### Внутренний батчинг (application-level)

Даже без API-батчинга можно группировать запросы на уровне приложения. Если несколько пользователей одновременно запрашивают генерацию — объединить в один вызов с параллельной обработкой.

```ts
// АНТИПАТТЕРН: каждый запрос — отдельный вызов API
async function handleRequestBad(requests: UserRequest[]) {
  // N запросов = N вызовов API = N × полная цена
  return Promise.all(requests.map(r => callModel(r.prompt)));
}

// ПАТТЕРН: группировка по идентичному промпту
async function handleRequestGrouped(requests: UserRequest[]) {
  // Группируем запросы с одинаковым system prompt
  const groups = groupBy(requests, r => r.systemPromptHash);

  return Promise.all(
    Array.from(groups.entries()).map(async ([_, group]) => {
      // Если провайдер поддерживает batch — отправляем группу батчем
      if (group.length >= BATCH_THRESHOLD) {
        return callBatch(group.map(r => r.prompt));
      }
      // Иначе — параллельно, но с общим кэшем на префикс
      return Promise.all(group.map(r => callModel(r.prompt)));
    }),
  );
}
```

### Батчинг для evals

Evals (из статьи об оценке) — идеальный кандидат на батчинг. Тысячи примеров нужно прогнать через модель, и latency не важна.

```ts
async function runEvalBatch(
  dataset: GoldenExample[],
  model: string,
): Promise<EvalResult[]> {
  // Разбиваем на батчи по 50-100 примеров
  const batches = chunk(dataset, 50);

  const results = await Promise.all(
    batches.map(async batch => {
      // Batch API — 50% скидка
      const batchId = await createBatch(
        batch.map(example => ({
          custom_id: example.id,
          prompt: buildEvalPrompt(example),
        })),
        model,
      );

      // Ждём завершения (до 24 часов)
      return await pollBatchResult(batchId);
    }),
  );

  return results.flat();
}
```

### Батчинг и rate limits

Батчинг не отменяет rate limits. Провайдеры ограничивают количество запросов в минуту (RPM) и токенов в минуту (TPM).

```ts
interface RateLimitConfig {
  requestsPerMinute: number;    // RPM
  tokensPerMinute: number;      // TPM
  concurrentRequests: number;   // параллельные запросы
}

// Батчинг помогает уложиться в rate limits:
// 1000 отдельных запросов → 1000 RPM → превышение лимита
// 1000 запросов в 20 батчах по 50 → 20 RPM → в пределах лимита

async function withRateLimit<T>(
  tasks: (() => Promise<T>)[],
  config: RateLimitConfig,
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...tasks];

  while (queue.length > 0) {
    const batch = queue.splice(0, config.concurrentRequests);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);

    // Пауза между батчами для соблюдения RPM
    if (queue.length > 0) {
      await sleep(60_000 / config.requestsPerMinute);
    }
  }

  return results;
}
```

---

## Выбор модели: трейдофф cost / quality / latency

### Модельный ряд и цены

Каждый провайдер предлагает линейку моделей с разным соотношением цена/качество:

```ts
// Условные цены и возможности (для иллюстрации трейдоффа)
const modelTiers = [
  {
    tier: "flagship",
    examples: ["Claude Opus", "GPT-4o"],
    inputPrice: 15,         // $/1M токенов
    outputPrice: 75,
    quality: "highest",
    latency: "slow",        // 5-15 секунд
    bestFor: "Сложные рассуждения, креативные задачи, многоступенчатые агентные цепочки",
  },
  {
    tier: "balanced",
    examples: ["Claude Sonnet", "GPT-4o-mini"],
    inputPrice: 3,
    outputPrice: 15,
    quality: "high",
    latency: "medium",      // 2-5 секунд
    bestFor: "Большинство продакшн-задач: чат, суммаризация, извлечение данных",
  },
  {
    tier: "fast",
    examples: ["Claude Haiku", "GPT-4o-nano"],
    inputPrice: 0.25,
    outputPrice: 1.25,
    quality: "good",
    latency: "fast",        // < 1 секунды
    bestFor: "Классификация, простая экстракция, автодополнение, модерация",
  },
];
```

Разница в цене — 60× между flagship и fast. При этом для 80% задач balanced-модель даёт достаточно качества.

### Маршрутизация запросов (model routing)

Не все запросы одинаково сложны. Маршрутизация — направление запроса к модели, соответствующей его сложности.

```ts
interface RoutingDecision {
  model: string;
  reason: string;
}

function routeRequest(query: string, context: RequestContext): RoutingDecision {
  // 1. Простые задачи — fast модель
  if (isSimpleClassification(query)) {
    return { model: "claude-haiku-4-5-20251001", reason: "Простая классификация" };
  }

  // 2. Задачи с кодом — balanced модель
  if (involvesCodeGeneration(query)) {
    return { model: "claude-sonnet-4-6", reason: "Генерация кода" };
  }

  // 3. Сложные рассуждения — flagship модель
  if (requiresComplexReasoning(query)) {
    return { model: "claude-opus-4-20250514", reason: "Многоступенчатое рассуждение" };
  }

  // По умолчанию — balanced
  return { model: "claude-sonnet-4-6", reason: "Стандартная задача" };
}

// Классификатор сложности можно обучить на основе данных
function isSimpleClassification(query: string): boolean {
  // Эвристики для быстрой оценки
  const simplePatterns = [
    /^classify/i,
    /^is this/i,
    /^yes or no/i,
    /\?(\s*)$/.test(query) && query.length < 100, // короткий вопрос
  ];
  return simplePatterns.some(p => typeof p === "boolean" ? p : p.test(query));
}
```

### Двухступенчатая генерация

Паттерн: fast модель генерирует черновик, balanced/flagship — проверяет и улучшает. Дешевле, чем сразу flagship.

```ts
async function twoStageGeneration(
  prompt: string,
  complexity: "low" | "medium" | "high",
): Promise<string> {
  // Этап 1: fast модель генерирует черновик
  const draft = await callModel("claude-haiku-4-5-20251001", {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
  });

  // Этап 2: для сложных задач — balanced модель улучшает
  if (complexity === "high") {
    const improved = await callModel("claude-sonnet-4-6", {
      messages: [
        {
          role: "system",
          content: "Улучши черновик ответа. Сохрани смысл, исправь ошибки, добавь детали.",
        },
        { role: "user", content: prompt },
        { role: "assistant", content: draft },
        { role: "user", content: "Улучши этот ответ." },
      ],
      max_tokens: 4096,
    });
    return improved;
  }

  // Для простых задач — черновик достаточно
  return draft;
}

// Стоимость:
// Только flagship: 10K input + 4K output = $0.45
// Двухступенчатый: (10K + 2K) × haiku + (12K + 4K) × sonnet
//                = $0.003 + $0.06 = $0.063
// Экономия: ~86% при сопоставимом качестве
```

### Fallback-цепочки

Если основная модель недоступна — fallback на альтернативную. Это не только про надёжность (разобрано в статье о безопасности), но и про стоимость.

```ts
async function callWithFallback(
  messages: Message[],
  primaryModel: string,
  fallbackModels: string[],
): Promise<ModelResponse> {
  try {
    return await callModel(primaryModel, messages);
  } catch (error) {
    for (const fallback of fallbackModels) {
      try {
        // Fallback может быть дешевле — но качество ниже
        return await callModel(fallback, messages);
      } catch {
        continue;
      }
    }
    throw new Error("All models unavailable");
  }
}

// Пример: primary = Sonnet ($3/1M), fallback = Haiku ($0.25/1M)
// Если Sonnet недоступен — Haiku продолжает работать
// Стоимость fallback-запросов — в 12× дешевле
```

### Когда flagship оправдан

Flagship-модели — не «всегда лучшие». Они оправданы, когда:

- **Задача требует многоступенчатых рассуждений** — математика, логические цепочки, планирование.
- **Креативная генерация** — маркетинговые тексты, истории, нестандартные решения.
- **Сложная дисамбигуация** — запрос неоднозначен, и нужно понять контекст.
- **Высокая цена ошибки** — юридические, медицинские, финансовые ответы.

Для 80% задач (классификация, извлечение данных, суммаризация, чат) balanced-модель даёт 90-95% качества flagship при 20% стоимости.

---

## Мониторинг стоимости в продакшне

### Что отслеживать

Без мониторинга стоимость выходит из-под контроля незаметно. Ключевые метрики:

```ts
interface CostMetrics {
  // Объёмные метрики
  totalTokensPerDay: number;         // общее потребление токенов
  inputTokensPerDay: number;         // входные токены
  outputTokensPerDay: number;        // выходные токены
  requestsPerDay: number;            // количество запросов

  // Стоимость
  dailyCost: number;                 // стоимость за день
  costPerRequest: number;            // средняя стоимость запроса
  costPerUser: number;               // стоимость на пользователя

  // Кэш-эффективность
  cacheHitRate: number;              // % токенов, прочитанных из кэша
  cacheWriteRate: number;            // % токенов, записанных в кэш
  cacheSavings: number;              // сэкономлено денег благодаря кэшу

  // Модельные метрики
  requestsByModel: Record<string, number>;  // распределение по моделям
  costByModel: Record<string, number>;      // стоимость по моделям
}
```

### Сбор метрик из API-ответов

Каждый ответ от LLM API содержит `usage` — информацию о потреблённых токенах.

```ts
interface APIUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// Middleware для сбора метрик
async function callModelWithTracking(
  messages: Message[],
  model: string,
  metadata: RequestMetadata,
): Promise<ModelResponse> {
  const startTime = Date.now();
  const response = await callModel(model, messages);
  const latency = Date.now() - startTime;

  const usage = response.usage;

  // Логируем метрики
  await recordMetrics({
    model,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    latency,
    userId: metadata.userId,
    feature: metadata.feature,         // какая фича вызвала запрос
    endpoint: metadata.endpoint,
  });

  return response;
}

// Агрегация в хранилище (Prometheus, Datadog, InfluxDB)
async function recordMetrics(metrics: RequestMetrics): Promise<void> {
  // Счётчики
  await increment("llm.requests.total", { model: metrics.model });
  await increment("llm.tokens.input", metrics.inputTokens, { model: metrics.model });
  await increment("llm.tokens.output", metrics.outputTokens, { model: metrics.model });
  await increment("llm.tokens.cache_read", metrics.cacheReadTokens);
  await increment("llm.tokens.cache_write", metrics.cacheWriteTokens);

  // Гистограммы
  await observe("llm.latency", metrics.latency, { model: metrics.model });

  // Стоимость (рассчитываем на стороне приложения)
  const cost = calculateCost(metrics);
  await increment("llm.cost.usd", cost, { model: metrics.model, feature: metrics.feature });
}
```

### Алёрты и бюджеты

```ts
interface BudgetConfig {
  dailyBudget: number;           // лимит в долларах в день
  monthlyBudget: number;         // лимит в долларах в месяц
  alertThresholds: number[];     // пороги алертов: 50%, 80%, 100%
  costPerRequestAlert: number;   // алерт если средний запрос дороже
}

// Бюджетный контроллер
class BudgetController {
  private config: BudgetConfig;
  private dailySpent = 0;
  private monthlySpent = 0;

  constructor(config: BudgetConfig) {
    this.config = config;
  }

  async trackRequest(cost: number): Promise<void> {
    this.dailySpent += cost;
    this.monthlySpent += cost;

    // Проверка порогов
    for (const threshold of this.config.alertThresholds) {
      if (this.dailySpent >= this.config.dailyBudget * threshold) {
        await sendAlert({
          level: threshold >= 1 ? "critical" : "warning",
          message: `Daily budget ${threshold * 100}% reached: $${this.dailySpent.toFixed(2)}`,
        });
      }
    }

    // Превышение дневного бюджета — блокируем запросы
    if (this.dailySpent >= this.config.dailyBudget) {
      throw new BudgetExceededError("Daily budget exceeded");
    }
  }

  // Проверка аномально дорогого запроса
  async checkAnomaly(cost: number, feature: string): Promise<void> {
    const avgCost = await getAverageCostPerRequest(feature);
    if (cost > avgCost * 5) {
      // Запрос в 5× дороже среднего — аномалия
      await sendAlert({
        level: "warning",
        message: `Anomalous cost for ${feature}: $${cost.toFixed(4)} (avg: $${avgCost.toFixed(4)})`,
      });
    }
  }
}
```

### Дашборд стоимости

Ключевые панели дашборда:

```ts
interface CostDashboard {
  // Панель 1: Общий расход
  overview: {
    today: number;           // потрачено сегодня
    thisMonth: number;       // потрачено в этом месяце
    projected: number;       // проекция на конец месяца
    budget: number;          // месячный бюджет
    utilization: number;     // projected / budget × 100%
  };

  // Панель 2: Распределение по фичам
  byFeature: {
    feature: string;
    requests: number;
    cost: number;
    avgCostPerRequest: number;
    percentage: number;      // % от общего расхода
  }[];

  // Панель 3: Кэш-эффективность
  cacheEfficiency: {
    hitRate: number;         // cache read / (cache read + cache write + uncached)
    savings: number;         // сколько сэкономлено благодаря кэшу
    trend: number[];         // hit rate по дням
  };

  // Панель 4: Модельное распределение
  modelDistribution: {
    model: string;
    requests: number;
    cost: number;
    avgQuality: number;      // из evals
  }[];
}
```

### Оптимизация на основе данных

Мониторинг даёт данные для решений:

```ts
// Анализ: какие фичи потребляют больше всего
async function analyzeCostDrivers(): Promise<CostInsight[]> {
  const features = await getFeatureBreakdown();

  return features
    .sort((a, b) => b.cost - a.cost)
    .map(f => {
      // Фича X потребляет 40% бюджета, но только 5% трафика
      if (f.percentage > 30 && f.requestPercentage < 10) {
        return {
          feature: f.feature,
          insight: "Высокая стоимость на запрос — проверить длину контекста",
          action: "audit_context_length",
        };
      }

      // Фича Y использует flagship для простых задач
      if (f.model === "flagship" && f.avgComplexity === "low") {
        return {
          feature: f.feature,
          insight: "Flagship модель для простых задач — перейти на balanced",
          action: "switch_to_balanced_model",
        };
      }

      // Фича Z имеет низкий cache hit rate
      if (f.cacheHitRate < 0.2) {
        return {
          feature: f.feature,
          insight: "Низкий cache hit rate — проверить структуру промпта",
          action: "optimize_prompt_structure",
        };
      }

      return {
        feature: f.feature,
        insight: "В норме",
        action: "none",
      };
    });
}
```

### Cost-per-request как архитектурный метрика

Cost per request — не только финансовая метрика, но и архитектурная. Если стоимость запроса растёт — что-то не так с архитектурой:

```ts
// Нормальное состояние:
// - chat: $0.005/запрос (5K input + 1K output)
// - summarization: $0.01/запрос (15K input + 2K output)
// - classification: $0.001/запрос (500 input + 50 output)

// Аномалии:
// - chat: $0.05/запрос → история не сжимается, контекст растёт
// - summarization: $0.10/запрос → RAG возвращает слишком много документов
// - classification: $0.01/запрос → используется flagship вместо haiku

// Автоматический детектор аномалий
function detectCostAnomaly(
  feature: string,
  currentCost: number,
  baseline: CostBaseline,
): AnomalyReport | null {
  const ratio = currentCost / baseline.avgCost;

  if (ratio > 3) {
    return {
      feature,
      severity: "high",
      message: `Cost 3× above baseline: $${currentCost.toFixed(4)} vs $${baseline.avgCost.toFixed(4)}`,
      possibleCauses: [
        "Контекст вырос — проверить сжатие истории",
        "Модель изменилась — проверить routing",
        "Кэш сломался — проверить структуру промпта",
      ],
    };
  }

  return null;
}
```

---

## Ключевые тезисы для интервью

- Prompt caching кэширует precomputed KV-cache префикса промпта; повторные запросы с тем же префиксом получают скидку ~90% на кэшированную часть; первый запрос (cache write) стоит на 25% дороже.
- Кэш работает на префиксном совпадении: любое изменение в кэшируемой части (дата, случайный порядок, условное содержимое) ломает cache hit.
- Структура промпта для максимального cache hit rate: стабильное в начало (system prompt, few-shot примеры, описания инструментов), меняющееся в конец (история, RAG, текущий запрос).
- TTL кэша — 5-10 минут; каждый cache read продлевает TTL; при неравномерном трафике нужен heartbeat для поддержания кэша.
- Батчинг (OpenAI Batch API) даёт 50% скидку на неинтерактивные задачи: evals, индексация, массовая классификация; для интерактивных задач (чат) батчинг неприменим.
- Модельный ряд провайдеров: flagship (сложные рассуждения, 60× дороже fast), balanced (большинство задач), fast (классификация, экстракция); 80% задач достаточно balanced.
- Model routing — направление запроса к модели по сложности; двухступенчатая генерация (fast → balanced) экономит до 86% при сопоставимом качестве.
- Мониторинг стоимости: метрики total tokens/day, cost per request, cache hit rate, распределение по фичам и моделям; алёрты при превышении бюджета и аномалиях.
- Budget controller: дневной/месячный лимит с порогами алертов (50%, 80%, 100%); при превышении — блокировка запросов.
- Cost per request — архитектурная метрика: рост стоимости сигнализирует о проблемах (история не сжимается, кэш сломался, модель не та).

---

## Заключение

Оптимизация стоимости LLM-приложений — не разовая акция, а непрерывный процесс. Без неё расходы растут линейно с трафиком и незаметно съедают бюджет. Механизмы оптимизации — prompt caching, батчинг, маршрутизация моделей — закладываются на этапе архитектуры, а не добавляются постфактум.

Ключевые выводы:

- **Prompt caching — самый простой и эффективный механизм** — 90% скидка на повторяющийся префикс; требует стабильной структуры промпта и явного указания кэшируемых блоков (Anthropic).
- **Структура промпта определяет cache hit rate** — стабильное в начало, меняющееся в конец; динамическое в system prompt ломает кэш.
- **Батчинг для неинтерактивных задач** — 50% скидка на evals, индексацию, массовую обработку; неприменим для чата и реалтайма.
- **Model routing — основной рычаг экономии** — 80% задач достаточно balanced-модели; flagship только для сложных рассуждений; двухступенчатая генерация экономит до 86%.
- **Мониторинг — обязательная часть продакшна** — метрики стоимости, cache hit rate, распределение по фичам; алёрты при аномалиях и превышении бюджета.
- **Cost per request — архитектурный сигнал** — рост стоимости на запрос означает проблему: раздутый контекст, сломанный кэш, неоптимальная модель.

---

## Полезные ссылки

- [Anthropic — Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — документация по кэшированию промптов: структура, TTL, pricing
- [OpenAI — Batch API](https://platform.openai.com/docs/guides/batch) — асинхронный API с 50% скидкой для неинтерактивных задач
- [OpenAI — Pricing](https://openai.com/api/pricing/) — актуальные цены на модели и токены
- [Anthropic — Pricing](https://www.anthropic.com/pricing) — цены Claude с разбивкой по типам токенов
- [Google — Gemini API Pricing](https://ai.google.dev/pricing) — цены Gemini с учётом контекстного окна
- [Portkey — LLM Cost Calculator](https://portkey.ai/pricing) — калькулятор стоимости LLM-запросов с учётом кэша
- [Helicone — LLM Observability](https://helicone.ai/) — мониторинг и аналитика LLM-запросов: стоимость, latency, кэш
- [LangSmith — LLM Monitoring](https://smith.langchain.com/) — трассировка и мониторинг LLM-цепочек от LangChain
