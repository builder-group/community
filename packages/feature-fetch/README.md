<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-fetch/.github/banner.svg" alt="feature-fetch banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-fetch">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-fetch.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-fetch">
        <img src="https://img.shields.io/npm/dt/feature-fetch.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`feature-fetch` is a typed fetch client where every request returns `[isOk, err, value]` instead of throwing. Start with a REST or OpenAPI client, then add retry, cache, GraphQL, or custom behavior with `.with()`.

- Every request returns `[isOk, err, value]`: no try/catch, no unhandled rejections
- Add REST helpers, OpenAPI type safety, GraphQL, retry, cache, or delay with `.with()`
- Unknown OpenAPI paths, missing params, and wrong bodies fail at compile time
- Build custom features on the same hook model: push auth, logging, or tracing into the client

```ts
import { createApiFetchClient, retryFeature } from 'feature-fetch';

const api = createApiFetchClient({
	baseUrl: 'https://api.example.com/v1',
	headers: { Authorization: `Bearer ${token}` }
}).with(retryFeature({ maxRetries: 3 }));

const [isOk, err, post] = await api.get<{ id: string; title: string }>('/posts/{postId}', {
	pathParams: { postId: '123' }
});

if (isOk) {
	console.log(post.title); // typed as { id: string; title: string }
} else {
	console.error(err.message); // NetworkError | HttpError | FetchError
}
```

## Install

```bash
npm install feature-fetch
```

## Usage

`createApiFetchClient` is the quickest starting point. It creates a client with REST helpers already installed:

```ts
import { createApiFetchClient } from 'feature-fetch';

const api = createApiFetchClient({
	baseUrl: 'https://api.example.com/v1',
	headers: { Authorization: `Bearer ${token}` }
});

const [isOk, err, post] = await api.get<{ id: string; title: string }>('/posts/{postId}', {
	pathParams: { postId: '123' }
});

if (isOk) {
	console.log(post.title);
} else {
	console.error(err.message);
}
```

Compose features with `createFetchClient` when you want control over which features are installed and in what order:

```ts
import { apiFeature, cacheFeature, createFetchClient, retryFeature } from 'feature-fetch';

const api = createFetchClient({
	baseUrl: 'https://api.example.com/v1'
}).with(apiFeature(), retryFeature(), cacheFeature({ maxAgeMs: 30_000 }));
```

## Client

### `createFetchClient(options)`

Creates a base fetch client with a single `request()` method. All built-in features build on top of this method.

```ts
const client = createFetchClient({
	baseUrl: 'https://api.example.com',
	headers: { Authorization: `Bearer ${token}` }
});

const [isOk, err, data] = await client.request<{ status: string }>('GET', '/health');
```

| Option            | Default                | Description                                                         |
| ----------------- | ---------------------- | ------------------------------------------------------------------- |
| `baseUrl`         | `''`                   | Prepended to every request path                                     |
| `headers`         | `{}`                   | Default headers applied to every request                            |
| `fetch`           | `globalThis.fetch`     | Custom fetch implementation                                         |
| `requestInit`     | `{}`                   | Default `RequestInit` values except `body`, `method`, and `headers` |
| `pathSerializer`  | `serializePathParams`  | Serializes `{path}` parameters                                      |
| `querySerializer` | `serializeQueryParams` | Serializes query parameters                                         |
| `bodySerializer`  | `serializeBody`        | Serializes request bodies                                           |
| `prepareRequest`  | `[]`                   | Hooks called before URL and body are built                          |
| `prepareResponse` | `[]`                   | Hooks called after a response is received, before parsing           |
| `middleware`      | `[]`                   | Wrappers around the final fetch call                                |

**Request options**

Each call to `request()` and the method helpers from installed features accept these options:

| Option         | Default  | Description                                                                       |
| -------------- | -------- | --------------------------------------------------------------------------------- |
| `pathParams`   | `{}`     | Values for `{param}` placeholders in the path                                     |
| `queryParams`  | `{}`     | Appended to the URL as a query string                                             |
| `headers`      |          | Per-request headers merged after client defaults. `null` removes a default header |
| `body`         |          | Request body. Objects are JSON-serialized when no `Content-Type` is set           |
| `parseAs`      | `'json'` | Response parser: `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'stream'`     |
| `withResponse` | `false`  | When `true`, success value is `{ data, response }` instead of `data`              |
| `signal`       |          | `AbortSignal` for cancellation                                                    |
| `meta`         | `{}`     | Request-scoped metadata passed to `prepareRequest` and `prepareResponse` hooks    |
| `middleware`   | `[]`     | Request-scoped middleware appended after client middleware                        |
| `baseUrl`      |          | Overrides the client base URL for this request                                    |
| `requestInit`  |          | Overrides native `RequestInit` values except `body`, `method`, and `headers`      |

`FormData` bodies automatically have `Content-Type` removed so the browser can add the required multipart boundary.

## Built-in Features

### `apiFeature()`

