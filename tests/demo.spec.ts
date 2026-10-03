import { test, expect } from '@playwright/test';
import { BASE } from './helpers/site';

const PAGE = `${BASE}projects/moirewidgets/`;

test('island loads only when scrolled into view, then responds to the sliders', async ({
  page,
}) => {
  const chunkRequests: string[] = [];
  page.on('request', (r) => {
    if (/MoireExplorer/.test(r.url())) chunkRequests.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(PAGE);
  await page.waitForLoadState('networkidle');

  const island = page.locator('moire-explorer');
  await expect(island).toBeAttached();
  expect(chunkRequests, 'demo code must not load above the fold').toHaveLength(0);
  await expect(island.locator('[data-fallback]')).toBeVisible();

  await island.scrollIntoViewIfNeeded();
  await expect(island).toHaveAttribute('data-ready', 'true');
  expect(chunkRequests.length).toBeGreaterThan(0);
  await expect(island.locator('[data-fallback]')).toBeHidden();
  await expect(island.getByRole('img', { name: /overlapping gratings/i })).toBeVisible();

  const readout = island.locator('[data-readout]');
  const before = await readout.textContent();
  const rotation = island.getByLabel('Top layer rotation');
  await rotation.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight'); // 20 x 0.1° = 2°
  await expect(island.locator('output').nth(1)).toHaveText('2 °');
  await expect(readout).not.toHaveText(before ?? '');

  await island.getByRole('button', { name: 'Reset' }).click();
  await expect(readout).toHaveText(before ?? '');
});

test('animation control is disabled under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const island = page.locator('moire-explorer');
  await island.scrollIntoViewIfNeeded();
  await expect(island).toHaveAttribute('data-ready', 'true');
  await expect(island.getByLabel(/Animate the shift/)).toBeDisabled();
});

test('demo renders consistently', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const section = page.locator('[data-demo="MoireExplorer"]');
  // The sticky header would otherwise overlap the top of the captured section.
  await page.addStyleTag({ content: '.site-header { visibility: hidden; }' });
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator('moire-explorer')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
  await expect(section).toHaveScreenshot('demo-1280.png', { animations: 'disabled' });
});
