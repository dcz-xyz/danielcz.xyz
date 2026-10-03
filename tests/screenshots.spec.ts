import { test, expect, type Page } from '@playwright/test';
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

/** One capture per gallery layout (1280 px, light) so the options can be compared. */
const galleryPages: { name: string; path: string }[] = [
  { name: 'gallery-grid', path: `${BASE}projects/soft-robot-interfaces/` },
  { name: 'gallery-stack', path: `${BASE}projects/camera-obscura/` },
  { name: 'gallery-filmstrip', path: `${BASE}projects/moirewidgets/` },
];

/** Force lazy images to load, reset videos to their posters, wait for fonts: deterministic captures. */
async function settle(page: Page) {
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
    // Native video controls draw buffer bars that differ run to run; capture the poster only.
    for (const v of Array.from(document.querySelectorAll('video'))) {
      v.removeAttribute('autoplay');
      v.removeAttribute('controls');
      v.pause();
      v.load();
    }
    await document.fonts.ready;
  });
  await page.waitForLoadState('networkidle');
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

for (const p of galleryPages) {
  test(`${p.name} @ 1280px (light)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(p.path);
    await settle(page);
    await expect(page).toHaveScreenshot(`${p.name}-1280.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
