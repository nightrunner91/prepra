import { getCollection } from "astro:content";
import { withBase } from "../lib/urls";
import { sections } from "../lib/sections";
import type { MockInterviewQuestion } from "../lib/mock-interview/types";

const COLLECTIONS = [
  "javascript",
  "typescript",
  "html-css",
  "react",
  "vue",
  "nuxt",
  "nextjs",
  "testing",
  "performance",
  "architecture",
  "state-management",
  "api-communication",
  "build-and-deployment",
  "security",
  "ai",
] as const;

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  sections.map((s) => [s.id, s.label]),
);

type ArticleEntry = {
  id: string;
  data: {
    title: string;
    order: number;
    questions?: string[];
    answers?: string[];
  };
};

export async function GET() {
  const questions: MockInterviewQuestion[] = [];

  for (const col of COLLECTIONS) {
    const entries = (await getCollection(col as any)) as unknown as ArticleEntry[];
    const sectionLabel = SECTION_LABELS[col] ?? col;

    for (const entry of entries) {
      const { data } = entry;
      const list = data.questions ?? [];
      for (let i = 0; i < list.length; i++) {
        questions.push({
          id: `${col}/${entry.id}/${i}`,
          section: col,
          sectionLabel,
          articleSlug: entry.id,
          articleTitle: data.title,
          url: withBase(`/${col}/${entry.id}`),
          order: data.order,
          question: list[i],
          answer: data.answers?.[i] ?? null,
        });
      }
    }
  }

  return new Response(JSON.stringify(questions), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}