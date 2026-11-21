import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  Brain,
  CaretDown,
  Check,
  Cloud,
  FileJsx,
  Globe,
  Lightning,
  Microphone,
  PaintBrush,
  SquaresFour,
  TreeStructure,
} from "@phosphor-icons/react";
import { useState } from "react";
import { ALL_SECTION_IDS } from "../../lib/mock-interview/presets";
import type {
  InterviewPreset,
  InterviewSession,
  MockInterviewQuestion,
} from "../../lib/mock-interview/types";
import { questionWord, sectionWord } from "./shared";

const LENGTH_OPTIONS = [20, 30, 50];
const STACK_OPTIONS: { id: string; label: string }[] = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "nextjs", label: "Next.js" },
];

const PRESET_ICONS: Record<string, Icon> = {
  "web-basics": Globe,
  "react-stack": FileJsx,
  "react-fullstack": Cloud,
  "next-fullstack": Cloud,
  testing: Check,
  performance: Lightning,
  architecture: TreeStructure,
  ai: Brain,
  "ui-engineer-vue": PaintBrush,
  "ui-engineer-react": PaintBrush,
};

const PRESET_COLORS: Record<string, "red" | "blue" | "green" | "yellow"> = {
  "web-basics": "yellow",
  "react-stack": "blue",
  "react-fullstack": "blue",
  "next-fullstack": "blue",
  testing: "green",
  performance: "yellow",
  architecture: "blue",
  ai: "red",
  "ui-engineer-vue": "green",
  "ui-engineer-react": "blue",
};

const PRESET_BADGE_CLASSES: Record<string, string> = {
  red: "bg-pale-red-bg text-pale-red-text",
  blue: "bg-pale-blue-bg text-pale-blue-text",
  green: "bg-positive-bg text-positive-text",
  yellow: "bg-pale-yellow-bg text-pale-yellow-text",
};

interface StartViewProps {
  index: MockInterviewQuestion[] | null;
  loading: boolean;
  error: boolean;
  session: InterviewSession | null;
  presets: InterviewPreset[];
  sections: string[];
  stack: string;
  length: number;
  sectionPool: Map<string, number>;
  sectionLabels: Map<string, string>;
  poolCapped: boolean;
  poolEmpty: boolean;
  poolSize: number | null;
  canStart: boolean;
  onToggleSection: (id: string) => void;
  onSelectStack: (id: string) => void;
  onSelectLength: (length: number) => void;
  onClearSelection: () => void;
  onStartCustom: () => void;
  onStartPreset: (preset: InterviewPreset) => void;
  onResume: () => void;
  onReset: () => void;
}

