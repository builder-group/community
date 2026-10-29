# Swift Conventions

Apply these defaults to Swift and SwiftUI code.

- Use `PascalCase` filenames matching the primary nominal type. Focused helper files may own top-level functions.
- Organize SwiftUI views as properties and derived values, UI, then actions. Extract private computed view sections when they improve readability.
- Use `// MARK: - UI` and `// MARK: - Actions` sparingly in larger views
- Confirm suspected compiler failures with the owning project build when editor diagnostics disagree

## Native Boundaries

- Keep UIKit, AppKit, WebKit, SwiftUI, and Accessibility mutations on their required thread
- Keep run-loop ownership, native resource lifetime, and cancellation explicit
- Restrict `nonisolated(unsafe)` to boundaries that require it

### Rust Bridges

Apply these constraints when Swift is called from Rust.

- Preserve `_cdecl` exports, signatures, ownership, and return conventions, updating Rust declarations together when contracts change
- Keep `SRString` conversion and nullable pointer handling explicit where the bridge uses them

### Expo Modules

Apply these constraints when Swift implements Expo modules.

- Keep module names, method signatures, return values, and event payloads aligned with TypeScript declarations
- Clean up owned native resources and listeners when the module or view is destroyed
