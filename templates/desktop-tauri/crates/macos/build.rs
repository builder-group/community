fn main() {
    #[cfg(target_os = "macos")]
    {
        use swift_rs::SwiftLinker;

        // Note: Rebuild Swift code when DEVELOPER_DIR selects a different Xcode
        println!("cargo:rerun-if-env-changed=DEVELOPER_DIR");

        #[cfg(feature = "app-store")]
        std::env::set_var("APP_STORE", "1");

        SwiftLinker::new("12.0")
            .with_package("desktop-tauri-macos", "./")
            .link();
    }
}
