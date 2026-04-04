import AppKit
import ApplicationServices
import Foundation

/// Window information from Accessibility API and CoreGraphics.
struct WindowInfo {
    let title: String?
    let windowId: UInt32?
    let bounds: [String: Double]?
    let app: AppInfo
    let browser: BrowserInfo?

    /// Convert to dictionary for JSON serialization.
    func toDictionary() -> [String: Any?] {
        return [
            "title": title,
            "windowId": windowId,
            "bounds": bounds,
            "app": app.toDictionary(),
            "browser": browser?.toDictionary(),
        ]
    }

    /// Create from NSRunningApplication.
    static func fromNS(
        _ app: NSRunningApplication,
        includeAppIcon: Bool = false,
        includeBrowserInfo: Bool = false,
        includeWebsiteInfo: Bool = false
    ) -> WindowInfo {
        return fromPID(
            app.processIdentifier,
            includeAppIcon: includeAppIcon,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )
    }

    /// Create from PID.
    static func fromPID(
        _ pid: pid_t,
        includeAppIcon: Bool = false,
        includeBrowserInfo: Bool = false,
        includeWebsiteInfo: Bool = false
    ) -> WindowInfo {
        let appElement = AXUIElementCreateApplication(pid)
        let appInfo = AppInfo.fromPID(pid, includeIcon: includeAppIcon)
        let bundleId = appInfo.bundleId

        // Get focused window via Accessibility API
        guard let windowElement = getFocusedWindow(from: appElement) else {
            return WindowInfo(
                title: nil,
                windowId: nil,
                bounds: nil,
                app: appInfo,
                browser: nil
            )
        }

        let title = getTitle(from: windowElement)
        let bounds = getBounds(from: windowElement)

        // CoreGraphics provides stable window IDs (Accessibility API doesn't expose window IDs reliably).
        let windowId = findWindowId(pid: pid, bounds: bounds)

        // Get browser info if enabled and app is a browser
        let browser: BrowserInfo? =
            if includeBrowserInfo, let bundleId = bundleId {
                BrowserInfo.extract(
                    bundleId: bundleId,
                    windowElement: windowElement,
                    windowTitle: title,
                    includeWebsiteInfo: includeWebsiteInfo
                )
            } else {
                nil
            }

        return WindowInfo(
            title: title,
            windowId: windowId,
            bounds: bounds,
            app: appInfo,
            browser: browser
        )
    }

    /// Get frontmost window info.
    static func getFrontmost(
        includeAppIcon: Bool = false,
        includeBrowserInfo: Bool = false,
        includeWebsiteInfo: Bool = false
    ) -> WindowInfo? {
        guard let app = NSWorkspace.shared.frontmostApplication else {
            return nil
        }
        return fromNS(
            app,
            includeAppIcon: includeAppIcon,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )
    }
}
