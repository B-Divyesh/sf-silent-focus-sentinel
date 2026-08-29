# Silent Focus Sentinel review 2 handoff

## Status: FAIL

Adversarial review 2 is recorded in `.factory/review-2.md` for commit `9679985bca27c061cb1f14f1c93ef829ca7f9bd7`. Product code was not modified.

## Work completed

- Captured cold live first reads at 390×844 and 1440×900 before inspecting implementation copy.
- Entered the one-click browser demo, checked realistic first-screen data, Reset demo, Start for real, download, browser storage isolation, and request origins.
- Ran all 22 literal claim commands separately from clean clone `/tmp/sfs-review2-clean-3cPeh7`; all passed.
- Ran the unfiltered unit/browser suite, build, live verifier, formatting, clippy, and Cargo packaging; all passed.
- Installed the CLI with the exact landing-page Git command and ran its demo from an unrelated empty temporary directory.
- Crawled live routes and links, checked raw/runtime metadata, history/focus, 404 behavior, accessibility, mobile overflow, and live/build artifact identity.
- Rechecked all 20 findings from review 1 against live behavior and current code.
- Audited every landing and README sentence, heading, action, and status message with word counts.

## Result

Seven findings remain:

- F-2-1 blocking: the CLI-specific landing artifact is a hand-authored terminal transcript, not a self-hosted recording of the real binary.
- F-2-2 and F-2-4: two public promises are absent from `.factory/claims.json`.
- F-2-3: the actual `?demo=1` entry returns landing metadata to non-JavaScript clients.
- F-2-5: the demo introduces the competing term “intentional ignore”.
- F-2-6: README deployment guidance is missing.
- F-2-7: README uses the avoidable abbreviation “CI”.

## Verification commands

```sh
npm ci
npm test
npm run verify:live -- https://silent-focus-sentinel.sociobot.in
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked
```

The complete claim-by-claim results, copy audits, evidence, and concrete fixes are in `.factory/review-2.md`.
