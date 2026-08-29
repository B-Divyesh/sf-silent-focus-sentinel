// UI-test target for the runnable SilentFocusSentinelExample project.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))

        // With VoiceOver enabled, a one-finger swipe right advances its real
        // cursor. The app observer, not this test's element queries, records
        // every focused stop. Repeat past the intentionally unnamed stop until
        // the final marker tells the app process to emit its JSON Lines.
        for _ in 0..<8 {
            app.swipeRight()
        }

        let end = app.otherElements["checkout.capture-end"]
        let emitted = NSPredicate(format: "label == %@", "Trace emitted")
        expectation(for: emitted, evaluatedWith: end)
        waitForExpectations(timeout: 10)
    }
}
