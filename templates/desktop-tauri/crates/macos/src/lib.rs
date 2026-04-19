use std::ffi::c_void;

#[cfg(target_os = "macos")]
mod ffi;
#[cfg(target_os = "macos")]
use ffi::{desktop_tauri_macos_apply_window_liquid_glass, desktop_tauri_macos_greet};
#[cfg(target_os = "macos")]
use swift_rs::{Int, SRString};

/// Applies liquid glass and makes WKWebViews transparent. No-op on App Store builds.
pub fn apply_window_liquid_glass(window_ptr: *mut c_void) -> bool {
    #[cfg(target_os = "macos")]
    {
        if window_ptr.is_null() {
            return false;
        }

        return unsafe { desktop_tauri_macos_apply_window_liquid_glass(window_ptr as Int) };
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = window_ptr;
        return false;
    }
}

pub fn greet(name: &str) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let swift_name = SRString::from(name);

        return unsafe { desktop_tauri_macos_greet(&swift_name) }
            .map(|value| value.as_str().to_string());
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = name;
        return None;
    }
}
