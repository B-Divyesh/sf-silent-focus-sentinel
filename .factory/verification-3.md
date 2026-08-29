# Independent product verification — round 3

## Verdict: PASS

Candidate **`c41ed8e7cd0d7cae316317bd033e0bcdf4db5360`** is releasable for the
researched Silent Focus Sentinel CLI brief. Verification was performed from the
clean candidate checkout on 2026-08-29 against
`https://silent-focus-sentinel.sociobot.in`.

This is fresh evidence, not a deployment-only inference: the live root HTML,
JavaScript, CSS, self-hosted font, hero art, and OG image exactly match a fresh
production build of this commit (SHA-256 compared byte for byte).

## First-read gate

**PASS.** A cold 1440×900 live load says, in the first screen:

- **What:** “Catch silent VoiceOver focus stops.”
- **For whom:** “For iOS teams checking a scripted focus run before confusing
  silence reaches users.”
- **First click:** “Try it with sample data,” with “Loads a finished focus
  report” immediately beside it.

The three plain facts are “No upload”, “Runs locally”, and “Free and open
source”. The primary action opens `/demo` in one click; its completed checkout
sample reports one silent stop and one repeated announcement, with its
decorative stop ignored.

## Claims: all required commands passed

After `npm ci`, I ran every literal `test` command in `.factory/claims.json`
separately from the clean candidate checkout. All 15 exited 0. A subsequent
unfiltered `npm test` reran all 15 tagged claims together with the site suite.

| Claim | Result |
| --- | --- |
| `find-silent` | PASS |
| `find-duplicate` | PASS |
| `local-only` | PASS |
| `json-html` | PASS |
| `decorative-ignore` | PASS |
| `record-command` | PASS |
| `xctest-capture` | PASS |
| `diff-regressions` | PASS |
| `sample-download` | PASS |
| `open-source` | PASS |
| `safe-output-paths` | PASS |
| `exit-codes` | PASS |
| `failed-runner` | PASS |
| `single-binary` | PASS |
| `public-xctest-helper` | PASS |

The bundled seven-stop sample independently produced `eventCount=7`,
`analyzedCount=6`, `silentCount=1`, `duplicateCount=1`, and `ignoredCount=1`.
I also created a JSONL boundary trace: whitespace-only speech was silent and
case/whitespace-normalized adjacent speech was duplicate. A malformed trace
returned exit 2 with a next step. An `analyze` JSON-output collision returned
exit 2 and preserved the input SHA-256.

## Local build and CLI package

All commands passed:

```sh
npm ci
npm test                    # 6 Rust tests; 27 Playwright tests
npm run typecheck
npm run build               # release binary and dist/site/
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked      # 14 files; 48.6 KiB unpacked
```

I installed the packaged crate into a fresh temporary Cargo root with:

```sh
cargo install --path target/package/silent-focus-sentinel-0.1.0 \
  --root <fresh-temp>/install --locked
```

The installed binary exposed useful `--help`, ran `demo`, created parseable
JSON plus standalone HTML in its own temporary directory, and returned the
documented failure status for malformed input. The demo reported two issues
across six checked stops. No publishing was performed.

## Live deployment, privacy, accessibility, and performance

- Deployment identity: local/live SHA-256 matched for `index.html`, hashed JS,
  hashed CSS, font, `focus-landscape.webp`, and `og-card.webp`.
- Desktop 1440×900 and mobile 390×844: `/`, `/demo`, `/privacy`, and `/terms`
  returned 200; an unknown path returned the designed 404. Every route had one
  `h1`, one `main`, `lang=en`, correct route title, and no horizontal overflow.
- Axe on every route at both widths: zero serious/critical findings (zero total
  findings). Valid routes had no console errors or page errors in isolated
  loads. The browser’s expected failed-resource message is limited to the
  intentional 404 document.
- Keyboard: first Tab reaches Skip to content; Enter moves focus to `main`;
  the next five tabs reach the sample action with a 3px aqua focus outline.
  Mobile’s 13 visible controls were each at least 44×44 CSS px. Reduced-motion
  sets `scroll-behavior: auto` and hero animation to `none`.
- Fresh live demo flow (open demo, download `sample-trace.json`, reset): all
  requests were same-origin only (document, image, JS, CSS, font); there were
  no cookies, localStorage, or sessionStorage entries, no third-party scripts,
  and no API calls.
- Response headers include HSTS, `nosniff`, strict-origin referrer policy,
  restrictive Permissions Policy, and same-origin CSP with
  `frame-ancestors 'none'`. HTML revalidates at 30 seconds; hashed JS has
  `max-age=31536000, immutable`.
- Build budgets: 11,752 B JS (4,620 B gzip), 11,686 B CSS (3,518 B gzip),
  13,284 B font, and 33,420 B hero image. All are within the supplied budgets.
- A throttled live mobile Lighthouse 13 audit recorded 95 performance, 100
  accessibility, 100 best practices, 100 SEO, 1,058 ms LCP, and 0 CLS.
  Chromium crashed in Lighthouse’s final teardown after it wrote the result;
  this did not produce a page error and isolated Playwright verification was
  clean.

`verify-url.sh` is not shipped in this checkout, so it could not be invoked.
The equivalent live checks (title, lang, main, image alternatives, console)
were performed in Playwright, and Axe was run through the repository’s
`@axe-core/playwright` integration.

## Applicability and limits

- This is a local Rust CLI plus static documentation/demo site: no product
  server endpoint, sign-in, billing, unlock call, AI feature, telemetry,
  service worker, or offline claim exists. Rate-limit/429, Entra, PWA update,
  persistence, and backend concurrency checks are therefore not applicable.
- This Linux verifier cannot run Xcode or an iOS Simulator. The shipped helper
  is checked for public XCTest-only imports, derives its captured speech from
  current label/value rather than a hard-coded announcement, and the mock
  XCTest extraction path passes. A consuming iOS project should additionally
  run the bundled XCTest example on its target simulator before relying on a
  release gate.
- The seeded sample proves its one intentional empty stop, one adjacent
  duplicate, and ignored decorative case. It is not a statistical claim that
  establishes the brief’s broader 90%/under-10%-false-positive success measure
  across arbitrary applications.

## Defects

None release-blocking found in this candidate.
