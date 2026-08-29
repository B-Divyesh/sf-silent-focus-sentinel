// Add this alongside SilentFocusSentinelXCTest.swift in the UI-test target.
// It exercises the helper's automatic speech derivation without supplying an
// empty announcement fixture.
import XCTest

final class SilentFocusSentinelXCTestTests: XCTestCase {
    func testAutomaticallyDetectsARegressedSilentElement() {
        let before = SilentFocusSentinel.observedAnnouncement(label: "Promo code", value: "")
        let after = SilentFocusSentinel.observedAnnouncement(label: "", value: "")

        XCTAssertEqual(before, "Promo code")
        XCTAssertEqual(after, "")
    }
}
