# Feature React Rules

Use `feature-react` as the React binding layer for `feature-state` and `feature-form`.
Apply `.agent/rules/feature-state.md` for state shape and mutation design; use this rule
for React subscription boundaries, derived rendering, and form bindings.

## Enforce

### State Subscriptions

- Import state hooks from `feature-react/state`; import form hooks from `feature-react/form`
- Use `useFeatureState($state)` when the component renders, branches on, or passes through the raw state value
- Use `useCompute($state, compute)` for one derived render value; pass an array literal when the value depends on multiple states
- Pass `deps` to `useCompute` for props or local values read by `compute` outside the subscribed states
- Keep `useCompute` callbacks and custom equality functions pure; prefer primitive or existing-reference results, and pass `isEqual` for fresh objects or arrays when re-render suppression matters
- Derive cheap labels, booleans, and errors as local constants only when the component already needs the raw state value
- Use `useListener($state, callback)` for future-change side effects; use `useSubscriber($state, callback)` when the side effect must also run with the current value on mount
- Pass `null` or `undefined` to state hooks for conditional subscriptions instead of calling hooks conditionally
- Use `useEventCallback` for callbacks retained by a `Cx` or other long-lived owner so the owner can stay stable while the callback sees latest values

### Form Bindings

- Use `useForm(form)` when one small component owns the whole form; split larger forms into field or row components that call `useFormField(form, key)`
- Treat the `status(key)` helper returned by `useForm(form)` as a status state; pass it to `useFeatureState` before rendering its value
- Keep `useFormField` uncontrolled by default; pass `{ controlled: true }` to the hook only when React must render the live field value
- Pass `format` and `parse` to the returned `input()` helper for non-string fields and string-literal union fields
- Render field-specific errors from the field status returned by `useFormField` or `useFeatureState(form.fields.key.status)`
- Subscribe display-only or action-only form rows with `useFeatureState(form.fields.key)` and `useFeatureState(form.fields.key.status)` instead of `useFormField`

## Avoid

- Do not use `useCompute` as a catch-all view-model builder that returns a fresh object on every source change
- Do not use `useFeatureState` just to derive one scalar, label, or boolean for rendering; use `useCompute`
- Do not split cheap booleans and labels into many overlapping `useCompute` calls when the component already subscribes to the raw value
- Do not use `useFeatureState` only to trigger a `React.useEffect` side effect; use `useListener` or `useSubscriber`
- Do not pass a changing callback into a long-lived `Cx` or subscription owner without `useEventCallback`
- Do not call `feature-react` hooks conditionally
- Do not use `useForm` around a large form when isolated field or row components should own their subscriptions
- Do not use `useFormField` only to read a field in a row that does not bind an input
- Do not make ordinary text inputs controlled by default; uncontrolled field bindings avoid per-keystroke React renders
- Do not omit `format` and `parse` for non-string fields or string-literal union fields

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

```tsx
const SaveButton: React.FC<TSaveButtonProps> = (props) => {
  const { $selectedId, $status } = props;
  const isDisabled = useCompute(
    [$status, $selectedId],
    ([status, selectedId]) => status === 'saving' || selectedId == null
  );

  return (
    <button disabled={isDisabled} type="button">
      Save
    </button>
  );
};
```

```tsx
const VisibleItemCount: React.FC<TVisibleItemCountProps> = (props) => {
  const { $items, query } = props;
  const count = useCompute(
    $items,
    (items) => items.filter((item) => item.name.includes(query)).length,
    [query]
  );

  return <span>{count}</span>;
};
```

```tsx
const ItemList: React.FC<TItemListProps> = (props) => {
  const { $items } = props;
  const items = useFeatureState($items);

  const hasItems = items.length > 0;
  const label = hasItems ? `${items.length} items` : 'No items';

  return (
    <section>
      <h2>{label}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
};
```

```tsx
const AgeField: React.FC<TAgeFieldProps> = (props) => {
  const { form } = props;
  const age = useFormField(form, 'age');

  return (
    <label>
      Age
      <input
        {...age.input({
          format: (value) => String(value),
          parse: (value) => Number(value)
        })}
        type="number"
      />
      {age.status.type === 'invalid' ? <span>{age.status.errors[0]?.message}</span> : null}
    </label>
  );
};
```

### Avoid

```tsx
const items = useFeatureState($items);
const label = items.length > 0 ? `${items.length} items` : 'No items';

return <span>{label}</span>;
```

```tsx
const saveButtonView = useCompute([$status, $selectedId], ([status, selectedId]) => ({
  disabled: status === 'saving' || selectedId == null,
  label: status === 'saving' ? 'Saving' : 'Save'
}));
```

```tsx
const name = useFormField(form, 'name', { controlled: true });
const age = useFormField(form, 'age');

return (
  <>
    <input {...name.input()} />
    <input {...age.input()} type="number" />
  </>
);
```
