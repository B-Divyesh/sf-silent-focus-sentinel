# Verify silent VoiceOver focus-stop checks

## Verdict: FAIL

Candidate `f26280e25696bbd6771a500741c1eca1b5fcca84` was checked on 2026-09-05 from a fresh clone and at <https://silent-focus-sentinel.sociobot.in>. The implementation and documentation SHA are both `f26280e25696bbd6771a500741c1eca1b5fcca84`.

There is one high-severity finding and one untested public claim. Do not mark this release as a product PASS yet. The CLI, its local reports, all 25 declared claim commands, the installed package, and the live static site otherwise passed the checks below.

## First screen

Fresh desktop (1440 by 900) and phone (390 by 844) browser contexts showed the required information before scrolling:

- Job: “Catch silent VoiceOver focus stops.”
- Audience: “For iOS teams who need to catch missing or repeated announcements before release.”
- First action: “Try it with sample data”; the adjacent text says it opens a finished sample report.

The three facts were “No upload,” “Works without an account,” and “MIT licensed.” One click opened `/demo`. It immediately showed the seven-stop checkout report and two findings. Its persistent “Demo — sample data, nothing is saved” label, Reset demo, Start for real, JSON download, and reset all worked. Reset preserved a seeded `real:marker` browser-storage key; the demo did not change real data.

## Finding

### V6-01 — High — real GUI VoiceOver capture is not freshly verified

The public `public-xctest-helper` claim says the runnable Simulator example observes VoiceOver focus and emits app-side. Its declared test passed, but it only inspects Swift/Xcode source strings. The Linux verifier has no Xcode, iOS Simulator, or GUI VoiceOver session. The documented macOS workflow compiles the targets, but compile success does not demonstrate a fresh focus callback, traversal, or emitted trace.

This is an untested public runtime claim, not evidence that the current source is false. The source, its tests, the checked-in 30-stop evidence, and the prior macOS compile workflow support the intended design. A GUI macOS verification must still enable Simulator VoiceOver, traverse the example through End capture, save the app-emitted JSON Lines, and analyze that fresh trace. Until then, the real end-to-end capture part of the product is not independently proven for this candidate.

## Claim commands

From fresh clone `/tmp/sfs-verify6-clean-qfbotA`, after `npm ci`, every literal `test` command in `.factory/claims.json` was run separately. All 25 exited 0. The initial `npm test` attempt briefly found no `tsc` after the first install, but a second fresh clone using the same literal `npm ci` installed `tsc` and completed all 41 Playwright tests; the first result was not reproducible.

| Claim | Result and observable evidence |
| --- | --- |
| `find-empty-text` | PASS — finds `checkout.promo`. |
| `find-duplicate-text` | PASS — finds `checkout.total-value`. |
| `local-only` | PASS — requested reports are the only local outputs. |
| `json-html` | PASS — JSON parses and HTML is standalone. |
| `decorative-ignore` | PASS — the ignored separator has no finding. |
| `record-command` | PASS — two JSON Lines retain order. |
| `xctest-extraction` | PASS — marked fixture lines are extracted in order. |
| `diff-regressions` | PASS — forward new and reverse resolved findings work. |
| `sample-download` | PASS — downloaded trace has schema 1 and seven elements. |
| `browser-demo-ready` | PASS — phone demo opens finished, labels itself, resets, and preserves real storage. |
| `cli-demo-recording` | PASS — checked-in SVG regenerates from the release binary. |
| `open-source` | PASS — Cargo metadata and full MIT text agree. |
| `safe-output-paths` | PASS — path and hard-link collisions exit 2 with unchanged bytes. |
| `exit-codes` | PASS — normal, threshold, and malformed paths return 0, 1, and 2. |
| `failed-runner` | PASS — failed runner leaves no trace. |
| `single-binary` | PASS — one executable and Rust 1.85 requirement. |
| `public-xctest-helper` | PASS as a source check; runtime remains untested in V6-01. |
| `no-wcag-certification` | PASS — reports and public boundary do not claim certification. |
| `stdout-json` | PASS — analyze and diff stdout parse as JSON. |
| `demo-isolation` | PASS — project remains unchanged; output is under a new OS temporary directory. |
| `accuracy-suite` | PASS — checked-in run measures 10/10 detected silent observations and 1/20 false positives (100% and 5%). |
| `accountless-run` | PASS — every command works without credentials or a service. |
| `no-telemetry` | PASS — every CLI subcommand made zero proxy connections. |
| `site-private` | PASS — all routes use same-origin files and empty browser storage. |
| `build-artifacts` | PASS — binary and routed `dist/site` output exist. |

