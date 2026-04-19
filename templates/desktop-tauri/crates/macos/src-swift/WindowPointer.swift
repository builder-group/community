import AppKit

enum WindowPointer {
    /// Resolves a raw integer window pointer to an NSWindow.
    static func resolve(_ windowPtr: Int) -> NSWindow? {
        guard let rawPointer = UnsafeRawPointer(bitPattern: windowPtr) else {
            return nil
        }

        return Unmanaged<NSWindow>.fromOpaque(rawPointer).takeUnretainedValue()
    }

    /// Resolves the window pointer and runs the action on the main thread.
    /// Returns `false` if the pointer is invalid.
    static func withWindow(_ windowPtr: Int, perform action: (NSWindow) -> Void)
        -> Bool
    {
        return WindowMainThread.run {
            guard let window = resolve(windowPtr) else {
                return false
            }

            action(window)
            return true
        }
    }
}
