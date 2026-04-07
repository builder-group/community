# Feature State Rules

Use `feature-state` and `feature-react/state` as the default state pattern in projects that depend on them.

## Enforce

- Keep state atom-based; one state should represent one clear piece of data
- Name states with a `$` prefix like `$count`, `$status`, or `$selectedId`
- Use `useFeatureState(state)` when the component needs the raw value and should re-render on changes
- Use `useCompute(state, compute)` when the component needs a derived value from one state
- Use `useCombinedCompute(states, compute)` when the view depends on multiple states together
- Use `useListener(state, callback)` for side effects driven by state changes
- Keep state creation and state mutation helpers outside components unless the state is truly local to one component

## Avoid

- Do not put many unrelated fields into one state object when separate atoms would stay clearer
- Do not read `state._v` directly in app code when a hook or public API fits
- Do not use `useFeatureState` and then derive large computed values inline on every render when `useCompute` or `useCombinedCompute` would express the intent better
- Do not use `useListener` for simple rendering; keep it for effects and subscriptions
- Do not create ad-hoc React state when the feature already has a matching `feature-state` source of truth

## Examples

### Good

```tsx
const label = useCompute($seconds, ({ value = 0 }) => formatSeconds(value));
const isDisabled = useCombinedCompute(
	[$status, $selectedId] as const,
	([{ value: status = 'idle' }, { value: selectedId = null }]) => {
		return status === 'loading' || selectedId == null;
	}
);

useListener(
	$status,
	({ value }) => {
		if (value === 'error') {
			showToast('Something went wrong');
		}
	},
	[showToast]
);
```

### Avoid

```tsx
const status = useFeatureState($status);
const selectedId = useFeatureState($selectedId);
const isDisabled = status === 'loading' || selectedId == null;

React.useEffect(() => {
	if (status === 'error') {
		showToast('Something went wrong');
	}
}, [status, showToast]);
```
