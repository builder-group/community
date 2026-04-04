mod ffi;
mod parser;

use crate::platform::call_listener_safe;
use crate::{
    config::{InstalledAppsConfig, MonitorConfig, QueryConfig},
    error::Error,
    listener::WindowListener,
    types::{AppIcon, AppInfo, InstalledApp, WindowInfo},
};
use ffi::*;
use parser::{parse_app_info, parse_event, parse_window_info};
use std::ffi::c_void;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use swift_rs::SRString;

/// Track if monitor is running (only one monitor can run at a time).
/// This atomic check is necessary for thread safety - prevents race conditions where
/// multiple threads try to start a monitor simultaneously. Swift-side checks are defensive
/// but not sufficient for concurrent access.
static RUNNING: AtomicBool = AtomicBool::new(false);

/// Global listener storage for C callback access
static GLOBAL_LISTENER: Mutex<Option<Arc<dyn WindowListener>>> = Mutex::new(None);

/// Start monitoring window and application focus changes.
/// Blocks current thread until `stop()` is called.
pub fn run(listener: Arc<dyn WindowListener>, config: MonitorConfig) -> Result<(), Error> {
    // Check permissions if tracking window changes
    if config.track_window_changes && !is_accessibility_trusted() {
        return Err(Error::MissingPermission(
            "Accessibility permissions required for window change tracking".to_string(),
        ));
    }

    // Atomic check-and-set: only one monitor can run at a time
    if RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(Error::AlreadyRunning);
    }

    // Store listener for C callback access
    {
        let mut guard = GLOBAL_LISTENER.lock().unwrap();
        *guard = Some(listener.clone());
    }

    // Start monitoring (blocks until stopped)
    unsafe {
        let callback_ptr = window_event_callback as *const c_void;
        mado_start_monitor(
            callback_ptr,
            config.track_window_changes,
            config.include_app_icon,
            config.include_browser_info,
            config.include_website_info,
        );
    }

    // Cleanup after stop
    {
        let mut guard = GLOBAL_LISTENER.lock().unwrap();
        *guard = None;
    }

    RUNNING.store(false, Ordering::SeqCst);

    return Ok(());
}

/// Stop the monitor (thread-safe, can be called from any thread).
pub fn stop() -> Result<(), Error> {
    if !RUNNING.load(Ordering::SeqCst) {
        return Err(Error::NotRunning);
    }

    unsafe {
        mado_stop_monitor();
    }

    return Ok(());
}

/// Get information about the currently active application.
pub fn get_active_app(config: QueryConfig) -> Result<AppInfo, Error> {
    let json = unsafe {
        match mado_get_active_app(config.include_app_icon) {
            Some(s) => s.as_str().to_string(),
            None => return Err(Error::NoActiveApp),
        }
    };

    return parse_app_info(&json)
        .map_err(|e| Error::Platform(format!("Failed to parse app info: {}", e)));
}

/// Get information about the currently active window.
pub fn get_active_window(config: QueryConfig) -> Result<WindowInfo, Error> {
    let json = unsafe {
        match mado_get_active_window(config.include_app_icon, config.include_browser_info, config.include_website_info) {
            Some(s) => s.as_str().to_string(),
            None => return Err(Error::NoActiveWindow),
        }
    };

    return parse_window_info(&json)
        .map_err(|e| Error::Platform(format!("Failed to parse window info: {}", e)));
}

/// Check if accessibility permissions are granted.
pub fn is_accessibility_trusted() -> bool {
    return unsafe { mado_is_trusted() };
}

/// C callback invoked by Swift when window/app events occur.
extern "C" fn window_event_callback(event_json_ptr: *const SRString) {
    if event_json_ptr.is_null() {
        return;
    }

    let json = unsafe { (*event_json_ptr).as_str() };

    let event = match parse_event(json) {
        Ok(event) => event,
        Err(e) => {
            eprintln!("[mado] Failed to parse event: {} - {}", e, json);
            return;
        }
    };

    let guard = GLOBAL_LISTENER.lock().unwrap();
    if let Some(listener) = guard.as_ref() {
        call_listener_safe(listener, event);
    }
}

/// Get all installed applications on the system.
pub fn get_installed_apps(config: InstalledAppsConfig) -> Vec<InstalledApp> {
    let icon_size = if config.icon_size == 0 {
        32
    } else {
        config.icon_size as i32
    };

    let json_opt = unsafe { mado_get_installed_apps(config.include_icon, icon_size) };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).unwrap_or_default()
        }
        None => Vec::new(),
    }
}

/// Get icon for a specific app by bundle identifier.
pub fn get_app_icon(bundle_id: &str, size: u32) -> AppIcon {
    let icon_size = if size == 0 { 32 } else { size as i32 };
    let bundle_id_sr = SRString::from(bundle_id);
    let json_opt = unsafe { mado_get_app_icon(&bundle_id_sr, icon_size) };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).unwrap_or_default()
        }
        None => AppIcon::default(),
    }
}
