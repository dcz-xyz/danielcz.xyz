import { existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Base path with leading and trailing slash, mirroring astro.config.mjs. */
export const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');

const DIST = 'dist';

/** Every page in the built site as a path (including base), e.g. "/", "/projects/mobiprint/". */
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
    .map((file) => {
      let route = relative(DIST, file).split(sep).join('/');
      if (route.endsWith('index.html')) route = route.slice(0, -'index.html'.length);
      return BASE + route;
    })
    .sort();
}
