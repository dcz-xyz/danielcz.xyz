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

/**
 * Links to other sites open in a new tab (target=_blank with rel=noopener);
 * links within the site never do. Covers hand-written anchors, the data-driven
 * pills and buttons, and Markdown bodies.
 */
test('external links open in a new tab, internal links do not', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  for (const path of ['/', '/projects/observation-hives/', '/projects/robot-gaze/']) {
    await page.goto(path);
    const links = await page.locator('a[href]').evaluateAll((as) =>
      as.map((a) => ({
        href: a.getAttribute('href') ?? '',
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel') ?? '',
      })),
    );
    const external = links.filter(
      (l) => /^https?:\/\//i.test(l.href) && !l.href.startsWith(origin),
    );
    const internal = links.filter((l) => !/^[a-z]+:/i.test(l.href));
    expect(external.length, `${path} has external links`).toBeGreaterThan(0);
    for (const l of external) {
      expect(l.target, `${path}: ${l.href} should open in a new tab`).toBe('_blank');
      expect(l.rel.split(/\s+/), `${path}: ${l.href} needs rel=noopener`).toContain('noopener');
    }
    for (const l of internal) {
      expect(l.target, `${path}: ${l.href} should stay in the same tab`).toBeNull();
    }
  }
});
