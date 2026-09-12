import AppKit
import Foundation

/// Website information extracted from browser URL.
struct WebsiteInfo {
    let hostname: String
    let favicon: String?
    let color: String?

    /// Convert to dictionary for JSON serialization.
    func toDictionary() -> [String: Any?] {
        return [
            "hostname": hostname,
            "favicon": favicon,
            "color": color,
        ]
    }

    /// Extract website info from a URL string.
    /// Returns nil if URL is invalid or hostname cannot be extracted.
    static func extract(from url: String) -> WebsiteInfo? {
        guard let assets = getWebsiteAssets(from: url, includeColor: true)
        else {
            return nil
        }

        return WebsiteInfo(
            hostname: assets.hostname,
            favicon: assets.favicon,
            color: assets.color
        )
    }
}

// MARK: - Website Assets

/// Resolve website assets from a URL, accepting schemeless website URLs as HTTPS.
func getWebsiteAssets(
    from url: String,
    includeColor: Bool = false
) -> WebsiteAssets? {
    guard let hostname = normalizedWebsiteHostname(from: url) else {
        return nil
    }
    return loadWebsiteAssets(hostname: hostname, includeColor: includeColor)
}

/// Website assets resolved for a normalized URL hostname.
struct WebsiteAssets {
    let hostname: String
    let favicon: String?
    let color: String?
    // Note: nil color can mean either not requested yet or resolved without a result
    let isColorResolved: Bool
}

private func loadWebsiteAssets(
    hostname: String,
    includeColor: Bool
) -> WebsiteAssets {
    let cache = WebsiteAssetsCache.shared
    let cached = cache.get(hostname: hostname)

    if let cached = cached {
        let hasResolvedColorIfNeeded = !includeColor || cached.isColorResolved
        if hasResolvedColorIfNeeded {
            return cached
        }
    }

    let fetched = fetchWebsiteAssets(
        hostname: hostname,
        includeColor: includeColor
    )

    return cache.insert(fetched)
}

private func fetchWebsiteAssets(
    hostname: String,
    includeColor: Bool
) -> WebsiteAssets {
    guard let url = googleFaviconURL(hostname: hostname) else {
        return WebsiteAssets(
            hostname: hostname,
            favicon: nil,
            color: nil,
            isColorResolved: includeColor
        )
    }

    guard let data = try? Data(contentsOf: url),
        let image = NSImage(data: data)
    else {
        return WebsiteAssets(
            hostname: hostname,
            favicon: nil,
            color: nil,
            isColorResolved: includeColor
        )
    }

    let dataUrl = image.pngData(size: websiteFaviconSize).map {
        "data:image/png;base64,\($0.base64EncodedString())"
    }
    let color = includeColor ? extractDisplayColor(from: image) : nil

    return WebsiteAssets(
        hostname: hostname,
        favicon: dataUrl,
        color: color,
        isColorResolved: includeColor
    )
}

private let websiteFaviconSize = 64

private func googleFaviconURL(hostname: String) -> URL? {
    var components = URLComponents(string: "https://www.google.com/s2/favicons")
    components?.queryItems = [
        URLQueryItem(name: "domain", value: hostname),
        URLQueryItem(name: "sz", value: String(websiteFaviconSize)),
    ]
    return components?.url
}

private func normalizedWebsiteHostname(from url: String) -> String? {
    let value = url.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !value.isEmpty else { return nil }

    let lowercasedValue = value.lowercased()

    // Note: Browser-internal URLs are not websites and should not trigger favicon fetches
    let internalPrefixes = [
        "about:", "chrome://", "edge://", "brave://", "arc://", "opera://",
        "file://",
    ]
    for prefix in internalPrefixes {
        if lowercasedValue.hasPrefix(prefix) {
            return nil
        }
    }

    guard let normalizedURL = normalizedWebsiteURLString(from: lowercasedValue),
        let hostname = URLComponents(string: normalizedURL)?.host
    else {
        return nil
    }

    // Note: Require an internet-style hostname before calling Google's favicon endpoint
    guard hostname.contains(".") else { return nil }

    return hostname
}

private func normalizedWebsiteURLString(from value: String) -> String? {
    if let schemeRange = value.range(of: "://") {
        let scheme = value[..<schemeRange.lowerBound]
        guard scheme == "http" || scheme == "https" else {
            return nil
        }

        return value
    }

    guard isSchemelessWebsiteURL(value) else {
        return nil
    }

    // Treat github.com and github.com/path as HTTPS shorthand
    return "https://\(value)"
}

private func isSchemelessWebsiteURL(_ value: String) -> Bool {
    let authority = value.prefix { character in
        character != "/" && character != "?" && character != "#"
    }
    guard !authority.isEmpty else { return false }

    guard let colonIndex = authority.firstIndex(of: ":") else {
        return true
    }

    let port = authority[authority.index(after: colonIndex)...]
    if port.isEmpty {
        return false
    }

    return port.allSatisfy { $0.isNumber }
}

/// Thread-safe in-memory cache for website assets, keyed by hostname.
final class WebsiteAssetsCache: @unchecked Sendable {
    static let shared = WebsiteAssetsCache()

    private var cache: [String: WebsiteAssets] = [:]
    private let lock = NSLock()
    private let maxSize = 100

    func get(hostname: String) -> WebsiteAssets? {
        lock.lock()
        defer { lock.unlock() }
        return cache[hostname]
    }

    func insert(_ assets: WebsiteAssets) -> WebsiteAssets {
        lock.lock()
        defer { lock.unlock() }

        // Note: An icon-only fetch must not replace a cache entry whose color lookup has already completed
        if let cached = cache[assets.hostname] {
            if !assets.isColorResolved || cached.isColorResolved {
                return cached
            }
            if assets.favicon == nil, cached.favicon != nil {
                return cached
            }
        }

        // Simple eviction: clear half when adding beyond the limit
        let isAddingHostname = cache[assets.hostname] == nil
        if isAddingHostname && cache.count >= maxSize {
            let keysToRemove = Array(cache.keys.prefix(maxSize / 2))
            for key in keysToRemove {
                cache.removeValue(forKey: key)
            }
        }

        cache[assets.hostname] = assets
        return assets
    }
}
