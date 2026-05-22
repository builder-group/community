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

`feature-react` connects React components to [`feature-state`](https://github.com/builder-group/community/tree/develop/packages/feature-state) and [`feature-form`](https://github.com/builder-group/community/tree/develop/packages/feature-form) objects outside the React tree. Hooks subscribe directly, so no provider is required and computed hooks re-render only when selected values change.

- Use module, service, or form state directly from components
- Derive slices with `useCompute` instead of re-rendering on every source update
- Bind `feature-form` fields with focused field subscriptions
- Pass `null` for conditional subscriptions without breaking hook rules

```tsx
import { createForm } from 'feature-form';
import { useFormField } from 'feature-react/form';
import { useCompute } from 'feature-react/state';
import { createState } from 'feature-state';
import * as z from 'zod';

const $tasks = createState<Task[]>([]);
const $profileForm = createForm({
	fields: {
		email: { defaultValue: '', validator: z.string().email(), validateOn: ['blur'] }
	}
});

const CompletedCount = () => {
	const count = useCompute($tasks, (tasks) => tasks.filter((t) => t.done).length);
	return <span>{count} completed</span>;
};

const EmailField = () => {
	const { input, status } = useFormField($profileForm, 'email');
	return (
		<label>
			Email
			<input {...input()} />
			{status.type === 'invalid' && <span>{status.errors[0].message}</span>}
		</label>
	);
};
```

## Install

```bash
npm install feature-react
```

## Usage

Use `useFeatureState` to subscribe a component to a state value and re-render when it changes. Use `useCompute` when you only care about a derived slice: the component skips re-renders unless the computed result itself changes.

```ts
import { createState } from 'feature-state';
import { useFeatureState, useCompute } from 'feature-react/state';

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

Bind a form with `useForm` to get input helpers and a submit handler in one call:

```ts
import { createForm } from 'feature-form';
import { useForm } from 'feature-react/form';

const $form = createForm<{ name: string; email: string }>({
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

## Hooks

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

Calls `callback` whenever the state changes without subscribing the component to re-renders. Use this for side effects triggered by state changes.

```ts
import { useListener } from 'feature-react/state';

export const Analytics = () => {
	useListener($tasks, (tasks) => {
		analytics.track('tasks_changed', { count: tasks.length });
	});

	return null;
};
```

The callback must be synchronous. It runs after every state change, including background updates.

### `useSubscriber(state, callback)`

Like `useListener`, but runs the callback immediately on mount with the current state value.

```ts
import { useSubscriber } from 'feature-react/state';

useSubscriber($theme, (theme) => {
	document.documentElement.setAttribute('data-theme', theme);
});
```

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

### `useFormField(form, key, options?)`

Subscribes to a single field's status and returns input props for uncontrolled fields by default. Use this for isolated field components or large forms where re-rendering on every keystroke is expensive.

```ts
import { useFormField } from 'feature-react/form';

export const NameField = () => {
	const { status, input } = useFormField($form, 'name');

	return (
		<div>
			<input {...input()} />
			{status.type === 'invalid' && <span>{status.errors[0]?.message}</span>}
		</div>
	);
};
```

Pass `{ controlled: true }` when React should subscribe to and render the field value:

```ts
const { value, status, input } = useFormField($form, 'name', { controlled: true });
```

**Return value**

| Property  | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `field`   | The `TFormField` instance for the given key                    |
| `value`   | The current field value. Only returned when `controlled: true` |
| `status`  | The current validation status value                            |
| `input()` | Returns props for a native input, textarea, or select          |

### `getFieldInputProps(formField, options?)`

Builds input props from a `TFormField` directly, without a hook. Use this outside components or when you already hold the field reference.

#### Input options

`useForm().input()` and `getFieldInputProps()` accept options per call. `useFormField()` accepts options at the hook level; the returned `input()` helper takes no arguments.

For string-valued fields, all options are optional:

| Option       | Description                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `controlled` | When `true`, renders as a controlled input. On `useFormField`, pass this to the hook instead of a per-call option. |
| `format`     | Maps the field value to a display string                                                                           |
| `parse`      | Maps the input string back to the field value                                                                      |

For non-string fields, `format` and `parse` are required.

```ts
// useForm: options per input call
input('name');
input('age', { format: (v) => String(v), parse: (s) => Number(s), controlled: true });

// useFormField: all options go to the hook; input() takes no args
const { input: ageInput } = useFormField($form, 'age', {
	controlled: true,
	format: (v) => String(v),
	parse: (s) => Number(s)
});
ageInput();
```

## Built-in Features

Features are installed via `.with()` and extend a state with new capabilities.

### `localStorageFeature(key)`

Persists state in `localStorage`. Built on top of `storageFeature` from `feature-state`.

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

## Examples

- [React Basic](https://github.com/builder-group/community/tree/develop/examples/feature-state/react/basic)

## FAQ

### How does it compare to Zustand, Jotai, and React context?

`feature-react` is a binding layer, not a state model by itself. Use it when your state already lives in `feature-state` or your forms already live in `feature-form`, and React should subscribe to those objects without providers.

- [zustand](https://github.com/pmndrs/zustand): store-based state with a built-in selector hook
- [jotai](https://github.com/pmndrs/jotai): atom-based state defined outside components
- [React context](https://react.dev/reference/react/createContext): built-in context API that re-renders consumers when the provided value changes

### When should I use `useFormField` instead of `useForm`?

Use `useFormField` when a field component should re-render only on its own status changes. With `useForm`, any field change in the form re-renders the whole component. For large forms, `useFormField` in isolated field components is significantly cheaper.

### When should I use `status(key)` from `useForm` instead of `useFormField`?

Use `status(key)` when you want to subscribe to a single field's status from within a component that already calls `useForm`. Pass the returned state to `useFeatureState` to get a focused subscription without adding a second `useFormField` call.

### What is the difference between `useListener` and `useSubscriber`?

`useListener` runs the callback only on subsequent state changes. `useSubscriber` also runs it immediately on mount with the current value. Use `useSubscriber` when the side effect must reflect the current state on first render, such as syncing a DOM attribute.

### When should I use `useListener` instead of `useFeatureState`?

Use `useListener` when you need to react to state changes as a side effect but the component does not render anything derived from that state. Avoids an unnecessary re-render.

### Can I reference the latest values in a `useListener` or `useSubscriber` callback?

Yes. Both hooks use a stable callback ref internally, so you can close over other state or props without stale value issues. The callback itself must be synchronous.

### Can I pass `null` or `undefined` as the state argument?

Yes. All hooks accept `null` and `undefined` without subscribing. `useFeatureState` returns `null` in that case. This makes conditional subscription safe without violating the rules of hooks.

### Why do background updates not trigger an immediate re-render?

States can emit updates marked as background, meaning the change should be picked up on the next render rather than forced immediately. `useFeatureState` and `useCompute` record the change so the next render reflects it, but they do not schedule an extra re-render.

### What does passing `isEqual = false` to `useCompute` do?

It disables the equality check entirely. The component re-renders every time any subscribed state emits a change, regardless of whether the computed value actually changed. Useful when the compute function has deliberate side effects or when you always want the freshest object reference.

### Does `useFeatureState` re-render when I call `notify()` without replacing the value?

Yes. `notify()` signals a change regardless of whether the value reference changed. `useFeatureState` uses `useSyncExternalStore` with a snapshot wrapper, so a `notify()` call produces a new snapshot and triggers a re-render.
