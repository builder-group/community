import AppKit
import ApplicationServices
import Foundation

struct BrowserAXProbe {
    static let sampleURL = "https://example.com/"

    let application: NSRunningApplication
    let bundleId: String
    let windowElement: AXUIElement

    func renderMarkdown() -> String {
        let observations = collectObservations()
        let addressFields = observations.filter { $0.kind == .addressField }
        let webContent = observations.filter { $0.kind == .webContent }
        let applicationName = application.localizedName ?? bundleId
        let windowTitle =
            axString(
                windowElement,
                attribute: kAXTitleAttribute as String
            ) ?? "nil"
        let hasWebContentURL = webContent.contains { $0.url != nil }
        let hasWebContentBounds = webContent.contains {
            hasUsableBounds($0.frame)
        }

        var lines = [
            "## \(applicationName)",
            "",
            "- Probe date: \(probeDate())",
            "- Bundle ID: `\(bundleId)`",
            "- Version: \(markdownCode(applicationVersion()))",
            "- macOS: \(markdownCode(ProcessInfo.processInfo.operatingSystemVersionString))",
            "- Window title: \(markdownCode(windowTitle))",
            "- Window bounds: \(markdownCode(format(axFrame(of: windowElement))))",
            "",
        ]

        lines.append(
            contentsOf: renderSection(
                title: "Browser Chrome URL Field",
                observations: addressFields
            )
        )
        lines.append("")
        lines.append(
            contentsOf: renderSection(
                title: "Web Content `AXURL`",
                observations: webContent
            )
        )
        lines.append(contentsOf: [
            "",
            "### Probe Summary",
            "",
            "- Browser chrome URL field: \(addressFields.isEmpty ? "Not observed" : "Found")",
            "- Web content `AXURL`: \(hasWebContentURL ? "Found" : "Not observed")",
            "- Top-level web content bounds: \(hasWebContentBounds ? "Found" : "Not observed")",
        ])

        return lines.joined(separator: "\n")
    }

    private func collectObservations() -> [Observation] {
        var queue = [TraversalNode(element: windowElement, depth: 0, path: [])]
        var observations: [Observation] = []
        var index = 0

        while index < queue.count && index < maxVisitedNodes {
            let current = queue[index]
            index += 1

            guard current.depth <= maxTraversalDepth else {
                continue
            }

            let path = current.path + [nodeLabel(current.element)]
            let role = axString(
                current.element,
                attribute: kAXRoleAttribute as String
            )

            if isWebContentRole(role) {
                observations.append(
                    Observation(
                        kind: .webContent,
                        path: path,
                        value: axString(
                            current.element,
                            attribute: kAXValueAttribute as String
                        ),
                        url: axURL(current.element)?.absoluteString,
                        frame: axFrame(of: current.element)
                    )
                )
                // Nested web content can represent embedded pages rather than the active tab
                continue
            }

            if isAddressField(current.element, role: role) {
                observations.append(
                    Observation(
                        kind: .addressField,
                        path: path,
                        value: axString(
                            current.element,
                            attribute: kAXValueAttribute as String
                        ),
                        url: axURL(current.element)?.absoluteString,
                        frame: axFrame(of: current.element)
                    )
                )
            }

            for child in axTraversalChildren(of: current.element) {
                queue.append(
                    TraversalNode(
                        element: child,
                        depth: current.depth + 1,
                        path: path
                    )
                )
            }
        }

        return observations
    }

    private func renderSection(
        title: String,
        observations: [Observation]
    ) -> [String] {
        var lines = ["### \(title)", ""]
        guard !observations.isEmpty else {
            lines.append("Not observed.")
            return lines
        }

        for (index, observation) in observations.enumerated() {
            if index > 0 {
                lines.append("")
            }
            lines.append(contentsOf: render(observation))
        }
        return lines
    }

    private func render(_ observation: Observation) -> [String] {
        var lines = [
            "Found.",
            "",
            "```text",
            observation.path.joined(separator: "\n> "),
            "```",
        ]

        if let value = compact(observation.value) {
            lines.append("")
            lines.append("Value: \(markdownCode(value))")
        }
        if let url = compact(observation.url) {
            lines.append("")
            lines.append("`AXURL`: \(markdownCode(url))")
        }
        if let frame = observation.frame {
            lines.append("")
            lines.append("Bounds: \(markdownCode(format(frame)))")
        }

        return lines
    }

