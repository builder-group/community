# Comment Rules

Use comments sparingly. Prefer clear code and names first.

## Enforce

- Add comments only when they explain **why**, a constraint, or domain behavior
- Keep comments useful beyond the current task or refactor
- Place the comment directly above the code it explains
- Use `// MARK: -` sparingly as a file-level or large-structure navigation aid, mainly in long files
- Use doc comments only when they add information the signature does not
- Omit the trailing period in a short single-line regular comment
- Use a trailing period in doc comments and in comments with multiple sentences
- Use plain punctuation, never em dashes (—)

## Avoid

- Do not restate what the code already says
- Do not add comments above a cluster when the cluster is already obvious from the code
- Do not use `// MARK: -` inside ordinary functions or small local flows
- Do not document session history, refactor history, or rejected alternatives
- Do not use comments as a substitute for good naming
- Do not repeat type information that is already obvious from the code

## Examples

### Good

```ts
// Process in batches so we stay under the rate limit
for (const chunk of chunks(items, 100)) {
	await submit(chunk);
}
```

```ts
// Load the record once so validation and writes use the same snapshot
const record = await loadRecord(recordId);
if (record == null) {
	throw new Error('Record not found');
}
```

```ts
// MARK: - Readers

export async function loadRecord(id: string): Promise<{ id: string } | null> {
	// ...
}

// MARK: - Writers

export async function saveRecord(record: { id: string }): Promise<void> {
	// ...
}
```

```rust
/// Store the finished range. Open ranges keep `ended_at` as `NULL`.
pub async fn insert_range(...) -> Result<i64>
```

### Avoid

```ts
function processRecord(record: TRecord): void {
	// MARK: - Validation

	if (!record.name.length) {
		return;
	}

	// ...
}
```
