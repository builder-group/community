import AppKit
import XCTest

@testable import Mado

final class AppIconTests: XCTestCase {
    func testRejectsNonPositiveOutputSizeBeforeRendering() {
        let image = NSImage(size: NSSize(width: 32, height: 32))
        for size in [0, -1] {
            XCTAssertNil(image.pngData(size: size))
        }
    }
}
