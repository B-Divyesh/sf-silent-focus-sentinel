# Adversarial first-read review 1

## Verdict: FAIL

Reviewed commit `c4210f2d162b3ff0a42e74abc537b2c7aeba5495` on 2026-08-29 against the live site at `https://silent-focus-sentinel.sociobot.in`, fresh Chromium contexts at 390×844 and 1440×900, and a clean local clone.

The first screen and demo are clear and usable, but the central VoiceOver wording is broader than the implementation, and the XCTest claim is not exercised by its declared test. Those are blocking. The review also found one false README instruction, route metadata defects, unlisted claims, and copy that fails the supplied plain-words rules.

## Cold first read, before scrolling

### 390×844

- What I think it does: checks a scripted iOS accessibility focus run and reports silent VoiceOver stops.
- Who it is for: iOS teams testing before release.
- What I should click first: **Try it with sample data**; the adjacent text says it loads a finished focus report.

### 1440×900

- What I think it does: catches silent VoiceOver focus stops in a scripted run.
- Who it is for: iOS teams.
- What I should click first: **Try it with sample data**.

Result: the first-read layout passes the three-question gate at both widths. The exact first-screen text was “Catch silent VoiceOver focus stops”, “For iOS teams checking a scripted focus run before confusing silence reaches users”, and “Try it with sample data”. F-1-1 explains why the stated job is still too broad for what the code observes.

## Findings

### F-1-1 — BLOCKING — the product calls derived label/value text a VoiceOver focus stop

- Exact quote/location: landing H1, `site/src/main.ts:57`: “Catch silent VoiceOver focus stops”; README line 3: “Catch silent VoiceOver focus stops before release.”
- Evidence: `examples/ios/SilentFocusSentinelXCTest.swift` records a caller-selected `XCUIElement` sequence and derives `announcement` from only `element.label` and a string `element.value`. It does not run or observe the VoiceOver cursor, speech, traits, or hints. The README later admits that “XCTest does not expose the private VoiceOver cursor”. A control with empty label/value can still have a spoken trait such as “button”, while an element in the scripted list may not be a VoiceOver focus stop at all.
- Why this misleads: a first-time iOS engineer can reasonably read the headline as validation of actual VoiceOver navigation and output. The product currently detects empty or adjacent duplicate label/value snapshots in a developer-defined order.
- Concrete fix: either add a supported integration that observes the actual assistive-technology traversal and speech, or narrow all public copy and claim IDs. Suggested headline: **“Flag empty text in scripted iOS accessibility checks”**. Suggested supporting sentence: **“For iOS teams comparing labels and values in an app-defined XCTest order.”** Call the derived field “label/value text”, not a VoiceOver announcement.

### F-1-2 — BLOCKING — `xctest-capture` passes without compiling or running an XCTest traversal

- Exact claim/location: `.factory/claims.json:8`: “Records a scripted iOS Simulator XCTest traversal.”
- Exact test/location: `tests/claims.spec.ts:67-88` writes a shell executable named `xcodebuild`; that script prints two prebuilt `SFS_EVENT` lines. The test then checks only Rust-side extraction.
- Evidence: the exact manifest command passes, but no Swift file is compiled, no sample app is launched, no `XCUIElement` is read, and no iOS Simulator traversal runs. String-presence assertions do not prove the public claim.
- Why this misleads: the only test attached to the real capture claim can pass when the Swift helper does not compile or work in Xcode. This leaves a listed claim untested, which blocks a PASS under the supplied claims contract.
- Concrete fix: run a small sample app and the shipped UI test on a macOS CI worker, then assert the resulting trace. If that cannot be part of the claim gate, narrow the claim to **“Extracts marked `SFS_EVENT` lines from xcodebuild output”** and remove Simulator/VoiceOver capture language that the sandbox does not prove.

### F-1-3 — High — the README gives an invalid `--json` instruction

