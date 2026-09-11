use serde::{Deserialize, Serialize};
use std::fmt;

// MARK: - Window Monitoring

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    /// Process ID
    pub pid: i32,
    /// Application name (localized)
    pub name: Option<String>,
    /// Bundle identifier (macOS)
    pub bundle_id: Option<String>,
    /// Path to the executable
    pub process_path: Option<String>,
    /// App icon payload (only populated if `include_app_icon` is enabled)
    pub icon: Option<AppIcon>,
}

impl fmt::Display for AppInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "   App:")?;
        writeln!(f, "      Name:       {}", fmt_display(&self.name))?;
        writeln!(f, "      PID:        {}", self.pid)?;
        writeln!(f, "      Bundle ID:  {}", fmt_display(&self.bundle_id))?;
        writeln!(f, "      Path:       {}", fmt_display(&self.process_path))?;
        if let Some(icon) = &self.icon {
            if let Some(data_url) = &icon.data_url {
                writeln!(
                    f,
                    "      Icon:       (base64 PNG, {} bytes)",
                    data_url.len()
                )?;
            }
            if let Some(color) = &icon.color {
                writeln!(f, "      Color:      {}", color)?;
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BrowserInfo {
    /// Current URL of the active tab.
    pub url: Option<String>,
    /// Bounds of the visible browser content area, when exposed by Accessibility.
    ///
    /// Uses the top-level web content frame clipped to the browser window.
    /// Browser Accessibility data may not describe the exact viewport or may be unavailable.
    pub content_bounds: Option<WindowBounds>,
    /// Estimates private/incognito mode from recognized window-title patterns.
    ///
    /// - `None` when no usable title is available
    /// - `Some(true)` when the title contains a recognized private-mode indicator
    /// - `Some(false)` when no indicator matches, which does not prove normal browsing
    ///
    /// Browser versions and localized titles can affect this heuristic.
    pub is_private: Option<bool>,
    /// Website information (only populated if `include_website_info` is enabled in config)
    pub website: Option<WebsiteInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteInfo {
    /// Hostname extracted from the browser URL (e.g., "github.com")
    pub hostname: String,
    /// Favicon as base64 PNG data URL (e.g., "data:image/png;base64,...")
    pub favicon: Option<String>,
    /// Favicon-derived color as hex string (e.g., "#FF5733")
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    /// Window title
    pub title: Option<String>,
    /// Platform-specific window identifier
    pub window_id: Option<u32>,
    /// Window position and size
    pub bounds: Option<WindowBounds>,
    /// Application information
    pub app: AppInfo,
    /// Browser metadata when enabled and a supported browser exposes a readable URL.
    /// Missing metadata does not imply navigation or a non-browser window.
    pub browser: Option<BrowserInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowBoundsChange {
    /// Platform-specific window identifier
    pub window_id: Option<u32>,
    /// Window position and size
    pub bounds: Option<WindowBounds>,
    /// Application information
    pub app: AppInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowLifecycleChange {
    /// Platform-specific window identifier
    pub window_id: Option<u32>,
    /// Application information
    pub app: AppInfo,
}

impl fmt::Display for WindowInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "   Window:")?;
        writeln!(f, "      Title:      {}", fmt_display(&self.title))?;
        writeln!(f, "      Window ID:  {}", fmt_display(&self.window_id))?;

        let bounds_str = match self.bounds.as_ref() {
            Some(bounds) => format!(
                "({:.0}, {:.0}) {:.0}×{:.0}",
                bounds.x, bounds.y, bounds.width, bounds.height
            ),
            None => "(not available)".to_string(),
        };
        writeln!(f, "      Bounds:     {}", bounds_str)?;

        writeln!(f, "   App:")?;
        writeln!(f, "      Name:       {}", fmt_display(&self.app.name))?;
        writeln!(f, "      PID:        {}", self.app.pid)?;
        writeln!(f, "      Bundle ID:  {}", fmt_display(&self.app.bundle_id))?;
        writeln!(
            f,
            "      Path:       {}",
            fmt_display(&self.app.process_path)
        )?;

        if let Some(browser) = &self.browser {
            writeln!(f, "   Browser:")?;
            writeln!(f, "      URL:        {}", fmt_display(&browser.url))?;
            let content_bounds_str = match browser.content_bounds.as_ref() {
                Some(bounds) => format!(
                    "({:.0}, {:.0}) {:.0}×{:.0}",
                    bounds.x, bounds.y, bounds.width, bounds.height
                ),
                None => "(not available)".to_string(),
            };
            writeln!(f, "      Content:    {}", content_bounds_str)?;
            let mode_str = match browser.is_private {
                Some(true) => "Private/Incognito",
                Some(false) => "Normal",
                None => "(not available)",
            };
            writeln!(f, "      Mode:       {}", mode_str)?;

            if let Some(website) = &browser.website {
                writeln!(f, "      Hostname:   {}", website.hostname)?;
                if website.favicon.is_some() {
                    writeln!(
                        f,
                        "      Favicon:    (base64 PNG, {} bytes)",
                        website.favicon.as_ref().unwrap().len()
                    )?;
                }
                if let Some(color) = &website.color {
                    writeln!(f, "      Color:      {}", color)?;
                }
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowBounds {
    /// X coordinate (left edge)
    pub x: f64,
    /// Y coordinate (top edge)
    pub y: f64,
    /// Window width
    pub width: f64,
    /// Window height
    pub height: f64,
}

/// Event emitted by `WindowMonitor`.
///
/// Foreground state, tracked background windows, and app lifecycle use separate variants.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum WindowEvent {
    /// Application became active.
    ///
    /// Reports an observed app activation without waiting for window metadata.
    /// The app may not have a window yet.
    ///
    /// Common scenarios:
    /// - App activated via Spotlight/Dock but hasn't opened a window yet
    /// - Tray apps that don't have windows
    /// - App switching where window information isn't immediately available
    ///
    /// A `WindowChanged` event can follow when window tracking is enabled and data is available.
    /// Explicit refresh also re-emits this event without an app switch.
    AppActivated { app: AppInfo },
    /// Previously active application terminated.
    ///
    /// This event fires when an application activated during the current monitor
    /// run exits, even when its window destruction notifications are unavailable.
    AppTerminated { app: AppInfo },
    /// Focused window information became available or changed.
    ///
    /// This event fires when:
    /// - Window focus changes within the same app
    /// - Window title changes (e.g. tab switches in browsers)
    /// - Complete window information becomes available after app activation
    /// - Browser information becomes available after the initial window event
    ///
    /// Note: App switches are always signaled via `AppActivated` events first.
    WindowChanged { window: WindowInfo },
    /// A previously focused window changed while in the background.
    ///
    /// Requires `MonitorConfig::track_window_changes`. This event does not indicate a focus
    /// change. Explicit refresh can emit unchanged data. Reconciliation only checks
    /// observed windows that are on screen. It does not discover every window.
    WindowUpdated { window: WindowInfo },
    /// A window observed while focused moved or resized.
    ///
    /// This event only fires when `MonitorConfig::track_window_bounds_changes`
    /// is enabled. It is lightweight and only includes app identity, window id,
    /// and bounds.
    WindowBoundsChanged { window: WindowBoundsChange },
    /// A window observed while focused was minimized.
    ///
    /// This event fires for windows observed during this monitor run when
    /// `MonitorConfig::track_window_changes` is enabled.
    WindowMinimized { window: WindowLifecycleChange },
    /// A window observed while focused was restored from minimized state.
    ///
    /// This event fires for windows observed during this monitor run when
    /// `MonitorConfig::track_window_changes` is enabled. A restore that
    /// activates an app before its accessibility observer is installed may only
    /// appear as `AppActivated` followed by `WindowChanged`.
    WindowRestored { window: WindowLifecycleChange },
    /// A window observed while focused was destroyed.
    ///
    /// The window may no longer be focused when this event arrives. The event
    /// uses cached window data because the destroyed accessibility element can
    /// no longer be queried safely.
    WindowDestroyed { window: WindowLifecycleChange },
}

impl WindowEvent {
    /// Get the app information from this event.
    pub fn app(&self) -> &AppInfo {
        match self {
            WindowEvent::AppActivated { app } => app,
            WindowEvent::AppTerminated { app } => app,
            WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
                &window.app
            }
            WindowEvent::WindowBoundsChanged { window } => &window.app,
            WindowEvent::WindowMinimized { window } => &window.app,
            WindowEvent::WindowRestored { window } => &window.app,
            WindowEvent::WindowDestroyed { window } => &window.app,
        }
    }
}

// MARK: - App Information

/// Information about an installed application.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    /// Bundle identifier (e.g., "com.apple.Safari")
    pub bundle_id: String,
    /// Application name (localized)
    pub name: String,
    /// Path to the application bundle
    pub path: String,
    /// App icon payload (only populated if `include_icon` is enabled)
    pub icon: Option<AppIcon>,
}

/// App icon payload with optional app display color.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppIcon {
    /// Icon as base64 PNG data URL
    pub data_url: Option<String>,
    /// App display color as hex string like "#5865F2"
    pub color: Option<String>,
}

/// Website favicon payload with optional favicon-derived color.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteIcon {
    /// Favicon as base64 PNG data URL
    pub data_url: Option<String>,
    /// Favicon-derived color as hex string like "#5865F2"
    pub color: Option<String>,
}

// MARK: - Helpers

/// Format an optional value for display, truncating strings to 70 characters
fn fmt_display<T: fmt::Display>(opt: &Option<T>) -> String {
    match opt {
        Some(value) => {
            let s = value.to_string();
            if s.chars().count() > 70 {
                let truncated: String = s.chars().take(67).collect();
                format!("{}...", truncated)
            } else {
                s
            }
        }
        None => "(not available)".to_string(),
    }
}
