import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadActiveSession,
  saveActiveSession,
} from "../../../lib/mock-interview/storage";
import type {
  InterviewSession,
  MockInterviewQuestion,
} from "../../../lib/mock-interview/types";
import { MockInterview } from "../MockInterview";

const questions: MockInterviewQuestion[] = [
  {
    id: "javascript-q1",
    section: "javascript",
    sectionLabel: "JavaScript",
    articleSlug: "closures",
    articleTitle: "Замыкания",
    url: "/javascript/closures/",
    order: 1,
    stacks: [],
    question: "Что такое замыкание",
    answer: "Функция вместе с её лексическим окружением",
  },
  {
    id: "javascript-q2",
    section: "javascript",
    sectionLabel: "JavaScript",
    articleSlug: "event-loop",
    articleTitle: "Event loop",
    url: "/javascript/event-loop/",
    order: 2,
    stacks: [],
    question: "Как работает event loop",
    answer: "Обрабатывает очереди задач и микротасок",
  },
];

function seedActiveSession() {
  const session: InterviewSession = {
    version: 1,
    config: { presetId: null, sections: ["javascript"], count: questions.length },
    questions,
    answers: {},
    currentIndex: 0,
    startedAt: Date.now(),
  };
  saveActiveSession(session);
  return session;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => questions,
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("MockInterview answers", () => {
  it("does not offer skipping a question", async () => {
    seedActiveSession();
    const user = userEvent.setup();

    render(<MockInterview questionCount={2} sectionCount={1} />);

    await user.click(
      await screen.findByRole("button", { name: "Продолжить" }),
    );

    expect(screen.getByRole("button", { name: "Выйти" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Пропустить" })).toBeNull();
  });
});

describe("MockInterview reset confirmation", () => {
  it("does not reset the session without explicit confirmation", async () => {
    seedActiveSession();
    const confirmSpy = vi.spyOn(window, "confirm");
    const user = userEvent.setup();

    render(<MockInterview questionCount={2} sectionCount={1} />);

    const newButton = await screen.findByRole("button", { name: "Новое" });
    await user.click(newButton);

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Сбросить интервью?" }),
    ).toBeTruthy();

    const cancel = screen.getByRole("button", { name: "Отмена" });
    await waitFor(() => expect(document.activeElement).toBe(cancel));

    await user.click(cancel);

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(loadActiveSession()).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(newButton));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("clears the active session after confirmation", async () => {
    seedActiveSession();
    const user = userEvent.setup();

    render(<MockInterview questionCount={2} sectionCount={1} />);

    await user.click(await screen.findByRole("button", { name: "Новое" }));
    await user.click(screen.getByRole("button", { name: "Сбросить" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(loadActiveSession()).toBeNull();
  });

  it("closes the dialog with Escape and keeps the session", async () => {
    seedActiveSession();
    const user = userEvent.setup();

    render(<MockInterview questionCount={2} sectionCount={1} />);

    await user.click(await screen.findByRole("button", { name: "Новое" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(loadActiveSession()).not.toBeNull();
  });
});
