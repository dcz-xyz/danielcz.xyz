import { test, expect } from '@playwright/test';
import { BASE } from './helpers/site';

const PAGE = `${BASE}projects/mobiprint/`; // slideshow layout, 3 slides

test('slideshow: thumbnails, arrows and keyboard move between slides', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const carousel = page.getByRole('region', { name: 'Project images' });
  const slides = carousel.locator('.slideshow__slide');
  const thumbs = carousel.locator('[data-slideshow-thumb]');
  const count = await slides.count();
  expect(count).toBeGreaterThan(1);
  await expect(thumbs).toHaveCount(count);

  const counter = carousel.locator('[data-slideshow-counter]');
  await expect(counter).toHaveText(`1 / ${count}`);
  await expect(thumbs.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(carousel.getByRole('button', { name: 'Previous image' })).toBeDisabled();

  await thumbs.nth(1).click();
  await expect(counter).toHaveText(`2 / ${count}`);
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(slides.nth(1)).toBeInViewport({ ratio: 0.9 });

  await carousel.getByRole('button', { name: 'Next image' }).click();
  await expect(counter).toHaveText(`3 / ${count}`);

  await carousel.getByRole('button', { name: 'Previous image' }).click();
  await expect(counter).toHaveText(`2 / ${count}`);

  const stage = carousel.locator('[data-slideshow-stage]');
  await stage.focus();
  await page.keyboard.press('Home');
  await expect(counter).toHaveText(`1 / ${count}`);
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`2 / ${count}`);
  await page.keyboard.press('End');
  await expect(counter).toHaveText(`${count} / ${count}`);
  await expect(carousel.getByRole('button', { name: 'Next image' })).toBeDisabled();
});
