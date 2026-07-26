# Migration Guide

## 0.1.1 to 0.1.2

`feature-fetch` now re-exports only `Ok`, `Err`, and `TResult`. Import additional tuple utilities directly from `tuple-result`:

```ts
import { Err, Ok, type TResult } from 'feature-fetch';
import { mapOk, unwrapOr } from 'tuple-result';
```

## 0.0.x to 0.1.0

`feature-fetch` now uses the shared `.with(feature())` composition model from `feature-core`. The core client is still a tuple-result based fetch wrapper, but feature setup, option names, response helpers, and error classes changed.

### Replace `with*` Helpers With Features

Old feature helpers such as `withApi`, `withOpenApi`, `withGraphQL`, `withRetry`, `withDelay`, `withCache`, and `withGraphQLCache` were removed.

Use feature factories with `.with(...)` instead:

```ts
import { apiFeature, createFetchClient, retryFeature } from 'feature-fetch';

const client = createFetchClient({ baseUrl: 'https://api.example.com' }).with(
  apiFeature(),
  retryFeature()
);
```

Convenience constructors are still available for common clients:

```ts
import {
  createApiFetchClient,
  createGraphQLFetchClient,
  createOpenApiFetchClient
} from 'feature-fetch';
```

### Rename Client Options

Several setup options were renamed:

| Old option                 | New option       |
| -------------------------- | ---------------- |
| `prefixUrl`                | `baseUrl`        |
| `fetchProps`               | `requestInit`    |
| `beforeRequestMiddlewares` | `prepareRequest` |
| `requestMiddlewares`       | `middleware`     |
| `middlewareProps`          | `meta`           |

```ts
// old
const client = createApiFetchClient({
  prefixUrl: 'https://api.example.com',
  fetchProps: { credentials: 'include' },
  requestMiddlewares: [authMiddleware]
});

// new
const client = createApiFetchClient({
  baseUrl: 'https://api.example.com',
  requestInit: { credentials: 'include' },
  middleware: [authMiddleware]
});
```

The low-level `_baseFetch(path, method, options)` helper was removed. Use `request(method, path, options)`.

### Move Bodies Into Options

Body methods now take the request body inside the options object.

```ts
// old
await api.post('/posts', { title: 'Hello' });
await api.del('/posts/{postId}', { pathParams: { postId: '42' } });

// new
await api.post('/posts', { body: { title: 'Hello' } });
await api.delete('/posts/{postId}', { pathParams: { postId: '42' } });
```

`del()` was renamed to `delete()`. REST and OpenAPI clients also expose `options`, `head`, and `trace`.

### Update Response Handling

REST, OpenAPI, and GraphQL helpers now return the success data by default.

```ts
// old
const postResult = await api.get<Post>('/posts/{postId}', { pathParams });
const post = postResult.unwrap().data;

// new
const postResult = await api.get<Post>('/posts/{postId}', { pathParams });
const post = postResult.unwrap();
```

Use `withResponse: true` when you still need the native `Response` object:

```ts
const postResult = await api.get<Post>('/posts/{postId}', {
  pathParams,
  withResponse: true
});

const { data, response } = postResult.unwrap();
```

GraphQL `query()` and `mutate()` follow the same rule. `queryRaw()` and `mutateRaw()` return the GraphQL envelope.

### Update Error Imports

`exceptions/*` was renamed to `errors/*`.

`RequestError` was replaced by `HttpError`, and `isStatusCode` was replaced by `hasStatusCode`.

Old:

```ts
import { isStatusCode, RequestError } from 'feature-fetch';
```

New:

```ts
import { hasStatusCode, HttpError } from 'feature-fetch';
```

Non-OK HTTP responses now produce `HttpError` with code `#ERR_HTTP_STATUS`. JSON error body codes are no longer promoted to `error.code`.

`FetchError` now uses `{ message, cause }`. The old `{ description, throwable }` shape and `.throwable` property were removed.

### Review Runtime Changes

- `Content-Type` is no longer added to bodyless requests.
- Empty successful responses parse as `undefined` instead of failing JSON parsing.
- GraphQL requests omit `variables` when no variables are provided.
- `cacheFeature` uses `maxAgeMs` instead of `maxAge` and adds `client.cache.clear()` and `client.cache.invalidate()`.
- `withGraphQLCache` mutation invalidation was removed.
- `retryFeature` adds network error delay options and `shouldRetryResponse`.

### Deep Imports

Helpers under old internal folders such as `helper/*`, `exceptions/*`, and split `types/*` were reorganized. Use the package root exports unless a subpath is documented.
