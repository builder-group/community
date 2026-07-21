import XCTest

@testable import Mado

final class SupportedBrowsersTests: XCTestCase {
    func testMapsSupportedBrowsersToTheirExtractionFamily() {
        XCTAssertEqual(
            SupportedBrowsers.family(for: "net.imput.helium"),
            .chromium
        )
        XCTAssertEqual(
            SupportedBrowsers.family(for: "com.apple.Safari"),
            .safari
        )
        XCTAssertEqual(
            SupportedBrowsers.family(for: "org.mozilla.firefox"),
            .firefox
        )
    }

    func testRejectsUnknownBundleIdentifier() {
        XCTAssertNil(SupportedBrowsers.family(for: "com.example.browser"))
    }

    func testMatchesBundleIdentifierCaseInsensitively() {
        XCTAssertEqual(
            SupportedBrowsers.family(for: "COM.APPLE.SAFARI"),
            .safari
        )
    }
}
