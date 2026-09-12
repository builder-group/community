import ApplicationServices
import Foundation

struct BrowserPage {
    let url: String
    let contentBounds: [String: Double]?
}

enum BrowserWebContent {
    static func extract(from window: AXUIElement) -> BrowserPage? {
        let document = findDocument(in: window)
        guard let url = BrowserURLExtractor.extract(documentURL: document?.url, from: window) else {
            return nil
        }
        return BrowserPage(
            url: url,
            contentBounds: BrowserContentBoundsExtractor.extract(from: document?.element, in: window)
        )
    }

    static func findDocument(
        in window: AXUIElement,
        readRole: (AXUIElement) -> String? = getRole,
        readChildren: (AXUIElement) -> [AXUIElement] = getTraversalChildren,
        readURL: (AXUIElement) -> URL? = getAXURL
    ) -> (element: AXUIElement, url: String?)? {
        var unreadableDocument: AXUIElement?
        let document = findTopLevelValue(in: window, readRole: readRole, readChildren: readChildren) {
            element -> (element: AXUIElement, url: String?)? in
            if let url = readURL(element)?.absoluteString { return (element, url) }
            if unreadableDocument == nil { unreadableDocument = element }
            return nil
        }
        // Note: An unreadable URL can still have bounds for an address-bar fallback
        return document ?? unreadableDocument.map { ($0, nil) }
    }

    static func findTopLevelValue<T>(
        in element: AXUIElement,
        readRole: (AXUIElement) -> String? = getRole,
        readChildren: (AXUIElement) -> [AXUIElement] = getTraversalChildren,
        extract: (AXUIElement) -> T?
    ) -> T? {
        var queue = [(element: element, depth: 0)]
        var index = 0

        while index < queue.count {
            let current = queue[index]
            index += 1

            guard current.depth <= maxSearchDepth else { continue }

            if isWebContentRole(readRole(current.element)) {
                if let value = extract(current.element) { return value }
                continue
            }

            for child in readChildren(current.element) {
                queue.append((element: child, depth: current.depth + 1))
            }
        }

        return nil
    }

    static func isWebContentRole(_ role: String?) -> Bool {
        return role == "AXWebArea" || role == "AXDocument"
    }

    private static let maxSearchDepth = 30
}
