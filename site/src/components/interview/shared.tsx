import {
  PauseCircle,
  SmileyMeh,
  ThumbsDown,
  ThumbsUp,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { AnswerStatus } from "../../lib/mock-interview/types";

export const STATUSES: AnswerStatus[] = [
  "good",
  "unsure",
  "failed",
  "skipped",
];

export const RATE_STATUSES: AnswerStatus[] = ["good", "unsure", "failed"];

export const STATUS_META: Record<
  AnswerStatus,
  {
    label: string;
    icon: ReactNode;
    bg: string;
    hoverBg: string;
    color: string;
  }
> = {
  good: {
    label: "Отлично",
    icon: <ThumbsUp size={22} weight="bold" />,
    bg: "bg-pale-green-bg",
    hoverBg: "hover:bg-pale-green-bg-hover",
    color: "text-pale-green-text",
  },
  unsure: {
    label: "Так себе",
    icon: <SmileyMeh size={22} weight="bold" />,
    bg: "bg-pale-yellow-bg",
    hoverBg: "hover:bg-pale-yellow-bg-hover",
    color: "text-pale-yellow-text",
  },
  failed: {
    label: "Плохо",
    icon: <ThumbsDown size={22} weight="bold" />,
    bg: "bg-pale-red-bg",
    hoverBg: "hover:bg-pale-red-bg-hover",
    color: "text-pale-red-text",
  },
  skipped: {
    label: "Пропущено",
    icon: <PauseCircle size={22} weight="fill" />,
    bg: "bg-surface-alt",
    hoverBg: "hover:bg-surface-alt",
    color: "text-text-secondary",
  },
};

export function questionWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "вопрос";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "вопроса";
  return "вопросов";
}

export function sectionWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раздел";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "раздела";
  return "разделов";
}

export function renderInlineCode(text: string): ReactNode[] {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : part,
  );
}
