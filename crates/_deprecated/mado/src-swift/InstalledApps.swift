import AppKit
import Foundation

func scanInstalledApps(includeIcon: Bool, includeAppColor: Bool, iconSize: Int)
    -> [InstalledApp]
{
    var apps: [InstalledApp] = []
    var seenBundleIds = Set<String>()

    for appUrl in installedApplicationUrls() {
        // Note: Application discovery can return duplicates, so deduplicate before per-app work such as loading optional assets
        guard
            let bundle = Bundle(url: appUrl),
            let bundleId = bundle.bundleIdentifier,
            !seenBundleIds.contains(bundleId)
        else { continue }

        seenBundleIds.insert(bundleId)
        apps.append(
            installedApp(
                at: appUrl,
                bundle: bundle,
                bundleId: bundleId,
                includeIcon: includeIcon,
                includeAppColor: includeAppColor,
                iconSize: iconSize
            )
        )
    }

    apps.sort {
        $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
    }

    return apps
}

private func installedApplicationUrls() -> [URL] {
    let fileManager = FileManager.default
    let applicationDirectories = fileManager.urls(
        for: .applicationDirectory,
        in: [.userDomainMask, .localDomainMask, .systemDomainMask]
    )
    var appUrls: [URL] = []

    for directory in applicationDirectories {
        // Note: Package descendants can contain embedded helpers that should not appear as installed apps
        guard
            let enumerator = fileManager.enumerator(
                at: directory,
                includingPropertiesForKeys: nil,
                options: [.skipsHiddenFiles, .skipsPackageDescendants]
            )
        else { continue }

        for case let url as URL in enumerator {
            guard
                url.pathExtension.caseInsensitiveCompare("app") == .orderedSame
            else { continue }
            appUrls.append(url)
        }
    }

    return appUrls
}

func getInstalledApp(
    bundleId: String,
    includeIcon: Bool,
    includeAppColor: Bool,
    iconSize: Int
) -> InstalledApp? {
    guard
        let appUrl = NSWorkspace.shared.urlForApplication(
            withBundleIdentifier: bundleId
        ),
        let bundle = Bundle(url: appUrl),
        let resolvedBundleId = bundle.bundleIdentifier
    else { return nil }

    return installedApp(
        at: appUrl,
        bundle: bundle,
        bundleId: resolvedBundleId,
        includeIcon: includeIcon,
        includeAppColor: includeAppColor,
        iconSize: iconSize
    )
}

private func installedApp(
    at appUrl: URL,
    bundle: Bundle,
    bundleId: String,
    includeIcon: Bool,
    includeAppColor: Bool,
    iconSize: Int
) -> InstalledApp {
    let appName =
        bundle.localizedInfoDictionary?["CFBundleName"] as? String
        ?? bundle.infoDictionary?["CFBundleName"] as? String
        ?? bundle.infoDictionary?["CFBundleDisplayName"] as? String
        ?? appUrl.deletingPathExtension().lastPathComponent
    let icon: AppIcon? =
        includeIcon
        ? getAppIcon(
            forPath: appUrl.path,
            forBundleId: bundleId,
            size: iconSize,
            includeColor: includeAppColor
        )
        : nil

    return InstalledApp(
        bundleId: bundleId,
        name: appName,
        path: appUrl.path,
        icon: icon
    )
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
