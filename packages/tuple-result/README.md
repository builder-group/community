<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/tuple-result/.github/banner.svg" alt="tuple-result banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/tuple-result">
        <img src="https://img.shields.io/bundlephobia/minzip/tuple-result.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/tuple-result">
        <img src="https://img.shields.io/npm/dt/tuple-result.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`tuple-result` is a TypeScript Result that stays plain JavaScript. Success and failure use `[isOk, error, value]`, so normal destructuring, `if/else`, and JSON serialization work without adapters or a chained API.

- Return typed errors as values for expected failure paths
- Let TypeScript narrow `error` and `value` after the `isOk` check
- Use helpers like `mapOk`, `mapErr`, and `match` only when they reduce noise
- Send results through loaders, workers, APIs, or storage as plain arrays

```ts
import { Err, fromArray, Ok, tAsync } from 'tuple-result';

async function loadUser(id: string) {
	const [isFetchOk, fetchErr, response] = await tAsync(fetch(`/api/users/${id}`));
	if (!isFetchOk) return Err(fetchErr);
	if (!response.ok) return Err(new Error(`HTTP ${response.status}`));
	return tAsync(response.json() as Promise<{ name: string }>);
}

const [isOk, userErr, user] = await loadUser('42');

if (isOk) {
	console.log(user.name); // TypeScript knows user is defined here
} else {
	console.error(userErr); // TypeScript knows userErr is defined here
}

// Results are arrays, so JSON round-trips without a custom serializer
const serialized = JSON.stringify(Ok(42)); // '[true,null,42]'
const result = fromArray<number, Error>(JSON.parse(serialized));
result.unwrap(); // 42
```

## Install

```bash
npm install tuple-result
```

## Usage

Create a result with `Ok` or `Err`, then read it with array destructuring. TypeScript narrows the type automatically after the `isOk` check:

```ts
import { Err, Ok } from 'tuple-result';

const countResult = Ok(42);
const configResult = Err('Missing config');

// Array destructuring: readable without knowing the library
const [isCountOk, countErr, count] = countResult;
if (isCountOk) {
	console.log(count); // 42
} else {
	console.error(countErr);
}

// Method-based access is also available
if (countResult.isOk()) {
	console.log(countResult.value); // 42
}
```

Wrap a call that may throw or a promise that may reject with `t` or `tAsync`:

```ts
import { t, tAsync } from 'tuple-result';

// Wrap a synchronous call that may throw
const result = t(() => JSON.parse('invalid')); // Err(SyntaxError)

// Wrap a promise that may reject
const userResult = await tAsync(
	fetch('/api/user').then(async (response) => {
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		return (await response.json()) as { name: string };
	})
);
```

Transform the success or error value without unpacking the result first:

```ts
import { Err, mapErr, mapOk, match, Ok, unwrapOr } from 'tuple-result';

const doubled = mapOk(Ok(21), (x) => x * 2); // Ok(42)
const wrapped = mapErr(Err(404), (c) => `HTTP ${c}`); // Err('HTTP 404')

const message = match(Err('Missing config'), {
	ok: (config) => `Config: ${config}`,
	err: (configErr) => `Error: ${configErr}`
});

const count = unwrapOr(Err('Missing count'), 0); // 0
```

Results serialize to plain arrays and reconstruct from them without a custom serializer:

```ts
import { fromArray, isOk, Ok, type TResultArray } from 'tuple-result';

// Serialize to a plain array
const countArray = Ok(42).toArray(); // [true, undefined, 42]

// Reconstruct from a plain array
const countResult = fromArray(countArray);

// Standalone helpers work on plain arrays directly, no conversion needed
isOk([true, undefined, 42] as const); // true

// JSON turns inactive undefined slots into null; tuple-result accepts both
const jsonCountArray = JSON.parse(JSON.stringify(countArray)) as TResultArray<number, string>;
fromArray(jsonCountArray).unwrap(); // 42
```

## API

### Core

The constructors and types that form every result value.

| Export                      | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `Ok(value)` / `ok(value)`   | Creates a successful result.                                                   |
| `Err(error)` / `err(error)` | Creates an error result.                                                       |
| `TResult<T, E>`             | Union of `OkResult<T, E>` and `ErrResult<T, E>`. Supports array destructuring. |
| `TOkResultArray<T>`         | Plain tuple form for successful results: `[true, undefined \| null, T]`.       |
| `TErrResultArray<E>`        | Plain tuple form for error results: `[false, E, undefined \| null]`.           |
| `TResultArray<T, E>`        | Plain tuple form for either branch. Accepts JSON roundtrip arrays.             |
| `TResultLike<T, E>`         | Any accepted result shape: `TResult<T, E>` or `TResultArray<T, E>`.            |