- Exact quote/location: README line 81: “`--json` also prints the report to standard output when no file is given, so CI can parse it.”
- Evidence: running `silent-focus-sentinel diff ... --json` exits 2 with `a value is required for '--json <JSON>'`. JSON is printed to standard output only when the `--json` option is omitted.
- Why this misleads: a user following the sentence gets an argument error instead of a CI-readable report.
- Concrete fix: **“When you omit `--json`, the CLI prints the JSON report to standard output for CI.”** Add a tagged claim test for this documented behavior.

### F-1-4 — High — demo filesystem isolation is public copy without a matching assertion

- Exact quotes/location: README line 15: “The command creates an isolated temporary directory” and “Nothing is saved to your project”; landing `site/src/main.ts:63-66`: “nothing was saved outside this temporary directory.”
- Evidence: manual execution from an empty temporary working directory left that directory empty and wrote both reports under `/tmp/silent-focus-sentinel-demo-…`. However, no claim entry states project-directory isolation, and `@claim:local-only` checks network use but does not compare the working tree before and after `demo`.
- Why this matters: protecting real project data is part of the demo sandbox contract and should not depend on a manual inspection.
- Concrete fix: add `demo-isolation` to `claims.json`; run the binary from a seeded temporary project, assert every seed hash is unchanged, assert no new project files, and validate both reported paths are inside a new OS temporary directory.

### F-1-5 — Medium — deep-link HTML serves root metadata until JavaScript runs

- Exact location: `site/scripts/postbuild.mjs:3-6` copies the same root `index.html` to `/demo`, `/privacy`, `/terms`, and `/404.html`.
- Evidence: raw responses for `/demo`, `/privacy`, `/terms`, and an unknown path all contain the root title, root description, root canonical, and root Open Graph text. JavaScript later updates only `<title>`, description, and canonical; Open Graph metadata remains the landing metadata even after render.
- Why this misleads: link unfurlers and non-JavaScript crawlers see every deep link as the landing page. A shared `/privacy` link advertises “catch silent focus stops” and canonicals to `/`.
- Concrete fix: prerender route-specific HTML with the route title, description, canonical, Open Graph title/description/image, and Twitter fields. Keep the existing client-side updates for History API navigation.

### F-1-6 — Medium — the brief’s accuracy target has no representative regression suite

- Exact location: `.factory/brief.json` requires at least 90% detection of intentional empty stops with fewer than 10% false positives.
- Evidence: the only seeded product fixture has one intentional empty stop and one duplicate. The unit test establishes 1/1 detection for that single case, not performance across varied app controls and accessibility values. The existing handoff also records this gap.
- Why this matters: one hand-authored positive example cannot establish that the detector is dependable enough for a release gate.
- Concrete fix: add a versioned fixture suite with enough positive and negative cases to make both rates meaningful, including whitespace, values, hints, traits, ignored nodes, dynamic labels, and non-focusable elements. Compute and assert both percentages.

### F-1-7 — Medium — the no-account/runtime-service promise is unlisted

- Exact quote/location: landing `site/src/main.ts:75`: “No account or runtime service is required”; README line 28 adds “No account, network request, or runtime service is required.”
- Evidence: no `claims.json` entry states or tests the absence of account setup or a runtime service.
- Why this matters: this is a concrete adoption promise, not descriptive filler.
- Concrete fix: add a claim such as `accountless-run` and test the installed CLI in a clean environment with no credentials or service configuration, or remove the promise.

### F-1-8 — Medium — “It has no telemetry” is an unlisted claim

- Exact quote/location: README line 113.
- Evidence: `@claim:local-only` records network connections during `demo`, but the manifest claim is only “Keeps traces on your machine”; no entry names the telemetry promise.
- Why this matters: users may rely on the explicit privacy guarantee beyond one command path.
- Concrete fix: add a `no-telemetry` claim covering all CLI subcommands with a denying proxy/socket monitor, or fold the exact telemetry sentence into a clearly scoped privacy claim and test.

### F-1-9 — Medium — the static-site privacy sentence is not listed as a claim

