import ApplicationServices
import Foundation

/// Extract window bounds (position and size) from an accessibility element.
func getBounds(from windowElement: AXUIElement) -> [String: Double]? {
    var frameRef: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(
            windowElement,
            "AXFrame" as CFString,
            &frameRef
        ) == .success,
        let frameRef
    else {
        return nil
    }

    var rect = CGRect.zero
    // Note: Force cast is safe because the Accessibility API guarantees
    // AXFrame always returns an AXValue containing a CGRect.
    guard AXValueGetValue(frameRef as! AXValue, .cgRect, &rect) else {
        return nil
    }

    return [
        "x": Double(rect.origin.x),
        "y": Double(rect.origin.y),
        "width": Double(rect.size.width),
        "height": Double(rect.size.height),
    ]
}

/// Extract title from an accessibility window element.
func getTitle(from windowElement: AXUIElement) -> String? {
    var titleRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        windowElement,
        kAXTitleAttribute as CFString,
        &titleRef
    )
    return titleRef as? String
}

/// Get the focused window from an application's accessibility element.
func getFocusedWindow(from app: AXUIElement) -> AXUIElement? {
    var windowRef: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(
            app,
            kAXFocusedWindowAttribute as CFString,
            &windowRef
        ) == .success,
        let windowRef
    else {
        return nil
    }
    // Note: Force cast is safe because the Accessibility API guarantees
    // AXFocusedWindow always returns an AXUIElement.
    return (windowRef as! AXUIElement)
}

/// Get child elements from an accessibility element.
func getChildren(from element: AXUIElement) -> [AXUIElement]? {
    var childrenRef: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(
            element,
            kAXChildrenAttribute as CFString,
            &childrenRef
        ) == .success,
        let childrenRef
    else {
        return nil
    }
    return childrenRef as? [AXUIElement]
}

/// Get the role of an accessibility element (e.g., "AXTextField", "AXWebArea").
func getRole(from element: AXUIElement) -> String? {
    var roleRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        element,
        kAXRoleAttribute as CFString,
        &roleRef
    )
    return roleRef as? String
}

/// Get the value of an accessibility element (e.g., text content in a text field).
func getValue(from element: AXUIElement) -> String? {
    var valueRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        element,
        kAXValueAttribute as CFString,
        &valueRef
    )
    return valueRef as? String
}

/// Get the description of an accessibility element (screen reader text).
func getDescription(from element: AXUIElement) -> String? {
    var descRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        element,
        kAXDescriptionAttribute as CFString,
        &descRef
    )
    return descRef as? String
}

/// Get the placeholder value of a text field.
func getPlaceholderValue(from element: AXUIElement) -> String? {
    var placeholderRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        element,
        kAXPlaceholderValueAttribute as CFString,
        &placeholderRef
    )
    return placeholderRef as? String
}

/// Get the DOM identifier (Chromium-specific, used for URL bar detection).
func getDOMIdentifier(from element: AXUIElement) -> String? {
    var idRef: CFTypeRef?
    AXUIElementCopyAttributeValue(
        element,
        "AXDOMIdentifier" as CFString,
        &idRef
    )
    return idRef as? String
}

/// Get the AXURL property (Safari-specific, returns URL of web content).
func getAXURL(from element: AXUIElement) -> URL? {
    var urlRef: CFTypeRef?
    guard
        AXUIElementCopyAttributeValue(
            element,
            "AXURL" as CFString,
            &urlRef
        ) == .success,
        let url = urlRef as? NSURL
    else {
        return nil
    }
    return url as URL
}

/// Recursively find an element in the accessibility tree matching a predicate.
/// Returns the first matching element, or nil if not found.
func findElement(
    in element: AXUIElement,
    where predicate: (AXUIElement) -> Bool,
    maxDepth: Int = 15,
    currentDepth: Int = 0
) -> AXUIElement? {
    guard currentDepth < maxDepth else { return nil }

    // Check current element
    if predicate(element) {
        return element
    }

    // Recursively check children
    guard let children = getChildren(from: element) else {
        return nil
    }

    for child in children {
        if let found = findElement(
            in: child,
            where: predicate,
            maxDepth: maxDepth,
            currentDepth: currentDepth + 1
        ) {
            return found
        }
    }

    return nil
}