## Build and installed CLI

- Fresh reproducible command: `npm ci && npm test` passed on the second clean clone: 9 Rust tests and 41 Playwright tests.
- `npm run build`, `npm run typecheck`, `cargo fmt --check`, and `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `cargo package --locked` passed: 25 files, 95.0 KiB unpacked and 25.8 KiB compressed.
- The packaged crate was installed in a new consumer Cargo root. `--version`, `demo`, and `analyze` worked. The installed demo wrote parseable JSON and HTML only below a fresh `/tmp/silent-focus-sentinel-demo-*` directory. Installed sample analysis reported 7 events, 6 checked, 1 ignored, 1 empty finding, and 1 duplicate finding; `--fail-on findings` returned 1.
- Normal, invalid, boundary, and recovery behavior is covered by the exact claims: malformed input, threshold exits, failed runner cleanup, output/report collision rejection, hard-link collision rejection, stdout JSON, and reverse diffs all passed.

## Live site

`npm run verify:live -- https://silent-focus-sentinel.sociobot.in` passed: six routes, zero serious or critical Axe findings, no browser storage, and no outside requests. The verifier exercised `/`, `/demo`, `/?demo=1`, `/privacy`, `/terms`, and a missing URL. The missing URL deliberately returned HTTP 404 and rendered the designed recovery page.

- Every checked route has `lang=en`, one h1, one main landmark, its route-specific title, deep-link metadata, and no unexpected console/page errors.
- Keyboard skip navigation, demo entry, reset focus retention, download, route heading focus, copy fallback, and links worked. Controls met the 44 px target. At 390 px and 1440 px there was no horizontal overflow. Reduced motion disables the focus pulse.
- The request log contained only product-origin files. Cookies, localStorage, and sessionStorage were empty in fresh route contexts. The CSP restricts connections to self; no analytics, third-party scripts, fonts, or runtime API calls were present.
- A clean production build matched 17 of 17 deployed public files byte-for-byte. `staticwebapp.config.json` is intentionally deployment configuration and returns 404 when requested as a public asset.
- Lighthouse 13 mobile measured Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP and LCP were 1.1 s, CLS 0, TBT 40 ms, and total transfer 58 KiB.

Offline/update, backend health/restart/persistence, tenant isolation, and rate-limit checks are not applicable: this is an accountless local CLI plus static site, with no service worker, API, backend, payment, or data store.

## Earlier findings

All earlier report items were checked. The table records their present disposition.

| Earlier items | Disposition and current evidence |
| --- | --- |
| `F-1-1`, `F-1-2`, `QA4-01`, `QA5-02` | Partly repaired: source now has an app observer, app-side serialization, focus callback checks, and a compiling Xcode project. Fresh GUI traversal proof remains V6-01. |
| `F-1-3`, `F-1-4`, `F-1-7`–`F-1-10`, `F-2-2`, `F-2-4`, `QA2-04` | FIXED — README/public promises are represented by passing claim tests. |
| `F-1-5`, `F-2-3`, `QA4-05` | FIXED — raw deep routes have route-specific metadata and missing pages return HTTP 404. |
| `F-1-6`, `QA4-02`, `QA5-03` | FIXED for the stated checked-in evidence run — separate 30-stop capture and listening ledger calculate 100% detection and 5% false positives. Fresh native collection remains required under V6-01. |
| `F-1-11`–`F-1-20`, `F-2-5`–`F-2-7` | FIXED — copy audit is within the word and terminology rules; the landing, README, buttons, deployment text, and 404 are plain and specific. |
| `F-2-1` | FIXED — landing recording is regenerated from the release binary and its claim passes. |
| `QA2-02`, `QA5-01` | FIXED — direct and inode/device hard-link collisions return 2 before writing and preserve hashes. |
| `QA2-03`, `QA2-05` | FIXED — Lighthouse CLS is 0 and desktop/mobile have no horizontal overflow. |

## Required next step

Run the documented example on a GUI macOS host with Simulator VoiceOver enabled. Save and analyze a newly app-emitted trace from a real traversal through End capture, then add that evidence to a subsequent verification report. No product-code repair is requested by this report.
