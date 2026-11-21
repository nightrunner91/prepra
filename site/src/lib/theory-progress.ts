import { getReadArticles } from "./readState";

export interface TheoryProgressArticle {
  section: string;
  title: string;
  href: string;
}

export interface TheoryProgressSnapshot {
  read: number;
  total: number;
  answered: number;
  percent: number;
  remaining: number;
  next: TheoryProgressArticle | null;
}

const QUIZ_PREFIX = "prepra:quiz:";

function getReadIdSet(): Set<string> {
  const stored = getReadArticles();
  if (!Array.isArray(stored)) return new Set();

  return new Set(
    stored.filter(
      (articleId): articleId is string => typeof articleId === "string",
    ),
  );
}

/**
 * Сколько вопросов уже отвечено. Квиз хранит последнюю попытку по статье,
 * поэтому суммируем ответы только из `lastAttempt`, а не из всех попыток.
 */
export function getAnsweredCount(): number {
  let count = 0;

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(QUIZ_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const data = JSON.parse(raw) as {
        lastAttempt?: { answers?: Record<string, unknown> };
      };
      const answers = data?.lastAttempt?.answers;

      if (answers && typeof answers === "object") {
        count += Object.values(answers).filter(
          (status) => status !== "skipped",
        ).length;
      }
    }
  } catch {
    // localStorage может быть недоступен в приватном режиме.
  }

  return count;
}

/**
 * Считает персональный прогресс по теории. Если индекс статей ещё не
 * загружен, количество прочитанных ограничивается общим числом статей,
 * а «следующая статья» остаётся неизвестной.
 */
export function getTheoryProgress(
  articles: TheoryProgressArticle[],
  totalArticles: number,
  totalQuestions: number,
): TheoryProgressSnapshot {
  const readIds = getReadIdSet();
  const indexed = articles.length > 0;
  const total = Math.max(0, indexed ? articles.length : totalArticles);

  const read = indexed
    ? articles.reduce(
        (sum, article) => sum + (readIds.has(article.href) ? 1 : 0),
        0,
      )
    : Math.min(readIds.size, total);

  const safeRead = Math.min(read, total);
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((safeRead / total) * 100));
  const next = indexed
    ? (articles.find((article) => !readIds.has(article.href)) ?? null)
    : null;

  return {
    read: safeRead,
    total,
    answered: Math.min(getAnsweredCount(), Math.max(0, totalQuestions)),
    percent,
    remaining: Math.max(0, total - safeRead),
    next,
  };
}

/** Общие события прогресса: чтение, квизы и изменения в другой вкладке. */
export function subscribeTheoryProgress(listener: () => void): () => void {
  const events = ["read:update", "quiz:update", "storage"] as const;

  for (const event of events) {
    window.addEventListener(event, listener);
  }

  return () => {
    for (const event of events) {
      window.removeEventListener(event, listener);
    }
  };
}

export async function fetchTheoryIndex(
  url: string,
): Promise<TheoryProgressArticle[]> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить индекс теории: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  return data.filter((item): item is TheoryProgressArticle => {
    if (!item || typeof item !== "object") return false;
    const value = item as Record<string, unknown>;
    return (
      typeof value.href === "string" &&
      typeof value.title === "string" &&
      typeof value.section === "string"
    );
  });
}
