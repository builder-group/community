# mado (窓)

`mado` is a macOS-focused Rust crate for reading the active app and focused window. It wraps native macOS APIs through Swift, listens to app, window, and bounds changes, and can enrich browser windows with URL and website metadata. Use it in desktop apps, productivity tools, and agents that need current user context.

- Query the active app or focused window when you need a snapshot
- Listen to app lifecycle, focused-window, title, and opt-in window bounds changes with optional reconciliation for missed notifications
- Add browser URLs, content-area bounds, private-mode state, website hostnames, favicons, and favicon-derived colors only when needed
- Read installed app names, bundle IDs, icons, and display colors without Accessibility permission
- Handle macOS Accessibility and sandbox limits explicitly

```rust
use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};

struct FocusListener;

impl WindowListener for FocusListener {
    fn on_focus_change(&self, event: WindowEvent) {
        match event {
            WindowEvent::AppActivated { app } => {
                println!("App activated: {:?}", app.name);
            }
            WindowEvent::AppTerminated { app } => {
                println!("App terminated: {:?}", app.name);
            }
            WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
                let app_name = window.app.name.as_deref().unwrap_or("Unknown app");
                let title = window.title.as_deref().unwrap_or("Untitled window");
                println!("{app_name}: {title}");

                if let Some(browser) = &window.browser {
                    println!("URL: {:?}", browser.url);
                }
            }
            WindowEvent::WindowBoundsChanged { window } => {
                println!("Window moved/resized: {:?}", window.bounds);
            }
            WindowEvent::WindowMinimized { window } => {
                println!("Window minimized: {:?}", window.window_id);
            }
            WindowEvent::WindowRestored { window } => {
                println!("Window restored: {:?}", window.window_id);
            }
            WindowEvent::WindowDestroyed { window } => {
                println!("Window destroyed: {:?}", window.window_id);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    if !mado::is_accessibility_trusted() {
        eprintln!("Grant Accessibility access in System Settings before tracking windows");
        return Ok(());
    }

    let monitor = WindowMonitor::with_config(
        FocusListener,
        MonitorConfig {
            include_browser_info: true,
            track_window_changes: true,
            track_window_bounds_changes: true,
            ..Default::default()
        },
    );

    monitor.run()
}
```

## Install

```toml
[dependencies]
mado = "0.0.17"
```

## Requirements

`mado` currently targets macOS.

| Platform | Status    | Notes                                |
| -------- | --------- | ------------------------------------ |
| macOS    | Supported | macOS 10.15+ with a Swift toolchain  |
| Linux    | Planned   | APIs return a platform error for now |
| Windows  | Planned   | APIs return a platform error for now |

Window focus, window title, window bounds, and browser URL extraction require macOS Accessibility permission. Active app queries, installed app scans, app icons, and app display colors do not require that permission.

## Usage

Pick the API that matches the job:

- Snapshot queries: `get_active_app()`, `get_active_window()`, and their `_with_config` variants
- Event monitoring: `WindowMonitor` with a `WindowListener`
- Installed apps: `get_installed_apps()`, `get_installed_app()`, `get_app_icon()`, and `get_app_color()`
- Website assets: `get_website_icon()`
- Permission checks: `is_accessibility_trusted()`

### Query Current State

Use snapshot queries when you only need the current app or window:

```rust
fn main() -> Result<(), mado::Error> {
    let app = mado::get_active_app()?;
    println!("Current app: {}", app);

    let window = mado::get_active_window_with_config(mado::QueryConfig {
        include_browser_info: true,
        include_website_info: true,
        ..Default::default()
    })?;

    if let Some(browser) = &window.browser {
        println!("URL: {:?}", browser.url);

        if let Some(website) = &browser.website {
            println!("Hostname: {}", website.hostname);
        }
    }

    Ok(())
}
```

`include_website_info` depends on `include_browser_info` because it needs the current URL. Website metadata can fetch favicons synchronously over the network and is cached by hostname.
For latency-sensitive monitoring, leave `include_website_info` disabled and call
`get_website_icon()` from a worker after receiving the URL.

### Monitor Window Changes

Use `WindowMonitor` when you want event-driven updates:

```rust
use mado::{WindowEvent, WindowListener, WindowMonitor};

struct FocusListener;

impl WindowListener for FocusListener {
    fn on_focus_change(&self, event: WindowEvent) {
        match event {
            WindowEvent::AppActivated { app } => {
                println!("App: {}", app);
            }
            WindowEvent::AppTerminated { app } => {
                println!("App terminated: {}", app);
            }
            WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
                println!("Window content: {}", window);
            }
            WindowEvent::WindowBoundsChanged { window } => {
                println!("Window moved/resized: {:?}", window.bounds);
            }
            WindowEvent::WindowMinimized { window } => {
                println!("Window minimized: {:?}", window.window_id);
            }
            WindowEvent::WindowRestored { window } => {
                println!("Window restored: {:?}", window.window_id);
            }
            WindowEvent::WindowDestroyed { window } => {
                println!("Window destroyed: {:?}", window.window_id);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    let monitor = WindowMonitor::new(FocusListener);
    monitor.run()
}
```

