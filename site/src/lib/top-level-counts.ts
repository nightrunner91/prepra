import { sections } from "./sections";
import { TASKS } from "./practice";
import { PRESETS } from "./mock-interview/presets";

/** Счётчики для верхнеуровневых табов. Считаются на этапе сборки. */
export const topLevelCounts = {
  theory: sections.length,
  practice: TASKS.length,
  interview: PRESETS.length,
};
