/**
 * Цветовые маркеры разделов теории.
 * Один источник правды для главной страницы и плиток на /theory:
 * бледная плашка с цветной иконкой, при наведении — общий лайм.
 * Классы .mark-* живут в global.css, чтобы палитра была одна.
 */
export type SectionMark =
  | "red"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "rose"
  | "indigo"
  | "violet"
  | "fuchsia"
  | "slate"
  | "neutral";

export const SECTION_MARK_CLASSES: Record<SectionMark, string> = {
  red: "mark-red",
  blue: "mark-blue",
  cyan: "mark-cyan",
  teal: "mark-teal",
  green: "mark-green",
  lime: "mark-lime",
  yellow: "mark-yellow",
  orange: "mark-orange",
  rose: "mark-rose",
  indigo: "mark-indigo",
  violet: "mark-violet",
  fuchsia: "mark-fuchsia",
  slate: "mark-slate",
  neutral: "mark-neutral",
};
