---
title: "Оценка и тестирование LLM-фич"
section: ai
description: "Evals, golden dataset, LLM-as-judge — как тестировать недетерминированный вывод и не деградировать качество при изменениях"
order: 8
tags: ["evals", "testing", "golden-dataset", "llm-as-judge", "human-in-the-loop", "regression"]
questions:
  - "Почему обычные unit-тесты не работают для LLM-вывода"
  - "Что такое evals и какие типы существуют"
  - "Как собрать и обслуживать golden dataset"
  - "Что такое LLM-as-judge и каковы его ограничения"
  - "Когда нужен human-in-the-loop в оценке"
  - "Как обнаруживать регрессии при изменении промптов"
  - "Как встроить evals в CI/CD pipeline"
---

# Оценка и тестирование LLM-фич

Предыдущая статья разобрала управление контекстом — стратегии, которые удерживают качество ответа при длинных сессиях. Но как понять, что качество вообще хорошее? В обычном коде тест отвечает на вопрос «работает или нет»: ожидаемое значение равно полученному. С LLM-выводом этот подход ломается — у одного запроса может быть десятки корректных ответов, и ни один из них не «единственно правильный». Эта статья — о том, как измерять качество недетерминированного вывода и не допускать регрессий при изменениях промптов, моделей и стратегий.

## Содержание

