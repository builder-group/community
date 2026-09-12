import ApplicationServices
import XCTest

@testable import Mado

final class BrowserWebContentTests: XCTestCase {
    func testKeepsTheElementThatProvidedTheDocumentURL() throws {
        let window = AXUIElementCreateApplication(1)
        let unreadable = AXUIElementCreateApplication(2)
        let readable = AXUIElementCreateApplication(3)
        var reads = 0

        let document = try XCTUnwrap(BrowserWebContent.findDocument(
            in: window,
            readRole: { CFEqual($0, window) ? "AXWindow" : "AXWebArea" },
            readChildren: { CFEqual($0, window) ? [unreadable, readable] : [] },
            readURL: {
                guard CFEqual($0, readable) else { return nil }
                reads += 1
                return URL(string: reads == 1 ? "https://example.com/" : "https://example.org/")
            }
        ))

        XCTAssertTrue(CFEqual(document.element, readable))
        XCTAssertEqual(document.url, "https://example.com/")
        XCTAssertEqual(reads, 1)
    }

    func testDoesNotUseAnEmbeddedPageAsTheActiveDocument() throws {
        let window = AXUIElementCreateApplication(1)
        let page = AXUIElementCreateApplication(2)
        let embeddedPage = AXUIElementCreateApplication(3)

        let document = try XCTUnwrap(BrowserWebContent.findDocument(
            in: window,
            readRole: { CFEqual($0, window) ? "AXWindow" : "AXWebArea" },
            readChildren: { CFEqual($0, window) ? [page] : [embeddedPage] },
            readURL: { CFEqual($0, embeddedPage) ? URL(string: "https://example.com/") : nil }
        ))

        XCTAssertTrue(CFEqual(document.element, page))
        XCTAssertNil(document.url)
    }

    func testReturnsNoDocumentWhenTheWindowHasNoWebContent() {
        let document = BrowserWebContent.findDocument(
            in: AXUIElementCreateApplication(1),
            readRole: { _ in "AXWindow" },
            readChildren: { _ in [] },
            readURL: { _ in
                XCTFail("Browser controls must not provide a document URL")
                return nil
            }
        )
        XCTAssertNil(document)
    }
}
