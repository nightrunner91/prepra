import { getCollection } from "astro:content";
import { withBase } from "../lib/urls";
import { sections } from "../lib/sections";
import { expandTerm } from "../lib/search/translit";

type ArticleEntry = {
  id: string;
  collection: string;
  data: {
    title: string;
    description?: string;
    order: number;
    tags?: string[];
    questions?: string[];
  };
};

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

function buildText(title: string, tags: string[], sectionLabel: string): string {
  const tokens = new Set<string>();
  const add = (raw: string) => {
    if (!raw) return;
    tokens.add(raw);
    for (const variant of expandTerm(raw)) {
      if (variant) tokens.add(variant);
    }
  };
  add(title);
  tags.forEach(add);
  add(sectionLabel);
  return [...tokens].join(" ");
}

export async function GET() {
  const documents: Array<Record<string, unknown>> = [];

  for (const col of COLLECTIONS) {
    const entries = (await getCollection(col as any)) as unknown as ArticleEntry[];
    const sectionLabel = SECTION_LABELS[col] ?? col;

    for (const entry of entries) {
      const { data } = entry;
      documents.push({
        id: `${col}/${entry.id}`,
        title: data.title,
        tags: data.tags ?? [],
        text: buildText(data.title, data.tags ?? [], sectionLabel),
        description: data.description ?? "",
        url: withBase(`/${col}/${entry.id}`),
        section: col,
        sectionLabel,
        order: data.order,
        questionCount: data.questions?.length ?? 0,
      });
    }
  }

  return new Response(JSON.stringify(documents), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}