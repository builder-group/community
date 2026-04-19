mod commands;
pub mod window;

use crate::modules::greet;
use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder as SpectaBuilder};

pub fn run() {
    let specta_builder = SpectaBuilder::<tauri::Wry>::new().commands(collect_commands![
        commands::get_app_info,
        greet::commands::greet_from_rust,
        greet::commands::greet_from_swift,
    ]);

    #[cfg(debug_assertions)]
    if let Err(error) = specta_builder.export(
        Typescript::default(),
        "../src/environment/specta/bindings.gen.ts",
    ) {
        eprintln!("Skipping TypeScript bindings export: {}", error);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(move |app| {
            // https://docs.rs/tauri-specta/2.0.0-rc.21/tauri_specta/index.html
            specta_builder.mount_events(app);

            // Show main window on startup
            let _ = window::AppWindow::Main.show(app.handle());

            return Ok(());
        })
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
