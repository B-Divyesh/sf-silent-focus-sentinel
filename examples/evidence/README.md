# VoiceOver accuracy evidence

`ios-18.2-focus-capture.json` is the ordered app-side focus-notification
capture. It contains only public accessibility properties. It has no expected
labels and no `silentIds` answer key.

`ios-18.2-voiceover-observations.json` is the separately recorded, verbatim
listening ledger for the same traversal. The accuracy regression derives
silence only from an empty `spokenWords` observation, then compares that result
with the CLI output. Role and state speech is retained. In particular, the
unnamed button was heard as “Button”, so a content-only detector flags it as a
false positive instead of relabeling it silent.

The checked-in evidence has 10 silent and 20 spoken stops. The CLI detects all
10 silent stops and also flags the unnamed button: 100% detection and 5% false
positives. These numbers describe this fixed evidence run, not every app or iOS
version.

The Linux build worker cannot replay or independently refresh a Simulator
listening session. Run the shared Xcode project on macOS, listen with the
settings recorded in the ledger, and replace both files together when the iOS
or VoiceOver version changes.
