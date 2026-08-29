# Independent product verification — round 5

## Verdict: FAIL

Candidate **`f604a770b88217ca575442936c9f398d6b8ad0fd`** is not releasable against the original researched brief and work order `silent-focus-sentinel-verify-5`. Verification ran on 2026-08-29 from the candidate checkout and against <https://silent-focus-sentinel.sociobot.in>.

This is not a deployment-only failure. The live site matches a fresh production build byte for byte, all 25 declared claim commands pass after the locked dependency install, and the site passes the tested accessibility, privacy, routing, and performance checks. Release is blocked by a reproducible destructive filesystem-alias case and by an iOS capture/accuracy path that still does not provide reproducible end-to-end evidence for the original VoiceOver job.

## First-read gate: PASS

A cold 390×844 live load answers the required questions in its first screen:

- What: **“Catch silent VoiceOver focus stops.”**
- For whom: **“For iOS teams who need to catch missing or repeated announcements before release.”**
- First click: **“Try it with sample data,”** paired with **“Opens a finished sample report.”**

The same screen gives the facts “No upload,” “Works without an account,” and “MIT licensed.” One click opens `/demo`. Its persistent banner says “Demo — sample data, nothing is saved” and provides working “Reset demo” and “Start for real” controls. The first mobile demo screen already shows seven checkout stops and two findings. Download produced a seven-event `voiceover_simulator` JSON trace; reset restored the sample and retained keyboard focus.

## Release-blocking findings

### QA5-01 — High — a hard-linked report path destroys the input trace

The public contract says every report path collision is rejected before writing. `path_identity` compares canonical path strings, not filesystem object identity. Two hard-link names for the same inode therefore bypass the check.

Fresh reproduction with the release binary:

```sh
cp examples/sample-trace.json "$tmp/input.json"
ln "$tmp/input.json" "$tmp/report.json"
target/release/silent-focus-sentinel analyze \
  "$tmp/input.json" --json "$tmp/report.json"
```

Observed evidence:

```text
hardlink_collision_exit=0
before_sha=3b1144bfe63a79ee84c6c90d80b7bf2a6399874783fdc0125f2cd23874d20c1b
after_sha=6bebaf5dee311c8fbcee2c084ac5bddebce16a748b3581f8a30a45c17fe77bb2
input_size_after=777
stderr=
```

The input is silently replaced with the report. This contradicts `@claim:safe-output-paths`; that declared test passes only because it covers identical path strings, not hard links. Required remediation: compare existing input/output inode and device identity before any write on Unix, retain the canonical-path check for not-yet-created paths, add the hard-link case to the claim test, and verify the input hash is unchanged.

### QA5-02 — High — the shipped Simulator example does not run or finish a focus traversal

The original brief requires the smallest useful product to record a scripted Simulator focus traversal. The new app-target observer is a plausible capture component, but the shipped integration is still instructions plus placeholders rather than an executable example:

- `examples/ios/CheckoutFocusTraversalTests.swift` launches the app and waits for one button. It performs no VoiceOver next-item gestures.
- It never calls `emitCapturedTrace()` and cannot call the app-process object directly from the UI-test process.
- No shipped app lifecycle integration owns the capture object, calls `start()`, receives a completion signal, or emits the trace. Repository search finds `capture.start()` and `emitCapturedTrace()` only in comments/site copy and in the helper method declaration.
- Following the linked example therefore gives `record-xctest` no `SFS_VOICEOVER_STOP:` lines; the CLI's own error path confirms that such a run exits 2.
- `@claim:xctest-extraction` substitutes a shell script named `xcodebuild` that prints two pre-authored marker lines. `@claim:public-xctest-helper` checks source substrings. Neither runs the integration described to users.

This Linux worker has no `xcodebuild` or `swiftc`, so native compilation could not be added as fresh positive evidence. The blocker is not merely that worker limitation: the repository's advertised example omits the actions and cross-process completion mechanism needed to produce a trace at all. Required remediation: ship a small runnable sample app/UI-test integration that starts and retains the observer, performs a deterministic traversal, triggers app-side emission, and is exercised on a macOS Simulator worker through the real `record-xctest` command.

### QA5-03 — High — the 90% accuracy claim is circular and does not measure VoiceOver silence

The original success measure is detection of actual silent VoiceOver focus stops. The helper does not observe spoken output. It constructs `announcement` by concatenating `accessibilityLabel`, `accessibilityValue`, and `accessibilityHint`. VoiceOver also speaks state/trait/role information, and hint speech depends on user settings. The committed “observed” fixture labels empty buttons, links, images, switches, and other controls as silent while omitting that spoken role/state output.

`@claim:accuracy-suite` does not independently establish ground truth. It trusts the fixture's literal `capture.voiceOver: true`, treats the fixture's `groundTruth.silentIds` as truth, then checks that the analyzer flags the same blank `announcement` strings. There is no generated capture log, simulator configuration, audio/transcript, native test result, or provenance tying those 30 JSON records to a real traversal. The reported 12/12 true positives and 0/18 false positives therefore measure an empty-string classifier against labels created for that classifier, not the user outcome in the brief.

