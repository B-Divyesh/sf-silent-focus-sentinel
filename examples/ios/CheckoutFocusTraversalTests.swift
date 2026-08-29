// Example UI-test integration. The capture observer belongs in the app target.
// In the app delegate, when launchArguments contains
// SilentFocusSentinelVoiceOverCapture.launchArgument, call capture.start();
// after this test's scripted VoiceOver swipes finish, call capture.emitCapturedTrace().
// The app observer receives every focused stop, including nodes this test never names.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        // Perform the same VoiceOver next-item gestures your release test uses.
        // Do not call record(element:) here: the app-side observer is the source
        // of truth and discovers an inserted silent stop automatically.
        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))
    }
}
