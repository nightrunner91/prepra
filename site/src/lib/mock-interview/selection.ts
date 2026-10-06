import type { MockInterviewQuestion } from './types';

export type SelectionResult = {
  questions: MockInterviewQuestion[];
  available: number;
  requested: number;
};

export function questionInStacks(
  question: MockInterviewQuestion,
  stacks?: string[],
): boolean {
  if (!stacks || stacks.length === 0) return true;
  if (question.stacks.length === 0) return true;
  return question.stacks.some((s) => stacks.includes(s));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DOMINANT_SHARE = 0.7;

function computeTargets(
  bySection: Map<string, MockInterviewQuestion[]>,
  cap: number,
  mainSection?: string | null,
): Map<string, number> {
  const targets = new Map<string, number>();
  const totalPool = [...bySection.values()].reduce((n, qs) => n + qs.length, 0);

  if (mainSection && bySection.has(mainSection)) {
    const mainCount = bySection.get(mainSection)!.length;
    const takeMain = Math.min(Math.round(cap * DOMINANT_SHARE), mainCount);
    targets.set(mainSection, takeMain);
    const remainingOther = cap - takeMain;
    const othersTotal = totalPool - mainCount;
    if (remainingOther > 0 && othersTotal > 0) {
      for (const [section, questions] of bySection) {
        if (section === mainSection) continue;
        targets.set(
          section,
          Math.round((remainingOther * questions.length) / othersTotal),
        );
      }
    }
  } else {
    for (const [section, questions] of bySection) {
      targets.set(section, Math.round((cap * questions.length) / totalPool));
    }
  }

  return targets;
}

export function selectQuestions(
  index: MockInterviewQuestion[],
  sections: string[],
  stacks: string[] | undefined,
  count: number,
  mainSection?: string | null,
): SelectionResult {
  const selected = new Set(sections);
  const pool = index.filter(
    (q) => q.answer !== null && selected.has(q.section) && questionInStacks(q, stacks),
  );

  if (pool.length === 0) {
    return { questions: [], available: 0, requested: count };
  }

  const cap = Math.min(count, pool.length);

  const bySection = new Map<string, MockInterviewQuestion[]>();
  for (const q of pool) {
    const list = bySection.get(q.section);
    if (list) list.push(q);
    else bySection.set(q.section, [q]);
  }

  const picked: MockInterviewQuestion[] = [];
  const leftovers: { remaining: MockInterviewQuestion[] }[] = [];
  const targets = computeTargets(bySection, cap, mainSection);

  for (const [section, questions] of bySection) {
    const share = targets.get(section) ?? 0;
    const shuffled = shuffle(questions);
    const take = Math.min(share, questions.length);
    picked.push(...shuffled.slice(0, take));
    if (questions.length > take) {
      leftovers.push({ remaining: shuffled.slice(take) });
    }
  }

  if (picked.length < cap && leftovers.length > 0) {
    let guard = 0;
    while (picked.length < cap && leftovers.length > 0 && guard < cap * 2) {
      const idx = guard % leftovers.length;
      const next = leftovers[idx].remaining.shift();
      if (next === undefined) {
        leftovers.splice(idx, 1);
      } else {
        picked.push(next);
      }
      guard++;
    }
  }

  return {
    questions: shuffle(picked).slice(0, cap),
    available: pool.length,
    requested: count,
  };
}