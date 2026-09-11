//! # mado (窓)
//!
//! macOS active app and window monitoring with browser metadata.
//!
//! `mado` wraps native macOS APIs through Swift. Use it to query the active
//! app and focused window, listen to app, window, and bounds changes,
//! extract browser URL metadata, and scan installed apps from Rust.
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
//!             WindowEvent::AppTerminated { app } => {
//!                 println!("App terminated: {}", app);
//!             }
//!             WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
//!                 println!("Window: {}", window);
//!             }
//!             WindowEvent::WindowBoundsChanged { window } => {
//!                 println!("Window moved/resized: {:?}", window.bounds);
//!             }
//!             WindowEvent::WindowMinimized { window } => {
//!                 println!("Window minimized: {:?}", window.window_id);
//!             }
//!             WindowEvent::WindowRestored { window } => {
//!                 println!("Window restored: {:?}", window.window_id);
//!             }
//!             WindowEvent::WindowDestroyed { window } => {
//!                 println!("Window destroyed: {:?}", window.window_id);
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
//! - Accessibility permissions required if `track_window_changes` or `track_window_bounds_changes` is enabled

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
    AppIcon, AppInfo, BrowserInfo, InstalledApp, WebsiteIcon, WebsiteInfo, WindowBounds,
    WindowBoundsChange, WindowEvent, WindowInfo, WindowLifecycleChange,
};

// MARK: - Window Monitoring

/// Get information about the currently active application
///
/// Reads the current state synchronously.
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
/// Reads the current state synchronously.
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
///         println!("Hostname: {}", website.hostname);
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

/// Discover applications in the standard application directories.
///
/// Scans the standard user, local, and system application directories recursively.
/// Embedded helper apps inside application bundles are excluded. Directories and application
/// bundles that cannot be read are skipped. Results are deduplicated by bundle identifier and
/// sorted alphabetically by name.
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

/// Resolve an application registered with the operating system by bundle identifier.
///
/// Returns `None` on non-macOS platforms, when the bundle identifier cannot be resolved, or when
/// the native response cannot be decoded.
///
/// # Example
///
/// ```rust,no_run
/// let app = mado::get_installed_app(
///     "com.apple.Preview",
///     mado::InstalledAppsConfig::default(),
/// );
/// if let Some(app) = app {
///     println!("{}: {}", app.name, app.path);
/// }
/// ```
pub fn get_installed_app(bundle_id: &str, config: InstalledAppsConfig) -> Option<InstalledApp> {
    platform::get_installed_app(bundle_id, config)
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
/// * `include_color` - Whether to also include the app display color
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

/// Get the display color for a specific app by bundle identifier.
///
/// On non-macOS platforms, returns `None`.
pub fn get_app_color(bundle_id: &str) -> Option<String> {
    platform::get_app_color(bundle_id)
}

/// Get favicon for a website URL.
///
/// URLs without a scheme are treated as HTTPS. Only the URL hostname is used for
/// lookup and caching. On non-macOS platforms, returns default (empty) result.
///
/// # Arguments
///
/// * `url` - The website URL (e.g., "github.com" or "https://github.com/path")
/// * `include_color` - Whether to also include the favicon-derived color
///
/// # Example
///
/// ```rust,no_run
/// let result = mado::get_website_icon("github.com", true);
/// if let Some(icon) = result.data_url {
///     println!("Favicon: {} bytes", icon.len());
/// }
/// ```
pub fn get_website_icon(url: &str, include_color: bool) -> WebsiteIcon {
    platform::get_website_icon(url, include_color)
}
