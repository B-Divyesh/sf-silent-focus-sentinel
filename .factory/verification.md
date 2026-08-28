# Independent product verification

## Verdict: FAIL

Candidate `2c3059d00aaf5c417c856c07322b855eb79995b4` is not releasable against the supplied brief and work order. Verification was performed on 2026-08-28 against the clean `main` checkout and `https://silent-focus-sentinel.sociobot.in`.

The live site is deployed and byte-for-byte matches the candidate's production build. The CLI's analyzer, diff, reports, demo, packaging, and documented exit behavior work. Release is nevertheless blocked because every exact command in `.factory/claims.json` fails, the product does not provide the simulator/XCTest event capture needed for the real job, and the live UI misses mandatory accessibility requirements.

## First-read gate

**PASS (this gate alone).** A cold 1440×900 load showed:

- What: “Catch silent VoiceOver focus stops.”
- For whom: “For iOS teams checking a scripted focus run before confusing silence reaches users.”
- First action: “Try it with sample data,” with “Loads a finished focus report” beside it.
- Plain facts: “No upload,” “Runs locally,” and “Free and open source.”

The action opened `/demo` in one click. The finished seven-stop report was already visible, alongside a persistent “Demo — sample data, nothing is saved” banner with “Reset demo” and “Start for real.” Reset retained focus, and the sample JSON downloaded successfully.

## Release-blocking findings

### QA-01 — Critical — all declared claim commands fail

`.factory/claims.json` exists and contains nine claims, but every listed `test` command fails after a clean `npm ci`:

```text
npm test -- --grep @claim:<id>
...
> npm run test:e2e
> playwright test @claim:<id>
Error: No tests found.
exit 1
```

This affected `find-silent`, `find-duplicate`, `local-only`, `json-html`, `decorative-ignore`, `record-command`, `diff-regressions`, `sample-download`, and `open-source`. The chained `npm test` script causes the argument to reach `npm run test:e2e` without Playwright's `--grep` option. Under the claims contract, any failing declared command is release-blocking.

The literal pre-install run from the untouched clone also stopped at `vite: not found` (exit 127). After `npm ci`, the failure above remained. Diagnostic control: `npm run test:e2e -- --grep '@claim:'` reached the intended tests and all 9 passed.

Claim-test quality also has two gaps:

- “Compares new and resolved findings” only asserts two new findings and explicitly expects zero resolved findings. A reverse manual diff did produce two resolved findings, but the declared claim test does not prove that half of its claim.
- The local-only test intercepts the browser demo only. It does not exercise the CLI while proving the README/privacy claim that the CLI makes no network requests.

### QA-02 — High — simulator capture job is not delivered end to end

The brief requires an iOS simulator-focused CLI that records a scripted focus traversal. The repository contains no Swift/XCTest helper, simulator adapter, example runner, or other event extractor. `record` executes `sh -c <user command>` and parses JSON Lines that the user's own command must already emit. Its claim test uses `printf`, not an iOS traversal.

Consequently a mobile team cannot point the tool at an app/simulator and obtain the focus sequence; it must first invent the missing capture layer. The analyzer is useful once a conforming trace exists, and the limitation is described honestly, but the real job-to-be-done is incomplete.

### QA-03 — High — mandatory touch-target and focus-indicator failures

At 390 px, multiple interactive targets are below the required 44×44 CSS px:

- Header wordmark: 162×35.
- Header Demo / Install / Privacy: 42×22, 42×22, and 51×22.
- “Open the full sample report”: 269×25.
- Footer Privacy / Terms / factory link: 58×25, 47×25, and 180×25.

The same undersizing occurs on desktop navigation (25 px tall). On `/demo`, “Reset demo” is 95×32 and “Start for real” is 89×22.

The global focus outline is aqua (`#71f2d0`). The demo bar uses the identical aqua background, so the outline around “Reset demo” and “Start for real” has 1:1 contrast against its adjacent background and is not a visible focus indicator. Keyboard operation itself works and there are no traps.

## Other findings

### QA-04 — Medium — unknown routes return HTTP 200

`GET /definitely-missing` renders the designed “This page does not exist” screen but returns `HTTP/2 200`. The site-structure contract requires a real 404 route. This also makes nonexistent URLs look valid to crawlers and monitoring.

### QA-05 — Medium — no TypeScript typecheck gate

There is no `typecheck` or lint script and no `tsconfig.json`. An independent `npx tsc --noEmit ...` could not run because the project lacks `@types/node` (`TS2688`). Vite transpilation succeeds, but TypeScript correctness is not checked by the build or test workflow.

### QA-06 — Low — non-hashed font has short caching

Hashed JS/CSS correctly return `Cache-Control: public, max-age=31536000, immutable`. The self-hosted font returns only `public, must-revalidate, max-age=30`; it is not content-hashed or long-lived. The hero uses a one-day cache.

## Claims results

