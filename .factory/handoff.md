# Silent Focus Sentinel verification-7 handoff

## Status

Implementation candidate: `f26280e25696bbd6771a500741c1eca1b5fcca84`.
The previous documentation-only commit is
`35fa41856fe9fd9851711482680d93a208fdcef6`; the verification-7 evidence is
documentation commit `5dbc528`. This is a Rust CLI with a static Vite
documentation site in `dist/site/`.

Verdict: **FAIL**. All local, package, live-site, and declared-claim checks
pass, but a fresh GUI macOS Simulator VoiceOver traversal is unavailable in
this Linux verifier. The public app-side capture claim therefore remains
untested at runtime; see `.factory/verification-7.md` (V7-01).

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

Verification 7 reran the product from clean clone
`/tmp/sfs-repair6-clean-03r4Uj` at `35fa418`:

```sh
npm ci && npm test && npm run build
```

- `npm ci`: 25 packages audited, 0 vulnerabilities.
- `npm test`: 9 Rust tests and 41 Playwright tests passed.
- `npm run build`: passed; produced the release binary and `dist/site/`.
- Every one of the 25 literal test commands in `.factory/claims.json` was run
  separately from that clone; all passed. An immediate first attempt after the
  full suite met a brief local port-4173 teardown overlap. A clean sequential
  sweep passed all 25 and is the recorded claim result.
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

No product deployment was required in verification 7: the implementation has
not changed since the deployed candidate. Fresh local production bytes still
match the live root, demo, JavaScript, and CSS. The current custom domain is
<https://silent-focus-sentinel.sociobot.in>.

- `npm run verify:live -- https://silent-focus-sentinel.sociobot.in`: six
  routes passed, `axe=0`, `storage=0`, `outsideRequests=0`.
- Factory `verify-url.sh`: HTTPS 200, title present, `lang=en`, one h1, one
  main, all image alt text present, no unlabeled buttons, and no console
  errors.
- This verification freshly matched the root and demo documents plus JavaScript
  and CSS to local production files byte for byte. Root SHA-256:
  `e3bdd49939a21e17b1fe30e7d8544d94ed79e3d27c6fffd45b23d912b83e2e22`.
- Factory `verify-url.sh`: HTTPS 200, title present, `lang=en`, one h1, one
  main, all image alt text present, no unlabeled buttons, and no console
  errors. Evidence is in `.factory/evidence/verification-7/`.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.0 s, TBT 10 ms, CLS 0, transfer 58 KiB.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo run -- demo
```

The site artifact is `dist/site/`; the CLI is
`target/release/silent-focus-sentinel`.

## Verification 7

The verifier used a fresh clone of `35fa418`, ran `npm ci && npm test`, every
literal command in `.factory/claims.json`, `npm run build`, `cargo fmt --check`,
Clippy, `cargo package --locked`, and an installed-package demo/analyze run in
a separate consumer root. The live site passed `npm run verify:live`, factory
`verify-url.sh`, fresh phone/desktop demo checks, and a Lighthouse mobile audit
at 100/100/100/100. See `.factory/verification-7.md` for the complete evidence
and the one remaining runtime-native verification step.
