use super::types::{GreetingDto, GreetingSource};

#[tauri::command]
#[specta::specta]
pub fn greet_from_rust(name: &str) -> GreetingDto {
    return GreetingDto {
        message: format!("Hello, {}! You've been greeted from Rust!", name),
        source: GreetingSource::Rust,
    };
}

#[tauri::command]
#[specta::specta]
pub fn greet_from_swift(name: &str) -> GreetingDto {
    let message = desktop_tauri_macos::greet(name).unwrap_or_else(|| {
        format!(
            "Hello, {}! Swift greetings are available on macOS builds.",
            name
        )
    });

    return GreetingDto {
        message,
        source: GreetingSource::Swift,
    };
}
