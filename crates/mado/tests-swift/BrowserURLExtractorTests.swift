import ApplicationServices
import XCTest

@testable import Mado

final class BrowserURLExtractorTests: XCTestCase {
    func testDocumentURLTakesPrecedenceWithoutReadingFallbacks() {
        for family: BrowserFamily in [.chromium, .safari, .gecko] {
            let url = BrowserURLExtractor.resolveURL(
                family: family, documentURL: "https://example.com/articles",
                isSafariStartPage: {
                    XCTFail("A document URL should avoid Start Page queries")
                    return true
                }
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

    func testSafariStartPageProducesKnownInternalURL() {
        XCTAssertEqual(
            BrowserURLExtractor.resolveURL(
                family: .safari, documentURL: nil, isSafariStartPage: { true }
            ) {
                XCTFail("The Start Page does not need an address-bar value")
                return nil
            }, "about:blank")
    }

    func testStartPageDetectionRejectsUnreadableSubtrees() {
        XCTAssertFalse(
            detectStartPage(branchAttribute: kAXChildrenAttribute, result: (.cannotComplete, nil)))
    }

    func testStartPageDetectionAcceptsLeavesWithoutChildAttributes() {
        XCTAssertTrue(
            detectStartPage(branchAttribute: kAXChildrenAttribute, result: (.attributeUnsupported, nil)))
    }

    func testStartPageDetectionRejectsWebDocumentsWithoutURLs() {
        XCTAssertFalse(
            detectStartPage(branchAttribute: kAXRoleAttribute, result: (.success, "AXWebArea" as CFString)))
    }

    private func detectStartPage(
        branchAttribute: String,
        result: (AXError, CFTypeRef?)
    ) -> Bool {
        let root = AXUIElementCreateApplication(1)
        let startPage = AXUIElementCreateApplication(2)
        let branch = AXUIElementCreateApplication(3)

        return BrowserURLExtractor.isSafariStartPage(in: root) { element, attribute in
            let attribute = attribute as String
            if CFEqual(element, branch), attribute == branchAttribute { return result }
            switch attribute {
            case kAXRoleAttribute:
                return (.success, (CFEqual(element, startPage) ? "AXList" : "AXGroup") as CFString)
            case kAXIdentifierAttribute where CFEqual(element, startPage):
                return (.success, "StartPageCollectionView" as CFString)
            case kAXChildrenAttribute where CFEqual(element, root):
                return (.success, [startPage, branch] as CFArray)
            default:
                return (.attributeUnsupported, nil)
            }
        }
    }

    func testOtherBrowsersDoNotUseSafariStartPageDetection() {
        for family: BrowserFamily in [.chromium, .gecko] {
            XCTAssertNil(
                BrowserURLExtractor.resolveURL(
                    family: family, documentURL: nil,
                    isSafariStartPage: {
                        XCTFail("Start Page detection is Safari-specific")
                        return true
                    }
                ) { nil })
        }
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
