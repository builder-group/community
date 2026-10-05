# Swift Conventions

Apply these defaults to Swift and SwiftUI code.

- Use `PascalCase` filenames matching the primary nominal type. Focused helper files may own top-level functions.
- Organize SwiftUI views as properties and derived values, UI, then actions. Extract private computed view sections when they improve readability.
- Use `// MARK: - UI` and `// MARK: - Actions` sparingly in larger views
- Confirm suspected compiler failures with the owning project build when editor diagnostics disagree

## Native Boundaries

Apply these constraints to Rust-callable Swift and platform integrations.

- Preserve `_cdecl` exports, signatures, ownership, and return conventions, updating Rust declarations together when contracts change
- Keep `SRString` conversion and nullable pointer handling explicit where the bridge uses them
- Keep AppKit, WebKit, and Accessibility mutations on their required thread
- Keep run-loop ownership, monitor lifetime, and cancellation explicit
- Restrict `nonisolated(unsafe)` to boundaries that require it
