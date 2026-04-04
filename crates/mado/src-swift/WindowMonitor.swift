import AppKit
import ApplicationServices
import Foundation
import SwiftRs

/// Monitors window and app focus changes using NSWorkspace and Accessibility API.
///
/// Threading Model:
/// - Monitor runs in spawned thread with its own CFRunLoop (wherever monitor.run() is called)
/// - NSWorkspace notifications arrive on main thread → forwarded via CFRunLoopPerformBlock
/// - AXObserver callbacks delivered directly to monitor thread's run loop
/// - All state mutations happen on monitor thread (ensured by CFRunLoopPerformBlock)
final class WindowMonitor: NSObject {
    /// Singleton instance managed by FFI layer (Rust side).
    /// Note: nonisolated(unsafe) is required because this is accessed from C callbacks
    /// and Rust FFI, which operate outside Swift's concurrency model.
    nonisolated(unsafe) static var shared: WindowMonitor?

    private let callback: WindowEventCallback
    private let trackWindowChanges: Bool
    private let includeAppIcon: Bool
    private let includeBrowserInfo: Bool
    private let includeWebsiteInfo: Bool

    private var isRunning = false
    private var monitorRunLoop: CFRunLoop?
    private var notificationObserver: NSObjectProtocol?

    // Accessibility observer state
    private var axObservers: [AXObserver] = []
    private var currentPID: pid_t = 0
    private var currentTitleObservedWindow: AXUIElement?

    // Polling state for delayed windows.
    // Apps launched from Dock/Spotlight can take seconds to show their window.
    // Exponential backoff: 200ms → 400ms → 800ms → 1.6s (capped), max ~30s.
    private var pollingTimer: CFRunLoopTimer?
    private var pollingRetryCount: UInt32 = 0
    private let maxRetries: UInt32 = 21
    private let baseDelay: Double = 0.2
    private let maxDelay: Double = 1.6

    // Deduplication to prevent duplicate WindowChanged events
    private var lastWindowId: UInt32?
    private var lastWindowTitle: String?

    private var keepAliveSource: CFRunLoopSource?

    init(
        callback: @escaping WindowEventCallback,
        trackWindowChanges: Bool,
        includeAppIcon: Bool,
        includeBrowserInfo: Bool,
        includeWebsiteInfo: Bool
    ) {
        self.callback = callback
        self.trackWindowChanges = trackWindowChanges
        self.includeAppIcon = includeAppIcon
        self.includeBrowserInfo = includeBrowserInfo
        self.includeWebsiteInfo = includeWebsiteInfo
    }

    // MARK: - Lifecycle

    /// Start monitoring. Blocks forever until stop() is called.
    func start() {
        guard !isRunning else { return }
        isRunning = true
        monitorRunLoop = CFRunLoopGetCurrent()

        setupRunLoopKeepAlive()
        setupAppActivationObserver()

        // Observe initial app
        if let app = NSWorkspace.shared.frontmostApplication {
            handleAppActivation(app: app, pid: app.processIdentifier)
        }

        // Note: Blocks until CFRunLoopStop() is called from stop()
        CFRunLoopRun()

        Log.warn("Monitor run loop exited")
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false

        stopWindowPolling()
        removeRunLoopKeepAlive()
        cleanupAccessibilityObservers()

        if let observer = notificationObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(observer)
        }
        notificationObserver = nil

