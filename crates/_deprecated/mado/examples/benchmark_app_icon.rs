//! Example: Benchmark app icon and color lookup cost
//!
//! This is a small local profiling harness for comparing icon-only, icon+color,
//! and color-only lookups for a couple of installed apps.

use std::time::Instant;

fn main() {
    println!("Scanning installed applications...\n");

    let apps = mado::get_installed_apps(mado::InstalledAppsConfig::default());
    println!("Found {} apps\n", apps.len());

    println!("{}", "─".repeat(60));
    println!("\nMeasuring app icon lookups...\n");

    benchmark_app("Finder", "com.apple.finder");

    apps.iter()
        .filter(|app| !app.bundle_id.starts_with("com.apple."))
        .take(20)
        .for_each(|app| {
            println!();
            benchmark_app(&app.name, &app.bundle_id);
        });
}

fn benchmark_app(name: &str, bundle_id: &str) {
    println!("  {} ({})", name, bundle_id);

    let started = Instant::now();
    let icon_only = mado::get_app_icon(bundle_id, 64, false);
    println!("    get_app_icon(..., false): {:?}", started.elapsed());

    let started = Instant::now();
    let icon_with_color = mado::get_app_icon(bundle_id, 64, true);
    println!("    get_app_icon(..., true):  {:?}", started.elapsed());

    let started = Instant::now();
    let color_only = mado::get_app_color(bundle_id);
    println!("    get_app_color(...):       {:?}", started.elapsed());

    if let Some(data_url) = &icon_only.data_url {
        println!("    icon bytes:               {}", data_url.len());
    }
    if let Some(color) = icon_with_color.color.as_deref().or(color_only.as_deref()) {
        println!("    color:                    {}", color);
    }
}
