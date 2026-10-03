import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import rehypeMarkdownLinks from './src/lib/rehype-markdown-links.mjs';

export default defineConfig({
  output: 'static',
  site: 'https://nightrunner91.github.io',
  base: '/prepra',
  server: {
    port: 8305,
    fs: {
      allow: [".."],
    },
  },
  integrations: [
    mdx(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeMarkdownLinks],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
      langs: [
        'ts',
        'typescript',
        'js',
        'javascript',
        'jsx',
        'tsx',
        'vue',
        'css',
        'bash',
        'shell',
        'html',
        'yaml',
        'http',
        'json',
        'text',
        'dockerfile',
        'nginx',
        'graphql',
        'sql',
        'markdown',
        'toml',
        'ini',
        'dotenv',
      ],
      langAlias: {
        env: 'dotenv',
        gitignore: 'ini',
      },
    },
  },
});
