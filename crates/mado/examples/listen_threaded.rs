//! Example: Listen from a background thread
//!
//! This example demonstrates running the monitor in a background thread while the main
//! thread runs an event loop. This pattern is useful for GUI applications like Tauri
//! where you want to keep the main thread free for UI operations.
//!
//! The monitor runs in a spawned thread, and the main thread runs the native event loop
//! (required for NSWorkspace notifications). Events are automatically forwarded between threads.

use mado::{MonitorConfig, WindowEvent, WindowListener, WindowMonitor};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

struct ThreadedListener {
    event_count: Arc<std::sync::atomic::AtomicUsize>,
}

impl WindowListener for ThreadedListener {
    fn on_focus_change(&self, event: WindowEvent) {
        let count = self.event_count.fetch_add(1, Ordering::SeqCst) + 1;
        match event {
            WindowEvent::AppActivated { app } => {
                println!("\n[Threaded Monitor] Event #{}: App Activated", count);
                println!("   App: {}", app);
            }
            WindowEvent::WindowChanged { window } => {
                println!("\n[Threaded Monitor] Event #{}: Window Changed", count);
                println!("   Window: {}", window);
            }
        }
    }
}

fn main() -> Result<(), mado::Error> {
    println!("🎧 Listening from background thread...");
    println!("   Monitor runs in background thread");
    println!("   Main thread runs event loop");
    println!("   Switch apps or windows to see events");
    println!("   Press Ctrl+C to stop\n");

    // Check permissions
    if !mado::is_accessibility_trusted() {
        eprintln!("⚠️  Accessibility permissions required!");
        eprintln!("   Enable in: System Settings > Privacy & Security > Accessibility");
        return Err(mado::Error::MissingPermission(
            "Accessibility permissions required".to_string(),
        ));
    }

    let running = Arc::new(AtomicBool::new(true));
    let event_count = Arc::new(std::sync::atomic::AtomicUsize::new(0));

    // Start monitor in background thread
    let running_clone = running.clone();
    let event_count_clone = event_count.clone();
    thread::spawn(move || {
        println!("[Monitor Thread] Started");

        let monitor = WindowMonitor::with_config(
            ThreadedListener {
                event_count: event_count_clone,
            },
            MonitorConfig {
                include_app_icon: true,
                include_browser_info: true,
                include_website_info: true,
                track_window_changes: true,
            },
        );

        if let Err(e) = monitor.run() {
            eprintln!("[Monitor Thread] Error: {}", e);
        }

        println!("[Monitor Thread] Stopped");
        running_clone.store(false, Ordering::SeqCst);
    });

    // Auto-stop after 30 seconds
    let running_clone = running.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(30));
        println!("\n[Timeout] Stopping monitor...");
        WindowMonitor::stop().ok();
        running_clone.store(false, Ordering::SeqCst);

        // Stop main runloop
        unsafe {
            extern "C" {
                fn CFRunLoopStop(rl: *const std::ffi::c_void);
                fn CFRunLoopGetMain() -> *const std::ffi::c_void;
            }
            CFRunLoopStop(CFRunLoopGetMain());
        }
    });

    // Run main thread event loop (required for NSWorkspace notifications)
    // In a Tauri app, this is handled automatically by Tauri's native event loop
    println!("[Main Thread] Running event loop...\n");
    unsafe {
        extern "C" {
            fn CFRunLoopRun();
        }
        CFRunLoopRun();
    }

    println!("\n✅ Monitor stopped");
    Ok(())
}
