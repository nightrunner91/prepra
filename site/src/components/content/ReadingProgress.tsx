import React, { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollable = articleHeight - viewportHeight;

      if (scrollable <= 0) {
        setProgress(0);
        return;
      }

      const scrolled = -rect.top;
      const pct = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-[4px] bg-border/20">
      <div
        className="h-full bg-accent transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
