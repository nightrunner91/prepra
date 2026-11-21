import {
  SmileyMeh,
  ThumbsDown,
  ThumbsUp,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { AnswerStatus } from "../../lib/mock-interview/types";

export const STATUSES: AnswerStatus[] = ["good", "unsure", "failed"];

export const STATUS_META: Record<
  AnswerStatus,
  {
    label: string;
    icon: ReactNode;
    bg: string;
    color: string;
    rateClass: string;
  }
> = {
  good: {
    label: "Отлично",
    icon: <ThumbsUp size={22} weight="bold" />,
    bg: "bg-positive-bg",
    color: "text-positive-text",
    rateClass: "rate-btn-good",
  },
  unsure: {
    label: "Так себе",
    icon: <SmileyMeh size={22} weight="bold" />,
    bg: "bg-pale-yellow-bg",
    color: "text-pale-yellow-text",
    rateClass: "rate-btn-unsure",
  },
  failed: {
    label: "Плохо",
    icon: <ThumbsDown size={22} weight="bold" />,
    bg: "bg-pale-red-bg",
    color: "text-pale-red-text",
    rateClass: "rate-btn-failed",
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
