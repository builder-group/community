# Cx Pattern Rules

Use `*Cx.ts` and `*Cx.tsx` files for feature context objects that group related state and actions for a feature or view.

## Enforce

- Use `Cx` for the managing instance of a feature, view, or mode
- Prefer a class for a `Cx` by default
- Keep a `Cx` focused on one feature boundary or one view boundary
- Expose stateful fields as readonly `$`-prefixed state members and feature operations as methods
- Keep a `Cx` local to the component tree when that is enough; pass it by prop when the ownership is local and clear
- Add a React context wrapper only when the `Cx` is shared broadly enough that prop drilling becomes noisy
- Keep the React context wrapper small when it exists: create context, provider, and `useFeatureCx()` hook
- Split specialized variants into separate `*Cx.ts` files when a feature has distinct modes

## Avoid

- Do not put rendering logic inside a `Cx`
- Do not expose mutable implementation details that callers should not coordinate directly
- Do not grow one `Cx` into a grab-bag for unrelated subfeatures
- Do not default to an interface when one concrete class is enough
- Do not default to React context when the `Cx` only manages one local feature area
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
export interface TEditorCx {
	readonly $text: TState<string, []>;
	save(): Promise<void>;
}

const ReactEditorCx = React.createContext<TEditorCx | null>(null);

export const EditorCxProvider: React.FC<TEditorCxProviderProps> = (props) => {
	const { value, children } = props;
	return <ReactEditorCx.Provider value={value}>{children}</ReactEditorCx.Provider>;
};

export function useEditorCx<GCx extends TEditorCx>(): GCx {
	const cx = React.useContext(ReactEditorCx) as GCx | null;
	if (cx == null) {
		throw new Error('useEditorCx must be used within an EditorCxProvider');
	}
	return cx as GCx;
}

interface TEditorCxProviderProps {
	value: TEditorCx;
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
