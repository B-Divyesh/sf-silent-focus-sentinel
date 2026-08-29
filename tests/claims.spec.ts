import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
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

test('@claim:diff-regressions reports new and resolved findings', () => {
  const result = spawnSync(bin, ['diff', 'examples/baseline-trace.json', 'examples/sample-trace.json', '--fail-on', 'regressions'], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  const report = JSON.parse(result.stdout);
  expect(report.newFindings).toHaveLength(2);
  expect(report.resolvedFindings).toHaveLength(0);

  const reverse = spawnSync(bin, ['diff', 'examples/sample-trace.json', 'examples/baseline-trace.json'], { encoding: 'utf8' });
  expect(reverse.status).toBe(0);
  const reverseReport = JSON.parse(reverse.stdout);
  expect(reverseReport.newFindings).toHaveLength(0);
  expect(reverseReport.resolvedFindings).toHaveLength(2);
});

test('@claim:xctest-capture runs a marked XCTest simulator traversal through the CLI', () => {
  const helper = readFileSync('examples/ios/SilentFocusSentinelXCTest.swift', 'utf8');
  const helperRegression = readFileSync('examples/ios/SilentFocusSentinelXCTestTests.swift', 'utf8');
  const traversal = readFileSync('examples/ios/CheckoutFocusTraversalTests.swift', 'utf8');
  expect(helper).toContain('static func observedAnnouncement(label: String, value: String)');
  expect(helper).not.toContain('announcement: String?');
  expect(helper).not.toContain('[label, value, role]');
  expect(traversal).not.toContain('announcement:');
  expect(helperRegression).toContain('observedAnnouncement(label: "", value: "")');
  expect(helperRegression).toContain('XCTAssertEqual(after, "")');
  const dir = mkdtempSync(join(tmpdir(), 'sfs-xctest-'));
  const xcodebuild = join(dir, 'xcodebuild');
  const output = join(dir, 'trace.json');
  writeFileSync(xcodebuild, `#!/bin/sh
printf '%s\\n' 'Test Suite started' 'SFS_EVENT:{"id":"checkout.title","role":"header","announcement":"Checkout, heading"}' 'SFS_EVENT:{"id":"checkout.pay","role":"button","announcement":"Pay now, button"}'
`);
  chmodSync(xcodebuild, 0o755);
  execFileSync(bin, ['record-xctest', '--scheme', 'CheckoutUITests', '--xcodebuild', xcodebuild, '--output', output]);
  const trace = JSON.parse(readFileSync(output, 'utf8'));
  expect(trace.platform).toContain('iOS Simulator');
  expect(trace.events.map((event: { id: string }) => event.id)).toEqual(['checkout.title', 'checkout.pay']);
});

test('@claim:safe-output-paths rejects every input and report destination collision before writing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sfs-collision-'));
  const baseline = join(dir, 'baseline.json');
  const current = join(dir, 'current.json');
  writeFileSync(baseline, readFileSync('examples/baseline-trace.json'));
  writeFileSync(current, readFileSync('examples/sample-trace.json'));
  const baselineBefore = readFileSync(baseline, 'utf8');
  const currentBefore = readFileSync(current, 'utf8');
  const cases = [
    ['analyze', current, '--json', current],
    ['analyze', current, '--html', current],
    ['analyze', current, '--json', join(dir, 'report.out'), '--html', join(dir, 'report.out')],
    ['diff', baseline, current, '--json', baseline],
    ['diff', baseline, current, '--html', current],
    ['diff', baseline, current, '--json', join(dir, 'diff.out'), '--html', join(dir, 'diff.out')],
  ];
  for (const args of cases) {
    const result = spawnSync(bin, args, { encoding: 'utf8' });
    expect(result.status, args.join(' ')).toBe(2);
    expect(result.stderr).toContain('different');
    expect(readFileSync(baseline, 'utf8')).toBe(baselineBefore);
    expect(readFileSync(current, 'utf8')).toBe(currentBefore);
  }
});

test('@claim:exit-codes follows the documented 0, 1, and 2 contract', () => {
  expect(spawnSync(bin, ['analyze', 'examples/baseline-trace.json'], { encoding: 'utf8' }).status).toBe(0);
  expect(spawnSync(bin, ['analyze', 'examples/sample-trace.json', '--fail-on', 'findings'], { encoding: 'utf8' }).status).toBe(1);
  const malformed = join(mkdtempSync(join(tmpdir(), 'sfs-exit-')), 'invalid.json');
  writeFileSync(malformed, '{');
  expect(spawnSync(bin, ['analyze', malformed], { encoding: 'utf8' }).status).toBe(2);
});

test('@claim:failed-runner exits safely without creating an output trace', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sfs-runner-'));
  const output = join(dir, 'trace.json');
  const result = spawnSync(bin, ['record', '--command', 'exit 9', '--output', output], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('record command exited');
  expect(() => readFileSync(output, 'utf8')).toThrow();
});

test('@claim:single-binary builds with the declared Rust minimum', () => {
  const cargo = readFileSync('Cargo.toml', 'utf8');
  expect(cargo).toContain('rust-version = "1.85"');
  expect(cargo).toContain('[[bin]]');
  expect(cargo.match(/^\[\[bin\]\]/gm)).toHaveLength(1);
  expect(readFileSync(bin)).toBeTruthy();
});

test('@claim:public-xctest-helper avoids private VoiceOver APIs', () => {
  const helper = readFileSync('examples/ios/SilentFocusSentinelXCTest.swift', 'utf8');
  expect(helper).toContain('import XCTest');
  expect(helper).not.toMatch(/AXUIElement|UIAccessibility/);
});

test('@claim:local-only demo and CLI use no outside requests or storage', async ({ page, context }) => {
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

  const connections: string[] = [];
  const server = createServer((request, response) => {
    connections.push(request.url ?? 'unknown');
    response.writeHead(502).end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('proxy did not bind to a TCP port');
  try {
    const result = spawnSync(bin, ['demo'], {
      encoding: 'utf8',
      env: { ...process.env, HTTP_PROXY: `http://127.0.0.1:${address.port}`, HTTPS_PROXY: `http://127.0.0.1:${address.port}`, ALL_PROXY: `http://127.0.0.1:${address.port}`, NO_PROXY: '' },
    });
    expect(result.status).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(connections).toEqual([]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
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
