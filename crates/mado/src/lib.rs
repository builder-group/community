//! # mado (窓)
//!
//! macOS active app and window monitoring with browser metadata.
//!
//! `mado` wraps native macOS APIs through Swift. Use it to query the active
//! app and focused window, listen to focus changes, extract browser URL metadata,
//! and scan installed apps from Rust.
//!
//! ## Quick Start
//!
//! ### Query current state
//!
//! ```rust,no_run
//! let app = mado::get_active_app()?;
//! println!("Current app: {}", app);
//!
//! let window = mado::get_active_window()?;
//! println!("Window: {}", window);
//! # Ok::<(), mado::Error>(())
//! ```
//!
//! ### Monitor changes
//!
//! ```rust,no_run
//! use mado::{WindowListener, WindowMonitor, WindowEvent};
//!
//! struct MyListener;
//!
//! impl WindowListener for MyListener {
//!     fn on_focus_change(&self, event: WindowEvent) {
//!         match event {
//!             WindowEvent::AppActivated { app } => {
//!                 println!("App: {}", app);
//!             }
//!             WindowEvent::WindowChanged { window } => {
//!                 println!("Window: {}", window);
//!             }
//!         }
//!     }
//! }
//!
//! let monitor = WindowMonitor::new(MyListener);
//! monitor.run()?;
//! # Ok::<(), mado::Error>(())
//! ```
//!
//! ## Platform Support
//!
//! - **macOS**: supported
//! - **Linux**: planned
//! - **Windows**: planned
//!
//! ## Requirements
//!
//! **macOS:**
//! - Accessibility permissions required if `track_window_changes: true` (default)

pub mod config;
pub mod error;
pub mod listener;
pub mod monitor;
pub mod platform;
pub mod types;

pub use config::{InstalledAppsConfig, MonitorConfig, QueryConfig};
pub use error::Error;
pub use listener::WindowListener;
pub use monitor::WindowMonitor;
pub use types::{
    AppIcon, AppInfo, BrowserInfo, InstalledApp, WebsiteInfo, WindowBounds, WindowEvent, WindowInfo,
};

// MARK: - Window Monitoring

/// Get information about the currently active application
///
/// This is a synchronous query that returns the current state immediately.
///
/// # Errors
///
/// Returns an error if:
/// - No application is currently active
/// - Platform API calls fail
///
/// # Example
///
/// ```rust,no_run
/// let app = mado::get_active_app()?;
/// println!("Current app: {}", app);
/// # Ok::<(), mado::Error>(())
/// ```
pub fn get_active_app() -> Result<AppInfo, Error> {
    platform::get_active_app(QueryConfig::default())
}

/// Get information about the currently active application with custom configuration.
///
/// # Arguments
///
/// * `config` - Configuration for the query (e.g. icon extraction)
///
/// # Example
///
/// ```rust,no_run
/// use mado::QueryConfig;
///
/// let config = QueryConfig {
///     include_app_icon: true,
///     include_app_color: false,
///     ..Default::default()
/// };
/// let app = mado::get_active_app_with_config(config)?;
/// if let Some(icon) = &app.icon {
///     if let Some(data_url) = &icon.data_url {
///         println!("Icon: {} bytes", data_url.len());
///     }
///     if let Some(color) = &icon.color {
///         println!("Color: {}", color);
///     }
/// }
/// # Ok::<(), mado::Error>(())
/// ```
pub fn get_active_app_with_config(config: QueryConfig) -> Result<AppInfo, Error> {
    platform::get_active_app(config)
}

/// Get information about the currently active window.
///
/// This is a synchronous query that returns the current state immediately.
/// The returned `WindowInfo` includes both window details and the associated app info.
///
/// # Errors
///
/// Returns an error if:
/// - No window is currently focused
/// - Missing permissions
/// - Platform API calls fail
///
/// # Example
///
/// ```rust,no_run
/// let window = mado::get_active_window()?;
/// println!("Window: {}", window);
/// # Ok::<(), mado::Error>(())
/// ```
pub fn get_active_window() -> Result<WindowInfo, Error> {
    platform::get_active_window(QueryConfig::default())
}

