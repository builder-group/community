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
    types::{AppIcon, AppInfo, InstalledApp, WebsiteIcon, WindowEvent, WindowInfo},
};
use std::sync::Arc;

/// Start monitoring `WindowMonitor` events.
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

pub fn refresh() -> Result<(), Error> {
    #[cfg(target_os = "macos")]
    return macos::refresh();
    #[cfg(not(target_os = "macos"))]
    return Err(Error::Platform("Unsupported platform".to_string()));
}

/// Get information about the currently active application.
///
/// Reads the current state synchronously.
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

/// Discover applications in the standard application directories.
///
/// Scans the standard user, local, and system application directories recursively.
/// Directories and application bundles that cannot be read are skipped. Returns apps deduplicated
/// by bundle identifier and sorted alphabetically by name.
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

/// Resolve an application registered with the operating system by bundle identifier.
///
/// On non-macOS platforms, returns `None`.
pub fn get_installed_app(bundle_id: &str, config: InstalledAppsConfig) -> Option<InstalledApp> {
    #[cfg(target_os = "macos")]
    return macos::get_installed_app(bundle_id, config);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (bundle_id, config);
        return None;
    }
}

/// Get icon for a specific app by bundle identifier.
///
/// Returns the app icon as a base64 PNG data URL.
///
/// On non-macOS platforms, returns default (empty) result.
pub fn get_app_icon(bundle_id: &str, size: u32, include_color: bool) -> AppIcon {
    #[cfg(target_os = "macos")]
    return macos::get_app_icon(bundle_id, size, include_color);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (bundle_id, size, include_color);
        return AppIcon::default();
    }
}

pub fn get_app_color(bundle_id: &str) -> Option<String> {
    #[cfg(target_os = "macos")]
    return macos::get_app_color(bundle_id);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = bundle_id;
        return None;
    }
}

/// Get favicon for a website URL.
///
/// Returns the favicon as a base64 PNG data URL. On non-macOS platforms, returns default
/// (empty) result.
pub fn get_website_icon(url: &str, include_color: bool) -> WebsiteIcon {
    #[cfg(target_os = "macos")]
    return macos::get_website_icon(url, include_color);

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (url, include_color);
        return WebsiteIcon::default();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn listener_panic_does_not_prevent_later_event_delivery() {
        struct Listener(Arc<AtomicUsize>);
        impl WindowListener for Listener {
            fn on_focus_change(&self, _event: WindowEvent) {
                if self.0.fetch_add(1, Ordering::SeqCst) == 0 {
                    panic!("Listener failure");
                }
            }
        }

        let calls = Arc::new(AtomicUsize::new(0));
        let listener: Arc<dyn WindowListener> = Arc::new(Listener(calls.clone()));
        let event = WindowEvent::AppActivated {
            app: AppInfo {
                pid: 1,
                name: None,
                bundle_id: None,
                process_path: None,
                icon: None,
            },
        };
        call_listener_safe(&listener, event.clone());
        call_listener_safe(&listener, event);
        assert_eq!(calls.load(Ordering::SeqCst), 2);
    }
}
