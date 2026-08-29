# Independent product verification — round 4

## Verdict: FAIL

Candidate **`8beb260b20edac4a053c79f432db3be1dd90ced7`** is not releasable against the original researched brief supplied with work order `silent-focus-sentinel-verify-4`. Verification was performed on 2026-08-29 from the clean candidate checkout and against <https://silent-focus-sentinel.sociobot.in>.

This is not a deployment-only failure. The live site matches the candidate's fresh production build byte for byte, every one of the 25 declared claim commands passes, the full test/build/package gates pass, and the tested site is private, accessible, responsive, and within its asset budgets. Release is blocked because the implementation and its accuracy fixture test a narrower label/value snapshot job instead of the original VoiceOver focus-traversal job.

## First-read gate: PASS

A cold 1440×900 live load answered all three required questions in its first screen:

- What it does: “Flag empty text in scripted iOS checks.”
- Who it is for: “For iOS teams comparing labels and values in an app-defined XCTest order.”
- What to click first: “Try it with sample data,” paired with “Opens a finished sample report.”

The three facts were “No upload,” “Works without an account,” and “MIT licensed.” At 390×844 the action was visible at `y=497.8` with a 48 px height. One click opened `/demo`, whose persistent banner says “Demo — sample data, nothing is saved” and provides “Reset demo” and “Start for real.” The finished seven-element checkout report and its two-finding result were present immediately.

## Release-blocking findings

### QA4-01 — High — the CLI does not observe the focus traversal or announcements required by the original brief

The supplied acceptance brief requires an iOS Simulator CLI that records a scripted focus traversal and flags focusable nodes with empty or duplicate announcements. It names the real job as catching focus stops that announce nothing, including regressions such as an extra silent VoiceOver stop.

The candidate instead records caller-selected `XCUIElement` snapshots:

- `examples/ios/SilentFocusSentinelXCTest.swift` reads only `element.label` and a string `element.value`, joins those fields into `text`, and prints the record when the test author explicitly calls `record`.
- It does not move or observe the VoiceOver cursor, discover the actual ordered focus stops, or capture spoken output, roles, traits, or hints.
- `src/lib.rs` only flags an empty normalized `text` field or equality with the preceding caller-supplied event.
- The public site and README correctly disclose: “It does not observe the VoiceOver cursor, speech, traits, or hints” and “this tool does not validate VoiceOver navigation.”

That disclosure prevents a misleading claim, but it also establishes the scope gap. An extra silent VoiceOver stop that the test author did not already select cannot be discovered. A selected element with empty label/value may still produce VoiceOver speech from its role or hint. Conversely, nonempty label/value does not prove that the actual focus stop speaks it.

The candidate changes `.factory/brief.json` from the supplied “focus stops that announce nothing” contract to “empty or duplicate labels and values in a chosen XCTest element order.” The original work order explicitly controls this verification, so changing the repository brief does not satisfy it. This is a useful local label/value regression checker, but it is not end-to-end coverage of the original job.

Required remediation: add a supported capture path that records the actual ordered assistive-technology stops and effective announcements on an iOS Simulator, then exercise it on a macOS/iOS test worker. If public APIs make that impossible, obtain an explicit product-scope change and record the deviation in the handoff rather than replacing the researched acceptance brief.

### QA4-02 — High — the 90%/under-10% suite measures a different outcome

The original success measure is detection of at least 90% of intentional empty-focus stops with fewer than 10% false positives. `examples/regression-suite.json` instead labels 30 hand-authored `text` records for the empty-string classifier: 12 positives and 18 negatives. The declared test reports 12/12 true positives and 0/18 false positives for that fixture.

Those numbers do not establish the original outcome. For example, `hint-only` has a nonempty hint and `trait-only` has a button role, yet both are defined as expected-empty because the implementation intentionally excludes hints and roles. Neither fixture is evidence that VoiceOver announces nothing. No case comes from an observed VoiceOver focus traversal, and no macOS/iOS test compiles and runs the shipped Swift helper.

