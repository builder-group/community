# Rust Rules

Write Rust that is explicit, predictable, and easy to maintain in Tauri and library code.

## Enforce

- Keep modules focused and use `snake_case` for files and module names
- Prefer clear types and small functions over clever control flow
- Prefer explicit `return` statements because they make the returned value easier to spot
- Use doc comments on public APIs when they add behavior, constraints, or edge cases
- Use `// MARK: -` only for major file-level sections in larger files
- Return early for invalid states and error cases
- Keep the main logic near the top and place supporting structs, enums, and helpers close below the code that uses them
- Prefer options or config structs over scattering top-level constants through the file
- Keep domain structs and DTOs descriptively named
- Keep imports compact and easy to scan; prefer grouped imports from the same path when that improves readability

## Avoid

- Do not restate obvious mechanics in comments
- Do not use `// MARK: -` between small local items or inside ordinary function bodies
- Do not hide important branching inside dense nested matches or conditionals without a reason
- Do not front-load files with long blocks of constants, types, or helpers before the main logic
- Do not use vague type names like `Data`, `Info`, or `Manager` when the domain can be named directly
- Do not use wildcard imports except in narrow test preludes

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
