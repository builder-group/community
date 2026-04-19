# Swift App Structure

How Swift and SwiftUI app code should be organized across builder.group projects.

## Structure

Keep app code split by responsibility:

```txt
AppName/
├── Routes/       # Screen entry points and navigation-owned composition
├── Environment/  # App-wide config, managers, persistence, runtime setup
├── Modules/      # Bounded areas of app behavior
├── Views/        # Shared view building blocks
└── Extensions/   # Small type extensions shared across the app
```

Only create the folders the app needs. Small apps can stay small.

## Folder Roles

`Routes/` owns screen entry points and navigation-owned composition.

`Environment/` owns things that exist once for the whole app, such as app config, data containers, extension managers, runtime setup, and shared stores.

`Modules/` owns bounded product or system behavior, such as camera activation, onboarding flows, sync, updater logic, or other areas with clear ownership.

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
│   ├── CameraExtension/
│   │   └── CameraExtensionActivationManager.swift
│   └── Onboarding/
│       └── OnboardingStore.swift
├── Views/
│   └── BannerView.swift
└── Extensions/
    └── Color+App.swift
```

## Guidance

- Keep top-level screen composition in `Routes/`
- Keep app-wide setup in `Environment/`
- Keep bounded product or system behavior in `Modules/`
- Prefer `Modules/` over `Features/` for new Swift app structure
- Keep `Views/` and `Extensions/` thin and move code into a module when it only serves one area
