# Verification 7

## Verdict: FAIL — one native runtime claim remains unverified

Verified on 2026-09-06 from a fresh clone of documentation commit
`35fa41856fe9fd9851711482680d93a208fdcef6`. The last product implementation
is `f26280e25696bbd6771a500741c1eca1b5fcca84`; the later commit only recorded
verification material. The live static product still matches that implementation
candidate.

All runnable CLI, site, package, privacy, accessibility, and declared-claim
checks pass. The remaining finding is not evidence that the app-side observer
is false. It is an absence of fresh, independent GUI macOS Simulator evidence.
This Linux worker has no `xcodebuild`, `swiftc`, iOS Simulator, or GUI
VoiceOver session. It cannot honestly convert the source-level capture check
into a runtime result.

## First screen and demo

Fresh phone (390 by 844) and desktop (1440 by 900) contexts loaded the HTTPS
product cold. Before scrolling, both showed:

- Job: “Catch silent VoiceOver focus stops.”
- Audience: “For iOS teams who need to catch missing or repeated announcements
  before release.”
- First action: “Try it with sample data.”

The action opened `/demo` in one click. The first screen contained the seven
checkout stops, two findings, the persistent “Demo — sample data, nothing is
saved” label, Reset demo, Start for real, and the JSON download. Reset retained
the seeded `real:marker` key, so the sample did not alter real browser data.

## V7-01 — High — GUI Simulator VoiceOver capture still needs fresh runtime evidence

`public-xctest-helper` remains a source-level claim test. It verifies the
shipped project wiring and public UIKit/XCTest APIs, but it does not compile and
run the example in a GUI Simulator or prove that a VoiceOver cursor entered an
element and emitted `SFS_VOICEOVER_STOP` lines.

This worker checked the available runtime explicitly: neither `xcodebuild` nor
`swiftc` is installed. The product repository's macOS workflow history confirms
the distinction: run `33247123943` compiles the app and UI-test targets; the
last attempted runtime capture, run `33246793663`, failed when no observed
stops were emitted. The workflow was correctly changed to compile-only rather
than treating a scripted accessibility request as evidence.

Required external verification: on a GUI macOS host, open
`examples/ios/SilentFocusSentinelExample.xcodeproj`, enable Simulator
VoiceOver, traverse the checkout screen through “End capture,” save the
app-emitted JSON Lines with `record-xctest`, and analyze that newly written
trace. Re-listen and replace both iOS evidence files when the iOS version,
VoiceOver language, hint setting, or navigation style changes.

No code change in this worker can truthfully manufacture that missing runtime
observation. The app code, project, prior macOS compile, checked-in accuracy
evidence, and static claim test are supporting evidence only, not a substitute
for the required GUI run.

## Clean checkout and claims

Clean checkout: `/tmp/sfs-repair6-clean-03r4Uj`.

```sh
npm ci
npm test
npm run build
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked
```

All commands passed. `npm test` ran 9 Rust tests and 41 Playwright tests.
Every literal test command in `.factory/claims.json` then ran separately after
the clean install: all 25 passed. The first immediate post-suite attempt met a
brief port-4173 teardown overlap; rerunning the claim sweep from the same clean
installation, without a preceding suite, passed all 25 sequential commands.
That transient runner teardown is not a product or claim failure.

The passed claim outcomes include: the empty and duplicate checkout findings;
ignored decorative elements; JSON and standalone HTML reports; ordered JSON
Lines; new and resolved diffs; download/reset demo isolation; collision and
hard-link protection; documented exit codes; failed-runner recovery; no
credentials, telemetry, or browser storage; and the stated 30-stop evidence
calculation (10/10 silent observations, one false positive among 20 spoken
observations).

## Packaged consumer

`cargo package --locked` produced the package. It was installed from
`target/package/silent-focus-sentinel-0.1.0` into a new consumer root. The
installed binary printed version `0.1.0`, ran `demo`, wrote parseable local JSON
and HTML beneath a new operating-system temporary directory, and returned exit
1 for `analyze examples/sample-trace.json --fail-on findings`. The demo report
contained seven events, one empty finding, and one duplicate finding.

## Live product

`npm run verify:live -- https://silent-focus-sentinel.sociobot.in` passed all
six routes: `axe=0`, no browser storage, and no outside requests. The expected
unknown route returned HTTP 404 with the designed recovery page.

The factory verifier also passed at HTTPS root: title, `lang=en`, one `h1`, one
`main`, image alternatives, labeled buttons, and zero console errors. Its fresh
phone and desktop screenshots and machine-readable result are in
`.factory/evidence/verification-7/`.

Fresh local production output matches live bytes for the root, demo document,
JavaScript, and CSS. Root SHA-256 is
`e3bdd49939a21e17b1fe30e7d8544d94ed79e3d27c6fffd45b23d912b83e2e22`.

Lighthouse 13 mobile retry completed normally with Performance 100,
Accessibility 100, Best Practices 100, and SEO 100. It measured FCP 0.9 s,
LCP 1.0 s, CLS 0, TBT 10 ms, and 58 KiB transferred.

The static product has no backend, account, payment, service worker, API,
analytics, or persistent store. Backend health/restart/tenant/429 and PWA
offline-update checks therefore do not apply.

## Earlier findings

The prior fixes remain in place: report hard-link collisions are rejected,
demo isolation and recorded CLI output are tested, deep routes have their own
metadata and real 404 status, copy and accessibility checks pass, and the
separate 30-stop capture/listening-ledger calculation is unchanged. The sole
unresolved item remains the native GUI runtime evidence described in V7-01.
