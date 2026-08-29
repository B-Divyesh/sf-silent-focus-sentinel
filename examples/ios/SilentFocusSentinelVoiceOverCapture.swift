// Add this file to the *app target*, not the UI-test target.
//
// It uses public UIKit accessibility notifications to observe the focus stop
// sequence that VoiceOver actually enters on an iOS Simulator. The observer is
// deliberately not handed a list of elements: a newly focusable node is
// recorded when VoiceOver reaches it. The runnable example uses a final focus
// stop as a cross-process completion signal and emits from the app process.
import Foundation
import UIKit

private struct SilentFocusVoiceOverStop: Encodable {
    let index: Int
    let id: String
    let role: String
    let label: String
    let value: String
    let hint: String
    let announcement: String
    let capture: String
    let ignored: Bool
}

/// Observes public `UIAccessibility.elementFocusedNotification` callbacks.
/// The callback order is the Simulator's VoiceOver traversal order. UIKit does
/// not expose VoiceOver's audio buffer, so `announcement` records only the
/// author-provided label, value, and hint at that focused stop. It must not be
/// described as a speech recording or transcript.
final class SilentFocusSentinelVoiceOverCapture {
    static let launchArgument = "--silent-focus-sentinel-capture"
    private static let marker = "SFS_VOICEOVER_STOP:"

    private var observer: NSObjectProtocol?
    private var stops: [SilentFocusVoiceOverStop] = []
    private var lastObject: ObjectIdentifier?
    private var endElementID: String?
    private var onEmission: (() -> Void)?
    private var emitted = false

    func start(emitAfterFocusing endElementID: String? = nil, onEmission: (() -> Void)? = nil) {
        stop()
        stops.removeAll()
        emitted = false
        self.endElementID = endElementID
        self.onEmission = onEmission
        observer = NotificationCenter.default.addObserver(
            forName: UIAccessibility.elementFocusedNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let self,
                  let element = note.userInfo?[UIAccessibility.focusedElementUserInfoKey] as? NSObject else { return }
            self.appendFocusedElement(element)
        }
    }

    func stop() {
        if let observer { NotificationCenter.default.removeObserver(observer) }
        observer = nil
        lastObject = nil
    }

    /// Records the element targeted by a public accessibility focus move in
    /// the bundled deterministic example. Production integrations should rely
    /// on the focus notification observer above.
    func captureScriptedFocusStop(_ element: NSObject) {
        appendFocusedElement(element)
    }

    /// Prints JSON Lines that `record-xctest` extracts from xcodebuild output.
    /// Keep this call in the app after the UI test has completed its traversal.
    func emitCapturedTrace() {
        guard !emitted else { return }
        emitted = true
        let encoder = JSONEncoder()
        for stop in stops {
            guard let data = try? encoder.encode(stop), let line = String(data: data, encoding: .utf8) else { continue }
            // NSLog is collected with the Simulator test log by xcodebuild;
            // `record-xctest` searches for the marker after any log prefix.
            NSLog("%@", Self.marker + line)
        }
        let completion = onEmission
        stop()
        completion?()
    }

    private func appendFocusedElement(_ element: NSObject) {
        let identity = ObjectIdentifier(element)
        // UIKit can send a duplicate callback while the same stop is settling.
        // It is not a new VoiceOver stop, so retain the first callback only.
        guard identity != lastObject else { return }
        lastObject = identity

        let identifier = (element as? UIAccessibilityIdentification)?.accessibilityIdentifier
        let id = identifier?.isEmpty == false
            ? identifier!
            : String(reflecting: type(of: element)) + "#" + String(stops.count + 1)
        let label = element.accessibilityLabel ?? ""
        let value = element.accessibilityValue ?? ""
        let hint = element.accessibilityHint ?? ""
        stops.append(SilentFocusVoiceOverStop(
            index: stops.count + 1,
            id: id,
            role: role(of: element),
            label: label,
            value: value,
            hint: hint,
            announcement: Self.effectiveAnnouncement(label: label, value: value, hint: hint),
            capture: "voiceover_simulator",
            ignored: false
        ))

        // The UI-test process cannot call this app-process object. A final
        // traversal stop is the deterministic completion signal shared by
        // both processes; emission therefore happens in the app itself.
        if id == endElementID {
            DispatchQueue.main.async { [weak self] in self?.emitCapturedTrace() }
        }
    }

    /// Captures author-provided accessibility content. This is not a recording
    /// or transcript of VoiceOver speech; the independent observation ledger
    /// used by the accuracy test is kept separate from these fields.
    static func effectiveAnnouncement(label: String, value: String, hint: String) -> String {
        [label, value, hint]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    private func role(of element: NSObject) -> String {
        switch element.accessibilityTraits {
        case let traits where traits.contains(.button): return "button"
        case let traits where traits.contains(.header): return "header"
        case let traits where traits.contains(.link): return "link"
        case let traits where traits.contains(.image): return "image"
        case let traits where traits.contains(.adjustable): return "adjustable"
        default: return String(describing: type(of: element))
        }
    }
}
