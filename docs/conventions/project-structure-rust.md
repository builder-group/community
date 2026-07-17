# Rust App Structure

How Rust app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── app/          # App lifecycle, shell wiring, framework setup
├── environment/  # App-wide config, bindings, and runtime resources
├── modules/      # Bounded product, system, or integration behavior
└── common/       # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

### `app/`

Owns lifecycle, shell wiring, and framework entry points.

### `environment/`

Owns app-wide configuration, generated bindings, initialized resources, and runtime setup.

Keep one top-level `environment/`. Organize its contents by app-wide infrastructure concern. Keep `modules/` organized by bounded behavior:

- Put declarative app-wide configuration in `environment/configs/`
- Put each app-wide runtime resource or set of generated bindings in a descriptive module, such as `environment/database/` or `environment/generated/`
- Keep request-, flow-, or module-scoped configuration and setup directly in its owning module
- Do not use `environment/` as a generic home for constants

### `modules/`

Owns bounded product, system, or integration behavior.

- Keep setup specific to a behavior inside its owning module
- Do not depend on app assembly

### `common/`

Owns helpers that are shared across multiple modules and do not belong to one specific module.

- Use `common/` instead of `lib/` in Rust apps so it does not get confused with `lib.rs`
- Keep `common/` thin, and move helpers into a module when they are only used there

## Example

```txt
src/
├── app/
│   ├── mod.rs
│   └── lifecycle.rs
├── environment/
│   ├── mod.rs
│   ├── configs/
│   │   ├── app.rs
│   │   └── mod.rs
│   └── database/
│       └── mod.rs
├── modules/
│   ├── mod.rs
│   └── account/
│       ├── handlers.rs
│       ├── mod.rs
│       └── service.rs
└── common/
    ├── mod.rs
    └── time.rs
```

App config or a database pool intentionally shared across the app belongs in `environment/`. State, configuration, clients, and caches scoped to one module remain with that module. A time helper used by several unrelated modules can remain in `common/`.
