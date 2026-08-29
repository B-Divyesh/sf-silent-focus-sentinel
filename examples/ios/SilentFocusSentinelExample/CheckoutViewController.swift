import UIKit

final class CheckoutViewController: UIViewController {
    var startCapture: (() -> Void)?
    private let endStop = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let title = UILabel()
        title.text = "Checkout"
        title.font = .preferredFont(forTextStyle: .largeTitle)
        title.accessibilityIdentifier = "checkout.title"
        title.accessibilityTraits = .header

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

        let stack = UIStackView(arrangedSubviews: [title, address, unnamed, total, repeatedTotal, pay, endStop])
        stack.axis = .vertical
        stack.spacing = 24
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 32),
            unnamed.heightAnchor.constraint(equalToConstant: 44),
            endStop.heightAnchor.constraint(equalToConstant: 44)
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startCapture?()
        UIAccessibility.post(notification: .screenChanged, argument: view)
    }

    func markTraceEmitted() {
        endStop.accessibilityLabel = "Trace emitted"
    }
}
