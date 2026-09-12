/// Get a website favicon and optional favicon-derived color from a URL.
func getWebsiteIcon(
    from url: String,
    includeColor: Bool = false
) -> WebsiteIcon {
    guard let assets = getWebsiteAssets(from: url, includeColor: includeColor)
    else {
        return WebsiteIcon(dataUrl: nil, color: nil)
    }

    return WebsiteIcon(
        dataUrl: assets.favicon,
        color: includeColor ? assets.color : nil
    )
}

/// Website favicon payload with optional favicon-derived color.
struct WebsiteIcon {
    let dataUrl: String?
    let color: String?

    func toDictionary() -> [String: Any?] {
        return [
            "dataUrl": dataUrl,
            "color": color,
        ]
    }
}
