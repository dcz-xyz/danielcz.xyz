// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { parse } from 'yaml';

/**
 * Deployment target is chosen at build time so the same code serves both:
 *   - staging (GitHub project site):  SITE_URL=https://dcz-xyz.github.io  BASE_PATH=/danielcz.xyz/
 *   - production (custom domain):     SITE_URL=https://danielcz.xyz       BASE_PATH=/
 * Local dev and `npm run check` default to base "/".
 * Every internal href goes through `href()` in src/lib/paths.ts so both work.
 */
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.BASE_PATH ?? '/';

/**
 * Old Squarespace URLs -> new project pages, read from each project's
 * `legacyPaths` frontmatter so the Markdown file stays the single source of truth.
 */
function legacyRedirects() {
  const dir = new URL('./src/content/projects/', import.meta.url);
  /** @type {Record<string, string>} */
  const redirects = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const text = readFileSync(new URL(file, dir), 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const data = parse(match[1]);
    // Astro does not prefix `base` onto redirect targets, so do it here.
    for (const from of data.legacyPaths ?? []) {
      redirects[from] = `${base.replace(/\/$/, '')}/projects/${file.slice(0, -3)}/`;
    }
  }
  return redirects;
}

const redirects = legacyRedirects();
// Pathnames of the generated redirect stubs, e.g. "/danielcz.xyz/key-1/".
const legacyPathnames = new Set(
  Object.keys(redirects).map((from) => `${base.replace(/\/$/, '')}${from}/`),
);

// https://astro.build/config
export default defineConfig({
  site,
  base,
  // GitHub Pages serves /dir/index.html at /dir/ and 301s /dir -> /dir/.
  trailingSlash: 'always',
  redirects,
  integrations: [
    sitemap({
      // Real pages only: no redirect stubs, no 404.
      filter: (page) => {
        const { pathname } = new URL(page);
        return !pathname.endsWith('/404/') && !legacyPathnames.has(pathname);
      },
    }),
  ],
  // Astro 7 defaults to JSX whitespace rules, which drop the space between a line
  // break and an inline element ("of the\n<a>" -> "of the<a>"). Lossless mode keeps it.
  compressHTML: true,
});