- Exact quote/location: README line 113: “The static site stores no data and loads no third-party scripts, fonts, or analytics.”
- Evidence: the fresh live demo request/storage log supports the sentence, but no `claims.json` entry states it. `local-only` refers to traces on the user’s machine, which is a different promise.
- Why this matters: the claims manifest is incomplete even though the observed behavior is currently good.
- Concrete fix: add `site-private` with a fresh-context request log, cookie/localStorage/sessionStorage assertions, and a resource-origin assertion across every route.

### F-1-10 — Medium — documented build artifacts are unlisted claims

- Exact quotes/location: README line 107: “`npm run build` builds the release binary and the static site”, “Site output lands in `dist/site/`”, and “The release binary is `target/release/silent-focus-sentinel`.”
- Evidence: the build currently satisfies all three, but no claim entry owns the complete build-output contract.
- Why this matters: these are instructions a maintainer or deployment worker will rely on.
- Concrete fix: add one `build-artifacts` entry whose test starts clean, runs the documented build, and asserts the two output locations.

### F-1-11 — Minor — the same concepts use competing terms

- Exact locations: landing uses “silence”, “silent”, “empty speech”, “repeated speech”, “repeated”, “duplicate”, “issues”, and “findings”; README uses “focus events”, “focus stops”, “empty announcements”, and “repeated announcements”. This conflicts with `.factory/copy-audit.md`, which selects “focus stop”, “announcement”, and “finding”.
- Why this slows the first read: a user must infer whether silence versus empty and repeated versus duplicate are distinct states.
- Concrete fix: use **focus stop**, **empty announcement**, **duplicate announcement**, and **finding** everywhere. For example, change “Find empty speech and repeated adjacent announcements” to **“Find empty and adjacent duplicate announcements.”**

### F-1-12 — Minor — the landing uses metaphor where labels should explain the report

- Exact quotes/location: `site/src/main.ts:48,58`: “See the silence in sequence” and “Silence leaves a coral void.”
- Why this fails the copy rule: neither phrase names the section or explains what the color means in product terms.
- Concrete fix: heading **“Sample focus stops and findings”**; caption **“Aqua marks clear stops. Coral marks an empty announcement.”**

### F-1-13 — Minor — the workflow heading does not name the section plainly

- Exact quote/location: `site/src/main.ts:62`: “Move from swipe order to review.”
- Why this slows the first read: it is a process slogan, and “swipe order” overstates the caller-defined order noted in F-1-1.
- Concrete fix: **“How the CLI checks a focus run.”**

### F-1-14 — Minor — “Run it before setup” is vague and literally inaccurate for the CLI command

- Exact quote/location: `site/src/main.ts:63`.
- Why this misleads: the shown `silent-focus-sentinel demo` command requires a built or installed binary. The browser sample needs no setup, but that is not what the terminal panel shows.
- Concrete fix: **“Run the bundled CLI demo.”**

### F-1-15 — Minor — the visible copy button does not name its result

- Exact quote/location: `site/src/main.ts:75`: “Copy”.
- Why this fails the button rule: the accessible name is better, but sighted users only see a generic verb.
- Concrete fix: show **“Copy install command”** as the visible label; after success, use **“Install command copied.”**

### F-1-16 — Minor — README sentence exceeds 22 words and includes a vague adjective

- Exact quote/location: README line 5, 24 words: “It runs an XCTest traversal in an iOS Simulator, records ordered focus events, flags empty or repeated announcements, and writes review-ready JSON and HTML.”
- Why this fails the copy rule: it carries four actions, and “review-ready” is not measurable.
- Concrete fix: **“Run an XCTest traversal in an iOS Simulator. Record ordered focus stops, flag empty or duplicate text, and write JSON and HTML reports.”**

### F-1-17 — Minor — README sentence exceeds 22 words

- Exact quote/location: README line 44, 27 words: “XCTest does not expose the private VoiceOver cursor, so the test defines the intended swipe order explicitly and records the current labels and values at each stop.”
- Concrete fix: **“XCTest cannot read the private VoiceOver cursor. Define the intended order in the test, then record each stop’s current label and value.”**

### F-1-18 — Minor — README sentence exceeds 22 words

