# `feature-state-react`
> Status: Beta

The ReactJs extension for the `feature-state` library, providing hooks and features for easy state management in ReactJs.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 1KB minified)
- **Modular & Extendable**: Easily extendable with features like `withPersistLocalStorage()`, .. 
- **Seamless Integration**: Designed to work effortlessly with `feature-state`
- **Typesafe**: Build with TypeScript for strong type safety

## 📖 Usage

### `useGlobalState()`

A hook to bind a `feature-state` state to a React component, causing the component to re-render whenever the state changes.

```ts
import { createState } from 'feature-state';
import { useGlobalState } from 'feature-state-react';

const $tasks = createState<Task[]>([]);

export const Tasks = () => {
    const tasks = useGlobalState($tasks);

    return (
        <ul>
            {tasks.map(task => <li key={task.id}>{task.title}</li>)}
        </ul>
    );
}
```

## Features

### `withPersistLocalStorage()`

Adds persistence functionality to the state, using [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage?retiredLocale=de) to save and load the state.

```ts
import { createState } from 'feature-state';
import { withPersistLocalStorage } from 'feature-state-react';

const state = withPersistLocalStorage(createState([]), 'tasks');

await state.persist();

state.addTask({ id: 1, title: 'Task 1' });
```

- **`key`**: The key used to identify the state in `localStorage`.
