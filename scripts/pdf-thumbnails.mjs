#!/usr/bin/env node
/**
 * Renders page 1 of each publication's PDF to src/assets/images/pubs/<key>-page1.png,
 * the image used as the clickable thumbnail in the publications list.
 * Needs poppler's `pdftoppm` (macOS: `brew install poppler`).
 *
 *   npm run pdf-thumbs            render missing thumbnails
 *   npm run pdf-thumbs -- --force re-render all
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const FORCE = process.argv.includes('--force');
const PUBS = 'src/content/publications';
const OUT = 'src/assets/images/pubs';
const DPI = 110; // ~935 px wide for US letter: plenty for a 140 px tile on a 3x screen

try {
  execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
} catch {
  console.error('pdftoppm not found. Install poppler (macOS: brew install poppler) and retry.');
  process.exit(1);
}

let rendered = 0;
for (const file of readdirSync(PUBS).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))) {
  const key = file.slice(0, -5);
  const data = parse(readFileSync(join(PUBS, file), 'utf8'));
  const pdf = data.links?.pdf;
  if (!pdf) {
    console.warn(`  skip ${key}: no links.pdf`);
    continue;
  }
  const source = join('public', pdf);
  const target = join(OUT, `${key}-page1.png`);
  if (!existsSync(source)) {
    console.error(`  error ${key}: ${source} not found`);
    process.exitCode = 1;
    continue;
  }
  if (existsSync(target) && !FORCE) continue;
  const prefix = join(OUT, `${key}-page1`);
  execFileSync('pdftoppm', [
    '-png',
    '-r',
    String(DPI),
    '-f',
    '1',
    '-l',
    '1',
    '-singlefile',
    source,
    prefix,
  ]);
  if (!existsSync(target) && existsSync(`${prefix}.png`)) renameSync(`${prefix}.png`, target);
  rendered += 1;
  console.log(`  rendered ${target}`);
}
console.log(`PDF thumbnails: ${rendered} rendered.`);
