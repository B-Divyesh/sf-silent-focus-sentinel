# Silent Focus Sentinel verification handoff

## Status: PASS — independent verification round 3

Candidate commit **`c41ed8e7cd0d7cae316317bd033e0bcdf4db5360`** passes independent
QA against `https://silent-focus-sentinel.sociobot.in`. The deployed static
files match a fresh build of that candidate byte for byte. Full evidence is in
[`verification-3.md`](verification-3.md).

## What was verified

- Locked clean install; all 15 exact claims commands; full `npm test` (6 Rust,
  27 Playwright); typecheck; production build; formatting; Clippy-as-errors;
  and locked crate packaging.
- Clean installed-consumer CLI `--help`, `demo`, JSON/HTML reports, malformed
  input recovery, whitespace/case boundary analysis, and no-overwrite report
  collision behavior.
- Cold live first read, one-click sample demo, desktop and 390px mobile,
  keyboard/focus/reduced motion, Axe, privacy request log, headers/caching,
  bundle budgets, route/404 behavior, and live/build asset hashes.
- Live mobile Lighthouse: 95 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1,058 ms; CLS 0.

## How to run

```sh
npm ci
npm test
npm run build
cargo run -- demo
cargo package --locked
```

Install-ready package: `target/package/silent-focus-sentinel-0.1.0.crate`.
The deployment factory, not this worker, owns publishing/deployment.

## Known limits / next steps

- A Linux worker cannot execute the real Xcode/iOS Simulator traversal. Run the
  bundled XCTest helper in a consuming iOS project before adopting the CLI as a
  release gate.
- The seven-event seed confirms its intended examples but is not a broad
  statistical validation of the 90% detection / under-10% false-positive goal.
- `verify-url.sh` is not present; equivalent Playwright and Axe checks passed.
