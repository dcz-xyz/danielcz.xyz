import { test, expect } from '@playwright/test';
import { LinkChecker } from 'linkinator';

/**
 * Crawls the preview server. Broken internal links fail the gate; broken
 * external links are reported as annotations (social sites block bots).
 */
test('no broken internal links', async ({ baseURL }) => {
  test.setTimeout(180_000);
  const origin = new URL(baseURL!).origin;

  const checker = new LinkChecker();
  const result = await checker.check({
    path: baseURL!,
    recurse: true,
    concurrency: 16,
    timeout: 15_000,
    retry: true,
    // The canonical URL of a local build points at Astro's default dev origin; nothing listens there.
    linksToSkip: ['^http://localhost:4321/'],
  });

  const broken = result.links.filter((l) => l.state === 'BROKEN');
  const internal = broken.filter((l) => l.url.startsWith(origin));
  const external = broken.filter((l) => !l.url.startsWith(origin));

  for (const l of external) {
    const line = `${l.status ?? '?'} ${l.url} <- ${l.parent ?? '?'}`;
    console.warn(`[external link, non-fatal] ${line}`);
    test.info().annotations.push({ type: 'external-link-failure', description: line });
  }
  const summary = `${result.links.length} links checked, ${internal.length} internal broken, ${external.length} external failures (non-fatal)`;
  console.log(`[links] ${summary}`);
  test.info().annotations.push({ type: 'links-checked', description: summary });

  expect(internal.map((l) => `${l.status ?? '?'} ${l.url} <- ${l.parent ?? '?'}`)).toEqual([]);
});
