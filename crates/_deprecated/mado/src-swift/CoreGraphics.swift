import ApplicationServices
import Foundation

/// Find window ID using CoreGraphics.
/// Strategy: Match by bounds first (if available), then fall back to z-order (first window).
/// Note: We can't identify windows by title because CoreGraphics doesn't provide window titles.
func findWindowId(pid: pid_t, bounds: [String: Double]?) -> UInt32? {
    let option: CGWindowListOption = [
        .optionOnScreenOnly, .excludeDesktopElements,
    ]
    guard
        let windowList = CGWindowListCopyWindowInfo(option, kCGNullWindowID)
            as? [[String: Any]]
    else {
        return nil
    }

    // Strategy 1: Match by bounds
    if let bounds = bounds,
        let x = bounds["x"],
        let y = bounds["y"],
        let width = bounds["width"],
        let height = bounds["height"]
    {
        let tolerance: Double = 2.0  // Allow 2px difference for rounding

        for window in windowList {
            guard
                let ownerPID = window["kCGWindowOwnerPID"] as? Int,
                ownerPID == pid,
                isValidWindow(window),
                let boundsDict = window["kCGWindowBounds"] as? [String: Any],
                let cgX = boundsDict["X"] as? Double,
                let cgY = boundsDict["Y"] as? Double,
                let cgWidth = boundsDict["Width"] as? Double,
                let cgHeight = boundsDict["Height"] as? Double
            else { continue }

            // Match if bounds are within tolerance
            if abs(cgX - x) <= tolerance && abs(cgY - y) <= tolerance
                && abs(cgWidth - width) <= tolerance
                && abs(cgHeight - height) <= tolerance
            {
                return extractWindowId(window)
            }
        }
    }

    // Strategy 2: Fall back to z-order (first window is focused)
    // CoreGraphics returns windows in frontmost-first order (z-order),
    // so the first window for a PID is the focused/frontmost window
    for window in windowList {
        guard
            let ownerPID = window["kCGWindowOwnerPID"] as? Int,
            ownerPID == pid,
            isValidWindow(window)
        else { continue }

        return extractWindowId(window)
    }

    return nil
}

/// Check if window is visible and not transparent.
private func isValidWindow(_ window: [String: Any]) -> Bool {
    guard let isOnscreen = window["kCGWindowIsOnscreen"] as? Bool, isOnscreen
    else {
        return false
    }

    guard let alpha = window["kCGWindowAlpha"] as? Double, alpha > 0.0 else {
        return false
    }

    return true
}

/// Extract window ID from CoreGraphics window dictionary.
private func extractWindowId(_ window: [String: Any]) -> UInt32? {
    guard let windowId = window["kCGWindowNumber"] as? Int else {
        return nil
    }
    return UInt32(windowId)
}
