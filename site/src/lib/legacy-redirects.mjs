import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Старые URL разделов, которых больше нет: nuxt слит в vue,
 * state-management распущен по react / vue / html-css.
 * GitHub Pages умеет только статику, поэтому на каждый старый адрес
 * генерируется meta-refresh заглушка с canonical.
 */
const REDIRECTS = {
  'nuxt/app-lifecycle': 'vue/nuxt-app-lifecycle',
  'nuxt/composables-and-auto-imports': 'vue/nuxt-composables-and-auto-imports',
  'nuxt/data-fetching': 'vue/nuxt-data-fetching',
  'nuxt/error-handling': 'vue/nuxt-error-handling',
  'nuxt/file-based-routing': 'vue/nuxt-file-based-routing',
  'nuxt/fundamentals': 'vue/nuxt-fundamentals',
  'nuxt/layers': 'vue/nuxt-layers',
  'nuxt/modules-ecosystem': 'vue/nuxt-modules-ecosystem',
  'nuxt/nitro-server': 'vue/nuxt-nitro-server',
  'nuxt/rendering-modes': 'vue/nuxt-rendering-modes',
  'nuxt/state-and-seo': 'vue/nuxt-state-and-seo',
  'state-management/client-storage': 'html-css/client-storage',
  'state-management/pinia': 'vue/pinia',
  'state-management/redux': 'react/redux',
  'state-management/tanstack-query': 'react/tanstack-query',
  'state-management/vuex': 'vue/vuex',
  'state-management/zustand': 'react/zustand',
};

function redirectHtml(target) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Переадресация</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0;url=${target}">
</head>
<body>
<a href="${target}">Перейти</a>
</body>
</html>
`;
}

export default function legacyRedirects({ base = '/prepra' } = {}) {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  return {
    name: 'legacy-redirects',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);

        for (const [from, to] of Object.entries(REDIRECTS)) {
          const target = `${normalizedBase}/${to}/`;
          const file = join(outDir, from, 'index.html');
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, redirectHtml(target), 'utf8');
        }

        logger.info(`legacy redirects: ${Object.keys(REDIRECTS).length}`);
      },
    },
  };
}
