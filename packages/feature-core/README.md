<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-core/.github/banner.svg" alt="feature-core banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-core">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-core.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-core">
        <img src="https://img.shields.io/npm/dt/feature-core.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`feature-core` is a small, typesafe foundation for building feature-based JavaScript and TypeScript libraries.

- **Lightweight & Tree Shakable**: Object-based composition with no class hierarchy
- **Modular & Extendable**: Add capabilities with `.with(feature())` instead of nested wrappers
- **Typesafe**: Feature APIs and dependencies are tracked in TypeScript
- **Author Friendly**: Custom features are plain objects created with `defineFeature()`
- **Framework Agnostic**: Works for state containers, fetch clients, loggers, and other object-based libraries

### 🌟 Motivation

Feature-based libraries often repeat the same difficult parts: applying feature APIs, tracking installed features, validating dependencies, and preserving strong TypeScript inference. `feature-core` centralizes those mechanics so libraries can expose a consistent `.with(...)` extension model while feature authors only define a key, optional requirements, and an install function.

## 📖 Usage

Consumers compose features on a host object:

```ts
const state = createState(0)
	.with(undoFeature(4))
	.with(storageFeature(storage, 'count'))
	.with(loggerFeature());

state.undo();
```

Features can also be applied in order through one call:

```ts
const state = createState(0).with(
	undoFeature(4),
	storageFeature(storage, 'count'),
	loggerFeature()
);
```

The variadic form is typed in install order, so each feature is checked against the host produced by the features before it. Prefer chained `.with(...)` calls when a long feature list becomes harder to scan.

## 📙 Building Libraries

Libraries wrap their base object with `createFeatureHost()`.

```ts
import { createFeatureHost, type TFeatureHost } from 'feature-core';

interface TCounterBase {
	get: () => number;
	set: (nextValue: number) => void;
}

type TCounterFeature = TResetFeature | TResetTwiceFeature;

export type TCounter<GFeatures extends TCounterFeature[]> = TFeatureHost<
	TCounterBase,
	GFeatures
>;

export function createCounter(initialValue: number): TCounter<[]> {
	let value = initialValue;

	return createFeatureHost({
		get() {
			return value;
		},
		set(nextValue) {
			value = nextValue;
		}
	});
}

interface TResetFeature {
	key: 'reset';
	api: {
		reset: () => void;
	};
}

interface TResetTwiceFeature {
	key: 'resetTwice';
	api: {
		resetTwice: () => void;
	};
}
```

Feature hosts include `_features` metadata for `feature-core` internals. It is visible for transparency, marked internal in the type docs, and readonly in the public type. Prefer `hasFeature(host, key)` for app-level feature checks.

### Type Names

- `TFeature` is the runtime object returned by `defineFeature()`
- `TInstalledFeature` is the `{ key, api }` contract once a feature is installed
- `TDeclaredFeature` is a runtime feature with an explicit installed feature contract
- `TFeatureHost` is the base object plus installed feature APIs and `.with()`

## 📙 Creating Features

Feature authors use `defineFeature()`.

```ts
import { defineFeature, type TDeclaredFeature } from 'feature-core';

export function resetFeature(): TDeclaredFeature<TResetFeature> {
	return defineFeature({
		key: 'reset',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			const initialValue = counter.get();

			return {
				reset() {
					counter.set(initialValue);
				}
			};
		}
	});
}
```

The `TDeclaredFeature<TResetFeature>` return type is optional but recommended for reusable library features. It checks that the runtime key and returned API match the declared installed feature contract, and `.with()` carries that named feature into the host feature list.

Prefer closing over the host passed to `install()` instead of relying on `this`. A returned method can still declare a `this` type, but closure-based methods are easier to write, refactor, and infer.

### Dependent Features

If a feature depends on another feature, declare the required installed feature contracts, runtime `requires`, and a constrained install host:

```ts
export function resetTwiceFeature(): TDeclaredFeature<TResetTwiceFeature, [TResetFeature]> {
	return defineFeature({
		key: 'resetTwice',
		requires: ['reset'] as const,
		install(counter: TCounter<[TResetFeature]>) {
			return {
				resetTwice() {
					counter.reset();
					counter.reset();
				}
			};
		}
	});
}
```

`TDeclaredFeature<TFeature, [TDependency]>` and `requires` provide install-order validation. The constrained `install()` host lets the implementation use dependency APIs without casts. Using all three gives better errors for humans and agents.

The second `TDeclaredFeature` generic lists required installed feature contracts. `feature-core` derives the required key tuple from those contracts and checks it against the runtime `requires` value.

### API-less Features

Some features only mutate internal configuration and do not expose new methods. Return an empty object for those features:

```ts
export function cacheFeature() {
	return defineFeature({
		key: 'cache',
		install<GFeatures extends TFetchFeature[]>(client: TFetchClient<GFeatures>) {
			client._config.requestMiddlewares.push(cacheMiddleware());
			return {};
		}
	});
}
```

## 🔍 Feature Checks

Use `hasFeature()` for runtime checks:

```ts
if (hasFeature(counter, 'reset')) {
	console.log('Reset is installed');
}
```

Pass the feature type when you want TypeScript to narrow the API:

```ts
if (hasFeature<TResetFeature>(value, 'reset')) {
	value.reset();
}
```

## ❓ FAQ

### Why features instead of plugins?

`feature-core` composes typed capabilities directly onto a host object. "Feature" describes that narrower contract better than "plugin", which often implies discovery, lifecycle hooks, registries, or installable packages.

### Can features overwrite existing properties?

No. Feature keys must be unique per host, and returned API keys must not overwrite existing host properties. `feature-core` throws when a feature is installed twice, when required features are missing, or when a feature tries to overwrite an existing property.

### Should features use `this`?

Prefer closing over the host passed to `install()`. `this` methods can work, but they are easier to call incorrectly and harder for agents to author consistently.

### What should feature authors remember?

- Use a unique feature key
- Declare `requires` for runtime dependencies
- Type the `install()` host when the feature depends on another feature
- Return only new API keys
- Return `{}` for features that only mutate internal configuration
- Prefer chained `.with(...)` calls for long feature lists
