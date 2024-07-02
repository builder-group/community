<h1 align="center">
    <img src="https://raw.githubusercontent.com/inbeta-group/monorepo/develop/packages/feature-state-react/.github/banner.svg" alt="feature-state-react banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state-react">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-state-react.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-state-react">
        <img src="https://img.shields.io/npm/dt/featuer-state-react.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://dyn.art/s/discord/?source=inbeta-group-readme">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

`feature-state-react` is the ReactJs extension for the `feature-state` library, providing hooks and features for easy state management in ReactJs.

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

## 📙 Features

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

### `withGlobalBind()`

todo
 