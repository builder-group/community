import XCTest

@testable import Mado

final class BrowserContentBoundsExtractorTests: XCTestCase {
    func testClipsDocumentToWindowWithoutAssumingPositiveScreenCoordinates() {
        let window = ["x": -1000.0, "y": -200.0, "width": 800.0, "height": 600.0]
        let document = ["x": -1100.0, "y": -120.0, "width": 1000.0, "height": 3000.0]
        XCTAssertEqual(
            BrowserContentBoundsExtractor.clamp(document, to: window),
            ["x": -1000.0, "y": -120.0, "width": 800.0, "height": 520.0])
    }

    func testRejectsDisjointAndZeroAreaContent() {
        let window = ["x": 0.0, "y": 0.0, "width": 800.0, "height": 600.0]
        for x in [800.0, 900.0] {
            XCTAssertNil(BrowserContentBoundsExtractor.clamp(
                ["x": x, "y": 0, "width": 100, "height": 100], to: window))
        }
        XCTAssertNil(BrowserContentBoundsExtractor.clamp(
            ["x": 0, "y": 0, "width": 0, "height": 100], to: window))
    }

    func testPreservesContentInsideWindowOrWithoutWindowBounds() {
        let content = ["x": 10.0, "y": 80.0, "width": 700.0, "height": 500.0]
        XCTAssertEqual(BrowserContentBoundsExtractor.clamp(content, to: nil), content)
        XCTAssertEqual(
            BrowserContentBoundsExtractor.clamp(
                content, to: ["x": 0, "y": 0, "width": 800, "height": 600]), content)
    }
}
