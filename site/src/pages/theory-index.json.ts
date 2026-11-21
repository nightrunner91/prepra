import { getTheoryIndex } from "../lib/theory-index";

/**
 * Компактный индекс статей для блока прогресса: клиенту нужны только
 * ссылка и название, чтобы найти первую непрочитанную статью.
 */
export async function GET() {
  const articles = await getTheoryIndex();
  const payload = articles.map(({ section, title, href }) => ({
    section,
    title,
    href,
  }));

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
