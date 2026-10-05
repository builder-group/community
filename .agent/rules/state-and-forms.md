# State and Forms

Use this guide for application code consuming `feature-state`, `feature-react`, and `feature-form`. Consult the [feature-state](https://github.com/builder-group/community/blob/develop/packages/feature-state/README.md), [feature-react](https://github.com/builder-group/community/blob/develop/packages/feature-react/README.md), and [feature-form](https://github.com/builder-group/community/blob/develop/packages/feature-form/README.md) READMEs for API details.

## State Ownership

- Name state values with a `$` prefix and keep unrelated concerns in separate atoms
- Keep shared state and actions outside components. Component-local state can remain local.
- Use `createComputed` for reusable derived state owned outside a render. Keep render-only derivations in the consuming component.
- Add features only where needed. Keep write-oriented features on source states.
- Prefer public mutation APIs in application code. Do not mirror feature state into React state unless it is an intentional separate draft.

## React Subscriptions

- Use `useFeatureState` when rendering or passing the raw value. Use `useCompute` when only a derived slice is needed.
- If already subscribed to the raw value, derive cheap labels and booleans locally instead of adding overlapping subscriptions
- Keep `useCompute` callbacks pure, include external props or local values in `deps`, and consider equality when returning fresh collections
- Use `useListener` for change side effects and `useSubscriber` when the current value must also be handled on mount, instead of subscribing only to run an effect
- For conditional subscriptions, pass a nullable state instead of calling hooks conditionally
- Use `useEventCallback` when a stable `Cx` or other long-lived owner retains a callback that must see current props or state

## Forms

- Use `useForm` for a small form owned by one component. Isolate field or row subscriptions in larger forms.
- Keep `useFormField` uncontrolled unless React needs to render the live value
- Use state subscriptions for display-only or action-only rows. Reserve `useFormField` for rows binding an input.
