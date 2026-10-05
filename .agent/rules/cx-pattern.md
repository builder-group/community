# Cx Ownership

Apply this guide to `*Cx.ts` / `*Cx.tsx` and features that need a stable managing instance.

- Introduce a `Cx` when grouping related state, actions, subscriptions, or lifecycle under a stable owner makes the feature easier to reason about. Size alone is not a reason.
- Prefer a concrete class focused on one feature, view, flow, form, or integration
- Expose reactive state as readonly `$`-prefixed members and operations as methods. Keep implementation details private.
- Keep rendering outside the `Cx`
- Split distinct modes into separate classes when their ownership or behavior diverges

## React Integration

These conventions apply when a `Cx` is owned by a React component tree.

- Keep the instance stable and pass it by prop when ownership is local
- Add React context only when sharing makes prop drilling noisy. Keep context, provider, and `useXxxCx()` focused.
- For external listeners or async setup, expose `mount(): () => void` and call it from the owning component or provider's effect
- Start external subscriptions in lifecycle setup rather than the constructor
- Guard async setup after awaits so disposal prevents state changes or leaked subscriptions

Outside React, follow the owning request or runtime lifecycle.
