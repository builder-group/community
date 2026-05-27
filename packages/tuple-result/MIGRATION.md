# Migration Guide

## 0.0.x to 0.1.0

`tuple-result` keeps the same main import path and the same core constructors. Most code using `Ok`, `Err`, destructuring, `isOk`, `isErr`, `mapOk`, `mapErr`, and `match` should continue to work.

The main migration work is around `unwrap()` behavior and serialized tuple types.

### `unwrap()` Throws The Stored Error

`unwrap()` and `ErrResult.unwrap()` now throw the stored error payload exactly.

```ts
import { Err, unwrap } from 'tuple-result';

unwrap(Err('Missing config')); // throws the string 'Missing config'
```

In `0.0.x`, string errors were converted to `new Error(message)`, and non-`Error` objects were converted to `new Error('Unknown error')`.

If callers expect an `Error` instance, store an `Error` instance:

```ts
return Err(new Error('Missing config'));
```

If you want typed domain errors, prefer destructuring or `unwrapErr()`:

```ts
const [isOk, error, value] = result;

if (!isOk) {
  return handleError(error);
}
```

### Plain Result Arrays Are Readonly And JSON-Friendly

`TResultArray<T, E>` now accepts `null` in the inactive slot because JSON turns `undefined` tuple slots into `null`.

```ts
type OldArray<T, E> = [true, undefined, T] | [false, E, undefined];

type NewArray<T, E> = readonly [true, undefined | null, T] | readonly [false, E, undefined | null];
```

Code that mutates result array slots should stop doing that. Treat result arrays as transport values.

```ts
const serialized = JSON.parse(json) as TResultArray<User, string>;
const result = fromArray(serialized);
```

### Use `fromArray()` Only For Plain Arrays

`fromArray()` no longer accepts an existing `OkResult` or `ErrResult` in its TypeScript signature.

```ts
// old
const result = fromArray(existingResult);

// new
const result = existingResult;
```

Use `fromArray()` after receiving a plain tuple from JSON, storage, workers, loaders, or APIs.

### Generic Defaults Changed

`Ok(value)` now defaults the error type to `never`.

`Err(error)` now defaults the value type to `never` and the error type to `unknown`.

This usually improves inference, but exported types may change if you relied on implicit generic defaults. Add explicit generics when publishing a stable result type:

```ts
const result = Err<User, AuthError>({ code: 'unauthorized' });
```

### Added Types

New helper types are available:

- `TOkResultArray<T>`
- `TErrResultArray<E>`
- `TResultLike<T, E>`