- Exact quote/location: README line 70, 27 words: “Do not pass a prewritten announcement: an element that regresses to an empty label and value is written as an empty announcement and is flagged by `analyze`.”
- Concrete fix: **“Do not pass a prewritten announcement. `analyze` flags an element when its current label and value are both empty.”**

### F-1-19 — Minor — the README uses uninformative “real” and “regular” qualifiers

- Exact quotes/location: README lines 34 and 44: “Run the real simulator capture path” and “saves a regular trace.”
- Why this fails the copy rule: “real” and “regular” do not tell the reader what changes or what format is produced.
- Concrete fix: **“Record an XCTest run”** and **“saves the events as a trace JSON file.”**

### F-1-20 — Minor — the designed 404 adds brand lore that carries no recovery information

- Exact quotes/location: `site/src/main.ts:87`: “FOCUS LEFT THE TRACE” and “The address points past the last known stop.”
- Why this fails the copy rule: the H1 and return link already explain the state; these two metaphor lines do not help recovery.
- Concrete fix: remove the eyebrow and use **“Check the address, or return to the home page.”**

## Demo and sandbox verification

- One click from the first screen opens `/demo`.
- At 390×844, the first screen already shows “Two stops need review”, “2 findings”, and the first realistic checkout row. Desktop does the same.
- The persistent banner says “Demo — sample data, nothing is saved” and contains Reset demo and Start for real.
- Reset reproduces the original seven-row trace and returns focus to Reset demo.
- Start for real opens `/#install`, where the install section is visible.
- A seeded `real:marker` localStorage key remained unchanged through entry, sample download, and reset. No cookies or session storage appeared.
- The live flow requested only the site document, image, JavaScript, CSS, and self-hosted font from the same origin. It made no API or third-party request.
- Running the built CLI `demo` from an empty temporary directory left that working directory empty and wrote JSON/HTML only under a new OS temporary directory.

Result: the demo itself works and keeps tested real data untouched. F-1-4 is a missing claim/test contract, not an observed isolation failure.

## Claims verification

Every literal `test` command in `.factory/claims.json` was run separately after `npm ci` in clean clone `/tmp/sfs-review1-clone-lob0UD`. Every command exited 0, and every claim ID occurs exactly once in `tests/claims.spec.ts`.

| Claim | Result | Review note |
| --- | --- | --- |
| `find-silent` | PASS | Proves an empty fixture field; does not prove actual VoiceOver silence (F-1-1). |
| `find-duplicate` | PASS | Finds the adjacent duplicate fixture. |
| `local-only` | PASS | Same-origin browser flow and proxy-monitored CLI demo. |
| `json-html` | PASS | Parses JSON and checks standalone HTML. |
| `decorative-ignore` | PASS | Ignored sample event produces no finding. |
| `record-command` | PASS | Captures ordered JSON Lines from a local command. |
| `xctest-capture` | PASS command / INADEQUATE proof | Uses fake `xcodebuild`; claim remains untested (F-1-2). |
| `diff-regressions` | PASS | Asserts both new and resolved findings. |
| `sample-download` | PASS | Valid schema and seven events. |
| `open-source` | PASS | Cargo metadata and MIT text. |
| `safe-output-paths` | PASS | Rejects tested collisions without changing input. |
| `exit-codes` | PASS | Asserts 0, 1, and 2. |
| `failed-runner` | PASS | Leaves no output trace. |
| `single-binary` | PASS | Declared Rust minimum and one release binary. |
| `public-xctest-helper` | PASS | Static source check only. |

Unlisted claims are F-1-4 and F-1-7 through F-1-10. The broad VoiceOver statement in F-1-1 is also absent from the narrower “Flags empty focus stops” claim wording.

## Landing-page copy audit

Counts use visible words. Commands, row indexes, and paths are interface data rather than sentences, but all user-facing headings, actions, labels, status text, and prose are included below. No landing sentence exceeds 22 words and no banned word appears.

