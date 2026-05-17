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

`feature-core` is a small, typesafe foundation for building extensible JavaScript and TypeScript libraries using a `.with(feature())` composition model.

Every extensible library eventually solves the same problems: applying feature APIs onto a host object, tracking what is installed, and validating dependencies. It does all of this without losing TypeScript inference. `feature-core` centralizes those mechanics once so library authors can focus on features, not plumbing.

```ts
const counter = createCounter(0).with(resetFeature()).with(resetTwiceFeature()); // type error if resetFeature() is missing

counter.reset(); // typed
counter.resetTwice(); // typed
counter.missing(); // type error
```

## Three Roles

There are three roles in the feature model:

| Role               | Responsibility                                 |
| ------------------ | ---------------------------------------------- |
| **Consumer**       | Composes features on a host with `.with()`     |
| **Library author** | Wraps a base object with `createFeatureHost()` |
| **Feature author** | Creates features with `defineFeature()`        |

## Consumer

Call `.with()` with one or more features. Features are validated in order. Each one is checked against the host produced by all preceding features:

```ts
// Chained: one feature at a time
const counter = createCounter(0).with(resetFeature()).with(resetTwiceFeature());

// Variadic: all at once, validated left to right
const counter = createCounter(0).with(resetFeature(), resetTwiceFeature());
```

Both forms are equivalent. Prefer chained calls when the list gets long.

`.with()` mutates the original object and returns it. The base reference and the result are the same object:

```ts
const base = createCounter(0);
const withReset = base.with(resetFeature());
// base === withReset, same object, reset() is now on both
```

Use `hasFeature()` for runtime checks:

```ts
if (hasFeature<TResetFeature>(value, 'reset')) {
	value.reset(); // narrowed
}
```

## Library Author

Wrap the base object with `createFeatureHost()` and export a typed host alias:

```ts
import { createFeatureHost, type TFeature, type TFeatureHost } from 'feature-core';

interface TCounterBase {
	get: () => number;
	set: (nextValue: number) => void;
}

type TResetFeature = TFeature<'reset', { reset(): void }>;
type TResetTwiceFeature = TFeature<'resetTwice', { resetTwice(): void }, [TResetFeature]>;

type TCounterFeature = TResetFeature | TResetTwiceFeature;
export type TCounter<GFeatures extends TCounterFeature[]> = TFeatureHost<TCounterBase, GFeatures>;

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
```

`TFeature` has three parts:

```ts
type TMyFeature = TFeature<'my-feature', TMyFeatureApi, [TRequiredFeature]>;
//                          ^ runtime key  ^ API shape   ^ required features
```

The third generic is optional and defaults to `[]`.

**Checklist:**

- Define the base API as an interface
- Define feature contracts with named `TFeature` aliases
- Export the host type as `TFeatureHost<TBase, GFeatures>`
- Return `createFeatureHost(base)` from the factory
- Keep feature keys unique. The runtime throws on duplicate installation.

Use `TAnyFeature` as the feature type in generic utilities that work across any feature type, for example a function that accepts any feature host.

Use `TInstalledFeaturesOf<THost>` when a generic utility needs to recover the installed feature tuple from a host type.

## Feature Author

Use `defineFeature()`. Pass the feature type explicitly to get a typed install host and validated `requires`:

```ts
import { defineFeature, type TFeature } from 'feature-core';

type TResetFeature = TFeature<'reset', { reset(): void }>;

export function resetFeature(): TResetFeature {
	return defineFeature<TResetFeature>({
		key: 'reset',
		install(counter: TCounterBase) {
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

Annotate the `install()` parameter with the base host type when the feature needs base APIs. The parameter is `never` by default. There is no implicit host type because features are designed to work across different host shapes.

For local or one-off features, the generic can be omitted and the type is inferred:

```ts
const debugFeature = () =>
	defineFeature({
		key: 'debug',
		install() {
			return {
				debug() {
					return true;
				}
			};
		}
	});
```

### Dependent Features

List required feature types in the third `TFeature` generic and mirror those keys in `requires`. The order must match:

```ts
type TResetTwiceFeature = TFeature<'resetTwice', { resetTwice(): void }, [TResetFeature]>;

export function resetTwiceFeature(): TResetTwiceFeature {
	return defineFeature<TResetTwiceFeature>({
		key: 'resetTwice',
		requires: ['reset'],
		install(counter) {
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

The `install()` host is typed from the required feature APIs, so `counter.reset()` above is available without any cast. If the feature also needs base APIs, annotate the parameter with the full host type:

```ts
install(counter: TCounter<[TResetFeature]>) { ... }
```

### API-less Features

Features that only mutate internal configuration return an empty object:

```ts
type TCacheFeature = TFeature<'cache', Record<never, never>>;

export function cacheFeature(): TCacheFeature {
	return defineFeature<TCacheFeature>({
		key: 'cache',
		install(client: TFetchClientBase) {
			client._config.requestMiddlewares.push(cacheMiddleware());
			return {};
		}
	});
}
```

## ❓ FAQ

### Why "features" instead of "plugins"?

"Plugin" implies discovery, lifecycle hooks, registries, or installable packages. `feature-core` composes typed capabilities directly onto a host object. That narrower contract is better described as a feature.

### Why does the host get mutated instead of copied?

Feature installation happens at construction time, not at runtime. Mutation keeps the model simple: there is one object, its identity never changes, and installed feature APIs are just properties on it. Copying would require re-typing the result on every `.with()` call anyway, so there is no practical benefit.

### Why does `requires` order have to mirror the dependency tuple?

An unordered approach (union array) would only validate that listed keys are _allowed_, not that _every_ required key is present. A partial `requires` would silently pass. The positional tuple enforces completeness, with one rule: the `requires` array order must mirror the `GRequiredFeatures` tuple order.

### Why do I have to annotate the `install()` parameter myself?

Features are host-agnostic. The same feature can be installed on different host shapes, so there is no single type to infer. Annotate the parameter with whatever the feature actually needs: the library base type, a full host type, or nothing at all if the feature does not use the host:

```ts
install(host: TCounterBase) { ... }              // needs base APIs
install(host: TCounter<[TResetFeature]>) { ... } // needs base + reset
install() { ... }                                // does not use the host
```

### Does `feature-core` validate the base host type?

No. `feature-core` validates feature dependencies and the APIs added by installed features, but it does not carry a global base-host constraint per feature. If a feature needs base APIs, annotate the `install()` parameter with the host shape it actually uses.

This keeps features reusable across libraries and avoids making every feature carry extra generic state. Package-specific tests should cover whether a feature is valid for that package's base host.

### When should I use explicit `defineFeature<TMyFeature>()` vs inferred?

Use explicit when the feature is exported or referenced by name elsewhere. TypeScript will validate that the key, API shape, and `requires` all match the declared type contract, catching mismatches at definition time. Use inferred for local or one-off features where no external contract exists.
