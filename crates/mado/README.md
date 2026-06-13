# mado (窓)

`mado` is a macOS-focused Rust crate for reading the active app and focused window. It wraps native macOS APIs through Swift, listens to focus changes, and can enrich browser windows with URL and website metadata. Use it in desktop apps, productivity tools, and agents that need current user context.

- Query the active app or focused window when you need a snapshot
- Listen to app activations, window focus changes, and title changes without polling
- Add browser URLs, private-mode state, website hostnames, favicons, and favicon-derived colors only when needed
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
            WindowEvent::WindowChanged { window } => {
                let app_name = window.app.name.as_deref().unwrap_or("Unknown app");
                let title = window.title.as_deref().unwrap_or("Untitled window");
                println!("{app_name}: {title}");

                if let Some(browser) = &window.browser {
                    println!("URL: {:?}", browser.url);
                }
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
            ..Default::default()
        },
    );

    monitor.run()
}
```

## Install

```toml
[dependencies]
mado = "0.0.3"
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
- Installed apps: `get_installed_apps()`, `get_app_icon()`, and `get_app_color()`
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

`include_website_info` depends on `include_browser_info` because it needs the current URL. Website metadata can fetch favicons over the network and is cached by hostname.

### Listen To Focus Changes

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
            WindowEvent::WindowChanged { window } => {
                println!("Window: {}", window);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    let monitor = WindowMonitor::new(FocusListener);
    monitor.run()
}
```

`run()` blocks until `WindowMonitor::stop()` is called. Only one monitor can run at a time. A second monitor returns `Error::AlreadyRunning`.

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

### Browser And Website Info

Enable browser metadata when you need the active tab URL, private-mode state, website hostname, favicon, or favicon-derived color:

```rust
use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};

struct BrowserListener;

impl WindowListener for BrowserListener {
    fn on_focus_change(&self, event: WindowEvent) {
        let window = match event {
            WindowEvent::WindowChanged { window } => window,
            WindowEvent::AppActivated { .. } => return,
        };

        let Some(browser) = &window.browser else {
            return;
        };

        println!("URL: {:?}", browser.url);
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

Supported browser families include Chrome, Safari, Brave, Edge, Arc, Opera, Firefox, and their common variants.

### Installed Apps

Installed app queries do not need Accessibility permission:

```rust
use mado::InstalledAppsConfig;

fn main() {
    let apps = mado::get_installed_apps(InstalledAppsConfig::default());

    for app in apps.iter().take(10) {
        println!("{}: {}", app.name, app.bundle_id);
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

`MonitorConfig` supports the same enrichment options and adds `track_window_changes`:

| Option                 | Default | Description                                                                |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| `track_window_changes` | `true`  | Tracks window focus and title changes in addition to app activation events |
| `include_app_icon`     | `false` | Adds a base64 PNG app icon to emitted app or window data                   |
| `include_app_color`    | `false` | Adds app display color when app icon extraction is enabled                 |
| `include_browser_info` | `false` | Extracts the active browser URL and private-mode state                     |
| `include_website_info` | `false` | Extracts hostname, favicon, and favicon-derived color from the browser URL |

`InstalledAppsConfig` controls installed app scans:

| Option              | Default | Description                                            |
| ------------------- | ------- | ------------------------------------------------------ |
| `include_icon`      | `false` | Adds a base64 PNG icon to each installed app           |
| `include_app_color` | `false` | Adds app display color when icon extraction is enabled |
| `icon_size`         | `32`    | Icon size in pixels                                    |

## Events

`WindowEvent` has two variants:

| Event           | When it fires                                                                 |
| --------------- | ----------------------------------------------------------------------------- |
| `AppActivated`  | Immediately when the focused app changes, even if no window is available yet  |
| `WindowChanged` | When focused window data is available, a window changes, or the title changes |

Use `event.app()` when both variants should be handled by app identity.

## macOS Permissions

Check permission before enabling window tracking:

```rust
if !mado::is_accessibility_trusted() {
    eprintln!("Open System Settings > Privacy & Security > Accessibility");
}
```

Accessibility permission is required for:

- `track_window_changes: true`
- active window title and bounds
- browser URL and private-mode extraction
- website metadata based on the browser URL

Accessibility permission is not required for:

- `get_active_app()`
- app activation events with `track_window_changes: false`
- `get_installed_apps()`
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
    include_browser_info: false,
    include_website_info: false,
    include_app_icon: true,
    include_app_color: false,
};
```

With this setup, the monitor emits `AppActivated` events only.

## Examples

From the repository root:

```bash
cargo run -p mado --example poll
cargo run -p mado --example listen
cargo run -p mado --example installed_apps
```

## FAQ

### Why does mado use callbacks instead of polling?

Event-driven monitoring reacts to app and window changes as they happen. It avoids keeping a timer alive just to rediscover the same focused window. Use snapshot queries when polling is the better fit for your app.

### Why are there separate `AppActivated` and `WindowChanged` events?

macOS can activate an app before a focused window exists, for example after launching from Spotlight or switching to an app with no open windows. `AppActivated` lets you react immediately. `WindowChanged` follows when window data becomes available.

### Why does browser URL extraction need Accessibility permission?

Browsers expose the current URL through their UI tree in different ways. `mado` uses Accessibility APIs to read that state without per-browser AppleScript Automation permissions.

### Does `mado` validate or classify websites?

No. It extracts the current URL, hostname, favicon, and favicon-derived color when those options are enabled. Website classification, allow lists, and policy decisions belong in app code.

### What happens on Linux or Windows today?

The crate compiles with platform stubs, but monitoring and query APIs return `Error::Platform` because Linux and Windows support is not implemented yet.

### What does `mado` mean?

`mado` means window in Japanese.

## Resources

- [swift-rs](https://github.com/Brendonovich/swift-rs)
- [Apple Accessibility API](https://developer.apple.com/documentation/applicationservices/axuielement_h)
- [Swift Package Manager](https://www.swift.org/package-manager/)
