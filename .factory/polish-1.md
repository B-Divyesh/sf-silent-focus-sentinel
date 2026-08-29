# Polish round 1

## Result: PASS

All 20 findings in `.factory/review-1.md` are resolved. No earlier `.factory/review-*.md` or `.factory/polish-*.md` existed.

The implementation is commit `78b4ffa95366d37d0c8efa141a36b3ec7403b6c7`. It was pushed to `origin/main` and deployed to <https://silent-focus-sentinel.sociobot.in>.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Narrowed the product to caller-selected XCTest elements and label/value text. Public copy no longer claims VoiceOver traversal or speech observation. New output uses `text`, `empty_text`, and `duplicate_text`; old `announcement` input remains readable as an alias. | `@claim:find-empty-text`, `@claim:find-duplicate-text`, `@claim:public-xctest-helper`; [live mobile home](evidence/polish-1/live-home-mobile.png); live `/` H1 is “Flag empty text in scripted iOS checks”. |
| F-1-2 | Replaced the unprovable Simulator traversal claim with the exact behavior: extracting marked `SFS_EVENT` lines from `xcodebuild` output. The test mixes marked and unmarked output and checks ordered saved text. | `@claim:xctest-extraction`; [live desktop home](evidence/polish-1/live-home-desktop.png); live `/` boundaries state that VoiceOver is not observed. |
| F-1-3 | Corrected README guidance: omit `--json` to print JSON to standard output. | `@claim:stdout-json` parses both `analyze` and `diff` stdout; live `/` loaded without console errors. |
| F-1-4 | Added a `demo-isolation` claim. The CLI test hashes a seeded project before and after, then verifies both reported files share a new OS temporary parent. The browser enters through `/?demo=1`, preserves seeded real storage, and resets in memory. | `@claim:demo-isolation`; [live demo](evidence/polish-1/live-demo-mobile.png); live `/?demo=1` shows the banner, Reset demo, and Start for real. |
| F-1-5 | The post-build step now emits route-specific raw title, description, canonical, Open Graph, and Twitter metadata for `/demo`, `/privacy`, `/terms`, and the 404 document. Runtime navigation updates the same fields. | Browser test “built static routes have specific metadata…”; `npm run verify:live` raw-response checks; live `/demo`, `/privacy`, `/terms`, and unknown-path titles all match their routes. |
| F-1-6 | Added `examples/regression-suite.json` with 30 versioned cases: 12 intentional empty cases and 18 negatives across whitespace, labels, values, hints, roles, dynamic text, ignored nodes, and non-focusable elements. | `@claim:accuracy-suite`: 12/12 detected (100%); 0/18 false positives (0%). Live `/` describes the narrower measured behavior. |
| F-1-7 | Added and tested the no-account/runtime-service contract across every CLI command in a credential-free environment. | `@claim:accountless-run`; [live mobile home](evidence/polish-1/live-home-mobile.png); live `/#install` says every command runs without an account or service. |
| F-1-8 | Added a no-telemetry claim covering help, demo, analyze, diff, record, and record-xctest behind a recording denying proxy. | `@claim:no-telemetry`; live `/privacy` states the scoped CLI network promise. |
| F-1-9 | Added a static-site privacy claim across every route in fresh browser contexts. It asserts same-origin requests plus empty cookies, localStorage, and sessionStorage. | `@claim:site-private`; `npm run verify:live`; live `/privacy` loaded with no outside request or storage write. |
| F-1-10 | Added the build-artifact claim for the executable and all routed site output. | `@claim:build-artifacts`; clean-clone `npm test` ran `npm run build`; live routed outputs return 200 and the unknown route returns 404. |
| F-1-11 | Standardized visible concepts to element, label/value text, empty text, duplicate text, ignored element, and finding. | `.factory/copy-audit.md`; `rg` stale-wording audit returned no public matches; [live mobile home](evidence/polish-1/live-home-mobile.png). |
| F-1-12 | Replaced metaphor headings and captions with “Sample elements and findings” and a literal aqua/coral legend. | Browser route/axe tests; [live desktop home](evidence/polish-1/live-home-desktop.png); live `/` shows the revised section. |
| F-1-13 | Replaced the workflow slogan with “How the CLI checks a scripted run”. | `.factory/copy-audit.md`; [live mobile home](evidence/polish-1/live-home-mobile.png); live `/`. |
| F-1-14 | Replaced “Run it before setup” with “Run the bundled CLI demo”. | `.factory/copy-audit.md`; [live mobile home](evidence/polish-1/live-home-mobile.png); live `/`. |
| F-1-15 | The visible copy button now says “Copy install command” and changes to “Install command copied” on success. | Browser keyboard/touch tests; [live desktop home](evidence/polish-1/live-home-desktop.png); live `/#install`. |
| F-1-16 | Split the long README overview into short, concrete sentences and removed “review-ready”. | README sentence audit found no sentence over 22 words; live `/` uses the same scoped wording. |
| F-1-17 | Split the XCTest limitation into two sentences that distinguish chosen elements from unobservable VoiceOver navigation. | README sentence audit; `@claim:public-xctest-helper`; live `/` boundaries repeat the limitation. |
| F-1-18 | Replaced the long announcement explanation with the `text` field contract and a direct empty-text definition. | README sentence audit; `@claim:find-empty-text`; live `/demo` shows the exact empty-text result. |
| F-1-19 | Removed “real” and “regular” qualifiers. The section says “Extract marked XCTest output” and “saves a trace JSON file”. | Stale-wording `rg` audit; [live mobile home](evidence/polish-1/live-home-mobile.png); live `/`. |
| F-1-20 | Removed 404 brand lore. The page says “Check the address, or return to the home page.” | `npm run verify:live` asserted a 404 response, one H1, axe zero serious/critical issues, and a working return link at live `/definitely-missing-polish-1`. |

## Verification

- Clean clone: `/tmp/sfs-polish1-clean-Iy6yqq`, commit `78b4ffa95366d37d0c8efa141a36b3ec7403b6c7`.
- Every literal command in `.factory/claims.json` ran separately: 22/22 passed.
- `npm test`: 6 Rust tests and 37 Chromium tests passed.
- `npm run typecheck`, `cargo fmt --check`, and clippy with warnings denied passed.
- `cargo package --locked`: 15 files, 53.3 KiB unpacked; installation from that package passed, including `--help` and `demo`.
- Axe via Playwright: zero serious or critical violations on six routes at mobile size.
- Local Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1,212 ms, CLS 0, TBT 43 ms.
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 982 ms, CLS 0, TBT 33 ms.
- Production assets: JavaScript 12.66 KiB raw / 4.77 KiB gzip; CSS 12.21 KiB raw / 3.60 KiB gzip; font 13.28 KiB; hero image 33.42 KiB.
- Cold live verification: `LIVE_VERIFY_PASS ... routes=6 axe=0 storage=0 outsideRequests=0`.

There are no unresolved findings.
