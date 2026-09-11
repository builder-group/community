import AppKit

/// Extract app icon as a base64 PNG data URL.
func getAppIcon(
    forPath appPath: String?,
    forBundleId bundleId: String?,
    size: Int = 32,
    includeColor: Bool = false
) -> AppIcon {
    guard let appPath = appPath else {
        return AppIcon(dataUrl: nil, color: nil)
    }

    let icon = NSWorkspace.shared.icon(forFile: appPath)
    let dataUrl = icon.pngData(size: size).map {
        "data:image/png;base64,\($0.base64EncodedString())"
    }
    let color =
        includeColor
        ? getAppColor(forBundleId: bundleId, icon: icon)
        : nil

    return AppIcon(dataUrl: dataUrl, color: color)
}

/// Get app icon by bundle identifier only (finds path via NSWorkspace).
func getAppIconByBundleId(
    _ bundleId: String,
    size: Int = 32,
    includeColor: Bool = false
) -> AppIcon {
    guard
        let appUrl = NSWorkspace.shared.urlForApplication(
            withBundleIdentifier: bundleId
        )
    else {
        return AppIcon(dataUrl: nil, color: nil)
    }

    return getAppIcon(
        forPath: appUrl.path,
        forBundleId: bundleId,
        size: size,
        includeColor: includeColor
    )
}

/// App icon with optional app display color.
struct AppIcon {
    let dataUrl: String?
    let color: String?

    func toDictionary() -> [String: Any?] {
        return [
            "dataUrl": dataUrl,
            "color": color,
        ]
    }
}

extension NSImage {
    /// Convert to PNG data at specified size.
    func pngData(size: Int) -> Data? {
        guard size > 0 else { return nil }
        let targetSize = NSSize(width: size, height: size)

        // Create a new image with the target size
        let resizedImage = NSImage(size: targetSize)
        resizedImage.lockFocus()

        // Draw the original image scaled to fit
        NSGraphicsContext.current?.imageInterpolation = .high
        self.draw(
            in: NSRect(origin: .zero, size: targetSize),
            from: NSRect(origin: .zero, size: self.size),
            operation: .copy,
            fraction: 1.0
        )

        resizedImage.unlockFocus()

        // Convert to PNG
        guard let tiffData = resizedImage.tiffRepresentation,
            let bitmap = NSBitmapImageRep(data: tiffData),
            let pngData = bitmap.representation(using: .png, properties: [:])
        else {
            return nil
        }

        return pngData
    }
}
