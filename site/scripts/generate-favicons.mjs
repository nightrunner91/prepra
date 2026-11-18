#!/usr/bin/env node
/**
 * Генерация всех иконок сайта из одного источника.
 *
 * Знак повторяет логотип в шапке: лаймовое поле accent + чёрная
 * геометрическая «P» (JetBrains Mono, жирная, без скруглений).
 * Геометрия кратна 4 в сетке 64 — на 16 и 32 px контуры остаются
 * целыми пикселями и не мылятся.
 *
 * Запуск: npm run icons
 *
 * Что пишется в public/:
 *   favicon.svg                      — основная иконка для браузеров
 *   favicon.ico                      — 16/32/48 для старых браузеров и закладок
 *   favicon-16x16.png, -32x32, -48x48
 *   apple-touch-icon.png             — iOS, 180, непрозрачный фон
 *   android-chrome-192x192.png       — Android / PWA
 *   android-chrome-512x512.png       — Android / PWA, сплэш
 *   android-chrome-maskable-512x512.png — adaptive icon, знак в safe zone
 *   safari-pinned-tab.svg            — монохромная маска для закреплённых вкладок
 *   manifest.json                 — манифест PWA
 *
 * После правки знака достаточно перезапустить скрипт: разметка в
 * BaseLayout.astro ссылается на фиксированные имена файлов.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = new URL('public/', `file://${root}`);
const OUT = fileURLToPath(outDir);

const BG = '#85E65B'; // --color-theory, он же accent по умолчанию
const INK = '#000000';

/* Знак в сетке 64: стойка 8, чаша с просветом 8, габарит 24×36. */
const MARK = 'M20 16H44V40H28V52H20ZM28 24H36V32H28Z';

/**
 * @param {object} opts
 * @param {number} [opts.scale]  размер знака относительно сетки 64
 * @param {string|null} [opts.background] цвет поля, null — прозрачный
 * @param {string} [opts.color] цвет знака
 */
function iconSvg({ scale = 1, background = BG, color = INK } = {}) {
  const transform =
    scale === 1 ? '' : ` transform="translate(32 32) scale(${scale}) translate(-32 -32)"`;
  const mark = `<path fill="${color}" fill-rule="evenodd" d="${MARK}"${transform}/>`;
  const field = background ? `<rect width="64" height="64" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${field}${mark}</svg>`;
}

/**
 * ICO-контейнер с PNG-кадрами: без внешних утилит и без потери альфы.
 * @param {{ size: number, data: Buffer }[]} images
 */
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;

  images.forEach(({ size, data }, i) => {
    const e = 16 * i;
    entries.writeUInt8(size >= 256 ? 0 : size, e + 0); // width
    entries.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    entries.writeUInt8(0, e + 2); // palette
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // color planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(data.length, e + 8);
    entries.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });

  return Buffer.concat([header, entries, ...images.map((i) => i.data)]);
}

/** @param {string} svg @param {number} size */
async function render(svg, size) {
  // Рендерим в 4× и вниз — сглаживание читаемее, чем прямая растеризация.
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function png(name, size, svg = iconSvg()) {
  await writeFile(new URL(name, outDir), await render(svg, size));
  console.log(`  ${name}  ${size}×${size}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const master = iconSvg();
  await writeFile(new URL('favicon.svg', outDir), `${master}\n`);
  console.log('  favicon.svg');

  await png('favicon-16x16.png', 16);
  await png('favicon-32x32.png', 32);
  await png('favicon-48x48.png', 48);

  const icoFrames = [];
  for (const size of [16, 32, 48]) {
    icoFrames.push({ size, data: await render(master, size) });
  }
  await writeFile(new URL('favicon.ico', outDir), buildIco(icoFrames));
  console.log('  favicon.ico  16/32/48');

  await png('apple-touch-icon.png', 180);
  await png('android-chrome-192x192.png', 192);
  await png('android-chrome-512x512.png', 512);
  // Adaptive icon обрезается маской до 80 %: знак уменьшен, поле — во весь квадрат.
  await png('android-chrome-maskable-512x512.png', 512, iconSvg({ scale: 0.78 }));

  // Safari закреплённые вкладки: одна плоская маска, цвет подставляет система.
  await writeFile(
    new URL('safari-pinned-tab.svg', outDir),
    `${iconSvg({ background: null })}\n`,
  );
  console.log('  safari-pinned-tab.svg');

  const manifest = {
    name: 'Prepra — подготовка к техническому собеседованию',
    short_name: 'Prepra',
    description:
      'Платформа для подготовки к техническому собеседованию: от фронтенда к Product Engineer.',
    lang: 'ru',
    dir: 'ltr',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#F2F2EC',
    theme_color: BG,
    icons: [
      { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: 'android-chrome-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  await writeFile(
    new URL('manifest.json', outDir),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log('  manifest.json');

  console.log('\nГотово. Иконки в public/.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
