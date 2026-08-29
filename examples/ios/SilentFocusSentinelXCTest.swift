// Copy this file into your iOS UI-test target. It uses only public XCTest APIs.
import Foundation
import XCTest

private struct SilentFocusEvent: Encodable {
    let id: String
    let role: String
    let label: String
    let value: String
    let hint: String
    let text: String
    let ignored: Bool
}

/// Emits a machine-readable record for each stop in an app-owned XCTest traversal.
///
/// XCTest does not expose the VoiceOver cursor or speech. Keep element order explicit
/// in the UI test. This helper records only each element's current label and value.
/// `record-xctest` extracts these marked lines from `xcodebuild test` output.
enum SilentFocusSentinel {
    private static let marker = "SFS_EVENT:"

    // This deliberately excludes the caller-supplied role. A button whose live
    // label and value regress to empty must remain empty in the trace so the CLI
    // can flag it. The role is diagnostic metadata, not label/value text.
    static func observedText(label: String, value: String) -> String {
        [label, value]
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .joined(separator: ", ")
    }

    static func record(
        _ element: XCUIElement,
        id: String,
        role: String,
        hint: String = "",
        ignored: Bool = false
    ) {
        let label = element.label
        let value = element.value as? String ?? ""
        let text = observedText(label: label, value: value)
        let event = SilentFocusEvent(
            id: id,
            role: role,
            label: label,
            value: value,
            hint: hint,
            text: text,
            ignored: ignored
        )
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(event), let json = String(data: data, encoding: .utf8) else {
            XCTFail("Silent Focus Sentinel could not encode \(id)")
            return
        }
        print(marker + json)
    }
}
