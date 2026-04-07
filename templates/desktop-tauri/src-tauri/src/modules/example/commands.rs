use super::types::{GreetingDto, GreetingSource};

#[tauri::command]
#[specta::specta]
pub fn greet(name: &str) -> GreetingDto {
    return GreetingDto {
        message: format!("Hello, {}! You've been greeted from Rust!", name),
        source: GreetingSource::Rust,
    };
}
