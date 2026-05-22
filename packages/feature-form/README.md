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

Form state that works in any framework. Fields are reactive states you subscribe to directly, validators are [Standard Schema](https://github.com/standard-schema/standard-schema) compatible, and validation timing is configured per field.

- Framework-agnostic: fields are reactive states, subscribe to status changes in React, Vue, or vanilla JS
- Standard Schema compatible: Zod, Valibot, or any custom validator works without adapters or wrappers
- Two-phase validation built in: quiet before submit, immediate feedback after, configured per field
- Extend with `.with()` instead of fighting a plugin system or forking for custom behavior

```ts
import { createForm } from 'feature-form';
import * as z from 'zod';

const $form = createForm({
	fields: {
		email: {
			defaultValue: '',
			validator: z.string().email(),
			validateOn: ['blur', 'submit'], // quiet while typing
			revalidateOn: ['change', 'submit'] // immediate after first submit
		}
	}
});

// Fields are reactive states: subscribe in any framework
$form.fields.email.status.listen(({ value }) => {
	if (value.type === 'invalid') showError(value.errors[0].message);
});

await $form.submit();
```

## Install

```bash
npm install feature-form
```

## Usage

Fields are reactive states. Subscribe to status changes to wire validation feedback directly into your UI:

```ts
import { createForm } from 'feature-form';
import * as z from 'zod';

const $form = createForm({
	fields: {
		email: { defaultValue: '', validator: z.string().email() }
	},
	onValidSubmit: (data) => save(data)
});

$form.fields.email.status.listen(({ value }) => {
	if (value.type === 'invalid') {
		console.log(value.errors[0].message);
	}
});

$form.fields.email.set('not-an-email'); // set() alone does not validate (validateOn defaults to ['submit'])
await $form.submit(); // triggers validation, listener fires with error
```

Control when validation fires with per-field triggers. Keep errors quiet before the user has finished, then switch to immediate feedback once they have tried to submit:

```ts
const $form = createForm({
	fields: {
		email: {
			defaultValue: '',
			validator: z.string().email(),
			validateOn: ['blur', 'submit'], // quiet while typing, fires on blur
			revalidateOn: ['change', 'submit'] // immediate feedback after first submit
		}
	}
});
```

Extend the form with features using `.with()`:

```ts
import { dirtyFeature } from 'feature-form';

const $form = createForm({
	fields: { name: { defaultValue: 'Alice' } }
}).with(dirtyFeature());

$form.fields.name.set('Bob');
$form.isDirty.get(); // true
$form.dirtyFields.get(); // { name: true }
```

## Examples

- [React Basic](https://github.com/builder-group/community/tree/develop/examples/feature-form/react/basic) ([CodeSandbox](https://codesandbox.io/p/sandbox/basic-c4gd3t))

## Form

### `createForm(config)`

```ts
const $form = createForm({
	fields: {
		age: { defaultValue: 0 },
		username: {
			defaultValue: '',
			validator: z.string().min(3),
			validateOn: ['submit', 'blur'],
			revalidateOn: ['submit', 'change', 'blur']
		}
	}
});
```

| Option             | Default                | Description                                                                                              |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `fields`           | required               | Field configs or pre-built fields keyed by form data property.                                           |
| `validator`        | none                   | Form-level validator for cross-field constraints.                                                        |
| `validateOn`       | `['submit']`           | Default triggers for the form validator and fields that do not override them.                            |
| `revalidateOn`     | `['submit', 'change']` | Default revalidation triggers for the form validator and fields that do not override them.               |
| `collectErrorMode` | `'firstError'`         | Default Standard Schema error collection mode for the form validator and fields that do not override it. |
| `onValidSubmit`    | none                   | Called on every valid submit. Per-call overrides can be passed to `submit()`.                            |
| `onInvalidSubmit`  | none                   | Called on every invalid submit. Per-call overrides can be passed to `submit()`.                          |

**Field config options**

| Option             | Default                | Description                                                                      |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------- |
| `defaultValue`     | required               | Initial value and reset target.                                                  |
| `validator`        | none                   | Field-level validator.                                                           |
| `validateOn`       | `['submit']`           | Triggers that run the validator before the first submit.                         |
| `revalidateOn`     | `['submit', 'change']` | Triggers that run the validator after the first submit.                          |
| `collectErrorMode` | `'firstError'`         | `'firstError'` keeps the first Standard Schema issue; `'all'` keeps every issue. |

### `submit()` / `validate()` / `reset()`

```ts
const isValid = await $form.submit();

await $form.submit({
	onValidSubmit: (data) => save(data),
	onInvalidSubmit: (errors) => showErrors(errors),
	updateDefaultValues: true, // treat submitted values as new reset baseline
	context: { event } // passed through to onValidSubmit / onInvalidSubmit callbacks
});

const unbind = $form.onValidSubmit((data) => save(data));
unbind();

const isValid = await $form.validate(); // runs all validators without submitting

$form.reset(); // resets values, validation status, isTouched, and isSubmitted
```

`submit()` runs validators configured for the submit trigger. All matching field validators and the form validator run together; no failing validator prevents the others from completing. Returns `true` if the form was valid, `false` otherwise. Persistent callbacks registered via `onValidSubmit()` / `onInvalidSubmit()` and per-call options passed to `submit()` both run in parallel.

`validate()` runs all validators the same way but has no submit side effects: it updates validation state, but does not set `isSubmitted`, does not fire `onValidSubmit` or `onInvalidSubmit`, and does not update default values.

`reset()` restores all fields to their `defaultValue` and clears `status`, `isTouched`, and `isSubmitted` on both the form and every field. Any in-flight async validation is cancelled so stale results cannot update field status.

### `getData()` / `getValidData()` / `getErrors()`

```ts
const data = $form.getData(); // current field values, regardless of validity
const data = $form.getValidData(); // current field values, or null if form status is not 'valid'

const errors = $form.getErrors();
errors.fields; // invalid fields and form-level errors whose path points at a field
errors.form; // pathless or unknown-path form-level errors
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

## Field

Each entry in `form.fields` is a `TFormField<GValue>`, which is a full `feature-state` state with form-specific methods added.

### `set()` / `get()` / `value`

```ts
$form.fields.name.set('Alice');
$form.fields.name.get(); // 'Alice'
$form.fields.name.value; // 'Alice'
$form.fields.name.value = 'Bob'; // same as set('Bob')
```

### `blur()` / `validate()` / `reset()`

```ts
$form.fields.name.blur(); // marks touched, runs blur/touched validators
await $form.fields.name.validate(); // runs the field validator, returns true if valid
$form.fields.name.reset(); // resets value, touched, submitted, and status
```

### `onBlur(callback)`

```ts
const unbind = $form.fields.name.onBlur(({ wasTouched }) => {
	if (!wasTouched) {
		// first time this field was blurred
	}
});

unbind();
```

### Reactive states

| State          | Type                | Description                                                                          |
| -------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `status`       | `TValidationStatus` | Field display status, including field validator errors and routed form-level errors. |
| `isTouched`    | `TState<boolean>`   | True after the field has been blurred at least once.                                 |
| `isSubmitted`  | `TState<boolean>`   | True after the form has been submitted.                                              |
| `isValidating` | `TState<boolean>`   | True while the field validator is running.                                           |

### `defaultValue` / `key`

```ts
$form.fields.name.defaultValue; // the value used when reset() is called
$form.fields.name.key; // 'name', used in validation error paths
```

## Standalone fields

Fields can be created and used independently with `createFormField()`:

```ts
import { createFormField } from 'feature-form';

const $name = createFormField('', {
	key: 'name',
	validator: z.string().min(2),
	validateOn: ['blur'],
	revalidateOn: ['change']
});

$name.set('Alice');
await $name.validate();
```

## Validation

### Triggers

`validateOn` controls which events run the validator before the first submit. `revalidateOn` controls the same after the first submit.

| Trigger     | When it fires                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `'submit'`  | On `submit()`.                                                                                                      |
| `'blur'`    | On every `blur()`.                                                                                                  |
| `'change'`  | On every value change via `set()`.                                                                                  |
| `'touched'` | On the first `blur()`, and on every subsequent `set()` once the field has been touched. Only valid in `validateOn`. |

The `'touched'` trigger is useful for a "validate once the user has interacted with this field" pattern: no validation fires until the first blur, then validation follows every change from that point on. In `revalidateOn` use `'blur'` instead.

```ts
// validate on blur before submit, revalidate on every change after
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

Use `validator` for cross-field constraints. `validateOn`, `revalidateOn`, and `collectErrorMode` are shared defaults for the form validator and field validators unless a field overrides them.

The library routes form-level validator errors by path. An issue that points at a field appears in `getErrors().fields` and in the matching field's `status`, with the field key stripped from the path. Pathless issues and paths with no matching field appear in `getErrors().form`.

```ts
const $form = createForm({
	fields: {
		password: { defaultValue: '' },
		confirm: { defaultValue: '' }
	},
	validator: z
		.object({ password: z.string(), confirm: z.string() })
		.refine((d) => d.password === d.confirm, {
			message: 'Passwords do not match',
			path: ['confirm']
		}),
	validateOn: ['submit'],
	revalidateOn: ['change', 'submit']
});
```

### Validation status

Both `form.status` and `field.status` are discriminated unions:

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

Any [Standard Schema](https://github.com/standard-schema/standard-schema) compatible validator works directly without an adapter.

```ts
import * as v from 'valibot';
import * as z from 'zod';

const zodValidator = z.string().min(2).max(50);
const valibotValidator = v.pipe(v.string(), v.minLength(2), v.maxLength(50));
```

For custom validators, implement the `StandardSchemaV1` interface from [`@standard-schema/spec`](https://github.com/standard-schema/standard-schema).

Validators run for validation only. If a schema transforms or coerces output values, the parsed output does not write back into the field state.

## Built-in Features

### `dirtyFeature()`

Adds `isDirty`, `dirtyFields`, and `resetDirty()`. Tracks whether any field value has changed from its default value using deep structural equality, not reference equality.

```ts
import { dirtyFeature } from 'feature-form';

const $form = createForm({
	fields: {
		name: { defaultValue: 'Alice' },
		email: { defaultValue: 'alice@example.com' }
	}
}).with(dirtyFeature());

$form.fields.name.set('Bob');

$form.isDirty.get(); // true
$form.dirtyFields.get(); // { name: true, email: false }

$form.resetDirty(); // updates each field's defaultValue to its current value
$form.isDirty.get(); // false
```

`isDirty` and `dirtyFields` are reactive states. `resetDirty()` makes the current values the new baseline without clearing them. When `submit({ updateDefaultValues: true })` succeeds, dirty state clears automatically.

## Extending with features

Forms are `feature-core` feature hosts. Add behavior with `.with(yourFeature())`. See the [feature-core README](https://github.com/builder-group/community/tree/develop/packages/feature-core) for a full guide on `defineFeature()`, dependency declaration, and the feature model.

## Alternatives

- [react-hook-form](https://github.com/react-hook-form/react-hook-form)
- [TanStack Form](https://tanstack.com/form)

## FAQ

### Why separate `validateOn` and `revalidateOn`?

Before the first submit, aggressive validation (e.g. `'change'`) can feel intrusive because the user hasn't finished yet. After submit they expect immediate feedback as they correct errors. Keeping the phases separate lets you configure each independently without a single `mode` flag that tries to cover both.

### What does `getErrors()` return before any validation has run?

Only fields with `'invalid'` status or form-level path errors appear in `errors.fields`. Unvalidated fields are omitted. `errors.form` contains only pathless form-level errors.

### Do all field validators run on submit, or does it stop at the first error?

Validators configured for the submit trigger are awaited together. No matching field validator is skipped because another failed, so submit gives you a complete picture of configured submit errors.

### What is the difference between `validate()` and `submit()`?

`validate()` runs all validators and returns whether the form is valid, but has no other side effects. It does not set `isSubmitted`, does not fire `onValidSubmit` or `onInvalidSubmit`, and does not update default values. Use it to check validity without treating the action as a submit attempt.

### Can I register multiple `onValidSubmit` callbacks?

Yes. Callbacks registered via `form.onValidSubmit(callback)` are additive; each call adds to the list. On submit, the persistent callbacks and any per-call callback passed to `submit({ onValidSubmit })` are all called in parallel. There is no guaranteed order between them.

### How does `reset()` handle default values that are objects or arrays?

`reset()` deep-copies plain objects and arrays so each reset gets a fresh copy. Non-plain objects (`Date`, `Map`, class instances, browser objects) are kept by reference. If a field stores a mutable non-plain object, replace it with a new instance before relying on reset.

### Why is `updateDefaultValues` opt-in?

After a successful submit, some forms should reset to blank (registration), while others should treat the submitted data as the new baseline (settings pages). `updateDefaultValues: true` opts into the latter; the default keeps the original `defaultValue` so reset always returns to a known state.

### What happens to an in-flight async validator when `reset()` is called?

`reset()` increments an internal validation run ID. When the async result arrives, it checks whether the run ID still matches. If not, the result is discarded and the field status is not updated. This prevents stale validation results from overwriting the reset state.

### Does `dirtyFeature` use deep equality or reference equality?

Deep structural equality. Two plain objects with the same shape and values are considered equal. This means mutating an object in place without replacing it will not be detected as a change; always pass a new object to `set()`.

### When should I use `createFormField` instead of defining fields inside `createForm`?

Use `createFormField` when a field needs to exist independently of any specific form, for example a shared search input or a field that is conditionally composed into different forms. Pass the resulting `TFormField` directly into the `createForm` fields config.
