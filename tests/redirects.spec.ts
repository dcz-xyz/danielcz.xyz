import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { BASE } from './helpers/site';

/** Every legacyPaths entry from the project frontmatter, with its destination. */
function legacyPaths(): { from: string; to: string }[] {
  const dir = 'src/content/projects';
  const out: { from: string; to: string }[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const data = parse(match?.[1] ?? '');
    for (const from of data.legacyPaths ?? []) {
      out.push({ from, to: `${BASE}projects/${file.slice(0, -3)}/` });
    }
  }
  return out;
}

const entries = legacyPaths();
test('there are legacy paths to check', () => {
  expect(entries.length).toBeGreaterThan(0);
});

for (const { from, to } of entries) {
  test(`legacy ${from} lands on ${to}`, async ({ page }) => {
    await page.goto(BASE + from.replace(/^\//, ''));
    await page.waitForURL((url) => url.pathname === to);
    const response = await page.request.get(page.url());
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });
}