| Location | Copy | Words | Flag |
| --- | --- | ---: | --- |
| Skip link | Skip to content | 3 | — |
| Wordmark | Silent Focus Sentinel | 3 | — |
| Header nav | Demo | 1 | — |
| Header nav | Install | 1 | — |
| Header nav | Privacy | 1 | — |
| Eyebrow | LOCAL iOS ACCESSIBILITY CHECK | 4 | — |
| H1 | Catch silent VoiceOver focus stops | 5 | F-1-1 |
| Hero sentence | For iOS teams checking a scripted focus run before confusing silence reaches users. | 13 | F-1-1, F-1-11 |
| Primary action | Try it with sample data | 5 | — |
| Action result | Loads a finished focus report | 5 | — |
| Fact | No upload | 2 | — |
| Fact | Runs locally | 2 | — |
| Fact | Free and open source | 4 | — |
| Image alternative | A glowing focus trail with one coral gap showing a silent stop. | 11 | F-1-1, F-1-12 |
| Figure caption | Clear stops glow aqua. | 4 | — |
| Figure caption | Silence leaves a coral void. | 5 | F-1-12 |
| Trace label | CURRENT RUN · CHECKOUT | 3 | — |
| H2 | See the silence in sequence | 5 | F-1-12 |
| Result | 2 findings | 2 | — |
| Trace row | Checkout, heading | 2 | — |
| Trace state | Clear | 1 | — |
| Trace row | Delivery address, 14 Oak Street, button | 6 | — |
| Trace state | Clear | 1 | — |
| Trace row | No announcement | 2 | F-1-11 |
| Trace state | Silent | 1 | F-1-11 |
| Trace row | Total, $42.00 | 2 | — |
| Trace state | Clear | 1 | — |
| Trace row | Total, $42.00 | 2 | — |
| Trace state | Repeated | 1 | F-1-11 |
| Trace row | Ignored decorative stop | 3 | — |
| Trace state | Ignored | 1 | — |
| Trace row | Pay now, button | 3 | — |
| Trace state | Clear | 1 | — |
| Link | Open the full sample report | 5 | — |
| Eyebrow | THREE COMMANDS | 2 | — |
| H2 | Move from swipe order to review | 6 | F-1-13 |
| H3 | Record the traversal | 3 | — |
| Sentence | Run the included XCTest helper in an iOS Simulator. | 9 | F-1-2 |
| H3 | Check each stop | 3 | — |
| Sentence | Find empty speech and repeated adjacent announcements. | 7 | F-1-11 |
| H3 | Compare the release | 3 | — |
| Sentence | Review new and resolved findings in CI. | 7 | — |
| Eyebrow | REAL BUNDLED SAMPLE | 3 | F-1-19 (“real”) |
| H2 | Run it before setup | 4 | F-1-14 |
| Sentence | The demo copies a checkout trace into a temporary directory. | 10 | F-1-4 |
| Sentence | It writes both report formats there. | 6 | F-1-4 |
| Terminal title | sentinel — demo | 2 | — |
| Terminal sentence | Demo — sample data, nothing was saved outside this temporary directory. | 10 | F-1-4 |
| Terminal result | 1 silent announcement | 3 | F-1-11 |
| Terminal result | 1 repeated announcement | 3 | F-1-11 |
| Terminal result | 1 decorative stop ignored | 4 | — |
| Eyebrow | CLEAR BOUNDARIES | 2 | — |
| H2 | Your test drives the simulator | 5 | — |
| Sentence | The included XCTest helper records each scripted stop. | 8 | F-1-2 |
| Sentence | It does not call private VoiceOver APIs. | 7 | — |
| Sentence | It checks silent and repeated speech. | 6 | F-1-11 |
| Sentence | It does not certify WCAG conformance. | 6 | — |
| Sentence | Set ignored: true for an intentional decorative stop. | 8 | — |
| Eyebrow | RUST 1.85+ | 2 | — |
| H2 | Install one local binary | 4 | — |
| Button | Copy | 1 | F-1-15 |
| Button accessible name | Copy install command | 3 | — |
| Sentence | No account or runtime service is required. | 7 | F-1-7 |
| Footer sentence | Local checks for silent VoiceOver focus stops. | 7 | F-1-1 |
| Footer link | Privacy | 1 | — |
| Footer link | Terms | 1 | — |
| Footer link | Built by Param Factory | 4 | — |
| Build | v0.1.0 · build 2026.08.28 | 3 | — |

