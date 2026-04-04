use crate::types::{AppInfo, WindowEvent, WindowInfo};
use serde::de::Error;
use serde_json::Value;

/// Parse AppInfo from JSON
pub fn parse_app_info(json: &str) -> Result<AppInfo, serde_json::Error> {
    return serde_json::from_str(json);
}

/// Parse WindowInfo from JSON
pub fn parse_window_info(json: &str) -> Result<WindowInfo, serde_json::Error> {
    return serde_json::from_str(json);
}

/// Parse WindowEvent from Swift's JSON format.
/// Swift sends: `{ "type": "AppActivated"|"WindowChanged", "data": {...} }`
pub fn parse_event(json: &str) -> Result<WindowEvent, serde_json::Error> {
    let value: Value = serde_json::from_str(json)?;

    let event_type = value
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| serde_json::Error::custom("Missing 'type' field"))?;

    let data = value
        .get("data")
        .ok_or_else(|| serde_json::Error::custom("Missing 'data' field"))?;

    match event_type {
        "AppActivated" => {
            let app_data = data
                .get("app")
                .ok_or_else(|| serde_json::Error::custom("Missing 'app' field"))?;
            let app: AppInfo = serde_json::from_value(app_data.clone())?;
            return Ok(WindowEvent::AppActivated { app });
        }
        "WindowChanged" => {
            let window: WindowInfo = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowChanged { window });
        }
        _ => {
            return Err(serde_json::Error::custom(format!(
                "Unknown event type: {}",
                event_type
            )));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_app_info_full() {
        let json = r#"{
            "pid": 1234,
            "name": "Finder",
            "bundleId": "com.apple.finder",
            "processPath": "/System/Library/CoreServices/Finder.app/Contents/MacOS/Finder"
        }"#;

        let app = parse_app_info(json).unwrap();
        assert_eq!(app.pid, 1234);
        assert_eq!(app.name, Some("Finder".to_string()));
        assert_eq!(app.bundle_id, Some("com.apple.finder".to_string()));
        assert!(app.process_path.is_some());
    }

    #[test]
    fn parse_app_info_minimal() {
        let json = r#"{"pid": 999, "name": null, "bundleId": null, "processPath": null}"#;

        let app = parse_app_info(json).unwrap();
        assert_eq!(app.pid, 999);
        assert_eq!(app.name, None);
        assert_eq!(app.bundle_id, None);
    }

    #[test]
    fn parse_window_info_full() {
        let json = r#"{
            "title": "Documents",
            "windowId": 42,
            "bounds": {"x": 100.0, "y": 200.0, "width": 800.0, "height": 600.0},
            "app": {"pid": 1234, "name": "Finder", "bundleId": "com.apple.finder", "processPath": null},
            "browser": null
        }"#;

        let window = parse_window_info(json).unwrap();
        assert_eq!(window.title, Some("Documents".to_string()));
        assert_eq!(window.window_id, Some(42));
        assert!(window.bounds.is_some());
        assert_eq!(window.app.pid, 1234);
        assert!(window.browser.is_none());
    }

    #[test]
    fn parse_window_info_with_browser() {
        let json = r#"{
            "title": "GitHub",
            "windowId": 123,
            "bounds": null,
            "app": {"pid": 5678, "name": "Chrome", "bundleId": "com.google.Chrome", "processPath": null},
            "browser": {"url": "https://github.com", "isPrivate": false, "website": null}
        }"#;

        let window = parse_window_info(json).unwrap();
        assert!(window.browser.is_some());
        let browser = window.browser.unwrap();
        assert_eq!(browser.url, Some("https://github.com".to_string()));
        assert_eq!(browser.is_private, Some(false));
        assert!(browser.website.is_none());
    }

    #[test]
    fn parse_window_info_with_website() {
        let json = r##"{
            "title": "GitHub",
            "windowId": 123,
            "bounds": null,
            "app": {"pid": 5678, "name": "Chrome", "bundleId": "com.google.Chrome", "processPath": null},
            "browser": {
                "url": "https://github.com",
                "isPrivate": false,
                "website": {"domain": "github.com", "favicon": "data:image/png;base64,ABC123", "color": "#24292E"}
            }
        }"##;

        let window = parse_window_info(json).unwrap();
        assert!(window.browser.is_some());
        let browser = window.browser.unwrap();
        assert!(browser.website.is_some());
        let website = browser.website.unwrap();
        assert_eq!(website.domain, "github.com");
        assert_eq!(website.favicon, Some("data:image/png;base64,ABC123".to_string()));
        assert_eq!(website.color, Some("#24292E".to_string()));
    }

    #[test]
    fn parse_window_info_with_website_no_favicon() {
        let json = r#"{
            "title": "GitHub",
            "windowId": 123,
            "bounds": null,
            "app": {"pid": 5678, "name": "Chrome", "bundleId": "com.google.Chrome", "processPath": null},
            "browser": {
                "url": "https://github.com",
                "isPrivate": false,
                "website": {"domain": "github.com", "favicon": null, "color": null}
            }
        }"#;

        let window = parse_window_info(json).unwrap();
        let browser = window.browser.unwrap();
        let website = browser.website.unwrap();
        assert_eq!(website.domain, "github.com");
        assert!(website.favicon.is_none());
        assert!(website.color.is_none());
    }

    #[test]
    fn parse_event_app_activated() {
        let json = r#"{
            "type": "AppActivated",
            "data": {
                "app": {"pid": 1234, "name": "Finder", "bundleId": "com.apple.finder", "processPath": null}
            }
        }"#;

        let event = parse_event(json).unwrap();
        match event {
            WindowEvent::AppActivated { app } => {
                assert_eq!(app.pid, 1234);
                assert_eq!(app.name, Some("Finder".to_string()));
            }
            _ => panic!("Expected AppActivated event"),
        }
    }

    #[test]
    fn parse_event_window_changed() {
        let json = r#"{
            "type": "WindowChanged",
            "data": {
                "title": "My Window",
                "windowId": 42,
                "bounds": null,
                "app": {"pid": 1234, "name": "App", "bundleId": null, "processPath": null},
                "browser": null
            }
        }"#;

        let event = parse_event(json).unwrap();
        match event {
            WindowEvent::WindowChanged { window } => {
                assert_eq!(window.title, Some("My Window".to_string()));
                assert_eq!(window.window_id, Some(42));
                assert!(window.browser.is_none());
            }
            _ => panic!("Expected WindowChanged event"),
        }
    }

    #[test]
    fn parse_event_missing_type() {
        let json = r#"{"data": {}}"#;
        assert!(parse_event(json).is_err());
    }

    #[test]
    fn parse_event_unknown_type() {
        let json = r#"{"type": "UnknownEvent", "data": {}}"#;
        let err = parse_event(json).unwrap_err();
        assert!(err.to_string().contains("Unknown event type"));
    }

    #[test]
    fn parse_event_missing_data() {
        let json = r#"{"type": "AppActivated"}"#;
        assert!(parse_event(json).is_err());
    }
}
