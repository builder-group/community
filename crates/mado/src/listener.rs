use crate::types::WindowEvent;

/// Trait for listening to `WindowMonitor` events.
///
/// Implement this trait to receive notifications when the active app, focused
/// window, or focused window bounds change.
/// The callback receives a `WindowEvent` which can be one of:
/// - `AppActivated`: Always fires when an app is switched to (even if it has no window yet, e.g. tray apps)
/// - `AppTerminated`: Fires when a previously active app terminates
/// - `WindowChanged`: Fires when focused window information becomes available or changes
/// - `WindowBoundsChanged`: Fires when the focused window moves or resizes, if enabled
/// - `WindowMinimized` and `WindowRestored`: Fire for the observed focused window
/// - `WindowDestroyed`: Fires when a window observed while focused is later destroyed
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
///             WindowEvent::AppTerminated { app } => {
///                 println!("App terminated: {}", app);
///             }
///             WindowEvent::WindowChanged { window } => {
///                 println!("Window: {}", window);
///             }
///             WindowEvent::WindowBoundsChanged { window } => {
///                 println!("Window moved/resized: {:?}", window.bounds);
///             }
///             WindowEvent::WindowMinimized { window } => {
///                 println!("Window minimized: {:?}", window.window_id);
///             }
///             WindowEvent::WindowRestored { window } => {
///                 println!("Window restored: {:?}", window.window_id);
///             }
///             WindowEvent::WindowDestroyed { window } => {
///                 println!("Window destroyed: {:?}", window.window_id);
///             }
///         }
///     }
/// }
/// ```
pub trait WindowListener: Send + Sync {
    /// Called whenever the monitor emits an event.
    ///
    /// The active context can change to:
    /// - An app (`AppActivated` event) - fires immediately when app is activated, even if it has no window yet
    ///   (e.g. tray apps, apps activated via Spotlight/Dock before opening a window)
    /// - A terminated app (`AppTerminated` event) - fires for apps activated during this monitor run
    /// - A window (`WindowChanged` event) - fires when focused window information becomes
    ///   available or changes
    /// - A window bounds update (`WindowBoundsChanged` event) - fires when enabled and the focused window moves or resizes
    /// - A focused-window lifecycle update (`WindowMinimized` or `WindowRestored`)
    /// - A previously focused window being destroyed (`WindowDestroyed`)
    ///
    /// This includes:
    /// - App switches (always `AppActivated` first, then `WindowChanged` when window is ready)
    /// - Previously active apps terminating (`AppTerminated` only)
    /// - Window switches within the same app (`WindowChanged` only)
    /// - Window title changes (`WindowChanged` only)
    /// - Browser information becoming available (`WindowChanged` only)
    /// - Focused window move/resize changes (`WindowBoundsChanged` only, if enabled)
    /// - Focused window minimize or restore changes when `track_window_changes` is enabled
    /// - Previously focused window destruction when `track_window_changes` is enabled
    ///
    /// Use `event.app()` to get app information from any event type.
    ///
    /// **Note**: Keep this callback fast. For heavy work, spawn async tasks. Panics are caught
    /// and logged but won't crash the monitor thread.
    fn on_focus_change(&self, event: WindowEvent);
}
