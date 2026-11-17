import { Funnel, MagnifyingGlass } from "@phosphor-icons/react";
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

        <select
          value={topic}
          onChange={(event) => onTopic(event.target.value as TopicFilter)}
          className="field"
          aria-label="Тема"
        >
          <option value="all">Все темы</option>
          {TOPICS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            onDifficulty(event.target.value as DifficultyFilter)
          }
          className="field"
          aria-label="Сложность"
        >
          <option value="all">Любая сложность</option>
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
        </select>

        <select
          value={kind}
          onChange={(event) => onKind(event.target.value as KindFilter)}
          className="field"
          aria-label="Тип задачи"
        >
          <option value="all">Все типы</option>
          <option value="choice">Выбор ответа</option>
          <option value="code">Код</option>
        </select>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Funnel size={13} weight="bold" className="text-text-tertiary" />
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatus(option.value)}
            aria-pressed={status === option.value}
            className={`border-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
              status === option.value
                ? "bg-text text-canvas"
                : "bg-canvas text-text-secondary hover:bg-surface-alt hover:text-text"
            }`}
          >
            {option.label}
          </button>
        ))}

        <span
          className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary"
          aria-live="polite"
        >
          Найдено: {found}
        </span>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary underline decoration-2 underline-offset-2 transition-colors hover:text-accent"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
