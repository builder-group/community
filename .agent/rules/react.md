# React Rules

Follow the established project React pattern unless the local code clearly does something else.

## Enforce

- Prefer `export const ComponentName: React.FC<TProps> = (props) => { ... }` for components
- Destructure props at the top of the component and define prop interfaces near the bottom of the file
- Use `React.useState`, `React.useMemo`, `React.useCallback`, `React.useEffect`, and related hooks through the `React.` namespace
- Keep larger components in a predictable top-to-bottom flow: props, state and refs, derived values, `// MARK: - Actions`, `// MARK: - Effects`, `// MARK: - UI`
- Use `React.useMemo` for meaningful derived collections, computed view state, or grouped derived values
- Use `React.useCallback` for handlers, imperative actions, and functions passed to children or hooks when that matches the surrounding style
- Keep helper subcomponents in the same file when they are tightly coupled to the parent view
- Use short JSX comments only when they help readers skim a dense visual structure

## Avoid

- Do not switch to function declarations for ordinary components when the surrounding code uses typed arrow components
- Do not mix bare hook imports with `React.useX` in the same file
- Do not move prop interfaces above the component unless the file already follows that pattern
- Do not add `// MARK: -` sections to small components that do not need them
- Do not add `useMemo` or `useCallback` when the code becomes more indirect without a clear readability benefit
- Do not inline dense event logic directly in JSX when a named callback would read better

## Examples

### Good

```tsx
export const ItemList: React.FC<TItemListProps> = (props) => {
	const { items, selectedId, onSelect } = props;
	const [focusedId, setFocusedId] = React.useState<string | null>(null);

	const visibleLabels = React.useMemo(() => {
		const result: Array<{ id: string; label: string }> = [];
		for (const item of items) {
			if (!item.hidden) {
				result.push({ id: item.id, label: item.label });
			}
		}
		return result;
	}, [items]);

	// MARK: - Actions

	const handleSelect = React.useCallback(
		(id: string) => {
			onSelect(id);
		},
		[onSelect]
	);

	// MARK: - Effects

	React.useEffect(() => {
		setFocusedId(selectedId);
	}, [selectedId]);

	// MARK: - UI

	return (
		<ul>
			{visibleLabels.map((item) => (
				<li key={item.id}>
					<button onClick={() => handleSelect(item.id)}>
						{item.label}
						{item.id === focusedId ? ' selected' : ''}
					</button>
				</li>
			))}
		</ul>
	);
};

interface TItemListProps {
	items: Array<{
		id: string;
		label: string;
		hidden: boolean;
	}>;
	selectedId: string | null;
	onSelect: (id: string) => void;
}
```

### Avoid

```tsx
function ItemList({ items, selectedId, onSelect }: TItemListProps) {
	return (
		<ul>
			{items.map((index) => (
				<li
					key={index.id}
					onClick={() => {
						if (!index.hidden) {
							onSelect(index.id);
						}
					}}
				>
					{index.label}
					{index.id === selectedId ? ' selected' : ''}
				</li>
			))}
		</ul>
	);
}
```
