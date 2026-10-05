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

export function selectQuestions(
  index: MockInterviewQuestion[],
  sections: string[],
  stacks: string[] | undefined,
  count: number,
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

  const totalPool = pool.length;
  const picked: MockInterviewQuestion[] = [];
  const leftovers: { remaining: MockInterviewQuestion[] }[] = [];

  for (const questions of bySection.values()) {
    const share = Math.round((cap * questions.length) / totalPool);
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