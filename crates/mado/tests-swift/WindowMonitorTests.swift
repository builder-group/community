import Foundation
import XCTest

@testable import Mado

final class WindowMonitorTests: XCTestCase {
    func testStoppingMonitorPreservesEnclosingRunLoop() {
        let completed = expectation(description: "Enclosing run loop preserved")
        Thread.detachNewThread {
            let runLoop = CFRunLoopGetCurrent()
            let hostMode = CFRunLoopMode("MadoTestHostMode" as CFString)
            let hostTimer = CFRunLoopTimerCreateWithHandler(
                kCFAllocatorDefault, CFAbsoluteTimeGetCurrent() + 60, 60, 0, 0
            ) { _ in }
            CFRunLoopAddTimer(runLoop, hostTimer, hostMode)
            defer { CFRunLoopTimerInvalidate(hostTimer) }

            for externalStop in [false, true] {
                CFRunLoopPerformBlock(runLoop, hostMode.rawValue) {
                    let monitor = WindowMonitor(
                        callback: { _ in },
                        trackWindowChanges: false,
                        trackWindowBoundsChanges: false,
                        includeAppIcon: false,
                        includeAppColor: false,
                        includeBrowserInfo: false,
                        includeWebsiteInfo: false,
                        reconcileIntervalMs: 20
                    )
                    if externalStop {
                        CFRunLoopPerformBlock(runLoop, CFRunLoopMode.defaultMode.rawValue) {
                            CFRunLoopStop(runLoop)
                        }
                    } else {
                        monitor.stop()
                    }
                    monitor.start()
                }
                XCTAssertEqual(CFRunLoopRunInMode(hostMode, 0.02, false), .timedOut)
            }
            completed.fulfill()
        }
        wait(for: [completed], timeout: 5)
    }

    func testExternalRunLoopStopRemovesMonitorSources() {
        let stopped = expectation(description: "Monitor cleaned up")
        Thread.detachNewThread {
            let runLoop = CFRunLoopGetCurrent()
            let monitor = WindowMonitor(
                callback: { _ in },
                trackWindowChanges: false,
                trackWindowBoundsChanges: false,
                includeAppIcon: false,
                includeAppColor: false,
                includeBrowserInfo: false,
                includeWebsiteInfo: false,
                reconcileIntervalMs: 20
            )
            CFRunLoopPerformBlock(runLoop, CFRunLoopMode.defaultMode.rawValue) {
                CFRunLoopStop(runLoop)
            }
            monitor.start()

            XCTAssertEqual(CFRunLoopRunInMode(.defaultMode, 0.1, false), .finished)
            stopped.fulfill()
        }
        wait(for: [stopped], timeout: 5)
    }

    func testRefreshAndStopFromAnotherThreadAllowRestart() {
        XCTAssertFalse(madoRefreshMonitor())
        XCTAssertFalse(madoStopMonitor())
        for _ in 0..<2 {
            let ready = expectation(description: "Monitor created")
            let stopped = expectation(description: "Monitor stopped")
            Thread.detachNewThread {
                let monitor = WindowMonitor(
                    callback: { _ in },
                    trackWindowChanges: false,
                    trackWindowBoundsChanges: false,
                    includeAppIcon: false,
                    includeAppColor: false,
                    includeBrowserInfo: false,
                    includeWebsiteInfo: false,
                    reconcileIntervalMs: 20
                )
                WindowMonitor.shared = monitor
                ready.fulfill()
                monitor.start()
                WindowMonitor.shared = nil
                stopped.fulfill()
            }

            wait(for: [ready], timeout: 5)
            let monitor = WindowMonitor.shared
            XCTAssertNotNil(monitor)
            XCTAssertTrue(madoRefreshMonitor())
            XCTAssertTrue(madoStopMonitor())
            wait(for: [stopped], timeout: 5)
            XCTAssertNil(WindowMonitor.shared)
            XCTAssertFalse(madoRefreshMonitor())
            XCTAssertFalse(madoStopMonitor())
        }
    }
}