## README copy audit

Fenced commands and JSON examples are executable data, not sentences. Headings and exit-code labels are audited after the prose table.

| Sentence | Words | Flag |
| --- | ---: | --- |
| Catch silent VoiceOver focus stops before release. | 7 | F-1-1 |
| Silent Focus Sentinel is a local command-line tool for iOS teams. | 11 | — |
| It runs an XCTest traversal in an iOS Simulator, records ordered focus events, flags empty or repeated announcements, and writes review-ready JSON and HTML. | 24 | F-1-11, F-1-16 |
| It does not control private VoiceOver APIs or certify WCAG conformance. | 11 | — |
| The included XCTest helper records an app-owned traversal using public XCTest APIs. | 12 | F-1-2 |
| The generic `record` command also accepts JSON Lines from another runner. | 11 | — |
| The command creates an isolated temporary directory. | 7 | F-1-4 |
| It copies the bundled checkout trace there and writes both reports. | 11 | F-1-4 |
| Nothing is saved to your project. | 6 | F-1-4 |
| The browser demo is at `https://silent-focus-sentinel.sociobot.in/demo`. | 8 | — |
| Build the single binary with Rust 1.85 or newer. | 9 | — |
| No account, network request, or runtime service is required. | 9 | F-1-7 |
| Copy `examples/ios/SilentFocusSentinelXCTest.swift` into your UI-test target, then make an explicit traversal like `examples/ios/CheckoutFocusTraversalTests.swift`. | 17 | — |
| Each `SilentFocusSentinel.record(...)` call writes an ordered `SFS_EVENT` JSON line to the XCTest log. | 13 | F-1-2 |
| Run the real simulator capture path. | 6 | F-1-19 |
| `record-xctest` runs `xcodebuild test`, extracts the helper’s marked events, and saves a regular trace. | 14 | F-1-19 |
| XCTest does not expose the private VoiceOver cursor, so the test defines the intended swipe order explicitly and records the current labels and values at each stop. | 27 | F-1-17 |
| Your runner prints one JSON object per focus stop. | 9 | — |
| Each line needs `id`, `role`, and `announcement`; `label`, `value`, `hint`, and `ignored` are optional. | 14 | — |
| Capture and analyze it. | 4 | — |
| `record` accepts a command that emits JSON Lines. | 8 | — |
| A non-zero runner exit is passed through as an error. | 10 | — |
| The XCTest helper derives each announcement from the element’s current accessibility label and value. | 14 | F-1-1 |
| Do not pass a prewritten announcement: an element that regresses to an empty label and value is written as an empty announcement and is flagged by `analyze`. | 27 | F-1-18 |
| The report marks new findings and resolved findings. | 8 | — |
| `--json` also prints the report to standard output when no file is given, so CI can parse it. | 18 | F-1-3 |
| For safety, every report path must differ from every input trace, and `--json` and `--html` must name different files. | 19 | — |
| The CLI rejects a collision before writing anything. | 8 | — |
| An event is silent when its trimmed `announcement` is empty. | 10 | F-1-11 |
| An event is duplicate when its normalized announcement matches the previous non-ignored focus stop. | 14 | F-1-11 |
| Set `ignored: true` for an intentional decorative stop. | 8 | — |
| `npm run build` builds the release binary and the static site. | 11 | F-1-10 |
| Site output lands in `dist/site/`. | 6 | F-1-10 |
| The release binary is `target/release/silent-focus-sentinel`. | 7 | F-1-10 |
| Package with `cargo package --allow-dirty`. | 5 | — |
| The factory owns registry publishing. | 5 | — |
| The CLI reads and writes local files only. | 8 | — |
| It has no telemetry. | 4 | F-1-8 |
| The static site stores no data and loads no third-party scripts, fonts, or analytics. | 14 | F-1-9 |
| See Privacy and Terms. | 4 | — |
| MIT. | 1 | — |
| See LICENSE. | 2 | — |

