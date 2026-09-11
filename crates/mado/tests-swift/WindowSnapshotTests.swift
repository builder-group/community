import XCTest

@testable import Mado

final class WindowSnapshotTests: XCTestCase {
    func testContentGeometryChangesWithoutNavigationAreObservable() {
        XCTAssertNotEqual(snapshot(contentWidth: 800), snapshot(contentWidth: 600))
        XCTAssertEqual(snapshot(contentWidth: 800), snapshot(contentWidth: 800))
    }

    func testLateWindowIdentityAndMissingBrowserInformationAreObservable() {
        XCTAssertNotEqual(snapshot(windowId: nil), snapshot(windowId: 42))
        XCTAssertNotEqual(snapshot(url: nil), snapshot(url: "https://example.com"))
        XCTAssertNotEqual(
            snapshot(url: "https://example.com/a"), snapshot(url: "https://example.com/b"))
    }

    private func snapshot(
        windowId: UInt32? = 42, url: String? = "https://example.com",
        contentWidth: Double = 800
    ) -> WindowSnapshot {
        return WindowSnapshot(
            WindowInfo(
                title: "Unchanged title", windowId: windowId,
                bounds: ["x": 0, "y": 0, "width": 800, "height": 600],
                app: AppInfo(
                    pid: 1, name: "Browser", bundleId: "com.example.browser",
                    processPath: nil, icon: nil),
                browser: BrowserInfo(
                    url: url,
                    contentBounds: ["x": 0, "y": 80, "width": contentWidth, "height": 520],
                    isPrivate: false, website: nil)
            ))
    }
}
