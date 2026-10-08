export const READ_STORAGE_KEY = 'prepra:read-articles';

export function getReadArticles(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isArticleRead(articleId: string): boolean {
  return getReadArticles().includes(articleId);
}

export function markArticleRead(articleId: string): void {
  const current = getReadArticles();
  if (!current.includes(articleId)) {
    current.push(articleId);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('read:update'));
  }
}

export function toggleArticleRead(articleId: string): boolean {
  const current = getReadArticles();
  const idx = current.indexOf(articleId);
  const nextRead = idx === -1;
  if (nextRead) {
    current.push(articleId);
  } else {
    current.splice(idx, 1);
  }
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('read:update'));
  return nextRead;
}
