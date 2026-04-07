# Rust App Structure

How Rust app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── app/          # App lifecycle, shell wiring, framework setup
├── environment/  # App-wide config, logger, db, runtime setup
├── modules/      # Bounded areas of app behavior
└── common/       # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`app/` owns lifecycle, shell wiring, and framework entry points.

`environment/` owns things that exist once for the whole app, such as app config, logger setup, database setup, runtime paths, and generated bindings.

`modules/` owns bounded areas of app behavior, such as settings, sessions, updater flows, and other product or system areas.

`common/` owns helpers that are shared across multiple modules and do not belong to one specific module. Use `common/` instead of `lib/` in Rust apps so it does not get confused with `lib.rs`.

## Example

```txt
src/
├── app/
│   ├── mod.rs
│   └── window.rs
├── environment/
│   ├── mod.rs
│   └── configs/
│       ├── app.rs
│       └── mod.rs
├── modules/
│   ├── mod.rs
│   └── example/
│       ├── commands.rs
│       ├── mod.rs
│       └── types.rs
└── common/
    └── mod.rs
```

## Guidance

- Keep shell setup in `app/`
- Keep app-wide setup in `environment/`
- Keep behavior close to the module that owns it
- Keep `common/` thin and move helpers into a module when they are only used there
