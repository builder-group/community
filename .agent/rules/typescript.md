# TypeScript Rules

This file covers TypeScript- and TSX-specific enforcement.

## Enforce

- Keep `strict`-friendly code. Prefer explicit types at module boundaries.
- Prefer `interface` for object shapes. Use `type` for unions, mapped types, and aliases.
- Use clear naming conventions consistently:
  - `T*` for project types and interfaces
  - `E*` for enums
  - `S*` for schemas
- Prefer function declarations for named functions; use arrow functions for callbacks and inline functions
- For React components, follow `.agent/rules/react.md` instead of the function-declaration default
- Use explicit null checks with `== null` when handling both `null` and `undefined`
- Prefer `??` over `||` for fallback values
- Keep conditionals flat; use guard clauses for invalid states
- Prefer named booleans for complex checks
- Use `!items.length` for empty checks and `items.length > 0` for non-empty checks
- Prefer inline defaults for simple option values instead of extracting a constant too early
- Use `camelCase` for ordinary module-level values; use `UPPER_SNAKE_CASE` for immutable protocol constants, lookup tables, static query documents, and numeric constants when surrounding code does
- Use `export * from` in barrel files
- Keep supporting types, config, and helpers close to the function, class, or exported value that owns or uses them
- Let the main exported API lead a file unless a dependency must be declared first
- Treat generated files such as `*.gen.ts` as outputs; change the source definition and regenerate instead

## Avoid

- Do not use `any` unless there is a narrow, explicit reason
- Do not rely on truthiness when nullability matters
- Do not use nested ternaries for non-trivial logic
- Do not use static class constants as a default pattern
- Do not use function expressions for named top-level functions without a reason
- Do not group unrelated code at the file level just for ordering
- Do not manually edit generated TypeScript files

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
