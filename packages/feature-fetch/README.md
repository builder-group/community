# `@ibg/fetch-client`

- Dyn Fetch has core and then I can extend it with like `withOpenAPI` or `withAPI`
  which then sets the get set and stuff methods.. however they are not typesafe or
  or well I can make them typesafe indeed if I've like feature 'api' and 'openapi'

### TODO
Add middlewares like: https://github.com/elbywan/wretch?tab=readme-ov-file#middlewares,
that can be added as features? so in the feature we just add the middleware
- withRetry
- with Dedupe

### Features

- `core`
  - `coreFetch()`
- `api`
  - `get()`
  - `post()`
  - `put()`
  - `del()`
- `openapi`
  - `get()`
  - `post()`
  - `put()`
  - `del()`
-

```
import dynFetch from '@ibg/fetch-client';

const response = await dynFetch.post('https://example.com');

if (response.ok) {
  // handle ok
}

if (response.error) {
  // handle error
}

// Throw error if fail or unwrap
const ok = response.unwrap()

const dynOpenAPIFetch = createOpenAPIFetchClient();
// TODO




```
