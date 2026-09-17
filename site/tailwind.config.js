import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        'pale-red': {
          bg: 'var(--color-pale-red-bg)',
          text: 'var(--color-pale-red-text)',
        },
        'pale-blue': {
          bg: 'var(--color-pale-blue-bg)',
          text: 'var(--color-pale-blue-text)',
        },
        'pale-green': {
          bg: 'var(--color-pale-green-bg)',
          text: 'var(--color-pale-green-text)',
        },
        'pale-yellow': {
          bg: 'var(--color-pale-yellow-bg)',
          text: 'var(--color-pale-yellow-text)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};
