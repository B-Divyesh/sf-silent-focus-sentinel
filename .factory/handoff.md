# Silent Focus Sentinel handoff

## What shipped

- Rust 0.1.0 single-binary CLI with `record`, `analyze`, `diff`, and `demo` commands.
- JSON object and JSON Lines input, schema checks, useful errors, and documented exit codes.
- Empty-announcement and adjacent-duplicate checks with an explicit `ignored` escape hatch.
- Standalone JSON and accessible HTML reports. Diff reports separate new and resolved findings.
- Bundled checkout regression fixtures. `demo` uses a new operating-system temporary directory on each run.
- Static Vite site in `dist/site/` with landing, `/demo`, `/privacy`, `/terms`, and designed 404 routes.
- Original luminous focus-landscape artwork, responsive mobile layouts, keyboard routing, reduced-motion behavior, CSP, caching, social card, favicon, sitemap, and robots file.
- Claim manifest, copy audit, Rust unit tests, Playwright claim tests, route checks, mobile checks, and Axe checks.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package
target/release/silent-focus-sentinel demo
```

The static deploy root is `dist/site/`; `index.html` and `404.html` are at that root. The release executable is `target/release/silent-focus-sentinel`.

Verification on 2026-08-28:

- Rust: 3 unit tests passed.
- Playwright: 17 tests passed, including all nine claim IDs.
- Axe CLI 4.10.3: 0 violations on `/`, `/demo`, `/privacy`, and `/terms`.
- Lighthouse 13.0.1 mobile: performance 96, accessibility 100, best practices 100, SEO 100.
- Lighthouse lab metrics: LCP 2,461 ms, CLS 0, total blocking time 0 ms.
- Initial assets: JavaScript 4.60 KB gzip; CSS 3.42 KB gzip; font 13.28 KB WOFF2; hero 33.4 KB WebP.
- `cargo package`: 10 source/package files, 68 KB compressed before the final documentation-only changes.

## Known limits

- Apple does not expose public APIs for driving the real VoiceOver cursor. An app-specific XCTest or other simulator runner must emit ordered JSON Lines; `record` runs it and captures the events.
- Duplicate checks cover adjacent normalized announcements. They do not judge whether repeated text is useful in its product context.
- Physical-device automation and WCAG certification are intentionally outside v1.
- Lighthouse INP has no value for this static lab run because there was no measured user interaction. Total blocking time was 0 ms; Playwright covers the interactive paths.

## Next steps

- Publish the crate or signed release binaries through factory-owned credentials.
- Add a small XCTest helper package if teams converge on a stable public extraction pattern.
- Expand the seeded corpus with opt-in traces from real apps and track precision by rule.

## Asset provenance

`site/public/focus-landscape.webp` was generated with the required factory image script and then optimized locally. The full prompt and deployment sidecar are recorded in `.factory/design.md` and beside the asset. `og-card.webp` derives from that art. Space Grotesk is self-hosted from Fontsource under the SIL Open Font License.
