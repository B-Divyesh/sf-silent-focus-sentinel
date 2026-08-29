import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    private let capture = SilentFocusSentinelVoiceOverCapture()

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let checkout = CheckoutViewController()
        checkout.startCapture = { [weak self, weak checkout] in
            self?.capture.start(emitAfterFocusing: "checkout.capture-end") { payload in
                checkout?.markTraceEmitted(payload)
            }
        }
        checkout.observeVoiceOverFocus = { [weak self] element in
            self?.capture.captureObservedVoiceOverFocus(element)
        }
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = checkout
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}
