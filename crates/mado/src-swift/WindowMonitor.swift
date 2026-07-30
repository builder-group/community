import AppKit
import ApplicationServices
import Foundation
import SwiftRs

/// Monitors active app, focused-window, and window bounds events using NSWorkspace
/// and Accessibility API.
///
/// Threading model:
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
    private let trackWindowBoundsChanges: Bool
    private let includeAppIcon: Bool
    private let includeAppColor: Bool
    private let includeBrowserInfo: Bool
    private let includeWebsiteInfo: Bool

    private var isRunning = false
    private var monitorRunLoop: CFRunLoop?

    private var appActivationObserver: NSObjectProtocol?
    private var appTerminationObserver: NSObjectProtocol?
    private var observedAppPIDs: Set<pid_t> = []

    // Accessibility observer state
    private var axObservers: [AXObserver] = []
    private var currentPID: pid_t = 0
    private var currentObservedWindow: ObservedWindow?
    private var hasPendingAppNotificationRegistration = false
    private var hasPendingWindowObservation = false

    // Polling state for delayed Accessibility notifications, windows and browser information.
    // Some apps cannot register notifications immediately after activation.
    // Apps launched from Dock/Spotlight can take seconds to show their window.
    // Browsers can take time to expose URL information after a window change.
    // Exponential backoff: 200ms → 400ms → 800ms → 1.6s (capped)
    private var pollingTimer: CFRunLoopTimer?
    private var pollingReason: WindowPollingReason?
    private var pollingRetryCount: UInt32 = 0
    private let baseDelay: Double = 0.2
    private let maxDelay: Double = 1.6

    // Deduplication for monitor events.
    private var lastWindowId: UInt32?
    private var lastWindowTitle: String?
    private var lastWindowBrowserURL: String?
    private var lastBoundsChangeWindowId: UInt32?
    private var lastBoundsChange: [String: Double]?

    private var keepAliveSource: CFRunLoopSource?

    init(
        callback: @escaping WindowEventCallback,
        trackWindowChanges: Bool,
        trackWindowBoundsChanges: Bool,
        includeAppIcon: Bool,
        includeAppColor: Bool,
        includeBrowserInfo: Bool,
        includeWebsiteInfo: Bool
    ) {
        self.callback = callback
        self.trackWindowChanges = trackWindowChanges
        self.trackWindowBoundsChanges = trackWindowBoundsChanges
        self.includeAppIcon = includeAppIcon
        self.includeAppColor = includeAppColor
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
        setupAppTerminationObserver()

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

        if let observer = appActivationObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(observer)
        }
        appActivationObserver = nil
        if let observer = appTerminationObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(observer)
        }
        appTerminationObserver = nil
        observedAppPIDs.removeAll()

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
    /// The AXObserver source is only added when window or bounds tracking is enabled.
    /// NSWorkspace notifications are forwarded via CFRunLoopPerformBlock, which doesn't
    /// count as a source. Without this, the monitor thread exits immediately.
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

        if let source = CFRunLoopSourceCreate(kCFAllocatorDefault, 0, &context)
        {
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

    // MARK: - App Lifecycle

    /// NSWorkspace notifications arrive on main thread, forwarded to monitor thread via CFRunLoop.
    ///
    /// CFRunLoopPerformBlock ensures state mutations happen on monitor thread, preventing
    /// race conditions when monitor.run() is called from a spawned thread.
    private func setupAppActivationObserver() {
        appActivationObserver = NSWorkspace.shared.notificationCenter
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

    private func setupAppTerminationObserver() {
        appTerminationObserver = NSWorkspace.shared.notificationCenter
            .addObserver(
                forName: NSWorkspace.didTerminateApplicationNotification,
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
                    self?.handleAppTermination(
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

        observedAppPIDs.insert(pid)

        cleanupAccessibilityObservers()
        stopWindowPolling()
        resetDeduplication()

        currentPID = pid
        sendAppActivatedEvent(app: app)

        guard trackWindowChanges || trackWindowBoundsChanges else { return }

        setupAccessibilityObserver(pid: pid)

        let windowInfo = trackWindowChanges ? sendWindowChangedEvent() : nil
        if let reason = requiredPollingReason(for: windowInfo) {
            startWindowPolling(for: reason)
        }
    }

    private func handleAppTermination(app: NSRunningApplication, pid: pid_t) {
        guard observedAppPIDs.remove(pid) != nil else { return }

        sendAppTerminatedEvent(app: app)
        guard pid == currentPID else { return }

        stopWindowPolling()
        cleanupAccessibilityObservers()
        resetDeduplication()
    }

    // MARK: - Accessibility Observers

    /// Set up accessibility observer for app. Callbacks are delivered to the monitor thread's run loop.
    private func setupAccessibilityObserver(pid: pid_t) {
        var observer: AXObserver?
        guard AXObserverCreate(pid, axCallback, &observer) == .success,
            let observer = observer
        else {
            Log.warn("Failed to create AXObserver for PID \(pid)")
            return
        }

        registerAppNotifications(observer: observer, pid: pid)
        registerWindowObservers(observer: observer, pid: pid)

        if let runLoop = monitorRunLoop {
            CFRunLoopAddSource(
                runLoop,
                AXObserverGetRunLoopSource(observer),
                .defaultMode
            )
        }

        axObservers.append(observer)
    }

    private func registerAppNotifications(
        observer: AXObserver,
        pid: pid_t
    ) {
        let app = AXUIElementCreateApplication(pid)
        let context = Unmanaged.passUnretained(self).toOpaque()
        var registrationResults = [
            AXObserverAddNotification(
                observer,
                app,
                kAXFocusedWindowChangedNotification as CFString,
                context
            )
        ]
        if trackWindowChanges {
            // Note: Minimize/restore are registered on the app, then filtered by the affected window element
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    app,
                    kAXWindowMiniaturizedNotification as CFString,
                    context
                )
            )
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    app,
                    kAXWindowDeminiaturizedNotification as CFString,
                    context
                )
            )
        }

        // Note: .cannotComplete can be transient during app launch, so it keeps polling active
        hasPendingAppNotificationRegistration = registrationResults.contains(
            .cannotComplete
        )
    }

    /// Re-register observers tied to the currently focused window.
    private func registerWindowObservers(observer: AXObserver, pid: pid_t) {
        let app = AXUIElementCreateApplication(pid)

        guard let windowElement = getFocusedWindow(from: app) else {
            hasPendingWindowObservation = true
            // Note: Keep the last observed window registered because minimize/close can temporarily leave no focused window
            return
        }

        if let previousWindow = currentObservedWindow?.element {
            AXObserverRemoveNotification(
                observer,
                previousWindow,
                kAXTitleChangedNotification as CFString
            )
            AXObserverRemoveNotification(
                observer,
                previousWindow,
                kAXUIElementDestroyedNotification as CFString
            )
            AXObserverRemoveNotification(
                observer,
                previousWindow,
                kAXMovedNotification as CFString
            )
            AXObserverRemoveNotification(
                observer,
                previousWindow,
                kAXResizedNotification as CFString
            )
        }

        let observedWindow = ObservedWindow(
            element: windowElement,
            windowId: findWindowId(
                pid: pid,
                bounds: getBounds(from: windowElement)
            ),
            app: AppInfo.fromPID(pid)
        )

        let context = Unmanaged.passUnretained(self).toOpaque()
        var registrationResults: [AXError] = []
        if trackWindowChanges {
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXTitleChangedNotification as CFString,
                    context
                )
            )
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXUIElementDestroyedNotification as CFString,
                    context
                )
            )
        }
        if trackWindowBoundsChanges {
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXMovedNotification as CFString,
                    context
                )
            )
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXResizedNotification as CFString,
                    context
                )
            )
        }
        currentObservedWindow = observedWindow
        hasPendingWindowObservation = registrationResults.contains(
            .cannotComplete
        )
    }

    private func cleanupAccessibilityObservers() {
        if let runLoop = monitorRunLoop {
            // Remove run loop sources (stops all notifications)
            for observer in axObservers {
                CFRunLoopRemoveSource(
                    runLoop,
                    AXObserverGetRunLoopSource(observer),
                    .defaultMode
                )
            }
        }

        axObservers.removeAll()
        currentObservedWindow = nil
        hasPendingAppNotificationRegistration = false
        hasPendingWindowObservation = false
        currentPID = 0
    }

    /// Called by axCallback when the focused window changes. Runs on monitor thread.
    fileprivate func handleFocusedWindowChanged(observer: AXObserver) {
        registerWindowObservers(observer: observer, pid: currentPID)
        handleWindowChange()
    }

    /// Called by axCallback on any window change. Runs on monitor thread.
    fileprivate func handleWindowChange() {
        stopWindowPolling()
        let windowInfo = trackWindowChanges ? sendWindowChangedEvent() : nil
        if let reason = requiredPollingReason(for: windowInfo) {
            startWindowPolling(for: reason)
        }
    }

    /// Called by axCallback when the focused window moves or resizes. Runs on monitor thread.
    fileprivate func handleWindowBoundsChange() {
        guard trackWindowBoundsChanges else { return }
        _ = sendWindowBoundsChangedEvent()
    }

    fileprivate func handleWindowLifecycleChange(
        type: String,
        element: AXUIElement
    ) {
        guard trackWindowChanges else { return }

        guard
            let observedWindow = currentObservedWindow,
            CFEqual(element, observedWindow.element)
        else {
            return
        }

        sendEvent(
            type: type,
            data: observedWindow.toLifecycleChangeDictionary() as [String: Any]
        )

        if type == EventType.windowDestroyed {
            currentObservedWindow = nil
        }
        handleWindowChange()
    }

    // MARK: - Window Polling

    private func startWindowPolling(for reason: WindowPollingReason) {
        stopWindowPolling()
        pollingReason = reason
        pollingRetryCount = 0
        scheduleNextWindowPoll()
    }

    private func scheduleNextWindowPoll() {
        guard let pollingReason, let runLoop = monitorRunLoop else {
            stopWindowPolling()
            return
        }
        guard pollingRetryCount < pollingReason.maxRetries else {
            stopWindowPolling()
            return
        }

        if let oldTimer = pollingTimer {
            CFRunLoopTimerInvalidate(oldTimer)
            pollingTimer = nil
        }

        pollingRetryCount += 1

        let delay = min(
            baseDelay * pow(2.0, Double(pollingRetryCount - 1)),
            maxDelay
        )
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
        guard currentPID != 0, let currentReason = pollingReason else {
            stopWindowPolling()
            return
        }

        // Note: Stop when the app loses focus because a later activation starts a new poll
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication,
            frontmostApp.processIdentifier == currentPID
        else {
            stopWindowPolling()
            return
        }

        if axObservers.isEmpty {
            setupAccessibilityObserver(pid: currentPID)
        } else if let observer = axObservers.first {
            let appNotificationsWerePending =
                hasPendingAppNotificationRegistration

            if appNotificationsWerePending {
                registerAppNotifications(observer: observer, pid: currentPID)
            }

            if appNotificationsWerePending
                || currentReason == .windowUnavailable
                || hasPendingWindowObservation
                || currentObservedWindow == nil
            {
                registerWindowObservers(observer: observer, pid: currentPID)
            }
        }

        let windowInfo = trackWindowChanges ? sendWindowChangedEvent() : nil

        guard let nextReason = requiredPollingReason(for: windowInfo) else {
            stopWindowPolling()
            return
        }

        if nextReason == currentReason {
            scheduleNextWindowPoll()
        } else {
            startWindowPolling(for: nextReason)
        }
    }

    private func stopWindowPolling() {
        if let timer = pollingTimer {
            CFRunLoopTimerInvalidate(timer)
            pollingTimer = nil
        }
        pollingRetryCount = 0
        pollingReason = nil
    }

    // MARK: - Events

    private func sendAppActivatedEvent(app: NSRunningApplication) {
        let appInfo = AppInfo.fromNS(
            app,
            includeIcon: includeAppIcon,
            includeColor: includeAppColor
        )
        let eventData: [String: Any] = ["app": appInfo.toDictionary()]
        sendEvent(type: EventType.appActivated, data: eventData)
    }

    private func sendAppTerminatedEvent(app: NSRunningApplication) {
        let appInfo = AppInfo.fromNS(
            app,
            includeIcon: includeAppIcon,
            includeColor: includeAppColor
        )
        let eventData: [String: Any] = ["app": appInfo.toDictionary()]
        sendEvent(type: EventType.appTerminated, data: eventData)
    }

    /// Captures the focused window and emits it unless its observable identity is unchanged.
    private func sendWindowChangedEvent() -> WindowInfo? {
        guard currentPID != 0 else { return nil }

        let windowInfo = WindowInfo.fromPID(
            currentPID,
            includeAppIcon: includeAppIcon,
            includeAppColor: includeAppColor,
            includeBrowserInfo: includeBrowserInfo,
            includeWebsiteInfo: includeWebsiteInfo
        )

        guard let windowId = windowInfo.windowId, windowId != 0 else {
            return nil
        }

        let browserURL = windowInfo.browser?.url
        if lastWindowId == windowId,
            lastWindowTitle == windowInfo.title,
            lastWindowBrowserURL == browserURL
        {
            return windowInfo
        }

        lastWindowId = windowId
        lastWindowTitle = windowInfo.title
        lastWindowBrowserURL = browserURL
        sendEvent(
            type: EventType.windowChanged,
            data: windowInfo.toDictionary() as [String: Any]
        )
        return windowInfo
    }

    private func requiredPollingReason(for windowInfo: WindowInfo?)
        -> WindowPollingReason?
    {
        if hasPendingAppNotificationRegistration {
            return .appNotificationsUnavailable
        }
        if hasPendingWindowObservation || currentObservedWindow == nil {
            return .windowUnavailable
        }
        if trackWindowChanges, windowInfo == nil {
            return .windowUnavailable
        }
        if let windowInfo,
            currentObservedWindow?.windowId != windowInfo.windowId
        {
            return .windowUnavailable
        }
        if includeBrowserInfo,
            let windowInfo,
            let bundleId = windowInfo.app.bundleId,
            SupportedBrowsers.family(for: bundleId) != nil,
            windowInfo.browser == nil
        {
            return .browserInfoUnavailable
        }

        return nil
    }

    /// Send WindowBoundsChanged event if focused window bounds changed. Returns true if sent.
    @discardableResult
    private func sendWindowBoundsChangedEvent() -> Bool {
        guard currentPID != 0 else { return false }

        let windowInfo = WindowInfo.fromPID(
            currentPID,
            includeAppIcon: false,
            includeAppColor: false,
            includeBrowserInfo: false,
            includeWebsiteInfo: false
        )

        guard let windowId = windowInfo.windowId, windowId != 0 else {
            return false
        }

        if lastBoundsChangeWindowId == windowId,
            boundsEqual(lastBoundsChange, windowInfo.bounds)
        {
            return false
        }

        lastBoundsChangeWindowId = windowId
        lastBoundsChange = windowInfo.bounds
        var eventData: [String: Any] = [
            "windowId": windowId,
            "app": windowInfo.app.toDictionary(),
        ]
        eventData["bounds"] = windowInfo.bounds ?? NSNull()
        sendEvent(
            type: EventType.windowBoundsChanged,
            data: eventData
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
        lastWindowBrowserURL = nil
        lastBoundsChangeWindowId = nil
        lastBoundsChange = nil
    }
}

