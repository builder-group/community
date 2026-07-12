# React App Structure

How React app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── routes/       # Route entry points and screen composition
├── environment/  # App-wide initialized values and runtime setup
├── modules/      # Bounded product, system, or integration behavior
└── lib/          # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`routes/` owns navigation entry points and screen composition.

`environment/` owns values initialized once for the whole app, such as app config, shared API setup, generated bindings, and app-wide providers.

`modules/` owns bounded product, system, or integration behavior.

`lib/` owns helpers that are shared across multiple modules and do not belong to one specific module.

## Example

```txt
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   └── settings.tsx
├── environment/
│   ├── configs/
│   ├── api/
│   └── generated/
├── modules/
│   ├── account/
│   ├── authentication/
│   └── settings/
└── lib/
    └── cn.ts
```

For example, app config or an API client initialized once and intentionally shared across the app belongs in `environment/`. State and values scoped to a request or flow, or used only by one module, remain with the behavior that owns them. A framework-neutral class-name helper used throughout the app can remain in `lib/`.

## Guidance

- Keep routes focused on composition and navigation
- Keep app-wide initialized values and runtime setup in `environment/`
- Keep state and setup scoped to a request, flow, or module in their owning module
- Do not use `environment/` as a generic home for constants
- Keep behavior close to the module that owns it
- Keep `lib/` thin and move helpers into a module when they are only used there
- Keep dependency direction clear: modules must not depend on routes