/// Get information about the currently active window with custom configuration.
///
/// # Arguments
///
/// * `config` - Configuration for the query (e.g. browser URL extraction)
///
/// # Errors
///
/// Returns an error if:
/// - No window is currently focused
/// - Missing permissions
/// - Platform API calls fail
///
/// # Example
///
/// ```rust,no_run
/// use mado::QueryConfig;
///
/// // With app icon, browser info, and website info (favicon + color)
/// let config = QueryConfig {
///     include_app_icon: true,
///     include_app_color: false,
///     include_browser_info: true,
///     include_website_info: true,
///     ..Default::default()
/// };
/// let window = mado::get_active_window_with_config(config)?;
/// if let Some(browser) = &window.browser {
///     println!("URL: {:?}", browser.url);
///     if let Some(website) = &browser.website {
///         println!("Domain: {}", website.domain);
///         if let Some(color) = &website.color {
///             println!("Color: {}", color);
///         }
///     }
/// }
/// if let Some(icon) = &window.app.icon {
///     if let Some(data_url) = &icon.data_url {
///         println!("Icon: {} bytes", data_url.len());
///     }
/// }
/// # Ok::<(), mado::Error>(())
/// ```
pub fn get_active_window_with_config(config: QueryConfig) -> Result<WindowInfo, Error> {
    platform::get_active_window(config)
}

/// Check if accessibility permissions are granted (macOS only)
///
/// On macOS, accessibility permissions are required for window monitoring.
/// This function returns `true` if permissions are granted.
///
/// On other platforms (e.g. Linux), this always returns `true`.
///
/// # Example
///
/// ```rust,no_run
/// if !mado::is_accessibility_trusted() {
///     eprintln!("Please grant accessibility permissions in System Settings");
/// }
/// ```
pub fn is_accessibility_trusted() -> bool {
    platform::is_accessibility_trusted()
}

// MARK: - App Information

/// Get all installed applications on the system.
///
/// Scans /Applications and ~/Applications directories for installed apps.
/// Returns apps sorted alphabetically by name.
///
/// On non-macOS platforms, returns an empty vector.
///
/// # Example
///
/// ```rust,no_run
/// use mado::InstalledAppsConfig;
///
/// // Fast scan without icons
/// let apps = mado::get_installed_apps(InstalledAppsConfig::default());
/// for app in &apps {
///     println!("{}: {}", app.name, app.bundle_id);
/// }
///
/// // With icons (slower)
/// let config = InstalledAppsConfig {
///     include_icon: true,
///     include_app_color: false,
///     icon_size: 64,
/// };
/// let apps = mado::get_installed_apps(config);
/// ```
pub fn get_installed_apps(config: InstalledAppsConfig) -> Vec<InstalledApp> {
    platform::get_installed_apps(config)
}

/// Get icon for a specific app by bundle identifier.
///
/// Returns the app icon as a base64 PNG data URL.
///
/// On non-macOS platforms, returns default (empty) result.
///
/// # Arguments
///
/// * `bundle_id` - The app's bundle identifier (e.g., "com.apple.Safari")
/// * `size` - Icon size in pixels (default: 32 if 0)
/// * `include_color` - Whether to also derive the dominant brand color
///
/// # Example
///
/// ```rust,no_run
/// let result = mado::get_app_icon("com.apple.finder", 64, false);
/// if let Some(icon) = result.data_url {
///     println!("Icon: {} bytes", icon.len());
/// }
/// ```
pub fn get_app_icon(bundle_id: &str, size: u32, include_color: bool) -> AppIcon {
    platform::get_app_icon(bundle_id, size, include_color)
}

/// Get the dominant brand color for a specific app by bundle identifier.
///
/// On non-macOS platforms, returns `None`.
pub fn get_app_color(bundle_id: &str) -> Option<String> {
    platform::get_app_color(bundle_id)
}
