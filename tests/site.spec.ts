import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

for (const route of ['/', '/?demo=1', '/demo', '/privacy', '/terms', '/missing']) {
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

test('demo is useful on the first mobile screen and resets without touching real storage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  await page.evaluate(() => localStorage.setItem('real:marker', 'keep'));
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Two elements need review' })).toBeVisible();
  await expect(page.getByText('2 findings')).toBeVisible();
  expect((await page.getByText('2 findings').boundingBox())!.y).toBeLessThan(844);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('real:marker'))).toBe('keep');
});

test('hero artwork never creates horizontal scrolling from tablet through desktop', async ({ page }) => {
  for (const width of [761, 800, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${width}px viewport overflow`).toBeLessThanOrEqual(1);
  }
});

test('display face cannot swap into the hero after first paint', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.hero h1').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Space Grotesk');
  expect(readFileSync('site/src/style.css', 'utf8')).toContain('font-display:optional');
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

test('built static routes have specific metadata and unknown paths retain a configured 404 response', async () => {
  const config = JSON.parse(readFileSync('site/public/staticwebapp.config.json', 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  const expected = {
    'demo/index.html': ['<title>Demo — Silent Focus Sentinel</title>', 'content="https://silent-focus-sentinel.sociobot.in/demo"'],
    'privacy/index.html': ['<title>Privacy — Silent Focus Sentinel</title>', 'content="https://silent-focus-sentinel.sociobot.in/privacy"'],
    'terms/index.html': ['<title>Terms — Silent Focus Sentinel</title>', 'content="https://silent-focus-sentinel.sociobot.in/terms"'],
    '404.html': ['<title>Page not found — Silent Focus Sentinel</title>', 'content="https://silent-focus-sentinel.sociobot.in/404.html"'],
  };
  for (const [file, markers] of Object.entries(expected)) {
    const html = readFileSync(`dist/site/${file}`, 'utf8');
    for (const marker of markers) expect(html).toContain(marker);
    expect(html.match(/<meta property="og:title"/g)).toHaveLength(1);
    expect(html).not.toContain('catch silent focus stops');
  }
  const source = readFileSync('site/src/main.ts', 'utf8');
  expect(source).toContain('href="/demo" data-link>Try it with sample data');
  expect(readFileSync('dist/site/demo/index.html', 'utf8')).toContain('<title>Demo — Silent Focus Sentinel</title>');
});

test('the landing ships a generated recording of the real CLI demo', async ({ page }) => {
  await page.goto('/');
  const recording = page.getByRole('img', { name: /Terminal recording/ });
  await expect(recording).toBeVisible();
  await expect(recording).toHaveAttribute('src', '/demo-recording.svg');
  const svg = readFileSync('site/public/demo-recording.svg', 'utf8');
  expect(svg).toContain('$ silent-focus-sentinel demo');
  expect(svg).toContain('Found 2 findings across 6 checked elements.');
  await page.locator('.terminal-recording summary').click();
  await expect(page.getByText('JSON: /tmp/silent-focus-sentinel-demo-…/focus-report.json')).toBeVisible();
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

test('reduced motion disables the focus pulse', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.trace-item .node').first()).toHaveCSS('animation-name', 'none');
  await context.close();
});
