import AppKit
import SwiftRs

@_cdecl("desktop_tauri_macos_apply_window_liquid_glass")
public func desktopTauriMacosApplyWindowLiquidGlass(windowPtr: Int) -> Bool {
    return WindowLiquidGlass.apply(windowPtr: windowPtr)
}

@_cdecl("desktop_tauri_macos_greet")
public func desktopTauriMacosGreet(name: SRString) -> SRString? {
    return SRString("Hello, \(name.toString())! You've been greeted from Swift!")
}
