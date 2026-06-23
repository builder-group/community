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
        case .unknown:
            return nil
        }
    }

    // MARK: - Chromium

    private static func extractChromiumURL(from windowElement: AXUIElement)
        -> String?
    {
        if let url = findNormalizedURLBarValue(
            in: windowElement,
            matching: { isURLBarTextFieldByDOMIdentifier($0) }
        ) {
            return url
        }

        // Note: Some Chromium variants expose the address bar by label/placeholder, not urlbar DOM id
        if let url = findNormalizedURLBarValue(
            in: windowElement,
            matching: { isAddressBarTextField($0) }
        ) {
            return url
        }

        if let url = extractAXURLFromWebContent(windowElement) {
            return url
        }

        return nil
    }

    private static func isURLBarTextFieldByDOMIdentifier(
        _ element: AXUIElement
    ) -> Bool {
        return getRole(from: element) == "AXTextField"
            && getDOMIdentifier(from: element) == "urlbar-input"
    }

    // MARK: - Safari

    private static func extractSafariURL(from windowElement: AXUIElement)
        -> String?
    {
        return extractAXURLFromWebContent(windowElement)
    }

    // MARK: - Firefox

    private static func extractFirefoxURL(from windowElement: AXUIElement)
        -> String?
    {
        if let url = findNormalizedURLBarValue(
            in: windowElement,
            matching: {
                isAddressBarTextField($0)
                    || isFirefoxSearchEntryTextField($0)
            }
        ) {
            return url
        }

        if let url = extractAXURLFromWebContent(windowElement) {
            return url
        }

        return nil
    }

    private static func isFirefoxSearchEntryTextField(
        _ element: AXUIElement
    ) -> Bool {
        guard getRole(from: element) == "AXTextField" else { return false }

        // Note: Firefox labels its combined address/search bar as a search entry
        let description = (getDescription(from: element) ?? "").lowercased()
        return description.contains("search") && description.contains("enter")
    }

    // MARK: - Shared URL Strategies

    private static func extractAXURLFromWebContent(
        _ windowElement: AXUIElement
    ) -> String? {
        if let webArea = findElement(
            in: windowElement,
            where: { getRole(from: $0) == "AXWebArea" },
            maxDepth: maxBrowserURLSearchDepth
        ), let url = getAXURL(from: webArea) {
            return url.absoluteString
        }

        if let doc = findElement(
            in: windowElement,
            where: { getRole(from: $0) == "AXDocument" },
            maxDepth: maxBrowserURLSearchDepth
        ), let url = getAXURL(from: doc) {
            return url.absoluteString
        }

        return nil
    }

    private static func findNormalizedURLBarValue(
        in element: AXUIElement,
        matching predicate: (AXUIElement) -> Bool
    ) -> String? {
        if let urlBar = findElement(
            in: element,
            where: { field in
                predicate(field) && normalizedURLValue(from: field) != nil
            },
            maxDepth: maxBrowserURLSearchDepth
        ) {
            return normalizedURLValue(from: urlBar)
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
