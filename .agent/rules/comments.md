# Comment Rules

Use comments to expose code structure or preserve context that the code cannot communicate clearly on its own. For prose style within comments, see `.agent/rules/writing.md`.

## Enforce

- Prefer concrete language: state what happens and, when useful, why it matters
- Use complete sentences when they improve clarity. Short phrases are fine when their meaning is already clear, especially for phase comments and labels.
- Use short `//` phase comments when they make a longer function easier to scan. Describe what the block accomplishes without narrating its individual statements.
- Use `// Note:` for supplementary non-obvious context, constraints, compatibility behavior, or intentional omissions
- Use `// MARK: - <name>` sparingly to divide a large file into major regions
- Use `// TODO:` for specific unfinished work. State the required action or the condition that should trigger it.
- Use TSDoc (`/** ... */`) for public or exported TypeScript contracts when their names and signatures do not communicate enough. Use the language-equivalent documentation syntax elsewhere.
- Describe what a documented contract does first, then include non-obvious constraints, side effects, or error behavior when needed
- Start doc comments with an active-voice sentence and end full sentences with a period
- Add a reason to TypeScript, lint, or compiler suppression directives using the tool's supported syntax
- Add a direct reference link when behavior depends on a non-obvious external contract that future maintainers may need to verify
- Write comments for future maintainers without relying on current task, session, or refactor context
- Place comments directly above the code they explain
- Keep regular comments short and direct. Omit the trailing period when a regular comment contains one sentence, even when it wraps across lines. Use sentence punctuation when it contains multiple sentences.
- Use consecutive `//` lines for multi-line regular comments. Reserve `/** ... */` for documentation comments.

## Avoid

- Do not add phase comments for small steps or blocks whose purpose is already obvious
- Do not use `// Note:` to restate what the following code does
- Do not use comments as a substitute for clear naming or appropriate function boundaries
- Do not narrate implementation statements line by line
- Do not compress an explanation into shorthand that makes the reader reconstruct what happens
- Do not join separate ideas with a semicolon when two sentences would be clearer
- Do not use `// MARK: -` inside ordinary functions or small files
- Do not leave vague TODOs such as `// TODO: improve this`
- Do not document task history, rejected alternatives, or temporary reasoning
- Do not repeat type information already expressed by the code
- Do not add doc comments to obvious contracts or merely for consistency
- Do not fill doc comments with implementation details or parameter-by-parameter paraphrases
- Do not use ordinary `/* ... */` comments

## Examples

### Good

```ts
/** Synchronizes local records and publishes the new version only after persistence succeeds. */
export async function synchronizeRecords(): Promise<void> {
  // Establish a consistent local baseline
  const snapshot = await loadSnapshot();
  const pendingChanges = await loadPendingChanges(snapshot.version);

  // Reconcile local and upstream changes
  const upstreamChanges = await fetchUpstreamChanges(snapshot.cursor);
  const nextSnapshot = reconcileChanges(snapshot, pendingChanges, upstreamChanges);

  // Persist and publish the synchronized state
  // Note: Observers reload the published version immediately after notification
  await saveSnapshot(nextSnapshot);
  await publishSnapshotVersion(nextSnapshot.version);
}
```

```ts
// MARK: - Reading

export function loadValue(id: string): TValue | null {
  return values.get(id) ?? null;
}

export function listValues(): TValue[] {
  return [...values.values()];
}

// MARK: - Writing

export function saveValue(value: TValue): void {
  values.set(value.id, value);
}

export function deleteValue(id: string): void {
  values.delete(id);
}
```

```ts
// TODO: replace full synchronization with cursor-based updates when the upstream API supports cursors
await synchronizeAllItems();
```

```ts
// @ts-expect-error: The upstream declaration omits this supported runtime value
configureRuntime({ mode: 'isolated' });
```

```ts
// Note: Cached permissions can be stale, so they only decide whether the existing credential
// can be reused. Permissions returned by the server are validated separately.
```

### Avoid

```ts
// Check whether the cached value exists
if (cachedValue != null) {
  // Return the cached value
  return cachedValue;
}
```

```ts
// Note: Fetch and cache a current value
return fetchAndCacheValue();
```

```ts
// Note: Cached permissions gate reuse; upstream permissions are authoritative
```

```ts
/** Returns whether the user is authenticated. */
export function isAuthenticated(): boolean;
```