private func boundsEqual(_ lhs: [String: Double]?, _ rhs: [String: Double]?)
    -> Bool
{
    guard let lhs = lhs, let rhs = rhs else {
        return lhs == nil && rhs == nil
    }

    return lhs["x"] == rhs["x"]
        && lhs["y"] == rhs["y"]
        && lhs["width"] == rhs["width"]
        && lhs["height"] == rhs["height"]
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

    if CFEqual(notification, kAXFocusedWindowChangedNotification as CFString) {
        monitor.handleFocusedWindowChanged(observer: observer)
        return
    }

    if CFEqual(notification, kAXMovedNotification as CFString)
        || CFEqual(notification, kAXResizedNotification as CFString)
    {
        monitor.handleWindowBoundsChange()
        return
    }

    if CFEqual(notification, kAXWindowMiniaturizedNotification as CFString) {
        monitor.handleWindowLifecycleChange(
            type: EventType.windowMinimized,
            element: element
        )
        return
    }

    if CFEqual(notification, kAXWindowDeminiaturizedNotification as CFString) {
        monitor.handleWindowLifecycleChange(
            type: EventType.windowRestored,
            element: element
        )
        return
    }

    if CFEqual(notification, kAXUIElementDestroyedNotification as CFString) {
        monitor.handleWindowLifecycleChange(
            type: EventType.windowDestroyed,
            element: element
        )
        return
    }

    if CFEqual(notification, kAXTitleChangedNotification as CFString) {
        monitor.handleWindowChange()
    }
}

