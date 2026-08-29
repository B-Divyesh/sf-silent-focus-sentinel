# Demo sandbox

- CLI: `cargo run -- demo` or the installed `silent-focus-sentinel demo`.
- XCTest extraction: copy `examples/ios/SilentFocusSentinelXCTest.swift` into an app UI-test target and add explicit `SilentFocusSentinel.record(...)` calls. Then run `silent-focus-sentinel record-xctest --scheme <scheme> --output trace.json` on macOS with Xcode.
- Site: `/demo` is the public one-click sandbox. `/?demo=1` is a direct isolated alias for verifiers and existing links.
- Sample: `examples/sample-trace.json` contains seven realistic checkout elements. It includes empty label/value text, adjacent duplicate text, and one ignored decorative element.
- The CLI copies the sample into a newly created operating-system temporary directory, writes JSON and HTML reports there, prints the location, and does not alter user data.
- The site demo is rebuilt from an in-memory sample and never reads or writes browser storage. “Reset demo” restores it. “Start for real” opens install instructions.
