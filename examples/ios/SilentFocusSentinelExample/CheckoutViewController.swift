import UIKit

final class CheckoutViewController: UIViewController {
    var startCapture: (() -> Void)?
    var finishTraversal: (() -> Void)?
    private let endStop = UIView()
    private let payloadStop = UILabel()
    private var traversalStops: [UIView] = []
    private var traversalIndex = 0

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let title = UILabel()
        title.text = "Checkout"
        title.font = .preferredFont(forTextStyle: .largeTitle)
        title.accessibilityIdentifier = "checkout.title"
        title.accessibilityTraits = .header

        let runCapture = UIButton(type: .system)
        runCapture.setTitle("Run VoiceOver traversal", for: .normal)
        runCapture.accessibilityIdentifier = "capture.run"
        runCapture.addTarget(self, action: #selector(startVoiceOverTraversal), for: .touchUpInside)

        let voiceOverStatus = UILabel()
        voiceOverStatus.text = UIAccessibility.isVoiceOverRunning ? "VoiceOver enabled" : "VoiceOver disabled"
        voiceOverStatus.accessibilityIdentifier = "voiceover.status"

        let address = UIButton(type: .system)
        address.setTitle("Delivery address", for: .normal)
        address.accessibilityIdentifier = "checkout.address"
        address.accessibilityValue = "14 Oak Street"

        // This stop is intentionally unnamed and is never queried by the UI
        // test. A real VoiceOver traversal discovers it between address/total.
        let unnamed = UIView()
        unnamed.isAccessibilityElement = true
        unnamed.accessibilityIdentifier = "checkout.unnamed"

        let total = UILabel()
        total.text = "Total, $42.00"
        total.accessibilityIdentifier = "checkout.total"

        let repeatedTotal = UILabel()
        repeatedTotal.text = "Total, $42.00"
        repeatedTotal.accessibilityIdentifier = "checkout.total-echo"

        let pay = UIButton(type: .system)
        pay.setTitle("Pay now", for: .normal)
        pay.accessibilityIdentifier = "checkout.pay"

        endStop.isAccessibilityElement = true
        endStop.accessibilityIdentifier = "checkout.capture-end"
        endStop.accessibilityLabel = "End capture"

        // This element joins the accessibility tree only after VoiceOver has
        // finished the traversal. It carries the app-generated JSON to the UI
        // test without changing the currently focused stop's spoken value.
        payloadStop.numberOfLines = 0
        let stack = UIStackView(arrangedSubviews: [voiceOverStatus, runCapture, title, address, unnamed, total, repeatedTotal, pay, endStop, payloadStop])
        stack.axis = .vertical
        stack.spacing = 24
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 32),
            unnamed.heightAnchor.constraint(equalToConstant: 44),
            endStop.heightAnchor.constraint(equalToConstant: 44),
            payloadStop.heightAnchor.constraint(equalToConstant: 44)
        ])

        traversalStops = [title, address, unnamed, total, repeatedTotal, pay, endStop]
        if ProcessInfo.processInfo.arguments.contains(SilentFocusSentinelVoiceOverCapture.launchArgument) {
            // XCUITest's synthetic swipe is delivered to the app instead of
            // VoiceOver's system gesture recognizer. This test-only bridge
            // converts each scripted swipe into a public VoiceOver focus move.
            let nextItem = UISwipeGestureRecognizer(target: self, action: #selector(startVoiceOverTraversal))
            nextItem.direction = .right
            view.addGestureRecognizer(nextItem)
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startCapture?()
    }

    @objc func startVoiceOverTraversal() {
        guard traversalIndex == 0 else { return }
        advanceVoiceOverFocus()
    }

    private func advanceVoiceOverFocus() {
        guard traversalIndex < traversalStops.count else {
            finishTraversal?()
            return
        }
        let stop = traversalStops[traversalIndex]
        traversalIndex += 1
        UIAccessibility.post(notification: .layoutChanged, argument: stop)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { [weak self] in
            self?.advanceVoiceOverFocus()
        }
    }

    func markTraceEmitted(_ payload: String) {
        payloadStop.text = payload
        payloadStop.isAccessibilityElement = true
        payloadStop.accessibilityIdentifier = "capture.payload"
        payloadStop.accessibilityLabel = payload
        endStop.accessibilityLabel = "Trace emitted"
    }
}
