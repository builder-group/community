//! Example: Listen to focus changes in real-time
//!
//! This example demonstrates event-driven monitoring.
//! The monitor runs continuously and calls your handler whenever:
//! - The user switches to a different app (AppActivated event)
//! - The focused window changes within the same app (WindowChanged event)
//! - The focused window title changes (WindowChanged event)

use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};

struct FocusListener;

impl WindowListener for FocusListener {
    fn on_focus_change(&self, event: WindowEvent) {
        match event {
            WindowEvent::AppActivated { app } => {
                println!("\n🔄 App Activated:\n{}", app);
            }
            WindowEvent::WindowChanged { window } => {
                println!("\n🪟 Window Change:\n{}", window);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    println!("🎧 Listening for focus changes...");
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
            include_app_icon: true,
            include_browser_info: true,
            include_website_info: true,
            track_window_changes: true,
        },
    );
    monitor.run()
}
