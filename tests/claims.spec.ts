import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, linkSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = process.cwd();
const bin = join(root, 'target/release/silent-focus-sentinel');
const sampleTrace = join(root, 'examples/sample-trace.json');
const baselineTrace = join(root, 'examples/baseline-trace.json');

function analyzeSample() {
  return JSON.parse(execFileSync(bin, ['analyze', sampleTrace], { encoding: 'utf8' }));
}

function makeXcodebuild(directory: string) {
  const executable = join(directory, 'xcodebuild');
  writeFileSync(executable, `#!/bin/sh
printf '%s\n' 'unmarked {"id":"ignore-me"}' 'SFS_VOICEOVER_STOP:{"index":1,"id":"checkout.title","role":"header","announcement":"Checkout","capture":"voiceover_simulator"}' 'log SFS_VOICEOVER_STOP:{"index":2,"id":"checkout.surprise","role":"other","announcement":"","capture":"voiceover_simulator"}'
`);
  chmodSync(executable, 0o755);
  return executable;
}

test('@claim:find-empty-text flags an empty effective focus announcement', () => {
  const report = analyzeSample();
  expect(report.summary.emptyCount).toBe(1);
  expect(report.findings.find((finding: { kind: string }) => finding.kind === 'empty_text').id).toBe('checkout.promo');
});

test('@claim:find-duplicate-text flags adjacent duplicate focus announcements', () => {
  const report = analyzeSample();
  expect(report.summary.duplicateCount).toBe(1);
  expect(report.findings.find((finding: { kind: string }) => finding.kind === 'duplicate_text').id).toBe('checkout.total-value');
});

test('@claim:decorative-ignore omits an intentional decorative element', () => {
  const report = analyzeSample();
  expect(report.summary.ignoredCount).toBe(1);
  expect(report.findings.map((finding: { id: string }) => finding.id)).not.toContain('checkout.separator');
});

test('@claim:json-html writes parseable standalone reports', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-reports-'));
  const jsonPath = join(directory, 'report.json');
  const htmlPath = join(directory, 'report.html');
  execFileSync(bin, ['analyze', sampleTrace, '--json', jsonPath, '--html', htmlPath]);
  expect(JSON.parse(readFileSync(jsonPath, 'utf8')).summary.findingCount).toBe(2);
  const html = readFileSync(htmlPath, 'utf8');
  expect(html).toContain('<!doctype html>');
  expect(html).toContain('This VoiceOver focus stop has an empty announcement.');
  expect(html).not.toMatch(/<script|https?:\/\//);
});

test('@claim:record-command captures ordered JSON Lines', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-record-'));
  const output = join(directory, 'trace.json');
  const runner = `printf '%s\\n' '{"id":"first","role":"button","text":"First"}' '{"id":"second","role":"button","text":"Second"}'`;
  execFileSync(bin, ['record', '--command', runner, '--output', output, '--screen', 'Settings']);
  const trace = JSON.parse(readFileSync(output, 'utf8'));
  expect(trace.screen).toBe('Settings');
  expect(trace.events.map((event: { index: number }) => event.index)).toEqual([1, 2]);
  expect(trace.events.map((event: { text: string }) => event.text)).toEqual(['First', 'Second']);
});

test('@claim:xctest-extraction extracts ordered Simulator focus stops from xcodebuild output', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-xctest-'));
  const output = join(directory, 'trace.json');
  execFileSync(bin, ['record-xctest', '--scheme', 'CheckoutUITests', '--xcodebuild', makeXcodebuild(directory), '--output', output]);
  const trace = JSON.parse(readFileSync(output, 'utf8'));
  expect(trace.events.map((event: { id: string }) => event.id)).toEqual(['checkout.title', 'checkout.surprise']);
  expect(trace.events.map((event: { announcement: string }) => event.announcement)).toEqual(['Checkout', '']);
  expect(trace.events.map((event: { capture: string }) => event.capture)).toEqual(['voiceover_simulator', 'voiceover_simulator']);
});

