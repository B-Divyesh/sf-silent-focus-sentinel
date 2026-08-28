# Silent Focus Sentinel handoff

## Repair for verifier report `c388e03ea4cd1764d5d110dffbb9bedae410f6ae`

This repair preserves the Rust CLI and static-site deployment class. It resolves every release blocker from `.factory/verification.md`.

### What changed

- Claim commands now forward Playwright options correctly: `npm test -- --grep @claim:<id>` runs Rust tests, a typed production build, then the selected browser test.
- Added `npm run typecheck`, strict `tsconfig.json`, and `@types/node`; the production build now runs typecheck first.
- Added `record-xctest`, which invokes `xcodebuild test`, extracts the `SFS_EVENT:` JSON Lines emitted by the included public-XCTest helper, and writes a regular trace. `examples/ios/SilentFocusSentinelXCTest.swift` and `CheckoutFocusTraversalTests.swift` give a complete app UI-test integration path.
- Added an `xctest-capture` claim and regression that runs `record-xctest` against a marked Xcodebuild fixture. The parser also has Rust unit coverage for marked and missing event output.
- The diff claim now proves both new findings and resolved findings. The privacy claim now exercises the CLI behind a recording rejecting proxy as well as the browser demo.
- Every link and button has a 44×44 px minimum target. Demo-bar focus switches to a navy outline with a light secondary ring, which contrasts with its aqua background.
- Static routes are emitted as `demo/index.html`, `privacy/index.html`, and `terms/index.html`. The Static Web Apps navigation fallback was removed so an unknown path reaches the configured 404 rewrite with an HTTP 404 rather than a 200.
- The self-hosted font now passes through Vite as a content-hashed asset and receives the existing immutable `/assets/*` cache policy. The obsolete public-font preload was removed.

### Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --allow-dirty
```

The static deploy root is `dist/site/`. The release executable is `target/release/silent-focus-sentinel`. Package verification can use:

```sh
cargo install --path target/package/silent-focus-sentinel-0.1.0 --root /tmp/sfs-consumer --locked
/tmp/sfs-consumer/bin/silent-focus-sentinel demo
```

For a real simulator traversal on macOS, copy the helper into the app UI-test target, make the explicit `SilentFocusSentinel.record(...)` calls shown in `examples/ios/CheckoutFocusTraversalTests.swift`, then run:

```sh
silent-focus-sentinel record-xctest --scheme CheckoutUITests --project Checkout.xcodeproj --output artifacts/checkout-trace.json
```

### Evidence (2026-08-28)

- Clean `npm ci`: passed (25 packages; 0 vulnerabilities).
- `npm test`: passed — 5 Rust tests and 20 Playwright tests. Browser coverage includes desktop, 390×844 mobile, keyboard/skip navigation, reduced motion, all routes, console errors, and Axe serious/critical violations (none).
- All ten exact `.factory/claims.json` commands passed, including `find-silent`, `find-duplicate`, `local-only`, `json-html`, `decorative-ignore`, `record-command`, `xctest-capture`, `diff-regressions`, `sample-download`, and `open-source`.
- Mobile regression checks every visible `<a>` and `<button>` on `/`, `/demo`, `/privacy`, and `/terms` at least 44×44 px; it checks the demo reset control’s `rgb(6, 36, 31)` focus outline.
- `npm run typecheck`, `npm run build`, `cargo fmt --check`, and `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `cargo package --allow-dirty`: passed (13 files; 43.5 KiB unpacked / 13.1 KiB compressed). A fresh-prefix `cargo install --path target/package/silent-focus-sentinel-0.1.0 --root <temp> --locked` passed and its installed `demo` generated JSON and HTML reports.
- Production site assets: JS 11.75 KB (4.59 KB gzip), CSS 11.64 KB (3.48 KB gzip), hashed font 13.28 KB, hero WebP 33.42 KB. All remain below the static budget.
- A local Lighthouse desktop run reported performance/accessibility/best-practices scores of 100/100/100. Its Chrome target crashed while collecting the final screenshot, so SEO (92 on HTTP localhost) and its lab timing are not release evidence; browser/Axe tests and the previous live Lighthouse evidence remain the reliable checks here.
- Deployment: `7fa09d7` was pushed to `main` and `dist/site/` deployed successfully to Azure Static Web Apps (`orange-plant-05a460110.7.azurestaticapps.net`) with the `silent-focus-sentinel.sociobot.in` custom domain Ready. Live SHA-256 matches local for `index.html` (`0f064546…fc5c`), `assets/index-xkn1SBol.js` (`28cb9ba8…21fd`), and the hashed font (`685bbbf6…130f`). The live font and JS both return `Cache-Control: public, max-age=31536000, immutable`; `/definitely-missing` returns HTTP 404 and the designed page text.
- Live 390×844 browser smoke test: `/demo` returned 200 with title “Demo — Silent Focus Sentinel,” its intended heading, no console errors, a 44 px minimum visible control dimension, and the navy demo-bar focus outline.

### Known limits

- This Linux worker cannot run Xcode or an iOS Simulator. The actual public-XCTest source and the binary’s marked-log capture path are shipped and tested with a deterministic Xcodebuild fixture; run the documented command on macOS against the target app before a physical-device release.
- XCTest does not expose the private VoiceOver cursor. The app-owned UI test defines the intended swipe order explicitly, records accessible properties and expected spoken text, and does not claim WCAG conformance.
