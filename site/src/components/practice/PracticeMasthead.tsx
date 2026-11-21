import { Barbell, Shuffle, Target } from "@phosphor-icons/react";
import {
  TOPICS,
  getCodeTaskCount,
  type PracticeStats,
} from "../../lib/practice";
import { plural } from "../../lib/plural";

interface PracticeMastheadProps {
  stats: PracticeStats;
  ready: boolean;
  onStartTraining: () => void;
  onRandomTask: () => void;
}

export function PracticeMasthead({
  stats,
  ready,
  onStartTraining,
  onRandomTask,
}: PracticeMastheadProps) {
  const total = stats.total;
  const solved = stats.solved;
  const accuracy = stats.accuracy;
  const remaining = Math.max(0, total - solved);
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((solved / total) * 100));
  const codeTaskCount = getCodeTaskCount();

  const catalogStats = [
    { value: total, label: plural(total, "задача", "задачи", "задач") },
    {
      value: TOPICS.length,
      label: plural(TOPICS.length, "тема", "темы", "тем"),
    },
    {
      value: codeTaskCount,
      label: plural(
        codeTaskCount,
        "задача с кодом",
        "задачи с кодом",
        "задач с кодом",
      ),
    },
  ];

  let status = "Прогресс в браузере";

  if (ready) {
    if (total === 0) {
      status = "Задачи скоро появятся";
    } else if (solved === 0) {
      status = "Начни с первой темы";
    } else if (remaining === 0) {
      status = "Все задачи решены";
    } else {
      status = `Ещё ${remaining} ${plural(
        remaining,
        "задача",
        "задачи",
        "задач",
      )}`;
    }
  }

  const valueText = ready
    ? `Решено ${solved} из ${total} ${plural(
        total,
        "задачи",
        "задач",
        "задач",
      )}`
    : "Прогресс загружается";

  return (
    <header className="masthead">
      <div className="masthead-grid lg:gap-4">
        <div className="masthead-main">
          <div className="min-w-0">
            <div className="page-head-row">
              <span className="page-title-mark" aria-hidden="true">
                <Barbell size={22} weight="bold" className="size-5 lg:size-6" />
              </span>
              <h1 className="page-title">Практика</h1>
            </div>
            <p className="page-lede">
              Задачи на базовый JavaScript в формате «что выведет код» для всех
              грейдов.
            </p>
          </div>

          <ul className="masthead-stats mt-auto pt-4 lg:pt-6">
            {catalogStats.map((stat) => (
              <li key={stat.label} className="masthead-stat">
                <span className="masthead-stat-value">{stat.value}</span>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="masthead-aside">
          <div className="min-w-0 w-full">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="practice-progress-title"
                  className="eyebrow text-text-tertiary"
                >
                  Твой прогресс
                </h2>
                <p className="mt-1 text-sm font-medium leading-snug text-text-secondary">
                  {status}
                </p>
              </div>
              <p className="min-w-[4ch] shrink-0 text-right font-mono text-3xl font-extrabold leading-none tabular-nums text-accent-strong">
                {ready ? `${percent}%` : "—"}
              </p>
            </div>

            <div
              className="mt-4 h-2.5 w-full border-2 border-border bg-surface-alt"
              role="progressbar"
              aria-labelledby="practice-progress-title"
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
                <dt className="eyebrow text-text-tertiary">Решено</dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-text">
                  <span>{ready ? solved : "—"}</span>
                  <span className="text-text-tertiary"> / {total}</span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="eyebrow text-text-tertiary">Точность</dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-text">
                  <span>
                    {ready ? (stats.attempted === 0 ? "—" : accuracy) : "—"}
                  </span>
                  <span className="text-text-tertiary">%</span>
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onStartTraining}
                aria-label="Тренировка на 10 задач"
                title="Тренировка на 10 задач"
                className="btn btn-primary btn-sm min-w-0 flex-1 justify-between"
              >
                <span className="truncate">Тренировка</span>
                <Target
                  size={14}
                  weight="bold"
                  className="hidden shrink-0 sm:block"
                />
              </button>
              <button
                type="button"
                onClick={onRandomTask}
                className="btn btn-secondary btn-sm shrink-0"
              >
                <Shuffle
                  size={14}
                  weight="bold"
                  className="hidden shrink-0 sm:block"
                />
                <span>Случайная</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
