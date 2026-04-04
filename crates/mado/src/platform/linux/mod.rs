use crate::{
    config::MonitorConfig,
    error::Error,
    listener::WindowListener,
    types::{AppInfo, WindowInfo},
};
use std::sync::Arc;

/// Start monitoring window and application focus changes.
pub fn run(_listener: Arc<dyn WindowListener>, _config: MonitorConfig) -> Result<(), Error> {
    Err(Error::Platform(
        "Linux support is not yet implemented".to_string(),
    ))
}

/// Stop the monitor (thread-safe).
pub fn stop() -> Result<(), Error> {
    Err(Error::Platform(
        "Linux support is not yet implemented".to_string(),
    ))
}

/// Get information about the currently active application.
pub fn get_active_app() -> Result<AppInfo, Error> {
    Err(Error::Platform(
        "Linux support is not yet implemented".to_string(),
    ))
}

/// Get information about the currently active window.
pub fn get_active_window() -> Result<WindowInfo, Error> {
    Err(Error::Platform(
        "Linux support is not yet implemented".to_string(),
    ))
}
