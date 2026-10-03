import { test, expect } from '@playwright/test';
import { BASE } from './helpers/site';

/**
 * Visual baselines reviewed by Daniel at each phase. Stored in
 * tests/__screenshots__/ and committed. Regenerate with `npm run shots:update`.
 */
const WIDTHS = [375, 900, 1280] as const;

const pages: { name: string; path: string }[] = [{ name: 'home', path: BASE }];

for (const p of pages) {
  for (const width of WIDTHS) {
    test(`${p.name} @ ${width}px (light)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await page.goto(p.path);
      await page.evaluate(() => document.fonts.ready);
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
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${p.name}-1280-dark.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
