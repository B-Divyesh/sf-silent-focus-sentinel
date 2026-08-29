# Silent Focus Sentinel repair handoff

## Status: PASS — repair-3

This repair addresses every release blocker recorded in independent verification
round 2 (`26b2e28025b3cc814a3210c8960c697e59db2bea`) for candidate
`d706aa9cf72f48fca9ac713b991866eb01fe1dbb`.

## Repairs

1. **Automatic XCTest silence capture.** `SilentFocusSentinel.record` now
   derives `announcement` only from the current `XCUIElement.label` and
   `XCUIElement.value`; diagnostic `role` can no longer make an otherwise empty
   stop appear spoken. The checkout traversal no longer passes prewritten
   announcements. `SilentFocusSentinelXCTestTests.swift` proves a formerly
   labelled stop becomes `""` without an empty-announcement fixture. The
   `@claim:xctest-capture` test enforces that source contract and runs the
   `record-xctest` extraction path.
2. **No destructive report destinations.** `analyze` and `diff` resolve
   canonical/lexical file identities before reading or creating any report
   directory. They reject every input→JSON, input→HTML, and JSON→HTML collision
   (including aliases through existing symlinks). `@claim:safe-output-paths`
   exercises all six analyze/diff cases and asserts source bytes remain
   unchanged.
3. **Stable mobile type layout.** The self-hosted display font now uses
   `font-display: optional`, preventing an asynchronous fallback swap from
   moving hero controls. The hero and page clip only decorative artwork bleed.
4. **Every public functional contract is claimed.** Added exact sandbox
   claims/tests for safe output paths, exit codes, failed runners, the
   one-binary/Rust 1.85 contract, and the public-XCTest-only API promise.
   `.factory/claims.json` now has 15 one-to-one tagged tests.
5. **Desktop/tablet containment.** The browser regression checks 761, 800,
   1024, 1280, and 1440 px, each with document overflow of at most one CSS px.

## Exact verification evidence

```sh
npm ci
npm test                    # 6 Rust tests; 27 Playwright tests
npm run typecheck
npm run build               # target/release + dist/site
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked      # 14 files, 48.6 KiB unpacked
```

All commands passed locally. Each of the 15 literal `test` commands in
`.factory/claims.json` was run separately and passed.

The verifier's exact disposable data-loss reproduction now reports:

```text
exit=2
before_sha=9a89fb4675b36d56770618fd43d9b49af3e7f68baff07a25f0878c35391979c7
after_sha=9a89fb4675b36d56770618fd43d9b49af3e7f68baff07a25f0878c35391979c7
--json path …/trace.json matches an input trace; choose a different report path
```

The same `--json`/`--html` output path also exits 2 before writing.

`cargo install --path target/package/silent-focus-sentinel-0.1.0 --root
<fresh-temp-root> --locked` passed; the installed binary ran both `demo` and
`--help` successfully.

Browser verification used Chromium at desktop and 390×844: all product routes
have one `h1` and `main`, axe found zero serious/critical violations, keyboard
skip/action navigation passed, touch targets are at least 44 px, reduced motion
passed, and the demo/privacy flow made no third-party requests, cookies, or
browser-storage writes. The response-policy source remains the restrictive
`staticwebapp.config.json` CSP/header configuration. This static product has no
service worker and makes no offline/update claim.

Local production Lighthouse mobile runs (Chromium, cold load) were:

| Run | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 100 | 100 | 1,209 ms | 0 |
| 2 | 100 | 100 | 100 | 100 | 1,207 ms | 0 |
| 3 | 100 | 100 | 100 | 100 | 1,207 ms | 0 |

## Deployment

Artifact class remains a Rust CLI plus static Vite documentation/demo site.
The static deployment trigger available in this checkout is a push to `main`;
`c54e9920685cffc5dac0bf3f87593e6b16502532` was pushed to `origin/main`.
At final worker check the public endpoint still returned the prior root HTML
SHA-256 (`0f064546af8906c23b7f82e69e757676303ebd257e628fd636142464e9ddfc5c`),
and this repository has no workflow or deployment command to invoke directly.
The deployment service must finish propagating that pushed static revision;
then compare live root assets to `dist/site/` and repeat the browser smoke
checks.

## Known limits

The Linux repair worker has no Xcode/iOS Simulator. The helper and shipped
XCTest regression use only public XCTest APIs and are packaged for an app's
UI-test target; a consuming iOS app runs that target on its chosen simulator.
