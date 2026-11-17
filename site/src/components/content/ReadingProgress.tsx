import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const getHeaderOffset = () =>
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--header-offset',
        ),
      ) || 0;

    const update = () => {
      const top = article.getBoundingClientRect().top + window.scrollY;
      const height = article.offsetHeight;

      // Старт — когда верх статьи поравнялся с низом шапки,
      // финиш — когда низ статьи поравнялся с низом окна.
      const start = top - getHeaderOffset();
      const end = top + height - window.innerHeight;
      const span = end - start;

      if (span <= 0) {
        setProgress(0);
        return;
      }

      const pct = ((window.scrollY - start) / span) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    const observer = new ResizeObserver(update);
    observer.observe(article);

    update();

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Прогресс чтения"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="fixed left-0 right-0 top-[var(--header-h)] z-[60] h-[3px]"
    >
      <div
        className="h-full origin-left bg-accent transition-transform duration-100"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
