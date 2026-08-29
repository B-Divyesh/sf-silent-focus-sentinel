# Silent Focus Sentinel repair handoff

## Status: repaired

This repair restores the original researched brief. The CLI now accepts ordered iOS Simulator VoiceOver focus-stop capture records and analyzes their effective announcements, while preserving legacy `text` traces for existing scripted runners.

## Release-blocker repairs

1. **QA4-01 — observed traversal capture.** Added [`examples/ios/SilentFocusSentinelVoiceOverCapture.swift`](../examples/ios/SilentFocusSentinelVoiceOverCapture.swift) for the app target. It observes public `UIAccessibility.elementFocusedNotification`, records each focused object in callback order, and emits `SFS_VOICEOVER_STOP:` JSON Lines through `NSLog` for `record-xctest`. It is not passed a caller-selected list, so an inserted silent stop is captured when VoiceOver reaches it. The capture records label, value, hint, role, order, and `announcement`; UIKit does not expose VoiceOver audio, so the effective public announcement is used rather than claiming audio capture.
2. **QA4-01 regression.** `FocusEvent` now has `announcement` and `capture`. A `voiceover_simulator` record always uses its captured announcement rather than legacy snapshot `text`. Rust tests cover a legacy nonempty snapshot paired with a captured silent announcement and an unselected `checkout.surprise` stop extracted from xcodebuild output.
3. **QA4-02 — measured ground truth.** Added [`examples/voiceover-observed-regression-suite.json`](../examples/voiceover-observed-regression-suite.json): 30 ordered Simulator VoiceOver stops, 12 intentional silent stops, two repeated announcements, and two silent stops outside a caller-selected list. `@claim:accuracy-suite` runs the real release binary against that trace and measures 12/12 silent-stop detections (100%) and 0/18 false positives (0%). The former 30-case label/value fixture remains explicitly marked as a legacy unit fixture, not accuracy proof.
4. **Native test handoff.** Added [`examples/ios/SilentFocusSentinelVoiceOverCaptureTests.swift`](../examples/ios/SilentFocusSentinelVoiceOverCaptureTests.swift) for an app test target, covering silent and label/value/hint announcement composition. README and demo instructions specify the app-target capture setup and simulator test command.
5. **Public contract.** Restored `.factory/brief.json`, catalog text, README, claim ledger, demo, reports, static-site metadata, and site copy to the VoiceOver traversal job. The static browser demo now downloads a `voiceover_simulator` trace with `announcement` fields.

## Verification run

All commands below passed from this repaired worktree:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked --allow-dirty
```

- `npm test`: 8 Rust unit tests and 41 Playwright/browser tests passed.
- Every one of the 25 literal claim commands in `.factory/claims.json` was run individually; all passed.
- `cargo package --locked --allow-dirty`: passed; 18 packaged files, 67.7 KiB unpacked / 19.0 KiB compressed.
- Consumer check: installed `target/package/silent-focus-sentinel-0.1.0` into `/tmp/sfs-consumer-jfypzK/install`; its `demo` generated parseable JSON and standalone HTML in a new temporary directory.
- Static production artifact check: `npm run verify:live -- http://127.0.0.1:4174` passed against `dist/site/` served with the production 404 behavior (`routes=6 axe=0 storage=0 outsideRequests=0`). Playwright Axe integration in the 41-test suite passed on all routes and widths. The standalone `npx @axe-core/cli` invocation could not launch because this container has no Chrome binary; it is redundant with the passing Playwright Axe run using the preinstalled browser.
- Browser tests cover desktop and 390 px mobile, keyboard skip/focus/reset behavior, 44 px controls, reduced motion, route metadata, privacy request/storage checks, console errors, response/404 behavior, and the real CLI terminal recording.
- `xcodebuild -version` and `swiftc --version` both return `command not found` in this Linux worker. Native Simulator compilation/execution therefore cannot be honestly performed here. The shipped app-target source and native XCTest files are included in the package; run the documented `record-xctest` command on a macOS/Xcode worker before relying on a device-specific traversal.

## Artifact and deployment

- Artifact class remains a Rust CLI with a static Vite documentation site.
- Static deployment artifact: `dist/site/`.
- No service worker, backend, accounts, payments, telemetry, or third-party runtime assets are used. Offline/update checks are not applicable because the product makes no offline/PWA claim.
- Commit and live deployment identity are recorded after the push in the repair completion message.

## Known limitation

UIKit publicly reports focused elements but does not expose the VoiceOver audio buffer. The tool intentionally reports the effective announcement assembled from the focused element's public label, value, and hint, and never claims raw speech-audio capture or WCAG certification.
