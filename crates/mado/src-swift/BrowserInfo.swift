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
        guard let family = SupportedBrowsers.family(for: bundleId) else {
            return nil
        }
        guard
            let url = BrowserURLExtractor.extract(
                family: family,
                from: windowElement
            )
        else {
            return nil
        }

        let contentBounds = BrowserContentBoundsExtractor.extract(
            from: windowElement
        )
        let isPrivate = detectPrivateMode(
            windowTitle: windowTitle ?? getTitle(from: windowElement)
        )

        let website: WebsiteInfo? =
            if includeWebsiteInfo {
                WebsiteInfo.extract(from: url)
            } else {
                nil
            }

        return BrowserInfo(
            url: url,
            contentBounds: contentBounds,
            isPrivate: isPrivate,
            website: website
        )
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
