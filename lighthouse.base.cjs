/**
 * Shared Lighthouse CI configuration. lighthouserc.cjs runs in light mode,
 * lighthouserc.dark.cjs forces Chrome into dark mode so the dark palette is
 * audited too. Both run against the built site served by scripts/serve-dist.mjs
 * (mobile preset, Lighthouse's default). scripts/lighthouse-report.mjs prints
 * the scores and proves the dark run really rendered dark.
 */
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');

/** @param {{ dark: boolean }} options */
module.exports = ({ dark }) => {
  // Separate ports so the two runs never race each other's server start-up and teardown.
  const PORT = dark ? 4396 : 4398;
  const ORIGIN = `http://localhost:${PORT}`;
  return {
    ci: {
      collect: {
        startServerCommand: `node scripts/serve-dist.mjs ${PORT}`,
        startServerReadyPattern: 'serving',
        url: [
          `${ORIGIN}${BASE}`,
          `${ORIGIN}${BASE}projects/mobiprint/`,
          `${ORIGIN}${BASE}projects/moirewidgets/`,
        ],
        numberOfRuns: 1,
        settings: {
          skipAudits: ['uses-http2'],
          ...(dark ? { chromeFlags: '--force-dark-mode' } : {}),
        },
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.95 }],
          'categories:accessibility': ['error', { minScore: 0.95 }],
          'categories:best-practices': ['error', { minScore: 0.95 }],
          'categories:seo': ['error', { minScore: 0.95 }],
          // SPEC performance budget: under 300 KB transferred, islands at most 60 KB.
          'resource-summary:total:size': ['error', { maxNumericValue: 300 * 1024 }],
          'resource-summary:script:size': ['error', { maxNumericValue: 60 * 1024 }],
        },
      },
      upload: {
        target: 'filesystem',
        outputDir: dark ? '.lighthouseci/dark' : '.lighthouseci/light',
      },
    },
  };
};
