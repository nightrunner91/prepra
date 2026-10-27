import type { ChoiceTask, Task, TopicId } from "./types";
import { TOPICS } from "./topics";
import type { PracticeProgress } from "./storage";
import { hoistingTasks } from "./data/hoisting";
import { closureTasks } from "./data/closures";
import { thisTasks } from "./data/this";
import { eventLoopTasks } from "./data/event-loop";
import { collectionTasks } from "./data/collections";
import { bigOTasks } from "./data/big-o";
import { coercionTasks } from "./data/coercion";
import { prototypeTasks } from "./data/prototypes";
import { asyncTasks } from "./data/async";
import { functionTasks } from "./data/functions";
import { codeTasks } from "./data/code";

export const TASKS: Task[] = [
  ...hoistingTasks,
  ...closureTasks,
  ...thisTasks,
  ...eventLoopTasks,
  ...collectionTasks,
  ...bigOTasks,
  ...coercionTasks,
  ...prototypeTasks,
  ...asyncTasks,
  ...functionTasks,
  ...codeTasks,
];

export const TASK_MAP: Record<string, Task> = TASKS.reduce(
  (acc, task) => {
    acc[task.id] = task;
    return acc;
  },
  {} as Record<string, Task>,
);

const TOPIC_ORDER = new Map(TOPICS.map((topic, index) => [topic.id, index]));

export const TASKS_BY_TOPIC: Record<TopicId, Task[]> = TOPICS.reduce(
  (acc, topic) => {
    acc[topic.id] = TASKS.filter((task) => task.topic === topic.id);
    return acc;
  },
  {} as Record<TopicId, Task[]>,
);

export function getTask(id: string | null | undefined): Task | undefined {
  return id ? TASK_MAP[id] : undefined;
}

export function getTopicTaskCount(topic: TopicId): number {
  return TASKS_BY_TOPIC[topic].length;
}

export function getCodeTaskCount(): number {
  return TASKS.filter((task) => task.kind === "code").length;
}

export interface PracticeStats {
  total: number;
  solved: number;
  failed: number;
  todo: number;
  attempted: number;
  accuracy: number;
}

export function computeStats(progress: PracticeProgress): PracticeStats {
  let solved = 0;
  let failed = 0;

  for (const task of TASKS) {
    const status = progress.tasks[task.id]?.status;
    if (status === "solved") solved++;
    else if (status === "failed") failed++;
  }

  const attempted = solved + failed;

  return {
    total: TASKS.length,
    solved,
    failed,
    todo: TASKS.length - attempted,
    attempted,
    accuracy: attempted === 0 ? 0 : Math.round((solved / attempted) * 100),
  };
}

export interface TopicStats {
  total: number;
  solved: number;
  attempted: number;
}

export function computeTopicStats(
  progress: PracticeProgress,
): Record<TopicId, TopicStats> {
  const stats = {} as Record<TopicId, TopicStats>;

  for (const topic of TOPICS) {
    let solved = 0;
    let attempted = 0;

    for (const task of TASKS_BY_TOPIC[topic.id]) {
      const status = progress.tasks[task.id]?.status;
      if (status === "solved") {
        solved++;
        attempted++;
      } else if (status === "failed") {
        attempted++;
      }
    }

    stats[topic.id] = {
      total: TASKS_BY_TOPIC[topic.id].length,
      solved,
      attempted,
    };
  }

  return stats;
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

/**
 * Собирает тренировку: сначала нерешённые, затем проваленные, затем уже
 * решённые (если других не хватает). Внутри группы порядок случайный.
 */
export function pickTrainingTasks(
  progress: PracticeProgress,
  count = 10,
): Task[] {
  const todo: Task[] = [];
  const failed: Task[] = [];
  const solved: Task[] = [];

  for (const task of TASKS) {
    const status = progress.tasks[task.id]?.status;
    if (status === "solved") solved.push(task);
    else if (status === "failed") failed.push(task);
    else todo.push(task);
  }

  const pool = [...shuffle(todo), ...shuffle(failed), ...shuffle(solved)];
  return pool.slice(0, Math.min(count, pool.length));
}

export function getWeakTopics(
  progress: PracticeProgress,
  limit = 3,
): TopicId[] {
  const stats = computeTopicStats(progress);

  return TOPICS.map((topic) => {
    const item = stats[topic.id];
    const ratio = item.total === 0 ? 1 : item.solved / item.total;
    return { id: topic.id, ratio, attempted: item.attempted };
  })
    .sort((left, right) => {
      if (left.ratio !== right.ratio) return left.ratio - right.ratio;
      return right.attempted - left.attempted;
    })
    .slice(0, limit)
    .map((item) => item.id);
}

export function sortTasksByTopic(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    const leftTopic = TOPIC_ORDER.get(left.topic) ?? 0;
    const rightTopic = TOPIC_ORDER.get(right.topic) ?? 0;
    if (leftTopic !== rightTopic) return leftTopic - rightTopic;
    if (left.kind !== right.kind) return left.kind === "code" ? 1 : -1;
    return 0;
  });
}

function assertValidChoiceTask(task: ChoiceTask): void {
  if (task.answer < 0 || task.answer >= task.options.length) {
    throw new Error(
      `Task "${task.id}" has answer index ${task.answer}, options: ${task.options.length}`,
    );
  }
}

function validateTasks(tasks: Task[]): void {
  const ids = new Set<string>();

  for (const task of tasks) {
    if (ids.has(task.id)) {
      throw new Error(`Duplicate task id: "${task.id}"`);
    }
    ids.add(task.id);

    if (task.kind === "choice") {
      assertValidChoiceTask(task);
    } else {
      if (task.tests.length === 0) {
        throw new Error(`Code task "${task.id}" has no tests`);
      }
    }
  }
}

validateTasks(TASKS);

export type { Task, ChoiceTask, TopicId };
export { TOPICS };
