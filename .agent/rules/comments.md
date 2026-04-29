# Comment Rules

Add comments when they make the code easier to understand or maintain. Omit them when the code speaks for itself.

## Enforce

- Add regular comments to explain **why**, a constraint, domain behavior, or to orient the reader at the start of a non-obvious block
- Place the comment directly above the code it explains
- Omit the trailing period in a short single-line regular comment
- Use plain punctuation only
- Add doc comments to public and exported functions, methods, and types only when the name and signature alone do not make the behavior or contract clear; describe what it does first, then note constraints, side effects, or non-obvious return or error behavior when needed
- Start doc comments with a single sentence in active voice and end it with a period
- Use `// MARK: -` sparingly as a file-level or large-structure navigation aid, mainly in long files
- Use `// Note:` for intentional constraints, omissions, or deferrals that a reader might otherwise mistake for a bug or incomplete work
- Use `// TODO:` for known future work; keep it specific and actionable

## Avoid

- Do not use em dashes (—) in comments
- Do not restate what the code already says in regular comments
- Do not use comments as a substitute for good naming
- Do not add comments above a block when the intent is already obvious from the code
- Do not annotate every small step inside a larger block once a single higher-level comment already explains the intent
- Do not use `// MARK: -` inside ordinary functions or small local flows
- Do not document session history, refactor history, or rejected alternatives
- Do not repeat type information that is already obvious from the code
- Do not add doc comments to private helpers unless the contract is non-obvious to a caller within the same module
- Do not add doc comments just for consistency across a file; each comment should earn its place
- Do not fill doc comments with implementation details or obvious parameter-by-parameter paraphrases
- Do not frame doc comments around why the code exists or what layer uses it unless that context is necessary to call it correctly

## Examples

### Good

```ts
// Sort once so the UI stays stable across refreshes
const sortedItems = items.slice().sort(compareItems);
for (const item of sortedItems) {
	renderItem(item);
}
```

```ts
// Retry with exponential backoff; the upstream service rate-limits on burst
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
	const result = await fetchWithDelay(attempt);
	if (result.ok) return result;
}
```

```ts
/** Returns the active session, or null if the user is not authenticated. */
export function getSession(): Session | null;
```

```rust
/// Returns the display label for a status code.
pub fn format_status(code: StatusCode) -> &'static str
```

```rust
/// Loads items from the configured source.
pub fn load_items(config: &LoadConfig) -> Result<Vec<Item>, LoadItemsError>
```

```ts
export function isAuthenticated(): boolean;
```

```ts
// Note: Skips permission check here; caller is expected to pre-validate
applyChange(payload);
```

```ts
// TODO: replace with incremental sync once the API supports cursors
const items = await fetchAll(query);
```

### Avoid

```ts
// Sort the items
const sortedItems = items.slice().sort(compareItems);
```

```ts
/** Returns whether the user is authenticated. */
export function isAuthenticated(): boolean
```

```ts
/**
 * Formats the status.
 * @param code The status code.
 */
export function formatStatus(code: StatusCode): string;
```

```rust
/// This is used by the sidebar to show items quickly.
pub fn load_items(config: &LoadConfig) -> Result<Vec<Item>, LoadItemsError>
```

```rust
/// Loads items from the configured source and loops through all providers.
pub fn load_items(config: &LoadConfig) -> Result<Vec<Item>, LoadItemsError>
```
