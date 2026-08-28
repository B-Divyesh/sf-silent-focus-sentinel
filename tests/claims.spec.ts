import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = join(process.cwd(), 'target/release/silent-focus-sentinel');

function analyzeSample() {
  return JSON.parse(execFileSync(bin, ['analyze', 'examples/sample-trace.json'], { encoding: 'utf8' }));
}

test('@claim:find-silent flags the empty focus stop', () => {
  const report = analyzeSample();
  expect(report.summary.silentCount).toBe(1);
  expect(report.findings.find((finding: { kind: string }) => finding.kind === 'silent_announcement').id).toBe('checkout.promo');
});

test('@claim:find-duplicate flags adjacent repeated speech', () => {
  const report = analyzeSample();
  expect(report.summary.duplicateCount).toBe(1);
  expect(report.findings.find((finding: { kind: string }) => finding.kind === 'duplicate_announcement').id).toBe('checkout.total-value');
});

test('@claim:decorative-ignore omits an intentional decorative stop', () => {
  const report = analyzeSample();
  expect(report.summary.ignoredCount).toBe(1);
  expect(report.findings.map((finding: { id: string }) => finding.id)).not.toContain('checkout.separator');
});

test('@claim:json-html writes parseable standalone reports', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sfs-reports-'));
  const jsonPath = join(dir, 'report.json');
  const htmlPath = join(dir, 'report.html');
  execFileSync(bin, ['analyze', 'examples/sample-trace.json', '--json', jsonPath, '--html', htmlPath]);
  expect(JSON.parse(readFileSync(jsonPath, 'utf8')).summary.findingCount).toBe(2);
  const html = readFileSync(htmlPath, 'utf8');
  expect(html).toContain('<!doctype html>');
  expect(html).toContain('This focus stop announces nothing.');
});

test('@claim:record-command captures ordered JSON Lines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sfs-record-'));
  const output = join(dir, 'trace.json');
  const runner = `printf '%s\\n' '{"id":"first","role":"button","announcement":"First"}' '{"id":"second","role":"button","announcement":"Second"}'`;
  execFileSync(bin, ['record', '--command', runner, '--output', output, '--screen', 'Settings']);
  const trace = JSON.parse(readFileSync(output, 'utf8'));
  expect(trace.screen).toBe('Settings');
  expect(trace.events.map((event: { index: number }) => event.index)).toEqual([1, 2]);
});

test('@claim:diff-regressions reports new findings', () => {
  const result = spawnSync(bin, ['diff', 'examples/baseline-trace.json', 'examples/sample-trace.json', '--fail-on', 'regressions'], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  const report = JSON.parse(result.stdout);
  expect(report.newFindings).toHaveLength(2);
  expect(report.resolvedFindings).toHaveLength(0);
});

test('@claim:local-only demo uses no outside requests or storage', async ({ page, context }) => {
  const outside: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') outside.push(request.url());
  });
  await page.goto('/demo');
  await expect(page.getByText('Two stops need review')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test('@claim:sample-download exports the demo trace', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const trace = JSON.parse(readFileSync(path!, 'utf8'));
  expect(trace.schemaVersion).toBe(1);
  expect(trace.events).toHaveLength(7);
});

test('@claim:open-source package carries the MIT license', () => {
  const cargo = readFileSync('Cargo.toml', 'utf8');
  const license = readFileSync('LICENSE', 'utf8');
  expect(cargo).toContain('license = "MIT"');
  expect(license).toContain('Permission is hereby granted, free of charge');
});
