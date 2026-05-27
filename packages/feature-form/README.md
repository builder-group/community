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

`feature-form` is framework-agnostic form state built from reactive fields. It uses Standard Schema validators directly, lets each field choose when validation runs, and keeps submit handling on the form object.

- Validate with Zod, Valibot, ArkType, or any [Standard Schema](https://github.com/standard-schema/standard-schema) validator without resolver packages
- Tune validation per field: stay quiet while typing, validate on blur or submit, then revalidate on change
- Subscribe only to the state a view renders: value, status, touched, submitted, dirty
- Add typed behavior with `.with()` features, including built-in dirty tracking

```ts
import { createForm, dirtyFeature } from 'feature-form';
import * as z from 'zod';

const $form = createForm({
  fields: {
    email: {
      defaultValue: '',
      validator: z.string().email(),
      validateOn: ['blur', 'submit'], // no errors while typing
      revalidateOn: ['change', 'submit'] // revalidate after first submit
    },
    password: {
      defaultValue: '',
      validator: z.string().min(8),
      validateOn: ['touched', 'submit'], // first blur, subsequent changes, and submit
      revalidateOn: ['change', 'submit']
    }
  },
  onValidSubmit: (data) => console.log(data)
}).with(dirtyFeature());

const unbind = $form.fields.email.status.listen(({ value }) => {
  if (value.type === 'invalid') {
    console.log(value.errors[0].message);
  }
});

$form.fields.email.set('not-an-email');
$form.fields.email.blur(); // validates email and notifies the status listener

await $form.submit(); // runs submit-triggered validators and calls onValidSubmit when valid
$form.isDirty.get(); // true if any field differs from its default value
unbind();
```

Migrating from `0.0.x`? See [MIGRATION.md](./MIGRATION.md).

## Install

```bash
npm install feature-form
```

Examples use Zod, but any Standard Schema validator works:

```bash
npm install zod
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
  onValidSubmit: (data) => console.log(data)
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

## Form

### `createForm(config)`

Creates a form and returns it as a feature host. Each key in `fields` becomes a reactive `TFormField` with validation, blur tracking, and status.

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
  onValidSubmit: (data) => console.log(data),
  onInvalidSubmit: (errors) => console.error(errors),
  updateDefaultValues: true, // treat submitted values as new reset baseline
  context: { source: 'settings-form' } // passed through to submit callbacks
});

const unbind = $form.onValidSubmit((data) => console.log(data));
unbind();

const isValid = await $form.validate(); // runs all validators without submitting

$form.reset(); // resets values, validation status, isTouched, and isSubmitted
```

`submit()` runs validators configured for the submit trigger. All matching field validators and the form validator run together. No failing validator prevents the others from completing, so submit gives you a complete error picture for validators that ran. Returns `true` if the form was valid, `false` otherwise. Persistent callbacks registered via `onValidSubmit()` / `onInvalidSubmit()` and per-call options passed to `submit()` both run in parallel.

`validate()` runs all validators the same way but has no submit side effects: it updates validation state, but does not set `isSubmitted`, does not fire `onValidSubmit` or `onInvalidSubmit`, and does not update default values.

`reset()` restores all fields to their `defaultValue` and clears `status`, `isTouched`, and `isSubmitted` on both the form and every field. Any in-flight async validation is invalidated so stale results cannot update field status.

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

### Validation triggers

`validateOn` controls which events run the validator before the first submit. `revalidateOn` controls the same after the first submit.

| Trigger     | When it fires                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `'submit'`  | On `submit()`.                                                                                                      |
| `'blur'`    | On every `blur()`.                                                                                                  |
| `'change'`  | On every value change via `set()`.                                                                                  |
| `'touched'` | On the first `blur()`, and on every subsequent `set()` once the field has been touched. Only valid in `validateOn`. |

The `'touched'` trigger covers the "validate once the user has interacted" pattern: no validation fires until the first blur, then validation follows every change from that point on. In `revalidateOn` use `'blur'` instead.

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

Validators run for validation only. If a schema transforms or coerces output values, the parsed output does not write back into the field state. `getValidData()` and submit callbacks keep returning the current field values.

## Field

Each entry in `form.fields` is a `TFormField<GValue>`: a full `feature-state` state with form-specific methods added.

### `createFormField(defaultValue, config)`

Creates a field independently of any form. Use this for a shared search input or a field conditionally composed into different forms. `config.key` is required because validation errors use it for path routing. Pass the resulting `TFormField` directly into the `createForm` fields config.

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

## Built-in Features

Features are installed via `.with()` and extend the form with new methods.

### `dirtyFeature()`

Adds `isDirty`, `dirtyFields`, and `resetDirty()`. Tracks whether each field differs from its default value. By default it compares primitives, arrays, and plain objects structurally. Pass `dirtyFeature({ isEqual })` for other value types.

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

## Extending with Features

Forms are `feature-core` feature hosts. Add behavior with `.with(yourFeature())`. See the [feature-core README](https://github.com/builder-group/community/tree/develop/packages/feature-core) for a full guide on `defineFeature()`, dependency declaration, and the feature model.

## Examples

- [React Basic](https://github.com/builder-group/community/tree/develop/examples/feature-form/react/basic) ([CodeSandbox](https://codesandbox.io/p/sandbox/basic-c4gd3t))

## FAQ

### How does it compare to react-hook-form, Formik, and TanStack Form?

`feature-form` puts the form object outside the UI framework. That makes it closer to a reactive model than a React hook. Use it when you want one form core that can be reused across React, Vue, Svelte, tests, and plain JavaScript.

- [react-hook-form](https://github.com/react-hook-form/react-hook-form): strong React-first uncontrolled form library with validation resolvers
- [Formik](https://formik.org): mature controlled React form library
- [TanStack Form](https://tanstack.com/form): framework-agnostic form library with official framework adapters

### Does it work outside React?

Yes. The form and field objects are plain JavaScript. Fields are reactive states from `feature-state`, which has no framework dependency. Subscribe with `.listen()` in Vue, Svelte, vanilla JS, or any runtime. The [feature-react](https://github.com/builder-group/community/tree/develop/packages/feature-react) package provides React hooks if you want them.

### Why separate `validateOn` and `revalidateOn`?

Before the first submit, aggressive validation (e.g. `'change'`) can feel intrusive because the user has not finished yet. After submit they expect immediate feedback as they correct errors. Keeping the phases separate lets you configure each independently without a single `mode` flag that tries to cover both.

### Does it support async validators?

Yes. Any Standard Schema validator can be async. `submit()` and `validate()` are both async and await all validators. The `isValidating` state on both the form and each field reflects whether a run is in progress. In-flight async runs are invalidated by run ID when `reset()` is called, so stale results never overwrite reset state.

### Do all field validators run on submit, or does it stop at the first error?

All validators configured for the submit trigger run together. No failing submit-triggered validator skips the others, so submit gives a complete picture of every submit-triggered validation error.

### What does `getErrors()` return before any validation has run?

Only fields with `'invalid'` status or form-level path errors appear in `errors.fields`. Unvalidated fields are omitted. `errors.form` contains only pathless form-level errors.

### Can I register multiple `onValidSubmit` callbacks?

Yes. Callbacks registered via `form.onValidSubmit(callback)` are additive. On submit, all persistent callbacks and any per-call callback passed to `submit({ onValidSubmit })` run in parallel. There is no guaranteed order between them.

### When should I use `createFormField` instead of defining fields inside `createForm`?

Use `createFormField` when a field needs to exist independently of any specific form: a shared search input, or a field conditionally composed into different forms. Pass the resulting `TFormField` directly into the `createForm` fields config.