test('@claim:diff-regressions reports new and resolved findings', () => {
  const result = spawnSync(bin, ['diff', baselineTrace, sampleTrace, '--fail-on', 'regressions'], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(JSON.parse(result.stdout).newFindings).toHaveLength(2);
  const reverse = spawnSync(bin, ['diff', sampleTrace, baselineTrace], { encoding: 'utf8' });
  expect(reverse.status).toBe(0);
  expect(JSON.parse(reverse.stdout).resolvedFindings).toHaveLength(2);
});

test('@claim:safe-output-paths rejects every collision before writing', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-collision-'));
  const baseline = join(directory, 'baseline.json');
  const current = join(directory, 'current.json');
  writeFileSync(baseline, readFileSync(baselineTrace));
  writeFileSync(current, readFileSync(sampleTrace));
  const baselineBefore = readFileSync(baseline, 'utf8');
  const currentBefore = readFileSync(current, 'utf8');
  const cases = [
    ['analyze', current, '--json', current],
    ['analyze', current, '--html', current],
    ['analyze', current, '--json', join(directory, 'report.out'), '--html', join(directory, 'report.out')],
    ['diff', baseline, current, '--json', baseline],
    ['diff', baseline, current, '--html', current],
    ['diff', baseline, current, '--json', join(directory, 'diff.out'), '--html', join(directory, 'diff.out')],
  ];
  for (const args of cases) {
    const result = spawnSync(bin, args, { encoding: 'utf8' });
    expect(result.status, args.join(' ')).toBe(2);
    expect(result.stderr).toContain('different');
    expect(readFileSync(baseline, 'utf8')).toBe(baselineBefore);
    expect(readFileSync(current, 'utf8')).toBe(currentBefore);
  }

  const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
  const aliases = [
    ['analyze', current, '--json'],
    ['analyze', current, '--html'],
    ['diff', baseline, current, '--json'],
    ['diff', baseline, current, '--html'],
  ];
  for (const [index, prefix] of aliases.entries()) {
    const target = prefix[0] === 'analyze' ? current : prefix[3] === '--html' ? current : baseline;
    const alias = join(directory, `hard-link-${index}.out`);
    linkSync(target, alias);
    const before = digest(target);
    const result = spawnSync(bin, [...prefix, alias], { encoding: 'utf8' });
    expect(result.status, [...prefix, alias].join(' ')).toBe(2);
    expect(result.stderr).toContain('matches an input trace');
    expect(digest(target)).toBe(before);
    expect(digest(alias)).toBe(before);
  }

  const json = join(directory, 'json-hard-link.out');
  const html = join(directory, 'html-hard-link.out');
  writeFileSync(json, 'existing report');
  linkSync(json, html);
  const reportBefore = digest(json);
  const reportCollision = spawnSync(bin, ['analyze', current, '--json', json, '--html', html], { encoding: 'utf8' });
  expect(reportCollision.status).toBe(2);
  expect(reportCollision.stderr).toContain('need different files');
  expect(digest(json)).toBe(reportBefore);
  expect(digest(html)).toBe(reportBefore);
});

test('@claim:exit-codes follows the documented 0, 1, and 2 contract', () => {
  expect(spawnSync(bin, ['analyze', baselineTrace], { encoding: 'utf8' }).status).toBe(0);
  expect(spawnSync(bin, ['analyze', sampleTrace, '--fail-on', 'findings'], { encoding: 'utf8' }).status).toBe(1);
  const malformed = join(mkdtempSync(join(tmpdir(), 'sfs-exit-')), 'invalid.json');
  writeFileSync(malformed, '{');
  expect(spawnSync(bin, ['analyze', malformed], { encoding: 'utf8' }).status).toBe(2);
});

test('@claim:failed-runner exits safely without creating an output trace', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-runner-'));
  const output = join(directory, 'trace.json');
  const result = spawnSync(bin, ['record', '--command', 'exit 9', '--output', output], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('record command exited');
  expect(existsSync(output)).toBe(false);
});

test('@claim:single-binary builds with the declared Rust minimum', () => {
  const cargo = readFileSync(join(root, 'Cargo.toml'), 'utf8');
  expect(cargo).toContain('rust-version = "1.85"');
  expect(cargo.match(/^\[\[bin\]\]/gm)).toHaveLength(1);
  expect(statSync(bin).isFile()).toBe(true);
  expect(statSync(bin).mode & 0o111).not.toBe(0);
});

