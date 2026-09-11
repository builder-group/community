use crate::types::WindowEvent;

/// Trait for listening to `WindowMonitor` events.
///
/// Receive app lifecycle, foreground window, and tracked background window events.
/// Despite the callback name, not every event changes foreground activity.
/// See [`WindowEvent`] for each event's meaning and configuration requirements.
///
/// Forward events to a worker when processing needs I/O or other slow work:
///
/// ```rust
/// use mado::{WindowEvent, WindowListener};
///
/// struct MyListener {
///     sender: std::sync::mpsc::Sender<WindowEvent>,
/// }
///
/// impl WindowListener for MyListener {
///     fn on_focus_change(&self, event: WindowEvent) {
///         let _ = self.sender.send(event);
///     }
/// }
/// ```
///
pub trait WindowListener: Send + Sync {
    /// Called whenever the monitor emits an event.
    ///
    /// Runs synchronously on the monitor thread. Background updates and lifecycle
    /// events do not imply a focus change. Use `event.app()` for the affected app.
    /// Unwinding panics are caught and logged so monitoring can continue.
    fn on_focus_change(&self, event: WindowEvent);
}
