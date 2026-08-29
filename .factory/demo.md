# Demo sandbox

- CLI: `cargo run -- demo` or the installed `silent-focus-sentinel demo`.
- Simulator capture: open `examples/ios/SilentFocusSentinelExample.xcodeproj` on a GUI macOS host, enable Simulator VoiceOver, and run the app. Move through the checkout screen with VoiceOver. The retained observer emits from the app when VoiceOver reaches “End capture.” The UI test can relay those observed JSON Lines to `silent-focus-sentinel record-xctest`; hosted headless Simulators compile this path but do not reliably move VoiceOver's cursor.
- Site: `/demo` is the public one-click sandbox. `/?demo=1` is a direct isolated alias for verifiers and existing links.
- Sample: `examples/sample-trace.json` contains seven realistic checkout focus stops. It includes one silent announcement, one adjacent repeated announcement, and one ignored decorative stop.
- The CLI copies the sample into a newly created operating-system temporary directory, writes JSON and HTML reports there, prints the location, and does not alter user data.
- The site demo is rebuilt from an in-memory sample and never reads or writes browser storage. “Reset demo” restores it. “Start for real” opens install instructions.
