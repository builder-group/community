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

A Result type for TypeScript where errors are values, not exceptions. The `[ok, error, value]` tuple destructures natively, works across JSON boundaries, and needs no library knowledge to read.

- Serializable: use plain `[isOk, error, value]` tuples for JSON, React Router loaders, and APIs
- Destructure like native JS: `const [isUserOk, userErr, user] = result` with no library knowledge required
- Instance methods when you want them, plain tuples when you need serialization: most helpers accept both
- No forced chaining: use plain `if/else`, or helpers like `mapOk`, `mapErr`, and `match` when they simplify code

```ts
import { tAsync } from 'tuple-result';

const userResult = await tAsync(loadUser());
const [isUserOk, userErr, user] = userResult;

if (isUserOk) {
	console.log(user.name);
} else {
	console.error(userErr);
}
```

## Install

```sh
npm install tuple-result
```

## Usage

### Creating and reading results

```ts
import { Err, Ok } from 'tuple-result';

const countResult = Ok(42);
const configResult = Err('Missing config');

// Array destructuring
const [isCountOk, countErr, count] = countResult;
if (isCountOk) {
	console.log(count); // 42
} else {
	console.error(countErr);
}

// Method-based
if (countResult.isOk()) {
	console.log(countResult.value); // 42
}
```

### Wrapping functions

```ts
import { t, tAsync } from 'tuple-result';

// Wrap synchronous calls
const result = t(() => JSON.parse('invalid')); // Err(SyntaxError)

// Wrap promises
const userResult = await tAsync(
	fetch('/api/user').then(async (response) => {
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return (await response.json()) as { name: string };
	})
);
```

### Transforming results

```ts
import { Err, mapErr, mapOk, match, Ok, unwrapOr } from 'tuple-result';

const doubled = mapOk(Ok(21), (x) => x * 2); // Ok(42)
const wrapped = mapErr(Err(404), (c) => `HTTP ${c}`); // Err('HTTP 404')
const configResult = Err('Missing config');

const message = match(configResult, {
	ok: (config) => `Config: ${config}`,
	err: (configErr) => `Error: ${configErr}`
});

const count = unwrapOr(Err('Missing count'), 0); // 0
```

### Serialization

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

## Result

### Core

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

| Export          | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `isOk(result)`  | Returns `true` and narrows to the successful result shape. |
| `isErr(result)` | Returns `true` and narrows to the error result shape.      |

### Unwrapping

| Export                      | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `unwrap(result)`            | Returns the value or throws the stored error value exactly. |
| `unwrapOk(result)`          | Returns the value or throws.                                |
| `unwrapErr(result)`         | Returns the error or throws.                                |
| `unwrapOr(result, default)` | Returns the value or `default` on error.                    |
| `unwrapOrNull(result)`      | Returns the value or `null` on error.                       |
| `unwrapOrUndefined(result)` | Returns the value or `undefined` on error.                  |

### Transformation

| Export                    | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `mapOk(result, fn)`       | Transforms the success value with `fn`. Passes errors through unchanged.  |
| `mapErr(result, fn)`      | Transforms the error value with `fn`. Passes successes through unchanged. |
| `match(result, handlers)` | Calls `handlers.ok` or `handlers.err` and returns the result.             |

### Wrappers

| Export            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `t(fn, ...args)`  | Wraps a synchronous call. Returns `Err` if it throws.    |
| `tAsync(promise)` | Wraps a promise-like value. Returns `Err` if it rejects. |

### Serialization

| Export             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `toArray(result)`  | Converts to an in-memory plain tuple with `undefined` inactive slots.  |
| `fromArray(array)` | Reconstructs an `OkResult` or `ErrResult` instance from a plain tuple. |

## Alternatives

- [ts-results](https://github.com/vultix/ts-results)
- [neverthrow](https://github.com/supermacro/neverthrow)

## FAQ

### What is the difference between `TResult` and `TResultArray`?

`TResult` is an `OkResult` or `ErrResult` instance with convenience methods (`.isOk()`, `.unwrap()`, `.value`). `TResultArray` is the plain tuple shape with the same `[isOk, error, value]` structure but no methods: useful for serialization, JSON, and frameworks like React Router.

Most standalone helpers accept both types, so no conversion is needed in normal control flow. Use `fromArray()` to add methods back after deserializing.

### Why do the plain tuple types allow `null`?

In memory, `Ok(value).toArray()` returns `[true, undefined, value]` and `Err(error).toArray()` returns `[false, error, undefined]`.

JSON arrays cannot preserve `undefined`, so `JSON.stringify()` turns the inactive slot into `null`. `TResultArray<T, E>` accepts both `undefined` and `null` in inactive slots so roundtrips keep working without an extra conversion step.

### Why array destructuring instead of chaining or `.match()`?

Array destructuring is native JavaScript, requires no library knowledge, and maps naturally to `if/else` control flow. Treat the first slot as the branch condition and name the tuple from the domain value, such as `[isUserOk, userErr, user]`. The pattern is inspired by the [try operator proposal](https://github.com/arthurfiorette/proposal-try-operator).

### Why do `unwrap` and `unwrapOk` both exist?

Use `unwrap` when you want Err results to throw their stored error. Use `unwrapOk` when you want a branch assertion that throws `Expected an Ok result` if the result is Err.

### Does `unwrap` always throw an `Error` instance?

No. JavaScript can throw any value, and `unwrap` preserves the `Err` payload instead of converting it. `unwrap(Err('Missing config'))` throws the string, and `unwrap(Err({ code: 'missing_config' }))` throws that object.

Use `Err(new Error('Missing config'))` when you want conventional exception behavior with an `Error` instance and stack trace. Prefer normal tuple branching when you want typed domain errors.
