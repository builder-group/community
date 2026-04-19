import Foundation

enum WindowMainThread {
    /// Runs work synchronously on the main thread.
    static func run(_ work: () -> Bool) -> Bool {
        if Thread.isMainThread {
            return work()
        }

        return DispatchQueue.main.sync(execute: work)
    }
}
