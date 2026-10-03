// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Deployment target is chosen at build time so the same code serves both:
 *   - staging (GitHub project site):  SITE_URL=https://dcz-xyz.github.io  BASE_PATH=/danielcz.xyz/
 *   - production (custom domain):     SITE_URL=https://danielcz.xyz       BASE_PATH=/
 * Local dev and `npm run check` default to base "/".
 * Every internal href goes through `href()` in src/lib/paths.ts so both work.
 */
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.BASE_PATH ?? '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  // GitHub Pages serves /dir/index.html at /dir/ and 301s /dir -> /dir/.
  trailingSlash: 'always',
  // Astro 7 defaults to JSX whitespace rules, which drop the space between a line
  // break and an inline element ("of the\n<a>" -> "of the<a>"). Lossless mode keeps it.
  compressHTML: true,
});
