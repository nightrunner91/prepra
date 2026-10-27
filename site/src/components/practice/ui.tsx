import { CheckCircle, Circle, XCircle } from "@phosphor-icons/react";
import type { Difficulty, TopicId } from "../../lib/practice/types";
import { DIFFICULTY_COLOR, DIFFICULTIES, TOPIC_MAP } from "../../lib/practice/topics";

const colorClasses = {
  red: "bg-pale-red-bg text-pale-red-text",
  blue: "bg-pale-blue-bg text-pale-blue-text",
  green: "bg-pale-green-bg text-pale-green-text",
  yellow: "bg-pale-yellow-bg text-pale-yellow-text",
  neutral: "bg-surface-alt text-text-secondary",
};

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className="border border-border bg-surface-alt px-1 py-0.5 font-mono text-[0.9em] font-semibold"
          >
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const label =
    DIFFICULTIES.find((item) => item.id === difficulty)?.label ?? difficulty;
  const color = DIFFICULTY_COLOR[difficulty];

  return (
    <span
      className={`inline-flex items-center border-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${colorClasses[color]}`}
    >
      {label}
    </span>
  );
}

export function TopicBadge({
  topic,
  short = false,
}: {
  topic: TopicId;
  short?: boolean;
}) {
  const meta = TOPIC_MAP[topic];

  return (
    <span
      className={`inline-flex items-center border-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${colorClasses[meta.color]}`}
    >
      {short ? meta.short : meta.label}
    </span>
  );
}

export function KindBadge({ kind }: { kind: "choice" | "code" }) {
  return (
    <span className="inline-flex items-center border-2 border-border bg-surface-alt px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary">
      {kind === "code" ? "Код" : "Выбор ответа"}
    </span>
  );
}

export function StatusMark({
  status,
  size = 18,
}: {
  status?: "solved" | "failed";
  size?: number;
}) {
  if (status === "solved") {
    return <CheckCircle size={size} weight="fill" className="text-pale-green-text" />;
  }
  if (status === "failed") {
    return <XCircle size={size} weight="fill" className="text-pale-red-text" />;
  }
  return <Circle size={size} weight="bold" className="text-text-tertiary" />;
}

export function ProgressBar({
  value,
  total,
  className = "",
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));

  return (
    <div
      className={`h-2.5 w-full border-2 border-border bg-surface-alt ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className="h-full bg-accent transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function formatValue(value: unknown): string {
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return "function";
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "bigint") return `${value}n`;

  try {
    return JSON.stringify(
      value,
      (_key, current) => {
        if (current instanceof Map) return Object.fromEntries(current);
        if (current instanceof Set) return [...current];
        if (typeof current === "undefined") return "__undefined__";
        return current;
      },
      2,
    );
  } catch {
    return String(value);
  }
}