        if let runLoop = monitorRunLoop {
            CFRunLoopStop(runLoop)
        }
        monitorRunLoop = nil
    }

    // MARK: - Run Loop Keep-Alive

    /// Dummy source that keeps CFRunLoopRun() from exiting (zero CPU wakeups).
    ///
    /// Why we need it:
    /// CFRunLoopRun() exits immediately when no sources or timers are registered.
    /// The only source we add is the AXObserver, but that's skipped when
    /// `trackWindowChanges=false` (e.g. sandboxed builds). NSWorkspace notifications
    /// are forwarded via CFRunLoopPerformBlock, which doesn't count as a source.
    /// Without this, the monitor thread exits immediately.
    ///
    /// https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html
    private func setupRunLoopKeepAlive() {
        guard let runLoop = monitorRunLoop else { return }

        var context = CFRunLoopSourceContext(
            version: 0,
            info: nil,
            retain: nil,
            release: nil,
            copyDescription: nil,
            equal: nil,
            hash: nil,
            schedule: nil,
            cancel: nil,
            perform: { _ in }
        )

        if let source = CFRunLoopSourceCreate(kCFAllocatorDefault, 0, &context) {
            keepAliveSource = source
            CFRunLoopAddSource(runLoop, source, .defaultMode)
        }
    }

    private func removeRunLoopKeepAlive() {
        if let source = keepAliveSource, let runLoop = monitorRunLoop {
            CFRunLoopRemoveSource(runLoop, source, .defaultMode)
            keepAliveSource = nil
        }
    }

    // MARK: - App Activation

    /// NSWorkspace notifications arrive on main thread, forwarded to monitor thread via CFRunLoop.
    ///
    /// CFRunLoopPerformBlock ensures state mutations happen on monitor thread, preventing
    /// race conditions when monitor.run() is called from a spawned thread.
    private func setupAppActivationObserver() {
        notificationObserver = NSWorkspace.shared.notificationCenter
            .addObserver(
                forName: NSWorkspace.didActivateApplicationNotification,
                object: nil,
                queue: OperationQueue.main
            ) { [weak self] notification in
                // Note: Sendable warning is safe because:
                // - monitorRunLoop is only read (never mutated) from main thread
                // - All state mutations happen on monitor thread via CFRunLoopPerformBlock
                guard
                    let runLoop = self?.monitorRunLoop,
                    let app = notification.userInfo?[
                        NSWorkspace.applicationUserInfoKey
                    ] as? NSRunningApplication
                else { return }

                CFRunLoopPerformBlock(
                    runLoop,
                    CFRunLoopMode.defaultMode.rawValue
                ) { [weak self] in
                    self?.handleAppActivation(
                        app: app,
                        pid: app.processIdentifier
                    )
                }
                CFRunLoopWakeUp(runLoop)
            }
    }

    /// Handles app activation. Runs on monitor thread (ensured by CFRunLoopPerformBlock).
    private func handleAppActivation(app: NSRunningApplication, pid: pid_t) {
        guard pid != currentPID else { return }

        cleanupAccessibilityObservers()
        stopWindowPolling()
        resetDeduplication()

        currentPID = pid
        sendAppActivatedEvent(app: app)

        guard trackWindowChanges else { return }

        setupAccessibilityObserver(pid: pid)

        // Try to send window event immediately. If it fails (no window yet),
        // start polling to wait for window to appear (common when app launched from Dock).
        if !sendWindowChangedEvent() {
            startWindowPolling()
        }
    }

    // MARK: - Accessibility Observers

    /// Setup accessibility observer for app. Callbacks delivered to monitor thread's run loop.
    private func setupAccessibilityObserver(pid: pid_t) {
        var observer: AXObserver?
        guard AXObserverCreate(pid, axCallback, &observer) == .success,
            let observer = observer
        else {
            Log.warn("Failed to create AXObserver for PID \(pid)")
            return
        }

        let app = AXUIElementCreateApplication(pid)
        let context = Unmanaged.passUnretained(self).toOpaque()

        // Observe focus changes at app level (user switches windows within app)
        AXObserverAddNotification(
            observer,
            app,
            kAXFocusedWindowChangedNotification as CFString,
            context
        )

        // Observe title changes on current window (e.g. tab switches in browsers)
        registerTitleObserver(observer: observer, pid: pid)

        if let runLoop = monitorRunLoop {
            CFRunLoopAddSource(
                runLoop,
                AXObserverGetRunLoopSource(observer),
                .defaultMode
            )
        }

        axObservers.append(observer)
    }

    /// Re-register title observer on focused window (title observer is window-specific).
    private func registerTitleObserver(observer: AXObserver, pid: pid_t) {
        let app = AXUIElementCreateApplication(pid)

        // Remove previous observer if exists
        if let previousWindow = currentTitleObservedWindow {
            AXObserverRemoveNotification(
                observer,
                previousWindow,
                kAXTitleChangedNotification as CFString
            )
        }

        guard let windowElement = getFocusedWindow(from: app) else {
            currentTitleObservedWindow = nil
            return
        }

        let context = Unmanaged.passUnretained(self).toOpaque()
        AXObserverAddNotification(
            observer,
            windowElement,
            kAXTitleChangedNotification as CFString,
            context
        )
        currentTitleObservedWindow = windowElement
    }

    private func cleanupAccessibilityObservers() {
        guard let runLoop = monitorRunLoop else { return }

        // Remove run loop sources (stops all notifications)
        for observer in axObservers {
            CFRunLoopRemoveSource(
                runLoop,
                AXObserverGetRunLoopSource(observer),
                .defaultMode
            )
        }

        axObservers.removeAll()
        currentTitleObservedWindow = nil
        currentPID = 0
    }

    /// Called by axCallback when window focus changes. Runs on monitor thread.
    /// Note: fileprivate allows axCallback (C callback) to access this.
    fileprivate func handleFocusChange(observer: AXObserver) {
        registerTitleObserver(observer: observer, pid: currentPID)
    }

    /// Called by axCallback on any window change. Runs on monitor thread.
    /// Note: fileprivate allows axCallback (C callback) to access this.
    fileprivate func handleWindowChange() {
        stopWindowPolling()
        // Result is discarded: we always try to send, deduplication handles duplicates
        _ = sendWindowChangedEvent()
    }

    // MARK: - Window Polling

    /// Start polling for window with exponential backoff.
    /// Needed because some apps (especially launched from Dock) show their window
    /// seconds after activation. Without polling, we'd miss the WindowChanged event.
    private func startWindowPolling() {
        pollingRetryCount = 0
        scheduleNextWindowPoll()
    }

    private func scheduleNextWindowPoll() {
        guard pollingRetryCount < maxRetries, let runLoop = monitorRunLoop
        else {
            stopWindowPolling()
            return
        }

        // Invalidate previous timer if it exists (prevents multiple timers running)
        if let oldTimer = pollingTimer {
            CFRunLoopTimerInvalidate(oldTimer)
            pollingTimer = nil
        }

        pollingRetryCount += 1

        let delay = min(
            baseDelay * pow(2.0, Double(pollingRetryCount - 1)),
            maxDelay
        )  // Exponential backoff
        let fireDate = CFAbsoluteTimeGetCurrent() + delay

        var context = CFRunLoopTimerContext()
        context.info = Unmanaged.passUnretained(self).toOpaque()

        guard
            let timer = CFRunLoopTimerCreate(
                kCFAllocatorDefault,
                fireDate,
                0,
                0,
                0,
                { _, info in
                    guard let info = info else { return }
                    Unmanaged<WindowMonitor>.fromOpaque(info)
                        .takeUnretainedValue().checkWindowPoll()
                },
                &context
            )
        else { return }

        pollingTimer = timer
        CFRunLoopAddTimer(runLoop, timer, .defaultMode)
    }

    private func checkWindowPoll() {
        guard currentPID != 0 else {
            stopWindowPolling()
            return
        }

        // Verify app hasn't changed (user might have switched apps during polling)
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication,
            frontmostApp.processIdentifier == currentPID
        else {
            stopWindowPolling()
            return
        }

        let windowInfo = WindowInfo.fromPID(
            currentPID,
            includeAppIcon: includeAppIcon,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )

        if windowInfo.windowId != nil {
            // Window appeared, send event and stop polling
            stopWindowPolling()
            _ = sendWindowChangedEvent()
        } else {
            // Window not ready yet, continue polling
            scheduleNextWindowPoll()
        }
    }

    private func stopWindowPolling() {
        if let timer = pollingTimer {
            CFRunLoopTimerInvalidate(timer)
            pollingTimer = nil
        }
        pollingRetryCount = 0
    }

    // MARK: - Events

    private func sendAppActivatedEvent(app: NSRunningApplication) {
        let appInfo = AppInfo.fromNS(app, includeIcon: includeAppIcon)
        let eventData: [String: Any] = ["app": appInfo.toDictionary()]
        sendEvent(type: EventType.appActivated, data: eventData)
    }

    /// Send WindowChanged event if window is valid. Returns true if sent.
    @discardableResult
    private func sendWindowChangedEvent() -> Bool {
        guard currentPID != 0 else { return false }

        let windowInfo = WindowInfo.fromPID(
            currentPID,
            includeAppIcon: includeAppIcon,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )

        // Skip if no valid window (no window ID means window not ready yet)
        guard let windowId = windowInfo.windowId, windowId != 0 else {
            return false
        }

        // Deduplicate: only send if window ID or title changed
        if lastWindowId == windowId, lastWindowTitle == windowInfo.title {
            return false
        }

        lastWindowId = windowId
        lastWindowTitle = windowInfo.title
        sendEvent(
            type: EventType.windowChanged,
            data: windowInfo.toDictionary() as [String: Any]
        )
        return true
    }

    private func sendEvent(type: String, data: [String: Any]) {
        let event: [String: Any] = ["type": type, "data": data]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: event),
            let jsonString = String(data: jsonData, encoding: .utf8)
        else {
            Log.warn("Failed to serialize \(type) event to JSON")
            return
        }

        let srJson = SRString(jsonString)
        withUnsafePointer(to: srJson) { callback($0) }
    }

    private func resetDeduplication() {
        lastWindowId = nil
        lastWindowTitle = nil
    }
}

// MARK: - C Callback

/// C callback registered with AXObserverCreate. Runs on monitor thread's run loop.
/// Note: refcon contains WindowMonitor instance (passed via context in AXObserverAddNotification).
private func axCallback(
    observer: AXObserver,
    element: AXUIElement,
    notification: CFString,
    refcon: UnsafeMutableRawPointer?
) {
    guard let refcon = refcon else { return }

    let monitor = Unmanaged<WindowMonitor>.fromOpaque(refcon)
        .takeUnretainedValue()

    // Handle focus change separately to re-register title observer on new window
    if CFEqual(notification, kAXFocusedWindowChangedNotification as CFString) {
        monitor.handleFocusChange(observer: observer)
    }

    monitor.handleWindowChange()
}

// MARK: - Types

typealias WindowEventCallback = @convention(c) (UnsafePointer<SRString>) -> Void

private enum EventType {
    static let appActivated = "AppActivated"
    static let windowChanged = "WindowChanged"
}
