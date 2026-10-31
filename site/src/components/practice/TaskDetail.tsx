import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  Shuffle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { Task } from "../../lib/practice/types";
import type { TaskProgress } from "../../lib/practice/storage";
import { withBase } from "../../lib/urls";
import { CodeBlock } from "./CodeBlock";
import { CodeChallenge } from "./CodeChallenge";
import {
  DifficultyBadge,
  InlineText,
  KindBadge,
  StatusMark,
  TopicBadge,
} from "./ui";

interface TaskDetailProps {
  task: Task;
  status?: TaskProgress;
  training?: { current: number; total: number };
  onResult: (solved: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onRandom: () => void;
  onResetTask: () => void;
}

export function TaskDetail({
  task,
  status,
  training,
  onResult,
  onNext,
  onPrev,
  onRandom,
  onResetTask,
}: TaskDetailProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const isChoice = task.kind === "choice";
  const isCorrect = task.kind === "choice" && picked === task.answer;

  function handlePick(index: number) {
    if (revealed || task.kind !== "choice") return;
    setPicked(index);
    setRevealed(true);
    setAnswered(true);
    onResult(index === task.answer);
  }

  function handleCodeResult(solved: boolean) {
    setAnswered(true);
    onResult(solved);
  }

  function handleReset() {
    setPicked(null);
    setRevealed(false);
    setAnswered(false);
    setAttempt((value) => value + 1);
    onResetTask();
  }

  useEffect(() => {
    if (!isChoice || revealed) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if (task.kind !== "choice") return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= task.options.length) {
        return;
      }

      event.preventDefault();
      handlePick(index);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChoice, revealed, task, onResult]);

  return (
    <article className="border-[3px] border-border bg-surface">
      <header className="border-b-2 border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <TopicBadge topic={task.topic} />
          <DifficultyBadge difficulty={task.difficulty} />
          <KindBadge kind={task.kind} />
          {status && (
            <span className="inline-flex items-center gap-1 border-2 border-border bg-canvas px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              <StatusMark status={status.status} size={13} />
              {status.status === "solved" ? "Решено" : "Была ошибка"}
              {status.attempts > 1 ? ` · ${status.attempts}` : ""}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h2 className="font-mono text-xl font-extrabold uppercase leading-tight tracking-tight text-text sm:text-2xl">
            {task.title}
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex shrink-0 items-center gap-1 border-2 border-border bg-canvas px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
            title="Сбросить прогресс по этой задаче"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            Сбросить
          </button>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-text-secondary sm:text-[15px]">
          <InlineText text={task.prompt} />
        </p>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {task.kind === "choice" ? (
          <>
            {task.code && <CodeBlock code={task.code} label="Код" />}

            <div className="grid gap-2 sm:grid-cols-2">
              {task.options.map((option, index) => {
                const correct = revealed && index === task.answer;
                const wrong =
                  revealed && index === picked && index !== task.answer;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePick(index)}
                    disabled={revealed}
                    className={`flex h-full w-full items-start gap-3 border-2 border-border p-3 text-left transition-all ${
                      correct
                        ? "bg-pale-green-bg"
                        : wrong
                          ? "bg-pale-red-bg"
                          : revealed
                            ? "bg-surface opacity-55"
                            : "bg-surface hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bg-surface-alt hover:shadow-[3px_3px_0px_var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border font-mono text-[11px] font-bold ${
                        correct
                          ? "bg-pale-green-text text-canvas"
                          : wrong
                            ? "bg-pale-red-text text-canvas"
                            : "bg-surface-alt text-text-secondary"
                      }`}
                    >
                      {correct ? (
                        <Check size={13} weight="bold" />
                      ) : wrong ? (
                        <X size={13} weight="bold" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </span>
                    <span className="pt-0.5 text-sm font-medium leading-relaxed text-text">
                      <InlineText text={option} />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Можно отвечать клавишами 1–{task.options.length}
            </p>

            {revealed && (
              <div
                className={`border-2 border-border p-4 ${
                  isCorrect ? "bg-pale-green-bg" : "bg-pale-red-bg"
                }`}
              >
                <div
                  className={`font-mono text-xs font-bold uppercase tracking-wider ${
                    isCorrect ? "text-pale-green-text" : "text-pale-red-text"
                  }`}
                >
                  {isCorrect ? "Верно" : "Неверно"}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-text-secondary">
                  <InlineText text={task.explanation} />
                </p>

                {task.article && (
                  <a
                    href={withBase(task.article.href)}
                    className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                  >
                    {task.article.label}
                    <ArrowRight size={13} weight="bold" />
                  </a>
                )}

                {!isCorrect && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 block border-2 border-border bg-surface px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text transition-colors hover:bg-surface-alt"
                  >
                    Попробовать ещё раз
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <CodeChallenge
            key={`${task.id}-${attempt}`}
            task={task}
            onResult={handleCodeResult}
          />
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t-2 border-border p-3 sm:p-4">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 border-2 border-border bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
        >
          <ArrowLeft size={14} weight="bold" />
          Назад
        </button>

        <button
          type="button"
          onClick={onRandom}
          className="inline-flex items-center gap-1.5 border-2 border-border bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
        >
          <Shuffle size={14} weight="bold" />
          Случайная
        </button>

        <div className="ml-auto flex items-center gap-2">
          {training && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {training.current} / {training.total}
            </span>
          )}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 border-2 border-border bg-accent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            {training ? (answered ? "Следующая" : "Пропустить") : "Следующая"}
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </footer>
    </article>
  );
}
