// Compatibility helper for existing XCTest-only runners.
//
// New integrations should use SilentFocusSentinelVoiceOverCapture.swift in the
// app target. XCTest intentionally cannot read the VoiceOver cursor; this
// helper remains for plain JSONL runners only.
import Foundation
import XCTest

struct SilentFocusSentinelLegacyEvent: Encodable {
    let id: String
    let role: String
    let label: String
    let value: String
    let hint: String
    let text: String
    let ignored: Bool
}

enum SilentFocusSentinel {
    private static let marker = "SFS_EVENT:"

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
        let event = SilentFocusSentinelLegacyEvent(
            id: id,
            role: role,
            label: label,
            value: value,
            hint: hint,
            text: observedText(label: label, value: value),
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
