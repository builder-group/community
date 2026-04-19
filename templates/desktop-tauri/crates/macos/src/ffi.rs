use swift_rs::{swift, Bool, Int, SRString};

swift!(pub fn desktop_tauri_macos_apply_window_liquid_glass(window_ptr: Int) -> Bool);
swift!(pub fn desktop_tauri_macos_greet(name: &SRString) -> Option<SRString>);
