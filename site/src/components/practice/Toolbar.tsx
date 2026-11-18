import { CaretDown, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { TOPICS } from "../../lib/practice";
import type { Difficulty, TopicId } from "../../lib/practice/types";

export type StatusFilter = "all" | "todo" | "solved" | "failed";
export type KindFilter = "all" | "choice" | "code";
export type TopicFilter = TopicId | "all";
export type DifficultyFilter = Difficulty | "all";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "todo", label: "Не решено" },
  { value: "solved", label: "Решено" },
  { value: "failed", label: "С ошибкой" },
];

interface ToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  topic: TopicFilter;
  onTopic: (value: TopicFilter) => void;
  difficulty: DifficultyFilter;
  onDifficulty: (value: DifficultyFilter) => void;
  kind: KindFilter;
  onKind: (value: KindFilter) => void;
  status: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  onReset: () => void;
  found: number;
}

/** Селект со своей стрелкой: нативная прилипает к правому краю и мелкая. */
function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field field-select"
        aria-label={label}
      >
        {children}
      </select>
      <CaretDown
        size={16}
        weight="bold"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
      />
    </span>
  );
}

export function Toolbar({
  search,
  onSearch,
  topic,
  onTopic,
  difficulty,
  onDifficulty,
  kind,
  onKind,
  status,
  onStatus,
  onReset,
  found,
}: ToolbarProps) {
  const hasFilters =
    topic !== "all" ||
    difficulty !== "all" ||
    kind !== "all" ||
    status !== "all" ||
    search !== "";

  return (
    <div className="panel p-3 sm:p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            <MagnifyingGlass size={16} weight="bold" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Поиск: замыкание, Map, event loop..."
            className="field pl-9"
            aria-label="Поиск задач"
          />
        </label>

        <FilterSelect
          value={topic}
          onChange={(value) => onTopic(value as TopicFilter)}
          label="Тема"
        >
          <option value="all">Все темы</option>
          {TOPICS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={difficulty}
          onChange={(value) => onDifficulty(value as DifficultyFilter)}
          label="Сложность"
        >
          <option value="all">Любая сложность</option>
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
        </FilterSelect>

        <FilterSelect
          value={kind}
          onChange={(value) => onKind(value as KindFilter)}
          label="Тип задачи"
        >
          <option value="all">Все типы</option>
          <option value="choice">Выбор ответа</option>
          <option value="code">Код</option>
        </FilterSelect>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Funnel size={13} weight="bold" className="text-text-tertiary" />
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatus(option.value)}
            aria-pressed={status === option.value}
            className={`border-2 border-border px-2 py-0.5 eyebrow transition-colors active:translate-y-px ${
              status === option.value
                ? "bg-accent text-accent-ink"
                : "bg-canvas text-text-secondary hover:bg-surface-alt hover:text-text"
            }`}
          >
            {option.label}
          </button>
        ))}

        <span
          className="ml-auto eyebrow text-text-tertiary"
          aria-live="polite"
        >
          Найдено: {found}
        </span>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="eyebrow text-text-secondary underline decoration-2 underline-offset-2 transition-colors hover:text-accent-strong"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
