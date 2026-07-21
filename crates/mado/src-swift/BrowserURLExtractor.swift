import ApplicationServices
import Foundation

enum BrowserURLExtractor {
    static func extract(
        family: BrowserFamily,
        from windowElement: AXUIElement
    ) -> String? {
        switch family {
        case .chromium:
            return extractChromiumURL(from: windowElement)
        case .safari:
            return extractSafariURL(from: windowElement)
        case .firefox:
            return extractFirefoxURL(from: windowElement)
        }
    }

    // MARK: - Chromium

    private static func extractChromiumURL(from windowElement: AXUIElement)
        -> String?
    {
        if let url = findNormalizedURLBarValue(
            in: windowElement,
            matching: { isAddressBarTextField($0) }
        ) {
            return url
        }

        if let url = findTopLevelWebContentURL(in: windowElement) {
            return url
        }

        return nil
    }

    // MARK: - Safari

    private static func extractSafariURL(from windowElement: AXUIElement)
        -> String?
    {
        return findTopLevelWebContentURL(in: windowElement)
    }

    // MARK: - Firefox

    private static func extractFirefoxURL(from windowElement: AXUIElement)
        -> String?
    {
        if let url = findNormalizedURLBarValue(
            in: windowElement,
            matching: { isAddressBarTextField($0) }
        ) {
            return url
        }

        if let url = findTopLevelWebContentURL(in: windowElement) {
            return url
        }

        return nil
    }

    // MARK: - Shared URL Strategies

    /// Returns the AXURL from the nearest web-content node without descending into nested web content.
    private static func findTopLevelWebContentURL(
        in element: AXUIElement
    ) -> String? {
        return BrowserWebContent.findTopLevelValue(
            in: element,
            extract: { getAXURL(from: $0)?.absoluteString }
        )
    }

    private static func findNormalizedURLBarValue(
        in element: AXUIElement,
        matching predicate: (AXUIElement) -> Bool
    ) -> String? {
        var queue = [(element: element, depth: 0)]
        var index = 0

        while index < queue.count {
            let current = queue[index]
            index += 1

            guard current.depth <= maxBrowserURLSearchDepth else {
                continue
            }

            let role = getRole(from: current.element)
            if BrowserWebContent.isWebContentRole(role) {
                continue
            }

            if predicate(current.element),
                let url = normalizedURLValue(from: current.element)
            {
                return url
            }

            for child in getTraversalChildren(from: current.element) {
                queue.append((element: child, depth: current.depth + 1))
            }
        }

        return nil
    }

    private static func normalizedURLValue(from element: AXUIElement) -> String?
    {
        return normalizeURL(getValue(from: element))
    }

    private static func normalizeURL(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmed.isEmpty || trimmed.count < 3 {
            return nil
        }

        for prefix in acceptedBrowserURLPrefixes {
            if trimmed.hasPrefix(prefix) {
                return trimmed
            }
        }

        if trimmed.contains(".") && !trimmed.contains(" ") {
            return "https://\(trimmed)"
        }

        return nil
    }

    private static func isAddressBarTextField(_ element: AXUIElement) -> Bool {
        guard getRole(from: element) == "AXTextField" else { return false }

        let description = (getDescription(from: element) ?? "").lowercased()
        let placeholder = (getPlaceholderValue(from: element) ?? "")
            .lowercased()

        let descriptionLooksLikeURLBar =
            description.contains("address")
            || description.contains("url")
        let placeholderLooksLikeURLBar =
            placeholder.contains("address")
            || placeholder.contains("url")

        return descriptionLooksLikeURLBar
            || placeholderLooksLikeURLBar
    }

    private static let maxBrowserURLSearchDepth = 30
    private static let acceptedBrowserURLPrefixes = [
        "http://", "https://", "file://", "about:", "chrome://", "edge://",
        "brave://", "arc://", "opera://",
    ]
}
