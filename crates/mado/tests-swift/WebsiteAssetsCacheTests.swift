import XCTest

@testable import Mado

final class WebsiteAssetsCacheTests: XCTestCase {
    func testLateIconOnlyResultCannotReplaceResolvedColor() {
        let cache = WebsiteAssetsCache()
        let rich = assets(favicon: "icon", color: "#123456", resolved: true)
        _ = cache.insert(rich)
        let result = cache.insert(assets(favicon: "late icon", resolved: false))
        XCTAssertEqual(result.favicon, "icon")
        XCTAssertEqual(result.color, "#123456")
        XCTAssertEqual(cache.get(hostname: "example.com")?.color, "#123456")
    }

    func testColorRequestCanEnrichCachedIconButFailureKeepsExistingAsset() {
        let cache = WebsiteAssetsCache()
        _ = cache.insert(assets(favicon: "icon", resolved: false))
        let failed = cache.insert(assets(favicon: nil, resolved: true))
        XCTAssertEqual(failed.favicon, "icon")
        XCTAssertFalse(failed.isColorResolved)

        let enriched = cache.insert(assets(favicon: "icon", color: "#123456", resolved: true))
        XCTAssertEqual(enriched.color, "#123456")
        XCTAssertTrue(enriched.isColorResolved)
    }

    func testResolvedMissingColorDoesNotRepeatEnrichment() {
        let cache = WebsiteAssetsCache()
        _ = cache.insert(assets(favicon: "icon", resolved: true))
        let result = cache.insert(assets(favicon: "later icon", color: "#123456", resolved: true))
        XCTAssertNil(result.color)
        XCTAssertTrue(result.isColorResolved)
    }

    private func assets(favicon: String?, color: String? = nil, resolved: Bool) -> WebsiteAssets {
        WebsiteAssets(
            hostname: "example.com", favicon: favicon, color: color, isColorResolved: resolved)
    }
}
