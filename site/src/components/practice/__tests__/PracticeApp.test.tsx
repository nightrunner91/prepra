import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TASKS, type ChoiceTask } from "../../../lib/practice";
import { PRACTICE_STORAGE_KEY } from "../../../lib/practice/storage";
import { PracticeApp } from "../PracticeApp";

const TRAINING_SIZE = 10;

const choiceTasks = TASKS.filter(
  (task): task is ChoiceTask => task.kind === "choice",
);

interface StoredTask {
  status: string;
  attempts: number;
  lastAt: number;
}

function writeProgress(tasks: Record<string, StoredTask>) {
  window.localStorage.setItem(
    PRACTICE_STORAGE_KEY,
    JSON.stringify({ version: 1, tasks }),
  );
}

/**
 * Все задачи решены, кроме `unsolved`; задачи из `failed` записаны как
 * проваленные (и тоже остаются в выборке).
 */
function seedProgress({
  unsolved = [],
  failed = [],
}: {
  unsolved?: string[];
  failed?: string[];
} = {}) {
  const pending = new Set(unsolved);
  const broken = new Set(failed);
  const tasks: Record<string, StoredTask> = {};

  for (const task of TASKS) {
    if (broken.has(task.id)) {
      tasks[task.id] = { status: "failed", attempts: 1, lastAt: 0 };
      continue;
    }
    if (pending.has(task.id)) continue;
    tasks[task.id] = { status: "solved", attempts: 1, lastAt: 0 };
  }

  writeProgress(tasks);
}

function readStoredTasks(): Record<string, StoredTask> {
  const raw = window.localStorage.getItem(PRACTICE_STORAGE_KEY);
  return raw ? JSON.parse(raw).tasks : {};
}

/** Заголовок открытой задачи. */
function currentTask() {
  const heading = screen.getByRole("heading", { level: 2 });
  const task = TASKS.find((item) => item.title === heading.textContent);

  if (!task || task.kind !== "choice") {
    throw new Error(
      `Не удалось определить текущую задачу: ${heading.textContent}`,
    );
  }

  return task as ChoiceTask;
}

/** Кнопки вариантов идут в том же порядке, что и task.options. */
function optionButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(".grid.gap-2 > button"),
  );
}

const nextButtonName = /Следующая|Пропустить/;

/** Ждёт, пока защита от двойного клика отпустит навигацию. */
async function navButton() {
  const button = screen.getByRole<HTMLButtonElement>("button", {
    name: nextButtonName,
  });
  await waitFor(() => expect(button.disabled).toBe(false));
  return button;
}

async function answerWrong(task: ChoiceTask, container: HTMLElement) {
  const user = userEvent.setup();
  const options = optionButtons(container);
  const wrongIndex = (task.answer + 1) % task.options.length;

  expect(options).toHaveLength(task.options.length);
  await user.click(options[wrongIndex]);
  await screen.findByText("Неверно");
}

async function answerCorrect(task: ChoiceTask, container: HTMLElement) {
  const user = userEvent.setup();
  await user.click(optionButtons(container)[task.answer]);
  await screen.findByText("Верно");
}

async function retry() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Попробовать ещё раз" }));
}

async function startTraining() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Тренировка на 10 задач" }),
  );
}

function resetApp() {
  window.localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(Math, "random").mockReturnValue(0);
  window.history.replaceState({}, "", "/practice");
}

