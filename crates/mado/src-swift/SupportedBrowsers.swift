import Foundation

enum SupportedBrowsers {
    static let all: [(bundleId: String, name: String, family: BrowserFamily)] =
        [
            // Chromium-based
            ("com.google.Chrome", "Chrome", .chromium),
            ("com.google.Chrome.beta", "Chrome Beta", .chromium),
            ("com.google.Chrome.dev", "Chrome Dev", .chromium),
            ("com.google.Chrome.canary", "Chrome Canary", .chromium),
            ("com.brave.Browser", "Brave", .chromium),
            ("com.brave.Browser.beta", "Brave Beta", .chromium),
            ("com.brave.Browser.nightly", "Brave Nightly", .chromium),
            ("com.microsoft.edgemac", "Edge", .chromium),
            ("com.microsoft.edgemac.Beta", "Edge Beta", .chromium),
            ("com.microsoft.edgemac.Dev", "Edge Dev", .chromium),
            ("com.microsoft.edgemac.Canary", "Edge Canary", .chromium),
            ("com.operasoftware.Opera", "Opera", .chromium),
            ("com.operasoftware.OperaGX", "Opera GX", .chromium),
            ("company.thebrowser.Browser", "Arc", .chromium),
            ("company.thebrowser.Browser.beta", "Arc Beta", .chromium),
            ("company.thebrowser.Browser.dev", "Arc Dev", .chromium),
            ("com.nickvision.nickel", "Nickel", .chromium),
            ("com.nickvision.nickel.beta", "Nickel Beta", .chromium),
            ("com.nickvision.nickel.dev", "Nickel Dev", .chromium),
            ("com.nickvision.nickel.nightly", "Nickel Nightly", .chromium),

            // Safari
            ("com.apple.Safari", "Safari", .safari),
            (
                "com.apple.SafariTechnologyPreview",
                "Safari Technology Preview", .safari
            ),

            // Firefox
            ("org.mozilla.firefox", "Firefox", .firefox),
            (
                "org.mozilla.firefoxdeveloperedition",
                "Firefox Developer Edition", .firefox
            ),
            ("org.mozilla.nightly", "Firefox Nightly", .firefox),
            ("org.mozilla.firefox.beta", "Firefox Beta", .firefox),
        ]

    /// Set of bundle IDs for quick lookup.
    static let bundleIds: Set<String> = Set(all.map { $0.bundleId })

    /// Check if a bundle ID is a supported browser.
    static func isBrowser(_ bundleId: String) -> Bool {
        return bundleIds.contains(bundleId)
    }

    /// Get browser family for a bundle ID.
    static func family(for bundleId: String) -> BrowserFamily {
        if let browser = all.first(where: { $0.bundleId == bundleId }) {
            return browser.family
        }
        // Fall back to detection for unknown browsers
        return BrowserFamily.from(bundleId)
    }
}

enum BrowserFamily {
    case chromium
    case safari
    case firefox
    case unknown

    /// Determine browser family from bundle identifier.
    static func from(_ bundleId: String) -> BrowserFamily {
        let lowerId = bundleId.lowercased()

        // Chromium-based browsers
        if lowerId.contains("chrome")
            || lowerId.contains("brave")
            || lowerId.contains("edge")
            || lowerId.contains("opera")
            || lowerId == "company.thebrowser.browser"  // Arc
            || lowerId.hasPrefix("company.thebrowser.")
        {
            return .chromium
        }

        // Safari
        if lowerId.contains("safari") {
            return .safari
        }

        // Firefox
        if lowerId.contains("firefox") || lowerId.contains("mozilla") {
            return .firefox
        }

        return .unknown
    }
}
