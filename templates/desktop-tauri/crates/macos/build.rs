fn main() {
    #[cfg(target_os = "macos")]
    {
        use swift_rs::SwiftLinker;

        #[cfg(feature = "app-store")]
        std::env::set_var("APP_STORE", "1");

        SwiftLinker::new("10.15")
            .with_package("desktop-tauri-macos", "./")
            .link();
    }
}
