# TypeScript Rules

This file covers TypeScript- and TSX-specific enforcement.

## Enforce

- Keep `strict`-friendly code. Prefer explicit types at module boundaries
- Use `interface` for object shapes that may be extended; use `type` for unions, mapped types, and aliases
- Use clear naming conventions consistently:
  - `T*` for project types and interfaces
  - `E*` for enums
  - `S*` for schemas
- Prefer function declarations for named functions; use arrow functions for callbacks and inline functions
- Use explicit null checks with `== null` when handling both `null` and `undefined`
- Prefer `??` over `||` for fallback values
- Keep conditionals flat; use guard clauses for invalid states
- Prefer named booleans for complex checks
- Use `!items.length` for empty checks and `items.length > 0` for non-empty checks
- Prefer config objects, props, or options with defaults over static constants when values belong to feature behavior
- Prefer inline defaults for simple option values instead of extracting a constant too early
- Use `UPPER_CASE` only for true stable module-level constants
- Use `export * from` in barrel files

## Avoid

- Do not use `any` unless there is a narrow, explicit reason
- Do not rely on truthiness when nullability matters
- Do not use nested ternaries for non-trivial logic
- Do not use static class constants as a default pattern
- Do not use `UPPER_CASE` for ordinary variables or class members
- Do not use function expressions for named top-level functions without a reason

## Example

```ts
export function createClient(options: TCreateClientOptions = {}): TClient {
	const { timeoutMs = 5000, baseUrl = 'https://api.example.com' } = options;
	return {
		timeoutMs,
		baseUrl
	};
}

interface TCreateClientOptions {
	timeoutMs?: number;
	baseUrl?: string;
}

interface TClient {
	timeoutMs: number;
	baseUrl: string;
}
```
