# React App Structure

How React app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
src/
├── routes/       # Route entry points and screen composition
├── environment/  # App-wide config, generated bindings, runtime setup
├── modules/      # Bounded areas of app behavior
└── lib/          # Thin shared helpers
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`routes/` owns navigation entry points and screen composition.

`environment/` owns things that exist once for the whole app, such as app config, API setup, generated bindings, and providers.

`modules/` owns bounded areas of app behavior, such as settings, sessions, updater flows, and other product or system areas.

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
│   └── specta/
├── modules/
│   ├── settings/
│   ├── session/
│   └── updater/
└── lib/
    └── cn.ts
```

## Guidance

- Keep routes focused on composition and navigation
- Keep app-wide setup in `environment/`
- Keep behavior close to the module that owns it
- Keep `lib/` thin and move helpers into a module when they are only used there
