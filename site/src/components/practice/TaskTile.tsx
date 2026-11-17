import { Code } from "@phosphor-icons/react";
import type { Task } from "../../lib/practice/types";
import { DifficultyBadge, StatusMark, TopicBadge } from "./ui";

interface TaskTileProps {
  task: Task;
  number: number;
  status?: "solved" | "failed";
  onOpen: () => void;
}

export function TaskTile({ task, number, status, onOpen }: TaskTileProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Открыть задачу ${number}: ${task.title}`}
      className="tile card-hover group p-4"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] font-bold text-text-tertiary">
          #{String(number).padStart(3, "0")}
        </span>
        <StatusMark status={status} size={16} />
      </span>

      <span className="mt-2 font-mono text-sm font-extrabold uppercase leading-snug tracking-tight text-text transition-colors group-hover:text-accent">
        {task.title}
      </span>

      <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <TopicBadge topic={task.topic} short />
        <DifficultyBadge difficulty={task.difficulty} />
        {task.kind === "code" && (
          <span className="inline-flex items-center gap-1 border-2 border-border bg-surface-alt px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            <Code size={11} weight="bold" />
            Код
          </span>
        )}
      </span>
    </button>
  );
}
