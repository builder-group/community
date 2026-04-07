pub mod window;

use crate::modules::example;
use specta_typescript::Typescript;
use tauri_specta::{collect_commands, Builder as SpectaBuilder};

pub fn run() {
    let specta_builder =
        SpectaBuilder::<tauri::Wry>::new().commands(collect_commands![example::commands::greet,]);

    #[cfg(debug_assertions)]
    if let Err(error) = specta_builder.export(
        Typescript::default(),
        "../src/environment/specta/bindings.gen.ts",
    ) {
        eprintln!("Skipping TypeScript bindings export: {}", error);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            let _ = window::AppWindow::Main.show(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
