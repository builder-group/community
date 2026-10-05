# TypeScript Conventions

Apply these defaults to TypeScript and TSX, following local exceptions. React component declarations follow `react.md`.

- Prefer `interface` for object shapes and `type` for unions, mapped types, and aliases
- Prefix project types and interfaces with `T`, enums with `E`, and schemas with `S`
- Prefer declarations for named functions. Use arrows for callbacks and inline functions.
- Use `== null` / `!= null` when checking both null and undefined, and `??` for nullish fallbacks
- Use `!items.length` for empty checks and `items.length > 0` for non-empty checks
- Prefer named booleans for complex conditions. Use guard clauses for invalid or error cases, keeping the main success path last.
- Prefer inline defaults for simple options. Do not extract constants or abstractions without a concrete use.
- Use `camelCase` for functions and variables, and `PascalCase` for classes and React components. Keep established `UPPER_SNAKE_CASE` conventions for fixed constants.
- Use `PascalCase` filenames for class and component modules, and `kebab-case` for other modules. Preserve framework-required filenames.
- Let the main exported API lead the file unless a dependency must be declared first. Keep its supporting types, config, and helpers nearby, grouped by owner.
- Use `export * from` in barrel files
- Keep explicit types at module boundaries. Use `any` only for a narrow, explained exception.
- Change generated files through their source definitions and regeneration commands

## Tuple Results

For application code using `tuple-result`, prefer domain-named destructuring such as `[isUserOk, userErr, user]`, handling the error branch before using the value. Use helpers when they simplify the call site.

Consult the [tuple-result README](https://github.com/builder-group/community/blob/develop/packages/tuple-result/README.md) for API contracts. Preserve framework, validation-library, and package-specific result shapes.
