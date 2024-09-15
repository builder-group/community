<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/feature-state/.github/banner.svg" alt="feature-state banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-state.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state">
        <img src="https://img.shields.io/npm/dt/featuer-state.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`feature-state` is a straightforward, typesafe, and feature-based state management library for ReactJs.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 1KB minified)
- **Fast**: Minimal code ensures high performance, and state changes can be deferred in "the bucket"
- **Modular & Extendable**: Easily extendable with features like `withStorage()`, `withUndo()`, ..
- **Typesafe**: Build with TypeScript for strong type safety
- **Standalone**: Zero dependencies, ensuring ease of use in various environments

### 📚 Examples

- [ReactJs Counter](https://github.com/builder-group/monorepo/tree/develop/examples/feature-state/react/counter) ([Code Sandbox](https://codesandbox.io/p/sandbox/counter-k74k9k))

### 🌟 Motivation

Create a typesafe, straightforward, and lightweight state management library designed to be modular and extendable with features like `withStorage()`, `withUndo()`, .. Having previously built [AgileTs](https://agile-ts.org/), I realized the importance of simplicity and modularity. AgileTs, while powerful, became bloated and complex. Learning from that experience, I followed the KISS (Keep It Simple, Stupid) principle for `feature-state`, aiming to provide a more streamlined and efficient solution. Because no code is the best code.

### ⚖️ Alternatives

- [nanostores](https://github.com/nanostores/nanostores)
- [jotai](https://github.com/pmndrs/jotai)
- [AgileTs](https://github.com/agile-ts/agile)

## 📖 Usage

`store/tasks.ts`

```ts
import { createState } from 'feature-state';

export const $tasks = createState<Task[]>([]);

export function addTask(task: Task) {
	$tasks.set([...$tasks.get(), task]);
}
```

`components/Tasks.tsx`

```tsx
import { useGlobalState } from 'feature-state-react';

import { $tasks } from '../store/tasks';

export const Tasks = () => {
	const tasks = useGlobalState($tasks);

	return (
		<ul>
			{tasks.map((task) => (
				<li>{task.title}</li>
			))}
		</ul>
	);
};
```

### Atom-based

States in `feature-state` are atom-based, meaning each state should only represent a single piece of data. They can store various types of data such as strings, numbers, arrays, or even objects.

To create an state, use `createState(initialValue)` and pass the initial value as the first argument.

```ts
import { createState } from 'feature-state';

export const $temperature = createState(20); // °C
```

In TypeScript, you can optionally specify the value type using a type parameter.

```ts
export type TWeatherCondition = 'sunny' | 'cloudy' | 'rainy';

export const $weatherCondition = createState<TWeatherCondition>('sunny');
```

To get the current value of the state, use `$state.get()`. To change the value, use `$state.set(nextValue)`.

```ts
$temperature.set($temperature.get() + 5);
```

### Subscribing to State Changes

You can subscribe to state changes using `$state.subscribe(callback)`, which works in vanilla JS. For React, special hooks like [`useGlobalState($state)`](https://github.com/builder-group/monorepo/tree/develop/packages/feature-state-react) are available to re-render components on state changes.

Listener callbacks will receive the new value as the first argument.

```ts
const unsubscribe = $temperature.subscribe((newValue) => {
	console.log(`Temperature changed to ${newValue}°C`);
});
```

Unlike `$state.listen(callback)`, `$state.subscribe(callback)` immediately invokes the listener during the subscription.

## 📙 Features

### `withStorage()`

Adds persistence functionality to the state, allowing the state to be saved to and loaded from a storage medium.

```ts
import { createState, withStorage } from 'feature-state';

const storage = {
	async save(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	},
	async load(key) {
		const value = localStorage.getItem(key);
		return value ? JSON.parse(value) : undefined;
	},
	async delete(key) {
		localStorage.removeItem(key);
		return true;
	}
};

const state = withStorage(createState([]), storage, 'tasks');

await state.persist();

state.addTask({ id: 1, title: 'Task 1' });
```

- **`storage`**: An object implementing the `StorageInterface` with methods `save`, `load`, and `delete` for handling the persistence
- **`key`**: The key used to identify the state in the storage medium

### `withUndo()`

Adds undo functionality to the state, allowing the state to revert to previous values.

```ts
import { createState, withUndo } from 'feature-state';

const state = withUndo(createState([]), 50);

state.addTask({ id: 1, title: 'Task 1' });
state.undo();
```

- **`historyLimit`**: The maximum number of states to keep in history for undo functionality. The default is `50`

### `withMultiUndo()`

Adds multi-undo functionality to the state, allowing the state to revert to multiple previous values at once.

```ts
import { createState, withMultiUndo, withUndo } from 'feature-state';

const state = withMultiUndo(withUndo(createState([]), 50));

state.addTask({ id: 1, title: 'Task 1' });
state.addTask({ id: 2, title: 'Task 2' });
state.multiUndo(2);
```

- **`count`**: The number of undo steps to perform, reverting the state back by the specified number of changes
