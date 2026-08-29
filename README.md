# Silent Focus Sentinel

Catch silent or repeated VoiceOver focus stops in scripted iOS Simulator runs.

Silent Focus Sentinel is a local command-line tool for iOS teams and VoiceOver users. It records an observed simulator focus traversal and checks its effective announcements.

The app-target helper observes public VoiceOver focus notifications. The CLI writes JSON and HTML findings.

It records labels, values, and hints at each observed stop. It does not record VoiceOver audio or certify Web Content Accessibility Guidelines (WCAG) conformance.

## Try the bundled demo

```sh
cargo run -- demo
```

The command creates a new operating-system temporary directory. It copies the bundled checkout trace and writes both report formats there.

Nothing is added to or changed in your project directory. The browser demo opens at <https://silent-focus-sentinel.sociobot.in/demo>.

## Install

Build the single binary with Rust 1.85 or newer:

```sh
cargo install --path .
silent-focus-sentinel --help
```

Every command runs without an account, credentials, or runtime service.

## Capture a Simulator VoiceOver traversal

Copy [`examples/ios/SilentFocusSentinelVoiceOverCapture.swift`](examples/ios/SilentFocusSentinelVoiceOverCapture.swift) into your app target. It uses public `UIAccessibility.elementFocusedNotification` callbacks, so it records the focus order VoiceOver actually enters.

Start it when the app launches with `--silent-focus-sentinel-capture`. After your scripted VoiceOver gestures finish, call `emitCapturedTrace()`. See [`examples/ios/CheckoutFocusTraversalTests.swift`](examples/ios/CheckoutFocusTraversalTests.swift).

Add [`examples/ios/SilentFocusSentinelVoiceOverCaptureTests.swift`](examples/ios/SilentFocusSentinelVoiceOverCaptureTests.swift) to an app test target. Run those native tests on the same Simulator configuration as the traversal.

The observer is not given a caller-selected element list. It records an inserted silent stop when VoiceOver reaches it. Each captured stop prints one `SFS_VOICEOVER_STOP:` JSON line with its order and effective announcement.

```sh
silent-focus-sentinel record-xctest \
  --scheme CheckoutUITests \
  --project Checkout.xcodeproj \
  --destination "platform=iOS Simulator,name=iPhone 16" \
  --output artifacts/checkout-trace.json
```

`record-xctest` starts `xcodebuild test`. It extracts the ordered Simulator stops from command output and saves a trace JSON file.

UIKit does not expose VoiceOver's audio buffer. `announcement` is the effective public announcement built from the focused element's label, value, and hint at the observed stop.

## Record another scripted check

Your runner prints one JSON object per focus stop. Each line needs `id`, `role`, and either `announcement` or legacy `text`.

The optional fields are `label`, `value`, `hint`, and `ignored`.

```json
{"id":"checkout.title","role":"header","announcement":"Checkout","capture":"voiceover_simulator"}
{"id":"checkout.offer","role":"button","announcement":"","capture":"voiceover_simulator"}
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

The report marks new and resolved findings. Omit `--json` to print the JSON report to standard output for an automated build.

Every report path must differ from each input path. The JSON and HTML paths must also differ.

The CLI rejects a collision before writing anything.

## Event format

```json
{"schemaVersion":1,"screen":"Checkout","platform":"iOS Simulator 18.2 VoiceOver","events":[{"index":1,"id":"checkout.pay","role":"button","label":"Pay now","value":"$42.00","hint":"Completes the order","announcement":"Pay now, $42.00, Completes the order","capture":"voiceover_simulator","ignored":false}]}
```

An empty finding means the trimmed effective announcement is empty. A duplicate finding means the normalized effective announcement matches the previous non-ignored stop. Simulator captures use `announcement`; old scripted JSONL traces can keep using `text`.

Set `ignored: true` for an intentional decorative or non-focusable element.

## Regression accuracy

[`examples/voiceover-observed-regression-suite.json`](examples/voiceover-observed-regression-suite.json) contains a 30-stop observed Simulator traversal. It includes silent stops outside a caller-selected list, populated hint/value stops, and repeated announcements. [`examples/regression-suite.json`](examples/regression-suite.json) remains a legacy label/value unit fixture.

The observed suite detects at least 90% of intentional silent stops. It keeps the silent-stop false-positive rate below 10%.

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

## Deploy

`npm run build` produces the static deployment artifact in `dist/site/`. The factory publishes that directory through its work order.

Do not change DNS, billing, or infrastructure from this repository.

## Privacy

The CLI reads and writes local files only. It has no telemetry and makes no network requests.

The static site stores no data. It loads no third-party scripts, fonts, or analytics.

See [Privacy](https://silent-focus-sentinel.sociobot.in/privacy) and [Terms](https://silent-focus-sentinel.sociobot.in/terms).

## License

MIT. See [LICENSE](LICENSE).
