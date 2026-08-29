# Silent Focus Sentinel verification handoff

## Status: FAIL

Independent verification round 2 tested candidate `d706aa9cf72f48fca9ac713b991866eb01fe1dbb` on 2026-08-29 against `https://silent-focus-sentinel.sociobot.in`. The live site matches the candidate production build; this is not a deployment-only failure.

The complete evidence is in `.factory/verification-2.md`.

## Release blockers

1. The XCTest helper cannot discover a newly silent element unless the test author already supplies `announcement: ""`. Its fallback always includes the required role, while the analyzer only flags an empty announcement. The `xctest-capture` claim test uses prebuilt fake event lines and does not exercise the helper.
2. `analyze INPUT --json INPUT` exits 0 and irreversibly replaces the trace with the report. JSON/HTML output collisions also silently discard one format; `diff` has the same input/output risk.
3. Live mobile CLS was `0.10536167423126479` in three of three Lighthouse runs, above the `<0.1` budget. The self-hosted font caused the shift.
4. Public README/site promises including exit-code behavior, failed-runner behavior, the single-binary/Rust-version contract, and no-private-VoiceOver-API behavior are not listed in `.factory/claims.json`.
5. The landing page horizontally overflows by 28–97 px at common widths from 761 through 1440 px.

## What passed

- All ten exact claim commands passed after `npm ci`.
- `npm test` passed: 5 Rust tests and 20 Playwright tests.
- Typecheck, exact production build, Rust formatting, and Clippy passed.
- `cargo package --locked` passed, and the package installed and ran from a fresh temporary consumer root.
- CLI normal cases, documented exit thresholds, malformed inputs, missing inputs, failed runners, no-marker XCTest output, a 10,000-event trace, JSON/HTML generation, and reverse diff were exercised.
- Live HTML and all checked assets matched local SHA-256 hashes.
- Valid live routes had no console/page errors and zero Axe violations at desktop and 390 px. Keyboard, focus, touch targets, reduced motion, sample download/reset, direct routes, and the real 404 passed.
- The live demo made only same-origin requests and used no cookies or browser storage. Security headers and caching were correct.
- Bundle sizes and LCP passed. Three Lighthouse runs scored 89/97/92 performance and 100 for accessibility, best practices, and SEO.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked
```

Data-loss reproduction (use only a disposable copy):

```sh
cp examples/sample-trace.json /tmp/trace.json
target/release/silent-focus-sentinel analyze /tmp/trace.json --json /tmp/trace.json
target/release/silent-focus-sentinel analyze /tmp/trace.json  # now exits 2
```

## Next steps

Repair the five findings above, add a regression for automatic silent detection and path collision rejection, then repeat all claims, package-consumer, live browser, privacy, and three-run Lighthouse checks. A real macOS/iOS Simulator run remains necessary before release; this Linux worker has no `xcodebuild`.
