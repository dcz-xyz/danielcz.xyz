import { test, expect, type Page } from '@playwright/test';
import { BASE } from './helpers/site';

test('work filter shows only matching projects and announces the count', async ({ page }) => {
  await page.goto(BASE);
  const group = page.getByRole('group', { name: 'Filter projects' });
  await expect(group).toBeVisible();
  const cards = page.locator('#project-grid > li');
  const total = await cards.count();
  expect(total).toBeGreaterThan(0);

  const button = (name: string) => group.getByRole('button', { name, exact: true });
  const visible = cards.locator('visible=true');
  const status = page.locator('[data-filter-status]');

  await button('Research').click();
  await expect(button('Research')).toHaveAttribute('aria-pressed', 'true');
  await expect(button('All')).toHaveAttribute('aria-pressed', 'false');
  const research = await visible.count();
  expect(research).toBeGreaterThan(0);
  expect(research).toBeLessThan(total);
  const tags = await visible.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-tags') ?? ''),
  );
  for (const t of tags) expect(t.split(' ')).toContain('research');
  await expect(status).toHaveText(`Showing ${research} of ${total} projects`);

  await button('Not Research').click();
  expect(await visible.count()).toBe(total - research);

  await button('All').click();
  expect(await visible.count()).toBe(total);
  await expect(status).toHaveText(`Showing all ${total} projects`);
});

const scrollTo = (page: Page, id: string) =>
  page.evaluate(
    (id) => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' }),
    id,
  );

test('nav highlights the section in view', async ({ page }) => {
  await page.goto(BASE);
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await scrollTo(page, 'publications');
  await expect(nav.getByRole('link', { name: 'Publications' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await scrollTo(page, 'projects');
  await expect(nav.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'location');
  await scrollTo(page, 'about');
  await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});
