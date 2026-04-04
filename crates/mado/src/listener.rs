use crate::types::WindowEvent;

/// Trait for listening to window and app focus events.
///
/// Implement this trait to receive notifications when focus changes.
/// The callback receives a `WindowEvent` which can be either:
/// - `AppActivated`: Always fires when an app is switched to (even if it has no window yet, e.g. tray apps)
/// - `WindowChanged`: Fires when window focus/title changes or when a window becomes available
///
/// ## Performance Considerations
///
/// Callbacks should be **fast** to avoid blocking the monitor thread. For heavy work
/// (e.g., database operations, network requests), spawn async tasks:
///
/// ```rust,ignore
/// use mado::{WindowEvent, WindowListener};
///
/// struct MyListener {
///     sender: std::sync::mpsc::Sender<WindowEvent>,
/// }
///
/// impl WindowListener for MyListener {
///     fn on_focus_change(&self, event: WindowEvent) {
///         // Fast: send event to another thread for processing
///         let _ = self.sender.send(event);
///     }
/// }
/// ```
///
/// ## Panic Safety
///
/// Panics in callbacks are caught and logged, but **will not crash the monitor thread**.
/// The monitor will continue running even if a callback panics.
///
/// ## Thread Safety
///
/// Only **one monitor can run at a time**. Creating multiple `WindowMonitor` instances
/// and calling `run()` will return `Error::AlreadyRunning` for subsequent calls.
///
/// # Example
///
/// ```rust
/// use mado::{WindowEvent, WindowListener};
///
/// struct MyListener;
///
/// impl WindowListener for MyListener {
///     fn on_focus_change(&self, event: WindowEvent) {
///         match event {
///             WindowEvent::AppActivated { app } => {
///                 println!("App: {}", app);
///             }
///             WindowEvent::WindowChanged { window } => {
///                 println!("Window: {}", window);
///             }
///         }
///     }
/// }
/// ```
pub trait WindowListener: Send + Sync {
    /// Called whenever the focused window or app changes.
    ///
    /// Focus can change to:
    /// - An app (`AppActivated` event) - fires immediately when app is activated, even if it has no window yet
    ///   (e.g. tray apps, apps activated via Spotlight/Dock before opening a window)
    /// - A window (`WindowChanged` event) - fires when window focus/title changes or when window becomes available
    ///
    /// This includes:
    /// - App switches (always `AppActivated` first, then `WindowChanged` when window is ready)
    /// - Window switches within the same app (`WindowChanged` only)
    /// - Window title changes (`WindowChanged` only)
    ///
    /// Use `event.app()` to get app information from either event type.
    ///
    /// **Note**: Keep this callback fast. For heavy work, spawn async tasks. Panics are caught
    /// and logged but won't crash the monitor thread.
    fn on_focus_change(&self, event: WindowEvent);
}
