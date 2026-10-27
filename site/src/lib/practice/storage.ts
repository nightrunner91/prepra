export type TaskStatus = "solved" | "failed";

export interface TaskProgress {
  status: TaskStatus;
  attempts: number;
  lastAt: number;
}

export interface PracticeProgress {
  version: 1;
  tasks: Record<string, TaskProgress>;
}

export const PRACTICE_STORAGE_KEY = "prepra:practice:v1";
export const PRACTICE_UPDATE_EVENT = "practice:update";

export function emptyProgress(): PracticeProgress {
  return { version: 1, tasks: {} };
}

export function loadProgress(): PracticeProgress {
  if (typeof window === "undefined") return emptyProgress();

  try {
    const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return emptyProgress();

    const parsed = JSON.parse(raw) as Partial<PracticeProgress>;
    if (!parsed || typeof parsed !== "object" || !parsed.tasks) {
      return emptyProgress();
    }

    const tasks: Record<string, TaskProgress> = {};
    for (const [id, value] of Object.entries(parsed.tasks)) {
      if (
        value &&
        typeof value === "object" &&
        (value.status === "solved" || value.status === "failed") &&
        typeof value.attempts === "number"
      ) {
        tasks[id] = {
          status: value.status,
          attempts: value.attempts,
          lastAt: typeof value.lastAt === "number" ? value.lastAt : 0,
        };
      }
    }

    return { version: 1, tasks };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: PracticeProgress): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent(PRACTICE_UPDATE_EVENT));
  } catch {
    // localStorage может быть недоступен в приватном режиме — не ломаем UI.
  }
}

export function recordAttempt(
  progress: PracticeProgress,
  taskId: string,
  solved: boolean,
): PracticeProgress {
  const previous = progress.tasks[taskId];
  const next: TaskProgress = {
    // Правильный ответ после ошибки повышает статус до solved.
    status: solved ? "solved" : previous?.status === "solved" ? "solved" : "failed",
    attempts: (previous?.attempts ?? 0) + 1,
    lastAt: Date.now(),
  };

  return {
    version: 1,
    tasks: { ...progress.tasks, [taskId]: next },
  };
}

export function resetTaskProgress(
  progress: PracticeProgress,
  taskId: string,
): PracticeProgress {
  const tasks = { ...progress.tasks };
  delete tasks[taskId];
  return { version: 1, tasks };
}

export function resetAllProgress(): PracticeProgress {
  return emptyProgress();
}
