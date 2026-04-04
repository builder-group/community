import ApplicationServices
import Foundation
import SwiftRs

// MARK: - Monitor Lifecycle

@_cdecl("mado_start_monitor")
public func madoStartMonitor(
    callbackPtr: UnsafeRawPointer,
    trackWindowChanges: Bool,
    includeAppIcon: Bool,
    includeBrowserInfo: Bool,
    includeWebsiteInfo: Bool
) {
    // Singleton check: Rust side already prevents concurrent calls, this is defensive
    guard WindowMonitor.shared == nil else { return }

    // unsafeBitCast is safe here: Rust guarantees callbackPtr is a valid WindowEventCallback function pointer
    let callback = unsafeBitCast(callbackPtr, to: WindowEventCallback.self)
    let monitor = WindowMonitor(
        callback: callback,
        trackWindowChanges: trackWindowChanges,
        includeAppIcon: includeAppIcon,
        includeBrowserInfo: includeBrowserInfo,
        includeWebsiteInfo: includeWebsiteInfo
    )
    WindowMonitor.shared = monitor
    monitor.start()
}

@_cdecl("mado_stop_monitor")
public func madoStopMonitor() {
    WindowMonitor.shared?.stop()
    WindowMonitor.shared = nil
}

// MARK: - Permissions

@_cdecl("mado_is_trusted")
public func madoIsTrusted() -> Bool {
    return AXIsProcessTrusted()
}

// MARK: - Queries

@_cdecl("mado_get_active_app")
public func madoGetActiveApp(includeAppIcon: Bool) -> SRString? {
    guard let appInfo = AppInfo.getFrontmost(includeIcon: includeAppIcon) else {
        return nil
    }
    return toJson(appInfo.toDictionary())
}

@_cdecl("mado_get_active_window")
public func madoGetActiveWindow(
    includeAppIcon: Bool,
    includeBrowserInfo: Bool,
    includeWebsiteInfo: Bool
) -> SRString? {
    guard
        let windowInfo = WindowInfo.getFrontmost(
            includeAppIcon: includeAppIcon,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )
    else { return nil }
    return toJson(windowInfo.toDictionary())
}

// MARK: - Installed Apps

@_cdecl("mado_get_installed_apps")
public func madoGetInstalledApps(includeIcon: Bool, iconSize: Int32)
    -> SRString?
{
    let apps = scanInstalledApps(
        includeIcon: includeIcon,
        iconSize: Int(iconSize)
    )
    let dicts = apps.map { $0.toDictionary() }

    guard
        let jsonData = try? JSONSerialization.data(withJSONObject: dicts),
        let jsonString = String(data: jsonData, encoding: .utf8)
    else {
        return nil
    }

    return SRString(jsonString)
}

@_cdecl("mado_get_app_icon")
public func madoGetAppIcon(bundleId: SRString, iconSize: Int32) -> SRString? {
    let icon = getAppIconByBundleId(bundleId.toString(), size: Int(iconSize))
    return toJson(icon.toDictionary())
}

// MARK: - Helpers

private func toJson(_ dict: [String: Any?]) -> SRString? {
    guard
        let jsonData = try? JSONSerialization.data(withJSONObject: dict),
        let jsonString = String(data: jsonData, encoding: .utf8)
    else {
        Log.warn("Failed to serialize query response to JSON")
        return nil
    }

    return SRString(jsonString)
}
