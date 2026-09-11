import ApplicationServices
import Foundation

enum BrowserURLExtractor {
    static func extract(
        family: BrowserFamily,
        from windowElement: AXUIElement
    ) -> String? {
        let documentURL = BrowserWebContent.findTopLevelValue(
            in: windowElement, extract: { getAXURL(from: $0)?.absoluteString }
        )
        return resolveURL(
            family: family,
            documentURL: documentURL,
            isSafariStartPage: { isSafariStartPage(in: windowElement) }
        ) {
            guard let addressBar = findAddressBar(in: windowElement) else { return nil }
            var focused: CFTypeRef?
            AXUIElementCopyAttributeValue(addressBar, kAXFocusedAttribute as CFString, &focused)
            return (getValue(from: addressBar), focused as? Bool)
        }
    }

    static func resolveURL(
        family: BrowserFamily,
        documentURL: String?,
        isSafariStartPage: () -> Bool = { false },
        addressBar: () -> (value: String?, isFocused: Bool?)?
    ) -> String? {
        // Note: The address bar can contain an uncommitted edit while the current page remains visible
        if let documentURL { return documentURL }
        // Note: Safari's native Start Page has no URL, so normalize it to a known internal page
        if family == .safari, isSafariStartPage() { return "about:blank" }
        // Note: Safari can expose only the hostname in its unfocused address bar, losing the
        // page path (example.com/articles becomes example.com), so require the document URL
        guard family != .safari else { return nil }
        // Note: An unreadable focus state cannot establish that the address is not being edited
        guard let address = addressBar(), address.isFocused == false else { return nil }
        return normalizeURL(address.value)
    }

    static func isSafariStartPage(
        in element: AXUIElement,
        readAttribute: (AXUIElement, CFString) -> (error: AXError, value: CFTypeRef?) = {
            element, attribute in
            var value: CFTypeRef?
            let error = AXUIElementCopyAttributeValue(element, attribute, &value)
            return (error, value)
        }
    ) -> Bool {
        var queue = [(element: element, depth: 0)]
        var index = 0
        var foundStartPage = false

        while index < queue.count {
            let current = queue[index]
            index += 1

            guard current.depth <= maxBrowserURLSearchDepth, index <= 2_500 else {
                return false
            }

            let roleAttribute = readAttribute(current.element, kAXRoleAttribute as CFString)
            guard roleAttribute.error == .success, let role = roleAttribute.value as? String else {
                return false
            }
            // Note: Safari can retain the Start Page collection during navigation. A web
            // document without a readable URL is still unknown, not a confirmed Start Page.
            if BrowserWebContent.isWebContentRole(role) { return false }

            if role == "AXList" {
                let identifier = readAttribute(current.element, kAXIdentifierAttribute as CFString)
                if identifier.error == .success,
                    identifier.value as? String == "StartPageCollectionView"
                {
                    foundStartPage = true
                }
            }

            var children: [AXUIElement] = []
            for attribute in [kAXChildrenAttribute, "AXVisibleChildren"] {
                let result = readAttribute(current.element, attribute as CFString)
                // Note: Leaves can omit child attributes, but a failed query cannot establish
                // that no web document exists in this subtree
                if result.error == .attributeUnsupported || result.error == .noValue { continue }
                guard result.error == .success, let values = result.value as? [AXUIElement] else {
                    return false
                }
                for child in values where !children.contains(where: { CFEqual($0, child) }) {
                    children.append(child)
                }
            }
            for child in children {
                queue.append((element: child, depth: current.depth + 1))
            }
        }

        return foundStartPage
    }

    static func findAddressBar(in element: AXUIElement) -> AXUIElement? {
        var queue = [(element: element, depth: 0)]
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
            ["urlbar-input", "urlbar", "omnibox", "WEB_BROWSER_ADDRESS_AND_SEARCH_FIELD"].contains(
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
