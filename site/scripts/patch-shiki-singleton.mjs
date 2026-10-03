// Makes Astro's Shiki highlighter a process-wide singleton.
//
// Astro 5 creates a separate Shiki highlighter for every content collection
// (this project has 15). Each highlighter spins up its own Oniguruma WASM
// instance, and once enough of them exist the WASM engine traps with
// "RuntimeError: memory access out of bounds" while highlighting a Markdown
// file. Newer Astro versions memoize the highlighter, but until this project
// upgrades we patch @astrojs/markdown-remark to cache it by config.
//
// The transformation is idempotent and fails loudly if the upstream file no
// longer matches, so a dependency bump cannot silently reintroduce the bug.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../node_modules/@astrojs/markdown-remark/dist/shiki.js');

if (!existsSync(target)) {
  console.warn(`[patch-shiki-singleton] Skipped: ${target} not found.`);
  process.exit(0);
}

let source = readFileSync(target, 'utf8');

if (source.includes('_shikiHighlighterCache')) {
  console.log('[patch-shiki-singleton] Already patched.');
  process.exit(0);
}

const marker = `async function createShikiHighlighter({
  langs = [],
  theme = "github-dark",
  themes = {},
  langAlias = {}
} = {}) {
  theme = theme === "css-variables" ? cssVariablesTheme() : theme;`;

const replacement = `const _shikiHighlighterCache = /* @__PURE__ */ new Map();
function createShikiHighlighter(options = {}) {
  const key = JSON.stringify([
    options.langs ?? [],
    options.theme ?? "github-dark",
    Object.entries(options.themes ?? {}).sort(),
    Object.entries(options.langAlias ?? {}).sort()
  ]);
  let highlighter = _shikiHighlighterCache.get(key);
  if (!highlighter) {
    highlighter = createShikiHighlighterInternal(options);
    _shikiHighlighterCache.set(key, highlighter);
  }
  return highlighter;
}
async function createShikiHighlighterInternal({
  langs = [],
  theme = "github-dark",
  themes = {},
  langAlias = {}
} = {}) {
  theme = theme === "css-variables" ? cssVariablesTheme() : theme;`;

if (!source.includes(marker)) {
  console.error(
    '[patch-shiki-singleton] Could not find the expected createShikiHighlighter signature in ' +
      target +
      '. The dependency layout changed; re-check the Shiki singleton patch.'
  );
  process.exit(1);
}

source = source.replace(marker, replacement);
writeFileSync(target, source);
console.log('[patch-shiki-singleton] Patched @astrojs/markdown-remark to use a singleton Shiki highlighter.');
