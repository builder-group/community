# Offline-app details

App-specific sections for the [offline-app template](privacy.md), based on source inspection on November 1, 2026. Recheck them against the version being published. These examples cover local functionality, not a full audit of compiled dependencies or network traffic.

Complete the template's shared fields and app-specific legal-basis details separately.

## SelfieMirror

### Local data and functions

SelfieMirror stores imported photo copies, project edits, and preferences on your iPhone. Editing and mirror detection run on the device. The app does not change the originals in your photo library.

### Permissions and choices

You choose photos through Apple's photo picker. Saving an exported video or aligned photos to Photos requires your permission, which you can manage in iPhone Settings. Sharing an export sends it to the app or service you choose. That recipient handles its copy under its own privacy arrangements.

### Retention and deletion

Projects remain until you delete them. Deleting a project removes its imported copies and edits. Deleting the app and its data removes its local storage. This does not delete exports saved to Photos or copies shared elsewhere.

### Platform services and support details

Selecting photos stored in iCloud may require an Apple-managed download. App data may be included in device backups, depending on your settings. Apple manages these services under its [privacy policy](https://www.apple.com/legal/privacy/).

The Get Help email draft includes the app version, build, and iOS version. You can review and edit the draft before sending. The Send Feedback draft does not automatically include those diagnostics.

Source references, relative to the SelfieMirror app's `ios/` directory: `SelfieMirror/Modules/Media/PhotoRepository.swift`, `SelfieMirror/Environment/Persistence/ProjectStorage.swift`, `SelfieMirror/Routes/Export/ExportRoute.swift`, and `SelfieMirror/Modules/Support/SupportDraft.swift`.

## Kairos

### Local data and functions

Kairos stores timer settings, labels, recent timer configurations, current timer state, and appearance preferences on your device. Alarms and sounds are handled locally.

### Permissions and choices

Kairos requests notification permission to alert you when a timer finishes in the background. These are local notifications scheduled on your device. You can manage notification permission in iOS Settings.

### Retention and deletion

You can remove individual recent timers or clear the recent list. Reset App restores timer settings and preferences and clears recents. Deleting the app and its data removes its local storage. Existing platform backups are managed separately by your platform provider.

Source references, relative to the Kairos app directory: `src/features/timer/TimerCx.tsx`, `src/features/settings/SettingsCx.tsx`, `src/app/settings/index.ios.tsx`, and `modules/alarm/ios/AlarmNotificationRuntime.swift`.

## Tapling

### Local data and functions

Tapling stores keyboard preferences, character customizations, collectibles, reward progress, and typing-session records locally. The keyboard and main app share settings and session records through a local app-group store. The stores are configured without CloudKit sync.

Reward session records contain a session identifier, timing information, and a keystroke count rather than the words typed. Autocomplete and autocorrect process text locally using iOS language tools.

Suggestions also use an iOS-provided supplementary lexicon. It can include individual first or last names from Contacts, user-defined text shortcuts, and common dictionary words.

### Permissions and choices

Full Access enables the keyboard's local sharing of settings and typing-session counts with the main app for rewards. You can continue without Full Access and change it in iOS Settings. You can also disable Earn Keycaps While Typing and change autocomplete and autocorrect settings in the app.

### Retention and deletion

During subsequent session processing, Tapling removes processed session records more than seven days after they were processed. Cumulative counts, reward progress, collectibles, and preferences remain in local storage. Deleting the app and its data removes its local app and keyboard storage. Existing platform backups are managed separately.

Source references, relative to the Tapling app's `ios/` directory: `Keyboard/KeyboardViewController.swift`, `Keyboard/Lib/KeyboardSessionTracker.swift`, `Tapling/Features/Keyboard/Models/KeyboardSession.swift`, `Tapling/Features/Keyboard/Environment/KeyboardSessionMonitor.swift`, `Tapling/Features/Keyboard/Environment/KeyboardDataContainer.swift`, and `Tapling/Features/Keyboard/Lib/NativeAutocompleteService.swift`. Apple documents the supplementary lexicon's sources in its [UILexicon reference](https://developer.apple.com/documentation/uikit/uilexicon).
