// MARK: - Window Monitoring

/// Configuration for the window monitor.
#[derive(Debug, Clone, Copy)]
pub struct MonitorConfig {
    /// Optional interval for reconciling window state after missed notifications.
    ///
    /// Zero disables periodic reconciliation (the default). Notifications and bounded
    /// foreground retries remain enabled. The interval is not a delivery deadline.
    /// Reconciliation queries the foreground app and previously observed on-screen windows.
    /// Queries run serially on the monitor thread and respect the tracking flags.
    /// Covered windows can be on screen. Minimized and inactive-Space windows are skipped.
    pub reconcile_interval_ms: u32,

    /// Whether to include the app icon.
    ///
    /// Default: `false`
    pub include_app_icon: bool,

    /// Whether to include the app display color when `include_app_icon` is enabled.
    ///
    /// Default: `false`
    pub include_app_color: bool,

    /// Whether to extract browser info (URL and private mode).
    ///
    /// When enabled, extracts the current URL and private/incognito mode from browser windows.
    /// Populates the `browser` field in `WindowInfo`.
    ///
    /// Default: `false`
    pub include_browser_info: bool,

    /// Whether to extract website info (hostname, favicon, and color).
    ///
    /// When enabled, extracts the hostname from the browser URL, fetches the favicon,
    /// and extracts the favicon-derived color. Populates `browser.website` in `WindowInfo`.
    ///
    /// Requires `include_browser_info` to be enabled (needs URL to fetch favicon).
    /// Fetches synchronously over the network and caches by hostname.
    /// Network delays can block the calling thread.
    ///
    /// Default: `false`
    pub include_website_info: bool,

    /// Whether to track content and lifecycle changes for windows discovered through focus.
    ///
    /// When `true` (default), fires events for:
    /// - Window focus changes within the same app
    /// - Window title changes (e.g. tab switches in browsers)
    /// - Window information becoming available after app activation
    /// - Browser information becoming available after the initial window event
    /// - Previously focused window content, minimize, restore, and destroy changes
    ///
    /// App activation and termination events are always emitted. Set this to
    /// `false` to disable content and lifecycle events while still receiving app events.
    ///
    /// Default: `true`
    pub track_window_changes: bool,

    /// Whether to track observed window move and resize changes.
    ///
    /// When `true`, fires `WindowBoundsChanged` events for windows observed while focused.
    /// This is separate from `track_window_changes` so consumers can receive
    /// geometry updates without routing them through `WindowChanged`.
    ///
    /// Default: `false`
    pub track_window_bounds_changes: bool,
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self {
            reconcile_interval_ms: 0,
            include_app_icon: false,
            include_app_color: false,
            include_browser_info: false,
            include_website_info: false,
            track_window_changes: true,
            track_window_bounds_changes: false,
        }
    }
}

/// Configuration for querying window/app information.
#[derive(Debug, Clone, Copy)]
pub struct QueryConfig {
    /// Whether to include the app icon.
    ///
    /// Default: `false`
    pub include_app_icon: bool,

    /// Whether to include the app display color when `include_app_icon` is enabled.
    ///
    /// Default: `false`
    pub include_app_color: bool,

    /// Whether to extract browser info (URL and private mode).
    ///
    /// When enabled, extracts the current URL and private/incognito mode from browser windows.
    /// Populates the `browser` field in `WindowInfo`.
    ///
    /// Default: `false`
    pub include_browser_info: bool,

    /// Whether to extract website info (hostname, favicon, and color).
    ///
    /// When enabled, extracts the hostname from the browser URL, fetches the favicon,
    /// and extracts the favicon-derived color. Populates `browser.website` in `WindowInfo`.
    ///
    /// Requires `include_browser_info` to be enabled (needs URL to fetch favicon).
    /// Fetches synchronously over the network and caches by hostname.
    /// Network delays can block the calling thread.
    ///
    /// Default: `false`
    pub include_website_info: bool,
}

impl Default for QueryConfig {
    fn default() -> Self {
        Self {
            include_app_icon: false,
            include_app_color: false,
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
    /// Default: `false` (faster without icon)
    pub include_icon: bool,

    /// Whether to include the app display color when `include_icon` is enabled.
    ///
    /// Default: `false`
    pub include_app_color: bool,

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
            include_app_color: false,
            icon_size: 32,
        }
    }
}
