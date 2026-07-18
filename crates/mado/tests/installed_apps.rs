#[cfg(target_os = "macos")]
#[test]
fn get_installed_app_resolves_registered_system_application() {
    let config = mado::InstalledAppsConfig::default();

    let preview = mado::get_installed_app("com.apple.Preview", config)
        .expect("Preview should resolve as an installed system application");
    assert_eq!(preview.bundle_id, "com.apple.Preview");
    assert!(preview.path.ends_with("/Preview.app"));
}

#[cfg(target_os = "macos")]
#[test]
fn get_installed_app_returns_none_for_unknown_bundle_identifier() {
    let app = mado::get_installed_app(
        "com.buildergroup.mado.test.missing",
        mado::InstalledAppsConfig::default(),
    );

    assert!(app.is_none());
}

#[cfg(target_os = "macos")]
#[test]
fn get_installed_apps_scans_nested_system_application_directories() {
    let apps = mado::get_installed_apps(mado::InstalledAppsConfig::default());

    let terminal = apps
        .iter()
        .find(|app| app.bundle_id == "com.apple.Terminal")
        .expect("Terminal should be discovered in the system Utilities directory");

    assert!(terminal.path.ends_with("/Utilities/Terminal.app"));
}
