# Rust Rules

Write Rust that is explicit, predictable, and easy to maintain in workspace crates and native bridge code.

## Enforce

### General

- Keep modules focused and use `snake_case` for files and module names
- Prefer clear types and small functions over clever control flow
- Follow the local file style for `return`; use explicit returns for early exits, `cfg` branches, and longer control flow, but do not churn simple tail expressions
- Use doc comments on public APIs when they add behavior, constraints, or edge cases
- Use `// MARK: -` only for major file-level sections in larger files
- Return early for invalid states and error cases
- Keep the main logic near the top and place supporting structs, enums, and helpers close below the code that uses them
- Prefer options or config structs over scattering top-level constants through the file
- Keep domain structs and DTOs descriptively named
- Keep imports compact and easy to scan; prefer grouped imports from the same path when that improves readability

### Native Boundaries

- Keep `unsafe` and FFI calls narrow; validate raw pointers and nullability before conversion or native calls
- Keep Rust FFI signatures, symbol names, ownership, and string conversion assumptions aligned with the native implementation
- Map JSON, `Option`, and platform failures into explicit domain errors instead of panics or silent defaults
- Keep platform dispatch explicit with `cfg` gates and clear unsupported-platform behavior

## Avoid

- Do not restate obvious mechanics in comments
- Do not use `// MARK: -` between small local items or inside ordinary function bodies
- Do not hide important branching inside dense nested matches or conditionals without a reason
- Do not front-load files with long blocks of constants, types, or helpers before the main logic
- Do not use vague type names like `Data`, `Info`, or `Manager` when the domain can be named directly
- Do not let `unsafe` spread beyond the smallest FFI boundary that needs it
- Do not use wildcard imports except in narrow test preludes or FFI/generated binding modules

## Examples

### Good

```rust
// MARK: - Item Repository

pub fn create_options(input: CreateOptionsInput) -> CreateOptions {
	return CreateOptions {
		timeout_ms: input.timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS),
		retry_count: input.retry_count.unwrap_or(2)
	};
}

pub struct CreateOptionsInput {
	pub timeout_ms: Option<u64>,
	pub retry_count: Option<u32>,
}

pub struct CreateOptions {
	pub timeout_ms: u64,
	pub retry_count: u32,
}

const DEFAULT_TIMEOUT_MS: u64 = 5_000;
```

### Avoid

```rust
pub struct CreateOptionsInput {
	pub timeout_ms: Option<u64>,
	pub retry_count: Option<u32>,
}

const DEFAULT_TIMEOUT_MS: u64 = 5_000;

pub struct CreateOptions {
	pub timeout_ms: u64,
	pub retry_count: u32,
}

pub fn create_options(input: CreateOptionsInput) -> CreateOptions {
	return CreateOptions {
		timeout_ms: input.timeout_ms.unwrap_or(DEFAULT_TIMEOUT_MS),
		retry_count: input.retry_count.unwrap_or(2)
	};
}
```
