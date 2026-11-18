import { sections } from "./sections";
import { withBase } from "./urls";

export type TopLevelPage = "theory" | "practice" | "interview";

/**
 * Активный раздел верхнего уровня по адресу страницы.
 * Теория — это и её хаб, и любая статья раздела.
 */
export function getActivePage(pathname: string): TopLevelPage | undefined {
  const normalized = pathname.replace(/\/+$/, "");

  if (normalized === withBase("/practice")) return "practice";
  if (normalized === withBase("/interview")) return "interview";

  const isTheoryPage =
    normalized === withBase("/theory") ||
    sections.some(
      (section) =>
        normalized === withBase(`/${section.id}`) ||
        normalized.startsWith(withBase(`/${section.id}/`)),
    );

  return isTheoryPage ? "theory" : undefined;
}
