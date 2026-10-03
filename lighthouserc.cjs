/**
 * Lighthouse CI. Runs against the built site served by scripts/serve-dist.mjs
 * (mobile preset, Lighthouse's default). Dark mode contrast is covered by the
 * axe tests; Lighthouse itself has no color-scheme switch.
 */
const PORT = 4398;
const BASE = ('/' + (process.env.BASE_PATH ?? '/') + '/').replace(/\/+/g, '/');
const ORIGIN = `http://localhost:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node scripts/serve-dist.mjs ${PORT}`,
      startServerReadyPattern: 'serving',
      url: [`${ORIGIN}${BASE}`, `${ORIGIN}${BASE}projects/mobiprint/`],
      numberOfRuns: 1,
      settings: {
        // Keep audits deterministic on a laptop; throttling stays at the mobile default.
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
