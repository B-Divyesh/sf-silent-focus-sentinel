# Adversarial first-read review 2

## Verdict: FAIL

Reviewed commit `9679985bca27c061cb1f14f1c93ef829ca7f9bd7` on 2026-08-29 against <https://silent-focus-sentinel.sociobot.in>, fresh Chromium contexts at 390×844 and 1440×900, and clean clone `/tmp/sfs-review2-clean-3cPeh7`.

The first screen, browser demo, CLI behavior, privacy checks, accessibility checks, and all 22 listed claim commands pass. The product still has seven findings. One is blocking: the CLI-specific landing artifact is a hand-authored terminal transcript, not a recording of the real binary as required. Two public promises are absent from `.factory/claims.json`, and the public `?demo=1` URL returns landing metadata to clients that do not run JavaScript.

## Cold first read, before scrolling

### 390×844

- What it does: flags empty text in a developer-scripted iOS check.
- Who it is for: iOS teams comparing XCTest labels and values.
- What to click first: **Try it with sample data**; the next line says **Loads a finished report**.

Exact first-screen text: “Flag empty text in scripted iOS checks”, “For iOS teams comparing labels and values in an app-defined XCTest order”, and “Try it with sample data”. All three questions are answerable without scrolling.

### 1440×900

- What it does: flags empty label/value text in scripted iOS checks.
- Who it is for: iOS teams.
- What to click first: **Try it with sample data**.

The first action and its result remain visible before scrolling. The desktop image caption also explains the aqua/coral encoding.

Result: the first-read gate passes at both widths.

## Findings

### F-2-1 — BLOCKING — the CLI landing demo is a hand-authored transcript, not a recording of the real binary

- Exact location: `site/src/main.ts:55`, `<div class="terminal" aria-label="Terminal recording transcript">`; `.factory/design.md` identifies the terminal scene as “hand-made in HTML/CSS/SVG”.
- Evidence: there is no self-hosted asciinema or SVG recording asset in `site/` or `dist/site/`. The panel is static HTML assembled in `home()`. I independently installed commit `9679985b` with the displayed Git command and ran `silent-focus-sentinel demo`; the real command works, but that does not turn the hand-authored panel into a recording.
- Why this matters: this is a CLI product. The supplied CLI demo contract requires the landing page to show the real binary running the bundled input, with a self-hosted recording and an accessible transcript. A manually copied result can drift while still looking authoritative.
- Concrete fix: capture the installed binary running `silent-focus-sentinel demo` against the bundled sample, ship the recording locally as asciinema/SVG, and retain a text transcript as its accessible alternative. Add a build/test assertion that the recording’s command and reported outcomes match the current demo fixture.

### F-2-2 — High — “Loads a finished report” is an unlisted claim

- Exact quote/location: landing first screen, `site/src/main.ts:49`: “Loads a finished report”.
- Evidence: `.factory/claims.json` has no browser-demo-ready claim. `@claim:demo-isolation` clicks the action but asserts only the URL, reset, and preservation of a seeded storage key. An untagged site test checks “2 findings”, but the claims contract requires the promise to have its own listed, exactly tagged test.
- Why this matters: this sentence is the result promised beside the primary action. A first-time visitor relies on it to decide whether the demo is worth opening.
- Concrete fix: add `browser-demo-ready` to `.factory/claims.json`. Its tagged test should click the primary action at 390×844 and assert the persistent demo banner, seven realistic elements, two findings, and a visible result on the first resulting screen. It should also reset after changing observable demo state.

### F-2-3 — High — the public demo entry serves landing-page metadata until JavaScript runs

- Exact location: all primary demo links and README use `/?demo=1` (`site/src/main.ts:31,42,49`; `README.md:19`), while `site/scripts/postbuild.mjs` prerenders only `/demo`.
- Evidence: a raw GET of `https://silent-focus-sentinel.sociobot.in/?demo=1` returns `<title>Silent Focus Sentinel — flag empty iOS text</title>`, the landing description, landing canonical, and landing Open Graph fields. Chromium later changes them to “Demo — Silent Focus Sentinel”. A raw GET of `/demo` has the correct demo metadata.
- Why this matters: link unfurlers and non-JavaScript clients following the product’s actual demo URL describe and canonicalize it as the landing page. The metadata fix from round 1 does not cover the URL now used by the CTA, README, and verifier.
- Concrete fix: point all public demo links to `/demo` and retain `?demo=1` only as an optional alias, or serve route-specific raw HTML for the query entry. Add a raw-response test for the exact href used by the primary action.

