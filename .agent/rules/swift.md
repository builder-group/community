# Swift Rules

Write Swift and SwiftUI code so views stay easy to scan, split, and maintain.

## Enforce

- Use `PascalCase` for Swift files and make the primary type match the file name
- Keep SwiftUI views in a simple top-to-bottom flow: stored properties, UI, then actions
- Use `// MARK: - UI` and `// MARK: - Actions` sparingly in larger views that benefit from structure
- Keep view sections in private computed properties when that makes the body easier to read
- Prefer descriptive names for booleans, view sections, and actions
- Trust Xcode builds over editor-only Swift language-server errors when they disagree

## Avoid

- Do not add more and more `// MARK: -` sections when the view should be split instead
- Do not keep large chunks of inline view code in `body` when a named section would read better
- Do not use generic names like `section`, `data`, or `save` when the purpose can be stated clearly
- Do not treat editor false positives as real compile failures without checking Xcode

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