describe("PracticeApp — переход между задачами", () => {
  beforeEach(resetApp);
  afterEach(cleanup);

  it("переходит дальше после правильной повторной попытки", async () => {
    const user = userEvent.setup();
    const first = choiceTasks[0];
    seedProgress({ unsolved: [first.id] });

    const { container } = render(<PracticeApp />);
    await startTraining();

    expect(await screen.findByText("Тренировка · 1 / 10")).toBeTruthy();
    expect(currentTask().id).toBe(first.id);

    await answerWrong(first, container);
    await retry();
    await answerCorrect(first, container);

    await user.click(await navButton());

    await waitFor(() => {
      expect(screen.getByText("Тренировка · 2 / 10")).toBeTruthy();
    });
    expect(currentTask().id).not.toBe(first.id);

    expect(readStoredTasks()[first.id]).toMatchObject({
      status: "solved",
      attempts: 2,
    });
  });

  it("сохраняет ошибку до правильной повторной попытки", async () => {
    const first = choiceTasks[0];
    seedProgress({ unsolved: [first.id] });

    const { container } = render(<PracticeApp />);
    await startTraining();

    await answerWrong(first, container);
    await retry();

    expect(readStoredTasks()[first.id]).toMatchObject({
      status: "failed",
      attempts: 1,
    });

    await answerCorrect(first, container);

    expect(readStoredTasks()[first.id]).toMatchObject({
      status: "solved",
      attempts: 2,
    });
  });

  it("не пропускает задачу двойным кликом по «Следующая»", async () => {
    const first = choiceTasks[0];
    seedProgress({ unsolved: [first.id] });

    const { container } = render(<PracticeApp />);
    await startTraining();

    await answerWrong(first, container);
    await retry();
    await answerCorrect(first, container);

    const firstNext = await navButton();
    fireEvent.click(firstNext);

    await waitFor(() => {
      expect(screen.getByText("Тренировка · 2 / 10")).toBeTruthy();
    });

    // Новый вопрос только что отрисован — кнопка ещё заблокирована.
    const nextQuestion = screen.getByRole<HTMLButtonElement>("button", {
      name: nextButtonName,
    });
    expect(nextQuestion.disabled).toBe(true);
    fireEvent.click(nextQuestion);
    expect(screen.getByText("Тренировка · 2 / 10")).toBeTruthy();
  });

  it("переходит дальше, даже если задача выпала из фильтра", async () => {
    const user = userEvent.setup();
    const onlyFailed = choiceTasks[0];
    seedProgress({ failed: [onlyFailed.id] });
    window.history.replaceState({}, "", "/practice?status=failed");

    const { container } = render(<PracticeApp />);

    await user.click(
      await screen.findByRole("button", { name: /Открыть задачу/ }),
    );

    await answerWrong(onlyFailed, container);
    await retry();
    await answerCorrect(onlyFailed, container);

    await user.click(await navButton());

    await waitFor(() => {
      expect(currentTask().id).not.toBe(onlyFailed.id);
    });
    expect(new URLSearchParams(window.location.search).get("task")).not.toBe(
      onlyFailed.id,
    );
  });

  it("кнопка «Сбросить» разблокирует варианты ответа", async () => {
    const user = userEvent.setup();
    const first = choiceTasks[0];
    seedProgress({ unsolved: [first.id] });

    const { container } = render(<PracticeApp />);
    await startTraining();

    await answerWrong(first, container);

    await user.click(screen.getByRole("button", { name: /^Сбросить$/ }));

    const options = optionButtons(container);
    expect(options.every((option) => !option.disabled)).toBe(true);
    expect(readStoredTasks()[first.id]).toBeUndefined();

    await answerCorrect(first, container);
  });
});

describe("PracticeApp — завершение тренировки", () => {
  beforeEach(resetApp);
  afterEach(cleanup);

  it("на последнем вопросе показывает завершение и хранит результаты", async () => {
    const user = userEvent.setup();
    const set = choiceTasks.slice(0, TRAINING_SIZE);
    expect(set).toHaveLength(TRAINING_SIZE);

    seedProgress({ unsolved: set.map((task) => task.id) });

    const { container } = render(<PracticeApp />);
    await startTraining();

    for (let step = 1; step <= TRAINING_SIZE; step += 1) {
      await screen.findByText(`Тренировка · ${step} / ${TRAINING_SIZE}`);
      const task = currentTask();

      await answerWrong(task, container);
      await retry();
      await answerCorrect(task, container);

      await user.click(await navButton());
    }

    expect(await screen.findByText("Тренировка завершена")).toBeTruthy();
    expect(
      screen.getByText(`${TRAINING_SIZE} из ${TRAINING_SIZE} решено`),
    ).toBeTruthy();

    const stored = readStoredTasks();
    for (const task of set) {
      expect(stored[task.id]).toMatchObject({ status: "solved", attempts: 2 });
    }
  });

  it("до ответа показывает «Пропустить» вместо «Следующая»", async () => {
    const first = choiceTasks[0];
    seedProgress({ unsolved: [first.id] });

    render(<PracticeApp />);
    await startTraining();

    expect(screen.getByRole("button", { name: /Пропустить/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Следующая/ })).toBeNull();
  });
});
