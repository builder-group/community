# Swift App Structure

How Swift and SwiftUI app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
AppName/
├── Routes/       # Screen entry points and navigation-owned composition
├── Environment/  # App-wide initialized values and runtime setup
├── Modules/      # Bounded product, system, or integration behavior
├── Views/        # Shared view building blocks
└── Extensions/   # Small type extensions shared across the app
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`Routes/` owns screen entry points and navigation-owned composition.

`Environment/` owns values initialized once for the whole app, such as app config, data containers, app-wide managers, runtime setup, and shared stores.

`Modules/` owns bounded product, system, or integration behavior.

`Views/` owns reusable UI building blocks that are shared across routes or modules.

`Extensions/` owns small type extensions that improve readability and do not belong to one specific module.

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
│   └── DataContainer.swift
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

For example, app config or a data container initialized once and intentionally shared across the app belongs in `Environment/`. State and values scoped to a request or flow, or used only by one module, remain with the behavior that owns them. A banner used across unrelated routes can remain in `Views/`.

## Guidance

- Keep top-level screen composition in `Routes/`
- Keep app-wide initialized values and runtime setup in `Environment/`
- Keep state and setup scoped to a request, flow, or module in their owning module
- Do not use `Environment/` as a generic home for constants
- Keep behavior close to the module that owns it
- Prefer `Modules/` over `Features/` for new Swift app structure
- Keep `Views/` and `Extensions/` thin and move code into a module when it only serves one area
- Keep dependency direction clear: modules must not depend on routes
