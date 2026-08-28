# Demo sandbox

- CLI: `cargo run -- demo` or the installed `silent-focus-sentinel demo`.
- Simulator capture: copy `examples/ios/SilentFocusSentinelXCTest.swift` into an app UI-test target, add explicit `SilentFocusSentinel.record(...)` calls as shown in `examples/ios/CheckoutFocusTraversalTests.swift`, then run `silent-focus-sentinel record-xctest --scheme <scheme> --output trace.json` on macOS with Xcode.
- Site: `/demo`, also linked as “Try it with sample data” on the first screen.
- Sample: `examples/sample-trace.json` contains seven realistic focus stops from a checkout screen. It includes one empty announcement, one adjacent duplicate, and one ignored decorative node.
- The CLI copies the sample into a newly created operating-system temporary directory, writes JSON and HTML reports there, prints the location, and does not alter user data.
- The site demo is a read-only rendering of that bundled sample. It has no storage namespace because it never writes browser storage. “Reset demo” rebuilds the sample view. “Start for real” returns to install instructions.
