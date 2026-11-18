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
          ink: 'var(--color-accent-ink)',
          strong: 'var(--color-accent-strong)',
        },
        invert: {
          bg: 'var(--color-invert-bg)',
          text: 'var(--color-invert-text)',
          muted: 'var(--color-invert-muted)',
          accent: 'var(--color-invert-accent)',
        },
        'pale-red': {
          bg: 'var(--color-pale-red-bg)',
          text: 'var(--color-pale-red-text)',
          'bg-hover': 'var(--color-pale-red-bg-hover)',
          'text-hover': 'var(--color-pale-red-text-hover)',
        },
        'pale-blue': {
          bg: 'var(--color-pale-blue-bg)',
          text: 'var(--color-pale-blue-text)',
          'bg-hover': 'var(--color-pale-blue-bg-hover)',
          'text-hover': 'var(--color-pale-blue-text-hover)',
        },
        positive: {
          bg: 'var(--color-positive-bg)',
          text: 'var(--color-positive-text)',
          'bg-hover': 'var(--color-positive-bg-hover)',
          'text-hover': 'var(--color-positive-text-hover)',
        },
        'pale-yellow': {
          bg: 'var(--color-pale-yellow-bg)',
          text: 'var(--color-pale-yellow-text)',
          'bg-hover': 'var(--color-pale-yellow-bg-hover)',
          'text-hover': 'var(--color-pale-yellow-text-hover)',
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
