import ApplicationServices
import Foundation

enum VivaldiWebContent {
    static func extract(from window: AXUIElement) -> BrowserPage? {
        guard let interface = findInterface(in: window) else { return nil }

        let document = findPage(in: interface)
        guard let url = BrowserURLExtractor.extract(documentURL: document?.url, from: interface) else {
            return nil
        }
        return BrowserPage(
            url: url,
            contentBounds: BrowserContentBoundsExtractor.extract(from: document?.element, in: window)
        )
    }

    static func findInterface(in window: AXUIElement) -> AXUIElement? {
        return BrowserWebContent.findTopLevelValue(in: window) { isInterface($0) ? $0 : nil }
    }

    static func findPage(
        in interface: AXUIElement,
        readAttribute: (AXUIElement, CFString) -> (error: AXError, value: CFTypeRef?) = {
            element, attribute in
            var value: CFTypeRef?
            let error = AXUIElementCopyAttributeValue(element, attribute, &value)
            return (error, value)
        }
    ) -> (element: AXUIElement, url: String?)? {
        var queue = [(element: interface, depth: 0, insideActivePage: false)]
        var index = 0
        var internalPage: AXUIElement?
        var unreadableDocument: AXUIElement?

        while index < queue.count {
            let current = queue[index]
            index += 1

            guard current.depth <= maxSearchDepth, index <= 2_500 else { return nil }

            let roleAttribute = readAttribute(current.element, kAXRoleAttribute as CFString)
            guard roleAttribute.error == .success, let role = roleAttribute.value as? String else {
                return nil
            }
            // Note: The root is Vivaldi's interface web area, not a page document
            if current.depth > 0, BrowserWebContent.isWebContentRole(role) {
                guard current.insideActivePage else { continue }
                let url = readAttribute(current.element, kAXURLAttribute as CFString)
                if url.error == .success {
                    if let value = url.value as? URL {
                        return (current.element, value.absoluteString)
                    }
                    if let value = url.value as? String, let parsed = URL(string: value) {
                        return (current.element, parsed.absoluteString)
                    }
                }
                if unreadableDocument == nil { unreadableDocument = current.element }
                continue
            }

            var insideActivePage = current.insideActivePage
            if role == "AXGroup" {
                let identifier = readAttribute(current.element, "AXDOMIdentifier" as CFString)
                guard identifier.error == .success || identifier.error == .attributeUnsupported
                    || identifier.error == .noValue
                else { return nil }
                // Note: Web panels expose URLs independently of the selected tab
                if identifier.value as? String == "panels-container" { continue }

                let attribute = readAttribute(current.element, "AXDOMClassList" as CFString)
                let classes: [String]
                if attribute.error == .attributeUnsupported || attribute.error == .noValue {
                    classes = []
                } else if attribute.error == .success, let value = attribute.value as? [String] {
                    classes = value
                } else {
                    return nil
                }
                // Note: Tiling adds containers, so require the active marker on the page itself
                if classes.contains("webpageview") {
                    guard classes.contains("active") else { continue }
                    insideActivePage = true
                }
                if insideActivePage, classes.contains("internal-page") {
                    internalPage = current.element
                }
            }

            var children: [AXUIElement] = []
            for attribute in [kAXChildrenAttribute, "AXVisibleChildren"] {
                let result = readAttribute(current.element, attribute as CFString)
                if result.error == .attributeUnsupported || result.error == .noValue { continue }
                // Note: A failed subtree query cannot establish that only internal content remains
                guard result.error == .success, let values = result.value as? [AXUIElement] else {
                    return nil
                }
                for child in values where !children.contains(where: { CFEqual($0, child) }) {
                    children.append(child)
                }
            }
            for child in children {
                queue.append((
                    element: child, depth: current.depth + 1,
                    insideActivePage: insideActivePage
                ))
            }
        }

        // Note: An unreadable document takes precedence over retained internal UI
        if let unreadableDocument { return (unreadableDocument, nil) }
        return internalPage.map { ($0, "about:blank") }
    }

    private static func isInterface(_ element: AXUIElement) -> Bool {
        // Note: Vivaldi renders its browser controls in a web area containing the actual page
        return getAXURL(from: element)?.absoluteString
            == "chrome-extension://mpognobbkildjkofajifpdfhcoklimli/window.html"
    }

    private static let maxSearchDepth = 30
}
