import { Moon, Sun } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center h-9 w-9 border-2 border-border text-text-secondary hover:bg-text hover:text-canvas transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? (
        <Sun size={18} weight="bold" />
      ) : (
        <Moon size={18} weight="bold" />
      )}
    </button>
  );
}
