# Verify silent VoiceOver focus-stop checks

## Verdict: FAIL

Verified on 2026-09-06 from a fresh clone of documentation commit
`8a5ba3d10a6c962651808ffb5bddff2f64048f50`. The product implementation under
review is `f26280e25696bbd6771a500741c1eca1b5fcca84`. Commits after the
implementation changed reports and evidence only. No deployment was needed;
all 17 deployed product files match a fresh build.

There is one high-severity finding and one untested public claim. The CLI,
package, browser demo, live site, accessibility checks, and every runnable
claim command pass. A fresh GUI macOS Simulator VoiceOver traversal is still
required, so this product cannot receive a PASS.

## First screen and sample

Fresh 390 by 844 phone and 1440 by 900 desktop browser contexts showed this
before scrolling:

- Job: “Catch silent VoiceOver focus stops.”
- Audience: “For iOS teams who need to catch missing or repeated announcements
  before release.”
- First action: “Try it with sample data.” The next text says it opens a
  finished sample report.

The same screen showed “No upload,” “Works without an account,” and “MIT
licensed.” One click opened `/demo`. The first phone screen showed the
persistent “Demo — sample data, nothing is saved” label, seven realistic
checkout stops, and two findings. Reset demo restored the sample and kept a
seeded `real:marker` value. Start for real returned to the install section. The
sample did not read or change real browser data.

Fresh captures are in `.factory/evidence/verification-7/`.

## V7-01 — High — GUI Simulator VoiceOver capture is untested at runtime

The `public-xctest-helper` claim says the runnable Simulator example observes
VoiceOver focus and emits the trace from the app process. Its declared command
passes, but that test inspects the Swift source and Xcode project. It does not
run the example in a GUI Simulator or prove that VoiceOver focused each element
and caused `SFS_VOICEOVER_STOP` output.

This verifier is Linux. Neither `xcodebuild` nor `swiftc` is available, and no
GUI iOS Simulator or VoiceOver session exists here. Prior macOS evidence proves
that the targets compile, while the last attempted hosted runtime capture
emitted no observed stops. Source checks, compile checks, and checked-in traces
support the implementation but do not replace fresh runtime evidence.

Required verification: on a GUI macOS host, open
`examples/ios/SilentFocusSentinelExample.xcodeproj`, enable Simulator
VoiceOver, traverse the checkout screen through “End capture,” save the newly
emitted JSON Lines with `record-xctest`, and analyze that trace. Re-listen and
replace both iOS evidence files when the iOS version, VoiceOver language, hint
setting, or navigation style changes.

## Declared claims

Clean clone: `/tmp/sfs-verify7-fresh-BcYZWN`. After `npm ci`, each literal
`test` value in `.factory/claims.json` ran separately. All 25 commands exited
0.

| Claim | Result and observed evidence |
| --- | --- |
| `find-empty-text` | PASS — finds `checkout.promo`. |
| `find-duplicate-text` | PASS — finds `checkout.total-value`. |
| `local-only` | PASS — writes only the requested local reports. |
| `json-html` | PASS — JSON parses and HTML is standalone. |
| `decorative-ignore` | PASS — the ignored separator produces no finding. |
| `record-command` | PASS — two JSON Lines retain order. |
| `xctest-extraction` | PASS — only marked fixture stops are extracted, in order. |
| `diff-regressions` | PASS — new and resolved findings are reported. |
| `sample-download` | PASS — the download has schema 1 and seven events. |
| `browser-demo-ready` | PASS — the phone demo is populated, labeled, isolated, and resettable. |
| `cli-demo-recording` | PASS — the checked-in recording regenerates from the release binary. |
| `open-source` | PASS — package metadata and the MIT license agree. |
| `safe-output-paths` | PASS — direct and hard-link collisions exit 2 without changing inputs. |
| `exit-codes` | PASS — normal, threshold, and invalid cases return 0, 1, and 2. |
| `failed-runner` | PASS — a failed runner leaves no trace. |
| `single-binary` | PASS — one executable and Rust 1.85 or newer are required. |
| `public-xctest-helper` | PASS as a source check; GUI runtime behavior remains untested in V7-01. |
| `no-wcag-certification` | PASS — the tool states its boundary and emits no certification result. |
| `stdout-json` | PASS — analyze and diff output parse as JSON without `--json`. |
| `demo-isolation` | PASS — project files stay unchanged and output uses a new temporary directory. |
| `accuracy-suite` | PASS — the checked-in run detects 10/10 silent observations and flags 1/20 spoken observations. |
| `accountless-run` | PASS — every command runs without credentials or a service. |
| `no-telemetry` | PASS — all subcommands made zero recorded connections. |
| `site-private` | PASS — all routes use same-origin files and empty browser storage. |
| `build-artifacts` | PASS — the release binary and routed `dist/site` output exist. |

No additional claim-like sentence on the live site or in the README lacks a
ledger entry. The one untested count is the native runtime part of
`public-xctest-helper`, not a failed shell command.

## Clean build and installed package

