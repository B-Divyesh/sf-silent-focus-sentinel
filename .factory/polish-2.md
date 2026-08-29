# Polish round 2

## Result: PASS pending deployment verification

Repair commit: `cc7c9e81dcf7bfb1f322c7cee711241860e7fe15`.

This round resolves every finding in `.factory/review-1.md` and
`.factory/review-2.md`. The final live check is recorded after the deployment
commit is pushed. Screenshots are written by `npm run verify:live` to
`.factory/evidence/polish-2/`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Scoped all public wording to empty or duplicate label/value text in a scripted XCTest check. | `@claim:find-empty-text`, `@claim:public-xctest-helper`; live `/`; `evidence/polish-2/live-home-mobile.png`. |
| F-1-2 | Kept the claim to extraction of marked `SFS_EVENT` output, rather than Simulator or VoiceOver traversal. | `@claim:xctest-extraction`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-3 | Documented stdout JSON only when `--json` is omitted. | `@claim:stdout-json`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-4 | Preserved the separate in-memory browser sandbox and the temporary-directory CLI demo. | `@claim:demo-isolation`; live `/demo` and `/?demo=1`; `evidence/polish-2/live-demo-mobile.png`. |
| F-1-5 | Kept pre-rendered metadata for `/demo`, `/privacy`, `/terms`, and 404; all public demo links now use `/demo`. | built-route metadata test; live `/demo`; `evidence/polish-2/live-demo-mobile.png`. |
| F-1-6 | Retained the 30-case measured regression fixture and rate assertion. | `@claim:accuracy-suite`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-7 | Retained the credential-free command claim and test. | `@claim:accountless-run`; live `/#install`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-8 | Retained the no-telemetry test over every CLI command. | `@claim:no-telemetry`; live `/privacy`; `evidence/polish-2/live-home-mobile.png`. |
| F-1-9 | Retained the static-site storage and third-party-resource assertion. | `@claim:site-private`; live `/privacy`; `evidence/polish-2/live-home-mobile.png`. |
| F-1-10 | Retained the claimed release binary and routed static artifact checks. | `@claim:build-artifacts`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-11 | Standardized public terms on label/value text, empty text, duplicate text, ignored element, and finding. | copy audit; live `/demo`; `evidence/polish-2/live-demo-mobile.png`. |
| F-1-12 | Retained literal sample/report labels and color explanations. | route/axe suite; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-13 | Retained the direct workflow heading. | copy audit; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-14 | Retained the accurate bundled-demo heading. | `@claim:cli-demo-recording`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-15 | Retained result-specific install-copy labels and fallback. | browser keyboard suite; live `/#install`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-16 | Retained short, concrete README overview sentences. | `.factory/copy-audit.md`; README in repair commit; live `/`. |
| F-1-17 | Retained the explicit XCTest and VoiceOver boundary. | `@claim:public-xctest-helper`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-18 | Retained the direct `text`-field and empty-text documentation. | `@claim:find-empty-text`; live `/demo`; `evidence/polish-2/live-demo-mobile.png`. |
| F-1-19 | Retained concrete extraction and trace-file wording. | README copy audit; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-1-20 | Retained the plain recovery-focused 404. | route/axe suite; live `/definitely-missing-polish-2`; `evidence/polish-2/live-home-mobile.png`. |
| F-2-1 | Replaced the hand-authored terminal panel with `demo-recording.svg`, generated at build time from the release binary’s real `demo` output; the disclosure holds the accessible transcript. | `@claim:cli-demo-recording`; live `/`; `evidence/polish-2/live-home-desktop.png`. |
| F-2-2 | Changed the promise to “Opens a finished sample report,” listed it, and tested the full first-screen demo result and reset. | `@claim:browser-demo-ready`; live `/demo`; `evidence/polish-2/live-demo-mobile.png`. |
| F-2-3 | Pointed the header, primary action, sample link, README, and crawl path to prerendered `/demo`; kept `?demo=1` as a functional isolated alias. | built-route metadata test; live `/demo` raw title/canonical check; `evidence/polish-2/live-demo-mobile.png`. |
| F-2-4 | Expanded Web Content Accessibility Guidelines (WCAG) on first use, listed the non-certification boundary, and asserted no CLI report or help output claims certification. | `@claim:no-wcag-certification`; live `/terms`; `evidence/polish-2/live-home-desktop.png`. |
| F-2-5 | Replaced “intentional ignore” with “ignored decorative element.” | copy audit; live `/demo`; `evidence/polish-2/live-demo-mobile.png`. |
| F-2-6 | Added README deployment handoff instructions for `dist/site/` and the factory-owned work order. | README deployment section; `@claim:build-artifacts`; live `/`. |
| F-2-7 | Replaced the unexplained abbreviation with “automated build.” | README copy audit; `@claim:stdout-json`; live `/`. |

## Verification

- Fresh clone: every literal command in `.factory/claims.json` was run separately.
- Combined suite: `npm test`.
- Release checks: `npm run build`, `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo package --locked`.
- Browser/accessibility/privacy: Playwright route, keyboard, mobile, reset, network/storage, metadata, reduced-motion, and Axe checks.
- Offline is not a product claim and the product has no service worker, so no offline acceptance claim applies.
