# Independent product verification — round 2

## Verdict: FAIL

Candidate `d706aa9cf72f48fca9ac713b991866eb01fe1dbb` is not releasable against the supplied brief and work order. Verification was performed on 2026-08-29 from the clean `main` checkout and against `https://silent-focus-sentinel.sociobot.in`.

This is not a deployment-only failure. The live static files match the candidate build byte for byte, all ten declared claim commands pass after the locked install, and the site is accessible and private in the tested flows. Release is blocked by the incomplete real XCTest capture path, a reproducible destructive output-path case, an explicit CLS budget miss, and unlisted public claims.

## Mandatory first-read gate

**PASS.** A cold 1440×900 live load immediately showed:

- What: “Catch silent VoiceOver focus stops.”
- For whom: “For iOS teams checking a scripted focus run before confusing silence reaches users.”
- First action: “Try it with sample data,” paired with “Loads a finished focus report.”
- Plain facts: “No upload,” “Runs locally,” and “Free and open source.”

The action was entirely above the fold at 390×844 (`y=496.73`, height `48`) and opened `/demo` in one click. The first demo view already showed a seven-stop checkout trace and “Two stops need review.” Its banner said “Demo — sample data, nothing is saved” and included working “Reset demo” and “Start for real” controls.

## Release-blocking findings

### QA2-01 — High — the XCTest path cannot discover a silent regression

The brief's real job is to record a scripted iOS focus traversal and catch stops that announce nothing. The shipped helper does not observe VoiceOver focus or spoken output. More importantly, its automatic fallback cannot produce an empty announcement:

```swift
let spoken = announcement ?? [label, value, role]
    .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    .joined(separator: ", ")
```

`role` is a required argument, and the Rust trace validator rejects an empty role. Therefore a caller that omits `announcement` always records at least the role, even when the app's current label and value have regressed to empty. The analyzer only flags an empty `announcement`. A caller can trigger a silent finding only by explicitly passing `announcement: ""`, as the example does; at that point the test author has already identified and encoded the silent stop. Hard-coded nonempty announcements similarly remain nonempty if the app's live accessibility properties regress.

The declared `xctest-capture` test does not exercise the Swift helper or this behavior. It supplies a fake `xcodebuild` executable that prints already-complete `SFS_EVENT:` lines, then proves only that the Rust CLI extracts them. This Linux worker has no `xcodebuild` or iOS Simulator, but the failure follows deterministically from the shipped helper and validator. The product is a useful trace analyzer; it does not yet deliver the brief's end-to-end regression detector.

### QA2-02 — High — report options can destroy the input trace without warning

The CLI accepts an output path identical to an input path. This command exited 0 and replaced the only trace with a report:

```sh
cp examples/sample-trace.json /tmp/<dir>/trace.json
silent-focus-sentinel analyze /tmp/<dir>/trace.json --json /tmp/<dir>/trace.json
```

Evidence:

```text
first_exit=0
before_sha=9a89fb4675b36d56770618fd43d9b49af3e7f68baff07a25f0878c35391979c7
after_sha=6630f9e9acba036ea01d55202428756a7bc82c77aee9ffba93bd735a0976e2a2
second_analyze_exit=2
```

Likewise, `--json <same-path> --html <same-path>` exits 0 and leaves only the HTML, silently discarding the requested JSON. `diff` has the same unguarded writer and can overwrite a baseline or current trace. The CLI must reject colliding input/output and JSON/HTML paths before writing. This is unrecoverable local data loss and violates the destructive-action requirement.

### QA2-03 — Medium — live CLS exceeds the explicit performance budget

Three fresh Lighthouse 13.4.1 mobile runs against the live URL produced the same CLS: `0.10536167423126479`, above the required `< 0.1`. Lighthouse identified one shift caused by the self-hosted Space Grotesk font loading; the shifted region was the hero action area.

| Run | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 89 | 100 | 100 | 100 | 1,067 ms | 341 ms | 0.10536 |
| 2 | 97 | 100 | 100 | 100 | 1,064 ms | 0 ms | 0.10536 |
| 3 | 92 | 100 | 100 | 100 | 1,005 ms | 263 ms | 0.10536 |

Median performance is 92 and LCP is comfortably within budget, but CLS fails consistently. Run 1 also missed the ≥90 performance target; the variable TBT indicates that score was noisy, unlike the stable layout shift.

