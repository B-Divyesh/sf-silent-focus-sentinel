# Silent Focus Sentinel

Catch silent VoiceOver focus stops before release.

Silent Focus Sentinel is a local command-line tool for iOS teams. It reads a scripted focus traversal, flags empty or repeated announcements, and writes review-ready JSON and HTML.

It does not control private VoiceOver APIs or certify WCAG conformance. Your XCTest or simulator script supplies ordered focus events as JSON. The `record` command can run that script and capture its standard output.

## Try the bundled demo

```sh
cargo run -- demo
```

The command creates an isolated temporary directory. It copies the bundled checkout trace there and writes both reports. Nothing is saved to your project.

The browser demo is at <https://silent-focus-sentinel.sociobot.in/demo>.

## Install

Build the single binary with Rust 1.85 or newer:

```sh
cargo install --path .
silent-focus-sentinel --help
```

No account, network request, or runtime service is required.

## Record a scripted traversal

Your runner prints one JSON object per focus stop. Each line needs `id`, `role`, and `announcement`; `label`, `value`, `hint`, and `ignored` are optional.

```json
{"id":"checkout.title","role":"header","label":"Checkout","announcement":"Checkout, heading"}
{"id":"checkout.offer","role":"button","label":"","announcement":""}
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

`record` accepts a command that emits JSON Lines. This keeps app-specific navigation in XCTest and analysis in one portable binary. A non-zero runner exit is passed through as an error.

## Compare a baseline

```sh
silent-focus-sentinel diff examples/baseline-trace.json examples/sample-trace.json \
  --json artifacts/diff.json \
  --html artifacts/diff.html \
  --fail-on regressions
```

The report marks new findings and resolved findings. `--json` also prints the report to standard output when no file is given, so CI can parse it.

## Event format

```json
{"schemaVersion":1,"screen":"Checkout","platform":"iOS Simulator 18.2","events":[{"index":1,"id":"checkout.pay","role":"button","label":"Pay now","value":"$42.00","hint":"Completes the order","announcement":"Pay now, $42.00, button","ignored":false}]}
```

An event is silent when its trimmed `announcement` is empty. An event is duplicate when its normalized announcement matches the previous non-ignored focus stop. Set `ignored: true` for an intentional decorative stop.

## Exit codes

- `0`: command completed and the selected failure threshold was not met.
- `1`: findings or regressions met `--fail-on`.
- `2`: invalid arguments, unreadable input, malformed events, or a failed record command.

## Develop and verify

```sh
npm install
npm test
npm run build
```

`npm run build` builds the release binary and the static site. Site output lands in `dist/site/`. The release binary is `target/release/silent-focus-sentinel`.

Package with `cargo package --allow-dirty`. The factory owns registry publishing.

## Privacy

The CLI reads and writes local files only. It has no telemetry. The static site stores no data and loads no third-party scripts, fonts, or analytics. See [Privacy](https://silent-focus-sentinel.sociobot.in/privacy) and [Terms](https://silent-focus-sentinel.sociobot.in/terms).

## License

MIT. See [LICENSE](LICENSE).
