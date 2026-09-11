import Foundation
import XCTest

@testable import Mado

final class WindowMonitorTests: XCTestCase {
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
