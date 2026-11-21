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
  const statusLabel =
    status === "solved"
      ? "решена"
      : status === "failed"
        ? "с ошибками"
        : "не решена";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Открыть задачу ${number}: ${task.title}. ${statusLabel}`}
      className="tile card-hover group p-4"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-bold text-text-tertiary">
          #{String(number).padStart(3, "0")}
        </span>
        <StatusMark status={status} size={20} />
      </span>

      <span className="mt-2 font-mono text-base font-extrabold uppercase leading-snug tracking-tight text-text transition-colors group-hover:text-accent-strong">
        {task.title}
      </span>

      <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <TopicBadge topic={task.topic} short muted />
        <DifficultyBadge difficulty={task.difficulty} muted />
        {task.kind === "code" && (
          <span className="inline-flex items-center gap-1 border border-border bg-surface px-1.5 py-0.5 eyebrow text-text-tertiary">
            <Code size={12} weight="bold" />
            Код
          </span>
        )}
      </span>
    </button>
  );
}
