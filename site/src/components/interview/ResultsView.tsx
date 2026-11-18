import {
  ArrowCounterClockwise,
  ArrowRight,
  House,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { formatDate, formatDuration } from "../../lib/mock-interview/storage";
import type {
  AnswerStatus,
  InterviewHistoryEntry,
  MockInterviewQuestion,
} from "../../lib/mock-interview/types";
import { withBase } from "../../lib/urls";
import { STATUSES, STATUS_META } from "./shared";

interface ResultsViewProps {
  entry: InterviewHistoryEntry;
  questions: MockInterviewQuestion[];
  onRetake: () => void;
}

export function ResultsView({
  entry,
  questions,
  onRetake,
}: ResultsViewProps) {
  const counts = entry.counts;
  const answered = counts.good + counts.unsure + counts.failed;
  const accuracy = answered === 0 ? 0 : Math.round((counts.good / answered) * 100);

  const rows = useMemo(() => {
    const bySection = new Map<
      string,
      { section: string; label: string; url: string }
    >();
    for (const question of questions) {
      if (!bySection.has(question.section)) {
        bySection.set(question.section, {
          section: question.section,
          label: question.sectionLabel,
          url: withBase(`/${question.section}`),
        });
      }
    }
    const ratio = (sectionCounts: Record<AnswerStatus, number>) => {
      const sectionAnswered =
        sectionCounts.good + sectionCounts.unsure + sectionCounts.failed;
      return sectionAnswered === 0
        ? Infinity
        : sectionCounts.good / sectionAnswered;
    };
    const total = (sectionCounts: Record<AnswerStatus, number>) =>
      sectionCounts.good +
      sectionCounts.unsure +
      sectionCounts.failed +
      sectionCounts.skipped;

    return [...bySection.values()]
      .map((row) => ({
        ...row,
        counts: entry.perSection[row.section] ?? {
          good: 0,
          unsure: 0,
          failed: 0,
          skipped: 0,
        },
      }))
      .sort(
        (a, b) =>
          ratio(a.counts) - ratio(b.counts) || total(b.counts) - total(a.counts),
      );
  }, [entry, questions]);

  const weakest = useMemo(() => {
    let best: (typeof rows)[number] | null = null;
    for (const row of rows) {
      const rowAnswered =
        row.counts.good + row.counts.unsure + row.counts.failed;
      if (rowAnswered === 0) continue;
      if (!best) {
        best = row;
        continue;
      }
      const bestAnswered =
        best.counts.good + best.counts.unsure + best.counts.failed;
      if (row.counts.good / rowAnswered < best.counts.good / bestAnswered) {
        best = row;
      }
    }
    return best;
  }, [rows]);

  return (
    <>
      <header className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h1 className="page-title">Результат интервью</h1>
            <p className="page-lede">
              {formatDate(entry.startedAt)} ·{" "}
              {formatDuration(entry.durationSec)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip">{answered} отвечено</span>
              <span className="chip">{accuracy}% отлично</span>
              <span className="chip">{counts.skipped} пропущено</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="btn btn-primary btn-md"
            >
              <ArrowCounterClockwise size={16} weight="bold" />
              Перепройти
            </button>
            <a href={withBase("/")} className="btn btn-secondary btn-md">
              <House size={16} weight="bold" />
              На главную
            </a>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATUSES.map((status) => {
          const meta = STATUS_META[status];

          return (
            <div
              key={status}
              className={`panel flex flex-col items-center gap-1 p-4 ${meta.bg}`}
            >
              {meta.icon}
              <span
                className={`font-mono text-2xl font-extrabold ${meta.color}`}
              >
                {counts[status]}
              </span>
              <span
                className={`eyebrow ${meta.color}`}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="panel mt-6">
        <div className="border-b-2 border-border p-4 sm:px-5">
          <h2 className="font-mono text-sm font-extrabold uppercase tracking-tight text-text">
            Результаты по разделам
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-border eyebrow text-text-tertiary">
                <th className="px-4 py-2 sm:px-5">Раздел</th>
                {STATUSES.map((status) => (
                  <th key={status} className="px-3 py-2 text-center">
                    {STATUS_META[status].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.section}
                  className="border-b-2 border-border last:border-b-0"
                >
                  <td className="px-4 py-2 sm:px-5">
                    <a
                      href={row.url}
                      className="font-mono text-xs font-extrabold uppercase tracking-wide text-accent-strong hover:text-text"
                    >
                      {row.label}
                    </a>
                  </td>
                  {STATUSES.map((status) => (
                    <td
                      key={status}
                      className={`px-3 py-2 text-center font-mono text-sm font-bold ${
                        row.counts[status] > 0
                          ? "text-text"
                          : "text-text-tertiary"
                      }`}
                    >
                      {row.counts[status]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {weakest && (
        <div className="panel mt-6 bg-pale-red-bg p-4 sm:p-5">
          <div className="eyebrow text-pale-red-text">
            Самая слабая тема
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={weakest.url}
              className="font-mono text-lg font-extrabold uppercase tracking-tight text-text hover:text-accent-strong"
            >
              {weakest.label}
            </a>
            <ArrowRight size={18} weight="bold" className="text-pale-red-text" />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetake}
          className="btn btn-primary btn-lg flex-1"
        >
          <ArrowCounterClockwise size={18} weight="bold" />
          Перепройти
        </button>
        <a
          href={withBase("/")}
          className="btn btn-secondary btn-lg flex-1"
        >
          <House size={18} weight="bold" />
          На главную
        </a>
      </div>
    </>
  );
}
