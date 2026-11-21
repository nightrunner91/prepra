import { getCollection } from "astro:content";
import { sections } from "./sections";
import { withBase } from "./urls";

export interface TheoryArticle {
  section: string;
  sectionLabel: string;
  slug: string;
  title: string;
  href: string;
}

interface ArticleEntry {
  id: string;
  data: {
    title: string;
    order: number;
  };
}

/**
 * Все статьи теории в порядке чтения: разделы идут как в реестре,
 * внутри раздела — по `order`. Один и тот же порядок используют
 * страница теории и клиентский поиск следующей непрочитанной статьи.
 */
export async function getTheoryIndex(): Promise<TheoryArticle[]> {
  const index: TheoryArticle[] = [];

  for (const section of sections) {
    const entries = (await getCollection(
      section.id as any,
    )) as unknown as ArticleEntry[];

    const ordered = [...entries].sort((a, b) => a.data.order - b.data.order);

    for (const entry of ordered) {
      index.push({
        section: section.id,
        sectionLabel: section.label,
        slug: entry.id,
        title: entry.data.title,
        href: withBase(`/${section.id}/${entry.id}`),
      });
    }
  }

  return index;
}
