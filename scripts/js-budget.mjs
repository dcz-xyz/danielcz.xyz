#!/usr/bin/env node
/**
 * JS budget gate (SPEC, "Testing and iteration loop").
 *   - Pages without an interactive demo must reference zero external scripts.
 *   - Pages that opt in with <html data-js-budget="demo"> may ship <= 60 KB gzipped.
 * Inline <script> blocks (the theme initialiser) are not counted; the budget is
 * about shipped bundles. Run after `astro build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');
const DEMO_LIMIT = 60 * 1024;

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
};
walk(DIST);

const toDistPath = (src, htmlFile) => {
  if (/^(?:[a-z]+:)?\/\//i.test(src)) return null; // external origin
  const clean = src.split(/[?#]/)[0];
  if (clean.startsWith(BASE)) return join(DIST, clean.slice(BASE.length));
  if (clean.startsWith('/')) return join(DIST, clean.slice(1));
  return resolve(dirname(htmlFile), clean);
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rows = [];
let failed = false;

for (const file of htmlFiles.sort()) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(DIST, file).split(sep).join('/');
  const isDemo = /<html\b[^>]*\bdata-js-budget=["']demo["']/i.test(html);
  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  const preloads = [...html.matchAll(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi)].length;

  let raw = 0;
  let gz = 0;
  let lazy = 0;
  const missing = [];
  const counted = new Set();
  const count = (p, isLazy) => {
    if (counted.has(p)) return;
    counted.add(p);
    const buf = readFileSync(p);
    raw += statSync(p).size;
    gz += gzipSync(buf).length;
    if (isLazy) lazy += 1;
    // Chunks loaded later with import() count too, so lazy islands are not hidden.
    for (const m of buf.toString('utf8').matchAll(/import\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) {
      const spec = m[1];
      const target = spec.startsWith('/') ? toDistPath(spec, file) : resolve(dirname(p), spec);
      if (target && existsSync(target)) count(target, true);
    }
  };
  for (const src of srcs) {
    const p = toDistPath(src, file);
    if (p === null) {
      missing.push(`${src} (external origin, counted as 0 bytes)`);
      continue;
    }
    if (!existsSync(p)) {
      missing.push(`${src} (not found in dist)`);
      continue;
    }
    count(p, false);
  }

  const ok = isDemo ? gz <= DEMO_LIMIT : srcs.length === 0 && preloads === 0;
  if (!ok) failed = true;
  rows.push({
    page,
    kind: isDemo ? 'demo' : 'static',
    scripts: srcs.length,
    lazy,
    preloads,
    raw: kb(raw),
    gzip: kb(gz),
    status: ok ? 'OK' : 'FAIL',
  });
  for (const m of missing) console.warn(`  warn: ${page}: ${m}`);
}

console.log(`JS budget: ${rows.length} page(s), base "${BASE}"`);
console.table(rows);
if (failed) {
  console.error(
    `JS budget FAILED: static pages must reference no external scripts; demo pages <= ${kb(DEMO_LIMIT)} gzipped.`,
  );
  process.exit(1);
}
console.log('JS budget OK.');
