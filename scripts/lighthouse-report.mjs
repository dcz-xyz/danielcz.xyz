#!/usr/bin/env node
/**
 * Summarises the latest Lighthouse CI reports (light and dark) and checks that
 * the dark run actually rendered the dark palette by sampling its final
 * screenshot. Run after `lhci autorun` for both configs.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIRS = { light: '.lighthouseci/light', dark: '.lighthouseci/dark' };
let failed = false;

/** Representative runs listed in the directory's manifest.json (filesystem upload target). */
const reports = (dir) => {
  const manifest = join(dir, 'manifest.json');
  if (!existsSync(manifest)) return [];
  return JSON.parse(readFileSync(manifest, 'utf8'))
    .filter((entry) => entry.isRepresentativeRun && existsSync(entry.jsonPath))
    .map((entry) => JSON.parse(readFileSync(entry.jsonPath, 'utf8')));
};

/** Mean brightness (0-255) of the page's final screenshot. */
const brightness = async (lhr) => {
  const data = lhr.audits['final-screenshot']?.details?.data;
  if (!data) return null;
  const buf = Buffer.from(data.split(',')[1], 'base64');
  const { channels } = await sharp(buf).stats();
  return channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / 3;
};

const rows = [];
for (const [mode, dir] of Object.entries(DIRS)) {
  for (const lhr of reports(dir)) {
    const a = lhr.audits;
    const b = await brightness(lhr);
    const renderedDark = b !== null && b < 110;
    if (mode === 'dark' && !renderedDark) failed = true;
    if (mode === 'light' && b !== null && b < 150) failed = true;
    rows.push({
      mode,
      page: new URL(lhr.finalDisplayedUrl).pathname,
      perf: Math.round(lhr.categories.performance.score * 100),
      a11y: Math.round(lhr.categories.accessibility.score * 100),
      bp: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      lcp: a['largest-contentful-paint'].displayValue,
      cls: a['cumulative-layout-shift'].displayValue,
      kb: Math.round(a['total-byte-weight'].numericValue / 1024),
      brightness: b === null ? '?' : Math.round(b),
    });
  }
}

console.log('Lighthouse (mobile):');
console.table(rows);
if (!rows.some((r) => r.mode === 'dark')) {
  console.error('No dark-mode reports found.');
  failed = true;
}
if (failed) {
  console.error(
    'Lighthouse report FAILED: a dark run did not render dark (or a light run rendered dark).',
  );
  process.exit(1);
}
console.log('Lighthouse report OK: both colour modes audited.');