export function StartView({
  index,
  loading,
  error,
  session,
  presets,
  sections,
  stack,
  length,
  sectionPool,
  sectionLabels,
  poolCapped,
  poolEmpty,
  poolSize,
  canStart,
  onToggleSection,
  onSelectStack,
  onSelectLength,
  onClearSelection,
  onStartCustom,
  onStartPreset,
  onResume,
  onReset,
}: StartViewProps) {
  const [customOpen, setCustomOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("custom") === "1";
  });

  const ready = index !== null;
  const questionPool = index
    ? index.filter((question) => question.answer !== null).length
    : 0;
  const answered = session ? Object.keys(session.answers).length : 0;
  const stackLabel = stack
    ? (STACK_OPTIONS.find((item) => item.id === stack)?.label ?? stack)
    : "любой стек";

  return (
    <div className={customOpen ? "pb-28" : undefined}>
      <header className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h1 className="page-title">Мок-интервью</h1>
            <p className="page-lede">
              Прогон в формате технического собеседования с самопроверкой.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip">{presets.length} сетов</span>
              <span className="chip">20–50 вопросов</span>
              <span className="chip">
                {ready
                  ? `${questionPool} ${questionWord(questionPool)} в базе`
                  : error
                    ? "База недоступна"
                    : "Загрузка базы…"}
              </span>
            </div>
          </div>

          {session && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onResume}
                className="btn btn-primary btn-md"
              >
                <Microphone size={16} weight="bold" />
                Продолжить {answered}/{session.questions.length}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="btn btn-secondary btn-md"
              >
                Начать новое
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-xl font-extrabold uppercase tracking-tight text-text">
            Готовые сеты
          </h2>
          <p className="mt-1 eyebrow text-text-tertiary">
            Выбери сет — интервью стартует сразу
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCustomOpen((value) => !value)}
          aria-expanded={customOpen}
          className="btn btn-secondary btn-sm"
        >
          {customOpen ? "Скрыть свой сет" : "Собрать свой сет"}
          <CaretDown
            size={14}
            weight="bold"
            className={`transition-transform ${customOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {customOpen && (
        <div className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border p-4">
            <h2 className="font-mono text-lg font-extrabold uppercase tracking-tight text-text">
              Свой сет
            </h2>
            <button
              type="button"
              onClick={onClearSelection}
              className="btn btn-ghost btn-sm"
            >
              Сбросить выбор
            </button>
          </div>

          <div className="grid gap-5 p-4 lg:grid-cols-2">
            <fieldset className="min-w-0 lg:col-span-2">
              <legend className="mb-2 eyebrow text-text-tertiary">
                Разделы
              </legend>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTION_IDS.map((id) => {
                  const checked = sections.includes(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onToggleSection(id)}
                      aria-pressed={checked}
                      className={`flex items-center gap-2 border-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors active:translate-y-px ${checked
                          ? "border-border bg-accent text-accent-ink"
                          : "border-border bg-surface-alt text-text-secondary hover:bg-surface"
                        }`}
                    >
                      <span>{sectionLabels.get(id) ?? id}</span>
                      <span
                        className={`shrink-0 text-xs ${checked ? "text-accent-ink" : "text-text-tertiary"
                          }`}
                      >
                        {sectionPool.get(id) ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-2 eyebrow text-text-tertiary">
                Стек
              </legend>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectStack("")}
                  className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-colors active:translate-y-px ${stack === ""
                      ? "border-border bg-accent text-accent-ink"
                      : "border-border bg-surface-alt text-text-secondary hover:bg-surface"
                    }`}
                >
                  Любой
                </button>
                {STACK_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectStack(option.id)}
                    className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-colors active:translate-y-px ${stack === option.id
                        ? "border-border bg-accent text-accent-ink"
                        : "border-border bg-surface-alt text-text-secondary hover:bg-surface"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-2 eyebrow text-text-tertiary">
                Длина интервью
              </legend>
              <div className="flex flex-wrap gap-2">
                {LENGTH_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSelectLength(option)}
                    className={`border-2 px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-colors active:translate-y-px ${length === option
                        ? "border-border bg-accent text-accent-ink"
                        : "border-border bg-surface-alt text-text-secondary hover:bg-surface"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {(poolCapped || poolEmpty) && (
            <p
              className={`border-t-2 border-border p-4 eyebrow ${poolEmpty ? "text-pale-red-text" : "text-pale-yellow-text"
                }`}
            >
              {poolEmpty
                ? "В выбранных разделах нет вопросов с ответами — выберите другие разделы"
                : `В выбранных разделах ${poolSize} вопросов — выдано ${poolSize}`}
            </p>
          )}
        </div>
      )}


      {error ? (
        <div className="panel bg-pale-red-bg p-6">
          <p className="font-mono text-sm font-bold uppercase tracking-wider text-pale-red-text">
            Не удалось загрузить вопросы — обновите страницу
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-5 md:grid-cols-2 xl:grid-cols-3 ${customOpen ? "mt-5" : ""}`}
          aria-busy={loading}
        >
          {!ready &&
            !error &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="panel h-[192px] animate-pulse bg-surface-alt"
              />
            ))}

          {ready &&
            presets.map((preset, index) => {
              const PresetIcon = PRESET_ICONS[preset.id] ?? SquaresFour;
              const color = PRESET_COLORS[preset.id] ?? "blue";

              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!ready}
                  onClick={() => onStartPreset(preset)}
                  aria-label={`Начать интервью: ${preset.title}, ${preset.count} ${questionWord(preset.count)}`}
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  className="tile card-hover group reveal p-5 disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-mono text-base font-extrabold uppercase leading-tight tracking-tight text-text transition-colors group-hover:text-accent-strong">
                      {preset.title}
                    </span>
                    <span
                      className={`shrink-0 border-2 border-border p-1 ${PRESET_BADGE_CLASSES[color]}`}
                    >
                      <PresetIcon size={20} weight="bold" />
                    </span>
                  </span>

                  <span className="mt-2 w-fit border border-border px-1.5 py-0.5 eyebrow text-text-tertiary">
                    {preset.count} {questionWord(preset.count)}
                  </span>

                  <span className="mt-4 block text-sm font-medium leading-relaxed text-text-secondary">
                    {preset.description}
                  </span>

                  <span className="mt-auto flex items-center gap-1.5 pt-4 eyebrow text-accent-strong">
                    Начать
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {customOpen && (
        <div
          role="region"
          aria-label="Запуск своего сета"
          className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-border bg-canvas"
        >
          <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-12" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <div className="min-w-0 eyebrow text-text-secondary">
              {sections.length > 0
                ? `${sections.length} ${sectionWord(sections.length)}`
                : "Разделы не выбраны"}
              {" · "}
              {stackLabel}
              {" · "}
              {length} вопросов
            </div>
            <button
              type="button"
              onClick={onStartCustom}
              disabled={!canStart}
              className="btn btn-primary btn-md"
            >
              <Microphone size={16} weight="bold" />
              Начать интервью
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
