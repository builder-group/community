use crate::environment::configs::app::{AppConfig, AppDistribution};
use serde::Serialize;

#[tauri::command]
#[specta::specta]
pub fn get_app_info() -> AppInfoDto {
    let base_version = env!("CARGO_PKG_VERSION");
    let (stage, suffix) = if cfg!(debug_assertions) {
        (Stage::Dev, "d")
    } else {
        (Stage::Prod, "p")
    };

    return AppInfoDto {
        version: format!("v{}{}", base_version, suffix),
        stage,
        distribution: AppConfig::distribution(),
    };
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AppInfoDto {
    pub version: String,
    pub stage: Stage,
    pub distribution: AppDistribution,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Stage {
    Dev,
    Prod,
}
