//! Example: List installed applications
//!
//! This example demonstrates querying installed apps and their icons.
//! No special permissions required.

fn main() {
    println!("Scanning installed applications...\n");

    // Fast scan without icons
    let config = mado::InstalledAppsConfig::default();
    let apps = mado::get_installed_apps(config);

    println!("Found {} apps:\n", apps.len());

    for app in apps.iter().take(10) {
        println!("  {} ({})", app.name, app.bundle_id);
    }

    if apps.len() > 10 {
        println!("  ... and {} more\n", apps.len() - 10);
    }

    if let Some(preview) = mado::get_installed_app("com.apple.Preview", config) {
        println!("Resolved {} at {}\n", preview.name, preview.path);
    }

    // Get icon for a specific app
    println!("\n{}", "─".repeat(60));
    println!("\nFetching Finder icon...\n");

    let icon = mado::get_app_icon("com.apple.finder", 64, false);
    if let Some(data_url) = &icon.data_url {
        println!("  Icon:  {} bytes", data_url.len());
    }
    if let Some(color) = mado::get_app_color("com.apple.finder") {
        println!("  Color: {}", color);
    }
}