`run()` blocks until `WindowMonitor::stop()` is called. Only one monitor can run at a time. A second monitor returns `Error::AlreadyRunning`. `stop()` queues shutdown. Wait for `run()` to return before starting another monitor. Calls to `stop()` or `refresh()` before native initialization or after shutdown return `Error::NotRunning`.

`run()` uses the calling thread. If you start it on a worker, keep the host's main
event loop running: macOS app notifications are delivered there before being
forwarded to the monitor. Tauri and AppKit normally provide this loop. A CLI that
blocks or sleeps on the main thread needs to run it explicitly. See the
[threaded example](examples/listen_threaded.rs) for a complete setup.

Stop a monitor from another thread:

```rust
use std::thread;
use std::time::Duration;

thread::spawn(|| {
    thread::sleep(Duration::from_secs(5));
    let _ = mado::WindowMonitor::stop();
});
```

Keep `on_focus_change()` callbacks fast. Send events to another thread or async task when processing needs I/O, database work, or network calls. Panics inside callbacks are caught and logged so the monitor can continue.

### Observation And Reconciliation

The foreground window is the discovery point. Once observed, a window keeps its
Accessibility notifications until destruction or app termination, even after focus
moves elsewhere. The monitor does not enumerate every open window. If a browser
misses a destruction notification, the retained observation can remain until its app exits.

`WindowChanged` describes foreground window state. `WindowUpdated` describes a
tracked background window and must not replace the consumer's foreground context.
Bounds and lifecycle events can also refer to background windows.

Window IDs come from matching Accessibility geometry to CoreGraphics windows, with
an app-local z-order fallback. This is an estimate rather than a native identity
mapping. Background queries retain the observed ID instead of repeating that fallback.

Updates have three sources:

| Source                              | When it runs                                                   | Scope                                                     |
| ----------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| App and Accessibility notifications | When macOS or the app sends an event                           | App activity and observed windows                         |
| Bounded retries                     | When foreground observation or browser metadata is unavailable | The active app, with delays from 200 ms up to 1.6 seconds |
| Optional reconciliation             | At `reconcile_interval_ms`, disabled by default                | Foreground state and tracked on-screen background windows |

Retries stop when information becomes available, focus moves to another app, or
the retry budget is exhausted (about 8 seconds for browser metadata and 30 seconds
for observation setup). Setting the reconciliation interval to zero disables only
periodic reconciliation, not these temporary retries.

Enable reconciliation to recover from missed notifications or delayed metadata updates:

```rust
let config = mado::MonitorConfig {
    include_browser_info: true,
    reconcile_interval_ms: 2_000,
    ..Default::default()
};
```

On-screen means included in macOS's window list across connected displays. Covered
windows can still qualify. Minimized windows and windows on inactive Spaces are
skipped by background reconciliation, but keep their observers. Reconciliation
respects the tracking flags and compares snapshots before emitting changes.

Notifications, retries, reconciliation, and listener callbacks run serially on the
monitor thread. The interval is a recovery cadence, not a delivery deadline:
Accessibility queries, optional website fetches, and slow callbacks can delay updates.

`WindowMonitor::refresh()` requests fresh events even if state is unchanged. It
re-emits the foreground `AppActivated` event and configured window updates for the
foreground and tracked on-screen background windows. It queues work on the same
monitor thread and does not discover all open windows.

### Browser And Website Info

Enable browser metadata when you need the active tab URL, browser content-area bounds, private-mode state, website hostname, favicon, or favicon-derived color:

```rust
use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};

struct BrowserListener;

impl WindowListener for BrowserListener {
    fn on_focus_change(&self, event: WindowEvent) {
        let window = match event {
            WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => window,
            WindowEvent::AppActivated { .. } => return,
            WindowEvent::AppTerminated { .. } => return,
            WindowEvent::WindowBoundsChanged { .. } => return,
            WindowEvent::WindowMinimized { .. } => return,
            WindowEvent::WindowRestored { .. } => return,
            WindowEvent::WindowDestroyed { .. } => return,
        };

        let Some(browser) = &window.browser else {
            return;
        };

        println!("URL: {:?}", browser.url);
        println!("Content bounds: {:?}", browser.content_bounds);
        println!("Private mode: {:?}", browser.is_private);

        if let Some(website) = &browser.website {
            println!("Hostname: {}", website.hostname);
            println!("Color: {:?}", website.color);
        }
    }
}

fn main() -> Result<(), mado::Error> {
    let monitor = WindowMonitor::with_config(
        BrowserListener,
        MonitorConfig {
            include_browser_info: true,
            include_website_info: true,
            ..Default::default()
        },
    );

    monitor.run()
}
```

