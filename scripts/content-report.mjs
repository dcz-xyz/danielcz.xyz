#!/usr/bin/env node
/**
 * Content report: counts entries per collection, checks that every self-hosted
 * PDF exists, and lists placeholder alt text ("TODO ...") that Daniel still
 * needs to write. Schema validation itself happens in `astro build`.
 *
 *   node scripts/content-report.mjs            warn on placeholder alt text
 *   node scripts/content-report.mjs --strict   fail on placeholder alt text (launch gate)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const STRICT = process.argv.includes('--strict');
const PLACEHOLDER = /\bTODO\b/i;

const readDir = (dir, ext) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(ext) && !f.startsWith('_'))
    .sort()
    .map((f) => ({
      id: f.slice(0, -ext.length),
      file: join(dir, f),
      text: readFileSync(join(dir, f), 'utf8'),
    }));

const frontmatter = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error('missing frontmatter');
  return parse(m[1]);
};

const problems = [];
const todos = [];

const pubs = readDir('src/content/publications', '.yaml').map((e) => ({
  ...e,
  data: parse(e.text),
}));
const projects = readDir('src/content/projects', '.md').map((e) => ({
  ...e,
  data: frontmatter(e.text),
}));

for (const p of pubs) {
  const d = p.data;
  if (PLACEHOLDER.test(d.thumbnailAlt ?? '')) todos.push(`${p.file}: thumbnailAlt`);
  if (d.links?.pdf && !existsSync(join('public', d.links.pdf)))
    problems.push(`${p.file}: PDF not found at public${d.links.pdf}`);
  if (!d.links?.pdf) console.warn(`  info: ${p.id} has no PDF link`);
  if (!d.links?.video) console.warn(`  info: ${p.id} has no video link`);
}

for (const p of projects) {
  const d = p.data;
  if (PLACEHOLDER.test(d.heroAlt ?? '')) todos.push(`${p.file}: heroAlt`);
  (d.gallery ?? []).forEach((g, i) => {
    if (PLACEHOLDER.test(g.alt ?? '')) todos.push(`${p.file}: gallery[${i}].alt (${g.src})`);
  });
}

const orders = projects.map((p) => p.data.order);
if (new Set(orders).size !== orders.length)
  problems.push(`duplicate project order values: ${orders.join(', ')}`);

const byYear = [...pubs].sort(
  (a, b) =>
    new Date(b.data.date) - new Date(a.data.date) || a.data.title.localeCompare(b.data.title),
);

console.log(`Content report`);
console.log(`  publications: ${pubs.length}`);
for (const p of byYear)
  console.log(`    ${new Date(p.data.date).toISOString().slice(0, 10)}  ${p.id}`);
console.log(`  projects: ${projects.length}`);
for (const p of [...projects].sort((a, b) => a.data.order - b.data.order)) {
  console.log(
    `    ${String(p.data.order).padStart(2)}  ${p.id}  [${p.data.tags.join(', ')}]  gallery: ${(p.data.gallery ?? []).length}`,
  );
}

if (todos.length) {
  console.log(`  placeholder alt text (${todos.length}):`);
  for (const t of todos) console.log(`    - ${t}`);
}
for (const p of problems) console.error(`  error: ${p}`);

if (problems.length || (STRICT && todos.length)) {
  console.error(
    `Content report FAILED${STRICT && todos.length ? ' (strict: placeholder alt text remains)' : ''}.`,
  );
  process.exit(1);
}
console.log(
  `Content report OK${todos.length ? ' (placeholder alt text pending, non-fatal until launch)' : ''}.`,
);
