import AppKit
import ApplicationServices
import Foundation
import SwiftRs

/// Observes app activity and windows discovered through focus.
///
/// Construct and start on the same thread, which owns observation state and delivers callbacks.
/// NSWorkspace notifications arrive on the main thread and are forwarded to this run loop.
/// Refresh and stop enqueue work from any thread.
final class WindowMonitor: NSObject {
    private static let instanceLock = NSLock()
    // Note: FFI calls can access shared from threads other than the monitor thread, so guard it with instanceLock
    nonisolated(unsafe) private static var instance: WindowMonitor?

    static var shared: WindowMonitor? {
        get {
            instanceLock.lock()
            defer { instanceLock.unlock() }
            return instance
        }
        set {
            instanceLock.lock()
            defer { instanceLock.unlock() }
            instance = newValue
        }
    }

    private let callback: WindowEventCallback
    private let trackWindowChanges: Bool
    private let trackWindowBoundsChanges: Bool
    private let includeAppIcon: Bool
    private let includeAppColor: Bool
    private let includeBrowserInfo: Bool
    private let includeWebsiteInfo: Bool
    private let reconcileInterval: TimeInterval
    private var reconcileTimer: CFRunLoopTimer?

    private var isRunning = false
    private let monitorRunLoop: CFRunLoop = CFRunLoopGetCurrent()

    private var appActivationObserver: NSObjectProtocol?
    private var appTerminationObserver: NSObjectProtocol?
    private var observedAppPIDs: Set<pid_t> = []

    // Accessibility observer state
    private var axObservers: [pid_t: AXObserver] = [:]
    private var currentPID: pid_t = 0
    private var currentWindowElement: AXUIElement?
    private var currentObservedWindow: ObservedWindow? {
        guard let currentWindowElement else { return nil }
        return windowObservations.first { CFEqual($0.window.element, currentWindowElement) }?.window
    }
    private var windowObservations: [WindowObservation] = []
    private var hasPendingAppNotificationRegistration = false
    private var hasPendingFocusedWindowObservation = false
    private var hasPendingWindowDestructionRegistration: Bool {
        return windowObservations.contains {
            $0.window.app.pid == currentPID && $0.hasPendingDestructionRegistration
        }
    }

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
    private var lastWindowSnapshot: WindowSnapshot?

    private var keepAliveSource: CFRunLoopSource?

    init(
        callback: @escaping WindowEventCallback,
        trackWindowChanges: Bool,
        trackWindowBoundsChanges: Bool,
        includeAppIcon: Bool,
        includeAppColor: Bool,
        includeBrowserInfo: Bool,
        includeWebsiteInfo: Bool,
        reconcileIntervalMs: UInt32
    ) {
        self.callback = callback
        self.trackWindowChanges = trackWindowChanges
        self.trackWindowBoundsChanges = trackWindowBoundsChanges
        self.includeAppIcon = includeAppIcon
        self.includeAppColor = includeAppColor
        self.includeBrowserInfo = includeBrowserInfo
        self.includeWebsiteInfo = includeWebsiteInfo
        self.reconcileInterval = Double(reconcileIntervalMs) / 1000
    }

    // MARK: - Lifecycle

    /// Start monitoring. Blocks forever until stop() is called.
    func start() {
        guard !isRunning else { return }
        isRunning = true

        setupRunLoopKeepAlive()
        setupAppActivationObserver()
        setupAppTerminationObserver()
        setupReconciliation()

        if let app = NSWorkspace.shared.frontmostApplication {
            handleAppActivation(app: app, pid: app.processIdentifier)
        }

        // Note: Blocks until CFRunLoopStop() is called from stop()
        CFRunLoopRun()

        if isRunning {
            Log.warn("Monitor run loop exited unexpectedly")
            // Note: Only clean up after the monitor's run loop returns to avoid stopping an enclosing host loop
            cleanup()
        }
    }

