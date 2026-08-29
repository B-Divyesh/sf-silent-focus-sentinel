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
            guard ProcessInfo.processInfo.arguments.contains(SilentFocusSentinelVoiceOverCapture.launchArgument) else { return }
            self?.capture.start { payload in
                checkout?.markTraceEmitted(payload)
            }
        }
        checkout.finishTraversal = { [weak self] in
            self?.capture.emitCapturedTrace()
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