Required remediation: collect and version reproducible Simulator traversal evidence with independently reviewed VoiceOver speech/silence ground truth. Calculate the rate against that evidence, include role/state speech or narrow the claim to unnamed label/value/hint content, and do not call the derived property string a captured announcement.

## Claims gate

`.factory/claims.json` exists with 25 entries. Per the work-order sequence, the first literal command was attempted before dependency installation and exited 127 at `tsc: not found`. After the required clean `npm ci`, every literal command was run separately and exited 0:

| Claim IDs | Installed result |
| --- | --- |
| `find-empty-text`, `find-duplicate-text`, `local-only`, `json-html`, `decorative-ignore` | PASS |
| `record-command`, `xctest-extraction`, `diff-regressions`, `sample-download`, `browser-demo-ready` | PASS |
| `cli-demo-recording`, `open-source`, `safe-output-paths`, `exit-codes`, `failed-runner` | PASS |
| `single-binary`, `public-xctest-helper`, `no-wcag-certification`, `stdout-json`, `demo-isolation` | PASS |
| `accuracy-suite`, `accountless-run`, `no-telemetry`, `site-private`, `build-artifacts` | PASS |

The untouched-clone failure is recorded because the acceptance contract explicitly requested claims before anything else. More importantly, QA5-01 and QA5-03 show that two passing tests do not prove their actual promises. No additional unlisted landing-page or README promise was found beyond the claim families already present.

## Local build, package, and CLI evidence

All normal installed-environment gates passed:

```text
npm ci                                      PASS; 0 vulnerabilities
npm test                                    PASS; 8 Rust + 41 Playwright tests
npm run typecheck                           PASS
cargo fmt --check                           PASS
cargo clippy --all-targets --all-features -- -D warnings
                                              PASS
npm run build                               PASS
cargo package --locked --allow-dirty        PASS; 18 files, 67.7 KiB unpacked, 19.0 KiB compressed
```

`npm run build` produced `target/release/silent-focus-sentinel` and `dist/site/`. The site bundle is far inside budget: JavaScript 12,978 bytes raw / 4,896 bytes gzip, CSS 12,811 / 3,708 bytes gzip, font 13,284 bytes, and hero WebP 33,420 bytes.

The packaged crate was extracted and installed into a new `/tmp/sfs-consumer-*` Cargo root. Its public `--help`, `demo`, and `analyze` commands worked. The demo wrote JSON and standalone HTML under a new OS temporary directory. The sample result was 7 events, 6 analyzed, 1 ignored, 1 silent, and 1 duplicate. The standalone report had `lang=en`, one `h1`, one `main`, no mobile overflow, no console errors, and no serious/critical axe findings.

Independent recovery/boundary checks passed apart from QA5-01: malformed JSON exited 2 with a corrective message; `--fail-on findings` exited 1 for the sample and 0 for the clean baseline; same-string report collisions were rejected; failed runners left no output; JSON and HTML outputs parsed successfully.

## Live deployment, privacy, accessibility, and performance

Fresh SHA-256 comparisons matched the production build byte for byte for root, demo, privacy, terms, 404, JavaScript, CSS, font, icons, terminal recording, hero art, OG art, robots, and sitemap. The live deployment therefore matches candidate `f604a770...`'s static artifact.

- `npm run verify:live -- https://silent-focus-sentinel.sociobot.in`: PASS across six routes; correct 200/404 statuses; zero serious/critical axe violations; zero external requests; zero cookies/local/session storage; zero unexpected console/page errors.
- Manual 1440×900 and 390×844 flows: no horizontal overflow; at mobile width all visible controls were at least 44×44 CSS px; the home keyboard order reached every tested control with a 3 px visible outline; route headings focused after navigation; reset retained focus; and 200% text enlargement retained the heading/action without horizontal overflow.
- Reduced motion: the trace animation reports `animation-name: none` and `transition-duration: 0s`.
- Privacy request log for the complete home-to-demo/download/reset flow contained only the product origin. No analytics, third-party scripts/fonts, cookies, or storage were observed.
- Response headers include HSTS, CSP with `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial. HTML uses `max-age=30` and returns 304 for its ETag; hashed JS/CSS/font assets use one-year immutable caching; the hero image uses one-day caching.
- Successful Lighthouse 13 mobile run: Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP/LCP 1,054 ms, TBT 155.5 ms, CLS 0, total transfer 58,873 bytes. A measured demo reset interaction was 24 ms.
- The site has no service worker, backend, sign-in, payment, product-unlock call, or server-side product endpoint. Offline/PWA, Entra, persistence/concurrency, and API rate-limit allowance checks are not applicable.

## Final decision

**FAIL.** Do not release this candidate. The live deployment is healthy and current, but it does not override the local data-loss defect or supply credible end-to-end evidence for the original Simulator VoiceOver traversal and accuracy contract.
