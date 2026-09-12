// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Mado",
    platforms: [
        .macOS(.v10_15)
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "Mado",
            type: .static,
            targets: ["Mado"]
        ),
        .executable(
            name: "browser-ax-probe",
            targets: ["BrowserAXProbe"]
        ),
    ],
    dependencies: [
        // Dependencies declare other packages that this package depends on.
        .package(
            url: "https://github.com/brendonovich/swift-rs",
            revision: "e0b4a5f444a4204efa8e8270468318bc7836fcce"
        )
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "Mado",
            dependencies: [
                .product(name: "SwiftRs", package: "swift-rs")
            ],
            path: "src-swift"
        ),
        .testTarget(
            name: "MadoTests",
            dependencies: ["Mado"],
            path: "tests-swift"
        ),
        .executableTarget(
            name: "BrowserAXProbe",
            path: "tools/browser-ax-probe"
        ),
    ]
)
