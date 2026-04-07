use crate::environment::configs::app::AppConfig;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

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
            Self::Main => "/",
        };
    }

    pub fn title(&self) -> &'static str {
        return match self {
            Self::Main => AppConfig::app_name(),
        };
    }

    pub fn size(&self) -> (f64, f64) {
        return match self {
            Self::Main => (800.0, 600.0),
        };
    }

    pub fn get(&self, app: &AppHandle) -> Option<WebviewWindow> {
        return app.get_webview_window(self.label());
    }

    pub fn show(&self, app: &AppHandle) -> tauri::Result<WebviewWindow> {
        if let Some(window) = self.get(app) {
            window.show()?;
            window.set_focus()?;
            return Ok(window);
        }

        let window = self.build(app)?;
        window.show()?;
        window.set_focus()?;
        return Ok(window);
    }

    fn build(&self, app: &AppHandle) -> tauri::Result<WebviewWindow> {
        return match self {
            Self::Main => self
                .base_builder(app)
                .resizable(true)
                .maximizable(true)
                .minimizable(true)
                .build(),
        };
    }

    fn base_builder<'app>(
        &self,
        app: &'app AppHandle,
    ) -> WebviewWindowBuilder<'app, tauri::Wry, AppHandle> {
        let (width, height) = self.size();

        return WebviewWindowBuilder::new(app, self.label(), WebviewUrl::App(self.path().into()))
            .title(self.title())
            .inner_size(width, height);
    }
}
