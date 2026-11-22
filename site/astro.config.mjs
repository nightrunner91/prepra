import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import rehypeMarkdownLinks from './src/lib/rehype-markdown-links.mjs';
import rehypeWrapTables from './src/lib/rehype-wrap-tables.mjs';
import rehypeAsciiDiagrams from './src/lib/rehype-ascii-diagrams.mjs';
import rewriteRelativeLinks from './src/lib/rewrite-relative-links.mjs';
import legacyRedirects from './src/lib/legacy-redirects.mjs';

const BASE = '/';
const SITE = 'https://prepra.up.railway.app';

export default defineConfig({
  output: 'static',
  site: SITE,
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
    sitemap(),
    rewriteRelativeLinks({ base: BASE }),
    legacyRedirects({ base: BASE }),
  ],
  markdown: {
    rehypePlugins: [rehypeMarkdownLinks, rehypeWrapTables, rehypeAsciiDiagrams],
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
