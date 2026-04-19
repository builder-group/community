use crate::environment::configs::app::AppConfig;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
use tauri::window::{Effect, EffectsBuilder};
#[cfg(target_os = "macos")]
use tauri::LogicalPosition;
#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppWindow {
    Main,
}

impl AppWindow {
    pub fn label(&self) -> &'static str {
        return match self {
            Self::Main => "main",
        };
    }

    pub fn path(&self) -> &'static str {
        return match self {
            Self::Main => "/window/main/splash",
        };
    }

    pub fn title(&self) -> &'static str {
        return match self {
            Self::Main => AppConfig::app_name(),
        };
    }

    pub fn size(&self) -> Option<(f64, f64)> {
        return match self {
            Self::Main => Some((880.0, 700.0)),
        };
    }

    pub fn min_size(&self) -> Option<(f64, f64)> {
        return match self {
            Self::Main => Some((880.0, 700.0)),
        };
    }

    pub fn get(&self, app: &AppHandle) -> Option<WebviewWindow> {
        return app.get_webview_window(self.label());
    }

    /// Shows the window at its current route or builds it at its default route on first open.
    pub fn show(&self, app: &AppHandle) -> tauri::Result<WebviewWindow> {
        let window = if let Some(window) = self.get(app) {
            window
        } else {
            self.build(app)?
        };

        window.show()?;
        window.set_focus()?;
        return Ok(window);
    }

    /// Shows the window at `path`, building a new window there on first open
    /// and navigating existing windows client-side.
    pub fn show_as(&self, app: &AppHandle, path: &str) -> tauri::Result<WebviewWindow> {
        let window = if let Some(window) = self.get(app) {
            self.navigate_to_path(&window, path)?;
            window
        } else {
            self.build_at(app, path)?
        };

        window.show()?;
        window.set_focus()?;
        return Ok(window);
    }

    fn build(&self, app: &AppHandle) -> tauri::Result<WebviewWindow> {
        return self.build_at(app, self.path());
    }

    fn build_at(&self, app: &AppHandle, path: &str) -> tauri::Result<WebviewWindow> {
        match self {
            Self::Main => {
                let mut builder = self
                    .base_builder(app, path)
                    .resizable(true)
                    .maximizable(true)
                    .minimizable(true);

                #[cfg(target_os = "macos")]
                {
                    builder = builder
                        .title_bar_style(TitleBarStyle::Overlay)
                        .hidden_title(true)
                        .traffic_light_position(LogicalPosition::new(16.0, 24.0));
                }

                let window = builder.build()?;

                #[cfg(target_os = "macos")]
                Self::apply_macos_liquid_glass(&window, self.label());

                return Ok(window);
            }
        }
    }

    fn base_builder<'app>(
        &self,
        app: &'app AppHandle,
        path: &str,
    ) -> WebviewWindowBuilder<'app, tauri::Wry, AppHandle> {
        let mut builder =
            WebviewWindowBuilder::new(app, self.label(), WebviewUrl::App(path.into()))
                .title(self.title());

        if let Some((width, height)) = self.size() {
            builder = builder.inner_size(width, height);
        }

        if let Some((min_width, min_height)) = self.min_size() {
            builder = builder.min_inner_size(min_width, min_height);
        }

        return builder;
    }

    #[allow(dead_code)]
    fn navigate_to_path(&self, window: &WebviewWindow, path: &str) -> tauri::Result<()> {
        return window.eval(&format!(
            "window.__TAURI_ROUTER__?.navigate({{ href: {:?} }});",
            path
        ));
    }

    #[cfg(target_os = "macos")]
    fn apply_macos_liquid_glass(window: &WebviewWindow, window_label: &str) {
        let Ok(window_ptr) = window.ns_window() else {
            if cfg!(debug_assertions) {
                eprintln!("Failed to access NSWindow for {}", window_label);
            }
            return;
        };

        if desktop_tauri_macos::apply_window_liquid_glass(window_ptr) {
            return;
        }

        // Fall back to the built-in macOS window material when Liquid Glass is unavailable
        let _ = window.set_effects(
            EffectsBuilder::new()
                .effect(Effect::WindowBackground)
                .build(),
        );

        if cfg!(debug_assertions) {
            eprintln!(
                "Falling back to native window background for {}",
                window_label
            );
        }
    }
}
