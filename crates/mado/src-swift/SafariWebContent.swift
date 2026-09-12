import ApplicationServices
import Foundation

enum SafariWebContent {
    static func extract(from window: AXUIElement) -> BrowserPage? {
        let document = BrowserWebContent.findDocument(in: window)
        guard let url = resolveURL(documentURL: document?.url, isStartPage: { isStartPage(in: window) }) else {
            return nil
        }
        return BrowserPage(
            url: url,
            contentBounds: BrowserContentBoundsExtractor.extract(from: document?.element, in: window)
        )
    }

    static func resolveURL(documentURL: String?, isStartPage: () -> Bool) -> String? {
        if let documentURL { return documentURL }
        // Note: Safari's native Start Page has no document URL
        if isStartPage() { return "about:blank" }
        // Note: Safari's shortened address can omit the path, so it cannot serve as a fallback
        return nil
    }

    static func isStartPage(
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

            guard current.depth <= maxSearchDepth, index <= 2_500 else {
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

    private static let maxSearchDepth = 30
}
