import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Base path with leading and trailing slash, mirroring astro.config.mjs. */
export const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');

const DIST = 'dist';

/** True for Astro's generated redirect pages (meta refresh), which never settle for testing. */
export function isRedirectPage(file: string): boolean {
  return /<meta http-equiv="refresh"/i.test(readFileSync(file, 'utf8'));
}

/** Every real page in the built site as a path (including base), e.g. "/", "/projects/mobiprint/". */
export function routes(): string[] {
  if (!existsSync(DIST)) {
    throw new Error('dist/ not found. Run `npm run build` before the Playwright tests.');
  }
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) files.push(full);
    }
  };
  walk(DIST);

  return files
    .filter((file) => !isRedirectPage(file))
    .map((file) => {
      let route = relative(DIST, file).split(sep).join('/');
      if (route.endsWith('index.html')) route = route.slice(0, -'index.html'.length);
      return BASE + route;
    })
    .sort();
}
