# Migration Guide

## 0.0.x to 0.1.0

`feature-state` now uses the shared `.with(feature())` composition model from `feature-core`. The base state API is smaller, while undo, storage, queueing, equality, and computed behavior live in features.

### Replace `with*` Helpers With Features

Old helper functions such as `withUndo`, `withMultiUndo`, `withStorage`, and `withSelector` were removed.

Use `.with(...)` instead:

```ts
import { createState, undoFeature } from 'feature-state';

const count = createState(0).with(undoFeature(20));
```

Common replacements:

| Old API                                         | New API                                                 |
| ----------------------------------------------- | ------------------------------------------------------- |
| `withUndo(createState(value), limit)`           | `createState(value).with(undoFeature(limit))`           |
| `withMultiUndo(withUndo(state))`                | `state.with(undoFeature(), multiUndoFeature())`         |
| `withStorage(createState(value), storage, key)` | `createState(value).with(storageFeature(storage, key))` |
| `withSelector(...)`                             | Use `createComputed(...)` plus `listen(...)`            |

### Remove `createState` Options

`createState(initialValue, options)` is now `createState(initialValue)`.

The old `queue` option and listener queue exports were removed from the base state. Use queue features when you need queue behavior:

```ts
import { asyncQueueFeature, createState, priorityQueueFeature } from 'feature-state';

const state = createState(0).with(asyncQueueFeature());
const prioritized = createState(0).with(priorityQueueFeature());
```

Priority options exist only after `priorityQueueFeature()` is installed.

### Update Listener Code

Base `listen` and `subscribe` callbacks receive a context object.

```ts
state.subscribe(({ value, prevValue, source }) => {
  console.log(value, prevValue, source);
});
```

Base listener options no longer include `key`, `priority`, or `queueIf`.

The source key for `set()` changed from `state_set` to `stateSet`. Update code that checks `source`.

### Use `Object.is` Equality

Base state updates now compare values with `Object.is`.

This changes two edge cases:

- `NaN` to `NaN` no longer notifies.
- `0` to `-0` now notifies.

Use `isEqualFeature()` when you need custom equality.

### Update Storage Adapters

Storage state methods were renamed:

| Old method          | New method          |
| ------------------- | ------------------- |
| `loadFormStorage`   | `loadFromStorage`   |
| `deleteFormStorage` | `deleteFromStorage` |

The missing-value sentinel changed from `null` to `missingStorageValue`.

```ts
import { missingStorageValue, storageFeature } from 'feature-state';

const storage = {
  load(key: string) {
    const value = localStorage.getItem(key);
    return value == null ? missingStorageValue : JSON.parse(value);
  },
  save(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  },
  delete(key: string) {
    localStorage.removeItem(key);
    return true;
  }
};

const settings = createState({ theme: 'dark' }).with(storageFeature(storage, 'settings'));
```

Returning `null` or `undefined` now stores those values as real loaded values. Return `missingStorageValue` when storage has no value.

### Replace Selectors With Computed State

`withSelector` and `listenToSelected` were removed.

Use `createComputed` for derived values:

```ts
import { createComputed, createState } from 'feature-state';

const firstName = createState('Ada');
const lastName = createState('Lovelace');

const fullName = createComputed([firstName, lastName] as const, ([first, last]) => {
  return `${first} ${last}`;
});

fullName.listen(({ value }) => {
  console.log(value);
});
```

Computed states are read-only. Calling `set()` or assigning `value` throws.

### Removed Exports

The following old root exports were removed: `withUndo`, `withMultiUndo`, `withStorage`, `withSelector`, `isStateWithFeatures`, `GLOBAL_LISTENER_QUEUES`, `createListenerQueue`, `getListenerQueue`, `processListenerQueue`, `processAllListenerQueues`, `SyncListenerQueue`, `AsyncListenerQueue`, and `ListenerQueue`.

Use `hasFeature` from `feature-core` if you need feature checks.
