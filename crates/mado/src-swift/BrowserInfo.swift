import ApplicationServices
import Foundation

/// Browser information (URL, private mode, website).
struct BrowserInfo {
    let url: String?
    let isPrivate: Bool?
    let website: WebsiteInfo?

    /// Convert to dictionary for JSON serialization.
    func toDictionary() -> [String: Any?] {
        return [
            "url": url,
            "isPrivate": isPrivate,
            "website": website?.toDictionary(),
        ]
    }

    /// Extract browser info using the Accessibility API.
    /// Returns nil if not a browser or extraction fails.
    static func extract(
        bundleId: String,
        windowElement: AXUIElement,
        windowTitle: String?,
        includeWebsiteInfo: Bool = false
    )
        -> BrowserInfo?
    {
        guard SupportedBrowsers.isBrowser(bundleId) else { return nil }

        let family = SupportedBrowsers.family(for: bundleId)
        let url = extractURL(family: family, windowElement: windowElement)
        let isPrivate = detectPrivateMode(
            windowTitle: windowTitle ?? getTitle(from: windowElement)
        )

        // Only return if we got a URL
        guard url != nil else { return nil }

        // Extract website info if enabled
        let website: WebsiteInfo? =
            if includeWebsiteInfo, let url = url {
                WebsiteInfo.extract(from: url)
            } else {
                nil
            }

        return BrowserInfo(url: url, isPrivate: isPrivate, website: website)
    }

    // MARK: - URL Extraction

    private static func extractURL(
        family: BrowserFamily,
        windowElement: AXUIElement
    ) -> String? {
        switch family {
        case .chromium:
            return extractChromiumURL(from: windowElement)
        case .safari:
            return extractSafariURL(from: windowElement)
        case .firefox:
            return extractFirefoxURL(from: windowElement)
        case .unknown:
            return nil
        }
    }

    /// Extract URL from Chromium-based browsers (Chrome, Brave, Edge, Arc, Opera).
    private static func extractChromiumURL(from windowElement: AXUIElement)
        -> String?
    {
        // Strategy 1: Find by AXDOMIdentifier (Chrome, Edge)
        if let urlBar = findElement(
            in: windowElement,
            where: { element in
                guard getRole(from: element) == "AXTextField" else {
                    return false
                }
                return getDOMIdentifier(from: element) == "urlbar-input"
            }
        ) {
            return normalizeURL(getValue(from: urlBar))
        }

        // Strategy 2: Find by placeholder text (Brave, Arc, and others)
        if let urlBar = findElement(
            in: windowElement,
            where: { element in
                guard getRole(from: element) == "AXTextField" else {
                    return false
                }
                let placeholder = (getPlaceholderValue(from: element) ?? "")
                    .lowercased()
                return placeholder.contains("search")
                    || placeholder.contains("url")
                    || placeholder.contains("address")
            }
        ) {
            return normalizeURL(getValue(from: urlBar))
        }

        // Strategy 3: Find by AXComboBox (fallback for some variants)
        if let comboBox = findElement(
            in: windowElement,
            where: { element in
                getRole(from: element) == "AXComboBox"
            }
        ) {
            if let url = normalizeURL(getValue(from: comboBox)) {
                return url
            }
            // Check child text field
            if let children = getChildren(from: comboBox) {
                for child in children
                where getRole(from: child) == "AXTextField" {
                    if let url = normalizeURL(getValue(from: child)) {
                        return url
                    }
                }
            }
        }

        return nil
    }

    /// Extract URL from Safari via AXURL on the web content area.
    private static func extractSafariURL(from windowElement: AXUIElement)
        -> String?
    {
        // Safari exposes AXURL on AXWebArea
        if let webArea = findElement(
            in: windowElement,
            where: { element in
                getRole(from: element) == "AXWebArea"
            }
        ) {
            if let url = getAXURL(from: webArea) {
                return url.absoluteString
            }
        }

        // Fallback: AXDocument
        if let doc = findElement(
            in: windowElement,
            where: { element in
                getRole(from: element) == "AXDocument"
            }
        ) {
            if let url = getAXURL(from: doc) {
                return url.absoluteString
            }
        }

        return nil
    }

    /// Extract URL from Firefox via AXTextField with address description.
    private static func extractFirefoxURL(from windowElement: AXUIElement)
        -> String?
    {
        // Find URL bar by its description
        if let urlBar = findElement(
            in: windowElement,
            where: { element in
                guard getRole(from: element) == "AXTextField" else {
                    return false
                }
                let desc = (getDescription(from: element) ?? "").lowercased()
                return desc.contains("address") || desc.contains("url")
                    || (desc.contains("search") && desc.contains("enter"))
            }
        ) {
            return normalizeURL(getValue(from: urlBar))
        }

        // Fallback: Find text field containing a URL
        if let urlBar = findElement(
            in: windowElement,
            where: { element in
                guard getRole(from: element) == "AXTextField" else {
                    return false
                }
                let value = getValue(from: element) ?? ""
                return value.hasPrefix("http://") || value.hasPrefix("https://")
            }
        ) {
            return normalizeURL(getValue(from: urlBar))
        }

        return nil
    }

    /// Normalize URL string - adds https:// if missing.
    private static func normalizeURL(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmed.isEmpty || trimmed.count < 3 {
            return nil
        }

        // Already has protocol
        let protocols = [
            "http://", "https://", "file://", "about:", "chrome://", "edge://",
            "brave://", "arc://",
        ]
        for proto in protocols {
            if trimmed.hasPrefix(proto) {
                return trimmed
            }
        }

        // Looks like a domain - add https://
        if trimmed.contains(".") && !trimmed.contains(" ") {
            return "https://\(trimmed)"
        }

        return nil
    }

    // MARK: - Private Mode Detection

    /// Detect private/incognito mode via window title patterns.
    /// Returns nil if title is empty/nil (unknown), false if normal, true if private.
    private static func detectPrivateMode(windowTitle: String?) -> Bool? {
        guard let title = windowTitle, !title.isEmpty else {
            return nil  // Unknown - no title to check
        }

        let lower = title.lowercased()
        let patterns = [
            "(incognito)", "(private)", ", private browsing",
            "— private", "- private", "[private]",
        ]

        for pattern in patterns {
            if lower.contains(pattern) {
                return true
            }
        }

        return false
    }
}
