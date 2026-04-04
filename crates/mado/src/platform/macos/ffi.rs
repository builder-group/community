use std::ffi::c_void;
use swift_rs::{swift, SRString};

// Monitor lifecycle
swift!(pub fn mado_start_monitor(callback: *const c_void, track_window_changes: bool, include_app_icon: bool, include_browser_info: bool, include_website_info: bool));
swift!(pub fn mado_stop_monitor());

// Permissions
swift!(pub fn mado_is_trusted() -> bool);

// Queries
swift!(pub fn mado_get_active_app(include_app_icon: bool) -> Option<SRString>);
swift!(pub fn mado_get_active_window(include_app_icon: bool, include_browser_info: bool, include_website_info: bool) -> Option<SRString>);

// Installed Apps
swift!(pub fn mado_get_installed_apps(include_icon: bool, icon_size: i32) -> Option<SRString>);
swift!(pub fn mado_get_app_icon(bundle_id: &SRString, icon_size: i32) -> Option<SRString>);
