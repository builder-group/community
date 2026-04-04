import AppKit

/// Get app brand color from preset or by extracting from icon.
func getAppColor(forBundleId bundleId: String?, icon: NSImage?) -> String? {
    // Check presets first (known brand colors)
    if let bundleId = bundleId, let preset = appColorPresets[bundleId] {
        return preset
    }

    guard let icon = icon else { return nil }
    return extractBrandColor(from: icon)
}

// MARK: - Color Extraction

/// Extract brand color using k-means palette.
/// Picks most vibrant color, or falls back to dominant non-white for grayscale icons.
func extractBrandColor(from image: NSImage) -> String? {
    let palette = extractColorPalette(from: image, numberOfColors: 5)
    guard !palette.isEmpty else { return nil }

    // Pick most vibrant color (threshold filters out near-grayscale)
    if let bestVibrant = palette.max(by: { $0.vibrancy < $1.vibrancy }),
        bestVibrant.vibrancy > 0.1
    {
        return bestVibrant.hexString
    }

    // Fallback for grayscale icons: dominant non-white color
    for color in palette where color.brightness <= 0.9 {
        return color.hexString
    }

    return palette.first?.hexString
}

// MARK: - Presets

/// Brand colors for popular apps, keyed by bundle identifier.
private let appColorPresets: [String: String] = [
    // Communication
    "com.hnc.Discord": "#5865F2",  // Discord
    "com.apple.MobileSMS": "#2AC344",  // Messages
    "com.apple.FaceTime": "#2BC545",  // FaceTime

    // Browsers
    "com.google.Chrome": "#4285F4",  // Chrome
    "com.apple.Safari": "#267EF9",  // Safari
    "com.brave.Browser": "#FB542B",  // Brave

    // Development
    "com.todesktop.230313mzl4w4u92": "#0F0C06",  // Cursor
    "com.microsoft.VSCode": "#0098FF",  // VS Code
    "com.apple.dt.Xcode": "#1496F9",  // Xcode
    "com.github.GitHubClient": "#762F9B",  // GitHub Desktop
    "com.apple.Terminal": "#2D2D2D",  // Terminal

    // Productivity
    "com.figma.Desktop": "#FF3737",  // Figma
    "com.notion.id": "#FFFFFF",  // Notion
    "com.apple.Notes": "#FED835",  // Notes

    // Media
    "com.spotify.client": "#1DB954",  // Spotify
    "com.apple.Music": "#FF4E6B",  // Music
    "com.apple.TV": "#181818",  // TV

    // Apple Apps
    "com.apple.finder": "#0183FD",  // Finder
    "com.apple.mail": "#2076F7",  // Mail
    "com.apple.iCal": "#E13840",  // Calendar
    "com.apple.Photos": "#CFA20A",  // Photos
    "com.apple.Preview": "#4987FB",  // Preview
    "com.apple.systempreferences": "#99999F",  // System Settings
    "com.apple.AppStore": "#196AEF",  // App Store
    "com.apple.iWork.Pages": "#F58B1A",  // Pages
    "com.apple.iWork.Numbers": "#21D021",  // Numbers
]
