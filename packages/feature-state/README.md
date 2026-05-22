<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-state/.github/banner.svg" alt="feature-state banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-state.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state">
        <img src="https://img.shields.io/npm/dt/feature-state.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`feature-state` is reactive state that grows by installing features. Start with one observable value, then add undo, storage, computed values, custom equality, queues, or custom capabilities with `.with()` only where you need them.

- Install capabilities per state: undo, storage, queues, and equality stay opt-in
- Use one `createState()` API in vanilla JS, React, Vue, Svelte, Node.js, and tests
- Let TypeScript track installed capabilities: `undo()` exists only after `undoFeature()`
- Build custom feature packs on the same typed host model as the built-ins

```ts
import { createComputed, createState, undoFeature } from 'feature-state';

const $tasks = createState<Task[]>([]).with(undoFeature());
const $openTasks = createComputed($tasks, (tasks) => tasks.filter((task) => !task.done));

const unlisten = $openTasks.listen(({ value }) => {
	renderOpenTasks(value);
});

$tasks.set([{ id: 1, title: 'Buy milk', done: false }]);

$openTasks.get(); // [{ id: 1, title: 'Buy milk', done: false }]
$tasks.undo(); // back to []
unlisten();
```

## Install

```bash
npm install feature-state
```

## Usage

A state holds a single value and notifies listeners when it changes:

```ts
import { createState } from 'feature-state';

const $count = createState(0);

$count.listen(({ value, prevValue }) => {
	console.log(value, prevValue);
});

$count.set(5);
$count.set((v) => v + 1); // updater form, value is now 6
```

Extend a state with features using `.with()`. Each installed feature adds typed methods:

```ts
import { multiUndoFeature, undoFeature } from 'feature-state';

const $count = createState(0).with(undoFeature(), multiUndoFeature());

$count.set(1);
$count.set(2);
$count.set(3);
$count.undo(); // 2
$count.multiUndo(2); // 0
```

Derive a read-only value from one or more states with `createComputed`. It recomputes whenever a source state changes:

```ts
import { createComputed, createState } from 'feature-state';

const $tasks = createState<Task[]>([]);
const $done = createComputed($tasks, (tasks) => tasks.filter((t) => t.done));

$tasks.set([{ id: 1, title: 'Buy milk', done: true }]);
$done.get(); // [{ id: 1, title: 'Buy milk', done: true }]
```

Persist state across sessions with `storageFeature`. Pass any storage adapter that implements `save`, `load`, and `delete`:

```ts
import { createState, missingStorageValue, storageFeature } from 'feature-state';

const localAdapter = {
	save: (key: string, value: unknown) => {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	},
	load: (key: string) => {
		const raw = localStorage.getItem(key);
		return raw != null ? JSON.parse(raw) : missingStorageValue;
	},
	delete: (key: string) => {
		localStorage.removeItem(key);
		return true;
	}
};

const $tasks = createState<Task[]>([]).with(storageFeature(localAdapter, 'tasks'));

await $tasks.persist(); // loads saved value on first call; auto-saves on every set()
```

## State

### `createState(initialValue)`

Creates a state container and returns it as a feature host.

```ts
const $count = createState(0);
const $status = createState<'idle' | 'loading' | 'error'>('idle');
```

### `value` / `get()` / `set()`

```ts
$count.value; // 0
$count.get(); // 0

$count.set(5);
$count.set((v) => v + 1); // updater form

$count.value = 10; // same as set(10)
```

`set()` skips updating and notifying when the new value is identical to the current one (`Object.is` comparison).

### `notify()`

Triggers all listeners without changing the value. Use this after mutating a value in place via `_v`, or when a feature updates internal state by other means.

```ts
$count._v = 42; // mutate directly, no notification
$count.notify(); // notify listeners manually
```

Pass custom metadata to every listener in the same notification:

```ts
$count.notify({ listenerContext: { source: 'mySync', background: true } });
```

### `listen(callback)` / `subscribe(callback)`

`listen` registers a callback for future changes and returns an unsubscribe function. `subscribe` does the same but also calls the callback immediately with the current value.

```ts
const unlisten = $count.listen(({ value, prevValue, source }) => {
	console.log(value, prevValue, source);
});

unlisten(); // remove listener
```

Calling `unlisten()` inside the listener itself is safe. Any pending call to that callback in the current notification cycle is removed immediately.

**Listener context**

| Field        | Description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| `value`      | The new value.                                                                           |
| `prevValue`  | The previous value. Undefined when `notify()` is called without a prior value.           |
| `source`     | What triggered the change. `'stateSet'` for `set()`. Features set their own source keys. |
| `background` | When `true`, signals that the change is a background sync and UI updates can be skipped. |

Listeners run synchronously in registration order. Nested `set()` calls inside a listener are batched: their listeners join the current queue and run after the outermost notification finishes.

### `createComputed(source, compute, options?)`

Creates a read-only state derived from one source state:

```ts
import { createComputed, createState } from 'feature-state';

const $tasks = createState<Task[]>([]);
const $completedCount = createComputed($tasks, (tasks) => tasks.filter((task) => task.done).length);
```

Pass a tuple when the value depends on multiple states:

```ts
const $filteredTasks = createComputed([$tasks, $filter] as const, ([tasks, filter]) =>
	tasks.filter((task) => task.category === filter)
);
```

Computed states expose the normal read and subscription API (`value`, `get()`, `listen()`, and `subscribe()`), but `set()` and assigning `value` throw because source states own the data. Call `destroy()` when the containing object is torn down to unsubscribe from source states.

