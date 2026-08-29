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
            // Headless XCTest does not always deliver its synthetic swipe to
            // the app. Start the same public focus sequence after launch so
            // the runnable example remains deterministic on CI and locally.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                checkout?.startVoiceOverTraversal()
            }
        }
        checkout.finishTraversal = { [weak self] in
            self?.capture.emitCapturedTrace()
        }
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = checkout
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}
