# Feature Fetch Rules

Use `feature-fetch` as the typed API layer. Prefer consistent client setup and explicit error handling.

## Enforce

- Create clients in dedicated environment or library files, not inside components
- Use generated `paths` types for `createOpenApiFetchClient(...)`
- Use declared response, error, body, and params types for `createApiFetchClient(...)` call sites where generated API types do not exist
- Compose only the features you need, in a clear order
- Handle `tuple-result` values explicitly; prefer the tuple pattern from `.agent/rules/tuple-result.md`
- Distinguish network failures from request failures when behavior differs
- Keep request configuration explicit: base URL, headers, and auth; use `signal` for cancellation
- Keep GraphQL operations in dedicated files and use `gql`

## Avoid

- Do not use raw `fetch` where a typed client should exist
- Do not use `any` for API payloads
- Do not scatter ad-hoc clients across components
- Do not ignore the error branch of a `tuple-result` value

## Example

```ts
const [isItemOk, itemErr, item] = await api.get<Item>('/items/{itemId}', {
  pathParams: { itemId }
});

if (!isItemOk) {
  if (itemErr instanceof NetworkError) {
    throw new AppError('Failed to connect', { cause: itemErr });
  }

  throw itemErr;
}

return item;
```
