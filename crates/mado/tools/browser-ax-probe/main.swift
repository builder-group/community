import AppKit
import ApplicationServices
import Foundation

let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.count <= 1 else {
    fail("Usage: swift run browser-ax-probe [output-path]")
}
guard AXIsProcessTrusted() else {
    fail(
        "Accessibility permission is required. Grant it to your terminal, then run the probe again."
    )
}

let outputPath = arguments.first
writeStatus("Open the probe page before capturing: \(BrowserAXProbe.sampleURL)")
writeStatus("Focus the browser window. Capturing in 3 seconds...")
Thread.sleep(forTimeInterval: 3)

guard let application = NSWorkspace.shared.frontmostApplication else {
    fail("No frontmost application was found.")
}
guard let bundleId = application.bundleIdentifier else {
    fail("The frontmost application has no bundle identifier.")
}

let applicationElement = AXUIElementCreateApplication(
    application.processIdentifier
)
guard let windowElement = axFocusedWindow(from: applicationElement) else {
    fail("The frontmost application has no Accessibility focused window.")
}

let report = BrowserAXProbe(
    application: application,
    bundleId: bundleId,
    windowElement: windowElement
).renderMarkdown()

if let outputPath {
    do {
        try report.write(toFile: outputPath, atomically: true, encoding: .utf8)
        writeStatus("Wrote probe output to \(outputPath)")
    } catch {
        fail("Could not write probe output: \(error)")
    }
} else {
    print(report)
}

private func writeStatus(_ message: String) {
    FileHandle.standardError.write(Data("\(message)\n".utf8))
}

private func fail(_ message: String) -> Never {
    writeStatus("Error: \(message)")
    exit(EXIT_FAILURE)
}
