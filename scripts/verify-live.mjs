import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.argv[2] ?? 'https://silent-focus-sentinel.sociobot.in';
const deploymentOrigin = 'https://silent-focus-sentinel.sociobot.in';
const evidence = '.factory/evidence/polish-2';
await mkdir(evidence, { recursive: true });

const browser = await chromium.launch();
const routes = [
  ['/', 200, 'Silent Focus Sentinel — catch silent VoiceOver stops'],
  ['/demo', 200, 'Demo — Silent Focus Sentinel'],
  ['/?demo=1', 200, 'Demo — Silent Focus Sentinel'],
  ['/privacy', 200, 'Privacy — Silent Focus Sentinel'],
  ['/terms', 200, 'Terms — Silent Focus Sentinel'],
  ['/definitely-missing-polish-1', 404, 'Page not found — Silent Focus Sentinel'],
];

try {
  for (const [route, status, title] of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    const outside = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (new URL(request.url()).origin !== origin) outside.push(request.url()); });
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), status, `${route} status`);
    assert.equal(await page.title(), title, `${route} title`);
    assert.equal(await page.locator('h1').count(), 1, `${route} h1`);
    assert.equal(await page.locator('main').count(), 1, `${route} main`);
    const unexpectedErrors = status === 404 ? errors.filter((message) => !message.includes('status of 404')) : errors;
    assert.deepEqual(unexpectedErrors, [], `${route} console errors`);
    assert.deepEqual(outside, [], `${route} outside requests`);
    assert.deepEqual(await context.cookies(), [], `${route} cookies`);
    assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })), { local: 0, session: 0 }, `${route} storage`);
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'), [], `${route} axe`);
    const controls = page.locator('a, button');
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index);
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44, `${route} touch target ${index}`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), `${route} horizontal overflow`);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(() => localStorage.setItem('real:marker', 'keep'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  assert.match(page.url(), /\/demo$/);
  assert.equal(await page.getByText('Demo — sample data, nothing is saved').isVisible(), true);
  assert.ok((await page.getByText('2 findings').boundingBox()).y < 844, 'demo result is on the first mobile screen');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('real:marker')), 'keep');
  assert.equal(await page.getByRole('button', { name: 'Reset demo' }).evaluate((element) => element === document.activeElement), true);
  await page.screenshot({ path: `${evidence}/live-demo-mobile.png`, fullPage: true });
  await page.getByRole('link', { name: 'Start for real' }).click();
  assert.match(page.url(), /\/#install$/);
  await context.close();

  const homeMobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const homeMobile = await homeMobileContext.newPage();
  await homeMobile.goto(origin, { waitUntil: 'networkidle' });
  await homeMobile.screenshot({ path: `${evidence}/live-home-mobile.png`, fullPage: true });
  await homeMobileContext.close();
  const homeDesktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const homeDesktop = await homeDesktopContext.newPage();
  await homeDesktop.goto(origin, { waitUntil: 'networkidle' });
  await homeDesktop.screenshot({ path: `${evidence}/live-home-desktop.png`, fullPage: true });
  await homeDesktopContext.close();

  const rawRoutes = [
    ['/demo', 'Demo — Silent Focus Sentinel'],
    ['/privacy', 'Privacy — Silent Focus Sentinel'],
    ['/terms', 'Terms — Silent Focus Sentinel'],
    ['/definitely-missing-polish-1', 'Page not found — Silent Focus Sentinel'],
  ];
  for (const [route, title] of rawRoutes) {
    const response = await fetch(`${origin}${route}`);
    const html = await response.text();
    assert.ok(html.includes(`<title>${title}</title>`), `${route} raw title`);
    assert.ok(html.includes(`content="${title}"`), `${route} raw social title`);
    assert.ok(html.includes(`content="${deploymentOrigin}${route.startsWith('/definitely') ? '/404.html' : route}"`), `${route} raw canonical social URL`);
  }

  const crawlContext = await browser.newContext();
  const crawl = await crawlContext.newPage();
  for (const route of ['/', '/demo', '/privacy', '/terms']) {
    await crawl.goto(`${origin}${route}`);
    const links = await crawl.locator('a').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    for (const href of links) {
      const url = new URL(href);
      const response = await fetch(`${url.origin}${url.pathname}${url.search}`, { redirect: 'follow' });
      assert.ok(response.status < 400, `${href} status ${response.status}`);
      if (url.hash) {
        const targetPage = await crawlContext.newPage();
        await targetPage.goto(href);
        assert.ok(await targetPage.locator(url.hash).count(), `${href} target`);
        await targetPage.close();
      }
    }
  }
  await crawlContext.close();
  console.log(`LIVE_VERIFY_PASS ${origin} routes=${routes.length} axe=0 storage=0 outsideRequests=0`);
} finally {
  await browser.close();
}
