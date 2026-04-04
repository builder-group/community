import AppKit

/// Extract a color palette from an NSImage using k-means clustering.
// Based on: https://rudrank.com/exploring-core-graphics-extract-prominent-unique-colors-uiimage
func extractColorPalette(from image: NSImage, numberOfColors: Int = 5)
    -> [ExtractedColor]
{
    // Resize image for performance (200px width, maintain aspect ratio)
    let targetWidth: CGFloat = 200
    let scale = targetWidth / image.size.width
    let targetSize = NSSize(
        width: targetWidth,
        height: image.size.height * scale
    )

    let resizedImage = NSImage(size: targetSize)
    resizedImage.lockFocus()
    image.draw(
        in: NSRect(origin: .zero, size: targetSize),
        from: NSRect(origin: .zero, size: image.size),
        operation: .copy,
        fraction: 1.0
    )
    resizedImage.unlockFocus()

    // Get CGImage for pixel access
    guard
        let cgImage = resizedImage.cgImage(
            forProposedRect: nil,
            context: nil,
            hints: nil
        )
    else {
        return []
    }

    let width = cgImage.width
    let height = cgImage.height
    let bytesPerPixel = 4
    let bytesPerRow = bytesPerPixel * width
    let bitsPerComponent = 8

    // Allocate pixel buffer
    guard let data = calloc(height * width, MemoryLayout<UInt32>.size) else {
        return []
    }
    defer { free(data) }

    // Create CGContext and draw image
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

    guard
        let context = CGContext(
            data: data,
            width: width,
            height: height,
            bitsPerComponent: bitsPerComponent,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        )
    else {
        return []
    }

    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

    // Extract pixel data (skip transparent pixels)
    let pixelBuffer = data.bindMemory(
        to: UInt8.self,
        capacity: width * height * bytesPerPixel
    )
    var pixels: [PixelData] = []

    for y in 0..<height {
        for x in 0..<width {
            let offset = ((width * y) + x) * bytesPerPixel
            let a = pixelBuffer[offset + 3]

            // Skip transparent pixels
            guard a > 127 else { continue }

            let r = pixelBuffer[offset]
            let g = pixelBuffer[offset + 1]
            let b = pixelBuffer[offset + 2]
            pixels.append(PixelData(r: Double(r), g: Double(g), b: Double(b)))
        }
    }

    guard !pixels.isEmpty else { return [] }

    // Run k-means clustering
    let clusters = kMeansCluster(
        pixels: pixels,
        k: numberOfColors,
        maxIterations: 10
    )

    // Convert to ExtractedColor, sorted by pixel count
    return
        clusters
        .map {
            ExtractedColor(
                r: $0.center.r,
                g: $0.center.g,
                b: $0.center.b,
                pixelCount: $0.points.count
            )
        }
        .sorted { $0.pixelCount > $1.pixelCount }
}

struct ExtractedColor {
    let r: Double
    let g: Double
    let b: Double
    let pixelCount: Int

    var hexString: String {
        String(format: "#%02X%02X%02X", Int(r), Int(g), Int(b))
    }

    var brightness: Double {
        max(r, g, b) / 255.0
    }

    var saturation: Double {
        let maxC = max(r, g, b)
        let minC = min(r, g, b)
        return maxC > 0 ? (maxC - minC) / maxC : 0
    }

    /// Vibrancy score: saturation weighted by brightness.
    /// Penalizes only dark colors (< 0.3 brightness) to avoid muddy blacks.
    var vibrancy: Double {
        let brightnessFactor = min(1.0, brightness / 0.3)
        return saturation * brightnessFactor
    }
}

// MARK: - K-Means Implementation

private func kMeansCluster(pixels: [PixelData], k: Int, maxIterations: Int)
    -> [Cluster]
{
    guard !pixels.isEmpty, k > 0 else { return [] }

    // Initialize clusters with random pixel centers
    var clusters: [Cluster] = []
    var usedIndices = Set<Int>()

    for _ in 0..<k {
        var index: Int
        repeat {
            index = Int.random(in: 0..<pixels.count)
        } while usedIndices.contains(index) && usedIndices.count < pixels.count

        usedIndices.insert(index)
        clusters.append(Cluster(center: pixels[index]))
    }

    // Iterate to refine clusters
    for _ in 0..<maxIterations {
        // Clear points from all clusters
        for i in 0..<clusters.count {
            clusters[i].points.removeAll()
        }

        // Assign each pixel to nearest cluster
        for pixel in pixels {
            var minDistance = Double.greatestFiniteMagnitude
            var closestIndex = 0

            for (index, cluster) in clusters.enumerated() {
                let distance = euclideanDistance(pixel, cluster.center)
                if distance < minDistance {
                    minDistance = distance
                    closestIndex = index
                }
            }
            clusters[closestIndex].points.append(pixel)
        }

        // Update cluster centers
        for i in 0..<clusters.count {
            let cluster = clusters[i]
            guard !cluster.points.isEmpty else { continue }

            let sum = cluster.points.reduce(PixelData(r: 0, g: 0, b: 0)) {
                result,
                pixel in
                PixelData(
                    r: result.r + pixel.r,
                    g: result.g + pixel.g,
                    b: result.b + pixel.b
                )
            }
            let count = Double(cluster.points.count)
            clusters[i].center = PixelData(
                r: sum.r / count,
                g: sum.g / count,
                b: sum.b / count
            )
        }
    }

    return clusters
}

private func euclideanDistance(_ p1: PixelData, _ p2: PixelData) -> Double {
    let dr = p1.r - p2.r
    let dg = p1.g - p2.g
    let db = p1.b - p2.b
    return sqrt(dr * dr + dg * dg + db * db)
}

private struct Cluster {
    var center: PixelData
    var points: [PixelData] = []
}

private struct PixelData {
    let r: Double
    let g: Double
    let b: Double
}
