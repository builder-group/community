// swift-tools-version: 6.1

import Foundation
import PackageDescription

let package = Package(
    name: "desktop-tauri-macos",
    platforms: [
        .macOS(.v10_15)
    ],
    products: [
        .library(
            name: "desktop-tauri-macos",
            type: .static,
            targets: ["desktop-tauri-macos"]
        )
    ],
    dependencies: [
        .package(
            url: "https://github.com/brendonovich/swift-rs",
            exact: "1.0.7"
        )
    ],
    targets: [
        .target(
            name: "desktop-tauri-macos",
            dependencies: [
                .product(name: "SwiftRs", package: "swift-rs")
            ],
            path: "src-swift",
            swiftSettings: ProcessInfo.processInfo.environment["APP_STORE"]
                != nil ? [.define("APP_STORE")] : []
        )
    ]
)