### QA2-04 — Medium — public promises are absent from `claims.json`

The ten listed claims have exactly one tagged test each and all pass. The README nevertheless makes additional functional promises that have no claim entry or tagged sandbox test, including the documented exit-code contract (`0`, `1`, and `2`), the failed-runner behavior, and the “single binary with Rust 1.85 or newer” install contract. The public site also promises that the XCTest helper does not call private VoiceOver APIs without listing that claim.

Independent spot checks showed the documented exit codes and package shape currently behave as described, but the claims contract explicitly requires every visitor-reliable promise to be listed and tested. This is therefore release-blocking process coverage, not an allegation that those spot-checked statements are false.

## Other finding

### QA2-05 — Medium — the desktop landing page scrolls horizontally

The hero art extends beyond the document width on common desktop/tablet widths, creating a horizontal scrollbar:

| Viewport width | Horizontal overflow |
| ---: | ---: |
| 761 px | 68 px |
| 800 px | 72 px |
| 1,024 px | 97 px |
| 1,280 px | 91 px |
| 1,440 px | 28 px |
| 1,920 px | 0 px |

The 390 px mobile layout has no overflow. No content becomes unusable, but the desktop presentation does not stay within its viewport.

## Claims results

After `npm ci`, every exact `test` value in `.factory/claims.json` was run separately from the candidate checkout. All passed with exit 0.

| Claim | Exact manifest command | Result |
| --- | --- | --- |
| `find-silent` | `npm test -- --grep @claim:find-silent` | PASS; tagged test 1/1 |
| `find-duplicate` | `npm test -- --grep @claim:find-duplicate` | PASS; tagged test 1/1 |
| `local-only` | `npm test -- --grep @claim:local-only` | PASS; tagged test 1/1 |
| `json-html` | `npm test -- --grep @claim:json-html` | PASS; tagged test 1/1 |
| `decorative-ignore` | `npm test -- --grep @claim:decorative-ignore` | PASS; tagged test 1/1 |
| `record-command` | `npm test -- --grep @claim:record-command` | PASS; tagged test 1/1 |
| `xctest-capture` | `npm test -- --grep @claim:xctest-capture` | PASS; tagged test 1/1, but only a marked-log mock |
| `diff-regressions` | `npm test -- --grep @claim:diff-regressions` | PASS; tagged test 1/1 |
| `sample-download` | `npm test -- --grep @claim:sample-download` | PASS; tagged test 1/1 |
| `open-source` | `npm test -- --grep @claim:open-source` | PASS; tagged test 1/1 |

The bundled seeded sample reports one intended silent stop and one intended duplicate, ignores the decorative stop, and adds no unintended finding: 100% of its one seeded empty stop and 0 false positives in that seven-event fixture. The fixture is too small to establish broad heuristic accuracy, and it does not cure QA2-01.

## Passing evidence

### Clean install, tests, checks, and exact build

- Candidate and initial remote state: `d706aa9cf72f48fca9ac713b991866eb01fe1dbb`, clean `main`, equal to `origin/main`.
- `npm ci`: passed; 25 packages installed, 0 vulnerabilities.
- `npm test`: passed; 5 Rust tests and 20 Playwright tests.
- `npm run typecheck`: passed.
- `npm run build`: passed and produced `dist/site/` plus `target/release/silent-focus-sentinel`.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `cargo package --locked`: passed; 13 files, 43.5 KiB unpacked / 13.1 KiB compressed.

### Clean consumer and CLI behavior

The packaged crate was installed from `target/package/silent-focus-sentinel-0.1.0` into a fresh temporary Cargo root with `--locked`. The installed `silent-focus-sentinel 0.1.0` binary exposed all documented commands and its demo created a unique temporary directory containing parseable JSON and standalone HTML.

Normal and boundary evidence:

- Sample analyze: 7 events, 6 analyzed, 1 ignored, 1 silent, 1 duplicate.
- Forward diff: 2 new findings; `--fail-on regressions` exited 1. Reverse diff: 2 resolved; exited 0.
- `--fail-on findings` exited 1 with two findings.
- Whitespace/case-normalized duplicate speech and whitespace-only silence were detected.
- Empty input, malformed JSON, schema 2, no events, blank ID, blank role, duplicate ID, missing file, failed runner, empty runner output, failed XCTest command, and XCTest output with no markers all exited 2 with actionable errors and did not create the requested output.
- A 10,000-event trace completed successfully in 62 ms in this worker.
- Generated HTML at 1440×900 and 390×844 had one `h1`, one `main`, no horizontal overflow, no console errors, and zero Axe violations.

### Deployment identity

The candidate's fresh production build matches the live site byte for byte for HTML and every checked public asset. Representative SHA-256 values:

- `index.html`: `0f064546af8906c23b7f82e69e757676303ebd257e628fd636142464e9ddfc5c`.
- JS: `28cb9ba8c151902a53ebe61327d7df7096f80d8c5e52bd201f359c11167421fd`.
- CSS: `1d68affcba18c2b5604b3ede555384581e69f8208f0bdd48d25058a2124ca2dc`.
- Font: `685bbbf69fa616df1ef81847c85fc76be097ddfb3468ff2257be54511ab3130f`.
- Hero: `a8f7fabb43f27d9598ff991fdc658d247a10888775625e8ccd6f178f63f31708`.

`d706aa9` changes only the handoff documentation above the deployed source commit, so the byte match covers all web-relevant candidate files.

### Live browser, accessibility, and privacy

Fresh desktop and 390×844 contexts covered `/`, `/demo`, `/privacy`, `/terms`, and an unknown route:

- Valid routes returned 200. The unknown route returned a real 404 and rendered the designed not-found page.
- Correct route titles, `lang=en`, one `h1`, one `main`, and no heading-level skips.
- Zero Axe violations of any impact on all routes and both viewports.
- No console warnings, console errors, or page errors on valid routes. Chromium reports the expected failed-resource message for the intentionally 404 document.
- Every visible mobile link and button measured at least 44×44 CSS px.
- Keyboard: the first Tab reached the skip link; Enter moved focus to `main`; the primary demo action was reachable and operable; reset retained focus; download announced “Sample JSON downloaded”; “Start for real” returned to `/#install`; copy worked with Space and left focus on the button.
- Focus outlines were 3 px solid and visible. The demo bar used `rgb(6, 36, 31)` rather than aqua-on-aqua.
- Reduced motion produced `animation-name: none` and `scroll-behavior: auto`.
- Demo download produced `sample-trace.json`; reset restored the sample.
- The full tested flow made only same-origin GETs for the document, hero, JS, CSS, and font. It created no cookies, localStorage, or sessionStorage. There were no third-party scripts, analytics, or runtime API calls.
- All site links returned 200, including the repository and Param Factory external links.

Response headers include HSTS, CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive Permissions Policy. HTML uses a 30-second revalidation cache. Hashed JS, CSS, and font use `max-age=31536000, immutable`; the hero uses one day.

Production payloads are within size budgets: JS 11,752 bytes / 4,620 gzip; CSS 11,636 / 3,498 gzip; font 13,284; hero 33,420; total Lighthouse transfer about 56.8 KB. Metadata, canonical URL, 1200×630 OG card, 180×180 touch icon, robots, sitemap, privacy, terms, and MIT license are present.

## Applicability and verification limits

- This is a CLI with a static documentation/demo site. There are no server-side product or unlock endpoints, so API allowance/429 testing is not applicable.
- There is no sign-in, payment, analytics, or AI feature. Entra tenant and billing checks are not applicable.
- This is not a PWA and registers no service worker; service-worker update/offline checks are not applicable. It makes no offline claim.
- The Linux worker cannot run Xcode or an iOS Simulator. This limitation is not the basis of QA2-01; that finding is established by the shipped helper's deterministic fallback and the mock-only claim test.

## Required remediation

1. Make the XCTest integration derive a silence-sensitive value from current app accessibility state, and test a regression where a previously announced element becomes silent without the fixture supplying an empty announcement.
2. Resolve and reject all colliding input, JSON, and HTML paths before any write.
3. Eliminate the font-driven layout shift so mobile CLS is below 0.1 on repeated cold runs.
4. Add claim entries and exactly tagged sandbox tests for the remaining public functional promises, or remove those promises.
5. Contain the desktop hero bleed without creating document-level horizontal scrolling.
