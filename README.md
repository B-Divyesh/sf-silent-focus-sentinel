# Silent Focus Sentinel

Flag empty or duplicate label/value text in scripted iOS accessibility checks.

Silent Focus Sentinel is a local command-line tool for iOS teams. Your XCTest chooses the elements and their order.

The helper reads each element's public XCTest label and string value. The CLI writes JSON and HTML findings.

It does not observe the VoiceOver cursor, speech, traits, or hints. It does not certify WCAG conformance.

## Try the bundled demo

```sh
cargo run -- demo
```

The command creates a new operating-system temporary directory. It copies the bundled checkout trace and writes both report formats there.

Nothing is added to or changed in your project directory. The browser demo opens at <https://silent-focus-sentinel.sociobot.in/?demo=1>.

## Install

Build the single binary with Rust 1.85 or newer:

```sh
cargo install --path .
silent-focus-sentinel --help
```

Every command runs without an account, credentials, or runtime service.

## Extract marked XCTest output

Copy [`examples/ios/SilentFocusSentinelXCTest.swift`](examples/ios/SilentFocusSentinelXCTest.swift) into your UI-test target.

Choose an explicit element order as shown in [`examples/ios/CheckoutFocusTraversalTests.swift`](examples/ios/CheckoutFocusTraversalTests.swift).

Each `SilentFocusSentinel.record(...)` call prints one marked `SFS_EVENT:` line with the element's current label/value text.

```sh
silent-focus-sentinel record-xctest \
  --scheme CheckoutUITests \
  --project Checkout.xcodeproj \
  --destination "platform=iOS Simulator,name=iPhone 16" \
  --output artifacts/checkout-trace.json
```

`record-xctest` starts `xcodebuild test`. It extracts marked lines from the command output and saves a trace JSON file.

XCTest does not expose the VoiceOver cursor or speech. Your test chooses the elements; this tool does not validate VoiceOver navigation.

## Record another scripted check

Your runner prints one JSON object per element. Each line needs `id`, `role`, and `text`.

The optional fields are `label`, `value`, `hint`, and `ignored`.

```json
{"id":"checkout.title","role":"header","label":"Checkout","text":"Checkout"}
{"id":"checkout.offer","role":"button","label":"","text":""}
```

Capture and analyze it:

```sh
silent-focus-sentinel record \
  --command "xcodebuild test -scheme CheckoutUITests" \
  --output artifacts/checkout-trace.json

silent-focus-sentinel analyze artifacts/checkout-trace.json \
  --json artifacts/checkout-report.json \
  --html artifacts/checkout-report.html \
  --fail-on findings
```

`record` accepts a command that emits JSON Lines. A failed runner returns exit code 2 and leaves no output trace.

## Compare a baseline

```sh
silent-focus-sentinel diff examples/baseline-trace.json examples/sample-trace.json \
  --json artifacts/diff.json \
  --html artifacts/diff.html \
  --fail-on regressions
```

The report marks new and resolved findings. Omit `--json` to print the JSON report to standard output for CI.

Every report path must differ from each input path. The JSON and HTML paths must also differ.

The CLI rejects a collision before writing anything.

## Event format

```json
{"schemaVersion":1,"screen":"Checkout","platform":"iOS Simulator 18.2","events":[{"index":1,"id":"checkout.pay","role":"button","label":"Pay now","value":"$42.00","hint":"Completes the order","text":"Pay now, $42.00","ignored":false}]}
```

An empty finding means trimmed `text` is empty. A duplicate finding means normalized `text` matches the previous non-ignored element.

Set `ignored: true` for an intentional decorative or non-focusable element.

## Regression accuracy

[`examples/regression-suite.json`](examples/regression-suite.json) covers 30 cases across labels, values, whitespace, hints, roles, dynamic text, and ignored elements.

The suite detects at least 90% of intentional empty-text cases. It keeps the empty-text false-positive rate below 10%.

## Exit codes

- `0`: the command completed and did not meet the selected failure threshold.
- `1`: findings or regressions met `--fail-on`.
- `2`: arguments, input, events, output paths, or a runner failed.

## Develop and verify

```sh
npm ci
npm test
npm run build
```

`npm run build` creates the release binary at `target/release/silent-focus-sentinel`.

It creates the static site in `dist/site/`. Package with `cargo package --allow-dirty`; the factory owns registry publishing.

## Privacy

The CLI reads and writes local files only. It has no telemetry and makes no network requests.

The static site stores no data. It loads no third-party scripts, fonts, or analytics.

See [Privacy](https://silent-focus-sentinel.sociobot.in/privacy) and [Terms](https://silent-focus-sentinel.sociobot.in/terms).

## License

MIT. See [LICENSE](LICENSE).
