#!/usr/bin/env node
/**
 * Проверка вёрстки на самодельные значения.
 *
 * Правила (см. .opencode/instructions.md → «Вёрстка и UI»):
 * - размер шрифта только из шкалы Tailwind, минимум text-xs (12px);
 * - никаких text-[13px], text-[0.9em] и style={{ fontSize }};
 * - цвета только через токены темы, без bg-[#fff] и подобных.
 *
 * Запуск: npm run check:styles
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');
const MARKUP = new Set(['.astro', '.tsx', '.ts']);
const MIN_PX = 12;

const MARKUP_RULES = [
  {
    // text-[13px], text-[0.9em], text-[1.1rem]
    pattern: /text-\[\d[\d.]*(?:px|rem|em)\]/g,
    message: 'произвольный размер шрифта — возьми ступень шкалы Tailwind',
  },
  {
    // text-[#333], bg-[#fff], border-[#000]
    pattern: /(?:bg|text|border|fill|stroke|from|to|via)-\[#/g,
    message: 'произвольный цвет — заведи токен темы',
  },
  {
    // style={{ fontSize: 12 }}
    pattern: /style=\{\{[^}]*fontSize/g,
    message: 'размер шрифта в style — используй класс',
  },
  {
    // style="font-size: 13px"
    pattern: /style="[^"]*font-size/g,
    message: 'размер шрифта в inline-стиле — используй класс',
  },
];

const CSS_RULES = [
  {
    // font-size: 10px / 0.6rem в компонентных классах
    pattern: /font-size:\s*([\d.]+)(px|rem)/g,
    // Печать, токены шкалы и fluid-значения живут по своим правилам.
    allow: (line) => /@media print|var\(--font-size-|clamp\(/.test(line),
    message: (match) => {
      const px = match[2] === 'px' ? Number(match[1]) : Number(match[1]) * 16;
      return px < MIN_PX
        ? `шрифт ${match[0].split(':')[1].trim()} меньше ${MIN_PX}px — минимальная ступень text-xs`
        : 'фиксированный размер шрифта в CSS — используй ступень шкалы';
    },
  },
];

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text[i] === '\n') line += 1;
  return line;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

function sniff(text, rules) {
  const hits = [];
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      const start = text.lastIndexOf('\n', match.index) + 1;
      const end = text.indexOf('\n', match.index);
      const lineText = text.slice(start, end === -1 ? undefined : end);
      if (rule.allow?.(lineText)) continue;
      hits.push({
        line: lineOf(text, match.index),
        message:
          typeof rule.message === 'function'
            ? rule.message(match)
            : rule.message,
        fragment: match[0],
      });
    }
  }
  return hits;
}

const files = (await walk(srcDir)).filter((file) =>
  ['.astro', '.tsx', '.ts', '.css'].includes(extname(file)),
);

const violations = [];
for (const file of files) {
  const ext = extname(file);
  const text = await readFile(file, 'utf8');
  const hits = sniff(text, ext === '.css' ? CSS_RULES : MARKUP_RULES);
  for (const hit of hits) {
    violations.push({ file: relative(root, file), ...hit });
  }
}

if (violations.length === 0) {
  console.log(`check:styles — ок, проверил ${files.length} файлов`);
  process.exit(0);
}

console.error(`check:styles — ${violations.length} нарушений:\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.message}\n    ${v.fragment}`);
}
process.exit(1);
