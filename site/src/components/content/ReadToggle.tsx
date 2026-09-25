import { CheckSquare, Square } from '@phosphor-icons/react';
import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'prepra:read-articles';

function getReadArticles(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function ReadToggle({ articleId }: { articleId: string }) {
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    setIsRead(getReadArticles().includes(articleId));
  }, [articleId]);

  const toggle = useCallback(() => {
    const current = getReadArticles();
    const idx = current.indexOf(articleId);
    if (idx === -1) {
      current.push(articleId);
    } else {
      current.splice(idx, 1);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    setIsRead(idx === -1);
    window.dispatchEvent(new CustomEvent('read:update'));
  }, [articleId]);

  return (
    <button
      id="read-toggle"
      type="button"
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-2 border-[3px] px-6 py-3 font-mono font-bold uppercase tracking-wider transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000000] dark:hover:shadow-[4px_4px_0px_#ffffff] active:translate-x-0 active:translate-y-0 active:shadow-none ${
        isRead
          ? 'border-pale-green-text bg-pale-green-bg-hover text-pale-green-text-hover shadow-none'
          : 'border-border bg-surface-alt text-text-secondary'
      }`}
    >
      {isRead ? <CheckSquare size={20} weight="bold" /> : <Square size={20} weight="bold" />}
      {isRead ? 'Изучено' : 'Отметить изученным'}
    </button>
  );
}
