<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/feature-react/.github/banner.svg" alt="feature-react banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-react">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-react.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-react">
        <img src="https://img.shields.io/npm/dt/featuer-state-react.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`feature-react` is the ReactJs extension for the `feature-state` and `feature-form` library, providing hooks and features for easy state management in ReactJs.

- **Lightweight & Tree Shakable**: Function-based and modular design (< 1KB minified)
- **Modular & Extendable**: Easily extendable with features like `withPersistLocalStorage()`, .. 
- **Seamless Integration**: Designed to work effortlessly with `feature-state`
- **Typesafe**: Build with TypeScript for strong type safety

# [`feature-state`](https://github.com/builder-group/monorepo/tree/develop/packages/feature-state)

## 📖 Usage

### `useGlobalState()`

A hook to bind a `feature-state` state to a React component, causing the component to re-render whenever the state changes.

```ts
import { createState } from 'feature-state';
import { useGlobalState } from 'feature-react/state';

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
import { withPersistLocalStorage } from 'feature-react';

const state = withPersistLocalStorage(createState([]), 'tasks');

await state.persist();

state.addTask({ id: 1, title: 'Task 1' });
```

- **`key`**: The key used to identify the state in `localStorage`.

### `withGlobalBind()`

Binds a value to the global scope, using [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis) to make the value accessible globally.

```ts
import { withGlobalBind } from 'feature-global';

// Define a value to be bound globally
const $state = createState([]);

// Bind the value to the global scope
withGlobalBind('_state', $state);

// Now `$state` is accessible globally
console.log(globalThis._state); // { /* $state */ }
```

- **`key`**: The key used to identify the value in the global scope.
- **`value`**: The value to be bound to the global scope.

# [`feature-form`](https://github.com/builder-group/monorepo/tree/develop/packages/feature-form)

## 📖 Usage

### `useForm()`

A hook to manage form state and behavior in a React component, providing utilities to register form fields, handle form submission, and track field status.

```ts
import React from 'react';
import { useForm } from 'feature-react/form';
import { createForm } from 'feature-form';

interface TFormData {
    name: string;
    email: string;
}

const $form = createForm<TFormData>({
    fields: {
        name: { defaultValue: '' },
        email: { defaultValue: '' }
    }
});

export const MyFormComponent: React.FC = () => {
    const { register, handleSubmit, field, status } = useForm($form);

    const onSubmit = handleSubmit({
        onValidSubmit?: (formData) => {
            console.log('Form submitted successfully:', formData);
        },
        onInvalidSubmit?: (errors) => {
            console.error('Form submission failed:', errors);
        }
    });

    return (
        <form onSubmit={onSubmit}>
            <div>
                <label>Name</label>
                <input {...register('name')} />
                {status('name').error && <span>{status('name').error}</span>}
            </div>
            <div>
                <label>Email</label>
                <input {...register('email')} />
                {status('email').error && <span>{status('email').error}</span>}
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};
```

- **`register(formFieldKey, controlled?)`**: Registers a form field with the given key, optionally as a controlled component.
- **`handleSubmit(options?)`**: Returns a function to handle form submission with optional configuration for preventing default behavior and including additional data.
- **`field(formFieldKey)`**: Retrieves the form field object for the given key.
- **`status(formFieldKey)`**: Retrieves the status of the form field for the given key.
 