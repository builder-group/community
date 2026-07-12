# React App Structure

How React app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── routes/       # Route entry points and screen composition
├── environment/  # App-wide config, bindings, and runtime resources
├── modules/      # Bounded product, system, or integration behavior
└── lib/          # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

### `routes/`

Owns navigation entry points and screen composition.

### `environment/`

Owns app-wide configuration, generated bindings, initialized resources, and runtime setup.

Keep one top-level `environment/`. Organize its contents by app-wide infrastructure concern. Keep `modules/` organized by bounded behavior:

- Put declarative app-wide configuration in `environment/configs/`
- Put each app-wide runtime resource or set of generated bindings in a descriptive folder, such as `environment/api/` or `environment/generated/`
- Keep request-, flow-, or module-scoped configuration and setup directly in its owning module
- Do not use `environment/` as a generic home for constants

### `modules/`

Owns bounded product, system, or integration behavior.

- Keep setup specific to a behavior inside its owning module
- Do not depend on routes

### `lib/`

Owns helpers that are shared across multiple modules and do not belong to one specific module.

- Keep `lib/` thin, and move helpers into a module when they are only used there

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

App config or an API client intentionally shared across the app belongs in `environment/`. State, configuration, clients, and providers scoped to one module remain with that module. A class-name helper used by several unrelated modules can remain in `lib/`.