test('@claim:public-xctest-helper uses public Simulator VoiceOver focus notifications', () => {
  const helper = readFileSync(join(root, 'examples/ios/SilentFocusSentinelXCTest.swift'), 'utf8');
  const capture = readFileSync(join(root, 'examples/ios/SilentFocusSentinelVoiceOverCapture.swift'), 'utf8');
  expect(helper).toContain('import XCTest');
  expect(capture).toContain('import UIKit');
  expect(capture).toContain('UIAccessibility.elementFocusedNotification');
  expect(capture).toContain('UIAccessibility.focusedElementUserInfoKey');
  expect(capture).toContain('SFS_VOICEOVER_STOP:');
  expect(capture).toContain('announcement:');
  expect(capture).not.toMatch(/AXUIElement|private.*accessibility/i);
  const traversal = readFileSync(join(root, 'examples/ios/CheckoutFocusTraversalTests.swift'), 'utf8');
  const appDelegate = readFileSync(join(root, 'examples/ios/SilentFocusSentinelExample/AppDelegate.swift'), 'utf8');
  const example = readFileSync(join(root, 'examples/ios/SilentFocusSentinelExample/CheckoutViewController.swift'), 'utf8');
  expect(traversal).toContain('silent-focus-sentinel-capture');
  expect(traversal).toContain('app.swipeRight()');
  expect(traversal).toContain('app.buttons["capture.run"].tap()');
  expect(traversal).toContain('Trace emitted');
  expect(appDelegate).toContain('private let capture = SilentFocusSentinelVoiceOverCapture()');
  expect(appDelegate).toContain('capture.start(emitAfterFocusing: "checkout.capture-end")');
  expect(example).toContain('UISwipeGestureRecognizer');
  expect(example).toContain('UIAccessibility.post(notification: .layoutChanged, argument: stop)');
  expect(existsSync(join(root, 'examples/ios/SilentFocusSentinelExample.xcodeproj/project.pbxproj'))).toBe(true);
  expect(existsSync(join(root, 'examples/ios/SilentFocusSentinelExample.xcodeproj/xcshareddata/xcschemes/SilentFocusSentinelExample.xcscheme'))).toBe(true);
  const nativeTests = readFileSync(join(root, 'examples/ios/SilentFocusSentinelVoiceOverCaptureTests.swift'), 'utf8');
  expect(nativeTests).toContain('testSilentFocusedStopStaysSilent');
  expect(nativeTests).toContain('testHintAndValueArePartOfTheEffectiveAnnouncement');
});

test('@claim:stdout-json prints parseable reports when --json is omitted', () => {
  const analyze = spawnSync(bin, ['analyze', sampleTrace], { encoding: 'utf8' });
  expect(analyze.status).toBe(0);
  expect(JSON.parse(analyze.stdout).summary.findingCount).toBe(2);
  const diff = spawnSync(bin, ['diff', baselineTrace, sampleTrace], { encoding: 'utf8' });
  expect(diff.status).toBe(0);
  expect(JSON.parse(diff.stdout).newFindings).toHaveLength(2);
});

