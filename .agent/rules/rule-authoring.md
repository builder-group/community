# Rule Authoring Rules

Write rules so they are easy for humans to maintain and easy for agents to follow consistently.

## Enforce

- Keep each rule file focused on one language, library, or concern
- Prefer short `Enforce` and `Avoid` bullets over long handbook prose
- Use `## Example` when one example is enough; use `## Examples` with `### Good` and `### Avoid` when contrast teaches something important
- Keep examples short, self-contained, and aligned with the rule being taught
- Prefer generic examples that show the pattern clearly without unnecessary domain noise
- Add comments inside examples only when the comment itself teaches part of the rule
- Keep wording direct and enforceable
- Update or remove examples when the rule changes

## Avoid

- Do not repeat the same rule in many files without a strong reason
- Do not add provider-specific metadata or syntax to shared `.agent/rules/*.md` files
- Do not keep outdated examples that teach old patterns
- Do not add long explanatory prose when one rule bullet and one example would do
- Do not create a new rule file when a small addition to an existing rule is enough

## Examples

### Good

````md
# Comment Rules

## Enforce

- Add comments only when they explain why, a constraint, or domain behavior

## Avoid

- Do not restate what the code already says

## Examples

### Good

```ts
// Process in batches so we stay under the rate limit
for (const chunk of chunks(items, 100)) {
	await submit(chunk);
}
```
````

### Avoid

```md
# Comment Rules

Comments help readers understand the codebase and the many tradeoffs that have shaped
the current implementation over time. In general, comments should be balanced and
thoughtful, and they should explain all of the context a future reader may need.
```
