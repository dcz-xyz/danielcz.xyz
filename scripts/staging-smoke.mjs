#!/usr/bin/env node
/**
 * Checks a build made with the staging environment
 * (SITE_URL=https://dcz-xyz.github.io BASE_PATH=/danielcz.xyz/):
 * base-prefixed links, base-aware redirects, noindex, robots Disallow.
 */
import { readFileSync, existsSync } from 'node:fs';

const BASE = '/danielcz.xyz/';
const problems = [];
const must = (cond, msg) => {
  if (!cond) problems.push(msg);
};

const home = readFileSync('dist/index.html', 'utf8');
const hrefs = [...home.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
must(hrefs.length > 0, 'home has no root-relative links');
for (const h of hrefs) must(h.startsWith(BASE), `link not under base: ${h}`);
must(/<meta name="robots" content="noindex">/.test(home), 'staging home lacks noindex');
must(
  home.includes(`href="https://dcz-xyz.github.io${BASE}"`),
  'canonical does not point at staging',
);

const redirect = 'dist/key-1/index.html';
must(existsSync(redirect), 'legacy redirect page missing');
if (existsSync(redirect)) {
  must(
    readFileSync(redirect, 'utf8').includes(`url=${BASE}projects/bpolite/`),
    'legacy redirect target not base-prefixed',
  );
}

const robots = readFileSync('dist/robots.txt', 'utf8');
must(/Disallow: \//.test(robots), 'staging robots.txt should disallow crawling');
must(existsSync('dist/sitemap-index.xml'), 'sitemap-index.xml missing');
if (existsSync('dist/sitemap-0.xml')) {
  const sm = readFileSync('dist/sitemap-0.xml', 'utf8');
  must(!sm.includes('/key-1/'), 'sitemap includes a redirect page');
  must(
    sm.includes(`https://dcz-xyz.github.io${BASE}projects/mobiprint/`),
    'sitemap URLs not base-prefixed',
  );
}

if (problems.length) {
  for (const p of problems) console.error(`  error: ${p}`);
  console.error('Staging smoke FAILED.');
  process.exit(1);
}
console.log('Staging smoke OK: links, redirects, noindex, robots and sitemap are base-aware.');
