import {
  CaretDown,
  Check,
  Funnel,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
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
  { value: "failed", label: "Ошибки" },
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

interface FilterOption {
  value: string;
  label: string;
}

const TOPIC_OPTIONS: FilterOption[] = [
  { value: "all", label: "Все темы" },
  ...TOPICS.map((topic) => ({ value: topic.id, label: topic.label })),
];

const DIFFICULTY_OPTIONS: FilterOption[] = [
  { value: "all", label: "Любая сложность" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
];

const KIND_OPTIONS: FilterOption[] = [
  { value: "all", label: "Все типы" },
  { value: "choice", label: "Выбор ответа" },
  { value: "code", label: "Код" },
];

/** Высота меню (max-h-64) нужна, чтобы выбрать сторону до открытия. */
const MENU_HEIGHT = 256;

/** Кастомный селект: системное меню нельзя оформить под дизайн,
    поэтому триггер, список и состояния собраны на месте.
    Фокус остаётся на триггере, а активный пункт отмечается
    через aria-activedescendant — как в нативном combobox. */
function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: FilterOption[];
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [menuMaxHeight, setMenuMaxHeight] = useState(MENU_HEIGHT);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex] ?? options[0];

  function placeMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;

    setPlacement(openUp ? "top" : "bottom");
    setMenuMaxHeight(
      Math.max(96, Math.min(MENU_HEIGHT, openUp ? spaceAbove : spaceBelow)),
    );
  }

  function openMenu() {
    setActiveIndex(selectedIndex);
    placeMenu();
    setOpen(true);
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handleOutside);
    window.addEventListener("scroll", placeMenu, { passive: true });
    window.addEventListener("resize", placeMenu);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      window.removeEventListener("scroll", placeMenu);
      window.removeEventListener("resize", placeMenu);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const option = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    option?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((index) => (index + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openMenu();
        else
          setActiveIndex(
            (index) => (index - 1 + options.length) % options.length,
          );
        break;
      case "Home":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openMenu();
        else selectOption(activeIndex);
        break;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative block">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open ? `${listId}-${activeIndex}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`field flex appearance-none items-center justify-between gap-2 text-left ${
          open ? "border-accent-strong bg-surface" : ""
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden="true"
          className={`shrink-0 text-text-tertiary transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        hidden={!open}
        className={`absolute left-0 z-30 w-full ${
          placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
        }`}
      >
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          data-placement={placement}
          style={{ maxHeight: menuMaxHeight }}
          className="dropdown-menu max-h-64 overflow-y-auto border-2 border-border bg-surface"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(index)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                  isSelected
                    ? "bg-accent text-accent-ink"
                    : isActive
                      ? "bg-surface-alt text-text"
                      : "text-text-secondary"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className="shrink-0"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();

  const activeFilterCount =
    Number(topic !== "all") +
    Number(difficulty !== "all") +
    Number(kind !== "all") +
    Number(status !== "all");

  const hasFilters = activeFilterCount > 0 || search !== "";
  const filterLabel = filtersOpen ? "Скрыть фильтры" : "Показать фильтры";
  const filterAriaLabel =
    activeFilterCount > 0
      ? `${filterLabel}, активно: ${activeFilterCount}`
      : filterLabel;

  return (
    <div className="panel p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <label className="relative block min-w-0 flex-1">
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

        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          aria-label={filterAriaLabel}
          title={filterLabel}
          className="icon-btn icon-btn-solid relative"
        >
          <Funnel size={18} weight="bold" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="filter-count" aria-hidden="true">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div
        id={filtersId}
        hidden={!filtersOpen}
        className="mt-3 border-t-2 border-border pt-3"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <FilterSelect
            value={topic}
            onChange={(value) => onTopic(value as TopicFilter)}
            label="Тема"
            options={TOPIC_OPTIONS}
          />

          <FilterSelect
            value={difficulty}
            onChange={(value) => onDifficulty(value as DifficultyFilter)}
            label="Сложность"
            options={DIFFICULTY_OPTIONS}
          />

          <FilterSelect
            value={kind}
            onChange={(value) => onKind(value as KindFilter)}
            label="Тип задачи"
            options={KIND_OPTIONS}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatus(option.value)}
              aria-pressed={status === option.value}
              className={`border-2 border-border px-2 py-0.5 eyebrow transition-colors ${
                status === option.value
                  ? "bg-accent text-accent-ink active:bg-accent-hover"
                  : "bg-canvas text-text-secondary hover:bg-surface-alt hover:text-text active:bg-surface-alt"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="eyebrow text-text-tertiary" aria-live="polite">
          Найдено: {found}
        </span>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto eyebrow text-text-secondary underline decoration-2 underline-offset-2 transition-colors hover:text-accent-strong"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
