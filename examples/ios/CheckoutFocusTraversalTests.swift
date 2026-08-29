// UI-test target for the runnable SilentFocusSentinelExample project.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))

        // XCUITest sends a synthetic one-finger swipe. The example's test-only
        // bridge starts a timed series of public UIAccessibility focus moves,
        // so VoiceOver's real cursor enters every stop. The app observer, not
        // this test's element queries, records the traversal.
        app.swipeRight()

        let end = app.otherElements["checkout.capture-end"]
        let emitted = NSPredicate(format: "label == %@", "Trace emitted")
        expectation(for: emitted, evaluatedWith: end)
        waitForExpectations(timeout: 10)
    }
}
