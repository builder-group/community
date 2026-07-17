# Swift App Structure

How Swift and SwiftUI app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
AppName/
├── Routes/       # Screen entry points and navigation-owned composition
├── Environment/  # App-wide config, bindings, and runtime resources
├── Modules/      # Bounded product, system, or integration behavior
├── Views/        # Shared view building blocks
└── Extensions/   # Small type extensions shared across the app
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

### `Routes/`

Owns screen entry points and navigation-owned composition.

### `Environment/`

Owns app-wide configuration, generated bindings, initialized resources, and runtime setup.

Keep one top-level `Environment/`. Organize its contents by app-wide infrastructure concern. Keep `Modules/` organized by bounded behavior:

- Put declarative app-wide configuration in `Environment/Configs/`
- Put each app-wide runtime resource or set of generated bindings in a descriptive folder, such as `Environment/Persistence/` or `Environment/Generated/`
- Keep request-, flow-, or module-scoped configuration and setup directly in its owning module
- Do not use `Environment/` as a generic home for constants

### `Modules/`

Owns bounded product, system, or integration behavior.

- Keep setup specific to a behavior inside its owning module
- Do not depend on routes

### `Views/`

Owns reusable UI building blocks that are shared across routes or modules.

- Keep `Views/` thin, and move a view into a module when it only serves that area

### `Extensions/`

Owns small type extensions that improve readability and do not belong to one specific module.

- Keep `Extensions/` thin, and move an extension into a module when it only serves that area

## Example

```txt
AppName/
├── AppNameApp.swift
├── Routes/
│   ├── Home/
│   │   └── HomeView.swift
│   └── Settings/
│       └── SettingsView.swift
├── Environment/
│   ├── Configs/
│   │   └── AppConfig.swift
│   └── Persistence/
│       └── DataContainer.swift
├── Modules/
│   ├── Account/
│   │   └── AccountStore.swift
│   └── Onboarding/
│       └── OnboardingStore.swift
├── Views/
│   └── BannerView.swift
└── Extensions/
    └── Color+App.swift
```

App config or a data container intentionally shared across the app belongs in `Environment/`. State, configuration, stores, and managers scoped to one module remain with that module. A banner used across unrelated routes can remain in `Views/`.
