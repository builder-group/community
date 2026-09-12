import XCTest

@testable import Mado

final class BrowserURLExtractorTests: XCTestCase {
    func testDocumentURLTakesPrecedenceWithoutReadingAddressBar() {
        let url = BrowserURLExtractor.resolveURL(documentURL: "https://example.com/articles") {
            XCTFail("A document URL should avoid address-bar queries")
            return ("https://example.org", true)
        }
        XCTAssertEqual(url, "https://example.com/articles")
    }

    func testFallbackRequiresKnownUnfocusedAddressBar() {
        for focused: Bool? in [true, nil] {
            XCTAssertNil(BrowserURLExtractor.resolveURL(documentURL: nil) {
                ("https://example.com", focused)
            })
        }
        XCTAssertNil(BrowserURLExtractor.resolveURL(documentURL: nil) { nil })
    }

    func testFallbackNormalizesURLsAndRejectsMissingOrSearchText() {
        let cases: [(String?, String?)] = [
            (" https://example.com/path?q=1 ", "https://example.com/path?q=1"),
            ("example.com/path", "https://example.com/path"),
            ("about:blank", "about:blank"),
            ("file:///tmp/page.html", "file:///tmp/page.html"),
            (nil, nil), ("", nil), ("   ", nil), ("search for example.com", nil),
        ]
        for (value, expected) in cases {
            XCTAssertEqual(
                BrowserURLExtractor.resolveURL(documentURL: nil) {
                    (value, false)
                }, expected)
        }
    }
}