    private func applicationVersion() -> String {
        guard
            let bundleURL = application.bundleURL,
            let bundle = Bundle(url: bundleURL)
        else {
            return "unknown"
        }

        let shortVersion =
            bundle.object(
                forInfoDictionaryKey: "CFBundleShortVersionString"
            ) as? String
        let buildVersion =
            bundle.object(
                forInfoDictionaryKey: "CFBundleVersion"
            ) as? String

        switch (shortVersion, buildVersion) {
        case (let shortVersion?, let buildVersion?):
            return "\(shortVersion) (\(buildVersion))"
        case (let shortVersion?, nil):
            return shortVersion
        case (nil, let buildVersion?):
            return buildVersion
        case (nil, nil):
            return "unknown"
        }
    }

    private func nodeLabel(_ element: AXUIElement) -> String {
        var parts = [
            axString(element, attribute: kAXRoleAttribute as String) ?? "?"
        ]
        appendAttribute(
            "id",
            value: axString(element, attribute: "AXDOMIdentifier"),
            to: &parts
        )
        appendAttribute(
            "desc",
            value: axString(
                element,
                attribute: kAXDescriptionAttribute as String
            ),
            to: &parts
        )
        appendAttribute(
            "placeholder",
            value: axString(
                element,
                attribute: kAXPlaceholderValueAttribute as String
            ),
            to: &parts
        )
        appendAttribute(
            "title",
            value: axString(element, attribute: kAXTitleAttribute as String),
            to: &parts
        )
        return parts.joined(separator: " ")
    }

    private func appendAttribute(
        _ name: String,
        value: String?,
        to parts: inout [String]
    ) {
        guard let value = compact(value, maxLength: 80) else {
            return
        }
        let escapedValue = value.replacingOccurrences(of: "\"", with: "\\\"")
        parts.append("\(name)=\"\(escapedValue)\"")
    }

    private func isAddressField(_ element: AXUIElement, role: String?) -> Bool {
        guard role == kAXTextFieldRole as String || role == "AXComboBox" else {
            return false
        }

        let domIdentifier = axString(element, attribute: "AXDOMIdentifier")?
            .lowercased()
        let description = axString(
            element,
            attribute: kAXDescriptionAttribute as String
        )?.lowercased()
        let placeholder = axString(
            element,
            attribute: kAXPlaceholderValueAttribute as String
        )?.lowercased()
        let value = axString(element, attribute: kAXValueAttribute as String)

        return domIdentifier == "urlbar-input"
            || containsURLLabel(description)
            || containsURLLabel(placeholder)
            || looksLikeURL(value)
    }

    private func containsURLLabel(_ value: String?) -> Bool {
        guard let value else { return false }
        return value.contains("address") || value.contains("url")
    }

    private func looksLikeURL(_ value: String?) -> Bool {
        guard let value else { return false }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 3, !trimmed.contains(" ") else {
            return false
        }

        return URL(string: trimmed)?.scheme != nil || trimmed.contains(".")
    }

    private func isWebContentRole(_ role: String?) -> Bool {
        return role == "AXWebArea" || role == "AXDocument"
    }

    private func compact(_ value: String?, maxLength: Int = 200) -> String? {
        guard var value else { return nil }
        value = value.replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return nil }

        if value.count <= maxLength {
            return value
        }
        let endIndex = value.index(value.startIndex, offsetBy: maxLength)
        return "\(value[..<endIndex])..."
    }

    private func format(_ frame: CGRect?) -> String {
        guard let frame else { return "nil" }
        let origin = "(\(rounded(frame.origin.x)), \(rounded(frame.origin.y)))"
        let size = "\(rounded(frame.width))×\(rounded(frame.height))"
        return "\(origin) \(size)"
    }

    private func rounded(_ value: CGFloat) -> String {
        return String(format: "%.0f", value)
    }

    private func markdownCode(_ value: String) -> String {
        return "`\(value.replacingOccurrences(of: "`", with: "\\`"))`"
    }

    private func probeDate() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    private func hasUsableBounds(_ frame: CGRect?) -> Bool {
        guard let frame else { return false }
        return frame.width > 0 && frame.height > 0
    }

    private let maxTraversalDepth = 30
    private let maxVisitedNodes = 2_500
}

private struct TraversalNode {
    let element: AXUIElement
    let depth: Int
    let path: [String]
}

private struct Observation {
    enum Kind {
        case addressField
        case webContent
    }

    let kind: Kind
    let path: [String]
    let value: String?
    let url: String?
    let frame: CGRect?
}
