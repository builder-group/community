//! Example: Listen to app, window, and bounds changes in real time
//!
//! This example demonstrates event-driven monitoring.
//! The monitor runs continuously and calls your handler whenever:
//! - The user switches to a different app (AppActivated event)
//! - A previously active app terminates (AppTerminated event)
//! - The focused window changes within the same app (WindowChanged event)
//! - The focused window title changes (WindowChanged event)
//! - A previously focused background window changes (WindowUpdated event)
//! - An observed window is minimized, restored, or destroyed
//! - An observed window moves or resizes, if enabled (WindowBoundsChanged event)

use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};

struct FocusListener;

impl WindowListener for FocusListener {
    fn on_focus_change(&self, event: WindowEvent) {
        match event {
            WindowEvent::AppActivated { app } => {
                println!("\n🔄 App Activated:\n{}", app);
            }
            WindowEvent::AppTerminated { app } => {
                println!("\n⏹️ App Terminated:\n{}", app);
            }
            WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
                println!("\n🪟 Window Change:\n{}", window);
            }
            WindowEvent::WindowBoundsChanged { window } => {
                println!("\n📐 Window Bounds Change:\n{:?}", window.bounds);
            }
            WindowEvent::WindowMinimized { window } => {
                println!("\n🪟 Window Minimized:\n{:?}", window.window_id);
            }
            WindowEvent::WindowRestored { window } => {
                println!("\n🪟 Window Restored:\n{:?}", window.window_id);
            }
            WindowEvent::WindowDestroyed { window } => {
                println!("\n🪟 Window Destroyed:\n{:?}", window.window_id);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    println!("🎧 Listening for app and window events...");
    println!("   Switch apps or windows to see events");
    println!("   Press Ctrl+C to stop\n");

    // Check permissions
    if !mado::is_accessibility_trusted() {
        eprintln!("⚠️  Accessibility permissions required for window change tracking!");
        eprintln!("   Enable in: System Settings > Privacy & Security > Accessibility");
        eprintln!("   Or set track_window_changes: false to only track app switches");
        return Err(mado::Error::MissingPermission(
            "Accessibility permissions required".to_string(),
        ));
    }

    let monitor = WindowMonitor::with_config(
        FocusListener,
        MonitorConfig {
            reconcile_interval_ms: 2_000,
            include_app_icon: true,
            include_app_color: false,
            include_browser_info: true,
            include_website_info: true,
            track_window_changes: true,
            track_window_bounds_changes: true,
        },
    );
    monitor.run()
}