### F-2-4 — Medium — the WCAG boundary is an unlisted claim and uses an unexplained acronym

- Exact quotes/locations: landing `site/src/main.ts:66` and `README.md:9`: “It does not certify WCAG conformance.”
- Evidence: no `.factory/claims.json` entry names non-certification. `public-xctest-helper` covers public XCTest fields and absence of VoiceOver observation; its test does not check conformance output or wording.
- Why this matters: this is a useful product boundary that accessibility teams may rely on. Under the supplied claims rule it needs a listed test, and under the plain-words rule the acronym should be expanded on first use.
- Concrete fix: write **“It does not certify Web Content Accessibility Guidelines (WCAG) conformance.”** Add a `no-wcag-certification` claim whose test checks CLI help, JSON/HTML reports, and the site never presents a WCAG pass or certification result.

### F-2-5 — Medium — the CLI demo’s opening sentence uses a competing term

- Exact quote/location: demo first screen, `site/src/main.ts:71`: “Seven elements show empty text, duplicate text, and one intentional ignore.”
- Evidence: `.factory/copy-audit.md` chooses **ignored element** as the one term. The same demo later says “The decorative separator is ignored.”
- Why this slows the first read: “intentional ignore” reads like an operation or rule, while the UI state and documented concept are an ignored element.
- Concrete fix: **“Seven elements include one empty-text finding, one duplicate-text finding, and one ignored decorative element.”**

### F-2-6 — Minor — the README does not explain deployment

- Exact location: `README.md:115-125` documents verification and output paths, then stops at “the factory owns registry publishing.” There is no deployment section for the static site.
- Evidence: the repository contract requires the README to explain how to run, test, and deploy. The README explains run/test/build, but not what deployable directory to publish or that infrastructure deployment is intentionally factory-owned.
- Why this matters: a new maintainer can produce `dist/site/` but cannot tell from the README what constitutes a supported deployment handoff.
- Concrete fix: add a **Deploy** section stating that `npm run build` produces the static artifact in `dist/site/`, that the factory publishes that directory, and that this repository must not change DNS, billing, or infrastructure.

### F-2-7 — Minor — the README uses “CI” without saying what it means

- Exact quote/location: `README.md:87`: “Omit `--json` to print the JSON report to standard output for CI.”
- Why this fails the plain-words rule: “CI” is avoidable shorthand in an otherwise direct instruction.
- Concrete fix: **“Omit `--json` to print the JSON report for an automated build.”**

## Landing-page copy audit

Counts cover every visible prose sentence plus headings, actions, facts, status messages, and navigation labels. Commands, paths, row numbers, identifiers, and sample field values are interface data rather than sentences. No landing sentence exceeds 22 words, no banned marketing word appears, and every button names a result. The WCAG acronym is flagged in F-2-4.

