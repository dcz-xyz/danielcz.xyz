import { defineConfig, devices } from '@playwright/test';

/** Mirrors astro.config.mjs: the built site lives under BASE_PATH (default "/"). */
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');
// Dedicated port so the tests never collide with (or silently reuse) `npm run preview`.
const PORT = 4399;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Baselines live next to the tests and are committed; no OS/browser suffix.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  // Baselines are rendered on the same machine; allow only antialiasing noise.
  expect: { toHaveScreenshot: { maxDiffPixels: 50 } },
  use: {
    baseURL: `${ORIGIN}${BASE}`,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  webServer: {
    // A single-process static server that mimics GitHub Pages (see the script).
    // Astro's `preview` re-spawns itself and leaks the child when Playwright stops it.
    command: `node scripts/serve-dist.mjs ${PORT}`,
    // Must include the base: the server answers 404 outside it, like a Pages project site.
    url: `${ORIGIN}${BASE}`,
    // Always serve the dist/ that was just built, never a stale server.
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium' }],
});