    func refresh() {
        let runLoop = monitorRunLoop
        CFRunLoopPerformBlock(runLoop, CFRunLoopMode.defaultMode.rawValue) { [weak self] in
            guard let self, self.isRunning else { return }
            self.resetDeduplication()
            for index in self.windowObservations.indices {
                self.windowObservations[index].snapshot = nil
                self.windowObservations[index].bounds = WindowBoundsObservation()
            }
            if let app = NSWorkspace.shared.frontmostApplication,
                app.processIdentifier == self.currentPID
            {
                self.sendAppActivatedEvent(app: app)
            }
            self.reconcileWindows()
        }
        CFRunLoopWakeUp(runLoop)
    }

    func stop() {
        // Note: Stop can arrive from any thread, so teardown runs on the monitor thread
        CFRunLoopPerformBlock(monitorRunLoop, CFRunLoopMode.defaultMode.rawValue) { [weak self] in
            self?.stopOnMonitorThread()
        }
        CFRunLoopWakeUp(monitorRunLoop)
    }

    private func stopOnMonitorThread() {
        guard isRunning else { return }
        cleanup()
        CFRunLoopStop(monitorRunLoop)
    }

    private func cleanup() {
        isRunning = false

        stopWindowPolling()
        if let reconcileTimer { CFRunLoopTimerInvalidate(reconcileTimer) }
        reconcileTimer = nil
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
        let runLoop = monitorRunLoop

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
        if let source = keepAliveSource {
            CFRunLoopRemoveSource(monitorRunLoop, source, .defaultMode)
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
                // Note: Only the immutable run-loop reference is read here.
                // The queued block accesses monitor state on its owning thread.
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
                // Note: Only the immutable run-loop reference is read here.
                // The queued block accesses monitor state on its owning thread.
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
        guard isRunning, pid != currentPID else { return }

        observedAppPIDs.insert(pid)

        stopWindowPolling()
        resetDeduplication()
        currentWindowElement = nil
        hasPendingAppNotificationRegistration = false
        hasPendingFocusedWindowObservation = false

        currentPID = pid
        sendAppActivatedEvent(app: app)

        guard trackWindowChanges || trackWindowBoundsChanges else { return }

        guard AXIsProcessTrusted() else { return }
        if let observer = axObservers[pid] {
            registerAppNotifications(observer: observer, pid: pid)
            registerWindowObservers(observer: observer, pid: pid)
        } else {
            setupAccessibilityObserver(pid: pid)
        }

        let windowInfo = trackWindowChanges ? sendWindowChangedEvent() : nil
        if let reason = requiredPollingReason(for: windowInfo) {
            startWindowPolling(for: reason)
        }
    }

    private func handleAppTermination(app: NSRunningApplication, pid: pid_t) {
        guard isRunning, observedAppPIDs.remove(pid) != nil else { return }

        sendAppTerminatedEvent(app: app)
        if let observer = axObservers.removeValue(forKey: pid) {
            CFRunLoopRemoveSource(
                monitorRunLoop, AXObserverGetRunLoopSource(observer), .defaultMode)
        }
        windowObservations.removeAll { $0.window.app.pid == pid }
        guard pid == currentPID else { return }
        stopWindowPolling()
        currentWindowElement = nil
        currentPID = 0
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

        CFRunLoopAddSource(monitorRunLoop, AXObserverGetRunLoopSource(observer), .defaultMode)

        axObservers[pid] = observer
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
        retryPendingWindowDestructionObservers(observer: observer, pid: pid)

        let app = AXUIElementCreateApplication(pid)

        guard let windowElement = getFocusedWindow(from: app) else {
            hasPendingFocusedWindowObservation = true
            // Note: Keep the last observed window registered because minimize/close can temporarily leave no focused window
            return
        }

        // Note: Focus discovers windows, but observations live until destruction or app termination
        let appInfo = AppInfo.fromPID(
            pid, includeIcon: includeAppIcon, includeColor: includeAppColor)
        let isBrowser =
            trackWindowChanges && includeBrowserInfo
            && appInfo.bundleId.flatMap { SupportedBrowsers.kind(for: $0) } != nil
        let observedWindow = ObservedWindow(
            element: windowElement,
            windowId: findWindowId(
                pid: pid,
                bounds: getBounds(from: windowElement)
            ),
            app: appInfo,
            addressBar: isBrowser ? appInfo.bundleId.flatMap {
                BrowserInfo.findAddressBar(bundleId: $0, in: windowElement)
            } : nil
        )

        let context = Unmanaged.passUnretained(self).toOpaque()
        var registrationResults: [AXError] = []
        if trackWindowChanges {
            if let addressBar = observedWindow.addressBar {
                registrationResults.append(
                    AXObserverAddNotification(
                        observer, addressBar, kAXValueChangedNotification as CFString, context
                    )
                )
            }
            registrationResults.append(
                AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXTitleChangedNotification as CFString,
                    context
                )
            )

        }
        if trackWindowChanges || trackWindowBoundsChanges {
            if let observationIndex = windowObservations.firstIndex(
                where: { CFEqual($0.window.element, windowElement) }
            ) {
                if let previousBar = windowObservations[observationIndex].window
                    .addressBar,
                    observedWindow.addressBar.map({ CFEqual($0, previousBar) }) != true
                {
                    AXObserverRemoveNotification(
                        observer, previousBar, kAXValueChangedNotification as CFString
                    )
                }
                windowObservations[observationIndex].window =
                    observedWindow
            } else {
                let result = AXObserverAddNotification(
                    observer,
                    windowElement,
                    kAXUIElementDestroyedNotification as CFString,
                    context
                )
                windowObservations.append(
                    WindowObservation(
                        window: observedWindow,
                        hasPendingDestructionRegistration: result == .cannotComplete
                    )
                )
            }
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
        currentWindowElement = windowElement
        // Note: A browser can expose document URLs without an address bar,
        // so its absence is not a setup failure
        hasPendingFocusedWindowObservation = registrationResults.contains(.cannotComplete)
    }

    private func retryPendingWindowDestructionObservers(observer: AXObserver, pid: pid_t) {
        let context = Unmanaged.passUnretained(self).toOpaque()
        for index in windowObservations.indices.reversed()
        where windowObservations[index].window.app.pid == pid
            && windowObservations[index].hasPendingDestructionRegistration
        {
            let element = windowObservations[index].window.element
            let result = AXObserverAddNotification(
                observer,
                element,
                kAXUIElementDestroyedNotification as CFString,
                context
            )
            switch result {
            case .success, .notificationAlreadyRegistered:
                windowObservations[index]
                    .hasPendingDestructionRegistration = false
            case .cannotComplete:
                break
            case .invalidUIElement:
                windowObservations.remove(at: index)
            default:
                // Note: Unsupported destruction notifications must not discard content/bounds tracking
                windowObservations[index].hasPendingDestructionRegistration = false
            }
        }
    }

    private func cleanupAccessibilityObservers() {
        for observer in axObservers.values {
            CFRunLoopRemoveSource(
                monitorRunLoop, AXObserverGetRunLoopSource(observer), .defaultMode)
        }

        axObservers.removeAll()
        currentWindowElement = nil
        windowObservations.removeAll()
        hasPendingAppNotificationRegistration = false
        hasPendingFocusedWindowObservation = false
        currentPID = 0
    }

    /// Called by axCallback when the focused window changes. Runs on monitor thread.
    fileprivate func handleFocusedWindowChanged(observer: AXObserver) {
        guard axObservers[currentPID] === observer else { return }
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

    /// Called by axCallback when an observed window moves or resizes. Runs on monitor thread.
    fileprivate func handleWindowBoundsChange(element: AXUIElement) {
        guard trackWindowBoundsChanges,
            let index = windowObservations.firstIndex(where: {
                CFEqual($0.window.element, element)
            })
        else { return }
        sendWindowBoundsChangedEvent(at: index, bounds: getBounds(from: element))
    }

    fileprivate func handleWindowTitleChange(element: AXUIElement) {
        if currentObservedWindow.map({ CFEqual($0.element, element) }) == true {
            handleWindowChange()
        } else {
            sendBackgroundWindowUpdate(element: element)
        }
    }

    fileprivate func handleBrowserValueChange(element: AXUIElement) {
        guard
            let observed = windowObservations.first(where: {
                $0.window.addressBar.map { CFEqual($0, element) } == true
            })?.window
        else { return }
        handleWindowTitleChange(element: observed.element)
    }

    private func sendBackgroundWindowUpdate(element: AXUIElement) {
        guard trackWindowChanges || trackWindowBoundsChanges,
            let index = windowObservations.firstIndex(where: {
                CFEqual($0.window.element, element)
            })
        else { return }
        let observed = windowObservations[index].window
        let window = WindowInfo.fromElement(
            element, app: observed.app, windowId: observed.windowId,
            bounds: getBounds(from: element),
            includeBrowserInfo: trackWindowChanges && includeBrowserInfo,
            includeWebsiteInfo: trackWindowChanges && includeWebsiteInfo)
        sendWindowBoundsChangedEvent(at: index, bounds: window.bounds)
        let snapshot = WindowSnapshot(window)
        let previousSnapshot = windowObservations[index].snapshot
        guard snapshot != previousSnapshot else { return }
        windowObservations[index].snapshot = snapshot
        if trackWindowChanges {
            sendEvent(type: EventType.windowUpdated, data: window.toDictionary() as [String: Any])
        }
    }

    fileprivate func handleWindowLifecycleChange(
        type: String,
        element: AXUIElement
    ) {
        // Note: Destruction can arrive after focus moves, so resolve it from retained observations
        if type == EventType.windowDestroyed {
            guard
                let index = windowObservations.firstIndex(
                    where: { CFEqual($0.window.element, element) }
                )
            else {
                return
            }

            let observedWindow = windowObservations[index].window
            let isCurrentWindow =
                currentObservedWindow.map {
                    CFEqual(element, $0.element)
                } ?? false

            if trackWindowChanges {
                sendEvent(
                    type: type, data: observedWindow.toLifecycleChangeDictionary() as [String: Any])
            }

            windowObservations.remove(at: index)
            if isCurrentWindow {
                currentWindowElement = nil
                handleWindowChange()
            }
            return
        }

        guard
            let observed = windowObservations.first(where: {
                CFEqual(element, $0.window.element)
            })?.window
        else { return }

        guard trackWindowChanges else { return }
        sendEvent(type: type, data: observed.toLifecycleChangeDictionary() as [String: Any])
        if currentObservedWindow.map({ CFEqual(element, $0.element) }) == true {
            handleWindowChange()
        } else if type == EventType.windowRestored {
            sendBackgroundWindowUpdate(element: element)
        }
    }

    // MARK: - Window Polling

    private func startWindowPolling(for reason: WindowPollingReason) {
        stopWindowPolling()
        pollingReason = reason
        pollingRetryCount = 0
        scheduleNextWindowPoll()
    }

    private func scheduleNextWindowPoll() {
        guard let pollingReason else {
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
        CFRunLoopAddTimer(monitorRunLoop, timer, .defaultMode)
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

        if axObservers[currentPID] == nil {
            setupAccessibilityObserver(pid: currentPID)
        } else if let observer = axObservers[currentPID] {
            if hasPendingAppNotificationRegistration {
                registerAppNotifications(observer: observer, pid: currentPID)
            }
            registerWindowObservers(observer: observer, pid: currentPID)
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

    // MARK: - Reconciliation

    private func setupReconciliation() {
        guard reconcileInterval > 0 else { return }
        let runLoop = monitorRunLoop
        let timer = CFRunLoopTimerCreateWithHandler(
            kCFAllocatorDefault,
            CFAbsoluteTimeGetCurrent() + reconcileInterval,
            reconcileInterval, 0, 0
        ) { [weak self] _ in
            self?.reconcileWindows()
        }
        CFRunLoopTimerSetTolerance(timer, reconcileInterval / 4)
        reconcileTimer = timer
        CFRunLoopAddTimer(runLoop, timer, .defaultMode)
    }

    private func reconcileWindows() {
        // Note: Resolve focus first so a missed focus notification cannot classify
        // the new foreground window as background
        reconcileForegroundWindow()

        // Note: Background navigation can change a visible page without changing focus
        if trackWindowChanges || trackWindowBoundsChanges, AXIsProcessTrusted(),
            let windows = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID)
                as? [[String: Any]]
        {
            // Note: On-screen windows can be fully covered by other windows
            let visibleIds = Set(
                windows.compactMap { ($0[kCGWindowNumber as String] as? NSNumber)?.uint32Value })
            for observed in windowObservations.map(\.window) {
                guard let id = observed.windowId, visibleIds.contains(id),
                    currentObservedWindow.map({ CFEqual($0.element, observed.element) }) != true
                else { continue }
                sendBackgroundWindowUpdate(element: observed.element)
            }
        }
    }

    private func reconcileForegroundWindow() {
        guard let app = NSWorkspace.shared.frontmostApplication else { return }
        if app.processIdentifier != currentPID {
            handleAppActivation(app: app, pid: app.processIdentifier)
            return
        }
        guard trackWindowChanges || trackWindowBoundsChanges,
            AXIsProcessTrusted()
        else { return }

        // Note: Recent content events do not replace this pass, which also recovers bounds and observer registration
        let snapshot =
            trackWindowChanges
            ? sendWindowChangedEvent()
            : WindowInfo.fromPID(currentPID)
        if axObservers[currentPID] == nil {
            setupAccessibilityObserver(pid: currentPID)
        } else if let observer = axObservers[currentPID] {
            if hasPendingAppNotificationRegistration {
                registerAppNotifications(observer: observer, pid: currentPID)
            }
            if currentObservedWindow == nil || hasPendingFocusedWindowObservation
                || hasPendingWindowDestructionRegistration
                || currentObservedWindow?.windowId != snapshot?.windowId
            {
                registerWindowObservers(observer: observer, pid: currentPID)
            }
        }
        if trackWindowBoundsChanges, let snapshot,
            let windowId = snapshot.windowId,
            let index = windowObservations.firstIndex(where: {
                $0.window.app.pid == currentPID && $0.window.windowId == windowId
            })
        {
            sendWindowBoundsChangedEvent(at: index, bounds: snapshot.bounds)
        }
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

        let snapshot = WindowSnapshot(windowInfo)
        if lastWindowSnapshot == snapshot { return windowInfo }
        lastWindowSnapshot = snapshot
        if let windowId = windowInfo.windowId,
            let index = windowObservations.firstIndex(where: {
                $0.window.app.pid == currentPID && $0.window.windowId == windowId
            })
        {
            windowObservations[index].snapshot = snapshot
        }
        sendEvent(
            type: EventType.windowChanged,
            data: windowInfo.toDictionary() as [String: Any]
        )
        return windowInfo
    }

    private func requiredPollingReason(for windowInfo: WindowInfo?)
        -> WindowPollingReason?
    {
        if hasPendingAppNotificationRegistration || hasPendingFocusedWindowObservation
            || hasPendingWindowDestructionRegistration
            || currentObservedWindow == nil
        {
            return .observationUnavailable
        }
        if trackWindowChanges, windowInfo == nil {
            return .observationUnavailable
        }
        if let windowInfo,
            currentObservedWindow?.windowId != windowInfo.windowId
        {
            return .observationUnavailable
        }
        if includeBrowserInfo,
            let windowInfo,
            let bundleId = windowInfo.app.bundleId,
            SupportedBrowsers.kind(for: bundleId) != nil,
            windowInfo.browser == nil
        {
            return .browserInfoUnavailable
        }

        return nil
    }

    private func sendWindowBoundsChangedEvent(at index: Int, bounds: [String: Double]?) {
        guard trackWindowBoundsChanges else { return }
        let observed = windowObservations[index].window
        // Note: Deduplicate bounds across notifications and reconciliation without suppressing separate content updates
        guard windowObservations[index].bounds.update(windowId: observed.windowId, bounds: bounds)
        else { return }
        sendEvent(
            type: EventType.windowBoundsChanged,
            data: [
                "app": observed.app.toDictionary(),
                "windowId": observed.windowId.map { $0 as Any } ?? NSNull(),
                "bounds": bounds.map { $0 as Any } ?? NSNull(),
            ])
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
        lastWindowSnapshot = nil
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

    if CFEqual(notification, kAXFocusedWindowChangedNotification as CFString) {
        monitor.handleFocusedWindowChanged(observer: observer)
        return
    }

    if CFEqual(notification, kAXMovedNotification as CFString)
        || CFEqual(notification, kAXResizedNotification as CFString)
    {
        monitor.handleWindowBoundsChange(element: element)
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
        monitor.handleWindowTitleChange(element: element)
    }
    if CFEqual(notification, kAXValueChangedNotification as CFString) {
        monitor.handleBrowserValueChange(element: element)
    }
}

// MARK: - Types

typealias WindowEventCallback = @convention(c) (UnsafePointer<SRString>) -> Void

private struct ObservedWindow {
    let element: AXUIElement
    let windowId: UInt32?
    let app: AppInfo
    let addressBar: AXUIElement?

    func toLifecycleChangeDictionary() -> [String: Any?] {
        return [
            "windowId": windowId,
            "app": app.toDictionary(),
        ]
    }
}

private struct WindowObservation {
    var window: ObservedWindow
    var hasPendingDestructionRegistration: Bool
    var snapshot: WindowSnapshot? = nil
    var bounds = WindowBoundsObservation()
}

private enum WindowPollingReason: Equatable {
    case observationUnavailable
    case browserInfoUnavailable

    var maxRetries: UInt32 {
        switch self {
        case .observationUnavailable:
            // Note: Apps can expose their windows and notifications late after launch
            return 21
        case .browserInfoUnavailable:
            // Allow ~8s for late browser information because window changes restart polling
            return 7
        }
    }
}

private enum EventType {
    static let windowUpdated = "WindowUpdated"
    static let appActivated = "AppActivated"
    static let appTerminated = "AppTerminated"
    static let windowChanged = "WindowChanged"
    static let windowBoundsChanged = "WindowBoundsChanged"
    static let windowMinimized = "WindowMinimized"
    static let windowRestored = "WindowRestored"
    static let windowDestroyed = "WindowDestroyed"
}

struct WindowSnapshot: Equatable {
    let windowId: UInt32?
    let title: String?
    let browserURL: String?
    let bounds: [String: Double]?
    let browserContentBounds: [String: Double]?

    init(_ window: WindowInfo) {
        windowId = window.windowId
        title = window.title
        browserURL = window.browser?.url
        bounds = window.bounds
        browserContentBounds = window.browser?.contentBounds
    }
}

struct WindowBoundsObservation {
    private var lastEmitted: Snapshot?

    mutating func update(windowId: UInt32?, bounds: [String: Double]?) -> Bool {
        let snapshot = Snapshot(windowId: windowId, bounds: bounds)
        guard snapshot != lastEmitted else { return false }
        lastEmitted = snapshot
        return true
    }

    private struct Snapshot: Equatable {
        let windowId: UInt32?
        let bounds: [String: Double]?
    }
}
