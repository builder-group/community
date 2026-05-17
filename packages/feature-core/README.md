# feature-core

Composable feature primitives for builder.group libraries.

## Consumer API

```ts
const state = createState(0)
	.with(undoFeature(4))
	.with(storageFeature(storage, 'count'))
	.with(loggerFeature());
```

Features can also be applied in order through one call:

```ts
const state = createState(0).with(
	undoFeature(4),
	storageFeature(storage, 'count'),
	loggerFeature()
);
```

The chained form should stay the canonical API because each call gives TypeScript a concrete host type before the next feature is applied.

## Library API

Libraries wrap their base object with `createFeatureHost`.

```ts
import { createFeatureHost, type TFeatureHost } from 'feature-core';

export type TState<GValue, GFeatures extends TStateFeature[]> = TFeatureHost<
	TStateBase<GValue>,
	GFeatures
>;

export function createState<GValue>(initialValue: GValue): TState<GValue, []> {
	let value = initialValue;

	return createFeatureHost({
		get() {
			return value;
		},
		set(nextValue: GValue) {
			value = nextValue;
		}
	});
}
```

Feature hosts include `_features` metadata for feature-core internals. It is visible for transparency, marked internal in the type docs, and readonly in the public type. Prefer capability checks like `hasFeature(host, key)` in app code.

## Feature API

Feature authors use `defineFeature`.

```ts
export function undoFeature(historyLimit = 50) {
	return defineFeature({
		key: 'undo',
		install<GValue, GFeatures extends TStateFeature[]>(state: TState<GValue, GFeatures>) {
			const history = [state.get()];

			return {
				undo() {
					const previousValue = history.pop();
					if (previousValue != null) {
						state.set(previousValue);
					}
				}
			};
		}
	});
}
```

Feature dependencies are explicit.

```ts
export function multiUndoFeature() {
	return defineFeature({
		key: 'multiUndo',
		requires: ['undo'] as const,
		install<GValue>(state: TState<GValue, [TUndoFeature<GValue>]>) {
			return {
				multiUndo(count: number) {
					for (let i = 0; i < count; i++) {
						state.undo();
					}
				}
			};
		}
	});
}
```

Prefer closing over the `state`/host passed to `install` instead of using `this` inside feature methods. A returned method can still declare a `this` type and it will work when called as `state.undo()`, but closure-based methods are easier to write, easier to refactor, and easier for TypeScript to infer.
