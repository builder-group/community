//! Example: Poll for current state on demand
//!
//! This example demonstrates explicit querying.
//! Call the query functions whenever you need the current state.

use std::thread;
use std::time::Duration;

fn main() -> Result<(), mado::Error> {
    println!("📊 Polling current state every 2 seconds...");
    println!("   Switch apps or windows to see changes");
    println!("   Press Ctrl+C to stop\n");

    // Check permissions
    if !mado::is_accessibility_trusted() {
        eprintln!("⚠️  Accessibility permissions required!");
        eprintln!("   Enable in: System Settings > Privacy & Security > Accessibility");
        return Err(mado::Error::MissingPermission(
            "Accessibility permissions required".to_string(),
        ));
    }

    loop {
        let config = mado::QueryConfig {
            include_app_icon: true,
            include_browser_info: true,
            include_website_info: true,
        };

        match mado::get_active_app_with_config(config) {
            Ok(app) => {
                println!("📱 Current App");
                print!("{}", app);
            }
            Err(e) => eprintln!("❌ Error getting app: {}", e),
        }

        match mado::get_active_window_with_config(config) {
            Ok(window) => {
                println!("\n🪟 Current Window");
                print!("{}", window);
            }
            Err(e) => eprintln!("❌ Error getting window: {}", e),
        }

        println!("\n{}", "─".repeat(60));
        thread::sleep(Duration::from_secs(2));
    }
}
