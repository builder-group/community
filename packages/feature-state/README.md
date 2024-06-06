# `feature-state`
> Status: Beta

A straightforward, typesafe, and feature-based state management library for ReactJs.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 1KB minified)
- **Fast**: Minimal code ensures high performance, and state changes can be deferred in "the bucket"
- **Modular & Expandable**: Easily extendable with features like `withPersist()`, `withUndo()`, ..
- **Typesafe**: Build in TypeScript
- **Standalone**: Zero dependencies, ensuring ease of use in various environments

### Motivation

Provide a typesafe, straightforward, and lightweight state management library designed to be modular and expandable with features like `withPersist()`, `withUndo()`, .. Having previously built [AgileTs](https://agile-ts.org/), I realized the importance of simplicity and modularity. AgileTs, while powerful, became bloated and complex. Learning from that experience, I followed the KISS (Keep It Simple, Stupid) principle for `feature-state`, aiming to provide a more streamlined and efficient solution. Because no code is the best code.

### Alternatives
- [nanostores](https://github.com/nanostores/nanostores)
- [jotai](https://github.com/pmndrs/jotai)
- [AgileTs](https://github.com/agile-ts/agile)

# 📖 Usage

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
            {tasks.map(task => <li>{task.title}</li>)}
        </ul>
    );
}
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

You can subscribe to state changes using `$state.subscribe(callback)`, which works in vanilla JS. For React, special hooks like `useGlobalState($state)` are available to re-render components on state changes.

Listener callbacks will receive the new value as the first argument.

```ts
const unsubscribe = $temperature.subscribe((newValue) => {
  console.log(`Temperature changed to ${newValue}°C`);
});
```

Unlike `$state.listen(callback)`, `$state.subscribe(callback)` immediately invokes the listener during the subscription. 

## Features

### `withPersist()`

### `withUndo()`

### `withMultiUndo()`