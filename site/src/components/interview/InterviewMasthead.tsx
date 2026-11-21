import {
  ArrowCounterClockwise,
  ArrowRight,
  Microphone,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type {
  InterviewHistoryEntry,
  InterviewSession,
} from "../../lib/mock-interview/types";
import { plural } from "../../lib/plural";
import { questionWord, sectionWord } from "./shared";

interface InterviewMastheadProps {
  presetCount: number;
  questionCount: number;
  sectionCount: number;
  ready: boolean;
  indexReady: boolean;
  session: InterviewSession | null;
  history: InterviewHistoryEntry[];
  onResume: () => void;
  onReset: () => void;
  onStartDefault: () => void;
  onRepeatLast: () => void;
}

export function InterviewMasthead({
  presetCount,
  questionCount,
  sectionCount,
  ready,
  indexReady,
  session,
  history,
  onResume,
  onReset,
  onStartDefault,
  onRepeatLast,
}: InterviewMastheadProps) {
  const interviews = history.length;
  const sessionTotal = session?.questions.length ?? 0;
  const sessionDone = session?.currentIndex ?? 0;
  const sessionPercent =
    sessionTotal > 0 ? Math.round((sessionDone / sessionTotal) * 100) : 0;

  const answeredTotal = history.reduce(
    (sum, entry) =>
      sum + entry.counts.good + entry.counts.unsure + entry.counts.failed,
    0,
  );
  const goodTotal = history.reduce(
    (sum, entry) => sum + entry.counts.good,
    0,
  );
  const average =
    answeredTotal > 0 ? Math.round((goodTotal / answeredTotal) * 100) : null;
  const best = history.reduce<number | null>((current, entry) => {
    const answered =
      entry.counts.good + entry.counts.unsure + entry.counts.failed;
    if (answered === 0) return current;

    const result = Math.round((entry.counts.good / answered) * 100);
    return current === null ? result : Math.max(current, result);
  }, null);

  let status = "Прогресс в браузере";
  let percent = 0;
  let percentLabel = "—";
  let valueText = "Прогресс загружается";
  let metricOne = { label: "Интервью", value: "—" };
  let metricTwo = { label: "Средний", value: "—" };
  let actions: ReactNode = null;

  if (ready && session) {
    status = `Интервью в процессе · ${sessionDone} из ${sessionTotal}`;
    percent = sessionPercent;
    percentLabel = `${sessionPercent}%`;
    valueText = `Пройдено ${sessionDone} из ${sessionTotal} ${questionWord(
      sessionTotal,
    )}`;
    metricOne = {
      label: "Пройдено",
      value: `${sessionDone} / ${sessionTotal}`,
    };
    metricTwo = {
      label: "Осталось",
      value: String(Math.max(0, sessionTotal - sessionDone)),
    };

    actions = (
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onResume}
          className="btn btn-primary btn-sm min-w-0 flex-1 justify-between"
        >
          <span className="truncate">Продолжить</span>
          <Microphone
            size={14}
            weight="bold"
            className="hidden shrink-0 sm:block"
          />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-secondary btn-sm shrink-0"
        >
          Новое
        </button>
      </div>
    );
  } else if (ready && interviews > 0) {
    status =
      average === null
        ? `Пройдено ${interviews} интервью`
        : interviews === 1
          ? "Средний результат"
          : `Средний результат за ${interviews} интервью`;
    percent = average ?? 0;
    percentLabel = average === null ? "—" : `${average}%`;
    valueText =
      average === null
        ? "Интервью пройдены, но без оценок"
        : `Средний результат ${average} процентов`;
    metricOne = { label: "Интервью", value: String(interviews) };
    metricTwo = {
      label: "Лучший",
      value: best === null ? "—" : `${best}%`,
    };

    actions = (
      <button
        type="button"
        onClick={onRepeatLast}
        disabled={!indexReady}
        className="btn btn-primary btn-sm mt-5 w-full justify-between"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ArrowCounterClockwise size={14} weight="bold" />
          <span className="truncate">Пройти ещё</span>
        </span>
        <ArrowRight size={14} weight="bold" className="shrink-0" />
      </button>
    );
  } else {
    status = ready ? "Пройди первое интервью" : "Прогресс в браузере";
    metricOne = { label: "Интервью", value: ready ? "0" : "—" };
    valueText = ready
      ? "Интервью ещё не пройдено"
      : "Прогресс загружается";

    actions = (
      <button
        type="button"
        onClick={onStartDefault}
        disabled={!indexReady}
        className="btn btn-primary btn-sm mt-5 w-full justify-between"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Microphone size={14} weight="bold" />
          <span className="truncate">Начать с основ</span>
        </span>
        <ArrowRight size={14} weight="bold" className="shrink-0" />
      </button>
    );
  }

  return (
    <header className="masthead">
      <div className="masthead-grid lg:gap-5">
        <div className="masthead-main">
          <div className="min-w-0">
            <div className="page-head-row">
              <span className="page-title-mark" aria-hidden="true">
                <Microphone size={22} weight="bold" className="size-5 lg:size-6" />
              </span>
              <h1 className="page-title">Интервью</h1>
            </div>
            <p className="page-lede">
              Прогон в формате технического собеседования с самопроверкой.
            </p>
          </div>

          <ul className="masthead-stats mt-auto pt-4 lg:pt-6">
            <li className="masthead-stat">
              <span className="masthead-stat-value">{presetCount}</span>
              <span>{plural(presetCount, "сет", "сета", "сетов")}</span>
            </li>
            <li className="masthead-stat">
              <span className="masthead-stat-value">{sectionCount}</span>
              <span>{sectionWord(sectionCount)}</span>
            </li>
            <li className="masthead-stat">
              <span className="masthead-stat-value">{questionCount}</span>
              <span>{questionWord(questionCount)}</span>
            </li>
          </ul>
        </div>

        <div className="masthead-aside">
          <div className="min-w-0 w-full">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="interview-progress-title"
                  className="eyebrow text-text-tertiary"
                >
                  Твой прогресс
                </h2>
                <p className="mt-1 text-sm font-medium leading-snug text-text-secondary">
                  {status}
                </p>
              </div>
              <p className="min-w-[4ch] shrink-0 text-right font-mono text-3xl font-extrabold leading-none tabular-nums text-accent-strong">
                {percentLabel}
              </p>
            </div>

            <div
              className="mt-4 h-2.5 w-full border-2 border-border bg-surface-alt"
              role="progressbar"
              aria-labelledby="interview-progress-title"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={valueText}
            >
              <div
                className="h-full origin-left bg-accent transition-transform duration-300 motion-reduce:transition-none"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="min-w-0">
                <dt className="eyebrow text-text-tertiary">
                  {metricOne.label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-text">
                  {metricOne.value}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="eyebrow text-text-tertiary">
                  {metricTwo.label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-text">
                  {metricTwo.value}
                </dd>
              </div>
            </dl>

            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
