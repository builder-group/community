mod ffi;
mod parser;

use crate::platform::call_listener_safe;
use crate::{
    config::{InstalledAppsConfig, MonitorConfig, QueryConfig},
    error::Error,
    listener::WindowListener,
    types::{AppIcon, AppInfo, InstalledApp, WebsiteIcon, WindowInfo},
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

/// Start monitoring `WindowMonitor` events.
/// Blocks current thread until `stop()` is called.
pub fn run(listener: Arc<dyn WindowListener>, config: MonitorConfig) -> Result<(), Error> {
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
            config.track_window_bounds_changes,
            config.include_app_icon,
            config.include_app_color,
            config.include_browser_info,
            config.include_website_info,
            config.reconcile_interval_ms,
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
    // Note: The native instance becomes available after Rust reserves the monitor slot
    if !unsafe { mado_stop_monitor() } {
        return Err(Error::NotRunning);
    }
    return Ok(());
}

pub fn refresh() -> Result<(), Error> {
    if !unsafe { mado_refresh_monitor() } {
        return Err(Error::NotRunning);
    }
    return Ok(());
}

/// Get information about the currently active application.
pub fn get_active_app(config: QueryConfig) -> Result<AppInfo, Error> {
    let json = unsafe {
        match mado_get_active_app(config.include_app_icon, config.include_app_color) {
            Some(s) => s.as_str().to_string(),
            None => return Err(Error::NoActiveApp),
        }
    };

    return parse_app_info(&json)
        .map_err(|e| Error::Platform(format!("Failed to parse app info: {}", e)));
}

/// Get information about the currently active window.
pub fn get_active_window(config: QueryConfig) -> Result<WindowInfo, Error> {
    if !is_accessibility_trusted() {
        return Err(Error::MissingPermission(
            "Accessibility access is required to query windows".to_string(),
        ));
    }

    let json = unsafe {
        match mado_get_active_window(
            config.include_app_icon,
            config.include_app_color,
            config.include_browser_info,
            config.include_website_info,
        ) {
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

/// Discover applications in the standard application directories.
pub fn get_installed_apps(config: InstalledAppsConfig) -> Vec<InstalledApp> {
    let icon_size = if config.icon_size == 0 {
        32
    } else {
        config.icon_size as i32
    };

    let json_opt = unsafe {
        mado_get_installed_apps(config.include_icon, config.include_app_color, icon_size)
    };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).unwrap_or_default()
        }
        None => Vec::new(),
    }
}

/// Resolve an application registered with macOS by bundle identifier.
pub fn get_installed_app(bundle_id: &str, config: InstalledAppsConfig) -> Option<InstalledApp> {
    let icon_size = if config.icon_size == 0 {
        32
    } else {
        config.icon_size as i32
    };
    let bundle_id_sr = SRString::from(bundle_id);

    let json_opt = unsafe {
        mado_get_installed_app(
            &bundle_id_sr,
            config.include_icon,
            config.include_app_color,
            icon_size,
        )
    };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).ok()
        }
        None => None,
    }
}

/// Get icon for a specific app by bundle identifier.
pub fn get_app_icon(bundle_id: &str, size: u32, include_color: bool) -> AppIcon {
    let icon_size = if size == 0 { 32 } else { size as i32 };
    let bundle_id_sr = SRString::from(bundle_id);
    let json_opt = unsafe { mado_get_app_icon(&bundle_id_sr, icon_size, include_color) };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).unwrap_or_default()
        }
        None => AppIcon::default(),
    }
}

/// Get color for a specific app by bundle identifier.
pub fn get_app_color(bundle_id: &str) -> Option<String> {
    let bundle_id_sr = SRString::from(bundle_id);
    let color_opt = unsafe { mado_get_app_color(&bundle_id_sr) };
    color_opt.map(|color| color.as_str().to_string())
}

/// Get favicon for a website URL.
pub fn get_website_icon(url: &str, include_color: bool) -> WebsiteIcon {
    let url_sr = SRString::from(url);
    let json_opt = unsafe { mado_get_website_icon(&url_sr, include_color) };

    match json_opt {
        Some(json) => {
            let json_str = json.as_str().to_string();
            serde_json::from_str(&json_str).unwrap_or_default()
        }
        None => WebsiteIcon::default(),
    }
}
