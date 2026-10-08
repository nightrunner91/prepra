import { CheckSquare, Square } from '@phosphor-icons/react';
import React, { useCallback, useEffect, useState } from 'react';
import { isArticleRead, toggleArticleRead } from '../../lib/readState';

export function ReadToggle({ articleId }: { articleId: string }) {
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    const sync = () => setIsRead(isArticleRead(articleId));
    sync();
    window.addEventListener('read:update', sync);
    return () => window.removeEventListener('read:update', sync);
  }, [articleId]);

  const toggle = useCallback(() => {
    setIsRead(toggleArticleRead(articleId));
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
