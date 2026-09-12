enum SupportedBrowsers {
    private static let familiesByBundleId: [String: BrowserFamily] = [
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

        // Safari
        "com.apple.safari": .safari,
        "com.apple.safaritechnologypreview": .safari,

        // Gecko family
        "org.mozilla.firefox": .gecko,
        "org.mozilla.firefoxdeveloperedition": .gecko,
        "org.mozilla.nightly": .gecko,
        "app.zen-browser.zen": .gecko,
    ]

    /// Returns the extraction family for an explicitly supported browser.
    static func family(for bundleId: String) -> BrowserFamily? {
        return familiesByBundleId[bundleId.lowercased()]
    }
}

enum BrowserFamily: Equatable {
    case chromium
    case safari
    case gecko
}
