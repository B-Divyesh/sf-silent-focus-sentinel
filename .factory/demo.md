# Demo sandbox

- CLI: `cargo run -- demo` or the installed `silent-focus-sentinel demo`.
- Simulator capture: open `examples/ios/SilentFocusSentinelExample.xcodeproj` on macOS, enable Simulator VoiceOver, then run `silent-focus-sentinel record-xctest --scheme SilentFocusSentinelExample --project examples/ios/SilentFocusSentinelExample.xcodeproj --output trace.json`. Its UI test sends swipes through a public `UIAccessibility` focus bridge; the retained app observer emits when the final stop receives real VoiceOver focus.
- Site: `/demo` is the public one-click sandbox. `/?demo=1` is a direct isolated alias for verifiers and existing links.
- Sample: `examples/sample-trace.json` contains seven realistic checkout focus stops. It includes one silent announcement, one adjacent repeated announcement, and one ignored decorative stop.
- The CLI copies the sample into a newly created operating-system temporary directory, writes JSON and HTML reports there, prints the location, and does not alter user data.
- The site demo is rebuilt from an in-memory sample and never reads or writes browser storage. “Reset demo” restores it. “Start for real” opens install instructions.
