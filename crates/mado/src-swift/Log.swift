import Foundation

/// Simple debug logging for mado.
/// Logs are prefixed with [mado] for easy filtering.
/// Only logs in DEBUG builds by default.
enum Log {
    /// Log a debug message. Only prints in DEBUG builds.
    static func debug(_ message: String) {
        #if DEBUG
            fputs("[mado] \(message)\n", stderr)
        #endif
    }

    /// Log a warning. Always prints.
    static func warn(_ message: String) {
        fputs("[mado] WARNING: \(message)\n", stderr)
    }
}