// MARK: - Types

typealias WindowEventCallback = @convention(c) (UnsafePointer<SRString>) -> Void

private struct ObservedWindow {
    let element: AXUIElement
    let windowId: UInt32?
    let app: AppInfo

    func toLifecycleChangeDictionary() -> [String: Any?] {
        return [
            "windowId": windowId,
            "app": app.toDictionary(),
        ]
    }
}

private enum WindowPollingReason: Equatable {
    case appNotificationsUnavailable
    case windowUnavailable
    case browserInfoUnavailable

    var maxRetries: UInt32 {
        switch self {
        case .appNotificationsUnavailable:
            // Allow ~30s for apps whose Accessibility notifications become available late
            return 21
        case .windowUnavailable:
            // Allow ~30s for apps that expose their first focused window late
            return 21
        case .browserInfoUnavailable:
            // Allow ~8s for late browser information because window changes restart polling
            return 7
        }
    }
}

private enum EventType {
    static let appActivated = "AppActivated"
    static let appTerminated = "AppTerminated"
    static let windowChanged = "WindowChanged"
    static let windowBoundsChanged = "WindowBoundsChanged"
    static let windowMinimized = "WindowMinimized"
    static let windowRestored = "WindowRestored"
    static let windowDestroyed = "WindowDestroyed"
}