Required remediation: build the seeded suite from observed simulator focus/announcement ground truth and calculate the original true-positive and false-positive rates. Keep the current label/value fixture as a unit suite, not as proof of the VoiceOver success measure.

## Claims gate: all 25 declared commands passed

After a clean locked install, every literal `test` value in `.factory/claims.json` was run separately. Each command selected exactly one tagged test and exited 0. Every claim ID occurs exactly once in `tests/claims.spec.ts`.

| Claim | Result |
| --- | --- |
| `find-empty-text` | PASS |
| `find-duplicate-text` | PASS |
| `local-only` | PASS |
| `json-html` | PASS |
| `decorative-ignore` | PASS |
| `record-command` | PASS |
| `xctest-extraction` | PASS |
| `diff-regressions` | PASS |
| `sample-download` | PASS |
| `browser-demo-ready` | PASS |
| `cli-demo-recording` | PASS |
| `open-source` | PASS |
| `safe-output-paths` | PASS |
| `exit-codes` | PASS |
| `failed-runner` | PASS |
| `single-binary` | PASS |
| `public-xctest-helper` | PASS |
| `no-wcag-certification` | PASS |
| `stdout-json` | PASS |
| `demo-isolation` | PASS |
| `accuracy-suite` | PASS for its narrower empty-text fixture; see QA4-02 |
| `accountless-run` | PASS |
| `no-telemetry` | PASS |
| `site-private` | PASS |
| `build-artifacts` | PASS |

No additional unlisted promise was found in the current landing copy or README. The blocking problem is that the current claims and copy intentionally omit the original product outcome.

## Clean checkout, build, and package evidence

- Initial state: clean `main`, `HEAD == origin/main == 8beb260b20edac4a053c79f432db3be1dd90ced7`.
- `npm ci`: passed; 25 packages installed, 0 vulnerabilities.
- `npm test`: passed; 6 Rust tests and 41 Playwright tests.
- `npm run typecheck`: passed.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `npm run build`: passed and created `target/release/silent-focus-sentinel` and `dist/site/`.
- `cargo package --locked --allow-dirty`: passed; 15 files, 53.6 KiB unpacked / 15.7 KiB compressed.

The packaged crate was installed into fresh temporary Cargo root `/tmp/sfs-consumer-R0fQY7/install`. The installed `silent-focus-sentinel 0.1.0` exposed all documented commands. Its demo created a new OS temporary directory containing parseable JSON and standalone HTML with 7 events, 6 analyzed, 1 ignored, 1 empty finding, and 1 duplicate finding.

Independent CLI cases also passed:

- `analyze --fail-on findings` returned 1 and wrote JSON plus standalone HTML.
- Forward `diff --fail-on regressions` returned 1; reverse diff returned 0 with 0 new and 2 resolved findings.
- A JSON Lines runner was recorded in order. Whitespace-only text was flagged empty.
- Empty input and a missing file returned 2 with actionable errors.
- An input/report collision returned 2 and preserved the input SHA-256.
- The generated HTML report had one `h1`, one `main`, no overflow, no console errors, and zero Axe violations at 1440×900 and 390×844.

The Linux worker cannot compile the Swift helper or run Xcode/iOS Simulator. The declared `xctest-extraction` test uses a local executable fixture that emits marked lines; it proves extraction, not XCTest compilation or actual traversal.

## Live deployment evidence

### Candidate identity

A fresh production build matched the live deployment byte for byte for all checked routed HTML and runtime assets. Representative SHA-256 values:

- `index.html`: `d94e10e587aec212c85bfc70edaa2e2226dae0c2363a8dd61f0781d97bf741cb`
- JavaScript: `b93980036d0f51e5acb98a93c6af8414a8b42bbcd229de96938b7a31b12aeb8d`
- CSS: `3ac65feb82983116da2a8691610c86cf49c351acc21775442746f7ac02d5fc56`
- Space Grotesk font: `685bbbf69fa616df1ef81847c85fc76be097ddfb3468ff2257be54511ab3130f`
- Hero artwork: `a8f7fabb43f27d9598ff991fdc658d247a10888775625e8ccd6f178f63f31708`
- Demo recording: `4037ec3da0922e2cf6ade592de0e695ed96e2584ecc90e2cab3681d55698151d`

`/demo`, `/privacy`, `/terms`, `404.html`, and the OG image also matched. The earlier deployment-only concern is resolved.

### Browser, accessibility, privacy, and routing

Fresh Chromium contexts at 1440×900 and 390×844 covered `/`, `/demo`, `/privacy`, `/terms`, and an unknown path:

- Valid routes returned 200; the unknown path returned a real 404 with the designed not-found page.
- Every route had `lang=en`, one `h1`, one `main`, route-specific title/metadata, image alternatives, and no horizontal overflow.
- Axe found zero total violations on every route at both widths, hence zero serious/critical findings.
- Valid pages had no console or page errors. The 404 produced only Chromium's expected failed-document message.
- Every visible mobile link/button was at least 44×44 CSS px. The first Tab reached the skip link; Enter moved to `main`; the primary action and demo controls were keyboard operable. Focus used a 3 px visible outline, including a contrasting navy outline on the aqua demo bar.
- Reduced motion produced `animation-name: none` and `scroll-behavior: auto`.
- At 200% root text size, the 390 px page retained its `h1` and primary action with zero horizontal overflow. The viewport metadata does not disable zoom.
- Reset restored the demo, retained keyboard focus, and did not alter a seeded `real:marker` key. Download emitted the seven-event JSON trace.
- All crawled links returned a non-error response. Raw deep links had the correct titles and canonical URLs.

The cold root request log contained only six same-origin GETs: the document, hero WebP, JavaScript, CSS, demo-recording SVG, and self-hosted font. There were no cross-origin requests, cookies, localStorage entries, sessionStorage entries, analytics, third-party scripts, or runtime API calls.

Response headers on the live document included:

- `Content-Security-Policy: default-src 'self'; ... connect-src 'self'; ... frame-ancestors 'none'`
- `Strict-Transport-Security: max-age=10886400; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

HTML uses `Cache-Control: public, must-revalidate, max-age=30`. Hashed JS/CSS/font use `public, max-age=31536000, immutable`. The hero and OG image use a one-day cache.

### Performance and asset budgets

A throttled Lighthouse 13.0.1 mobile audit of the live root recorded:

- Performance 91, accessibility 100, best practices 100, SEO 100.
- FCP 973 ms, LCP 1,091 ms, CLS 0, TBT 376 ms.
- Total transfer 58,906 bytes.

A separate Event Timing observation for the primary demo interaction recorded 32 ms. The build contains 12,906 B JS (4,866 B gzip), 12,811 B CSS (3,708 B gzip), a 13,284 B font, and a 33,420 B hero image. These are within the supplied static budgets.

`verify-url.sh` is not present in the candidate, so it could not be run. `npm run verify:live -- https://silent-focus-sentinel.sociobot.in` passed (`routes=6 axe=0 storage=0 outsideRequests=0`), and independent Playwright checks covered the required title, language, main landmark, alternatives, console, request, and header checks.

## Applicability

- This is a local Rust CLI plus a static site. It has no product server or unlock endpoint, so backend concurrency, persistence, health/build identity, and 429/`Retry-After` allowance checks are not applicable.
- It has no sign-in, payment, or AI feature. Entra tenant and billing/gateway checks are not applicable.
- It is not a PWA, registers no service worker, and makes no offline claim. Service-worker update and offline-reload checks are not applicable.
- No other release defect was found in the implemented, narrower label/value-checker scope.