### Type guards

Narrow a result to its `Ok` or `Err` branch. Both functions accept `TResult` and `TResultArray` so no conversion is needed before calling them.

| Export          | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `isOk(result)`  | Returns `true` and narrows to the successful result shape. |
| `isErr(result)` | Returns `true` and narrows to the error result shape.      |

### Unwrapping

Extract the inner value when you are confident about the branch, or provide a fallback for the error case.

| Export                      | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `unwrap(result)`            | Returns the value or throws the stored error value exactly. |
| `unwrapOk(result)`          | Returns the value or throws.                                |
| `unwrapErr(result)`         | Returns the error or throws.                                |
| `unwrapOr(result, default)` | Returns the value or `default` on error.                    |
| `unwrapOrNull(result)`      | Returns the value or `null` on error.                       |
| `unwrapOrUndefined(result)` | Returns the value or `undefined` on error.                  |

### Transformation

Transform the value inside a result without unwrapping it. Each helper returns a new result, leaving the original unchanged.

| Export                    | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `mapOk(result, fn)`       | Transforms the success value with `fn`. Passes errors through unchanged.  |
| `mapErr(result, fn)`      | Transforms the error value with `fn`. Passes successes through unchanged. |
| `match(result, handlers)` | Calls `handlers.ok` or `handlers.err` and returns the result.             |

### Wrappers

Convert throwing functions and rejecting promises into results.

| Export            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `t(fn, ...args)`  | Wraps a synchronous call. Returns `Err` if it throws.    |
| `tAsync(promise)` | Wraps a promise-like value. Returns `Err` if it rejects. |

### Serialization

Convert between result instances and plain arrays for storage, JSON, or cross-boundary transport.

| Export             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `toArray(result)`  | Converts to a plain tuple with `undefined` in the inactive slot.       |
| `fromArray(array)` | Reconstructs an `OkResult` or `ErrResult` instance from a plain tuple. |

## FAQ

### How does it compare to neverthrow, ts-results, and Effect?

`tuple-result` optimizes for plain JavaScript control flow and serialization. Use it when you want typed error values without committing the whole code path to chained Result methods or a larger effect system.

- [neverthrow](https://github.com/supermacro/neverthrow): Result type with a class-based API and rich transformation methods
- [ts-results](https://github.com/vultix/ts-results): Result and Option types with a class-based API
- [Effect](https://github.com/Effect-TS/effect): full FP ecosystem with typed errors, concurrency, and dependency injection

### What is the difference between `TResult` and `TResultArray`?

`TResult` is an `OkResult` or `ErrResult` instance with convenience methods (`.isOk()`, `.unwrap()`, `.value`). `TResultArray` is the plain tuple shape with the same `[isOk, error, value]` structure but no methods. It is useful for serialization, JSON, and frameworks like React Router.

Most standalone helpers accept both types, so no conversion is needed in normal control flow. Use `fromArray()` to add methods back after deserializing.

### Why do the plain tuple types allow `null`?

In memory, `Ok(value).toArray()` returns `[true, undefined, value]` and `Err(error).toArray()` returns `[false, error, undefined]`.

JSON cannot preserve `undefined`, so `JSON.stringify()` turns the inactive slot into `null`. `TResultArray<T, E>` accepts both `undefined` and `null` in inactive slots so roundtrips keep working without an extra conversion step.

### Why array destructuring instead of chaining or `.match()`?

Array destructuring is native JavaScript. It requires no library knowledge and maps naturally to `if/else` control flow. Name the tuple from the domain value: `const [isUserOk, userErr, user] = result`. The pattern is inspired by the [try operator proposal](https://github.com/arthurfiorette/proposal-try-operator).

### Why do `unwrap` and `unwrapOk` both exist?

Use `unwrap` when you want an Err result to throw its stored error value. Use `unwrapOk` when you want a branch assertion that throws `Expected an Ok result` if the result is Err.

### Does `unwrap` always throw an `Error` instance?

No. JavaScript can throw any value, and `unwrap` preserves the Err payload instead of converting it. `unwrap(Err('Missing config'))` throws the string `'Missing config'`. Use `Err(new Error('Missing config'))` when you want conventional exception behavior with a stack trace. Prefer normal tuple destructuring when you want typed domain errors.