| Claim | Exact manifest command | Result | Underlying tagged test |
| --- | --- | --- | --- |
| `find-silent` | `npm test -- --grep @claim:find-silent` | FAIL, exit 1: no tests found | PASS |
| `find-duplicate` | `npm test -- --grep @claim:find-duplicate` | FAIL, exit 1: no tests found | PASS |
| `local-only` | `npm test -- --grep @claim:local-only` | FAIL, exit 1: no tests found | PASS, browser scope only |
| `json-html` | `npm test -- --grep @claim:json-html` | FAIL, exit 1: no tests found | PASS |
| `decorative-ignore` | `npm test -- --grep @claim:decorative-ignore` | FAIL, exit 1: no tests found | PASS |
| `record-command` | `npm test -- --grep @claim:record-command` | FAIL, exit 1: no tests found | PASS, uses `printf` |
| `diff-regressions` | `npm test -- --grep @claim:diff-regressions` | FAIL, exit 1: no tests found | PASS, but resolved case unproved |
| `sample-download` | `npm test -- --grep @claim:sample-download` | FAIL, exit 1: no tests found | PASS |
| `open-source` | `npm test -- --grep @claim:open-source` | FAIL, exit 1: no tests found | PASS |

Each claim ID appears exactly once in `tests/claims.spec.ts`.

## Passing evidence

### Build, automated tests, and package

- `npm ci`: passed; 23 packages installed, 0 audit vulnerabilities.
- `npm test`: passed; 3 Rust unit tests and 17 Playwright tests.
- `npm run build`: passed; release binary plus `dist/site/` produced.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `cargo package`: passed; 11 files, 35.5 KiB unpacked / 11.1 KiB compressed.
- Packaged crate installed with `cargo install --path target/package/silent-focus-sentinel-0.1.0 --root <fresh-temp-root> --locked`; installed CLI ran successfully.

### CLI behavior

- Installed `demo` exited 0, created a unique OS temporary directory, and produced parseable JSON plus standalone HTML.
- Sample analysis found exactly one silent stop (`checkout.promo`), one adjacent duplicate (`checkout.total-value`), and ignored the decorative stop: 1/1 seeded empty stop detected and no unintended fixture finding.
- `--fail-on findings` and `--fail-on regressions` exited 1 as documented.
- Reverse diff produced 0 new and 2 resolved findings.
- Case/whitespace-normalized duplicates and whitespace-only silence were detected.
- Empty input, malformed JSON, unsupported schema, blank ID, blank role, duplicate ID, missing file, and failed record command all returned exit 2 with actionable messages.
- Generated HTML at 390 px had no horizontal overflow, one `h1`, one `main`, no console errors, and zero axe violations.

### Live deployment identity and browser behavior

The live root HTML, hashed JS, hashed CSS, hero image, and font had the same SHA-256 hashes as local `dist/site/`. Examples:

- HTML: `df7df19c2326e8249ece860a4c996b55c1ba97c948183dab1ab82e21f3c11c61`.
- JS: `8fe9bcf99a46185f79f499c59d3ae21cb70c6b68c471ce56d4906ed5d8c1ee03`.
- CSS: `17bc18768649b7b52b382d1b820072ba73128169f7dafd87c021158702fc22d6`.

On `/`, `/demo`, `/privacy`, `/terms`, and an unknown route:

- Correct `lang`, title, one `h1`, one `main`, heading order, and image alternatives.
- Zero axe violations (including zero serious/critical findings).
- No console or uncaught page errors.
- All discovered links returned 200, including the external repository and Param Factory link.
- Keyboard activation worked for skip navigation, demo entry, download, reset, “Start for real,” and copy-to-clipboard.
- At 390×844 there was no horizontal overflow and the primary demo action remained visible.
- With `prefers-reduced-motion: reduce`, node animation was `none` and scroll behavior was `auto`.
- Demo flow produced no cross-origin browser requests, cookies, localStorage, or sessionStorage.

### Performance and policies

Live Lighthouse 13.0.1 mobile results after one browser retry:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- FCP 770 ms, LCP 987 ms, TBT 41 ms, CLS 0.
- Total transfer 56,773 bytes.

Production bundle sizes: JS 11,763 bytes / 4,627 gzip; CSS 11,392 / 3,439 gzip; font 13,284; hero WebP 33,420. All are below contract budgets.

Responses include CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. The CSP restricts scripts, styles, fonts, and connections to self (with `blob:` only for images). No third-party runtime resources or analytics were observed.

## Applicability

- No product server/API endpoints exist; API rate-limit testing is not applicable.
- No sign-in exists; Entra tenant validation is not applicable.
- This is not a PWA; service-worker update/offline checks are not applicable.
- No AI feature is present or needed for the brief.

## Required remediation before release

1. Make every `claims.json` command invoke its exact Playwright tag successfully, then rerun all nine from a clean install.
2. Supply and test a concrete iOS simulator/XCTest event capture path, or narrow the product contract and claims so it is explicitly only a trace analyzer.
3. Raise all interactive targets to at least 44×44 px and give demo-banner focus indicators at least 3:1 adjacent contrast.
4. Serve unknown routes with HTTP 404 while keeping the designed page.
5. Add a configured TypeScript typecheck (and preferably lint) gate.
