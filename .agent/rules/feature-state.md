# Feature State Rules

Use `feature-state` for framework-independent state models. Apply
`.agent/rules/feature-react.md` for React subscriptions and form bindings.

## Enforce

- Keep state atom-based; one state should represent one clear piece of data
- Name states with a `$` prefix like `$count`, `$status`, or `$selectedId`
- Keep state creation and state mutation helpers outside components unless the state is truly local to one component
- Use `createComputed(...)` for reusable derived state that should exist outside one render
- Keep render-only derivations in `feature-react` subscriptions instead of promoting them to shared state
- Install features with `.with(...)` only where the state needs that capability

## Avoid

- Do not put many unrelated fields into one state object when separate atoms would stay clearer
- Do not read or mutate `state._v` directly when a public API fits
- Do not mirror a feature-state value into ad-hoc React state unless the UI draft is intentionally separate
- Do not create shared computed states for labels or booleans used by only one component render
- Do not install write-oriented features on computed states; keep them on source states

## Examples

### Good

```ts
const $items = createState<TItem[]>([]);
const $filter = createState('');
const $visibleItems = createComputed([$items, $filter] as const, ([items, filter]) => {
  return items.filter((item) => item.name.includes(filter));
});

export function renameItem(id: string, name: string): void {
  $items.set((items) => items.map((item) => (item.id === id ? { ...item, name } : item)));
}
```

### Avoid

```ts
const $listPage = createState({
  filter: '',
  items: [] as TItem[],
  label: 'No items',
  selectedId: null as string | null,
  status: 'idle'
});

$listPage._v.items.push(nextItem);
$listPage.notify();
```
