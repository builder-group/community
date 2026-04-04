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
    /// App icon and brand color (only populated if `include_app_icon` is enabled)
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
                writeln!(f, "      Icon:       (base64 PNG, {} bytes)", data_url.len())?;
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
    /// Whether the window is in private/incognito mode.
    ///
    /// - `None` if detection failed or not supported
    /// - `Some(true)` if private mode is active
    /// - `Some(false)` if private mode is not active
    pub is_private: Option<bool>,
    /// Website information (only populated if `include_website_info` is enabled in config)
    pub website: Option<WebsiteInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteInfo {
    /// Domain extracted from the browser URL (e.g., "github.com")
    pub domain: String,
    /// Favicon as base64 PNG data URL (e.g., "data:image/png;base64,...")
    pub favicon: Option<String>,
    /// Dominant color extracted from favicon as hex string (e.g., "#FF5733")
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
    /// Browser information (only populated if `include_browser_info` is enabled in config)
    pub browser: Option<BrowserInfo>,
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
            let mode_str = match browser.is_private {
                Some(true) => "Private/Incognito",
                Some(false) => "Normal",
                None => "(not available)",
            };
            writeln!(f, "      Mode:       {}", mode_str)?;

            if let Some(website) = &browser.website {
                writeln!(f, "      Domain:     {}", website.domain)?;
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

/// Event type for window and app focus changes.
///
/// Distinguishes between app activation (always fires on app switch) and window changes
/// (fires when window focus/title changes or when window becomes available).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum WindowEvent {
    /// Application was activated/switched to.
    ///
    /// This event **always** fires when the user switches to a different app.
    /// It provides immediate notification of the app change, even if the app has no window yet.
    ///
    /// Common scenarios:
    /// - App activated via Spotlight/Dock but hasn't opened a window yet
    /// - Tray apps that don't have windows
    /// - App switching where window information isn't immediately available
    ///
    /// A `WindowChanged` event will follow when a window becomes available (if the app has windows).
    AppActivated { app: AppInfo },
    /// Window focus or title changed.
    ///
    /// This event fires when:
    /// - Window focus changes within the same app
    /// - Window title changes (e.g. tab switches in browsers)
    /// - Complete window information becomes available after app activation
    ///
    /// Note: App switches are always signaled via `AppActivated` events first.
    WindowChanged { window: WindowInfo },
}

impl WindowEvent {
    /// Get the app information from this event.
    pub fn app(&self) -> &AppInfo {
        match self {
            WindowEvent::AppActivated { app } => app,
            WindowEvent::WindowChanged { window } => &window.app,
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
    /// App icon and brand color (only populated if `include_icon` is enabled)
    pub icon: Option<AppIcon>,
}

/// App icon with brand color.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppIcon {
    /// Icon as base64 PNG data URL
    pub data_url: Option<String>,
    /// Brand color as hex string like "#5865F2"
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
