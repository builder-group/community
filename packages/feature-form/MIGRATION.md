# Migration Guide

## 0.0.x to 0.1.0

`feature-form` now uses Standard Schema validators directly and the shared `.with(feature())` composition model from `feature-core`. The form model is still framework-agnostic, but validation setup, status values, submit callbacks, and helper exports changed.

### Use Standard Schema Directly

Validation adapters such as `zValidator`, `vValidator`, and `createValidator` are no longer used by `feature-form`.

Pass a Standard Schema-compatible schema directly:

```ts
import { createForm } from 'feature-form';
import { z } from 'zod';

const form = createForm({
  fields: {
    email: {
      defaultValue: '',
      validator: z.string().email()
    }
  }
});
```

Zod, Valibot, ArkType, and other Standard Schema-compatible validators can be used without wrapping.

### Replace Validation Mode Flags

The old bitwise `validateMode` and `reValidateMode` flags were removed.

Use `validateOn` and `revalidateOn` string arrays:

```ts
// old
createForm({
  fields: {
    email: {
      defaultValue: '',
      validator,
      validateMode: VALIDATION_MODE.BLUR,
      reValidateMode: VALIDATION_MODE.CHANGE
    }
  }
});

// new
createForm({
  fields: {
    email: {
      defaultValue: '',
      validator,
      validateOn: ['blur'],
      revalidateOn: ['change']
    }
  }
});
```

Form-created fields now default to `submit` validation and `change` revalidation.

### Update Status Checks

Status values are now lowercase.

| Old status    | New status    |
| ------------- | ------------- |
| `UNVALIDATED` | `unvalidated` |
| `VALID`       | `valid`       |
| `INVALID`     | `invalid`     |

```ts
const status = form.fields.email.status.get();

if (status.type === 'invalid') {
  console.error(status.errors[0]?.message);
}
```

Field errors now use `{ message, path?: PropertyKey[] }`. The old `{ code, message?, path?: string }` shape was removed.

### Use Form-Level Status Instead Of `isValid`

Form and field `isValid()` helpers were removed.

Use reactive status state instead:

```ts
const formStatus = form.status.get();

if (formStatus.type === 'valid') {
  // Submit or continue.
}
```

Fields with validators start as `unvalidated`. Forms without validators start as `valid`.

### Update Submit Callbacks

Submit callbacks now return `void | Promise<void>`. The old `TSubmitCallbackResponse`, `TSubmitData`, `postSubmitCallback`, and return-object aggregation model was removed.

`assignToInitial` was replaced by `submit({ updateDefaultValues: true })`:

```ts
await form.submit({
  updateDefaultValues: true,
  onValidSubmit: async (values) => {
    await saveProfile(values);
  }
});
```

Use form-level `isSubmitting` instead of field-level `isSubmitting`.

### Update Error Collection

`getErrors()` now returns grouped errors:

```ts
const errors = form.getErrors();

console.log(errors.fields.email);
console.log(errors.form);
```

The old flat field-keyed object was removed. Unvalidated fields are omitted instead of returned as synthetic errors.

### Replace Change Helpers With `dirtyFeature`

`hasFormChanged()` was removed.

Use `dirtyFeature()` when you need reactive dirty state:

```ts
import { createForm, dirtyFeature } from 'feature-form';

const form = createForm({
  fields: {
    name: { defaultValue: '' }
  }
}).with(dirtyFeature());

form.isDirty.get();
form.dirtyFields.get();
form.resetDirty();
```

### Removed Exports

The root export no longer includes `BitwiseFlag`, `bitwiseFlag`, `helper/*`, `form-field/*` barrels, or `isFormWithFeatures`.

Use the root exports for `createForm`, `createFormField`, `dirtyFeature`, and public types. Deep imports from old `dist/.../form-field`, `dist/.../helper`, or split `types/*` paths are not supported.
