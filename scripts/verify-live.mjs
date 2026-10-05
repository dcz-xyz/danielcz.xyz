#!/usr/bin/env node
/**
 * Checks a deployed copy of the site over HTTP.
 *
 *   node scripts/verify-live.mjs https://dcz-xyz.github.io/danielcz.xyz/            # staging
 *   node scripts/verify-live.mjs https://danielcz.xyz/ --production                  # after cutover
 *
 * Verifies: every page and PDF answers 200, legacy paths redirect to the right
 * project page, the 404 page is served, robots.txt and the noindex meta match
 * the environment, the sitemap lists the pages, and the icons exist.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const [, , baseArg, ...flags] = process.argv;
if (!baseArg) {
  console.error('usage: node scripts/verify-live.mjs <base url> [--production]');
  process.exit(2);
}
const BASE = baseArg.endsWith('/') ? baseArg : `${baseArg}/`;
const PRODUCTION = flags.includes('--production');
const problems = [];
const ok = (cond, msg) => {
  if (!cond) problems.push(msg);
  return cond;
};

const get = async (path, { redirect = 'follow' } = {}) => {
  const url = new URL(path.replace(/^\//, ''), BASE).href;
  const res = await fetch(url, { redirect, headers: { 'user-agent': 'danielcz-verify' } });
  const type = res.headers.get('content-type') ?? '';
  const text = /text|xml|json/.test(type) ? await res.text() : '';
  return {
    url,
    status: res.status,
    text,
    type: res.headers.get('content-type') ?? '',
    finalUrl: res.url,
  };
};

const projects = readdirSync('src/content/projects')
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({
    slug: f.slice(0, -3),
    data: parse(
      readFileSync(join('src/content/projects', f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1],
    ),
  }));
const pdfs = readdirSync('public/pdfs').filter((f) => f.endsWith('.pdf'));

// Pages
const home = await get('/');
ok(home.status === 200, `home ${home.status}`);
ok(/<title>Daniel Campos Zamora<\/title>/.test(home.text), 'home title missing');
const hasNoindex = /<meta name="robots" content="noindex">/.test(home.text);
ok(
  hasNoindex !== PRODUCTION,
  PRODUCTION ? 'production home carries noindex' : 'staging home lacks noindex',
);
for (const p of projects) {
  const r = await get(`/projects/${p.slug}/`);
  ok(r.status === 200, `project ${p.slug} ${r.status}`);
  ok(
    r.text.includes(`<h1`) && r.text.includes(p.data.title.replace(/&/g, '&amp;')),
    `project ${p.slug} title missing`,
  );
}

// Legacy redirects: GitHub Pages 301s /old -> /old/, which serves a meta-refresh stub.
for (const p of projects) {
  for (const from of p.data.legacyPaths ?? []) {
    const r = await get(from);
    const target = new URL(`projects/${p.slug}/`, BASE).href;
    const refresh = r.text.match(/content="0;url=([^"]+)"/)?.[1];
    const resolved = refresh ? new URL(refresh, r.finalUrl).href : null;
    ok(
      r.status === 200 && resolved === target,
      `legacy ${from}: status ${r.status}, refresh -> ${resolved}`,
    );
  }
}

// 404
const missing = await get('/this-page-does-not-exist/');
ok(
  missing.status === 404 && /Page not found/.test(missing.text),
  `404 page: status ${missing.status}`,
);

// Files
for (const f of pdfs) {
  const r = await get(`/pdfs/${f}`);
  ok(r.status === 200 && /pdf/.test(r.type), `pdf ${f}: ${r.status} ${r.type}`);
}
for (const f of [
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
]) {
  const r = await get(`/${f}`);
  ok(r.status === 200, `${f}: ${r.status}`);
}

// robots + sitemap
const robots = await get('/robots.txt');
ok(robots.status === 200, `robots ${robots.status}`);
ok(
  PRODUCTION
    ? /Allow: \//.test(robots.text) && /Sitemap: /.test(robots.text)
    : /Disallow: \//.test(robots.text),
  `robots.txt content wrong for ${PRODUCTION ? 'production' : 'staging'}:\n${robots.text}`,
);
const index = await get('/sitemap-index.xml');
ok(index.status === 200 && index.text.includes('sitemap-0.xml'), `sitemap-index ${index.status}`);
const sm = await get('/sitemap-0.xml');
const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(
  locs.length === 1 + projects.length,
  `sitemap lists ${locs.length} pages, expected ${1 + projects.length}`,
);
ok(
  locs.every((l) => l.startsWith(BASE)),
  'sitemap URLs do not start with the site base',
);

console.log(
  `Checked ${BASE}: ${1 + projects.length} pages, ${projects.reduce((n, p) => n + (p.data.legacyPaths?.length ?? 0), 0)} redirects, ${pdfs.length} PDFs, robots, sitemap, icons.`,
);
if (problems.length) {
  for (const p of problems) console.error(`  error: ${p}`);
  console.error(`Live verification FAILED (${problems.length}).`);
  process.exit(1);
}
console.log('Live verification OK.');
