# Rust Conventions

Apply these defaults to workspace crates and Rust application code.

- Use `snake_case` for files and modules
- Follow local return style. Keep explicit early exits and avoid rewriting simple tail expressions.
- Keep the main logic near the top, with supporting types and helpers close to their owner
- Prefer config structs for related options. Keep imports grouped and avoid wildcard imports outside tests or generated/FFI bindings.
- Use public API doc comments for non-obvious contracts and `// MARK: -` only for major file sections

## Native Boundaries

Apply these constraints when editing native or FFI integrations.

- Keep `unsafe` narrow and validate pointer/nullability assumptions at the boundary
- Preserve matching symbols, signatures, ownership, and string conversion contracts across languages
- Map expected platform failures to explicit errors rather than panics or silent defaults
- Keep platform dispatch and unsupported-platform behavior explicit with `cfg` gates
