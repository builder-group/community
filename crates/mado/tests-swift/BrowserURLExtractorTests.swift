import XCTest

@testable import Mado

final class BrowserURLExtractorTests: XCTestCase {
    func testDocumentURLTakesPrecedenceWithoutReadingAddressBar() {
        for family: BrowserFamily in [.chromium, .safari, .gecko] {
            let url = BrowserURLExtractor.resolveURL(
                family: family, documentURL: "https://example.com/articles"
            ) {
                XCTFail("A document URL should avoid address-bar queries")
                return ("https://example.org", true)
            }
            XCTAssertEqual(url, "https://example.com/articles")
        }
    }

    func testSafariRequiresDocumentURL() {
        XCTAssertNil(BrowserURLExtractor.resolveURL(family: .safari, documentURL: nil) {
            XCTFail("Safari must not query its shortened address as a fallback")
            return ("example.com", false)
        })
    }

    func testFallbackRequiresKnownUnfocusedAddressBar() {
        for family: BrowserFamily in [.chromium, .gecko] {
            for focused: Bool? in [true, nil] {
                XCTAssertNil(BrowserURLExtractor.resolveURL(family: family, documentURL: nil) {
                    ("https://example.com", focused)
                })
            }
            XCTAssertNil(BrowserURLExtractor.resolveURL(family: family, documentURL: nil) { nil })
        }
    }

    func testFallbackNormalizesURLsAndRejectsMissingOrSearchText() {
        let cases: [(String?, String?)] = [
            (" https://example.com/path?q=1 ", "https://example.com/path?q=1"),
            ("example.com/path", "https://example.com/path"),
            ("about:blank", "about:blank"),
            ("file:///tmp/page.html", "file:///tmp/page.html"),
            (nil, nil), ("", nil), ("   ", nil), ("search for example.com", nil),
        ]
        for family: BrowserFamily in [.chromium, .gecko] {
            for (value, expected) in cases {
                XCTAssertEqual(
                    BrowserURLExtractor.resolveURL(family: family, documentURL: nil) {
                        (value, false)
                    }, expected)
            }
        }
    }
}
