import AppKit
import Foundation

func scanInstalledApps(includeIcon: Bool, iconSize: Int) -> [InstalledApp] {
    var apps: [InstalledApp] = []
    var seenBundleIds = Set<String>()

    let applicationPaths = [
        "/Applications",
        NSHomeDirectory() + "/Applications",
    ]

    for basePath in applicationPaths {
        let fileManager = FileManager.default
        guard
            let contents = try? fileManager.contentsOfDirectory(
                atPath: basePath
            )
        else {
            continue
        }

        for item in contents {
            guard item.hasSuffix(".app") else { continue }

            let appPath = basePath + "/" + item
            guard let bundle = Bundle(path: appPath),
                let bundleId = bundle.bundleIdentifier
            else {
                continue
            }

            // Skip duplicates
            guard !seenBundleIds.contains(bundleId) else { continue }
            seenBundleIds.insert(bundleId)

            // Get app name from bundle (localized) or fall back to filename
            let appName =
                bundle.localizedInfoDictionary?["CFBundleName"] as? String
                ?? bundle.infoDictionary?["CFBundleName"] as? String
                ?? bundle.infoDictionary?["CFBundleDisplayName"] as? String
                ?? String(item.dropLast(4))

            let icon: AppIcon? =
                includeIcon
                ? getAppIcon(
                    forPath: appPath,
                    bundleId: bundleId,
                    size: iconSize
                )
                : nil

            let app = InstalledApp(
                bundleId: bundleId,
                name: appName,
                path: appPath,
                icon: icon
            )

            apps.append(app)
        }
    }

    apps.sort {
        $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
    }

    return apps
}

struct InstalledApp {
    let bundleId: String
    let name: String
    let path: String
    let icon: AppIcon?

    func toDictionary() -> [String: Any?] {
        return [
            "bundleId": bundleId,
            "name": name,
            "path": path,
            "icon": icon?.toDictionary(),
        ]
    }
}