| Location | Exact copy | Words | Flag |
| --- | --- | ---: | --- |
| Skip link | Skip to content | 3 | — |
| Wordmark | Silent Focus Sentinel | 3 | — |
| Header navigation | Demo · Install · Privacy | 3 | — |
| Hero label | Local iOS accessibility check | 4 | — |
| H1 | Flag empty text in scripted iOS checks | 7 | — |
| Hero sentence | For iOS teams comparing labels and values in an app-defined XCTest order. | 12 | — |
| Primary action | Try it with sample data | 5 | — |
| Action result | Loads a finished report | 4 | F-2-2 |
| Plain facts | No upload · Works without an account · MIT licensed | 8 | — |
| Image alternative | A luminous sequence of check points with one coral gap. | 10 | — |
| Figure sentence | Aqua marks populated text. | 4 | — |
| Figure sentence | Coral marks empty label/value text. | 5 | — |
| Preview label | Sample run · Checkout | 3 | — |
| Preview H2 | Sample elements and findings | 4 | — |
| Preview result | 2 findings | 2 | — |
| Preview states | Populated · Empty · Duplicate · Ignored | 4 | — |
| Preview link | Open the full sample report | 5 | — |
| Workflow label | Three commands | 2 | — |
| Workflow H2 | How the CLI checks a scripted run | 7 | — |
| Step H3 | Mark each element | 3 | — |
| Step sentence | Use the XCTest helper in your app-defined order. | 8 | — |
| Step H3 | Extract the text | 3 | — |
| Step sentence | Run xcodebuild and collect each marked label and value. | 9 | — |
| Step H3 | Review the findings | 3 | — |
| Step sentence | Compare empty or duplicate text with your baseline. | 8 | — |
| Demo label | Bundled sample | 2 | — |
| Demo H2 | Run the bundled CLI demo | 5 | F-2-1 |
| Demo sentence | The demo copies a checkout trace into a new temporary directory. | 11 | — |
| Demo sentence | It writes both report formats there. | 6 | — |
| Terminal title | sentinel — demo | 2 | F-2-1 |
| Terminal sentence | Demo — sample data, nothing was saved outside this temporary directory. | 10 | F-2-1 |
| Terminal results | 1 empty text finding · 1 duplicate text finding · 1 decorative element ignored | 12 | F-2-1 |
| Boundary label | Clear boundaries | 2 | — |
| Boundary H2 | Know what the check measures | 6 | — |
| Boundary sentence | The helper reads each selected element's public XCTest label and string value. | 11 | — |
| Boundary sentence | It does not observe the VoiceOver cursor, speech, traits, or hints. | 11 | — |
| Boundary sentence | It does not certify WCAG conformance. | 6 | F-2-4 |
| Boundary instruction | Ignore an intentional decorative element with `ignored: true`. | 8 | — |
| Install label | Rust 1.85+ | 2 | — |
| Install H2 | Install one local binary | 4 | — |
| Install action | Copy install command | 3 | — |
| Install success | Install command copied | 3 | — |
| Install fallback | Select and copy the command | 5 | — |
| Install sentence | Run every command without an account or runtime service. | 9 | — |
| Footer sentence | Local checks for empty or duplicate label/value text. | 8 | — |
| Footer navigation | Privacy · Terms · Built by Param Factory · external site | 8 | — |
| Build label | v0.1.0 · build 2026.08.29 | 3 | — |

## README copy audit

Fenced commands and JSON are executable data, not sentences. Every prose sentence and heading is listed. No sentence exceeds 22 words and no banned marketing adjective appears. Necessary product terms such as XCTest, JSON, HTML, and CLI match the intended iOS engineering audience. The avoidable acronyms are flagged below.

