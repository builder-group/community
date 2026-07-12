# Rust App Structure

How Rust app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── app/          # App lifecycle, shell wiring, framework setup
├── environment/  # App-wide initialized values and runtime setup
├── modules/      # Bounded product, system, or integration behavior
└── common/       # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`app/` owns lifecycle, shell wiring, and framework entry points.

`environment/` owns values initialized once for the whole app, such as app config, logger setup, database pools, runtime paths, and generated bindings.

`modules/` owns bounded product, system, or integration behavior.

`common/` owns helpers that are shared across multiple modules and do not belong to one specific module. Use `common/` instead of `lib/` in Rust apps so it does not get confused with `lib.rs`.

## Example

```txt
src/
├── app/
│   ├── mod.rs
│   └── lifecycle.rs
├── environment/
│   ├── mod.rs
│   └── configs/
│       ├── app.rs
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

For example, app config or a database pool initialized once and intentionally shared across the app belongs in `environment/`. State and values scoped to a request or flow, or used only by one module, remain with the behavior that owns them. A time helper used by several unrelated modules can remain in `common/`.

## Guidance

- Keep shell setup in `app/`
- Keep app-wide initialized values and runtime setup in `environment/`
- Keep state and setup scoped to a request, flow, or module in their owning module
- Do not use `environment/` as a generic home for constants
- Keep behavior close to the module that owns it
- Keep `common/` thin and move helpers into a module when they are only used there
- Keep dependency direction clear: modules must not depend on app assembly
