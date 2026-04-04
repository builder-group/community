import AppKit
import Foundation

/// Website information extracted from browser URL.
struct WebsiteInfo {
    let domain: String
    let favicon: String?
    let color: String?

    /// Convert to dictionary for JSON serialization.
    func toDictionary() -> [String: Any?] {
        return [
            "domain": domain,
            "favicon": favicon,
            "color": color,
        ]
    }

    /// Extract website info from a URL string.
    /// Returns nil if URL is invalid or domain cannot be extracted.
    static func extract(from url: String) -> WebsiteInfo? {
        guard let domain = extractDomain(from: url) else { return nil }

        // Check cache first
        if let cached = WebsiteInfoCache.shared.get(domain: domain) {
            return cached
        }

        // Fetch favicon and extract color
        let faviconUrl =
            "https://www.google.com/s2/favicons?domain=\(domain)&sz=64"
        let (favicon, color) = fetchFavicon(from: faviconUrl)

        let info = WebsiteInfo(
            domain: domain,
            favicon: favicon,
            color: color
        )

        // Cache for future use
        WebsiteInfoCache.shared.set(domain: domain, info: info)

        return info
    }

    /// Fetch favicon from URL and extract color.
    private static func fetchFavicon(from urlString: String) -> (
        String?, String?
    ) {
        guard let url = URL(string: urlString) else {
            return (nil, nil)
        }

        // Synchronous fetch (blocks, but cached so only first call per domain is slow)
        guard let data = try? Data(contentsOf: url),
            let image = NSImage(data: data)
        else {
            return (nil, nil)
        }

        let dataUrl = image.pngData(size: 64).map {
            "data:image/png;base64,\($0.base64EncodedString())"
        }
        let color = extractBrandColor(from: image)

        return (dataUrl, color)
    }

    /// Extract domain from URL string.
    private static func extractDomain(from url: String) -> String? {
        var url = url.trimmingCharacters(in: .whitespaces).lowercased()

        // Skip internal browser URLs
        let internalProtocols = [
            "about:", "chrome://", "edge://", "brave://", "arc://", "file://",
        ]
        for proto in internalProtocols {
            if url.hasPrefix(proto) {
                return nil
            }
        }

        // Remove protocol
        if url.hasPrefix("https://") {
            url = String(url.dropFirst(8))
        } else if url.hasPrefix("http://") {
            url = String(url.dropFirst(7))
        }

        // Take host only (before /)
        if let slashIndex = url.firstIndex(of: "/") {
            url = String(url[..<slashIndex])
        }

        // Remove port
        if let colonIndex = url.firstIndex(of: ":") {
            url = String(url[..<colonIndex])
        }

        // Remove www.
        if url.hasPrefix("www.") {
            url = String(url.dropFirst(4))
        }

        // Validate we have something that looks like a domain
        guard !url.isEmpty, url.contains(".") else {
            return nil
        }

        return url
    }
}

// MARK: - Cache

/// Simple in-memory cache for website info.
/// Thread-safe, caches by domain to avoid repeated fetches.
final class WebsiteInfoCache: @unchecked Sendable {
    static let shared = WebsiteInfoCache()

    private var cache: [String: WebsiteInfo] = [:]
    private let lock = NSLock()
    private let maxSize = 100

    private init() {}

    func get(domain: String) -> WebsiteInfo? {
        lock.lock()
        defer { lock.unlock() }
        return cache[domain]
    }

    func set(domain: String, info: WebsiteInfo) {
        lock.lock()
        defer { lock.unlock() }

        // Simple eviction: clear half when full
        if cache.count >= maxSize {
            let keysToRemove = Array(cache.keys.prefix(maxSize / 2))
            for key in keysToRemove {
                cache.removeValue(forKey: key)
            }
        }

        cache[domain] = info
    }
}
