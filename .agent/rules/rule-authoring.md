# Rule Authoring Rules

Write rules so humans can maintain them and agents can apply them without guessing.
Rules are decision aids, not documentation.

## Enforce

- Keep each rule file focused on one language, library, pattern, or concern
- Start with a short scope sentence that says what the rule owns
- Use the structure `## Enforce`, `## Avoid`, and optional `## Example` or `## Examples` by default
- Use subheaders inside `## Enforce` or `## Avoid` only when one rule file owns distinct subdomains that would be harder to scan as one flat list
- Write bullets as decisions: `Use X when Y`, `Do not use X when Y`, or `Prefer X over Y when Z`
- Add a rule only when it prevents a likely bad edit, resolves an ambiguity, or captures a repeated repo pattern
- Write rules as the target standard for the code they cover; explicitly call out legacy exceptions or migration requirements
- Make ownership boundaries explicit when two rules could otherwise overlap
- Let more specific package, pattern, or framework rules override broader language or style rules unless a rule says otherwise
- Add cross-references only for ownership boundaries, conflicts, or required companion rules
- Prefer short bullets over handbook prose
- Keep examples short, generic, and self-contained
- Use `## Example` when one example is enough; use `## Examples` with `### Good` and `### Avoid` when contrast teaches a decision
- Add comments inside examples only when the comment itself teaches part of the rule
- Update or remove examples when the rule changes
- Put procedural workflows in `.agent/commands/`; keep `.agent/rules/` focused on coding decisions

## Avoid

- Do not add rules that only say to be clean, simple, maintainable, or consistent without a concrete decision
- Do not add a rule from one app-specific occurrence unless the pattern is intended repo-wide
- Do not repeat the same rule in many files without a strong reason
- Do not add cross-references just because another rule is generally relevant
- Do not add subheaders just to make a short rule list look organized
- Do not add provider-specific metadata or syntax to shared `.agent/rules/*.md` files
- Do not keep outdated examples that teach old patterns
- Do not add long explanatory prose when one rule bullet and one example would do
- Do not create a new rule file when a small addition to an existing rule is enough
- Do not let examples carry unnecessary domain context, names, or business logic
- Do not optimize a rule file for completeness at the cost of fast scanning

## Examples

### Good

````md
# Feature React Rules

Use `feature-react` as the React binding layer for `feature-state` and `feature-form`.
Apply `.agent/rules/feature-state.md` for state shape and mutation design.

## Enforce

- Use `useCompute($state, compute)` when the component only needs one derived render value
- Use `useFeatureState($state)` when the component renders or passes the raw state value

## Avoid

- Do not use `useFeatureState` just to derive one scalar, label, or boolean for rendering

## Examples

### Good

```tsx
const ItemCountLabel: React.FC<TItemCountLabelProps> = (props) => {
  const { $items } = props;
  const label = useCompute($items, (items) =>
    items.length > 0 ? `${items.length} items` : 'No items'
  );

  return <span>{label}</span>;
};
```

### Avoid

```tsx
const ItemCountLabel: React.FC<TItemCountLabelProps> = (props) => {
  const { $items } = props;
  const items = useFeatureState($items);
  const label = items.length > 0 ? `${items.length} items` : 'No items';

  return <span>{label}</span>;
};
```
````

### Avoid

```md
# React Rules

Use good React patterns. Keep components clean, readable, simple, and consistent
with the codebase. Avoid overengineering and make sure the code is maintainable.
Use hooks correctly and split components when needed.
```
