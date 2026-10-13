import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import rehypeMarkdownLinks from './src/lib/rehype-markdown-links.mjs';
import rehypeWrapTables from './src/lib/rehype-wrap-tables.mjs';
import rewriteRelativeLinks from './src/lib/rewrite-relative-links.mjs';

const BASE = '/prepra';

export default defineConfig({
  output: 'static',
  site: 'https://nightrunner91.github.io',
  base: BASE,
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
    rewriteRelativeLinks({ base: BASE }),
  ],
  markdown: {
    rehypePlugins: [rehypeMarkdownLinks, rehypeWrapTables],
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
