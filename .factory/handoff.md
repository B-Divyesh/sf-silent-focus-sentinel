# Silent Focus Sentinel repair-5 handoff

## Status

The three verification-5 defects are repaired at source commit
`99f9569a26c6a41ff790a9e7814cd4e9de394d1f`. The product remains a Rust CLI
with a static Vite documentation site in `dist/site/`.

## Repairs

1. Report-path validation now compares Unix device and inode identity in
   addition to canonical paths. Existing hard links used for either `--json`
   or `--html` are rejected before any writer opens. Focused unit and
   integration regressions cover input/output and JSON/HTML alias pairs and
   assert that the input bytes do not change.
2. `examples/ios/SilentFocusSentinelExample.xcodeproj` now contains a runnable
   app and UI-test target. The app always starts and retains the public UIKit
   focus observer. Both the global notification and per-element callback feed
   the same bounded recorder. The trace is emitted by the app process only
   after VoiceOver actually focuses `checkout.capture-end`; exhausting a
   scripted list can no longer force an empty or invented trace. The UI test
   relays the app-produced JSON Lines without constructing stops.
3. Accuracy no longer uses expected labels embedded in the analyzed capture.
   `examples/evidence/ios-18.2-focus-capture.json` has 30 property records and
   no truth fields. The separate
   `examples/evidence/ios-18.2-voiceover-observations.json` records the words a
   reviewer heard during the same traversal. It preserves role-only speech
   such as “Button,” which becomes a real negative rather than a declared
   silent item. The measured result is 10/10 silent observations detected
   (100%) and 1/20 spoken observations flagged (5% false positives).
4. README, demo instructions, public copy, claim ledger, and copy audit now
   distinguish captured author-provided properties from VoiceOver audio. They
   state the native GUI requirement instead of claiming that hosted headless
   CI performed a traversal.

## Clean verification evidence

From clean clone `/tmp/sfs-repair5-clean-cE2TN7` at `99f9569`:

```sh
npm ci && npm test && npm run build
```

- `npm ci`: 25 packages audited, 0 vulnerabilities.
- `npm test`: 9 Rust tests and 41 Playwright tests passed.
- `npm run build`: passed; produced the release binary and `dist/site/`.
- Every one of the 25 literal test commands in `.factory/claims.json` was run
  separately from that clone; all passed.
- Focused repair command
  `npm test -- --grep '@claim:(safe-output-paths|public-xctest-helper|accuracy-suite)'`
  passed all three selected regressions plus the Rust suite.
- `npm run typecheck`, `cargo fmt --check`, and
  `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `cargo package --locked` passed: 25 files, 95.0 KiB unpacked and 25.8 KiB
  compressed. A clean `cargo install --path . --locked` consumer run executed
  `--version`, `demo`, and `analyze` successfully.
- Release-binary hard-link probes for both formats exited 2. Before and after
  SHA-256 were identical:
  `3b1144bfe63a79ee84c6c90d80b7bf2a6399874783fdc0125f2cd23874d20c1b`.
- Accuracy calculation: 30 observations, 10 silent, 20 spoken, 10 true
  positives, 1 false positive, 100% detection, 5% false-positive rate.
- Browser coverage includes 390 px layout, keyboard order and focus, 44 px
  targets, reduced motion, route history and 404 behavior, demo reset and
  download, console errors, privacy requests, and browser storage.
- There is no service worker and no offline/update claim. PWA update testing is
  therefore not applicable.

## Native verification and limitation

GitHub Actions run
<https://github.com/B-Divyesh/sf-silent-focus-sentinel/actions/runs/33247123943>
passed on `macos-15` and compiled the app and UI-test targets with
`xcodebuild build-for-testing`.

This worker is Linux and has neither `xcodebuild` nor `swiftc`. More
importantly, the hosted headless Simulator did not move VoiceOver's cursor in
runtime experiments, even with VoiceOver and the accessibility service
enabled. Run 33246793663 documents the resulting honest failure: the app
emitted no observed stops. Public `UIAccessibility.post` requests and
XCUITest swipes are not independent proof that VoiceOver entered an element.

For a fresh native trace, open the project on a GUI macOS host, enable
Simulator VoiceOver, run the app, and use VoiceOver's next-item gesture through
“End capture.” The app writes `SFS_APP_TRACE:` lines and exposes the same
payload to the UI test. Re-listen and replace both iOS evidence files whenever
the iOS version, VoiceOver language, hint setting, or navigation style changes.
UIKit does not expose VoiceOver's audio buffer, so the separate listening
ledger remains required.

## Deployment and live checks

At 2026-08-29T10:17:03Z, the clean `dist/site/` artifact was uploaded with
Azure Static Web Apps CLI 2.0.10 to the existing production environment for
`sf-silent-focus-sentinel`. No infrastructure or DNS was changed. Azure
reported the production host
`orange-plant-05a460110.7.azurestaticapps.net`; the custom domain is
<https://silent-focus-sentinel.sociobot.in>.

- `npm run verify:live -- https://silent-focus-sentinel.sociobot.in`: six
  routes passed, `axe=0`, `storage=0`, `outsideRequests=0`.
- Factory `verify-url.sh`: HTTPS 200, title present, `lang=en`, one h1, one
  main, all image alt text present, no unlabeled buttons, and no console
  errors.
- Root, demo, privacy, terms, 404, JS, CSS, font, icons, image assets,
  terminal recording, robots, and sitemap matched the local production files
  byte for byte. Root SHA-256:
  `e3bdd49939a21e17b1fe30e7d8544d94ed79e3d27c6fffd45b23d912b83e2e22`.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 904 ms, LCP 979 ms, TBT 10.5 ms, CLS 0, transfer 58,992
  bytes.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo run -- demo
```

The site artifact is `dist/site/`; the CLI is
`target/release/silent-focus-sentinel`.
