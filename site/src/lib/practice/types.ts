export type TopicId =
  | "hoisting"
  | "closures"
  | "this"
  | "event-loop"
  | "collections"
  | "big-o"
  | "coercion"
  | "prototypes"
  | "async"
  | "functions";

export type Difficulty = "junior" | "middle" | "senior";

export interface ArticleLink {
  href: string;
  label: string;
}

export interface TaskBase {
  /** Уникальный стабильный id. Используется в localStorage и URL. */
  id: string;
  topic: TopicId;
  title: string;
  difficulty: Difficulty;
  /** Условие задачи. Поддерживает `inline code` и переносы строк. */
  prompt: string;
  explanation: string;
  article?: ArticleLink;
  tags?: string[];
}

export interface ChoiceTask extends TaskBase {
  kind: "choice";
  /** Фрагмент кода, который показывается над вариантами ответа. */
  code?: string;
  options: string[];
  /** Индекс правильного варианта в options. */
  answer: number;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
  label?: string;
}

export interface CodeTask extends TaskBase {
  kind: "code";
  /** Стартовый шаблон, который видит пользователь. */
  starter: string;
  /** Имя функции, которую вызывает раннер. */
  entry: string;
  tests: TestCase[];
  solution: string;
  hints?: string[];
}

export type Task = ChoiceTask | CodeTask;

export type TaskKind = Task["kind"];

export interface TopicMeta {
  id: TopicId;
  label: string;
  short: string;
  description: string;
  color: "red" | "blue" | "green" | "yellow" | "neutral";
}
