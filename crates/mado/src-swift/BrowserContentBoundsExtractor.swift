import ApplicationServices
import Foundation

enum BrowserContentBoundsExtractor {
    static func extract(from content: AXUIElement?, in window: AXUIElement) -> [String: Double]? {
        guard let content, let bounds = getBounds(from: content) else { return nil }
        // Note: Some browsers expose document-sized frames, so clip the selected content to the window
        return clamp(bounds, to: getBounds(from: window))
    }

    static func clamp(
        _ bounds: [String: Double],
        to windowBounds: [String: Double]?
    ) -> [String: Double]? {
        guard let windowBounds else { return bounds }
        guard
            let boundsX = bounds["x"],
            let boundsY = bounds["y"],
            let boundsWidth = bounds["width"],
            let boundsHeight = bounds["height"],
            let windowX = windowBounds["x"],
            let windowY = windowBounds["y"],
            let windowWidth = windowBounds["width"],
            let windowHeight = windowBounds["height"]
        else {
            return bounds
        }

        let left = max(boundsX, windowX)
        let top = max(boundsY, windowY)
        let right = min(boundsX + boundsWidth, windowX + windowWidth)
        let bottom = min(boundsY + boundsHeight, windowY + windowHeight)
        let width = right - left
        let height = bottom - top

        guard width > 0, height > 0 else {
            return nil
        }

        return [
            "x": left,
            "y": top,
            "width": width,
            "height": height,
        ]
    }
}