1. [Проблема: нет единственно правильного ответа](#проблема-нет-единственно-правильного-ответа)
2. [Типы evals: functional, semantic, regression](#типы-evals-functional-semantic-regression)
3. [Golden dataset: сборка и обслуживание](#golden-dataset-сборка-и-обслуживание)
4. [LLM-as-judge](#llm-as-judge)
5. [Human-in-the-loop](#human-in-the-loop)
6. [Evals в CI/CD pipeline](#evals-в-cicd-pipeline)
7. [Ключевые тезисы для интервью](#ключевые-тезисы-для-интервью)
8. [Заключение](#заключение)
9. [Полезные ссылки](#полезные-ссылки)

---

## Проблема: нет единственно правильного ответа

### Почему `expect(result).toBe(expected)` не работает

Обычный unit-тест проверяет детерминированный вывод: функция принимает аргументы и возвращает предсказуемый результат. LLM — недетерминирована. Один и тот же промпт при температуре > 0 даёт разные ответы при каждом запуске.

```ts
// Обычный тест — работает
test("parsePrice возвращает число", () => {
  expect(parsePrice("100₽")).toBe(100);
  expect(parsePrice("1 200₽")).toBe(1200);
});

// Тест для LLM — ломается при каждом запуске
test("классификатор определяет тональность", async () => {
  const result = await classify("Продукт отличный, мне нравится!");
  expect(result).toBe("positive"); // проходит 8 раз из 10
});
```

Проблема не в том, что модель «неправильная» — она правильно классифицирует текст. Но при температуре 0.7 она может ответить «positive», «pos», «Позитивный отзыв» или «positive sentiment» — и все четыре ответа корректны.

### Что именно тестируем

LLM-фича — это не один вызов API. Это цепочка: промпт → модель → парсинг ответа → интеграция с UI. Тестировать нужно каждый слой:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Промпт: правильно ли модель понимает задачу              │
│ 2. Вывод: корректен ли ответ (смысл, факты, формат)         │
│ 3. Парсинг: надёжно ли извлекаем структурированные данные    │
│ 4. Интеграция: работает ли фича целиком с пользователем      │
└──────────────────────────────────────────────────────────────┘
```

Каждый слой требует своего типа оценки.

### Источники нестабильности

LLM-вывод зависит от множества факторов, которые нужно контролировать:

- **Температура и sampling** — при температуре > 0 ответы варьируются. Для evals нужна воспроизводимость: температура 0 или фиксированный seed.
- **Версия модели** — провайдеры обновляют модели без изменения имени. `claude-sonnet-4-6` сегодня и через месяц — могут давать разные результаты.
- **Токенизация** — переформулировка промпта меняет токенизацию и влияет на вывод, даже если смысл не изменился.
- **Порядок сообщений** — как показано в статье об управлении контекстом, порядок влияет на внимание модели.

---

## Типы evals: functional, semantic, regression

### Functional evals: проверка корректности

Functional eval проверяет, что ответ модели соответствует функциональным требованиям. Не «похож ли ответ на ожидаемый», а «выполняет ли ответ задачу».

```ts
interface FunctionalEval {
  input: string;
  check: (response: string) => boolean;
  description: string;
}

const evals: FunctionalEval[] = [
  {
    input: "Извлеки email из текста: 'Напиши мне на ivan@example.com'",
    check: (response) => response.includes("ivan@example.com"),
    description: "Извлечение email — ответ содержит корректный адрес",
  },
  {
    input: "Классифицируй тональность: 'Ужасный сервис, больше не вернусь'",
    check: (response) => {
      const normalized = response.toLowerCase().trim();
      return normalized === "negative" || normalized === "neg";
    },
    description: "Классификация — ответ 'negative' или 'neg'",
  },
  {
    input: "Суммаризируй статью в 3 предложениях",
    check: (response) => {
      const sentences = response.split(/[.!?]+/).filter(s => s.trim());
      return sentences.length >= 2 && sentences.length <= 4;
    },
    description: "Суммаризация — от 2 до 4 предложений",
  },
];
```

Functional eval — это predicate: true/false. Он не оценивает качество, только проход/непроход. Хорошо работает для задач с чёткими критериями: извлечение данных, классификация, форматирование.

### Semantic evals: проверка смысла

Когда «правильный ответ» — это спектр, а не одно значение, нужна семантическая проверка. Ответ может быть корректным, но сформулированным иначе, чем ожидалось.

```ts
interface SemanticEval {
  input: string;
  reference: string;         // эталонный ответ (один из возможных)
  criteria: string;          // что оцениваем
}

const semanticEvals: SemanticEval[] = [
  {
    input: "Объясни, что такое замыкание в JavaScript",
    reference: "Замыкание — это функция, которая запоминает переменные из внешней области видимости, даже когда внешняя функция уже завершила выполнение",
    criteria: "Объяснение должно содержать: функция + внешняя область видимости + сохранение доступа после завершения",
  },
  {
    input: "Предложи решение для медленной загрузки страницы",
    reference: "Код-сплиттинг, ленивая загрузка изображений, кэширование статических ресурсов",
    criteria: "Предложение должно содержать конкретные технические решения, а не общие рекомендации",
  },
];
```

Семантическая проверка не может быть обычным `expect`. Нужен либо LLM-as-judge (оценит модель), либо human review. Об этом — ниже.

### Regression evals: защита от деградации

Regression eval — не проверяет «правильность». Он проверяет, что ответ не стал хуже после изменения. Базовая линия — текущий ответ модели, и будущие изменения не должны отклоняться от неё сильнее порога.

```ts
interface RegressionEval {
  input: string;
  baseline: string;          // ответ модели до изменений
  maxDrift: number;          // допустимое отклонение (0-1)
}

async function runRegressionEval(eval: RegressionEval): Promise<{
  pass: boolean;
  similarity: number;
}> {
  const newResponse = await callModel(eval.input);
  const similarity = await semanticSimilarity(newResponse, eval.baseline);

  return {
    pass: similarity >= (1 - eval.maxDrift),
    similarity,
  };
}

// Использование:
// Изменили system prompt → прогоняем regression evals
// Если similarity < 0.85 для критических кейсов — откатываем изменения
```

Regression eval — страховка при рефакторинге промптов. Не гарантирует, что стало лучше, но гарантирует, что не стало резко хуже.

### Комбинация типов

На практике evals комбинируют. Для одной фичи — набор из всех трёх типов:

```ts
interface EvalSuite {
  name: string;
  functional: FunctionalEval[];    // проход/непроход
  semantic: SemanticEval[];         // оценка качества
  regression: RegressionEval[];     // защита от деградации
}

const summarizationSuite: EvalSuite = {
  name: "Суммаризация статей",
  functional: [
    {
      input: "Суммаризируй в 3 предложениях: [текст]",
      check: (r) => countSentences(r) >= 2 && countSentences(r) <= 4,
      description: "Длина ответа — 2-4 предложения",
    },
    {
      input: "Суммаризируй: [текст с числами]",
      check: (r) => containsNumbers(r),
      description: "Числовые данные сохранены в резюме",
    },
  ],
  semantic: [
    {
      input: "Суммаризируй: [длинная статья]",
      reference: "Ключевые тезисы статьи...",
      criteria: "Сохранены основные тезисы, нет выдуманных фактов",
    },
  ],
  regression: [
    {
      input: "Суммаризируй: [текст]",
      baseline: "Предыдущий хороший ответ модели",
      maxDrift: 0.2,
    },
  ],
};
```

---

## Golden dataset: сборка и обслуживание

### Что такое golden dataset

Golden dataset — набор размеченных примеров: вход → ожидаемый выход. Это «эталонная правда» для тестирования. Для LLM-фич это не один фиксированный ответ, а набор допустимых ответов или критериев оценки.

```ts
interface GoldenExample {
  id: string;
  input: string;
  expectedOutputs: string[];     // несколько допустимых ответов
  criteria: string;              // что делает ответ корректным
  tags: string[];                // для фильтрации и группировки
  difficulty: "easy" | "medium" | "hard";
  source: string;                // откуда взялся пример
}

const goldenDataset: GoldenExample[] = [
  {
    id: "classify-001",
    input: "Продукт превзошёл все ожидания, рекомендую!",
    expectedOutputs: ["positive", "pos"],
    criteria: "Классификация: позитивный отзыв",
    tags: ["classification", "sentiment"],
    difficulty: "easy",
    source: "Ручная разметка, 2024-03-15",
  },
  {
    id: "classify-002",
    input: "Ну такое, вроде нормально, но могло быть и лучше",
    expectedOutputs: ["neutral", "mixed"],
    criteria: "Классификация: нейтральный или смешанный отзыв",
    tags: ["classification", "sentiment", "edge-case"],
    difficulty: "hard",
    source: "Edge case из продакшн-логов, 2024-04-02",
  },
];
```

### Источники примеров

Golden dataset собирается из нескольких источников. Каждый даёт свои сильные стороны:

**Ручная разметка.** Эксперт определяет вход и ожидаемый выход. Высокое качество, но дорого и медленно. 50-100 примеров — реалистичный объём для ручного сбора.

```ts
// Ручная разметка: эксперт создаёт примеры
const manualExamples: GoldenExample[] = [
  {
    id: "manual-001",
    input: "Как типизировать функцию, которая может вернуть ошибку?",
    expectedOutputs: [
      "Используйте Result-паттерн: type Result<T> = { ok: true; value: T } | { ok: false; error: Error }",
      "Возвращайте union type: function parse(): number | Error",
    ],
    criteria: "Предложен типобезопасный способ обработки ошибок",
    tags: ["typescript", "error-handling"],
    difficulty: "medium",
    source: "Ручная разметка, senior developer",
  },
];
```

**Продакшн-логи.** Реальные запросы пользователей — бесконечный источник примеров. Но их нужно фильтровать и размечать.

```ts
// Извлечение примеров из продакшн-логов
interface ProductionLog {
  input: string;
  modelOutput: string;
  userFeedback?: "thumbs_up" | "thumbs_down";
  timestamp: string;
}

function extractFromLogs(
  logs: ProductionLog[],
  minFeedback: number,
): GoldenExample[] {
  return logs
    .filter(log => log.userFeedback === "thumbs_up")
    .slice(0, minFeedback)
    .map((log, i) => ({
      id: `prod-${i}`,
      input: log.input,
      expectedOutputs: [log.modelOutput],
      criteria: "Ответ, который пользователь оценил положительно",
      tags: ["production", "user-approved"],
      difficulty: "medium" as const,
      source: `Продакшн-логи, ${log.timestamp}`,
    }));
}
```

**Синтетическая генерация.** LLM генерирует примеры для тестирования. Быстро и дёшево, но требует валидации.

```ts
async function generateSyntheticExamples(
  taskDescription: string,
  count: number,
): Promise<GoldenExample[]> {
  const prompt = `Сгенерируй ${count} примеров для задачи: ${taskDescription}.
Для каждого примера укажи:
- input: входные данные
- expected: корректный ответ
- edge_case: является ли это граничным случаем

Формат: JSON-массив`;

  const response = await callModel(prompt);
  const examples = JSON.parse(response);

  // Синтетические примеры ОБЯЗАТЕЛЬНО проходят human review
  return examples.map((ex: any, i: number) => ({
    id: `synthetic-${i}`,
    input: ex.input,
    expectedOutputs: [ex.expected],
    criteria: ex.edge_case ? "Граничный случай" : "Стандартный пример",
    tags: ["synthetic"],
    difficulty: ex.edge_case ? "hard" as const : "medium" as const,
    source: "Синтетическая генерация — требует валидации",
  }));
}
```

### Размер dataset

Сколько примеров нужно? Зависит от задачи:

- **Простая классификация** (2-5 классов) — 50-100 примеров, включая edge cases.
- **Извлечение данных** (email, даты, имена) — 100-200 примеров с вариативностью форматов.
- **Генерация текста** (суммаризация, перевод) — 200-500 примеров, потому что пространство возможных ответов шире.
- **Сложные задачи** (рассуждения, многоступенчатые) — 50-100 примеров, но с тщательной ручной разметкой.

Правило: лучше 50 хорошо размеченных примеров, чем 500 с шумом.

### Обслуживание dataset

Golden dataset — не «собрал и забыл». Он требует обслуживания:

```ts
interface DatasetMaintenance {
  // Регулярная проверка: модель всё ещё проходит эти примеры?
  scheduleStalenessCheck: (dataset: GoldenExample[], maxAgeDays: number) => {
    stale: GoldenExample[];   // примеры, которые модель перестала проходить
    fresh: GoldenExample[];   // примеры, которые модель всё ещё проходит
  };

  // Добавление новых примеров из продакшн-логов
  addFromProduction: (newLogs: ProductionLog[]) => {
    added: number;
    duplicates: number;       // уже есть в dataset
  };

  // Удаление устаревших примеров
  removeOutdated: (dataset: GoldenExample[], criteria: string) => {
    removed: number;
    reason: string;
  };
}
```

Когда обновлять dataset:

- **Модель обновлена** — прогнать dataset, проверить, не деградировали ли результаты.
- **Промпт изменён** — добавить примеры, которые проверяют новое поведение.
- **Обнаружены ошибки в продакшне** — каждый баг → новый пример в dataset.
- **Расширение функциональности** — фича научилась новому → добавить примеры.

---

## LLM-as-judge

### Идея

Вместо человека оценивает другая LLM. Одну модель просим сгенерировать ответ, другую — оценить его качество по заданным критериям.

```ts
interface JudgeConfig {
  input: string;
  response: string;
  criteria: string;
  scale: number;           // шкала оценки, например 1-5
}

async function llmAsJudge(config: JudgeConfig): Promise<{
  score: number;
  reasoning: string;
}> {
  const prompt = `Ты — оценщик качества ответов AI-модели.

Входные данные пользователя:
${config.input}

Ответ модели:
${config.response}

Критерии оценки:
${config.criteria}

Оцени ответ по шкале от 1 до ${config.scale}.
Верни JSON: { "score": число, "reasoning": "объяснение оценки" }`;

  const response = await callModel(prompt, { temperature: 0 });
  return JSON.parse(response);
}

// Использование
const judgment = await llmAsJudge({
  input: "Объясни разницу между let и var в JavaScript",
  response: "let имеет блочную область видимости, var — функциональную. let не поднимается (hoisting), var поднимается.",
  criteria: "Объяснение должно точно описывать разницу в области видимости и hoisting. Допускаются примеры кода.",
  scale: 5,
});
// { score: 5, reasoning: "Полный и точный ответ: упомянута блочная vs функциональная область видимости и hoisting." }
```

### Преимущества

- **Масштабируемость** — один вызов API стоит копейки; human review — доллары за час.
- **Скорость** — оценка за секунды, не дни.
- **Воспроизводимость** — при температуре 0 один и тот же ответ получает одну и ту же оценку (в большинстве случаев).

### Ограничения

LLM-as-judge — не серебряная пуля. У него есть системные проблемы:

**Position bias.** Модель предпочитает ответ, который стоит первым (или последним) при сравнении двух вариантов.

```ts
// Position bias: при сравнении A и B модель чаще выбирает A
// если поменять местами — выберет B, даже если содержимое не изменилось
async function compareWithPositionSwap(a: string, b: string): Promise<number> {
  const ab = await judgeCompare(a, b);  // A первым
  const ba = await judgeCompare(b, a);  // B первым

  // Если ab > 0.5 и ba < 0.5 — есть position bias
  // Усредняем для компенсации:
  return (ab + (1 - ba)) / 2;
}
```

**Self-enhancement bias.** Модель предпочитает ответы, сгенерированные ей же (или моделью того же семейства).

**Verbosity bias.** Более длинные ответы оцениваются выше, даже если они не точнее коротких.

```ts
// Компенсация verbosity bias: явно указываем в критериях
const criteria = `Оцени ТОЛЬКО корректность и полноту ответа.
Длина ответа НЕ влияет на оценку. Краткий, но точный ответ
должен получить такую же оценку, как развёрнутый, но equally точный.`;
```

**Calibration drift.** Со временем модель-судья может менять шкалу. То, что месяц назад оценивалось на 4, сегодня может оцениваться на 3 — не потому что ответ стал хуже, а потому что модель обновилась.

### Когда LLM-as-judge работает

- **Много примеров** — тысячи, где human review невозможен.
- **Относительное сравнение** — «этот промпт лучше того» — модель оценивает лучше, чем абсолютную шкалу.
- **Быстрая итерация** — нужно проверить 10 вариантов промпта за час.

### Когда LLM-as-judge не работает

- **Фактическая точность** — модель не знает, какой ответ фактически верен, если это не в её обучающих данных.
- **Тонкие нюансы** — сарказм, культурный контекст, domain-specific экспертиза.
- **Абсолютная калибровка** — «оцени от 1 до 5» — модель плохо калибрует абсолютные шкалы.

### Pairwise comparison

Более надёжный вариант LLM-as-judge — не абсолютная оценка, а попарное сравнение.

```ts
async function pairwiseCompare(
  input: string,
  responseA: string,
  responseB: string,
): Promise<{ winner: "A" | "B" | "tie"; confidence: number }> {
  const prompt = `Сравни два ответа на один вопрос.

Вопрос: ${input}

Ответ A:
${responseA}

Ответ B:
${responseB}

Какой ответ лучше? Верни JSON:
{ "winner": "A" | "B" | "tie", "confidence": 0.0-1.0 }

Оценивай по критериям: корректность, полнота, ясность.
Игнорируй длину ответа — короткий точный ответ лучше длинного размытого.`;

  return await callModel(prompt, { temperature: 0 });
}

// Для надёжности — прогоняем 3 раза и берём majority vote
async function robustCompare(
  input: string,
  a: string,
  b: string,
): Promise<string> {
  const results = await Promise.all([
    pairwiseCompare(input, a, b),
    pairwiseCompare(input, b, a),  // меняем порядок
    pairwiseCompare(input, a, b),
  ]);

  const aWins = results.filter(r =>
    (r.winner === "A" && results.indexOf(r) !== 1) ||
    (r.winner === "B" && results.indexOf(r) === 1)
  ).length;

  return aWins >= 2 ? "A" : "B";
}
```

---

## Human-in-the-loop

### Когда нужен человек

LLM-as-judge масштабируется, но не заменяет человеческую оценку полностью. Human review нужен:

- **Калибровка LLM-as-judge** — проверить, что оценки модели совпадают с человеческими.
- **Edge cases** — граничные случаи, где модель-судья ошибается.
- **Новая фича** — перед запуском нужно определить, что вообще считать хорошим ответом.
- **Продакшн-инциденты** — когда модель выдаёт неожиданные результаты, человек разбирается в причине.

### Структура human review

```ts
interface ReviewTask {
  id: string;
  input: string;
  modelOutput: string;
  reviewDimensions: {
    correctness: 1 | 2 | 3 | 4 | 5;    // фактическая точность
    completeness: 1 | 2 | 3 | 4 | 5;   // полнота ответа
    relevance: 1 | 2 | 3 | 4 | 5;      // соответствие запросу
    safety: "pass" | "fail";            // безопасность
  };
  reviewerNotes: string;
  reviewerId: string;
}

// Интерфейс для ревьюера
interface ReviewQueue {
  tasks: ReviewTask[];
  assignTask: (reviewerId: string) => ReviewTask;
  submitReview: (taskId: string, review: ReviewTask) => void;
}
```

### Межэкспертная согласованность

Если два ревьюера оценивают один и тот же ответ, их оценки должны совпадать. Если не совпадают — критерии недостаточно чёткие.

```ts
function interAnnotatorAgreement(
  reviews: { reviewer1: number; reviewer2: number }[],
): number {
  // Cohen's kappa — стандартная метрика согласованности
  const n = reviews.length;
  const mean1 = reviews.reduce((s, r) => s + r.reviewer1, 0) / n;
  const mean2 = reviews.reduce((s, r) => s + r.reviewer2, 0) / n;

  // Простая корреляция как аппроксимация
  let covariance = 0;
  let var1 = 0;
  let var2 = 0;

  for (const r of reviews) {
    covariance += (r.reviewer1 - mean1) * (r.reviewer2 - mean2);
    var1 += (r.reviewer1 - mean1) ** 2;
    var2 += (r.reviewer2 - mean2) ** 2;
  }

  return covariance / (Math.sqrt(var1) * Math.sqrt(var2));
  // > 0.8 — хорошая согласованность, критерии чёткие
  // < 0.6 — критерии размыты, нужна уточняющая документация
}
```

### Active learning: что отдавать на ревью

Ревьюить всё — дорого. Active learning выбирает примеры, где модель неуверенна или где оценки расходятся.

```ts
interface ActiveLearningConfig {
  disagreementThreshold: number;  // порог расхождения оценок
  confidenceThreshold: number;    // порог уверенности модели
}

function selectForReview(
  examples: EvalResult[],
  config: ActiveLearningConfig,
): EvalResult[] {
  return examples.filter(ex => {
    // Модель-судья дала низкую оценку — стоит проверить
    if (ex.judgeScore <= 2) return true;

    // Два прогона дали разные результаты — нестабильность
    if (Math.abs(ex.run1Score - ex.run2Score) > config.disagreementThreshold) {
      return true;
    }

    // Случайная выборка для калибровки (5% от всех)
    if (Math.random() < 0.05) return true;

    return false;
  });
}
```

---

## Evals в CI/CD pipeline

### Интеграция с CI

Evals — не разовая акция, а часть CI/CD. Каждое изменение промпта, модели или стратегии проходит через eval suite.

```ts
// eval-runner.ts — скрипт для CI
interface EvalResult {
  evalId: string;
  type: "functional" | "semantic" | "regression";
  pass: boolean;
  score?: number;
  details: string;
}

async function runEvalSuite(suite: EvalSuite): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: EvalResult[];
}> {
  const results: EvalResult[] = [];

  // Functional evals — быстрый pass/fail
  for (const eval of suite.functional) {
    const response = await callModel(eval.input, { temperature: 0 });
    const pass = eval.check(response);
    results.push({
      evalId: eval.input.slice(0, 50),
      type: "functional",
      pass,
      details: pass ? "OK" : `Failed: ${eval.description}`,
    });
  }

  // Regression evals — сравнение с baseline
  for (const eval of suite.regression) {
    const response = await callModel(eval.input, { temperature: 0 });
    const similarity = await semanticSimilarity(response, eval.baseline);
    const pass = similarity >= (1 - eval.maxDrift);
    results.push({
      evalId: eval.input.slice(0, 50),
      type: "regression",
      pass,
      score: similarity,
      details: pass ? `Similarity: ${similarity.toFixed(2)}` : `Drift: ${(1 - similarity).toFixed(2)} > ${eval.maxDrift}`,
    });
  }

  // Semantic evals — LLM-as-judge (дороже, медленнее)
  for (const eval of suite.semantic) {
    const response = await callModel(eval.input, { temperature: 0 });
    const judgment = await llmAsJudge({
      input: eval.input,
      response,
      criteria: eval.criteria,
      scale: 5,
    });
    const pass = judgment.score >= 4;
    results.push({
      evalId: eval.input.slice(0, 50),
      type: "semantic",
      pass,
      score: judgment.score,
      details: judgment.reasoning,
    });
  }

  const passed = results.filter(r => r.pass).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
```

### Пороги прохождения

Не все evals одинаково критичны. Определяем пороги:

```ts
interface EvalThresholds {
  functional: number;    // % functional evals, которые должны пройти
  semantic: number;      // средний балл semantic evals
  regression: number;    // % regression evals без деградации
}

const thresholds: EvalThresholds = {
  functional: 1.0,    // 100% — ни один functional eval не должен провалиться
  semantic: 3.5,      // средний балл не ниже 3.5 из 5
  regression: 0.95,   // 95% regression evals — без значимой деградации
};

function evaluateResults(
  results: EvalResult[],
  thresholds: EvalThresholds,
): { pass: boolean; report: string } {
  const functional = results.filter(r => r.type === "functional");
  const semantic = results.filter(r => r.type === "semantic");
  const regression = results.filter(r => r.type === "regression");

  const functionalPass =
    functional.filter(r => r.pass).length / functional.length >= thresholds.functional;

  const semanticAvg =
    semantic.reduce((s, r) => s + (r.score ?? 0), 0) / semantic.length;
  const semanticPass = semanticAvg >= thresholds.semantic;

  const regressionPass =
    regression.filter(r => r.pass).length / regression.length >= thresholds.regression;

  const pass = functionalPass && semanticPass && regressionPass;

  return {
    pass,
    report: `
Functional: ${functional.filter(r => r.pass).length}/${functional.length} (${functionalPass ? "OK" : "FAIL"})
Semantic avg: ${semanticAvg.toFixed(1)}/5 (${semanticPass ? "OK" : "FAIL"})
Regression: ${regression.filter(r => r.pass).length}/${regression.length} (${regressionPass ? "OK" : "FAIL"})
    `.trim(),
  };
}
```

### Snapshot-тестирование для промптов

Промпты — такой же код, как функции. Их изменения нужно отслеживать и ревьюить.

```ts
// prompts/classifier.ts
export const classifierPrompt = `Ты — классификатор тональности.
Определи тональность отзыва: positive, negative, neutral.
Верни ТОЛЬКО одно слово: positive, negative или neutral.`;

// prompts/__snapshots__/classifier.test.ts.snap
// Snapshot-тест: если промпт изменился — тест падает, ревьюер видит diff
test("classifier prompt не изменился случайно", () => {
  expect(classifierPrompt).toMatchSnapshot();
});
```

Snapshot-тест ловит случайные изменения промпта. Если изменение намеренное — обновляем snapshot и прогоняем eval suite.

### Monitoring в продакшне

Evals не заканчиваются на CI. В продакшне нужно мониторить качество вывода:

```ts
interface ProductionMonitor {
  // Сэмплирование ответов для периодической оценки
  sampleRate: number;           // 1-5% запросов

  // Метрики для отслеживания
  metrics: {
    avgResponseTime: number;
    errorRate: number;
    userFeedbackScore: number;  // из thumbs up/down
    evalPassRate: number;       // % проходящих evals из сэмлов
  };

  // Алерты
  alerts: {
    evalPassRateBelow: number;  // алерт если pass rate < порога
    errorRateAbove: number;     // алерт если ошибки > порога
  };
}

// Периодическая оценка продакшн-сэмплов
async function monitorProductionQuality(
  samples: ProductionSample[],
  evalSuite: EvalSuite,
): Promise<ProductionMonitor["metrics"]> {
  const evalResults = await runEvalSuite({
    ...evalSuite,
    // Подменяем input на реальные продакшн-входы
    functional: evalSuite.functional.map(e => ({
      ...e,
      input: samples[Math.floor(Math.random() * samples.length)].input,
    })),
  });

  return {
    avgResponseTime: mean(samples.map(s => s.latency)),
    errorRate: samples.filter(s => s.error).length / samples.length,
    userFeedbackScore: mean(samples.filter(s => s.feedback).map(s => s.feedback === "up" ? 1 : 0)),
    evalPassRate: evalResults.passed / evalResults.total,
  };
}
```

### Полный pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. PR с изменением промпта                                             │
│     ↓                                                                   │
│  2. Snapshot-тест: промпт изменился? → ревьювер видит diff             │
│     ↓                                                                   │
│  3. Functional evals: все прошли? → PASS/FAIL                          │
│     ↓                                                                   │
│  4. Regression evals: деградация < порога? → PASS/FAIL                 │
│     ↓                                                                   │
│  5. Semantic evals (LLM-as-judge): средний балл > порога? → PASS/FAIL │
│     ↓                                                                   │
│  6. Если всё PASS → merge                                               │
│     Если FAIL → block merge, показать отчёт                             │
│     ↓                                                                   │
│  7. После деплоя: monitoring — сэмплирование + метрики                  │
│     ↓                                                                   │
│  8. Если evalPassRate < порога → алерт, possible rollback              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Ключевые тезисы для интервью

- LLM-вывод недетерминирован — обычный `expect(result).toBe(expected)` не работает; один промпт даёт разные корректные ответы при каждом запуске.
- Три типа evals: functional (pass/fail по чётким критериям), semantic (оценка смысла через LLM-as-judge или human review), regression (защита от деградации относительно baseline).
- Golden dataset — размеченные примеры: вход + допустимые ответы + критерии; собирается из ручной разметки, продакшн-логов и синтетической генерации.
- Размер dataset: 50-100 для классификации, 100-200 для извлечения данных, 200-500 для генерации текста; лучше 50 хорошо размеченных, чем 500 с шумом.
- LLM-as-judge — масштабная оценка через другую модель; работает для относительного сравнения, но страдает от position bias, self-enhancement bias, verbosity bias.
- Pairwise comparison с position swap — более надёжный вариант LLM-as-judge, компенсирующий position bias.
- Human-in-the-loop нужен для калибровки LLM-as-judge, edge cases, определения критериев для новых фич и разбора продакшн-инцидентов.
- Межэкспертная согласованность (inter-annotator agreement) — если ревьюеры не согласны, критерии размыты и нуждаются в уточнении.
- Evals в CI/CD: snapshot-тесты для промптов → functional evals → regression evals → semantic evals; пороги определяют, block merge или pass.
- Monitoring в продакшне: сэмплирование 1-5% запросов, периодический прогон evals, алерты при деградации pass rate.

---

## Заключение

Тестирование LLM-фич — не «unit-тесты, но сложнее». Это отдельная дисциплина с собственными паттернами, метриками и инструментами. Обычные тесты проверяют детерминированный вывод; evals проверяют недетерминированный, и это фундаментальное различие.

Ключевые выводы:

- **Нет единственно правильного ответа** — LLM-вывод вариативен; тесты должны это учитывать, проверяя свойства ответа, а не точное совпадение.
- **Три типа evals покрывают разные аспекты** — functional для чётких критериев, semantic для смысла, regression для защиты от деградации.
- **Golden dataset — фундамент оценки** — хорошо собранный и обслуживаемый dataset важнее сложной инфраструктуры evals.
- **LLM-as-judge масштабируется, но не заменяет человека** — position bias, verbosity bias и calibration drift требуют калибровки через human review.
- **Evals в CI/CD — не опция** — каждое изменение промпта должно проходить через eval suite; snapshot-тесты ловят случайные изменения, пороги определяют pass/fail.
- **Monitoring не заканчивается на деплое** — продакшн-сэмплирование и алерты обнаруживают деградацию, которую не поймали в CI.

Следующая статья — безопасность LLM-приложений — рассматривает attack surface, специфичный для AI: prompt injection, data leakage и trust boundaries.

---

## Полезные ссылки

- [OpenAI Evals](https://github.com/openai/evals) — фреймворк для написания и запуска evals от OpenAI
- [Anthropic — Evaluating AI Systems](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) — руководство по оценке и снижению hallucination
- [Braintrust](https://www.braintrust.dev/) — платформа для evals и мониторинга LLM-приложений
- [Promptfoo](https://promptfoo.dev/) — open-source инструмент для тестирования промптов и evals
- [LLM-as-a-Judge (paper)](https://arxiv.org/abs/2306.05685) — исследование паттерна LLM-as-judge, bias и calibration
- [Guidance — LLM Evaluation](https://github.com/guidance-ai/guidance) — фреймворк для структурированного вывода и тестирования
