// MARK: - Window Monitoring

/// Configuration for the window monitor.
#[derive(Debug, Clone, Copy)]
pub struct MonitorConfig {
    /// Whether to include the app icon and dominant color.
    ///
    /// When enabled, extracts the app icon as a base64 PNG data URL
    /// and the dominant brand color as a hex string.
    ///
    /// Local file read, fast (~5-20ms).
    ///
    /// Default: `false`
    pub include_app_icon: bool,

    /// Whether to extract browser info (URL and private mode).
    ///
    /// When enabled, extracts the current URL and private/incognito mode from browser windows.
    /// Populates the `browser` field in `WindowInfo`.
    ///
    /// Default: `false`
    pub include_browser_info: bool,

    /// Whether to extract website info (domain, favicon, and color).
    ///
    /// When enabled, extracts the domain from the browser URL, fetches the favicon,
    /// and extracts the dominant color. Populates `browser.website` in `WindowInfo`.
    ///
    /// Requires `include_browser_info` to be enabled (needs URL to fetch favicon).
    /// Network fetch, slower (~50-500ms), cached by domain.
    ///
    /// Default: `false`
    pub include_website_info: bool,

    /// Whether to track window changes within the same app.
    ///
    /// When `true` (default), fires events for:
    /// - App switches (always tracked)
    /// - Window focus changes within the same app
    /// - Window title changes (e.g. tab switches in browsers)
    ///
    /// When `false`, only fires events for app switches.
    ///
    /// Default: `true` (track all changes)
    pub track_window_changes: bool,
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self {
            include_app_icon: false,
            include_browser_info: false,
            include_website_info: false,
            track_window_changes: true,
        }
    }
}

/// Configuration for querying window/app information.
#[derive(Debug, Clone, Copy)]
pub struct QueryConfig {
    /// Whether to include the app icon and dominant color.
    ///
    /// When enabled, extracts the app icon as a base64 PNG data URL
    /// and the dominant brand color as a hex string.
    ///
    /// Local file read, fast (~5-20ms).
    ///
    /// Default: `false`
    pub include_app_icon: bool,

    /// Whether to extract browser info (URL and private mode).
    ///
    /// When enabled, extracts the current URL and private/incognito mode from browser windows.
    /// Populates the `browser` field in `WindowInfo`.
    ///
    /// Default: `false`
    pub include_browser_info: bool,

    /// Whether to extract website info (domain, favicon, and color).
    ///
    /// When enabled, extracts the domain from the browser URL, fetches the favicon,
    /// and extracts the dominant color. Populates `browser.website` in `WindowInfo`.
    ///
    /// Requires `include_browser_info` to be enabled (needs URL to fetch favicon).
    /// Network fetch, slower (~50-500ms), cached by domain.
    ///
    /// Default: `false`
    pub include_website_info: bool,
}

impl Default for QueryConfig {
    fn default() -> Self {
        Self {
            include_app_icon: false,
            include_browser_info: false,
            include_website_info: false,
        }
    }
}

// MARK: - App Information

/// Configuration for scanning installed applications.
#[derive(Debug, Clone, Copy)]
pub struct InstalledAppsConfig {
    /// Include icon in the results.
    ///
    /// When enabled, extracts each app's icon as a base64 PNG data URL
    /// and the dominant brand color as a hex string.
    ///
    /// Default: `false` (faster without icon)
    pub include_icon: bool,

    /// Icon size in pixels.
    ///
    /// Only used when `include_icon` is true.
    ///
    /// Default: `32`
    pub icon_size: u32,
}

impl Default for InstalledAppsConfig {
    fn default() -> Self {
        Self {
            include_icon: false,
            icon_size: 32,
        }
    }
}
