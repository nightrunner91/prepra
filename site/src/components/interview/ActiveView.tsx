import { Clock, Eye } from "@phosphor-icons/react";
import { useEffect } from "react";
import { formatDuration } from "../../lib/mock-interview/storage";
import type { AnswerStatus, MockInterviewQuestion } from "../../lib/mock-interview/types";
import { STATUSES, STATUS_META, renderInlineCode } from "./shared";

interface ActiveViewProps {
  question: MockInterviewQuestion;
  currentIndex: number;
  total: number;
  elapsedSec: number;
  flipped: boolean;
  busy: boolean;
  onFlip: () => void;
  onAnswer: (status: AnswerStatus) => void;
  onExit: () => void;
}

export function ActiveView({
  question,
  currentIndex,
  total,
  elapsedSec,
  flipped,
  busy,
  onFlip,
  onAnswer,
  onExit,
}: ActiveViewProps) {
  const progress = (currentIndex / total) * 100;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!flipped || busy) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const index = Number(event.key) - 1;
      const status = STATUSES[index];
      if (!status) return;

      event.preventDefault();
      onAnswer(status);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, busy, onAnswer]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-text">
          Вопрос {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-sm font-bold uppercase tracking-wider text-text-secondary">
            <Clock size={14} weight="bold" />
            {formatDuration(elapsedSec)}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="btn btn-ghost btn-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="mb-6 h-1.5 w-full border border-border bg-surface-alt">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-expanded={flipped}
        aria-label={flipped ? "Ответ показан" : "Показать ответ"}
        onClick={() => {
          if (!flipped) onFlip();
        }}
        onKeyDown={(event) => {
          if (flipped) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onFlip();
          }
        }}
        className={`quiz-card relative min-h-[420px] w-full sm:min-h-[460px] ${
          flipped ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <div
          className={`quiz-card-inner relative h-full min-h-[420px] w-full sm:min-h-[460px] ${
            flipped ? "flipped" : ""
          }`}
        >
          <div className="quiz-card-face flex flex-col overflow-y-auto border-[3px] border-border bg-surface p-6 md:p-10">
            <div className="flex items-start justify-between gap-2">
              <span className="border-2 border-border bg-canvas px-2 py-1 eyebrow font-extrabold text-accent-strong">
                {question.sectionLabel}
              </span>
              <span className="eyebrow text-text-tertiary">
                Вопрос
              </span>
            </div>

            <div className="my-auto py-6">
              <p className="break-words text-left text-xl font-bold leading-relaxed text-text md:text-2xl">
                {renderInlineCode(question.question)}?
              </p>
              {!flipped && (
                <div className="mt-6 flex items-center gap-2 eyebrow text-text-secondary md:mt-8">
                  <Eye size={14} />
                  Нажмите, чтобы увидеть ответ
                </div>
              )}
            </div>
          </div>

          <div className="quiz-card-face quiz-card-back flex flex-col overflow-y-auto border-[3px] border-border bg-surface p-6 md:p-10">
            <div className="my-auto py-6">
              <div className="mb-3 eyebrow text-accent-strong">
                Ответ
              </div>
              <p className="quiz-answer break-words text-left text-base leading-relaxed text-text-secondary md:text-lg">
                {renderInlineCode(question.answer ?? "")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 min-h-[104px]">
        {flipped ? (
          <div className="flex w-full gap-2 sm:gap-3">
            {STATUSES.map((status) => {
              const meta = STATUS_META[status];

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onAnswer(status)}
                  disabled={busy}
                  aria-label={meta.label}
                  className={`flex flex-1 flex-col items-center gap-1.5 border-2 border-border px-3 py-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none sm:px-6 ${meta.rateClass}`}
                >
                  {meta.icon}
                  <span className="eyebrow">{meta.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[104px] items-center justify-center gap-2 eyebrow text-text-secondary">
            <Eye size={14} />
            Нажми на карточку чтобы увидеть ответ
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {flipped ? question.answer : ""}
      </div>
    </div>
  );
}
