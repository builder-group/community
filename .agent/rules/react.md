# React Conventions

Apply these defaults to React components, following local exceptions.

- Prefer `export const ComponentName: React.FC<TProps> = (props) => { ... }` and destructure props at the top
- Keep each component with its props type immediately below it, followed by component-owned constants or variants
- Call React hooks through the `React.` namespace
- Group related declarations by responsibility. In larger components, use setup, state, derived values, actions, effects, and UI as a guide rather than a strict order. Use `// MARK: -` sections only when they help navigation.
- Use `useMemo` or `useCallback` when computation cost or stable identity matters. Do not wrap every derived value or handler.
- Keep tightly coupled helper components in the same file. Extract dense JSX event logic into named handlers.
- For feature-library state and forms, follow [state-and-forms.md](state-and-forms.md)

## TanStack Router

Use function declarations for route-owned components referenced before declaration by route objects, such as `RouteComponent`, `RootComponent`, `ShellComponent`, and `NotFoundComponent`.
