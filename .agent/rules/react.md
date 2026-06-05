# React Rules

Follow the established project React pattern unless the local code clearly does something else.

## Enforce

- Prefer `export const ComponentName: React.FC<TProps> = (props) => { ... }` for components
- Destructure props at the top of the component
- In component files, each component owns a local cluster: component body, then its props interface, then its component-owned constants like variants; this cluster repeats per component
- Use `React.useState`, `React.useMemo`, `React.useCallback`, `React.useEffect`, and related hooks through the `React.` namespace
- Keep larger components in a predictable top-to-bottom flow: props, state and refs, derived values, `// MARK: - Actions`, `// MARK: - Effects`, `// MARK: - UI`
- Use `React.useMemo` for meaningful derived collections, computed view state, or grouped derived values from props or React-local state
- Use `useCompute` from `feature-react/state` for derived render values from `feature-state` sources
- Use `React.useCallback` for handlers, imperative actions, and functions passed to children or hooks
- Keep helper subcomponents in the same file when they are tightly coupled to the parent view
- Use short JSX comments only when they help readers skim a dense visual structure
- Use `&_svg` for components that own their icon subtree: children are only text/raw icons, or an internal wrapper renders the icon
- Use `&>svg` for slots that may receive composed UI or rich item rows, so sizing does not leak across component boundaries

### TanStack Router

- Use function declarations for route-owned components referenced by TanStack route objects before declaration, such as `RouteComponent`, `RootComponent`, `ShellComponent`, or `NotFoundComponent`

## Avoid

- Do not switch to function declarations for ordinary components when the surrounding code uses typed arrow components
- Do not hoist prop interfaces into a file header
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
    const result: { id: string; label: string }[] = [];
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
      setFocusedId(id);
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
  items: {
    id: string;
    label: string;
    hidden: boolean;
  }[];
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
