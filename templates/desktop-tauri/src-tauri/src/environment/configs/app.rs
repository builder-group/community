use serde::Serialize;
use specta::Type;

pub struct AppConfig;

impl AppConfig {
    pub fn app_name() -> &'static str {
        return "Desktop Tauri";
    }

    pub fn distribution() -> AppDistribution {
        if cfg!(feature = "app-store") {
            return AppDistribution::AppStore;
        }
        return AppDistribution::Direct;
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum AppDistribution {
    AppStore,
    Direct,
}
