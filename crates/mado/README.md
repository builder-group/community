# mado (窓)

> A simple, clean window monitoring and app information library for Rust

## 🌐 Platform Support

- ✅ **macOS**: Full support
- 🚧 **Linux**: Planned
- 🚧 **Windows**: Planned

### Requirements

**macOS:**

- macOS 10.15+
- **Accessibility permissions** required if `track_window_changes: true` (default)
  - System Settings > Privacy & Security > Accessibility
  - Not required if only tracking app switches (`track_window_changes: false`)

## 📦 Installation

```toml
[dependencies]
mado = "0.0.2"
```

## 📖 Usage

### Query current state

```rust
use mado;

// Get current app
let app = mado::get_active_app()?;
println!("Current app: {}", app);

// Get current window (fast, default)
let window = mado::get_active_window()?;
println!("Window: {}", window);

// With browser URL and website info
let window = mado::get_active_window_with_config(mado::QueryConfig {
    include_browser_info: true,
    include_website_info: true,
    ..Default::default()
})?;
if let Some(browser) = &window.browser {
    println!("URL: {:?}", browser.url);
    if let Some(website) = &browser.website {
        println!("Domain: {}", website.domain);
    }
}
```

### Listen to changes

```rust
use mado::{WindowListener, WindowMonitor, WindowEvent};

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

let monitor = WindowMonitor::new(FocusListener);
monitor.run()?;
```

### Browser and website info (macOS only)

```rust
use mado::{WindowListener, WindowMonitor, MonitorConfig, WindowEvent};

struct MyListener;

impl WindowListener for MyListener {
    fn on_focus_change(&self, event: WindowEvent) {
        if let WindowEvent::WindowChanged { window } = event {
            if let Some(browser) = &window.browser {
                // Browser info: URL and private mode
                if let Some(url) = &browser.url {
                    println!("URL: {}", url);
                }
                // Website info: domain, favicon, and color (nested in browser)
                if let Some(website) = &browser.website {
                    println!("Domain: {}", website.domain);
                    if let Some(color) = &website.color {
                        println!("Brand color: {}", color);
                    }
                }
            }
        }
    }
}

let config = MonitorConfig {
    include_browser_info: true,  // Extract URL and private mode
    include_website_info: true,  // Extract domain, favicon, and color
    ..Default::default()
};
let monitor = WindowMonitor::with_config(MyListener, config);
monitor.run()?;
```

**Supported browsers:** Chrome, Safari, Brave, Edge, Arc, Opera, Firefox (and their variants).

**Config options:**

| Option                 | Default | Description                                                          |
| ---------------------- | ------- | -------------------------------------------------------------------- |
| `include_app_icon`     | `false` | Extract app icon as base64 PNG and dominant color (~5-20ms)          |
| `include_browser_info` | `false` | Extract browser URL and private mode                                 |
| `include_website_info` | `false` | Extract domain, fetch favicon, and extract color (~50-500ms, cached) |
| `track_window_changes` | `true`  | Track window focus/title changes (requires Accessibility permission) |

### Stop monitoring

```rust
use mado::WindowMonitor;
use std::thread;
use std::time::Duration;

let monitor = WindowMonitor::new(MyListener);

thread::spawn(move || {
    thread::sleep(Duration::from_secs(5));
    WindowMonitor::stop().unwrap();
});

monitor.run()?;
```

### Check permissions (macOS)

```rust
if !mado::is_accessibility_trusted() {
    eprintln!("Please grant accessibility permissions in System Settings");
}
```

### Installed apps (macOS)

Query installed applications and their icons. No special permissions required.

```rust
use mado::InstalledAppsConfig;

// Fast scan without icons
let apps = mado::get_installed_apps(InstalledAppsConfig::default());
for app in &apps {
    println!("{}: {}", app.name, app.bundle_id);
}

// Get icon for a specific app
let icon = mado::get_app_icon("com.apple.finder", 64);
if let Some(data_url) = &icon.data_url {
    println!("Icon: {} bytes", data_url.len());
}
if let Some(color) = &icon.color {
    println!("Brand color: {}", color);
}
```

