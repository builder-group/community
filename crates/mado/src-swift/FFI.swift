import ApplicationServices
import Foundation
import SwiftRs

// MARK: - Monitor Lifecycle

@_cdecl("mado_start_monitor")
public func madoStartMonitor(
    callbackPtr: UnsafeRawPointer,
    trackWindowChanges: Bool,
    trackWindowBoundsChanges: Bool,
    includeAppIcon: Bool,
    includeAppColor: Bool,
    includeBrowserInfo: Bool,
    includeWebsiteInfo: Bool,
    reconcileIntervalMs: UInt32
) {
    // Singleton check: Rust side already prevents concurrent calls, this is defensive
    guard WindowMonitor.shared == nil else { return }

    // unsafeBitCast is safe here: Rust guarantees callbackPtr is a valid WindowEventCallback function pointer
    let callback = unsafeBitCast(callbackPtr, to: WindowEventCallback.self)
    let monitor = WindowMonitor(
        callback: callback,
        trackWindowChanges: trackWindowChanges,
        trackWindowBoundsChanges: trackWindowBoundsChanges,
        includeAppIcon: includeAppIcon,
        includeAppColor: includeAppColor,
        includeBrowserInfo: includeBrowserInfo,
        includeWebsiteInfo: includeWebsiteInfo,
        reconcileIntervalMs: reconcileIntervalMs
    )
    WindowMonitor.shared = monitor
    monitor.start()
    WindowMonitor.shared = nil
}

@_cdecl("mado_stop_monitor")
public func madoStopMonitor() -> Bool {
    guard let monitor = WindowMonitor.shared else { return false }
    monitor.stop()
    return true
}

@_cdecl("mado_refresh_monitor")
public func madoRefreshMonitor() -> Bool {
    guard let monitor = WindowMonitor.shared else { return false }
    monitor.refresh()
    return true
}

// MARK: - Permissions

@_cdecl("mado_is_trusted")
public func madoIsTrusted() -> Bool {
    return AXIsProcessTrusted()
}

// MARK: - Queries

@_cdecl("mado_get_active_app")
public func madoGetActiveApp(
    includeAppIcon: Bool,
    includeAppColor: Bool
) -> SRString? {
    guard
        let appInfo = AppInfo.getFrontmost(
            includeIcon: includeAppIcon,
            includeColor: includeAppColor
        )
    else {
        return nil
    }
    return toJson(appInfo.toDictionary())
}

@_cdecl("mado_get_active_window")
public func madoGetActiveWindow(
    includeAppIcon: Bool,
    includeAppColor: Bool,
    includeBrowserInfo: Bool,
    includeWebsiteInfo: Bool
) -> SRString? {
    guard
        let windowInfo = WindowInfo.getFrontmost(
            includeAppIcon: includeAppIcon,
            includeAppColor: includeAppColor,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )
    else { return nil }
    return toJson(windowInfo.toDictionary())
}

// MARK: - Installed Apps

@_cdecl("mado_get_installed_apps")
public func madoGetInstalledApps(
    includeIcon: Bool,
    includeAppColor: Bool,
    iconSize: Int32
)
    -> SRString?
{
    let apps = scanInstalledApps(
        includeIcon: includeIcon,
        includeAppColor: includeAppColor,
        iconSize: Int(iconSize)
    )
    return toJson(apps.map { $0.toDictionary() })
}

@_cdecl("mado_get_installed_app")
public func madoGetInstalledApp(
    bundleId: SRString,
    includeIcon: Bool,
    includeAppColor: Bool,
    iconSize: Int32
) -> SRString? {
    guard
        let app = getInstalledApp(
            bundleId: bundleId.toString(),
            includeIcon: includeIcon,
            includeAppColor: includeAppColor,
            iconSize: Int(iconSize)
        )
    else { return nil }

    return toJson(app.toDictionary())
}

@_cdecl("mado_get_app_icon")
public func madoGetAppIcon(
    bundleId: SRString,
    iconSize: Int32,
    includeColor: Bool
) -> SRString? {
    let icon = getAppIconByBundleId(
        bundleId.toString(),
        size: Int(iconSize),
        includeColor: includeColor
    )
    return toJson(icon.toDictionary())
}

@_cdecl("mado_get_app_color")
public func madoGetAppColor(bundleId: SRString) -> SRString? {
    guard let color = getAppColorByBundleId(bundleId.toString()) else {
        return nil
    }

    return SRString(color)
}

@_cdecl("mado_get_website_icon")
public func madoGetWebsiteIcon(
    url: SRString,
    includeColor: Bool
) -> SRString? {
    let icon = getWebsiteIcon(
        from: url.toString(),
        includeColor: includeColor
    )
    return toJson(icon.toDictionary())
}

// MARK: - Helpers

private func toJson(_ object: Any) -> SRString? {
    guard
        let jsonData = try? JSONSerialization.data(withJSONObject: object),
        let jsonString = String(data: jsonData, encoding: .utf8)
    else {
        Log.warn("Failed to serialize query response to JSON")
        return nil
    }

    return SRString(jsonString)
}
