// Add this alongside SilentFocusSentinelVoiceOverCapture.swift in an app test
// target. Run it on the same iOS Simulator configuration as the traversal.
import XCTest

final class SilentFocusSentinelVoiceOverCaptureTests: XCTestCase {
    func testSilentFocusedStopStaysSilent() {
        XCTAssertEqual(
            SilentFocusSentinelVoiceOverCapture.effectiveAnnouncement(label: "", value: "", hint: ""),
            ""
        )
    }

    func testHintAndValueArePartOfTheEffectiveAnnouncement() {
        XCTAssertEqual(
            SilentFocusSentinelVoiceOverCapture.effectiveAnnouncement(
                label: "Delivery address",
                value: "14 Oak Street",
                hint: "Changes delivery address"
            ),
            "Delivery address, 14 Oak Street, Changes delivery address"
        )
    }
}
