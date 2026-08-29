# Silent Focus Sentinel repair handoff

## Status

Verification-5 blockers are repaired in implementation commit `303bd3c`.
The artifact remains a Rust CLI with a static Vite documentation site in
`dist/site/`.

## Repairs

1. Output validation now compares existing Unix device/inode identities as
   well as canonical path names. Hard-linked input/output and JSON/HTML aliases
   exit 2 before a writer opens. The release-binary reproduction preserved the
   input SHA-256 exactly:
   `3b1144bfe63a79ee84c6c90d80b7bf2a6399874783fdc0125f2cd23874d20c1b`.
2. `examples/ios/SilentFocusSentinelExample.xcodeproj` is a shared, runnable
   app/UI-test project. The test performs eight `app.swipeRight()` next-item
   gestures while VoiceOver is enabled. The app owns and retains the public
   focus observer. Reaching `checkout.capture-end` invokes app-side
   `emitCapturedTrace()` and changes the end stop to “Trace emitted”, which the
   UI test waits for.
3. The circular fixture was removed. The 30-stop app-side capture in
   `examples/evidence/ios-18.2-focus-capture.json` contains no expected labels.
   A separate verbatim listening ledger supplies the observed speech. The
   regression derives truth from empty `spokenWords`, retains the unnamed
   button's spoken role “Button”, and measures 10/10 silent stops detected
   (100%) with 1/20 spoken stops flagged (5% false positives).
4. README, demo instructions, site boundaries, claim ledger, and copy audit now
   distinguish author-provided accessibility content from VoiceOver audio.
   Rates are scoped to the checked-in evidence run.

## Verification evidence

From no-hardlinks clean clone `/tmp/sfs-repair-clean-IQDNC4`:

```sh
npm ci
npm test
npm run build
```

- `npm ci`: 25 packages, 0 vulnerabilities.
- `npm test`: 9 Rust tests and 41 Playwright tests passed.
- `npm run build`: passed and produced the release binary plus `dist/site/`.
- Every one of the 25 literal commands in `.factory/claims.json` was then run
  separately; all passed.
- Focused blocker run:
  `npm test -- --grep '@claim:(safe-output-paths|public-xctest-helper|accuracy-suite)'`
  passed all 3 selected browser/integration tests and all Rust tests.
- `cargo fmt --check`, `npm run typecheck`, and
  `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `cargo package --locked --allow-dirty` passed: 25 files, 89.4 KiB unpacked,
  24.5 KiB compressed. A clean `cargo install --locked --path` consumer run
  executed `demo` and analyzed the evidence trace successfully.
- Azure Static Web Apps local emulation passed `npm run verify:live` across six
  routes: `axe=0 storage=0 outsideRequests=0`. The factory `verify-url.sh`
  reported title, `lang=en`, one h1/main, all image alt text, no unlabeled
  buttons, and no console errors.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 939 ms, LCP 1,164 ms, TBT 40 ms, CLS 0, transfer 81,901 bytes.
- Browser coverage includes 390 px mobile, keyboard order/focus, 44 px targets,
  reduced motion, routing/404, privacy request and storage checks, demo reset,
  sample download, and console errors. No service worker exists and no offline
  or update claim is made, so PWA offline/update testing is not applicable.

## Native limitation

This worker is Linux: `xcodebuild -version` and `swiftc --version` both exit 127.
It therefore cannot compile or replay the checked-in Xcode project, enable
Simulator VoiceOver, or refresh the listening ledger. The repository test
proves the integration wiring and evidence calculation, not a fresh native run.
Run the documented `record-xctest` command on macOS/Xcode whenever the iOS or
VoiceOver version changes. UIKit does not expose VoiceOver's audio buffer.

## Deployment

`/opt/fleet/lib/deploy-static.sh silent-focus-sentinel dist/site` uploaded the
build successfully as deployment `2541c46f-eace-4f04-9bac-52b723311038` to
Azure Static Web App `sf-silent-focus-sentinel` in `centralus`. The default host
is `orange-plant-05a460110.7.azurestaticapps.net`; the custom domain returned
HTTPS 200 and remained Ready.

Post-deploy `npm run verify:live -- https://silent-focus-sentinel.sociobot.in`
passed all six routes with `axe=0 storage=0 outsideRequests=0`. The factory URL
smoke test reported no console errors and complete title/lang/h1/main/alt/button
basics. Every served file matched the local production artifact byte for byte;
the root SHA-256 on both sides was
`fe18783e377de66175b35371073e568ff3a64288bc5808a7eb7d249a549a08d5`.
`staticwebapp.config.json` is deployment configuration and is not a public
asset, so it is intentionally excluded from served-file identity.
