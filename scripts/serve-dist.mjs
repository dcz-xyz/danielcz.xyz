#!/usr/bin/env node
/**
 * Minimal static server for dist/ that behaves like GitHub Pages:
 *   - "/dir/" serves dir/index.html; "/dir" redirects (301) to "/dir/"
 *   - unknown paths get 404.html with status 404
 *   - everything lives under BASE_PATH (e.g. "/danielcz.xyz/" on staging)
 * Used by playwright.config.ts as the test web server. One process, no children,
 * so Playwright can stop it cleanly (Astro's `preview` re-spawns itself and leaks).
 *
 *   node scripts/serve-dist.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const DIST = 'dist';
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4399);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

const send = (res, status, file) => {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
};

const notFound = (res) => {
  const page = join(DIST, '404.html');
  if (isFile(page)) return send(res, 404, page);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname + '/' === BASE) {
    res.writeHead(301, { Location: BASE + url.search });
    return res.end();
  }
  if (!pathname.startsWith(BASE)) return notFound(res);

  // Strip base, neutralise traversal, map onto dist/.
  const rel = normalize('/' + pathname.slice(BASE.length)).replace(/^\/+/, '');
  let file = join(DIST, rel);

  if (isDir(file)) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { Location: pathname + '/' + url.search });
      return res.end();
    }
    file = join(file, 'index.html');
  }

  if (isFile(file)) return send(res, 200, file);
  return notFound(res);
}).listen(PORT, 'localhost', () => {
  console.log(`serving ${DIST}/ at http://localhost:${PORT}${BASE}`);
});
