// UI-test target for the runnable SilentFocusSentinelExample project.
import XCTest
import UIKit

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["voiceover.status"].label, "VoiceOver enabled")

        // Exercise the same next-item gesture used by VoiceOver, then activate
        // the deterministic app-side traversal. XCUITest routes synthetic
        // swipes differently from hardware, so the run control guarantees the
        // public UIAccessibility focus sequence also runs on headless workers.
        app.swipeRight()
        app.buttons["capture.run"].tap()

        let end = app.otherElements["checkout.capture-end"]
        let emitted = NSPredicate(format: "label == %@", "Trace emitted")
        expectation(for: emitted, evaluatedWith: end)
        waitForExpectations(timeout: 10)

        guard let payload = UIPasteboard.general.string, !payload.isEmpty else {
            return XCTFail("The app did not expose its observed VoiceOver trace")
        }
        for line in payload.split(separator: "\n") {
            print("SFS_VOICEOVER_STOP:\(line)")
        }
    }
}
