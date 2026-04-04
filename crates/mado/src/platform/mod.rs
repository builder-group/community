#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

use crate::{
    config::{InstalledAppsConfig, MonitorConfig, QueryConfig},
    error::Error,
    listener::WindowListener,
    types::{AppIcon, AppInfo, InstalledApp, WindowEvent, WindowInfo},
};
use std::sync::Arc;

/// Start monitoring window and application focus changes.
///
/// This blocks the current thread until `stop()` is called.
pub fn run(listener: Arc<dyn WindowListener>, config: MonitorConfig) -> Result<(), Error> {
    #[cfg(target_os = "macos")]
    return macos::run(listener, config);

    #[cfg(target_os = "linux")]
    return linux::run(listener, config);

    #[cfg(target_os = "windows")]
    return windows::run(listener, config);

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    return Err(Error::Platform("Unsupported platform".to_string()));
}

/// Stop the monitor (thread-safe).
///
/// This can be called from any thread to signal the monitor to stop.
pub fn stop() -> Result<(), Error> {
    #[cfg(target_os = "macos")]
    return macos::stop();

    #[cfg(target_os = "linux")]
    return linux::stop();

    #[cfg(target_os = "windows")]
    return windows::stop();

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    return Err(Error::Platform("Unsupported platform".to_string()));
}

/// Get information about the currently active application.
///
/// This is a synchronous query that returns the current state immediately.
pub fn get_active_app(config: QueryConfig) -> Result<AppInfo, Error> {
    #[cfg(target_os = "macos")]
    return macos::get_active_app(config);

    #[cfg(target_os = "linux")]
    return linux::get_active_app();

    #[cfg(target_os = "windows")]
    return windows::get_active_app();

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    return Err(Error::Platform("Unsupported platform".to_string()));
}

/// Get information about the currently active window.
pub fn get_active_window(config: QueryConfig) -> Result<WindowInfo, Error> {
    #[cfg(target_os = "macos")]
    return macos::get_active_window(config);

    #[cfg(target_os = "linux")]
    {
        let _ = config; // Unused on Linux
        return linux::get_active_window();
    }

    #[cfg(target_os = "windows")]
    {
        let _ = config; // Unused on Windows
        return windows::get_active_window();
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    return Err(Error::Platform("Unsupported platform".to_string()));
}

/// Check if accessibility permissions are granted (macOS only).
///
/// On macOS, accessibility permissions are required for window monitoring.
/// This function returns `true` if permissions are granted.
///
/// On Linux and Windows, this always returns `true` (no special permissions required).
pub fn is_accessibility_trusted() -> bool {
    #[cfg(target_os = "macos")]
    return macos::is_accessibility_trusted();

    #[cfg(not(target_os = "macos"))]
    return true;
}

/// Call the listener callback with panic safety.
///
/// Panics in callbacks are caught and logged, but won't crash the monitor thread.
/// This ensures the monitor continues running even if a callback panics.
pub(crate) fn call_listener_safe(listener: &Arc<dyn WindowListener>, event: WindowEvent) {
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        listener.on_focus_change(event);
    }));

    if let Err(panic) = result {
        eprintln!("[mado] Callback panicked (monitor continues): {:?}", panic);
    }
}

/// Get all installed applications on the system.
///
/// Scans /Applications and ~/Applications directories for installed apps.
/// Returns apps sorted alphabetically by name.
///
/// On non-macOS platforms, returns an empty vector.
pub fn get_installed_apps(config: InstalledAppsConfig) -> Vec<InstalledApp> {
    #[cfg(target_os = "macos")]
    return macos::get_installed_apps(config);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = config;
        return Vec::new();
    }
}

/// Get icon for a specific app by bundle identifier.
///
/// Returns the app icon as a base64 PNG data URL and the dominant brand color.
///
/// On non-macOS platforms, returns default (empty) result.
pub fn get_app_icon(bundle_id: &str, size: u32) -> AppIcon {
    #[cfg(target_os = "macos")]
    return macos::get_app_icon(bundle_id, size);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (bundle_id, size);
        return AppIcon::default();
    }
}
