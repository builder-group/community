use std::sync::Arc;

use crate::config::MonitorConfig;
use crate::error::Error;
use crate::listener::WindowListener;

/// Monitor app activity and changes to foreground and previously focused windows.
///
/// ## Example
///
/// ```rust,no_run
/// use mado::{WindowMonitor, WindowListener, WindowEvent};
///
/// struct MyListener;
/// impl WindowListener for MyListener {
///     fn on_focus_change(&self, event: WindowEvent) {
///         match event {
///             WindowEvent::AppActivated { app } => {
///                 println!("App: {}", app);
///             }
///             WindowEvent::AppTerminated { app } => {
///                 println!("App terminated: {}", app);
///             }
///             WindowEvent::WindowChanged { window } | WindowEvent::WindowUpdated { window } => {
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
///
/// let monitor = WindowMonitor::new(MyListener);
/// monitor.run()?;
/// # Ok::<(), mado::Error>(())
/// ```
pub struct WindowMonitor {
    listener: Arc<dyn WindowListener>,
    config: MonitorConfig,
}

impl WindowMonitor {
    /// Create a new window monitor with default configuration.
    pub fn new<L: WindowListener + 'static>(listener: L) -> Self {
        Self {
            listener: Arc::new(listener),
            config: MonitorConfig::default(),
        }
    }

    /// Create a new window monitor with custom configuration.
    pub fn with_config<L: WindowListener + 'static>(listener: L, config: MonitorConfig) -> Self {
        Self {
            listener: Arc::new(listener),
            config,
        }
    }

    /// Start monitoring (blocks until stopped).
    ///
    /// Uses the calling thread. When called on a worker, the host must keep its main
    /// event loop running to deliver macOS app notifications.
    ///
    /// App monitoring starts even without Accessibility access. Window events begin
    /// after access is granted and an app activates or reconciliation runs.
    ///
    /// # Errors
    ///
    /// Returns `Error` if platform initialization fails or a monitor is already running.
    pub fn run(self) -> Result<(), Error> {
        crate::platform::run(self.listener, self.config)
    }

    /// Schedules fresh events for foreground and observed on-screen windows, even if unchanged.
    ///
    /// Respects the monitor configuration and also re-emits `AppActivated` for the foreground app.
    /// Returns `Error::NotRunning` before native initialization or after shutdown.
    /// Queries run on the monitor thread. Success means the request was queued, not completed.
    pub fn refresh() -> Result<(), Error> {
        crate::platform::refresh()
    }

    /// Stop the monitor (can be called from another thread).
    ///
    /// Success means shutdown was queued. Wait for `run()` to return before starting
    /// another monitor.
    /// Returns `Error::NotRunning` before native initialization or after shutdown.
    pub fn stop() -> Result<(), Error> {
        crate::platform::stop()
    }
}
