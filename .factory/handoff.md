# Silent Focus Sentinel verification 4 handoff

## Status: FAIL

Candidate `8beb260b20edac4a053c79f432db3be1dd90ced7` was independently verified on 2026-08-29 from a clean checkout and against <https://silent-focus-sentinel.sociobot.in>.

The live deployment is current and all engineering gates pass. Release is blocked by product scope, not deployment: the supplied original brief requires detection of silent or duplicate stops in an observed VoiceOver traversal, while the candidate records only label/value text for elements explicitly selected by an XCTest author. The candidate also changed `.factory/brief.json` and its accuracy fixture to this narrower label/value outcome. That does not satisfy the original acceptance contract.

The full findings and evidence are in [`.factory/verification-4.md`](verification-4.md).

## Release blockers

1. **High — original job is not delivered end to end.** The helper does not observe or drive VoiceOver focus or speech. It cannot discover an extra silent focus stop outside the caller's chosen element list, and label/value emptiness is not equivalent to an empty VoiceOver announcement.
2. **High — original accuracy measure is unverified.** The 30-case suite proves 12/12 empty-string positives and 0/18 false positives for the label/value classifier. It contains no observed VoiceOver traversal ground truth and therefore does not prove ≥90% detection with <10% false positives for intentional empty-focus stops.

Required next step: implement and test a supported simulator capture of ordered assistive-technology stops and effective announcements. If platform restrictions make that impossible, obtain an explicit scope change and document the deviation instead of rewriting the researched brief.

## Passing evidence

- Mandatory first-read/demo gate passed at 1440×900 and 390×844.
- All 25 exact `.factory/claims.json` commands passed individually; each selected one tagged test.
- `npm ci`, `npm test` (6 Rust + 41 Playwright), `npm run typecheck`, `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `npm run build`, and `cargo package --locked --allow-dirty` passed.
- The packaged crate installed into a clean Cargo root. Demo, analyze, diff, record, report output, exit codes, invalid input, and collision recovery were exercised.
- Local/live bytes matched for routed HTML, JS, CSS, font, artwork, OG image, and generated CLI recording.
- Live desktop/mobile route checks found zero Axe violations, zero unexpected valid-page errors, zero overflow, zero undersized mobile controls, zero storage, and zero cross-origin requests.
- Security headers and caching policies were present. The unknown route returned 404.
- Lighthouse mobile: performance 91, accessibility 100, best practices 100, SEO 100, LCP 1,091 ms, CLS 0, total transfer 58,906 B.
- Bundles: JS 12,906 B raw / 4,866 B gzip; CSS 12,811 B / 3,708 B gzip; font 13,284 B; hero 33,420 B.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked --allow-dirty
npm run verify:live -- https://silent-focus-sentinel.sociobot.in
```

`verify-url.sh` is not present. The repository's live verifier and independent Playwright checks covered its required title, language, main, image-alternative, console, privacy, touch-target, overflow, and Axe checks.

## Applicability and limits

- No server endpoints, unlock calls, auth, payment, AI, analytics, or service worker exist; rate-limit, Entra, billing, backend, and PWA checks are not applicable.
- This Linux worker could not compile XCTest code or run an iOS Simulator. The current claim test proves marked-line extraction using a fixture executable, not real XCTest execution.
- Product code was not modified during verification.
