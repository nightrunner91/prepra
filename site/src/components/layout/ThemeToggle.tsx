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
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next ? '#0A0A0A' : '#F2F2EC');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {dark ? (
        <Sun size={18} weight="bold" />
      ) : (
        <Moon size={18} weight="bold" />
      )}
    </button>
  );
}
