#[cfg(target_os = "macos")]
#[test]
fn window_query_requires_accessibility_permission() {
    if mado::is_accessibility_trusted() {
        eprintln!("Permission-denied case requires a test process without Accessibility access");
        return;
    }

    assert!(matches!(
        mado::get_active_window(),
        Err(mado::Error::MissingPermission(_))
    ));
    assert!(matches!(
        mado::get_active_window_with_config(mado::QueryConfig {
            include_browser_info: true,
            ..Default::default()
        }),
        Err(mado::Error::MissingPermission(_))
    ));
}
