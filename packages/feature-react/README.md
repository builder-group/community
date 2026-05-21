<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-react/.github/banner.svg" alt="feature-react banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-react">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-react.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-react">
        <img src="https://img.shields.io/npm/dt/feature-react.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

React bindings for [`feature-state`](https://github.com/builder-group/community/tree/develop/packages/feature-state) and [`feature-form`](https://github.com/builder-group/community/tree/develop/packages/feature-form).

```ts
import { createState } from 'feature-state';
import { useFeatureState } from 'feature-react/state';

const $count = createState(0);

export const Counter = () => {
	const count = useFeatureState($count);
	return <button onClick={() => $count.set(count + 1)}>{count}</button>;
};
```

## Install

```bash
npm install feature-react
```

## Usage

Bind state to a component with `useFeatureState`. The component re-renders whenever the state changes:

```ts
import { createState } from 'feature-state';
import { useFeatureState } from 'feature-react/state';

const $tasks = createState<Task[]>([]);

export const Tasks = () => {
	const tasks = useFeatureState($tasks);
	return <ul>{tasks.map((t) => <li key={t.id}>{t.title}</li>)}</ul>;
};
```

Derive a value from one or more states with `useCompute`. The component only re-renders when the computed result changes:

```ts
import { useCompute } from 'feature-react/state';

const completedCount = useCompute($tasks, (tasks) => tasks.filter((t) => t.done).length);

const filtered = useCompute([$tasks, $filter], ([tasks, filter]) =>
	tasks.filter((t) => t.category === filter)
);
```

Persist state in `localStorage` with `localStorageFeature`. The component picks up the saved value automatically on first render:

```ts
import { createState } from 'feature-state';
import { localStorageFeature, useFeatureState } from 'feature-react/state';

const $theme = createState<'light' | 'dark'>('light').with(localStorageFeature('theme'));
await $theme.persist();

export const ThemeToggle = () => {
	const theme = useFeatureState($theme);
	return <button onClick={() => $theme.set(theme === 'light' ? 'dark' : 'light')}>{theme}</button>;
};
```

Wire up a form with `useForm`. Spread `input(key)` onto a native input to register it:

```ts
import { createForm } from 'feature-form';
import { useForm } from 'feature-react/form';

const $form = createForm<{ name: string; email: string }>({
	fields: { name: { defaultValue: '' }, email: { defaultValue: '' } }
});

export const ContactForm = () => {
	const { input, handleSubmit } = useForm($form);
	return (
		<form onSubmit={handleSubmit({ onValidSubmit: console.log })}>
			<input {...input('name')} />
			<input {...input('email')} />
			<button type="submit">Submit</button>
		</form>
	);
};
```

## Examples

- [React Counter](https://github.com/builder-group/community/tree/develop/examples/feature-state/react/counter) ([CodeSandbox](https://codesandbox.io/p/sandbox/counter-k74k9k))

## State API

### `useFeatureState(state)`

Returns the current state value and re-renders the component when the state changes.

```ts
import { createState } from 'feature-state';
import { useFeatureState } from 'feature-react/state';

const $tasks = createState<Task[]>([]);

export const Tasks = () => {
	const tasks = useFeatureState($tasks);

	return (
		<ul>
			{tasks.map((task) => (
				<li key={task.id}>{task.title}</li>
			))}
		</ul>
	);
};
```

Passing `null` or `undefined` returns `null` without subscribing. Background updates do not trigger an immediate re-render.

### `useCompute(state, compute, deps?, isEqual?)`

Derives a computed value from one state or a tuple of states. The component re-renders only when the computed result changes.

```ts
import { useCompute } from 'feature-react/state';

// Single state
const completedCount = useCompute($tasks, (tasks) => tasks.filter((t) => t.done).length);

// Multiple states
const filtered = useCompute([$tasks, $filter], ([tasks, filter]) =>
	tasks.filter((t) => t.category === filter)
);
```

`deps` lists any values that `compute` reads outside the subscribed state. When `deps` change, the computed value is recalculated.

`isEqual` defaults to `Object.is`. Pass a custom comparator to suppress re-renders when the computed structure is equivalent but not referentially identical. Pass `false` to always re-render on any input change.

`compute` and `isEqual` must stay pure because React may call them during render.

### `useListener(state, callback)`

Registers a listener for side effects and cleans it up when the component unmounts. The callback runs on every future state change, matching the behavior of `state.listen()`.

```ts
import { useListener } from 'feature-react/state';

useListener($tasks, ({ value }) => {
	document.title = `${value.length} tasks`;
});
```

The callback can return a cleanup function that runs before the next invocation and on unmount.

```ts
useListener($status, ({ value }) => {
	const id = setTimeout(() => syncToServer(value), 500);
	return () => clearTimeout(id);
});
```

### `useSubscriber(state, callback)`

Identical to `useListener`, but also calls the callback immediately with the current state value on mount. Matches the behavior of `state.subscribe()`.

```ts
import { useSubscriber } from 'feature-react/state';

useSubscriber($tasks, ({ value }) => {
	Analytics.track('tasks.snapshot', { count: value.length });
});
```

The callback can return a cleanup function that runs before the next invocation and on unmount.

## State Features

Features are installed via `.with()` and extend a state before it is passed to a hook.

### `localStorageFeature(key)`

Persists state in `localStorage`. Built on top of `storageFeature` from `feature-state`.

```ts
import { localStorageFeature } from 'feature-react/state';
import { createState } from 'feature-state';

const $tasks = createState<Task[]>([]).with(localStorageFeature('tasks'));

await $tasks.persist();
```

`persist()` loads any previously saved value. If nothing is stored it saves the current value instead, then auto-saves on every subsequent `set()`. See `storageFeature` in the [feature-state README](https://github.com/builder-group/community/tree/develop/packages/feature-state) for the full contract.

### `globalBindFeature(key)`

Exposes the state on `globalThis[key]` for debugging in the browser console.

```ts
import { globalBindFeature } from 'feature-react/state';
import { createState } from 'feature-state';

const $tasks = createState<Task[]>([]).with(globalBindFeature('_tasks'));

// In the browser console:
// globalThis._tasks.get()
```

## Form API

### `useForm(form)`

Subscribes a component to a form and re-renders when any field changes. Use this when a single component owns the whole form.

```ts
import { createForm } from 'feature-form';
import { useForm } from 'feature-react/form';

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

export const ContactForm = () => {
	const { input, handleSubmit } = useForm($form);

	return (
		<form onSubmit={handleSubmit({ onValidSubmit: console.log })}>
			<input {...input('name')} />
			<input {...input('email')} />
			<button type="submit">Submit</button>
		</form>
	);
};
```

**Return value**

| Property                 | Description                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form`                   | The underlying `TForm` instance                                                                                                                                   |
| `input(key, options?)`   | Returns props for a native input, textarea, or select. See [input options](#input-options)                                                                        |
| `handleSubmit(options?)` | Returns an event handler. Calls `event.preventDefault()` by default. Options: `onValidSubmit(data)`, `onInvalidSubmit(errors)`, `preventDefault` (default `true`) |
| `field(key)`             | Returns the `TFormField` for the given key                                                                                                                        |
| `status(key)`            | Returns the field's status state. Pass it to `useFeatureState` to subscribe to status changes for a specific field                                                |

### `useFormField(form, key)`

Subscribes to a single field and returns its current value and status already unwrapped. Re-renders only when that field changes. Use this for isolated field components or large forms where re-rendering the whole form on every keystroke is expensive.

```ts
import { useFormField } from 'feature-react/form';

export const NameField = () => {
	const { value, status, input } = useFormField($form, 'name');

	return (
		<div>
			<input {...input()} />
			{status.type === 'invalid' && <span>{status.errors[0]?.message}</span>}
		</div>
	);
};
```

**Return value**

| Property          | Description                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `field`           | The `TFormField` instance for the given key                                                |
| `value`           | The current field value. Updates on every change                                           |
| `status`          | The current validation status value. Updates on every change                               |
| `input(options?)` | Returns props for a native input, textarea, or select. See [input options](#input-options) |

### Input options

`input()` on both `useForm` and `useFormField` accepts the same options object.

For string-valued fields, all options are optional:

| Option       | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `controlled` | When `true`, renders as a controlled input. Defaults to `false` |
| `format`     | Maps the field value to a display string                        |
| `parse`      | Maps the input string back to the field value                   |

For non-string fields, `format` and `parse` are required.

```ts
// Uncontrolled string field (default)
input('name');

// Controlled string field
input('name', { controlled: true });

// Non-string field with explicit format and parse
input('age', {
	format: (v) => String(v),
	parse: (s) => Number(s)
});
```

### `getFieldInputProps(formField, options?)`

Standalone version of `input()`. Takes a `TFormField` directly instead of a field key. Useful outside of hooks, for example when building a custom field component that receives a field as a prop.

```ts
import { getFieldInputProps } from 'feature-react/form';

export const CustomInput = ({ field }: { field: TFormField<string> }) => (
	<input {...getFieldInputProps(field)} />
);
```

Accepts the same options as `input()` above.

## FAQ

### When should I use `useFormField` instead of `useForm`?

Use `useFormField` when a field lives in its own component or when re-rendering the entire form on every keystroke is too expensive. `useFormField` subscribes to one field and returns `value` and `status` already unwrapped, so no additional `useFeatureState` call is needed. Use `useForm` when a single component renders the whole form and the extra re-renders are not a concern.

### What is the difference between `useListener` and `useSubscriber`?

`useListener` fires only on future changes. `useSubscriber` also fires immediately on mount with the current value. Use `useSubscriber` when the side effect must run once with the initial value, for example seeding an analytics session or syncing initial state to an external system.

### When should I use `useListener` instead of `useFeatureState`?

Use `useFeatureState` when the component renders based on state. Use `useListener` when the component needs to run a side effect in response to a change but does not need to re-render, for example updating the document title or writing to an external service.

### Can I reference the latest values in a `useListener` or `useSubscriber` callback?

Yes. The callback always sees the latest values at the time it runs. You do not need to add outside variables to any dependency array.

### Can I pass `null` or `undefined` as the state argument?

Yes. All hooks accept `null` and `undefined` without subscribing. `useFeatureState` returns `null` in that case. This makes conditional subscription safe without violating the rules of hooks.

### Why do background updates not trigger an immediate re-render?

Background updates signal that a change is a background sync, for example a periodic refresh from a server. Re-rendering immediately for every background update can cause unnecessary flicker. The hooks still record the change so the component reflects it on its next render.

### What does passing `isEqual = false` to `useCompute` do?

It skips the equality check entirely. The component re-renders whenever any subscribed state changes, regardless of whether the computed value differs. This is useful when the computed value is a mutable object that would compare as unchanged even after mutation.

### Does `useFeatureState` re-render when I call `notify()` without replacing the value?

Yes. Calling `notify()` after mutating a value in place, as documented in `feature-state`, causes `useFeatureState` to re-render with the updated value.