| Line | Type | Exact copy | Words | Flag |
| ---: | --- | --- | ---: | --- |
| 1 | H1 | Silent Focus Sentinel | 3 | — |
| 3 | Sentence | Flag empty or duplicate label/value text in scripted iOS accessibility checks. | 11 | — |
| 5 | Sentence | Silent Focus Sentinel is a local command-line tool for iOS teams. | 11 | — |
| 5 | Sentence | Your XCTest chooses the elements and their order. | 8 | — |
| 7 | Sentence | The helper reads each element's public XCTest label and string value. | 11 | — |
| 7 | Sentence | The CLI writes JSON and HTML findings. | 7 | — |
| 9 | Sentence | It does not observe the VoiceOver cursor, speech, traits, or hints. | 11 | — |
| 9 | Sentence | It does not certify WCAG conformance. | 6 | F-2-4 |
| 11 | H2 | Try the bundled demo | 4 | — |
| 17 | Sentence | The command creates a new operating-system temporary directory. | 8 | — |
| 17 | Sentence | It copies the bundled checkout trace and writes both report formats there. | 12 | — |
| 19 | Sentence | Nothing is added to or changed in your project directory. | 10 | — |
| 19 | Sentence | The browser demo opens at https://silent-focus-sentinel.sociobot.in/?demo=1. | 6 | F-2-3 |
| 21 | H2 | Install | 1 | — |
| 23 | Sentence | Build the single binary with Rust 1.85 or newer. | 9 | — |
| 30 | Sentence | Every command runs without an account, credentials, or runtime service. | 10 | — |
| 32 | H2 | Extract marked XCTest output | 4 | — |
| 34 | Sentence | Copy examples/ios/SilentFocusSentinelXCTest.swift into your UI-test target. | 6 | — |
| 36 | Sentence | Choose an explicit element order as shown in examples/ios/CheckoutFocusTraversalTests.swift. | 9 | — |
| 38 | Sentence | Each SilentFocusSentinel.record(...) call prints one marked SFS_EVENT: line with the element's current label/value text. | 14 | — |
| 48 | Sentence | record-xctest starts xcodebuild test. | 4 | — |
| 48 | Sentence | It extracts marked lines from the command output and saves a trace JSON file. | 14 | — |
| 50 | Sentence | XCTest does not expose the VoiceOver cursor or speech. | 9 | — |
| 50 | Sentence | Your test chooses the elements; this tool does not validate VoiceOver navigation. | 12 | — |
| 52 | H2 | Record another scripted check | 4 | — |
| 54 | Sentence | Your runner prints one JSON object per element. | 8 | — |
| 54 | Sentence | Each line needs id, role, and text. | 7 | — |
| 56 | Sentence | The optional fields are label, value, hint, and ignored. | 9 | — |
| 63 | Instruction | Capture and analyze it | 4 | — |
| 76 | Sentence | record accepts a command that emits JSON Lines. | 8 | — |
| 76 | Sentence | A failed runner returns exit code 2 and leaves no output trace. | 12 | — |
| 78 | H2 | Compare a baseline | 3 | — |
| 87 | Sentence | The report marks new and resolved findings. | 7 | — |
| 87 | Sentence | Omit --json to print the JSON report to standard output for CI. | 12 | F-2-7 |
| 89 | Sentence | Every report path must differ from each input path. | 9 | — |
| 89 | Sentence | The JSON and HTML paths must also differ. | 8 | — |
| 91 | Sentence | The CLI rejects a collision before writing anything. | 8 | — |
| 93 | H2 | Event format | 2 | — |
| 99 | Sentence | An empty finding means trimmed text is empty. | 8 | — |
| 99 | Sentence | A duplicate finding means normalized text matches the previous non-ignored element. | 11 | — |
| 101 | Instruction | Set ignored: true for an intentional decorative or non-focusable element. | 10 | — |
| 103 | H2 | Regression accuracy | 2 | — |
| 105 | Sentence | examples/regression-suite.json covers 30 cases across labels, values, whitespace, hints, roles, dynamic text, and ignored elements. | 15 | — |
| 107 | Sentence | The suite detects at least 90% of intentional empty-text cases. | 10 | — |
| 107 | Sentence | It keeps the empty-text false-positive rate below 10%. | 8 | — |
| 109 | H2 | Exit codes | 2 | — |
| 111 | List sentence | 0: the command completed and did not meet the selected failure threshold. | 12 | — |
| 112 | List sentence | 1: findings or regressions met --fail-on. | 6 | — |
| 113 | List sentence | 2: arguments, input, events, output paths, or a runner failed. | 10 | — |
| 115 | H2 | Develop and verify | 3 | F-2-6 |
| 123 | Sentence | npm run build creates the release binary at target/release/silent-focus-sentinel. | 9 | — |
| 125 | Sentence | It creates the static site in dist/site/. | 7 | F-2-6 |
| 125 | Sentence | Package with cargo package --allow-dirty; the factory owns registry publishing. | 10 | — |
| 127 | H2 | Privacy | 1 | — |
| 129 | Sentence | The CLI reads and writes local files only. | 8 | — |
| 129 | Sentence | It has no telemetry and makes no network requests. | 9 | — |
| 131 | Sentence | The static site stores no data. | 6 | — |
| 131 | Sentence | It loads no third-party scripts, fonts, or analytics. | 8 | — |
| 133 | Instruction | See Privacy and Terms. | 4 | — |
| 135 | H2 | License | 1 | — |
| 137 | Sentence | MIT. | 1 | — |
| 137 | Instruction | See LICENSE. | 2 | — |

## Demo and sandbox verification

- The first-screen action enters `/?demo=1` in one click.
- At 390×844, the resulting first screen shows the demo banner, “Two elements need review”, and “2 findings”. The full report contains seven realistic checkout elements.
- The persistent banner says “Demo — sample data, nothing is saved” and provides **Reset demo** and **Start for real**.
- Reset re-renders the original sample, clears the download status, and returns focus to Reset demo.
- Start for real opens `/#install`.
- A seeded `real:marker` localStorage value survives entry and reset. The demo creates no cookie, localStorage, or sessionStorage entry.
- The live request log contains only the site document, image, JavaScript, CSS, and self-hosted font from the same origin.
- The product makes no offline claim and registers no service worker, so an offline claim check is not applicable.
- The downloaded JSON has schema version 1 and seven elements.
- From an unrelated empty temporary directory, the Git-installed CLI demo left the working directory empty and wrote JSON and HTML under one new `/tmp/silent-focus-sentinel-demo-*` directory.

