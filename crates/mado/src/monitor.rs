use std::sync::Arc;

use crate::config::MonitorConfig;
use crate::error::Error;
use crate::listener::WindowListener;

/// Monitor for window and application focus changes.
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
///             WindowEvent::WindowChanged { window } => {
///                 println!("Window: {}", window);
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
    /// # Errors
    ///
    /// Returns `Error` if platform initialization fails or permissions are missing.
    pub fn run(self) -> Result<(), Error> {
        crate::platform::run(self.listener, self.config)
    }

    /// Stop the monitor (can be called from another thread).
    ///
    /// This is a static method because the monitor runs in its own thread.
    /// Call this from any thread to signal the monitor to stop.
    pub fn stop() -> Result<(), Error> {
        crate::platform::stop()
    }
}
