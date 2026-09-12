import ApplicationServices
import Foundation

/// Browser information (URL, content bounds, private mode, website).
struct BrowserInfo {
    let url: String?
    let contentBounds: [String: Double]?
    let isPrivate: Bool?
    let website: WebsiteInfo?

    /// Convert to dictionary for JSON serialization.
    func toDictionary() -> [String: Any?] {
        return [
            "url": url,
            "contentBounds": contentBounds,
            "isPrivate": isPrivate,
            "website": website?.toDictionary(),
        ]
    }

    /// Extract browser info using the Accessibility API.
    /// Returns nil if the app is not a browser or the active-tab URL cannot be read.
    static func extract(
        bundleId: String,
        windowElement: AXUIElement,
        windowTitle: String?,
        includeWebsiteInfo: Bool = false
    )
        -> BrowserInfo?
    {
        guard let kind = SupportedBrowsers.kind(for: bundleId) else {
            return nil
        }
        let page: BrowserPage?
        switch kind {
        case .vivaldi:
            page = VivaldiWebContent.extract(from: windowElement)
        case .safari:
            page = SafariWebContent.extract(from: windowElement)
        case .chromium, .gecko:
            page = BrowserWebContent.extract(from: windowElement)
        }
        guard let page else { return nil }

        let isPrivate = detectPrivateMode(
            windowTitle: windowTitle ?? getTitle(from: windowElement)
        )

        let website: WebsiteInfo? =
            if includeWebsiteInfo {
                WebsiteInfo.extract(from: page.url)
            } else {
                nil
            }

        return BrowserInfo(
            url: page.url,
            contentBounds: page.contentBounds,
            isPrivate: isPrivate,
            website: website
        )
    }

    static func findAddressBar(bundleId: String, in window: AXUIElement) -> AXUIElement? {
        guard let kind = SupportedBrowsers.kind(for: bundleId) else { return nil }
        switch kind {
        case .vivaldi:
            guard let interface = VivaldiWebContent.findInterface(in: window) else { return nil }
            return BrowserURLExtractor.findAddressBar(in: interface)
        case .chromium, .gecko, .safari:
            return BrowserURLExtractor.findAddressBar(in: window)
        }
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
