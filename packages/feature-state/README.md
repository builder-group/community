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

A lightweight, typesafe reactive state container. Extend it with features instead of pulling in a larger framework.

```ts
import { createState, undoFeature } from 'feature-state';

const $tasks = createState<Task[]>([]).with(undoFeature());

$tasks.set([{ id: 1, title: 'Buy milk' }]);
$tasks.undo(); // []
```

### Examples

- [React Counter](https://github.com/builder-group/community/tree/develop/examples/feature-state/react/counter) ([CodeSandbox](https://codesandbox.io/p/sandbox/counter-k74k9k))

### Alternatives

- [nanostores](https://github.com/nanostores/nanostores)
- [jotai](https://github.com/pmndrs/jotai)

## Core API

### `createState(initialValue, options?)`

Creates a state container and returns it as a feature host.

```ts
const $count = createState(0);
const $status = createState<'idle' | 'loading' | 'error'>('idle');
```

**Options**

| Option  | Default                | Description            |
| ------- | ---------------------- | ---------------------- |
| `queue` | shared sync FIFO queue | Custom listener queue. |

### `value` / `get()` / `set()` / `notify()`

```ts
$count.value; // 0
$count.get(); // 0

$count.set(5);
$count.set((v) => v + 1); // updater form

$count.value = 10; // same as set(10)
```

`set()` skips notification when the new value is identical to the current one (`Object.is` comparison).

Use `notify()` when you need to trigger listeners without changing the value, or when a feature updates internal state by other means.

### `listen(callback, options?)` / `subscribe(callback, options?)`

`listen` registers a callback for future changes and returns an unsubscribe function. `subscribe` does the same but also calls the callback immediately with the current value.

```ts
const unlisten = $count.listen(({ value, prevValue, source }) => {
	console.log(value, prevValue, source);
});

unlisten(); // remove listener
```

**Listener context**

| Field        | Description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| `value`      | The new value.                                                                           |
| `prevValue`  | The previous value. Undefined when `notify()` is called without one.                     |
| `source`     | What triggered the change. `'state_set'` for `set()`. Features may set their own values. |
| `background` | Optional flag set by the caller. Useful for suppressing UI updates on background syncs.  |

**Listener options**

| Option        | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| custom fields | Forwarded to the listener queue. Useful with custom queues. |

### Custom Listener Queues

Most states can use the default shared sync FIFO queue. Pass a queue instance when multiple states should share scheduling, or when listener callbacks should be processed manually.

```ts
import { createState, SyncListenerQueue } from 'feature-state';

const queue = new SyncListenerQueue();

const $count = createState(0, { queue });
const $label = createState('', { queue });

$count.set(1, { processListenerQueue: false });
$label.set('ready', { processListenerQueue: false });

queue.process();
```

Use `SyncPriorityListenerQueue` when listener execution order should be driven by `priority` instead of registration order. Lower values run first.

```ts
import { createState, EListenerQueuePriority, SyncPriorityListenerQueue } from 'feature-state';

const $count = createState(0, {
	queue: new SyncPriorityListenerQueue()
});

$count.listen(() => {}, { priority: EListenerQueuePriority.EARLY }); // 125 — runs before DEFAULT (250)
```

**Priority constants** (only meaningful with `SyncPriorityListenerQueue`)

```ts
EListenerQueuePriority.FIRST; // 0
EListenerQueuePriority.EARLY; // 125
EListenerQueuePriority.DEFAULT; // 250
EListenerQueuePriority.LATE; // 375
EListenerQueuePriority.LAST; // 500
```

## Built-in Features

Features are installed via `.with()` and extend the state with new methods.

### `storageFeature(storage, key)`

Adds `persist()`, `loadFromStorage()`, and `deleteFromStorage()`.

```ts
const storage = {
	save(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	},
	load(key) {
		const raw = localStorage.getItem(key);
		return raw != null ? JSON.parse(raw) : null; // return null when absent
	},
	delete(key) {
		localStorage.removeItem(key);
		return true;
	}
};

const $tasks = createState<Task[]>([]).with(storageFeature(storage, 'tasks'));

await $tasks.persist();
```

`persist()` loads any previously saved value. If nothing is stored it saves the current state instead, then auto-saves on every subsequent `set()`.

**`TStorageInterface` contract:** `load` must return `null` when the key is absent — not `undefined` and not a thrown error.

### `undoFeature(historyLimit?)`

Adds `undo()`. Keeps the last 50 values by default.

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
const $count = createState(0).with(undoFeature()).with(multiUndoFeature());

$count.set(1);
$count.set(2);
$count.set(3);
$count.multiUndo(2); // back to 1
```

## Writing Features

Features for `feature-state` are plain `defineFeature()` calls from `feature-core`. Annotate the `install()` parameter with `TStateBase<GValue>` to access the core state API.

```ts
import { defineFeature, type TFeature } from 'feature-core';
import { type TStateBase } from 'feature-state';

type TLogFeature = TFeature<'log', { getLog(): string[] }>;

export function logFeature<GValue>(): TLogFeature {
	return defineFeature<TLogFeature>({
		key: 'log',
		install(state: TStateBase<GValue>) {
			const log: string[] = [];

			state.listen(({ value }) => {
				log.push(String(value));
			});

			return {
				getLog() {
					return log;
				}
			};
		}
	});
}
```

When a feature depends on another feature, list it in `requires` and annotate the parameter with the full state type:

```ts
import { defineFeature, type TFeature } from 'feature-core';
import { type TState, type TUndoFeature } from 'feature-state';

type TMyFeature<GValue> = TFeature<'my-feature', { ... }, [TUndoFeature<GValue>]>;

export function myFeature<GValue>(): TMyFeature<GValue> {
    return defineFeature<TMyFeature<GValue>>({
        key: 'my-feature',
        requires: ['undo'],
        install(state: TState<GValue, [TUndoFeature<GValue>]>) {
            // state.undo() is available and typed
            return { ... };
        }
    });
}
```

See the [feature-core README](https://github.com/builder-group/community/tree/develop/packages/feature-core) for a full guide on `defineFeature()`, dependency declaration, and the feature model.

## ❓ FAQ

### Why does `set()` skip notification when the value is the same?

Skipping on reference equality (`Object.is`) prevents redundant re-renders and listener calls. If you need to force a notification without changing the value, call `notify()` directly.

### Why does `subscribe()` pass `prevValue === value` on the initial call?

The initial call has no prior state, so `prevValue` is set to the current value. This means listeners never receive `undefined` for `prevValue` and can be written without a null check.
