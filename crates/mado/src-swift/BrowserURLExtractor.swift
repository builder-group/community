import ApplicationServices
import Foundation

enum BrowserURLExtractor {
    static func extract(
        documentURL: String?,
        from windowElement: AXUIElement
    ) -> String? {
        return resolveURL(documentURL: documentURL) {
            guard let addressBar = findAddressBar(in: windowElement) else { return nil }
            var focused: CFTypeRef?
            AXUIElementCopyAttributeValue(addressBar, kAXFocusedAttribute as CFString, &focused)
            return (getValue(from: addressBar), focused as? Bool)
        }
    }

    static func resolveURL(
        documentURL: String?,
        addressBar: () -> (value: String?, isFocused: Bool?)?
    ) -> String? {
        // Note: The address bar can contain an uncommitted edit while the current page remains visible
        if let documentURL { return documentURL }
        // Note: An unreadable focus state cannot establish that the address is not being edited
        guard let address = addressBar(), address.isFocused == false else { return nil }
        return normalizeURL(address.value)
    }

    static func findAddressBar(in element: AXUIElement) -> AXUIElement? {
        // Note: The search root can be browser UI rendered as a web area
        var queue = getTraversalChildren(from: element).map { (element: $0, depth: 1) }
        var index = 0
        var emptyAddressBar: AXUIElement?

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

            if isAddressBar(current.element, role: role),
                let value = getValue(from: current.element)
            {
                if normalizeURL(value) != nil { return current.element }
                // Note: Keep searching past empty fields because Opera can nest the URL field inside one
                emptyAddressBar = current.element
            }

            for child in getTraversalChildren(from: current.element) {
                queue.append((element: child, depth: current.depth + 1))
            }
        }

        return emptyAddressBar
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

    private static func isAddressBar(_ element: AXUIElement, role: String?) -> Bool {
        guard role == "AXTextField" || role == "AXComboBox" else { return false }

        var identifier: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXIdentifierAttribute as CFString, &identifier)
        if let identifier = getDOMIdentifier(from: element) ?? (identifier as? String),
            ["urlbar-input", "urlbar", "omnibox", "urlFieldInput", "WEB_BROWSER_ADDRESS_AND_SEARCH_FIELD"].contains(
                identifier)
        {
            return true
        }

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
