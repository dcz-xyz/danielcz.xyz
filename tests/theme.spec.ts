import { test, expect } from '@playwright/test';
import { BASE } from './helpers/site';

const bodyBg = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('theme toggle switches colors, persists, and resets to system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(BASE);
  const html = page.locator('html');

  // No manual choice yet: follows the (light) system.
  await expect(html).not.toHaveAttribute('data-theme');
  expect(await bodyBg(page)).toBe('rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'System' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBg(page)).toBe('rgb(20, 20, 20)');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

  // Survives a reload and is applied before paint (attribute set by the head script).
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  expect(await bodyBg(page)).toBe('rgb(20, 20, 20)');

  await page.getByRole('button', { name: 'Light' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  expect(await bodyBg(page)).toBe('rgb(255, 255, 255)');

  await page.getByRole('button', { name: 'System' }).click();
  await expect(html).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('dark system preference is honoured without a stored choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(BASE);
  expect(await bodyBg(page)).toBe('rgb(20, 20, 20)');
});

test('home page references no external JavaScript', async ({ page }) => {
  await page.goto(BASE);
  expect(await page.locator('script[src]').count()).toBe(0);
  expect(await page.locator('link[rel="modulepreload"]').count()).toBe(0);
});
