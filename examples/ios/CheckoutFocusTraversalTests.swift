// UI-test target for the runnable SilentFocusSentinelExample project.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launchArguments += ["--silent-focus-sentinel-capture"]
        app.launch()

        XCTAssertTrue(app.buttons["checkout.pay"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["voiceover.status"].label, "VoiceOver enabled")

        // Exercise a next-item gesture, then request the example's public
        // UIAccessibility focus sequence. The app records only callbacks for
        // elements that VoiceOver actually focuses. Run this on a GUI macOS
        // host: a hosted headless Simulator may ignore these focus requests.
        app.swipeRight()
        app.buttons["capture.run"].tap()

        let end = app.otherElements["checkout.capture-end"]
        let emitted = NSPredicate(format: "label == %@", "Trace emitted")
        expectation(for: emitted, evaluatedWith: end)
        waitForExpectations(timeout: 10)

        let payloadElement = app.staticTexts["capture.payload"]
        guard payloadElement.waitForExistence(timeout: 2) else {
            return XCTFail("The app did not expose its trace payload element")
        }
        let payload = payloadElement.label
        guard !payload.isEmpty else {
            return XCTFail("The app did not expose its observed VoiceOver trace")
        }
        let lines = payload.split(separator: "\n")
        XCTAssertGreaterThanOrEqual(lines.count, 7, "Expected seven app-observed VoiceOver focus notifications")
        for line in lines {
            print("SFS_VOICEOVER_STOP:\(line)")
        }
    }
}