Supported browsers are grouped by extraction family:

- Chromium: Google Chrome (Beta, Dev, and Canary), Chromium, Brave (Beta and
  Nightly), Microsoft Edge (Beta, Dev, and Canary), Opera (Beta, Developer, and
  GX), Arc, and Helium
- Safari: Safari (Technology Preview)
- Gecko: Firefox (Developer Edition and Nightly) and Zen

The loaded document URL takes precedence over the address bar, which may contain
an uncommitted edit. Chromium and Gecko can fall back to a known unfocused address
bar. Safari cannot use this fallback: its shortened address may omit the page path.
Missing or unreadable URLs produce `browser: None`, including for supported browsers.
A missing value does not imply navigation to an empty or allowed page.

Browser content bounds are best-effort Accessibility data and may be `None`
when the browser does not expose a top-level web content frame. Private-mode
state uses window-title patterns and is not a security guarantee. See the
[browser extraction model and observations](docs/browser-accessibility-extraction.md).

Browser information can become available shortly after a focus or title event.
The monitor retries while the browser remains active and emits another
`WindowChanged` event when the information becomes available.

### Installed Apps

Installed app queries do not need Accessibility permission:

```rust
use mado::InstalledAppsConfig;

fn main() {
    let apps = mado::get_installed_apps(InstalledAppsConfig::default());

    for app in apps.iter().take(10) {
        println!("{}: {}", app.name, app.bundle_id);
    }

    if let Some(preview) = mado::get_installed_app(
        "com.apple.Preview",
        InstalledAppsConfig::default(),
    ) {
        println!("Preview: {}", preview.path);
    }

    let icon = mado::get_app_icon("com.apple.finder", 64, false);
    if let Some(data_url) = &icon.data_url {
        println!("Finder icon: {} bytes", data_url.len());
    }

    if let Some(color) = mado::get_app_color("com.apple.finder") {
        println!("Finder color: {}", color);
    }
}
```

`get_installed_apps()` recursively scans the standard user, local, and system application
directories while excluding helpers embedded inside application bundles. Unreadable directories
and invalid application bundles are skipped. Use `get_installed_app()` when you have a bundle
identifier and need an exact lookup through macOS application registration. This lookup is not
limited to those scanned directories.

### Website Icons

Resolve a website favicon directly from a website URL:

```rust
fn main() {
    let icon = mado::get_website_icon("https://github.com/builder-group/community", true);

    if let Some(data_url) = &icon.data_url {
        println!("GitHub favicon: {} bytes", data_url.len());
    }

    if let Some(color) = &icon.color {
        println!("GitHub color: {}", color);
    }
}
```

`get_website_icon()` treats URLs without a scheme as HTTPS. Only the URL hostname is used for lookup and caching.

## Configuration

`QueryConfig` controls snapshot queries:

| Option                 | Default | Description                                                                |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| `include_app_icon`     | `false` | Adds a base64 PNG app icon to `AppInfo`                                    |
| `include_app_color`    | `false` | Adds app display color when app icon extraction is enabled                 |
| `include_browser_info` | `false` | Extracts the active browser URL and private-mode state                     |
| `include_website_info` | `false` | Extracts hostname, favicon, and favicon-derived color from the browser URL |

`MonitorConfig` supports the same enrichment options and adds monitor behavior flags:

| Option                        | Default | Description                                                                                      |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `track_window_changes`        | `true`  | Tracks foreground and background content changes and window lifecycle events                     |
| `track_window_bounds_changes` | `false` | Tracks move and resize changes for windows observed while focused                                |
| `reconcile_interval_ms`       | `0`     | Rechecks foreground and observed on-screen windows after missed notifications (zero disables it) |
| `include_app_icon`            | `false` | Adds a base64 PNG app icon to emitted app or window data                                         |
| `include_app_color`           | `false` | Adds app display color when app icon extraction is enabled                                       |
| `include_browser_info`        | `false` | Extracts the active browser URL and private-mode state                                           |
| `include_website_info`        | `false` | Extracts hostname, favicon, and favicon-derived color from the browser URL                       |

`InstalledAppsConfig` controls installed app scans:

| Option              | Default | Description                                            |
| ------------------- | ------- | ------------------------------------------------------ |
| `include_icon`      | `false` | Adds a base64 PNG icon to each installed app           |
| `include_app_color` | `false` | Adds app display color when icon extraction is enabled |
| `icon_size`         | `32`    | Icon size in pixels                                    |

