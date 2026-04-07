use std::path::Path;

pub struct AppConfig;

impl AppConfig {
    pub fn app_name() -> &'static str {
        return "Desktop Tauri";
    }

    pub fn cargo_manifest_dir() -> &'static Path {
        Path::new(env!("CARGO_MANIFEST_DIR"))
    }

    pub fn app_data_subdir() -> Option<&'static str> {
        if cfg!(debug_assertions) {
            return Some("dev");
        }
        return None;
    }
}
