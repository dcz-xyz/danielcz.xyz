import { test, expect } from '@playwright/test';
import { BASE } from './helpers/site';

/**
 * Visual baselines reviewed by Daniel at each phase. Stored in
 * tests/__screenshots__/ and committed. Regenerate with `npm run shots:update`.
 */
const WIDTHS = [375, 900, 1280] as const;

const pages: { name: string; path: string }[] = [
  { name: 'home', path: BASE },
  { name: 'project', path: `${BASE}projects/mobiprint/` },
];

/** Force lazy images to load and wait for them and the fonts, so captures are deterministic. */
async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const img of images) img.loading = 'eager';
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );
    await document.fonts.ready;
  });
}

for (const p of pages) {
  for (const width of WIDTHS) {
    test(`${p.name} @ ${width}px (light)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await page.goto(p.path);
      await settle(page);
      await expect(page).toHaveScreenshot(`${p.name}-${width}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test(`${p.name} @ 1280px (dark)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(p.path);
    await settle(page);
    await expect(page).toHaveScreenshot(`${p.name}-1280-dark.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
