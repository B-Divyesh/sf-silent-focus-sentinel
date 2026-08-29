# Landing-page copy audit

Audited 2026-08-29. Counts include headings, actions, facts, captions, status text, and prose. Commands and identifiers are interface data.

| Location | Copy | Words | Flag |
| --- | --- | ---: | --- |
| H1 | Catch silent VoiceOver focus stops | 5 | — |
| First-screen sentence | For iOS teams who need to catch missing or repeated announcements before release. | 13 | — |
| Primary action | Try it with sample data | 5 | — |
| Action result | Opens a finished sample report | 5 | — |
| Facts | No upload · Works without an account · MIT licensed | 8 | — |
| Figure caption | Aqua marks announcements. Coral marks silent focus stops. | 8 | — |
| Preview H2 | Sample elements and findings | 4 | — |
| Workflow H2 | How the CLI checks a simulator traversal | 7 | — |
| Step H3 | Start the observer | 3 | — |
| Step sentence | Add the public UIKit capture to your app target. | 9 | — |
| Step H3 | Run VoiceOver | 2 | — |
| Step sentence | Run your iOS Simulator traversal and emit its ordered stops. | 10 | — |
| Step H3 | Review the findings | 3 | — |
| Step sentence | Compare silent or repeated announcements with your baseline. | 8 | — |
| Boundary H2 | Know what the check measures | 6 | — |
| Boundary sentence | The app observer records public VoiceOver focus notifications in simulator order. | 10 | — |
| Boundary sentence | It captures labels, values, and hints at each observed stop. | 10 | — |
| Boundary sentence | It does not record VoiceOver audio. | 6 | — |
| Boundary sentence | It does not certify Web Content Accessibility Guidelines conformance. | 9 | — |
| Footer sentence | Local checks for silent or repeated VoiceOver focus stops. | 9 | — |

No sentence exceeds 22 words. No banned word appears.

## Terminology

| Concept | One term |
| --- | --- |
| Ordered assistive-technology item | focus stop |
| Captured spoken content | announcement |
| Missing announcement | silent stop |
| Same adjacent announcement | repeated announcement |
| Capture source | Simulator traversal |
| Analyzer result | finding |
| Excluded item | ignored stop |
| Before/after comparison | diff |
| Bundled isolated example | demo |