Adds typed HTTP method helpers: `get`, `post`, `put`, `patch`, `delete`, `options`, `head`, and `trace`.

```ts
import { apiFeature, createFetchClient } from 'feature-fetch';

const api = createFetchClient({ baseUrl: '/api' }).with(apiFeature());

const [isOk, err, post] = await api.post<{ id: string }>('/posts', {
	body: { title: 'Hello' }
});

await api.delete('/posts/{postId}', { pathParams: { postId: '123' } });
```

`createApiFetchClient(options)` is shorthand for `createFetchClient(options).with(apiFeature())`.

### `openApiFeature<paths>()`

Adds HTTP helpers fully typed from an OpenAPI schema. Unknown paths, missing required params, wrong bodies, and unexpected fields are rejected at compile time.

Generate the `paths` type from your schema:

```bash
npx openapi-typescript ./schema.yaml -o ./schema.d.ts
```

```ts
import { createOpenApiFetchClient } from 'feature-fetch';
import type { paths } from './schema';

const api = createOpenApiFetchClient<paths>({
	baseUrl: 'https://api.example.com/v1'
});

const [isOk, err, pet] = await api.get('/pets/{petId}', {
	pathParams: { petId: 123 }
});

const [isCreated, createErr, created] = await api.post('/pets', {
	body: { name: 'Jeff', photoUrls: [] }
});
```

Schema-declared header parameters are typed in `headers`. Extra transport headers such as `Authorization` remain allowed alongside them.

`createOpenApiFetchClient<paths>(options)` is shorthand for `createFetchClient(options).with(openApiFeature<paths>())`.

### `graphqlFeature()`

Adds `query()`, `mutate()`, and raw variants for GraphQL POST requests. Set `baseUrl` to the full GraphQL endpoint.

```ts
import { createGraphQLFetchClient, gql } from 'feature-fetch';

const graphql = createGraphQLFetchClient({
	baseUrl: 'https://api.example.com/graphql'
});

const getUser = gql`
	query GetUser($id: ID!) {
		user(id: $id) {
			id
			name
		}
	}
`;

const [isOk, err, result] = await graphql.query<
	{ user: { id: string; name: string } },
	{ id: string }
>(getUser, { variables: { id: '123' } });

if (isOk) {
	console.log(result.data.user.name); // result is { data, extensions?, response }
}
```

`query()` and `mutate()` unwrap GraphQL `errors` arrays into a `GraphQLError` on the error branch. Use `queryRaw()` and `mutateRaw()` to receive the raw `{ data, errors, extensions }` response without that unwrapping.

`createGraphQLFetchClient(options)` is shorthand for `createFetchClient(options).with(graphqlFeature())`.

### `retryFeature(options)`

Retries failed requests. Network errors use exponential backoff. HTTP responses are retried when `shouldRetryResponse` returns `true`, defaulting to HTTP 429. Respects `Retry-After` and `x-rate-limit-reset` response headers when present.

```ts
import { createApiFetchClient, retryFeature } from 'feature-fetch';

const api = createApiFetchClient({ baseUrl: '/api' }).with(retryFeature({ maxRetries: 3 }));
```

| Option                     | Default    | Description                                   |
| -------------------------- | ---------- | --------------------------------------------- |
| `maxRetries`               | `3`        | Number of retries after the initial request   |
| `networkError.baseDelayMs` | `1000`     | Base delay in ms for exponential backoff      |
| `networkError.maxDelayMs`  | `30000`    | Maximum delay in ms for network-error backoff |
| `shouldRetryResponse`      | HTTP `429` | Predicate for retryable HTTP responses        |

### `cacheFeature(options)`

Caches successful GET responses in memory. Respects `Cache-Control` response headers. Skips requests with `Authorization` or `Cookie` headers to avoid mixing user-specific responses.

```ts
import { cacheFeature, createApiFetchClient } from 'feature-fetch';

const api = createApiFetchClient({ baseUrl: '/api' }).with(cacheFeature({ maxAgeMs: 30_000 }));

// Clear all cached responses
api.cache.clear();

// Invalidate entries matching a predicate
api.cache.invalidate((key) => key.includes('/posts'));
```

| Option        | Default                   | Description                                                                               |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `maxAgeMs`    | `300000` (5 minutes)      | Maximum age in milliseconds                                                               |
| `getCacheKey` | GET URL, no auth headers  | Returns the cache key for a request, or `null` to skip caching                            |
| `shouldCache` | OK, non-private responses | Returns whether a response should be cached. Skips `no-store`, `no-cache`, and `private`. |

### `delayFeature(ms)`

Waits the given number of milliseconds before forwarding each request. Useful in tests and demos.

```ts
import { createApiFetchClient, delayFeature } from 'feature-fetch';

const api = createApiFetchClient({ baseUrl: '/api' }).with(delayFeature(500));
```

## Extending with Features

Fetch features are regular `feature-core` features. A feature can add new methods, push hooks or middleware into the client config, or both.

