import { getCollection } from "astro:content";
import { sections } from "../sections";
import { withBase } from "../urls";
import type { MockInterviewQuestion } from "./types";

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  sections.map((section) => [section.id, section.label]),
);

const PURE_STACK_SECTIONS: Record<string, string[]> = {
  react: ["react"],
  nextjs: ["nextjs", "react"],
  vue: ["vue"],
};

type ArticleEntry = {
  id: string;
  data: {
    title: string;
    order: number;
    stacks?: string[];
    questions?: string[];
    answers?: string[];
  };
};

async function buildQuestions(): Promise<MockInterviewQuestion[]> {
  const questions: MockInterviewQuestion[] = [];

  for (const section of sections) {
    const entries = (await getCollection(
      section.id as any,
    )) as unknown as ArticleEntry[];
    const sectionLabel = SECTION_LABELS[section.id] ?? section.id;
    const inferredStacks = PURE_STACK_SECTIONS[section.id] ?? [];

    for (const entry of entries) {
      const { data } = entry;
      const list = data.questions ?? [];
      const stacks = data.stacks ?? inferredStacks;

      for (let i = 0; i < list.length; i += 1) {
        questions.push({
          id: `${section.id}/${entry.id}/${i}`,
          section: section.id,
          sectionLabel,
          articleSlug: entry.id,
          articleTitle: data.title,
          url: withBase(`/${section.id}/${entry.id}`),
          order: data.order,
          stacks,
          question: list[i],
          answer: data.answers?.[i] ?? null,
        });
      }
    }
  }

  return questions;
}

/** Вопросы для интервью в порядке разделов и статей. */
export function getMockInterviewQuestions(): Promise<MockInterviewQuestion[]> {
  return buildQuestions();
}

export interface MockInterviewSummary {
  questionCount: number;
  sectionCount: number;
}

/** Каталожные метрики для шапки: сколько всего вопросов и разделов. */
export async function getMockInterviewSummary(): Promise<MockInterviewSummary> {
  const questions = await getMockInterviewQuestions();

  return {
    questionCount: questions.length,
    sectionCount: new Set(questions.map((question) => question.section)).size,
  };
}