**Config options:**

| Option         | Default | Description                                    |
| -------------- | ------- | ---------------------------------------------- |
| `include_icon` | `false` | Extract icons as base64 PNG and dominant color |
| `icon_size`    | `32`    | Icon size in pixels                            |

## 📐 Architecture

### Why Event-Driven?

Event-driven monitoring minimizes latency and reduces CPU usage by avoiding continuous polling.

### Why Two Event Types?

Two events handle different scenarios:

- **`AppActivated`**: Fires immediately when app is activated (even if no window yet)
- **`WindowChanged`**: Fires when window data is available (title, bounds, browser info)

**Why not combine into one event?** A single event with `Option<WindowInfo>` would miss app activations when apps don't have windows (e.g. tray apps, apps activated via Spotlight before opening a window). Consumers need to know the app was activated even if no window exists yet.

### macOS Implementation

Uses Swift via [swift-rs](https://github.com/Brendonovich/swift-rs) for native API access:

| Component             | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| **NSWorkspace**       | App switch detection via `didActivateApplicationNotification` |
| **Accessibility API** | Window focus/title changes, browser URL extraction            |
| **CoreGraphics**      | Stable window IDs and accurate bounds                         |

**Why Accessibility API for browser URLs?** Previously used AppleScript, but it required per-browser Automation permissions and didn't support Firefox. The Accessibility API only needs the system-wide Accessibility permission and works with all browsers by traversing the UI tree to find the URL bar.

**Browser URL extraction strategies:**

- **Chromium** (Chrome, Brave, Edge, Arc, Opera): Find `AXTextField` by `AXDOMIdentifier` or placeholder text
- **Safari**: Read `AXURL` from `AXWebArea` element
- **Firefox**: Find `AXTextField` with "address" in description

**Threading Model:**

- Monitor runs in a spawned thread with its own CFRunLoop
- NSWorkspace notifications arrive on main thread, forwarded to monitor thread via `CFRunLoopPerformBlock`
- AXObserver callbacks delivered directly to monitor thread's runloop

**Delayed Window Handling:**

Some apps (especially when launched from Dock) activate before their window appears. We use exponential backoff polling (200ms → 400ms → 800ms → 1.6s capped, max ~30s total) to catch delayed windows.

## 🔒 App Sandbox (Mac App Store)

macOS App Sandbox restricts cross-process access, which affects mado's capabilities:

| Feature                                           | Sandboxed | Unsandboxed |
| ------------------------------------------------- | --------- | ----------- |
| App activation tracking (`NSWorkspace`)           | Works     | Works       |
| Window title/focus tracking (`Accessibility API`) | Blocked   | Works       |
| Browser URL extraction (`Accessibility API`)      | Blocked   | Works       |
| Window bounds (`CoreGraphics`)                    | Blocked   | Works       |
| App icon/installed apps                           | Works     | Works       |

**Why:** The Accessibility API (`AXUIElement`, `AXObserver`) requires cross-process access to read other apps' UI state. The App Sandbox prevents this. `AXObserverCreate` may succeed, but notifications are never delivered for other processes.

**Recommended config for sandboxed builds:**

```rust
let config = MonitorConfig {
    track_window_changes: false, // AX observers won't work
    include_browser_info: false, // URL extraction uses AX API
    include_app_icon: true,      // Works fine in sandbox
    include_website_info: false,
};
```

With this config, the monitor only emits `AppActivated` events (via `NSWorkspace.didActivateApplicationNotification`), which works in sandbox. `WindowChanged` events are not emitted.

## 💡 Resources / References

- [swift-rs](https://github.com/Brendonovich/swift-rs) - Rust ↔ Swift FFI
- [Creating a standalone Swift package with Xcode](https://developer.apple.com/documentation/xcode/creating-a-standalone-swift-package-with-xcode)
- [Accessibility API Reference](https://developer.apple.com/documentation/applicationservices/axuielement_h)
