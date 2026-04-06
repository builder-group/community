# Feature Fetch Rules

Use `feature-fetch` as the typed API layer. Prefer consistent client setup and explicit error handling.

## Enforce

- Create clients in dedicated environment or library files, not inside components
- Use generated or declared API types for paths, params, and responses
- Compose only the features you need, in a clear order
- Handle `tuple-result` values explicitly; prefer the tuple pattern from `.agent/rules/tuple-result.md`
- Distinguish network failures from request failures when behavior differs
- Keep request configuration explicit: base URL, headers, timeout, auth
- Keep GraphQL operations in dedicated files and use `gql`

## Avoid

- Do not use raw `fetch` where a typed client should exist
- Do not use `any` for API payloads
- Do not scatter ad-hoc clients across components
- Do not ignore the error branch of a `tuple-result` value

## Example

```ts
const itemId = 'item-123';
const itemResult = await apiClient.get('/items/{itemId}', {
	pathParams: { itemId }
});

const [isItemOk, itemErr, item] = itemResult;
if (!isItemOk) {
	if (itemErr instanceof NetworkError) {
		throw new AppError('Failed to connect', { cause: itemErr });
	}

	throw itemErr;
}

return item.data;
```