```ts
import { defineFeature, type TFeature } from 'feature-core';
import type { TFetchClientBase } from 'feature-fetch';

export function authFeature(getToken: () => string): TAuthFeature {
	return defineFeature<TAuthFeature>({
		key: 'auth',
		install(client: TFetchClientBase) {
			client._config.prepareRequest.push((cx) => {
				cx.headers.authorization = `Bearer ${getToken()}`;
			});

			return {};
		}
	});
}

type TAuthFeature = TFeature<'auth', object>;
```

Three extension points are available in `_config`:

- `prepareRequest`: hooks that mutate the request context before URL and body are built
- `middleware`: wrappers around the final `fetch` call (receives the next function and returns a new one)
- `prepareResponse`: hooks that can inspect or replace the raw response before parsing

Feature order matters because middleware is applied outermost-first. Install `cacheFeature` before `retryFeature` so cache is checked first and the retry logic only runs on cache misses.

## Errors

All request methods return a `tuple-result`. The error branch is one of three types:

| Error          | When it occurs                                                             |
| -------------- | -------------------------------------------------------------------------- |
| `NetworkError` | The fetch call threw before any HTTP response was received                 |
| `HttpError`    | The server returned a non-2xx response                                     |
| `FetchError`   | Request preparation, serialization, middleware, or response parsing failed |

```ts
import { FetchError, hasStatusCode, HttpError, NetworkError } from 'feature-fetch';

const [isOk, err, user] = await api.get<User>('/users/123');

if (!isOk) {
	if (hasStatusCode(err, 404)) {
		console.error('Not found');
	} else if (err instanceof NetworkError) {
		console.error('Network error:', err.message);
	} else if (err instanceof HttpError) {
		console.error('HTTP error:', err.status, err.data); // err.data is the parsed error body
	} else if (err instanceof FetchError) {
		console.error('Client error:', err.code, err.message); // err.code e.g. '#ERR_SERIALIZE_BODY'
	}
}
```

`hasStatusCode(error, code)` narrows to `HttpError` and checks the status code.

## Examples

- [Vanilla Open-Meteo](https://github.com/builder-group/community/tree/develop/examples/feature-fetch/vanilla/open-meteo)

## FAQ

### How do I add auth headers to every request?

Pass static headers in the client options:

```ts
const api = createApiFetchClient({
	baseUrl: 'https://api.example.com/v1',
	headers: { Authorization: `Bearer ${token}` }
});
```

For dynamic tokens that may change between requests, use a `prepareRequest` hook instead. See [Extending with Features](#extending-with-features) for an `authFeature` example that calls `getToken()` on each request.

### What is the difference between `middleware` and `prepareRequest`?

Use `prepareRequest` to mutate the structured request context: headers, path, query params, body, and metadata. It runs before the URL is built and before the body is serialized.

Use `middleware` for transport-level concerns that wrap the fetch call itself: retry, caching, timing, and tracing. Middleware receives `(next) => (url, requestInit) => Promise<Response>` and can call `next` zero or more times.

If you need to read or modify the final URL or `RequestInit`, use middleware. If you need to modify request inputs in a structured way, use `prepareRequest`.

### Can I type the error response body?

Yes. Pass it as the second generic parameter on any request method:

```ts
interface ApiError {
	code: string;
	message: string;
}

const [isOk, err, user] = await api.get<User, ApiError>('/users/123');

if (!isOk && err instanceof HttpError) {
	console.error(err.data.code); // typed as ApiError
}
```

`err.data` is typed as `ApiError` when the error is an `HttpError`. It remains `unknown` for `NetworkError` and `FetchError`.

### In what order should I install features?

Install features in the order you want them to intercept requests, outermost first. For common combinations:

- `cacheFeature` before `retryFeature`: cache is checked first; retry only runs on cache misses
- `retryFeature` before a logging middleware: retry attempts are each logged individually

Features that add methods (`apiFeature`, `openApiFeature`, `graphqlFeature`) can go in any position relative to middleware features.

### How do I mock requests in tests?

Pass a custom `fetch` function to `createFetchClient`. Return any `Response` you need:

```ts
const api = createApiFetchClient({
	baseUrl: '/api',
	fetch: async () => new Response(JSON.stringify({ id: '1' }), { status: 200 })
});
```

For more control, use `delayFeature` in development or a mock server in integration tests.

### How do I cancel a request?

Pass an `AbortSignal` in the request options:

```ts
const controller = new AbortController();

const [isOk, err, data] = await api.get('/posts', {
	signal: controller.signal
});

// Cancel from anywhere
controller.abort();
```

A cancelled request returns `NetworkError` on the error branch.

### Why is `@0no-co/graphql.web` a dependency if GraphQL is opt-in?

`@0no-co/graphql.web` is imported dynamically only when a `DocumentNode` input needs to be printed to a string. If you pass operation strings directly or never install `graphqlFeature()`, modern bundlers tree-shake that path out of the bundle.
