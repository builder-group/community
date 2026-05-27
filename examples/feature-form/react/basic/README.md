# feature-form React Basic

React example for `feature-form` and `feature-react/form`. It shows a typed form where fields are reactive state, validation uses Zod through Standard Schema, and components subscribe to the field or form state they render.

## What It Shows

- `createForm<TFormData>` with typed submit data
- field bindings with `useFormField`
- Zod validation through Standard Schema
- form-level validation for the admin age rule
- dirty tracking with `dirtyFeature()`
- render counters for per-field subscriptions

## Run

```sh
pnpm dev
```
