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

`tuple-result` is a minimal, functional, and tree-shakable Result library for TypeScript that prioritizes simplicity and serialization.

- **🔮 Simple, declarative API**: Intuitive array destructuring with full type safety
- **🍃 Lightweight & Tree Shakable**: Function-based design with ~150B core
- **⚡ High Performance**: Minimal overhead with just a 3-element array
- **🔍 Easy Serialization**: Simple array format perfect for wire transmission
- **📦 Zero Dependencies**: Standalone library ensuring ease of use in various environments
- **🔧 Functional Helpers**: Powerful map, unwrap, and utility functions
- **🧵 Type Safe**: Full TypeScript support with literal types and type guards

### 🌟 Motivation

Build a minimal, functional Result library that prioritizes simplicity and serialization. While libraries like [ts-results](https://github.com/vultix/ts-results) and [neverthrow](https://github.com/supermacro/neverthrow) offer robust features, their class-based implementations can create challenges with serialization and bundle size. `tuple-result` provides a functional alternative using simple arrays - combining minimal overhead (~150B core), easy serialization for APIs and frameworks like React Router, and helper functions while adhering to the KISS principle.

### ⚖️ Alternatives

- [ts-results](https://github.com/vultix/ts-results)
- [neverthrow](https://github.com/supermacro/neverthrow)

## 📖 Usage

`tuple-result` provides a simple approach to error handling. Here's how to use it:

### 1. Creating Results

```ts
import { Ok, Err } from 'tuple-result';

const success = Ok(42);
const failure = Err('Something went wrong');
```

### 2. Working with Results

```ts
// Method-based approach
if (success.isOk()) {
	console.log(success.value); // 42
}

// Array destructuring approach
const [ok, error, value] = success;
if (ok) {
	console.log(value); // 42
}

// Direct unwrapping (throws on error)
const value = success.unwrap(); // 42
```

### 3. Wrapping Functions

```ts
import { t, tAsync } from 'tuple-result';

// Wrap synchronous functions
const result = t(() => JSON.parse('invalid')); // Err(SyntaxError)

// Wrap promises
const asyncResult = await tAsync(fetch('/api/data')); // Ok(Response) or Err(Error)
```

### 4. Safe Value Extraction

```ts
import { unwrapOr, unwrapErr } from 'tuple-result';

// Provide defaults
const value = unwrapOr(failure, 0); // 0

// Extract errors safely
const error = unwrapErr(failure); // 'Something went wrong'
```

### 5. Transforming Results

```ts
import { mapOk, mapErr } from 'tuple-result';

// Transform success values
const doubled = mapOk(success, x => x * 2); // Ok(84)

// Transform errors
const wrapped = mapErr(failure, e => `Error: ${e}`); // Err('Error: Something went wrong')
```

### 6. Serialization

```ts
import { serialize, deserialize } from 'tuple-result';

// Convert to wire format
const wireFormat = serialize(success); // [true, 42]

// Reconstruct from wire format
const reconstructed = deserialize(wireFormat); // Back to TResult
```

## 📚 API Reference

### Core Functions

#### `Ok<T, E>(value: T): OkResult<T, E>`
Creates a successful result containing the given value.

```ts
const result = Ok(42);
console.log(result.unwrap()); // 42
console.log(result.isOk());   // true
```

#### `Err<T, E>(error: E): ErrResult<T, E>`
Creates an error result containing the given error.

```ts
const result = Err('Something went wrong');
console.log(result.isErr());  // true
console.log(result.error);    // 'Something went wrong'
```

### Type Guards

#### `isOk<T, E>(result: TResult<T, E>): result is OkResult<T, E>`
Type guard to check if a result is successful.

```ts
if (isOk(result)) {
	// TypeScript knows result is OkResult here
	console.log(result.unwrap());
}
```

#### `isErr<T, E>(result: TResult<T, E>): result is ErrResult<T, E>`
Type guard to check if a result is an error.

```ts
if (isErr(result)) {
	// TypeScript knows result is ErrResult here
	console.log(result.error);
}
```

### Unwrapping Functions

#### `unwrap<T, E>(result: TResult<T, E>): T`
Extracts the value from a result, throwing if it's an error.

```ts
try {
	const value = unwrap(success); // 42
} catch (error) {
	// Handle error
}
```

#### `unwrapOk<T, E>(result: TResult<T, E>): T`
Extracts the value from an Ok result, throwing if it's an error.

```ts
const value = unwrapOk(success); // 42
```

#### `unwrapErr<T, E>(result: TResult<T, E>): E`
Extracts the error from an Err result, throwing if it's successful.

```ts
const error = unwrapErr(failure); // 'Something went wrong'
```

#### `unwrapOr<T, E>(result: TResult<T, E>, defaultValue: T): T`
Extracts the value from a result, returning a default if it's an error.

```ts
const value = unwrapOr(failure, 0); // 0
```

#### `unwrapOrNull<T, E>(result: TResult<T, E>): T | null`
Extracts the value from a result, returning null if it's an error.

```ts
const value = unwrapOrNull(failure); // null
```

### Transformation Functions

#### `mapOk<T, E, U>(result: TResult<T, E>, mapFn: (value: T) => U): TResult<U, E>`
Maps the value inside an Ok result using the provided function.

```ts
const doubled = mapOk(Ok(21), x => x * 2); // Ok(42)
```

#### `mapErr<T, E, F>(result: TResult<T, E>, mapFn: (error: E) => F): TResult<T, F>`
Maps the error inside an Err result using the provided function.

```ts
const wrapped = mapErr(Err(404), code => `HTTP ${code}`); // Err('HTTP 404')
```

### Function Wrappers

#### `t<T, Args extends any[]>(fn: (...args: Args) => T, ...args: Args): TResult<T, unknown>`
Wraps a synchronous function call in a Result.

```ts
const result = t(() => JSON.parse('invalid')); // Err(SyntaxError)
const safeDivide = (a: number, b: number) => t(() => a / b, a, b);
```

#### `tAsync<T>(promise: Promise<T>): Promise<TResult<T, unknown>>`
Wraps a Promise in a Result.

```ts
const result = await tAsync(fetch('/api/data')); // Ok(Response) or Err(Error)
```

### Serialization Functions

#### `serialize<T, E>(result: TResult<T, E>): [boolean, T | E]`
Converts a result to a wire-friendly format.

```ts
const wireFormat = serialize(Ok(42)); // [true, 42]
```

#### `deserialize<T, E>(serialized: [boolean, T | E]): TResult<T, E>`
Converts a serialized result back to a TResult.

```ts
const result = deserialize([true, 42]); // Ok(42)
```

## 💡 Resources / References

- [try operator proposal](https://github.com/arthurfiorette/proposal-try-operator) - ECMAScript proposal that inspired our array destructuring
- [ts-results](https://github.com/vultix/ts-results)
- [neverthrow](https://github.com/supermacro/neverthrow)