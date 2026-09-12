import ApplicationServices
import XCTest

@testable import Mado

final class SafariWebContentTests: XCTestCase {
    func testDocumentURLAvoidsStartPageQueries() {
        XCTAssertEqual(
            SafariWebContent.resolveURL(documentURL: "https://example.com/path") {
                XCTFail("A document URL should avoid Start Page queries")
                return true
            }, "https://example.com/path")
    }

    func testOnlyConfirmedStartPageProducesInternalURL() {
        XCTAssertEqual(SafariWebContent.resolveURL(documentURL: nil) { true }, "about:blank")
        XCTAssertNil(SafariWebContent.resolveURL(documentURL: nil) { false })
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

        return SafariWebContent.isStartPage(in: root) { element, attribute in
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
}
