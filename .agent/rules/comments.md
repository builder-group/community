# Comment Rules

Use comments sparingly. Prefer clear code and names first.

## Enforce

- Add regular comments only when they explain **why**, a constraint, or domain behavior
- Keep comments useful beyond the current task or refactor
- Place the comment directly above the code it explains
- Omit the trailing period in a short single-line regular comment
- Use plain punctuation, never em dashes (—)
- Use `// MARK: -` sparingly as a file-level or large-structure navigation aid, mainly in long files
- On public or shared APIs, use doc comments to describe caller-facing behavior, constraints, side effects, and non-obvious return or error behavior
- Start doc comments with a single sentence in active voice and end it with a period

## Avoid

- Do not restate what the code already says in regular comments
- Do not use comments as a substitute for good naming
- Do not add comments above a cluster when the cluster is already obvious from the code
- Do not use `// MARK: -` inside ordinary functions or small local flows
- Do not document session history, refactor history, or rejected alternatives
- Do not repeat type information that is already obvious from the code
- Do not add doc comments to private helpers unless they are part of a shared API surface
- Do not fill doc comments with implementation details or obvious parameter-by-parameter paraphrases

## Examples

### Good

```ts
// Sort once so the UI stays stable across refreshes
const sortedItems = items.slice().sort(compareItems);
for (const item of sortedItems) {
	renderItem(item);
}
```

```rust
/// Returns the display label for a status code.
pub fn format_status(code: StatusCode) -> &'static str
```

### Avoid

```ts
// Sort the items
const sortedItems = items.slice().sort(compareItems);
```

```ts
/**
 * Formats the status.
 * @param code The status code.
 */
export function formatStatus(code: StatusCode): string;
```
