// Copy this file into your iOS UI-test target. It uses only public XCTest APIs.
import Foundation
import XCTest

private struct SilentFocusEvent: Encodable {
    let id: String
    let role: String
    let label: String
    let value: String
    let hint: String
    let announcement: String
    let ignored: Bool
}

/// Emits a machine-readable record for each stop in an app-owned XCTest traversal.
///
/// XCTest cannot drive the private VoiceOver cursor. Keep traversal order explicit in
/// the UI test, then record the accessibility label, value, and expected announcement
/// for each stop. `silent-focus-sentinel record-xctest` extracts these lines from
/// `xcodebuild test` output and writes a regular trace file.
enum SilentFocusSentinel {
    private static let marker = "SFS_EVENT:"

    static func record(
        _ element: XCUIElement,
        id: String,
        role: String,
        announcement: String? = nil,
        hint: String = "",
        ignored: Bool = false
    ) {
        let label = element.label
        let value = element.value as? String ?? ""
        let spoken = announcement ?? [label, value, role]
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .joined(separator: ", ")
        let event = SilentFocusEvent(
            id: id,
            role: role,
            label: label,
            value: value,
            hint: hint,
            announcement: spoken,
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