| Heading or label | Words | Flag |
| --- | ---: | --- |
| Silent Focus Sentinel | 3 | — |
| Try the bundled demo | 4 | — |
| Install | 1 | — |
| Record an iOS Simulator XCTest traversal | 6 | F-1-2 |
| Record another scripted traversal | 4 | — |
| Compare a baseline | 3 | — |
| Event format | 2 | — |
| Exit codes | 2 | — |
| `0`: command completed and the selected failure threshold was not met | 11 | — |
| `1`: findings or regressions met `--fail-on` | 6 | — |
| `2`: invalid arguments, unreadable input, malformed events, or a failed record command | 12 | — |
| Develop and verify | 3 | — |
| Privacy | 1 | — |
| License | 1 | — |

### Terminology to standardize

| Concept | Current competing words | Use everywhere |
| --- | --- | --- |
| Ordered target | focus event, focus stop, scripted stop | focus stop |
| Empty output | silence, silent, empty speech, empty announcement | empty announcement |
| Same adjacent output | repeated, repetition, duplicate | duplicate announcement |
| Analyzer result | issue, finding | finding |
| Captured value | VoiceOver announcement, speech, label/value | label/value text unless actual speech is observed |

## Structure, routing, accessibility, and links

- Runtime titles follow the required pattern on `/`, `/demo`, `/privacy`, `/terms`, and the 404. Each rendered route has one H1, one main landmark, `lang=en`, ordered headings, and a route-specific description/canonical after JavaScript runs.
- Unknown paths return HTTP 404 and render the designed page. F-1-20 concerns its copy, not its function.
- Back/forward restored the prior scroll position and focused the route H1. Hash navigation reached `#install`.
- Every crawled internal asset/route and both external links returned 200. `#main` and `#install` targets exist.
- Axe found zero violations on all five routes at mobile and desktop widths. No valid route logged a console or page error. The 404 produced only the expected failed-document resource message.
- Every visible link/button across the four valid mobile routes measured at least 44×44 CSS pixels. There was no horizontal overflow.
- The live assets include an SVG favicon, 180×180 apple-touch icon, 1200×630 OG image, robots, sitemap, and same-origin CSP/security headers.
- The visual identity is recognizably product-specific: the navy traversal field, aqua/coral trace rail, generated focus landscape, clipped panels, and restrained pulse match `.factory/design.md`. It does not read as a generic centered-gradient SaaS template.
- Production JavaScript is 11,752 bytes raw and 4,620 bytes gzip, below the supplied limit.
- F-1-5 remains the metadata failure for raw deep-link responses.

## History verification

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. The previous handoff has no numbered findings, but its two known limits were rechecked:

- Real Xcode/iOS Simulator execution remains absent: F-1-2.
- The broad 90% detection / under-10% false-positive target remains unvalidated: F-1-6.

For regression coverage, the prior verification findings were also checked. Exact claim command forwarding, touch targets, demo-bar focus contrast, 404 status, TypeScript checking, hashed font output, report-path collision protection, mobile CLS mitigation, and desktop overflow are fixed. The earlier helper fallback now derives empty text from live label/value, but the end-to-end Simulator claim remains unproved as described in F-1-2.

## Missed leverage

No AI feature is warranted. The job is deterministic accessibility-test evidence, and adding model output would reduce auditability. The brief’s import/export needs are already represented by JSON/JSONL input and JSON/HTML output; sync would conflict with the local-only positioning. The obvious missing leverage is trustworthy real-platform validation and a representative accuracy suite, covered by F-1-2 and F-1-6.

## What would make this perfect

Nothing should remain after repair: narrow the product to what it truly measures (or prove a real VoiceOver-capable path), replace the fake XCTest claim proof with a macOS Simulator test, add the missing sandbox/privacy/build claims, correct the `--json` instruction, prerender route metadata, validate the accuracy target, and clear every flagged copy line. Then rerun this full review from a clean clone and fresh browser contexts.