test('@claim:demo-isolation leaves the project unchanged and uses a new temporary directory', async ({ page }) => {
  const project = mkdtempSync(join(tmpdir(), 'sfs-project-'));
  writeFileSync(join(project, 'keep.txt'), 'unchanged');
  writeFileSync(join(project, 'settings.json'), '{"keep":true}\n');
  const before = readdirSync(project).map((name) => [name, readFileSync(join(project, name), 'utf8')]);
  const result = spawnSync(bin, ['demo'], { cwd: project, encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(readdirSync(project).map((name) => [name, readFileSync(join(project, name), 'utf8')])).toEqual(before);
  const paths = ['JSON', 'HTML'].map((label) => result.stdout.match(new RegExp(`^${label}: (.+)$`, 'm'))?.[1]);
  expect(paths.every(Boolean)).toBe(true);
  expect(paths.every((path) => existsSync(path!))).toBe(true);
  expect(new Set(paths.map((path) => resolve(path!, '..'))).size).toBe(1);
  expect(resolve(paths[0]!, '..')).toMatch(new RegExp(`^${tmpdir().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  expect(resolve(paths[0]!, '..')).not.toBe(project);

  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('real:marker', 'keep'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => localStorage.getItem('real:marker'))).toBe('keep');
});

test('@claim:accuracy-suite meets the VoiceOver traversal detection and false-positive rates', () => {
  const tracePath = join(root, 'examples/evidence/ios-18.2-focus-capture.json');
  const trace = JSON.parse(readFileSync(tracePath, 'utf8')) as {
    events: Array<{ index: number; id: string; announcement: string }>;
  };
  const evidence = JSON.parse(readFileSync(join(root, 'examples/evidence/ios-18.2-voiceover-observations.json'), 'utf8')) as {
    evidenceKind: string;
    captureFile: string;
    environment: { method: string };
    observations: Array<{ index: number; id: string; spokenWords: string }>;
  };
  const report = JSON.parse(execFileSync(bin, ['analyze', tracePath], { encoding: 'utf8' }));
  const foundSilent = new Set(report.findings.filter((finding: { kind: string }) => finding.kind === 'empty_text').map((finding: { id: string }) => finding.id));
  const positives = evidence.observations.filter((observation) => observation.spokenWords.trim() === '');
  const negatives = evidence.observations.filter((observation) => observation.spokenWords.trim() !== '');
  const positiveIds = new Set(positives.map((observation) => observation.id));
  const truePositives = positives.filter((observation) => foundSilent.has(observation.id)).length;
  const falsePositives = negatives.filter((observation) => foundSilent.has(observation.id)).length;
  expect(evidence.evidenceKind).toBe('verbatim_voiceover_observation');
  expect(evidence.captureFile).toBe('ios-18.2-focus-capture.json');
  expect(evidence.environment.method).toContain('listened to each stop');
  expect(trace.events).toHaveLength(30);
  expect(evidence.observations).toHaveLength(trace.events.length);
  expect(evidence.observations.map(({ index, id }) => ({ index, id }))).toEqual(trace.events.map(({ index, id }) => ({ index, id })));
  expect(JSON.stringify(trace)).not.toMatch(/groundTruth|silentIds|expected/i);
  expect(truePositives / positiveIds.size).toBeGreaterThanOrEqual(0.9);
  expect(falsePositives / negatives.length).toBeLessThan(0.1);
  expect(foundSilent).toContain('checkout.unnamed-button');
  expect(evidence.observations.find((observation) => observation.id === 'checkout.unnamed-button')?.spokenWords).toBe('Button');
});

test('@claim:accountless-run exercises every command without credentials or a service', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-accountless-'));
  const cleanEnv = { PATH: process.env.PATH ?? '/usr/bin:/bin', TMPDIR: directory, LANG: 'C' };
  const recorded = join(directory, 'recorded.json');
  const xctest = join(directory, 'xctest.json');
  const commands = [
    ['--help'], ['demo'], ['analyze', sampleTrace], ['diff', baselineTrace, sampleTrace],
    ['record', '--command', `printf '%s\\n' '{"id":"one","role":"button","text":"One"}'`, '--output', recorded],
    ['record-xctest', '--scheme', 'Fixture', '--xcodebuild', makeXcodebuild(directory), '--output', xctest],
  ];
  for (const args of commands) expect(spawnSync(bin, args, { encoding: 'utf8', env: cleanEnv }).status, args[0]).toBe(0);
});

test('@claim:no-telemetry sends no requests from any CLI command', async () => {
  const connections: string[] = [];
  const server = createServer((request, response) => { connections.push(request.url ?? 'unknown'); response.writeHead(502).end(); });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('proxy did not bind');
  const directory = mkdtempSync(join(tmpdir(), 'sfs-network-'));
  const proxy = `http://127.0.0.1:${address.port}`;
  const env = { ...process.env, HTTP_PROXY: proxy, HTTPS_PROXY: proxy, ALL_PROXY: proxy, NO_PROXY: '' };
  const commands = [
    ['--help'], ['demo'], ['analyze', sampleTrace], ['diff', baselineTrace, sampleTrace],
    ['record', '--command', `printf '%s\\n' '{"id":"one","role":"button","text":"One"}'`, '--output', join(directory, 'record.json')],
    ['record-xctest', '--scheme', 'Fixture', '--xcodebuild', makeXcodebuild(directory), '--output', join(directory, 'xctest.json')],
  ];
  try {
    for (const args of commands) expect(spawnSync(bin, args, { encoding: 'utf8', env }).status, args[0]).toBe(0);
    await new Promise((done) => setTimeout(done, 25));
    expect(connections).toEqual([]);
    expect(readFileSync(join(root, 'Cargo.toml'), 'utf8')).not.toMatch(/reqwest|hyper|ureq|telemetry/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
  }
});

test('@claim:local-only writes requested reports to local paths only', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sfs-local-'));
  const json = join(directory, 'report.json');
  const html = join(directory, 'report.html');
  const result = spawnSync(bin, ['analyze', sampleTrace, '--json', json, '--html', html], { encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(existsSync(json)).toBe(true);
  expect(existsSync(html)).toBe(true);
  expect(readdirSync(directory).sort()).toEqual(['report.html', 'report.json']);
});

test('@claim:site-private stores nothing and loads only same-origin resources', async ({ browser }) => {
  for (const route of ['/', '/?demo=1', '/demo', '/privacy', '/terms', '/missing']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const outside: string[] = [];
    page.on('request', (request) => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outside.push(request.url()); });
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    expect(outside).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    await context.close();
  }
});

test('@claim:sample-download exports the isolated demo trace', async ({ page }) => {
  await page.goto('/?demo=1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const trace = JSON.parse(readFileSync(path!, 'utf8'));
  expect(trace.schemaVersion).toBe(1);
  expect(trace.events).toHaveLength(7);
  expect(trace.events[2].announcement).toBe('');
  expect(trace.events[2].capture).toBe('voiceover_simulator');
});

test('@claim:browser-demo-ready opens a finished report and reset restores its sample state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.trace-item')).toHaveCount(7);
  await expect(page.getByText('2 findings')).toBeVisible();
  expect((await page.getByText('2 findings').boundingBox())!.y).toBeLessThan(844);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample JSON' }).click();
  await download;
  await expect(page.locator('#download-status')).toHaveText('Sample JSON downloaded.');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#download-status')).toBeEmpty();
  await expect(page.locator('.trace-item')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeFocused();
});

test('@claim:no-wcag-certification publishes a boundary, not a certification result', async ({ page }) => {
  const help = spawnSync(bin, ['--help'], { encoding: 'utf8' });
  expect(help.status).toBe(0);
  expect(help.stdout).not.toMatch(/wcag|conformance|certif/i);
  const report = analyzeSample();
  expect(JSON.stringify(report)).not.toMatch(/wcag|conformance|certif/i);
  const directory = mkdtempSync(join(tmpdir(), 'sfs-wcag-'));
  const html = join(directory, 'report.html');
  execFileSync(bin, ['analyze', sampleTrace, '--html', html]);
  expect(readFileSync(html, 'utf8')).not.toMatch(/wcag|conformance|certif/i);
  await page.goto('/');
  await expect(page.getByText('It does not certify Web Content Accessibility Guidelines (WCAG) conformance.')).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByText(/does not record VoiceOver audio or certify Web Content Accessibility Guidelines/)).toBeVisible();
  expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('It does not record VoiceOver audio or certify Web Content Accessibility Guidelines (WCAG) conformance.');
});

test('@claim:cli-demo-recording regenerates the checked-in terminal recording from the current binary', () => {
  const output = join(mkdtempSync(join(tmpdir(), 'sfs-recording-')), 'demo-recording.svg');
  execFileSync('node', ['site/scripts/capture-demo-recording.mjs', '--binary', bin, '--output', output], { cwd: root });
  expect(readFileSync(output, 'utf8')).toBe(readFileSync(join(root, 'site/public/demo-recording.svg'), 'utf8'));
});

test('@claim:open-source package carries the MIT license', () => {
  expect(readFileSync(join(root, 'Cargo.toml'), 'utf8')).toContain('license = "MIT"');
  expect(readFileSync(join(root, 'LICENSE'), 'utf8')).toContain('Permission is hereby granted, free of charge');
});

test('@claim:build-artifacts creates the documented binary and routed site', () => {
  expect(statSync(bin).isFile()).toBe(true);
  for (const file of ['index.html', 'demo/index.html', 'privacy/index.html', 'terms/index.html', '404.html']) {
    expect(readFileSync(join(root, 'dist/site', file), 'utf8')).toContain('<!doctype html>');
  }
});
