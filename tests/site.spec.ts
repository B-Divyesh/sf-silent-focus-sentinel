import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

for (const route of ['/', '/demo', '/privacy', '/terms', '/missing']) {
  test(`${route} has one accessible page structure`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Silent Focus Sentinel/);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('navigation updates URL, title, and heading focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page).toHaveTitle('Demo — Silent Focus Sentinel');
  await expect(page.locator('h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toBeFocused();
});

test('390px layout keeps content within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
});

test('all visible controls meet the 44px mobile target and demo focus contrasts with its bar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(route);
    const controls = page.locator('a, button');
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index);
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      expect(box, `${route} control ${index} has a box`).not.toBeNull();
      expect(box!.width, `${route} control ${index} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${route} control ${index} height`).toBeGreaterThanOrEqual(44);
    }
  }
  await page.goto('/demo');
  const reset = page.getByRole('button', { name: 'Reset demo' });
  await reset.focus();
  await expect(reset).toBeFocused();
  await expect(reset).toHaveCSS('outline-color', 'rgb(6, 36, 31)');
});

test('built static routes are explicit and unknown paths retain a configured 404 response', async () => {
  const config = JSON.parse(readFileSync('site/public/staticwebapp.config.json', 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  for (const route of ['demo', 'privacy', 'terms']) {
    expect(readFileSync(`dist/site/${route}/index.html`, 'utf8')).toContain('<!doctype html>');
  }
});

test('keyboard reaches the primary action with a visible focus ring', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  for (let index = 0; index < 5; index += 1) await page.keyboard.press('Tab');
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toBeFocused();
  const outline = await action.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe('none');
});
