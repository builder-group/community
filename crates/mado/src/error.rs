use thiserror::Error;

/// Error types for mado.
#[derive(Error, Debug)]
pub enum Error {
    /// Platform-specific error (e.g. X11 connection failed, API call failed)
    #[error("Platform error: {0}")]
    Platform(String),

    /// Required permissions are not granted
    #[error("Missing permissions: {0}")]
    MissingPermission(String),

    /// Monitor is already running
    #[error("Monitor is already running")]
    AlreadyRunning,

    /// Monitor is not running
    #[error("Monitor is not running")]
    NotRunning,

    /// No active application found
    #[error("No active application found")]
    NoActiveApp,

    /// No active window found
    #[error("No active window found")]
    NoActiveWindow,
}
