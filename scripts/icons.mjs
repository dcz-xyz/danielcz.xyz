#!/usr/bin/env node
/**
 * Generates the favicon set from one mark: a Poppins 700 "D" on a rounded
 * near-black square (white on black in dark mode for the SVG).
 *
 *   public/favicon.svg         vector, follows prefers-color-scheme
 *   public/favicon.ico         32 px (PNG inside an ICO container)
 *   public/apple-touch-icon.png 180 px, opaque, iOS rounds it itself
 *   public/icon-192.png, public/icon-512.png  web app manifest icons
 *   public/site.webmanifest
 *
 *   npm run icons
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const FONT = require.resolve('@fontsource/poppins/files/poppins-latin-700-normal.woff');
const BG = '#141414';
const FG = '#ffffff';
const SIZE = 512;
const RADIUS = 112; // ~22% corner radius
const LETTER = 'D';

const bytes = readFileSync(FONT);
const font = opentype.parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
);
const unitsPerEm = font.unitsPerEm;
const capHeight = font.tables.os2?.sCapHeight || unitsPerEm * 0.7;
const fontSize = (0.54 * SIZE) / (capHeight / unitsPerEm);

// Centre the glyph's bounding box in the square.
const probe = font.getPath(LETTER, 0, 0, fontSize);
const box = probe.getBoundingBox();
const x = (SIZE - (box.x2 - box.x1)) / 2 - box.x1;
const y = (SIZE - (box.y2 - box.y1)) / 2 - box.y1;
const d = font.getPath(LETTER, x, y, fontSize).toPathData(2);

const svg = (dark) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <style>
    .bg { fill: ${BG}; }
    .fg { fill: ${FG}; }${
      dark
        ? `
    @media (prefers-color-scheme: dark) {
      .bg { fill: ${FG}; }
      .fg { fill: ${BG}; }
    }`
        : ''
    }
  </style>
  <rect class="bg" width="${SIZE}" height="${SIZE}" rx="${RADIUS}" />
  <path class="fg" d="${d}" />
</svg>
`;

writeFileSync('public/favicon.svg', svg(true));

const lightSvg = Buffer.from(svg(false));
const squareSvg = Buffer.from(svg(false).replace(` rx="${RADIUS}"`, ''));

const png = (source, size) => sharp(source, { density: 384 }).resize(size, size).png().toBuffer();

const [ico32, apple, i192, i512] = await Promise.all([
  png(lightSvg, 32),
  png(squareSvg, 180),
  png(lightSvg, 192),
  png(lightSvg, 512),
]);

// ICO container with a single PNG-encoded 32 px image.
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // count
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(ico32.length, 14); // image size
header.writeUInt32LE(22, 18); // image offset
writeFileSync('public/favicon.ico', Buffer.concat([header, ico32]));

writeFileSync('public/apple-touch-icon.png', apple);
writeFileSync('public/icon-192.png', i192);
writeFileSync('public/icon-512.png', i512);

writeFileSync(
  'public/site.webmanifest',
  JSON.stringify(
    {
      name: 'Daniel Campos Zamora',
      short_name: 'DCZ',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      start_url: './',
      display: 'browser',
      background_color: '#ffffff',
      theme_color: BG,
    },
    null,
    2,
  ) + '\n',
);

console.log(
  'Icons written: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest',
);
