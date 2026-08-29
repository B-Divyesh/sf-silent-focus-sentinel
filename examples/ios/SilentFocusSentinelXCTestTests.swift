// Add this alongside SilentFocusSentinelXCTest.swift in the UI-test target.
// It exercises the legacy JSONL helper's label/value derivation.
import XCTest

final class SilentFocusSentinelXCTestTests: XCTestCase {
    func testAutomaticallyDetectsARegressedSilentElement() {
        let before = SilentFocusSentinel.observedText(label: "Promo code", value: "")
        let after = SilentFocusSentinel.observedText(label: "", value: "")

        XCTAssertEqual(before, "Promo code")
        XCTAssertEqual(after, "")
    }
}
