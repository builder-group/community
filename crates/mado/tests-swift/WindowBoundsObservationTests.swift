import XCTest

@testable import Mado

final class WindowBoundsObservationTests: XCTestCase {
    func testNotificationAndReconciliationShareBoundsWithoutSuppressingLaterChanges() {
        var observation = WindowBoundsObservation()
        let initial = ["x": 0.0, "y": 0.0, "width": 800.0, "height": 600.0]
        let moved = ["x": 100.0, "y": 0.0, "width": 800.0, "height": 600.0]

        XCTAssertTrue(observation.update(windowId: 42, bounds: initial))
        XCTAssertTrue(observation.update(windowId: 42, bounds: moved))
        // Note: Repeated AX notifications and the following reconciliation read the same frame
        XCTAssertFalse(observation.update(windowId: 42, bounds: moved))
        XCTAssertFalse(observation.update(windowId: 42, bounds: moved))
        XCTAssertTrue(observation.update(windowId: 42, bounds: initial))
        XCTAssertFalse(observation.update(windowId: 42, bounds: initial))

        var otherWindow = WindowBoundsObservation()
        XCTAssertTrue(otherWindow.update(windowId: 43, bounds: initial))
        // Note: Refresh clears emitted state without requiring a geometry change
        observation = WindowBoundsObservation()
        XCTAssertTrue(observation.update(windowId: 42, bounds: initial))
        XCTAssertFalse(observation.update(windowId: 42, bounds: initial))
    }

    func testMissingBoundsAndLateIdentityRemainObservable() {
        var observation = WindowBoundsObservation()
        XCTAssertTrue(observation.update(windowId: nil, bounds: nil))
        XCTAssertFalse(observation.update(windowId: nil, bounds: nil))
        XCTAssertTrue(observation.update(windowId: 42, bounds: nil))
        XCTAssertTrue(observation.update(windowId: 42, bounds: ["width": 800]))
        XCTAssertTrue(observation.update(windowId: 42, bounds: nil))
        XCTAssertFalse(observation.update(windowId: 42, bounds: nil))
    }
}
