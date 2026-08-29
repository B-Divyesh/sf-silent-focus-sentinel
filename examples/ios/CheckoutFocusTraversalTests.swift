// UI-test target for the runnable SilentFocusSentinelExample project.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))

        // XCUITest sends synthetic one-finger swipes. The example's test-only
        // bridge converts each swipe into a public UIAccessibility focus move,
        // so VoiceOver's real cursor enters every stop. The app observer, not
        // this test's element queries, records the traversal.
        for _ in 0..<7 {
            app.swipeRight()
            Thread.sleep(forTimeInterval: 1)
        }

        let end = app.otherElements["checkout.capture-end"]
        let emitted = NSPredicate(format: "label == %@", "Trace emitted")
        expectation(for: emitted, evaluatedWith: end)
        waitForExpectations(timeout: 10)
    }
}
