# Cx Pattern Rules

Use this rule when editing `*Cx.ts` or `*Cx.tsx` files, or when shared state, actions, subscriptions, or lifecycle need a stable owner outside one component. A `Cx` can own a bounded feature, view, flow, form, mode, or tightly coupled component group.

## Enforce

- Use `Cx` for the managing instance of a bounded feature, view, flow, form, mode, or tightly coupled component group
- Introduce a new `Cx` only when state, actions, subscriptions, or lifecycle need a stable owner outside one component
- Prefer a class for a `Cx` by default
- Keep a `Cx` focused on one bounded ownership area
- Expose stateful fields as readonly `$`-prefixed state members and actions or operations as methods
- Keep a `Cx` local to the component tree when that is enough; pass it by prop when the ownership is local and clear
- Add a React context wrapper only when the `Cx` is shared broadly enough that prop drilling becomes noisy
- Keep the React context wrapper small when it exists: create context, provider, and `useXxxCx()` hook
- When a `Cx` owns external listeners or async setup, expose `mount(): () => void` and call it from the provider's `React.useEffect`
- Guard async `mount()` work after awaits before mutating state or adding cleanup
- Split specialized variants into separate `*Cx.ts` files when one ownership area has distinct modes

## Avoid

- Do not put rendering logic inside a `Cx`
- Do not introduce a `Cx` only because a component or file is large
- Do not expose mutable implementation details that callers should not coordinate directly
- Do not grow one `Cx` into a grab-bag for unrelated ownership areas
- Do not default to an interface when one concrete class is enough
- Do not default to React context when the `Cx` only manages one local component area
- Do not start external subscriptions in a constructor when provider lifecycle should own cleanup
- Do not mix many access styles in the same area, like part props, part context, and part globals, without a reason
- Do not bury the provider and hook inside unrelated component files

## Examples

### Good

```ts
export class EditorCx {
  public readonly $text = createState('');
  public readonly $isSaving = createState(false);

  public async save(): Promise<void> {
    this.$isSaving.set(true);
    try {
      await persistText(this.$text.get());
    } finally {
      this.$isSaving.set(false);
    }
  }

  public reset(): void {
    this.$text.set('');
  }
}
```

```tsx
export const EditorPane: React.FC = () => {
  const cx = React.useMemo(() => new EditorCx(), []);

  return <EditorView cx={cx} />;
};
```

```tsx
const ReactEditorCx = React.createContext<EditorCx | null>(null);

export const EditorCxProvider: React.FC<TEditorCxProviderProps> = (props) => {
  const { value, children } = props;
  return <ReactEditorCx.Provider value={value}>{children}</ReactEditorCx.Provider>;
};

export function useEditorCx(): EditorCx {
  const cx = React.useContext(ReactEditorCx);
  if (cx == null) {
    throw new Error('useEditorCx must be used within an EditorCxProvider');
  }
  return cx;
}

interface TEditorCxProviderProps {
  value: EditorCx;
  children: React.ReactNode;
}
```

### Avoid

```ts
export class AppCx {
  public readonly $text = createState('');
  public readonly $theme = createState('light');
  public readonly $search = createState('');
  public readonly $user = createState<TUser | null>(null);

  public async save(): Promise<void> {}
  public async logout(): Promise<void> {}
  public async search(): Promise<void> {}
  public toggleTheme(): void {}
}
```
