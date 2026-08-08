import ApplicationServices
import Foundation

func axFocusedWindow(from application: AXUIElement) -> AXUIElement? {
    var value: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(
            application,
            kAXFocusedWindowAttribute as CFString,
            &value
        ) == .success,
        let value,
        CFGetTypeID(value) == AXUIElementGetTypeID()
    else {
        return nil
    }

    return (value as! AXUIElement)
}

func axString(_ element: AXUIElement, attribute: String) -> String? {
    var value: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
            == .success
    else {
        return nil
    }

    return value as? String
}

func axElements(_ element: AXUIElement, attribute: String) -> [AXUIElement] {
    var value: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
            == .success
    else {
        return []
    }

    return value as? [AXUIElement] ?? []
}

func axTraversalChildren(of element: AXUIElement) -> [AXUIElement] {
    let children = axElements(
        element,
        attribute: kAXChildrenAttribute as String
    )
    let visibleChildren = axElements(element, attribute: "AXVisibleChildren")
    var result: [AXUIElement] = []

    for child in children + visibleChildren {
        if result.contains(where: { CFEqual($0, child) }) {
            continue
        }
        result.append(child)
    }

    return result
}

func axURL(_ element: AXUIElement) -> URL? {
    var value: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(element, "AXURL" as CFString, &value)
            == .success,
        let value
    else {
        return nil
    }

    if let url = value as? NSURL {
        return url as URL
    }
    if let string = value as? String {
        return URL(string: string)
    }
    return nil
}

func axFrame(of element: AXUIElement) -> CGRect? {
    var value: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(element, "AXFrame" as CFString, &value)
            == .success,
        let value,
        CFGetTypeID(value) == AXValueGetTypeID()
    else {
        return nil
    }

    var frame = CGRect.zero
    guard AXValueGetValue(value as! AXValue, .cgRect, &frame) else {
        return nil
    }
    return frame
}
