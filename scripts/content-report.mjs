#!/usr/bin/env node
/**
 * Content report: counts entries per collection, checks that every self-hosted
 * PDF exists, and lists every image whose alt text is missing or still a
 * placeholder ("TODO ..."). Those are warnings: the site builds and the image
 * renders with alt="" (see src/lib/alt.ts). Schema validation itself happens
 * in `astro build`.
 *
 *   node scripts/content-report.mjs            warn on missing or placeholder alt text
 *   node scripts/content-report.mjs --strict   opt-in: fail on them instead
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
const warnings = [];

/** "missing", "placeholder" or null for usable alt text. */
const altIssue = (value) => {
  const alt = String(value ?? '').trim();
  if (!alt) return 'missing';
  if (PLACEHOLDER.test(alt)) return 'placeholder';
  return null;
};
const checkAlt = (value, where) => {
  const issue = altIssue(value);
  if (issue) warnings.push(`${where}: ${issue} alt text`);
};

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
  checkAlt(d.thumbnailAlt, `${p.file}: thumbnailAlt`);
  if (d.links?.pdf && !existsSync(join('public', d.links.pdf)))
    problems.push(`${p.file}: PDF not found at public${d.links.pdf}`);
  if (!d.links?.pdf) console.warn(`  info: ${p.id} has no PDF link`);
  if (!d.links?.video) console.warn(`  info: ${p.id} has no video link`);
}

for (const p of projects) {
  const d = p.data;
  checkAlt(d.heroAlt, `${p.file}: heroAlt`);
  if (d.thumbnail) checkAlt(d.thumbnailAlt, `${p.file}: thumbnailAlt`);
  (d.gallery ?? []).forEach((g, i) => {
    checkAlt(g.alt, `${p.file}: gallery[${i}].alt (${g.src})`);
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

if (warnings.length) {
  console.log(`  images without alt text (${warnings.length}, rendered with alt=""):`);
  for (const w of warnings) console.warn(`    - warning: ${w}`);
}
for (const p of problems) console.error(`  error: ${p}`);

if (problems.length || (STRICT && warnings.length)) {
  console.error(
    `Content report FAILED${STRICT && warnings.length ? ' (strict: alt text missing)' : ''}.`,
  );
  process.exit(1);
}
console.log(
  `Content report OK${warnings.length ? ` (${warnings.length} alt text warnings)` : ''}.`,
);