`isEqual` defaults to `Object.is`. Pass a custom comparator to suppress notifications when the computed structure is equivalent but not referentially identical. Pass `false` to notify on every source update.

## Built-in Features

Features are installed via `.with()` and extend the state with new methods.

### `undoFeature(historyLimit?)`

Adds `undo()`. Keeps the last 50 values by default. History is seeded with the initial value at install time.

```ts
const $count = createState(0).with(undoFeature());

$count.set(1);
$count.set(2);
$count.undo(); // 1
$count.undo(); // 0
$count.undo(); // no-op, already at oldest
```

### `multiUndoFeature()`

Adds `multiUndo(count)`. Requires `undoFeature` to be installed first.

```ts
const $count = createState(0).with(undoFeature(), multiUndoFeature());

$count.set(1);
$count.set(2);
$count.set(3);
$count.multiUndo(2); // back to 1
```

### `storageFeature(storage, key)`

Adds `persist()`, `loadFromStorage()`, and `deleteFromStorage()`. The storage adapter is a plain object with `save`, `load`, and `delete` methods.

```ts
import { missingStorageValue } from 'feature-state';

const storage = {
	save(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	},
	load(key) {
		const raw = localStorage.getItem(key);
		return raw != null ? JSON.parse(raw) : missingStorageValue;
	},
	delete(key) {
		localStorage.removeItem(key);
		return true;
	}
};

const $tasks = createState<Task[]>([]).with(storageFeature(storage, 'tasks'));

await $tasks.persist();
```

`persist()` loads any previously saved value. If nothing is stored it saves the current state instead, then auto-saves on every subsequent `set()`. Calling `persist()` more than once is safe.

**`TStorageInterface` contract:** `load` must return `missingStorageValue` (a Symbol) when the key is absent. `null` and `undefined` are treated as valid stored values.

### `isEqualFeature(isEqual)`

Overrides `set()` with a domain-specific equality check. Use it when reference equality would notify listeners even though the visible state did not change.

```ts
import { createState, isEqualFeature } from 'feature-state';

const $status = createState({ type: 'valid' }).with(
	isEqualFeature((prevValue, nextValue) => prevValue.type === nextValue.type)
);
```

### `asyncQueueFeature()`

Replaces the default sync listener queue with a microtask-based FIFO queue. Listeners still run in registration order, but after the current call stack resolves. Async listeners are awaited one by one.

```ts
import { asyncQueueFeature } from 'feature-state';

const $count = createState(0).with(asyncQueueFeature<number>());

$count.listen(async ({ value }) => {
	await save(value);
});

await $count.notify(); // resolves when all listeners have completed
```

`notify()` returns the active queue flush promise. Multiple `notify()` calls before the microtask fires share the same promise. `set()` still returns `void`, so listener errors from `set()` are not awaitable through `set()` itself.

### `priorityQueueFeature()`

Replaces the default sync listener queue with a priority-based sync queue. Lower priority values run first. Listeners with the same priority keep registration order.

```ts
import { EListenerPriority, priorityQueueFeature } from 'feature-state';

const $count = createState(0).with(priorityQueueFeature<number>());

$count.listen(() => {}, { priority: EListenerPriority.LATE });
$count.listen(() => {}, { priority: EListenerPriority.EARLY }); // runs first
```

`EListenerPriority` provides named constants: `FIRST = 0`, `EARLY = 125`, `DEFAULT = 250`, `LATE = 375`, `LAST = 500`. Any number is valid.

## Extending with Features

States are `feature-core` feature hosts. Add behavior with `.with(yourFeature())`. See the [feature-core README](https://github.com/builder-group/community/tree/develop/packages/feature-core) for a full guide on `defineFeature()`, dependency declaration, and the feature model.

## Examples

- [React Basic](https://github.com/builder-group/community/tree/develop/examples/feature-state/react/basic)

## FAQ

### How does it compare to Nanostores, Zustand, and MobX?

`feature-state` is centered on composable feature hosts. Use it when you want state objects that can gain typed capabilities over time without committing to proxies, decorators, or a React-specific store model.

- [nanostores](https://github.com/nanostores/nanostores): framework-agnostic atom-based state with framework integrations
- [zustand](https://github.com/pmndrs/zustand): store-based state management, primarily for React
- [MobX](https://mobx.js.org): reactive state via proxies and decorators, class-oriented

### Why does `set()` skip notification when the value is the same?

Skipping on reference equality (`Object.is`) prevents redundant re-renders and listener calls. To force a notification without changing the value, call `notify()` directly.

### Why does `subscribe()` pass `prevValue` equal to `value` on the initial call?

The initial call has no prior state, so `prevValue` is set to the current value. Listeners never receive `undefined` for `prevValue` and can be written without a null check.

### Is it safe to unsubscribe inside a listener?

Yes. The unsubscribe function removes the callback from `_listeners` and also removes any pending call to that callback already queued in the current notification cycle. The listener will not fire again even if `notify()` is still draining.

### Can I combine `asyncQueueFeature` and `priorityQueueFeature`?

No. Both features override the same internal queue (`listen`, `subscribe`, and `notify`). Installing both means the last one installed takes effect and the first is silently ignored. Pick one.

### When should I use `_v` directly instead of `set()`?

Use `_v` when you need to mutate a value in place, for example pushing to an array, without going through `set()`'s reference equality check. Mutate via `_v`, then call `notify()` manually to trigger listeners. This is an escape hatch; prefer replacing the value with `set()` when possible.

### How does `storageFeature` prevent save loops?

When `loadFromStorage()` calls `set()` internally it passes `source: 'loadFromStorage'` in the listener context. The auto-save listener ignores changes with that source, so loading a value does not immediately write it back to storage.
