export const HISTORY_KEY = "prepra:search-history";
export const HISTORY_MAX = 5;

export function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX)));
  } catch {
    // localStorage может быть недоступен — история не критична
  }
}

export function addToHistory(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getHistory();
  const next = [trimmed, ...getHistory().filter((item) => item !== trimmed)];
  saveHistory(next);
  return next;
}

export function removeFromHistory(query: string): string[] {
  const next = getHistory().filter((item) => item !== query);
  saveHistory(next);
  return next;
}