The following checks passed from the clean clone:

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked
```

`npm test` ran 9 Rust tests and 41 Playwright tests. The build produced
`target/release/silent-focus-sentinel` and `dist/site/`. Packaging contained 25
files, 95.0 KiB unpacked and 25.8 KiB compressed.

The packaged crate was installed into a new consumer root at
`/tmp/sfs-consumer-v7-uN8tZQ`. The installed binary printed version `0.1.0` and
help for all commands. Its demo created a new operating-system temporary
directory containing parseable JSON and standalone HTML. The report contained
seven events, six checked events, one ignored event, one empty finding, and one
duplicate finding. Installed `analyze ... --fail-on findings` returned 1 and
printed a two-finding JSON report.

Normal, invalid, boundary, and recovery cases are covered by the passing suite:
malformed input, threshold exits, failed-runner cleanup, direct and hard-link
path collisions, standard-output JSON, ignored elements, and reverse diffs.

## Live site

`npm run verify:live -- https://silent-focus-sentinel.sociobot.in` passed six
fresh routes: `/`, `/demo`, `/?demo=1`, `/privacy`, `/terms`, and an unknown
path. The unknown path deliberately returned HTTP 404 and showed the designed
recovery page. That expected 404 is not a defect.

- Each route has its own title, `lang=en`, one h1, one main landmark, ordered
  structure, and working links.
- Keyboard navigation reaches the skip link and primary action. Route changes
  focus and announce the new h1. Reset retains focus.
- Visible controls meet 44 by 44 CSS pixels. Phone and desktop layouts have no
  horizontal overflow. Reduced motion disables the trace pulse.
- Axe found zero violations on every route. The factory URL
  check found no missing image text, unlabeled buttons, or console errors.
- Fresh requests stayed on the product origin. Cookies, local storage, and
  session storage were empty in new contexts.
- Privacy and terms pages rendered and linked correctly. Security headers
  include the deployed CSP, `X-Content-Type-Options`, and `Referrer-Policy`.
- There is no service worker or offline/update claim. There is no backend,
  account, payment, API, tenant, rate limit, analytics, or persistent store, so
  those checks do not apply.

A fresh local production build matched 17 of 17 deployed files byte-for-byte.
The root SHA-256 is
`e3bdd49939a21e17b1fe30e7d8544d94ed79e3d27c6fffd45b23d912b83e2e22`.
Initial JavaScript is 13.08 KiB raw and 4.92 KiB gzip; CSS is 12.81 KiB raw and
3.69 KiB gzip.

Fresh Lighthouse 13 mobile results were Performance 100, Accessibility 100,
Best Practices 100, and SEO 100. FCP and LCP were 1.08 seconds, total blocking
time was 0 ms, CLS was 0, and transfer was 59,028 bytes.

## Earlier findings

Every earlier review and verification item was checked against current source,
tests, package behavior, and the live site.

| Earlier items | Current disposition |
| --- | --- |
| `F-1-1`, `F-1-2`, `QA-02`, `QA2-01`, `QA4-01`, `QA5-02`, `V6-01` | Partly repaired. The app observer, focus checks, app-side serialization, and Xcode project exist. Fresh GUI runtime proof remains V7-01. |
| `QA-01` | FIXED — all 25 literal claim commands pass. |
| `F-1-3`, `F-1-4`, `F-1-7`–`F-1-10`, `F-2-2`, `F-2-4`, `QA2-04` | FIXED — instructions and public promises have passing claim tests. |
| `F-1-5`, `F-2-3`, `QA-04` | FIXED — raw deep routes have specific metadata and unknown routes return HTTP 404. |
| `F-1-6`, `QA4-02`, `QA5-03` | FIXED for the stated checked-in run — separate capture and listening files produce 100% detection and 5% false positives. Fresh native collection remains part of V7-01. |
| `F-1-11`–`F-1-20`, `F-2-5`–`F-2-7` | FIXED — the copy audit, terminology, actions, deployment instructions, and 404 use plain words. |
| `F-2-1` | FIXED — the self-hosted terminal recording regenerates from the release binary. |
| `QA-03` | FIXED — touch targets and visible keyboard focus pass. |
| `QA-05` | FIXED — TypeScript checking is part of the build. |
| `QA-06` | FIXED — the emitted font is content-hashed and the deployed files match the build. |
| `QA2-02`, `QA5-01` | FIXED — direct and inode/device hard-link collisions are rejected before writes. |
| `QA2-03` | FIXED — fresh Lighthouse CLS is 0. |
| `QA2-05` | FIXED — no horizontal overflow appears at tested phone, tablet, or desktop widths. |

Verification 3’s earlier PASS was superseded by the later native-evidence
findings. All later repair evidence reproduces except the one runtime step that
this environment cannot perform.

## Required next step

Run the sample on a GUI macOS host with Simulator VoiceOver, traverse through
End capture, and analyze the newly emitted trace. Until that independent
runtime evidence exists, the verdict remains **FAIL**, with one finding and one
untested claim.
