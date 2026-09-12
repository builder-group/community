import ApplicationServices
import XCTest

@testable import Mado

final class VivaldiWebContentTests: XCTestCase {
    func testSelectsNestedActiveTileAndExcludesPanels() throws {
        let page = try XCTUnwrap(findPage([
            Node(role: "AXWebArea", children: [1, 3]),
            Node(children: [2], identifier: "panels-container"),
            Node(role: "AXWebArea", url: "https://panel.example/"),
            Node(children: [4, 6]),
            Node(classes: ["webpageview"], children: [5]),
            Node(role: "AXWebArea", url: "https://inactive.example/"),
            Node(classes: ["webpageview", "active"], children: [7]),
            Node(role: "AXWebArea", url: "https://active.example/"),
        ]))
        XCTAssertEqual(page.url, "https://active.example/")
        XCTAssertTrue(CFEqual(page.element, AXUIElementCreateApplication(8)))
    }

    func testRequiresPositiveActivePageIdentification() {
        let nodes = [
            Node(role: "AXWebArea", children: [1]),
            Node(children: [2]),
            Node(role: "AXWebArea", url: "https://example.com/"),
        ]
        XCTAssertNil(findPage(nodes))
        XCTAssertNil(findPage(nodes) { index, attribute in
            index == 1 && attribute == "AXDOMClassList" ? (.cannotComplete, nil) : nil
        })
    }

    func testNormalizesConfirmedInternalPage() {
        XCTAssertEqual(findPage(internalPageTree)?.url, "about:blank")
    }

    func testAcceptsStringDocumentURLs() {
        var nodes = internalPageTree
        nodes[3] = Node(role: "AXWebArea")
        let page = findPage(nodes) { index, key in
            index == 3 && key == kAXURLAttribute
                ? (.success, "https://example.com/" as CFString) : nil
        }
        XCTAssertEqual(page?.url, "https://example.com/")
    }

    func testRejectsInternalPageWhenATraversalAttributeFails() {
        for attribute in [
            kAXRoleAttribute, kAXChildrenAttribute, "AXVisibleChildren",
            "AXDOMClassList", "AXDOMIdentifier",
        ] {
            XCTAssertNil(findPage(internalPageTree) { index, key in
                index == 3 && key == attribute ? (.cannotComplete, nil) : nil
            }, attribute)
        }
    }

    func testDocumentTakesPrecedenceOverRetainedInternalContent() throws {
        for url: String? in [nil, "https://example.com/"] {
            var nodes = internalPageTree
            nodes[3] = Node(role: "AXWebArea", url: url)
            let page = try XCTUnwrap(findPage(nodes))
            XCTAssertEqual(page.url, url)
            XCTAssertTrue(CFEqual(page.element, AXUIElementCreateApplication(4)))
        }
    }

    func testRejectsInternalPageWhenTraversalIsTruncated() {
        var nodes = internalPageTree
        for index in 3...34 {
            if index == nodes.count { nodes.append(Node()) }
            nodes[index].children = [index + 1]
        }
        nodes.append(Node())
        XCTAssertNil(findPage(nodes))
    }

    private var internalPageTree: [Node] {
        return [
            Node(role: "AXWebArea", children: [1]),
            Node(classes: ["webpageview", "active"], children: [2, 3]),
            Node(classes: ["internal-page"]),
            Node(),
        ]
    }

    private struct Node {
        var role = "AXGroup"
        var classes: [String] = []
        var children: [Int] = []
        var url: String?
        var identifier: String?
    }

    private func findPage(
        _ nodes: [Node],
        override: (Int, String) -> (AXError, CFTypeRef?)? = { _, _ in nil }
    ) -> (element: AXUIElement, url: String?)? {
        let elements = nodes.indices.map { AXUIElementCreateApplication(pid_t($0 + 1)) }
        return VivaldiWebContent.findPage(in: elements[0]) { element, attribute in
            let index = elements.firstIndex { CFEqual($0, element) }!
            let key = attribute as String
            if let result = override(index, key) { return result }
            let node = nodes[index]
            switch key {
            case kAXRoleAttribute: return (.success, node.role as CFString)
            case "AXDOMClassList": return (.success, node.classes as CFArray)
            case "AXDOMIdentifier":
                return node.identifier.map { (.success, $0 as CFString) } ?? (.noValue, nil)
            case kAXChildrenAttribute:
                return node.children.isEmpty
                    ? (.attributeUnsupported, nil)
                    : (.success, node.children.map { elements[$0] } as CFArray)
            case kAXURLAttribute:
                return node.url.map { (.success, URL(string: $0)! as NSURL) } ?? (.noValue, nil)
            default: return (.attributeUnsupported, nil)
            }
        }
    }
}
