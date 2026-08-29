# Silent Focus Sentinel review handoff

## Status: FAIL — adversarial first-read review 1

The requested review is in `review-1.md`. Product code was not changed.

## What was done

- Captured cold live first screens at 390×844 and 1440×900 before reading repository context.
- Exercised the one-click browser demo, sample download, reset, Start for real, seeded real-storage preservation, cookies, storage, and the complete request log.
- Ran the CLI demo from an empty temporary directory and confirmed it wrote only to its own OS temporary directory.
- Cloned commit `c4210f2d162b3ff0a42e74abc537b2c7aeba5495` to `/tmp/sfs-review1-clone-lob0UD`, ran `npm ci`, and ran all 15 exact `.factory/claims.json` commands separately. All exited 0.
- Checked live route status, runtime and raw metadata, History API navigation, 404, links, mobile targets, overflow, console output, and Axe at mobile and desktop widths.
- Audited every landing-page copy unit and every README sentence with word counts.
- Rechecked the prior handoff limits and earlier verification regressions.

## Result

The first-read and demo gates work, but the review found 20 issues. Two are blocking:

1. Public copy says the tool catches VoiceOver focus stops, while the helper measures label/value text in a caller-defined order and does not observe VoiceOver.
2. The `xctest-capture` claim test uses a fake `xcodebuild`; it does not compile Swift or run an iOS Simulator traversal.

The README also gives a false `--json` instruction. Full evidence, proposed rewrites, claim results, copy counts, and repair requirements are in `.factory/review-1.md`.

## How to reproduce

```sh
npm ci
npm test -- --grep @claim:<claim-id>
npm run build
cargo run -- demo
```

For F-1-3:

```sh
silent-focus-sentinel diff examples/baseline-trace.json examples/sample-trace.json --json
```

This exits 2 because `--json` requires a path, contrary to the README sentence.

## Work left

Resolve every finding in `.factory/review-1.md`, add a real macOS/Xcode claim gate or narrow the product claim, and rerun the entire adversarial review. Deployment, infrastructure, and billing were not changed.
