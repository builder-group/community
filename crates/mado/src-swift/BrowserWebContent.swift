import ApplicationServices
import Foundation

enum BrowserWebContent {
    static func findTopLevelValue<T>(
        in element: AXUIElement,
        extract: (AXUIElement) -> T?
    ) -> T? {
        var queue = [(element: element, depth: 0)]
        var index = 0

        while index < queue.count {
            let current = queue[index]
            index += 1

            guard current.depth <= maxSearchDepth else {
                continue
            }

            let role = getRole(from: current.element)
            if isWebContentRole(role) {
                if let value = extract(current.element) {
                    return value
                }

                continue
            }

            for child in getTraversalChildren(from: current.element) {
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
