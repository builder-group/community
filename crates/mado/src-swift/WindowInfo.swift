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

    /// Create from PID.
    static func fromPID(
        _ pid: pid_t,
        includeAppIcon: Bool = false,
        includeAppColor: Bool = false,
        includeBrowserInfo: Bool = false,
        includeWebsiteInfo: Bool = false
    ) -> WindowInfo {
        let appElement = AXUIElementCreateApplication(pid)
        let appInfo = AppInfo.fromPID(
            pid,
            includeIcon: includeAppIcon,
            includeColor: includeAppColor
        )
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

        let bounds = getBounds(from: windowElement)
        return fromElement(
            windowElement, app: appInfo,
            windowId: findWindowId(pid: pid, bounds: bounds),
            bounds: bounds,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo)
    }

    /// Reads an observed element using its cached identity.
    /// A missing ID stays missing because the foreground fallback could identify a different window.
    static func fromElement(
        _ windowElement: AXUIElement,
        app appInfo: AppInfo,
        windowId: UInt32?,
        bounds: [String: Double]?,
        includeBrowserInfo: Bool,
        includeWebsiteInfo: Bool
    ) -> WindowInfo {
        let bundleId = appInfo.bundleId
        let title = getTitle(from: windowElement)

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
        includeAppColor: Bool = false,
        includeBrowserInfo: Bool = false,
        includeWebsiteInfo: Bool = false
    ) -> WindowInfo? {
        guard let app = NSWorkspace.shared.frontmostApplication else {
            return nil
        }
        // Note: One-shot queries require a focused window, while monitor snapshots can contain app data only
        guard
            let element = getFocusedWindow(
                from: AXUIElementCreateApplication(app.processIdentifier))
        else { return nil }
        let bounds = getBounds(from: element)
        return fromElement(
            element,
            app: AppInfo.fromNS(app, includeIcon: includeAppIcon, includeColor: includeAppColor),
            windowId: findWindowId(pid: app.processIdentifier, bounds: bounds),
            bounds: bounds,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo)
    }
}
