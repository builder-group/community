# Swift Rules

Write Swift, SwiftUI, and native bridge code so UI, platform, and FFI boundaries stay clear.

## Enforce

### General

- Use `PascalCase` for Swift files; when a file has one primary nominal type, make the type match the file name
- Allow focused helper files with top-level functions when the file owns one native capability or bridge concern
- Prefer descriptive names for booleans, view sections, actions, and native bridge helpers
- Trust Xcode builds over editor-only Swift language-server errors when they disagree

### SwiftUI

- Keep SwiftUI views in a simple top-to-bottom flow: stored properties, UI, then actions
- Use `// MARK: - UI` and `// MARK: - Actions` sparingly in larger views that benefit from structure
- Keep view sections in private computed properties when that makes the body easier to read

### Native Bridge

- Preserve `_cdecl` symbol names, argument types, ownership, and return conventions when touching Rust-callable Swift
- Keep `SRString` conversion and nullable pointer handling explicit at the bridge boundary
- Keep AppKit, WebKit, and Accessibility mutations on the expected main thread
- Make run-loop ownership, background monitor lifetime, and cancellation behavior clear in monitoring code
- Use `nonisolated(unsafe)` only at boundaries that require it, and keep the surrounding code small enough to audit

## Avoid

- Do not add more and more `// MARK: -` sections when the view should be split instead
- Do not keep large chunks of inline view code in `body` when a named section would read better
- Do not use generic names like `section`, `data`, or `save` when the purpose can be stated clearly
- Do not treat editor false positives as real compile failures without checking Xcode
- Do not rename `_cdecl` exports or change bridge signatures without updating the Rust declarations that call them
- Do not move AppKit, WebKit, or Accessibility work off the required thread just to simplify control flow
- Do not spread `nonisolated(unsafe)` through ordinary Swift code

## Examples

### Good

```swift
struct SettingsView: View {
    @State private var isEnabled = false

    // MARK: - UI

    var body: some View {
        VStack {
            toggleSection
        }
    }

    private var toggleSection: some View {
        Toggle("Enabled", isOn: $isEnabled)
    }

    // MARK: - Actions

    private func saveChanges() {
        // Persist changes after the user confirms
    }
}
```

### Avoid

```swift
struct SettingsView: View {
    // MARK: - Properties
    @State private var enabled = false

    // MARK: - UI
    var body: some View {
        Form {
            Toggle("Enabled", isOn: $enabled)
        }
    }

    // MARK: - Toggle UI
    // MARK: - Footer UI
    // MARK: - Actions
    private func save() {}
}
```
