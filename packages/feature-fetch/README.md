# `feature-fetch`
> Status: Experimental

A straightforward, typesafe, and feature-based [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) wrapper.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 6KB minified)
- **Fast**: Thin wrapper around the native [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), maintaining near-native performance
- **Modular & Extendable**: Easily extendable with features like `withRetry()`, `withOpenApi()`, ..
- **Typesafe**: Build with TypeScript for strong type safety and support for [`openapi-typescript`](https://github.com/drwpow/openapi-typescript) types
- **Standalone**: Only dependent on `fetch`, ensuring ease of use in various environments

### Motivation

Provide a typesafe, straightforward, and lightweight `fetch` wrapper that seamlessly integrates with OpenAPI schemas using `openapi-typescript`. It aims to simplify error handling by returning results in a predictable manner with [`ts-results-es`](https://github.com/lune-climate/ts-results-es#readme). Additionally, it is designed to be modular & extendable, enabling the creation of straightforward API wrappers, such as for the Google Web Fonts API (see [`google-webfonts-client`](https://github.com/inbeta-group/monorepo/tree/develop/packages/google-webfonts-client)). `feature-fetch` only depends on `fetch`, making it usable in most sandboxed environments like Figma plugins.

### Alternatives

- [wretch](https://github.com/elbywan/wretch)
- [openapi-fetch](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch)

# 📖 Usage

```ts
import { createApiFetchClient } from 'feature-fetch';

const fetchClient = createApiFetchClient({
   prefixUrl: 'https://api.example.com/v1'
});

// Send request
const result = await fetchClient.get<{ id: string }>('/blogposts/{postId}', {
    pathParams: {
       postId: '123'
   }
});

// Handle response
if (result.isOk()) {
    console.log(result.value.data); // Handle successful response
} else {
    console.error(result.error.message); // Handle error response or network exception
}

// Or unwrap the result, throwing an exception on error
try {
    const data = result.unwrap().data;
    console.log(data);
} catch (error) {
  console.error(error.message);
}
```

## `withApi()`

Enhance `feature-fetch` to create a typesafe `fetch` wrapper. This feature provides common HTTP methods (`get`, `post`, `put`, `del`) ensuring requests and responses are typed.

### Usage

1. **Create an API Fetch Client**:
   Use `createApiFetchClient` to create a fetch client with a specified base URL.

   ```ts
   import { createApiFetchClient } from 'feature-fetch';

   const fetchClient = createApiFetchClient({
       prefixUrl: 'https://api.example.com/v1'
   });
   ```

2. **Send Requests**:
   Use the fetch client to send requests, specifying the response type for better type safety.

   ```ts
   // Send request
   const result = await fetchClient.get<{ id: string }>('/blogposts/{postId}', {
      pathParams: {
          postId: '123'
      }
   });
   ```

## `withOpenApi()`

Enhance `feature-fetch` with [OpenAPI](https://www.openapis.org/) support to create a typesafe `fetch` wrapper. This feature provides common HTTP methods (`get`, `post`, `put`, `del`) that are fully typed by leveraging your OpenAPI schema using [`openapi-typescript`](https://github.com/drwpow/openapi-typescript/).

1. **Generate TypeScript Definitions**:
   Use `openapi-typescript` to generate TypeScript definitions from your OpenAPI schema.

   ```bash
   npx openapi-typescript ./path/to/my/schema.yaml -o ./path/to/my/schema.d.ts
   ```
   [More info](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-typescript)

2. **Create an OpenAPI Fetch Client**:
   Import the generated `paths` and use `createOpenApiFetchClient()` to create a fetch client.

   ```ts
   import { createOpenApiFetchClient } from 'feature-fetch';
   import { paths } from './openapi-paths';

   const fetchClient = createOpenApiFetchClient<paths>({
       prefixUrl: 'https://api.example.com/v1'
   });
   ```

3. **Send Requests**:
   Use the fetch client to send requests, ensuring typesafe parameters and responses.

   ```ts
   // Send request
   const result = await fetchClient.get('/blogposts/{postId}', {
      pathParams: {
          postId: '123'
      }
   });
   ```

## Errors

When handling API error responses (`result.isErr()`), `result` can be one of three [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) types, each representing a different kind of failure.

### `NetworkException` (extends `ServiceException`)

Indicates a failure in network communication, such as loss of connectivity or DNS issues.

```ts
if (result.isErr() && result.error instanceof NetworkException) {
  console.error('Network error:', result.error.message);
}
```

### `RequestException` (extends `ServiceException`)

Occurs when the server returns a response with a status code indicating an error (e.g., 4xx or 5xx).

```ts
if (result.isErr() && result.error instanceof RequestException) {
  console.error('Request error:', result.error.message, 'Status:', result.error.status);
}
```

### `ServiceException`

A general exception type that can encompass other error scenarios not covered by `NetworkException` or `RequestException`, for example when the response couldn't be parsed, ..

```ts
if (result.isErr() && result.error instanceof ServiceException) {
  console.error('Service error:', result.error.message);
}
```

### Example

```ts
if (result.isErr()) {
    const error = result.error;

    if (isStatusCode(error, 404)) {
        console.error('Not found:', error.data)
    }

    if (error instanceof NetworkException) {
        console.error('Network error:', error.message);
    } else if (error instanceof RequestException) {
        console.error('Request error:', error.message, 'Status:', error.status);
    } else if (error instanceof ServiceException) {
        console.error('Service error:', error.message);
    } else {
        console.error('Unexpected error:', error);
    }
} 
```

## Features

### `withRetry()`

Retries each request using an exponential backoff strategy if a network exceptions (`NetworkException`) or HTTP `429` (Too Many Requests) response occur.

```ts
import { createApiFetchClient, withRetry } from 'feature-fetch';

const fetchClient = withRetry(createApiFetchClient({
    prefixUrl: 'https://api.example.com/v1'
}), {
    maxRetries: 3
});
```

- **`maxRetries`**: Maximum number of retry attempts

### `withDelay()`

Delays each request by a specified number of milliseconds before sending it.

```ts
import { createApiFetchClient, withDelay } from 'feature-fetch';

const fetchClient = withDelay(createApiFetchClient({
    prefixUrl: 'https://api.example.com/v1'
}), 1000);
```

- **`delayInMs`**: Delay duration in milliseconds