// Example integration. Replace these accessibility identifiers with your app's stops.
import XCTest

final class CheckoutFocusTraversalTests: XCTestCase {
    func testCheckoutFocusTraversal() {
        let app = XCUIApplication()
        app.launch()

        SilentFocusSentinel.record(
            app.staticTexts["checkout.title"],
            id: "checkout.title",
            role: "header",
            announcement: "Checkout, heading"
        )
        SilentFocusSentinel.record(
            app.buttons["checkout.promo"],
            id: "checkout.promo",
            role: "button",
            announcement: ""
        )
        SilentFocusSentinel.record(
            app.images["checkout.separator"],
            id: "checkout.separator",
            role: "image",
            ignored: true
        )
        SilentFocusSentinel.record(
            app.buttons["checkout.pay"],
            id: "checkout.pay",
            role: "button",
            announcement: "Pay now, button"
        )
    }
}