When upgrading code that constructs `MonitorConfig` directly, include
`reconcile_interval_ms` or use `..Default::default()`. Exhaustive event matches must
handle `WindowUpdated`. Consumers tracking only foreground activity should ignore
that variant rather than treating it as a focus change.

## Events

`WindowEvent` has these variants:

| Event                 | When it fires                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `AppActivated`        | When the active app changes, without waiting for window metadata               |
| `AppTerminated`       | When an app activated during the monitor run terminates                                   |
| `WindowChanged`       | When focused window information becomes available or changes                              |
| `WindowUpdated`       | When a previously focused background window changes, without changing foreground activity |
| `WindowBoundsChanged` | When an observed window moves or resizes, if enabled                                      |
| `WindowMinimized`     | When a window observed while focused is minimized                                         |
| `WindowRestored`      | When a window observed while focused is restored from minimized state                     |
| `WindowDestroyed`     | When a window observed while focused is later destroyed                                   |

Destruction uses cached data because the accessibility element is no longer readable. A restore that activates an app may appear as `AppActivated` followed by `WindowChanged` instead of `WindowRestored`.

Use `event.app()` when all variants should be handled by app identity.

## macOS Permissions

Without Accessibility access, monitoring continues with app events. Window tracking starts after permission is granted and the next app activation or enabled reconciliation pass. Snapshot window queries still return a permission error. Check permission when explaining this limitation to users:

```rust
if !mado::is_accessibility_trusted() {
    eprintln!("Open System Settings > Privacy & Security > Accessibility");
}
```

Accessibility permission is required for:

- `track_window_changes: true`
- `track_window_bounds_changes: true`
- active window title and bounds
- browser URL and private-mode extraction
- website metadata based on the browser URL

Accessibility permission is not required for:

- `get_active_app()`
- app activation and termination events
- `get_installed_apps()`
- `get_installed_app()`
- `get_app_icon()` and `get_app_color()`
- `get_website_icon()`

## App Sandbox

macOS App Sandbox blocks cross-process Accessibility and CoreGraphics access. That changes which features can work:

| Feature                                    | Sandboxed | Unsandboxed |
| ------------------------------------------ | --------- | ----------- |
| App activation tracking with `NSWorkspace` | Works     | Works       |
| Window title and focus tracking            | Blocked   | Works       |
| Browser URL extraction                     | Blocked   | Works       |
| Window bounds                              | Blocked   | Works       |
| Installed apps and app icons               | Works     | Works       |

Use this config in sandboxed builds:

```rust
let config = mado::MonitorConfig {
    track_window_changes: false,
    track_window_bounds_changes: false,
    include_app_icon: true,
    ..Default::default()
};
```

With this setup, the monitor emits app activation and termination events only.

## Examples

From the repository root:

```bash
cargo run -p mado --example poll
cargo run -p mado --example listen
cargo run -p mado --example installed_apps
```

## FAQ

### Why are there separate `AppActivated` and `WindowChanged` events?

macOS can activate an app before a focused window exists, for example after launching from Spotlight or switching to an app with no open windows. `AppActivated` reports the app without waiting for window metadata. `WindowChanged` can follow when window tracking is enabled and data becomes available.

### Why does browser URL extraction need Accessibility permission?

Browsers expose the current URL through their UI tree in different ways. `mado` uses Accessibility APIs to read that state without per-browser AppleScript Automation permissions.

### Does `mado` validate or classify websites?

No. It extracts the current URL, hostname, favicon, and favicon-derived color when those options are enabled. Website classification, allow lists, and policy decisions belong in app code.

### What happens on Linux or Windows today?

The crate compiles with platform stubs, but monitoring and query APIs return `Error::Platform` because Linux and Windows support is not implemented yet.

### What does `mado` mean?

`mado` means window in Japanese.

## Contributing

### Add Browser Support

`mado` extracts browser metadata only for explicit bundle IDs with observed
Accessibility behavior. Before adding a browser:

1. Open `https://example.com/` in the browser.
2. Run the probe from the repository root:

   ```bash
   cd crates/mado
   swift run browser-ax-probe /tmp/mado-browser-ax-probe.md
   ```

3. Focus the browser during the three-second delay. The terminal running the
   probe needs macOS Accessibility permission.
4. Compare the generated Markdown with
   [the existing browser observations](docs/browser-accessibility-extraction.md).
5. Add the bundle ID to the matching extraction family, update
   `SupportedBrowsersTests`, and record the new observation.

The specific page content is not relevant to extraction-family matching.
`example.com` provides a stable top-level HTTPS page without redirects or
embedded application UI.

## Resources

- [swift-rs](https://github.com/Brendonovich/swift-rs)
- [Apple Accessibility API](https://developer.apple.com/documentation/applicationservices/axuielement_h)
- [Swift Package Manager](https://www.swift.org/package-manager/)