Result: the one-click browser sandbox and CLI command work. F-2-1 is the missing CLI-specific recording artifact; F-2-2 is the missing formal claim for the browser result.

## Claims verification

I cloned the reviewed commit with `git clone --no-hardlinks /work/repo /tmp/sfs-review2-clean-3cPeh7`, ran `npm ci`, and ran every literal `test` field from `.factory/claims.json` separately. All 22 commands exited 0.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `find-empty-text` | PASS | Empty finding identifies `checkout.promo`. |
| `find-duplicate-text` | PASS | Adjacent duplicate identifies `checkout.total-value`. |
| `local-only` | PASS | Requested reports exist only at local output paths. |
| `json-html` | PASS | JSON parses; standalone HTML contains the finding and no script/external URL. |
| `decorative-ignore` | PASS | The ignored separator is absent from findings. |
| `record-command` | PASS | Two JSON Lines retain order and text. |
| `xctest-extraction` | PASS | Only marked fixture lines are extracted in order. |
| `diff-regressions` | PASS | New and resolved findings are both reported. |
| `sample-download` | PASS | Browser download has schema 1 and seven elements. |
| `open-source` | PASS | Cargo metadata and full MIT grant agree. |
| `safe-output-paths` | PASS | All tested input/report collisions exit 2 without changing inputs. |
| `exit-codes` | PASS | Observable success, threshold, and malformed-input paths return 0, 1, and 2. |
| `failed-runner` | PASS | Failed runner exits 2 and creates no trace. |
| `single-binary` | PASS | Rust 1.85 is declared and one executable is built. |
| `public-xctest-helper` | PASS | Source uses XCTest label/value fields and no forbidden private accessibility identifier. |
| `stdout-json` | PASS | Analyze and diff stdout parse as JSON when `--json` is omitted. |
| `demo-isolation` | PASS | Seeded project hashes remain unchanged; output uses a new temporary parent; real browser storage survives. |
| `accuracy-suite` | PASS | The 30-case fixture meets the stated true-positive and false-positive thresholds. |
| `accountless-run` | PASS | Every command runs in a credential-free environment. |
| `no-telemetry` | PASS | Every subcommand produces zero connections through the recording denying proxy. |
| `site-private` | PASS | Six fresh route contexts use only same-origin resources and empty browser storage. |
| `build-artifacts` | PASS | Release binary and routed static outputs exist. |

Unlisted claims: F-2-2 and F-2-4. Because unlisted claims remain, the claims gate is not complete even though every listed command passes.

## Full build and independent checks

From the clean clone:

- `npm test`: PASS — 6 Rust tests and 37 Playwright tests.
- `npm run build`: PASS — `target/release/silent-focus-sentinel` and `dist/site/` produced.
- `npm run verify:live -- https://silent-focus-sentinel.sociobot.in`: PASS — `routes=6 axe=0 storage=0 outsideRequests=0`.
- `cargo fmt --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `cargo package --locked`: PASS — 15 files, 53.3 KiB unpacked.
- Exact landing install command with a fresh Cargo root: PASS; it installed commit `9679985b` and the installed demo completed.
- Production bundle: 12.66 KiB JavaScript raw / 4.77 KiB gzip; 12.21 KiB CSS raw / 3.60 KiB gzip; 13.28 KiB font; 33.42 KiB hero image.
- Live `index.html`, JavaScript, CSS, font, hero, OG card, `/demo`, `/privacy`, `/terms`, and `404.html` match the clean build byte for byte.

## History verification

Every finding in `.factory/review-1.md` was checked against both live behavior and current code. The exact earlier defects are fixed; none is repeated under its old ID.

| Earlier finding | Current result | Verification |
| --- | --- | --- |
| F-1-1 VoiceOver overclaim | FIXED | Live H1 and README say label/value text in caller-selected checks; boundaries deny VoiceOver observation. |
| F-1-2 overbroad XCTest claim/test | FIXED | Claim is narrowed to extraction of marked lines; test mixes marked and unmarked fixture output. |
| F-1-3 invalid `--json` instruction | FIXED | README says omit `--json`; `@claim:stdout-json` parses analyze and diff stdout. |
| F-1-4 demo isolation untested | FIXED | `@claim:demo-isolation` checks filesystem and browser real-storage preservation. |
| F-1-5 deep-route raw metadata | FIXED for the named `/demo`, `/privacy`, `/terms`, and 404 routes | Raw files have route-specific title, description, canonical, OG, and Twitter fields. F-2-3 is a new gap on the subsequently adopted `?demo=1` public entry. |
| F-1-6 accuracy target unvalidated | FIXED | `examples/regression-suite.json` has 30 cases; tagged rate assertions pass. |
| F-1-7 accountless promise unlisted | FIXED | `accountless-run` exercises every subcommand without credentials. |
| F-1-8 telemetry promise unlisted | FIXED | `no-telemetry` covers every subcommand. |
| F-1-9 site privacy unlisted | FIXED | `site-private` covers all routes, origins, cookies, and browser storage. |
| F-1-10 build artifacts unlisted | FIXED | `build-artifacts` checks the binary and routed static output. |
| F-1-11 competing terms | FIXED on the landing and README | Public copy uses label/value text, empty text, duplicate text, ignored element, and finding. F-2-5 is confined to the demo’s new “intentional ignore” wording. |
| F-1-12 metaphor heading/caption | FIXED | Live copy says “Sample elements and findings” and states the literal color mapping. |
| F-1-13 vague workflow heading | FIXED | Live H2 is “How the CLI checks a scripted run”. |
| F-1-14 inaccurate setup heading | FIXED | Live H2 is “Run the bundled CLI demo”. |
| F-1-15 generic Copy button | FIXED | Visible action and success state name the install command. |
| F-1-16 long/vague README overview | FIXED | The overview is split, concrete, and under 22 words per sentence. |
| F-1-17 long XCTest boundary | FIXED | Two short sentences distinguish test selection from VoiceOver. |
| F-1-18 long announcement explanation | FIXED | README defines the `text` field and empty result directly. |
| F-1-19 “real”/“regular” qualifiers | FIXED | Those qualifiers are absent from the public instructions. |
| F-1-20 metaphorical 404 copy | FIXED | The live 404 says the page does not exist and offers Return home. |

The prior polish and handoff both claimed no gaps. Their functional evidence still reproduces, but the current full review finds the new/incomplete items F-2-1 through F-2-7.

## Structure, routing, accessibility, and links

- Runtime titles follow the required pattern on `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, and the 404. F-2-3 covers the raw query-entry exception.
- Each rendered route has `lang=en`, one `main`, one H1, ordered headings, a description, canonical, OG/Twitter data, favicon, apple-touch icon, and theme color.
- Unknown paths return HTTP 404 with the designed page and Return home action.
- History navigation restores the previous scroll position and focuses/announces the destination H1. Hash navigation reaches `#install`.
- All crawled internal routes/assets return 200 except the intentional unknown path, which returns 404. The GitHub repository and Param Factory links return 200. No dead link was found.
- The consistent header has wordmark, Demo, Install, Privacy, and a skip link. Every footer has the product description, Privacy, Terms, Param Factory, version, and build date.
- Axe reports zero violations on all six checked routes at phone and desktop sizes. Valid pages have no console or page errors. The expected failed-document console entry appears only for the intentional HTTP 404.
- Visible mobile controls meet the 44×44 target; focus rings are visible; reduced motion disables the trace animation; no tested route has horizontal overflow.
- The navy observation field, aqua/coral trace rail, clipped panels, generated landscape, and restrained pulse are specific to this product and match `.factory/design.md`. The site does not resemble a generic centered gradient/card template.
- The catalog description is 74 visible characters, starts with “Flag”, and contains no banned marketing word.

## Missed leverage

No AI feature is warranted. Empty/duplicate detection is deterministic, auditable, and works without a runtime service; model output would not improve the core job. JSON/JSONL input, JSON/HTML output, browser download, and baseline diff cover the obvious import/export need. Sync would conflict with the local-only brief. No provider key or decorative AI feature is present.

The missed leverage is the verifiable CLI recording in F-2-1, not an AI or sync feature.

## What would make this perfect

Ship a self-hosted recording made from the real CLI demo, list and test the browser-ready and WCAG-boundary promises, make `/demo` the public metadata-correct demo URL, standardize “ignored element”, spell out the avoidable CI abbreviation, and document the supported deployment handoff. Then rerun every claim command and this complete live review from fresh contexts. At that point there should be no remaining finding of any severity and no untested claim.
