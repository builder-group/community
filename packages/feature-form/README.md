<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/feature-form/.github/banner.svg" alt="feature-form banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form">
        <img src="https://img.shields.io/bundlephobia/minzip/feature-form.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/feature-form">
        <img src="https://img.shields.io/npm/dt/feature-form.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

A lightweight, typesafe form library built on `feature-state`. Forms and fields are reactive states. Validators are [Standard Schema](https://github.com/standard-schema/standard-schema) compatible schemas and behavior can be extended with features.

```ts
import { createForm } from 'feature-form';
import * as z from 'zod';

const $form = createForm({
	fields: {
		name: { defaultValue: '', validator: z.string().min(2) },
		email: { defaultValue: '', validator: z.string().email() }
	},
	onValidSubmit: (data) => save(data)
});

await $form.submit();
```

### Examples

- [React Basic](https://github.com/builder-group/community/tree/develop/examples/feature-form/react/basic) ([CodeSandbox](https://codesandbox.io/p/sandbox/basic-c4gd3t))

### Alternatives

- [react-hook-form](https://github.com/react-hook-form/react-hook-form)
- [TanStack Form](https://tanstack.com/form)

## Core API

### `createForm(config)`

Creates a form from field configs or pre-built form fields.

```ts
const $form = createForm({
	fields: {
		age: { defaultValue: 0 },
		username: {
			defaultValue: '',
			validator: z.string().min(3),
			validateOn: ['blur'],
			revalidateOn: ['change', 'blur']
		}
	}
});
```

**Config options**

| Option            | Default  | Description                                                                                                  |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `fields`          | required | Field configs or pre-built fields keyed by form data property.                                               |
| `validation`      | none     | Form-level validator for cross-field constraints.                                                            |
| `fieldValidation` | `{}`     | Shared `validateOn`, `revalidateOn`, and `collectErrorMode` for all field configs that do not override them. |
| `onValidSubmit`   | none     | Called on every valid submit. Per-call overrides can be passed to `submit()`.                                |
| `onInvalidSubmit` | none     | Called on every invalid submit. Per-call overrides can be passed to `submit()`.                              |

**Field config options**

| Option             | Default        | Description                                                                      |
| ------------------ | -------------- | -------------------------------------------------------------------------------- |
| `defaultValue`     | required       | Initial value and reset target.                                                  |
| `validator`        | none           | Field-level validator.                                                           |
| `validateOn`       | `['submit']`   | Triggers that run the validator before the first submit.                         |
| `revalidateOn`     | `['blur']`     | Triggers that run the validator after the first submit.                          |
| `collectErrorMode` | `'firstError'` | `'firstError'` keeps the first Standard Schema issue; `'all'` keeps every issue. |

### `submit(options?)` / `validate()` / `reset()`

```ts
const isValid = await $form.submit();

await $form.submit({
	onValidSubmit: (data) => save(data),
	onInvalidSubmit: (errors) => showErrors(errors),
	updateDefaultValues: true // resets will return to the submitted values after a valid submit
});

const unbind = $form.onValidSubmit((data) => save(data));
unbind();

const isValid = await $form.validate(); // runs all validators without submitting

$form.reset(); // resets all fields to their default values, clears status
```

`submit()` runs all field and form-level validators, aggregates current status, then fires the appropriate callbacks. Returns `true` if the form was valid, `false` otherwise. `onValidSubmit()` and `onInvalidSubmit()` register persistent callbacks; `submit()` options register callbacks for that submit call only.

### `getData()` / `getValidData()` / `getErrors()`

```ts
const data = $form.getData(); // current field values, regardless of validity
const data = $form.getValidData(); // current field values, or null if form is not valid

const errors = $form.getErrors();
errors.fields; // field-level errors keyed by field
errors.form; // form-level errors from the form-level validator
```

### `fields` / `getField(key)`

```ts
$form.fields.name; // TFormField<string>
$form.getField('name'); // same, useful when the key is dynamic
```

### Reactive states

| State          | Type                | Description                                                  |
| -------------- | ------------------- | ------------------------------------------------------------ |
| `status`       | `TValidationStatus` | Aggregate form status: `unvalidated`, `valid`, or `invalid`. |
| `isValidating` | `TState<boolean>`   | True while the latest validation run is pending.             |
| `isSubmitted`  | `TState<boolean>`   | True after the first submit attempt.                         |
| `isSubmitting` | `TState<boolean>`   | True while `submit()` is in progress.                        |

## Field API

Each entry in `form.fields` is a `TFormField<GValue>`, which is a full `feature-state` state with extra field methods installed.

### `set()` / `get()` / `value`

Fields are states, so the full state API is available:

```ts
$form.fields.name.set('Alice');
$form.fields.name.get(); // 'Alice'
$form.fields.name.value; // 'Alice'
$form.fields.name.value = 'Bob'; // same as set('Bob')
```

### `blur()` / `validate()` / `reset()`

```ts
$form.fields.name.blur(); // marks the field as touched, runs blur/touched validators
await $form.fields.name.validate(); // runs the field validator, updates status, returns true if valid
$form.fields.name.reset(); // resets value, touched, submitted, and status
```

### `onBlur(callback)`

Registers a callback for blur events. Returns an unsubscribe function.

```ts
const unbind = $form.fields.name.onBlur(({ wasTouched }) => {
	if (!wasTouched) {
		// first time the field was blurred
	}
});

unbind();
```

### Reactive states

| State          | Type                | Description                                                    |
| -------------- | ------------------- | -------------------------------------------------------------- |
| `status`       | `TValidationStatus` | Field validation status: `unvalidated`, `valid`, or `invalid`. |
| `isTouched`    | `TState<boolean>`   | True after the field has been blurred at least once.           |
| `isSubmitted`  | `TState<boolean>`   | True after the form has been submitted.                        |
| `isValidating` | `TState<boolean>`   | True while the field validator is running.                     |

### `defaultValue` / `key`

```ts
$form.fields.name.defaultValue; // the value used when reset() is called
$form.fields.name.key; // 'name', used in validation error paths
```

## Validation

### Triggers

`validateOn` controls which events run the validator before the first submit. `revalidateOn` controls the same after the first submit.

| Trigger     | When it fires                                                                       |
| ----------- | ----------------------------------------------------------------------------------- |
| `'submit'`  | On `submit()`.                                                                      |
| `'blur'`    | On every `blur()`.                                                                  |
| `'change'`  | On every value change via `set()`.                                                  |
| `'touched'` | On the first `blur()` only (first touch). For `revalidateOn`, use `'blur'` instead. |

```ts
// Validate on blur before submit, revalidate on every change after
const $form = createForm({
	fields: {
		email: {
			defaultValue: '',
			validator: z.string().email(),
			validateOn: ['blur', 'submit'],
			revalidateOn: ['change', 'submit']
		}
	}
});
```

### Form-level validator

Use `validation` for cross-field constraints that span multiple fields.

```ts
const $form = createForm({
	fields: {
		password: { defaultValue: '' },
		confirm: { defaultValue: '' }
	},
	validation: {
		validator: z
			.object({ password: z.string(), confirm: z.string() })
			.refine((d) => d.password === d.confirm, {
				message: 'Passwords do not match',
				path: ['confirm']
			}),
		validateOn: ['submit'],
		revalidateOn: ['change', 'submit']
	}
});
```

### Validation status

Both `form.status` and `field.status` hold a discriminated union:

```ts
const status = $form.fields.email.status.get();

if (status.type === 'invalid') {
	status.errors; // readonly TValidationError[]
	status.errors[0].message; // string
	status.errors[0].path; // validator path, e.g. ['address', 'city']
}
```

| `type`          | Meaning                                         |
| --------------- | ----------------------------------------------- |
| `'unvalidated'` | No validator has run yet.                       |
| `'valid'`       | Last run passed.                                |
| `'invalid'`     | Last run failed; `errors` contains the details. |

### Validators

`feature-form` accepts any [Standard Schema](https://github.com/standard-schema/standard-schema) compatible validator. Schema libraries that implement the spec can be passed directly without an adapter.

```ts
import * as v from 'valibot';
import * as z from 'zod';

const zodValidator = z.string().min(2).max(50);
const valibotValidator = v.pipe(v.string(), v.minLength(2), v.maxLength(50));
```

For custom validators, implement the `StandardSchemaV1` interface from [`@standard-schema/spec`](https://github.com/standard-schema/standard-schema).

Validators are used for validation only. If a schema transforms or coerces output values, `feature-form` does not write the parsed output back into the field state.

### Standalone fields

Fields can be created and used independently with `createFormField()`:

```ts
import { createFormField } from 'feature-form';
import * as z from 'zod';

const $name = createFormField('', {
	key: 'name',
	validator: z.string().min(2),
	validateOn: ['blur'],
	revalidateOn: ['change']
});

$name.set('Alice');
await $name.validate();
```

## Writing Features

Forms are `feature-core` feature hosts, so behavior can be extended with `.with()`. Annotate the `install()` parameter with `TFormBase<GFormData>` to access the core form API.

```ts
import { defineFeature, type TFeature } from 'feature-core';
import { type TFormBase, type TFormData } from 'feature-form';

type TDirtyFeature = TFeature<'dirty', { isDirty(): boolean }>;

export function dirtyFeature<GFormData extends TFormData>(): TDirtyFeature {
	return defineFeature<TDirtyFeature>({
		key: 'dirty',
		install(form: TFormBase<GFormData>) {
			const initial = form.getData();

			return {
				isDirty() {
					return JSON.stringify(form.getData()) !== JSON.stringify(initial);
				}
			};
		}
	});
}

const $form = createForm({ fields: { name: { defaultValue: '' } } }).with(dirtyFeature());

$form.fields.name.set('Alice');
$form.isDirty(); // true
```

See the [feature-core README](https://github.com/builder-group/community/tree/develop/packages/feature-core) for a full guide on `defineFeature()`, dependency declaration, and the feature model.

## ❓ FAQ

### Why separate `validateOn` and `revalidateOn`?

The two phases have different UX goals. Before the first submit, aggressive validation (e.g. `'change'`) can feel intrusive. After the first submit the user expects immediate feedback as they correct errors, so `revalidateOn: ['change']` is appropriate. Keeping the phases separate lets you configure each independently.

### What does the `'touched'` trigger do?

`'touched'` fires on the first `blur()` only. It is useful when you want to validate after the user leaves a field for the first time but not on every subsequent blur. It is only valid in `validateOn`; use `'blur'` in `revalidateOn` instead.

### What does `getErrors()` return before validation?

Only fields with `'invalid'` status appear in `errors.fields`. Unvalidated fields are omitted. `errors.form` is always an empty array until the form-level validator has run.

### How does `reset()` copy default values?

`reset()` deep-copies plain objects and arrays. Non-plain objects such as `Date`, `Map`, class instances, and browser objects are kept by reference. If a field stores a mutable non-plain object, replace it with a new instance before updating the default value.

### When should I use `createFormField` instead of defining fields inside `createForm`?

Use `createFormField` when a field needs to exist independently of a specific form. For example, a shared search input or a field that is conditionally added to different forms. Pass the resulting `TFormField` directly into the `createForm` fields config.

### Why is `updateDefaultValues` opt-in?

After a successful submit, some forms should reset to blank (registration flows), while others should treat the submitted data as the new baseline (settings pages). `updateDefaultValues: true` opts into the latter so that `reset()` returns to what was last submitted.
