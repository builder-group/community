# Migration Guide

## 0.0.x to 0.1.0

`feature-react` now follows the newer `feature-state` and `feature-form` APIs. State features use `.with(feature())`, form registration uses `input(...)`, and several hooks have simpler signatures.

### State Features Use `.with(...)`

`withLocalStorage` and `withGlobalBind` were removed.

Use feature factories on the state:

```ts
import { localStorageFeature } from 'feature-react/state';
import { createState } from 'feature-state';

const tasks = createState<string[]>([]).with(localStorageFeature('tasks'));
```

```ts
import { globalBindFeature } from 'feature-react/state';

const count = createState(0).with(globalBindFeature('count'));
```

`globalBindFeature` binds the state being extended. It no longer binds an arbitrary value.

### Update `useCompute`

`useCompute` now passes raw state values to the compute function.

```ts
// old
useCompute(count, ({ value }) => value * 2, [], { isEqual });

// new
useCompute(count, (value) => value * 2, [], isEqual);
```

`useCombinedCompute` was removed. Pass a tuple of states to `useCompute`:

```ts
const total = useCompute([subtotal, tax] as const, ([subtotalValue, taxValue]) => {
  return subtotalValue + taxValue;
});
```

If the old compute function depended on `prevValue` or `background`, move that logic to `useListener`.

### Update Listener Hooks

`useListener` and `useSubscriber` no longer accept dependency arrays or listener options.

```ts
useListener(count, ({ value }) => {
  console.log(value);
});
```

The hooks keep the latest callback through a stable callback ref. Async callbacks are accepted, but async cleanup return values are not awaited as cleanup.

### Update Form Registration

`useForm` now accepts a form instance. It no longer accepts a form factory or dependency array.

The response changed from `register` to `input`:

```tsx
// old
const { register } = useForm(form);

return <input {...register('email')} />;

// new
const { input } = useForm(form);

return <input {...input('email')} />;
```

`registerFormField` and `TRegisterFormFieldResponse` were removed. Use `getFieldInputProps` for lower-level input prop creation.

For non-string fields or string-union fields, provide `format` and `parse`:

```tsx
const { input } = useForm(form);

<input
  {...input('age', {
    format: (value) => String(value),
    parse: (value) => Number(value)
  })}
/>;
```

### Use `useFormField` For Focused Field State

`useFormField` subscribes to one field and is uncontrolled by default.

```tsx
const email = useFormField(form, 'email');

return (
  <>
    <input {...email.input()} />
    {email.status.type === 'invalid' ? <span>{email.status.errors[0]?.message}</span> : null}
  </>
);
```

`value` exists only when you pass `{ controlled: true }`.

### Update Status Reads

`useForm().status(name)` returns the status state, not the current status value.

Use `useFormField(...)`, or subscribe to the status state with `useFeatureState`:

```tsx
const emailStatus = useFeatureState(form.fields.email.status);
```

### Removed State Exports

These exports were removed from `feature-react/state`: `useCombinedCompute`, `useFeatureStateWithMiddleware`, `useSelector`, `withGlobalBind`, `withLocalStorage`, `TFeatureStateMiddleware`, `TUseFeatureStateMiddlewareOptions`, `TUseListenerOptions`, and `TUseSubscriberOptions`.
