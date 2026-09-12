enum SupportedBrowsers {
    private static let kindsByBundleId: [String: BrowserKind] = [
        // Chromium family
        "com.google.chrome": .chromium,
        "com.google.chrome.beta": .chromium,
        "com.google.chrome.dev": .chromium,
        "com.google.chrome.canary": .chromium,
        "org.chromium.chromium": .chromium,
        "com.brave.browser": .chromium,
        "com.brave.browser.beta": .chromium,
        "com.brave.browser.nightly": .chromium,
        "com.microsoft.edgemac": .chromium,
        "com.microsoft.edgemac.beta": .chromium,
        "com.microsoft.edgemac.dev": .chromium,
        "com.microsoft.edgemac.canary": .chromium,
        "com.operasoftware.opera": .chromium,
        "com.operasoftware.operanext": .chromium,
        "com.operasoftware.operadeveloper": .chromium,
        "com.operasoftware.operagx": .chromium,
        "company.thebrowser.browser": .chromium,
        "net.imput.helium": .chromium,
        "com.vivaldi.vivaldi": .vivaldi,

        // Safari
        "com.apple.safari": .safari,
        "com.apple.safaritechnologypreview": .safari,

        // Gecko family
        "org.mozilla.firefox": .gecko,
        "org.mozilla.firefoxdeveloperedition": .gecko,
        "org.mozilla.nightly": .gecko,
        "app.zen-browser.zen": .gecko,
    ]

    /// Returns the browser kind for an explicitly supported browser.
    static func kind(for bundleId: String) -> BrowserKind? {
        return kindsByBundleId[bundleId.lowercased()]
    }
}

// Note: Browsers share family handling unless their Accessibility structure requires a distinct path
enum BrowserKind: Equatable {
    case chromium
    case gecko
    case safari
    case vivaldi
}
