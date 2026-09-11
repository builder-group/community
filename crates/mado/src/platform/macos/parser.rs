use crate::types::{AppInfo, WindowBoundsChange, WindowEvent, WindowInfo, WindowLifecycleChange};
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
/// Swift sends: `{ "type": "AppActivated"|"WindowChanged"|..., "data": {...} }`
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
        "AppTerminated" => {
            let app_data = data
                .get("app")
                .ok_or_else(|| serde_json::Error::custom("Missing 'app' field"))?;
            let app: AppInfo = serde_json::from_value(app_data.clone())?;
            return Ok(WindowEvent::AppTerminated { app });
        }
        "WindowChanged" => {
            let window: WindowInfo = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowChanged { window });
        }
        "WindowUpdated" => {
            let window: WindowInfo = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowUpdated { window });
        }
        "WindowBoundsChanged" => {
            let window: WindowBoundsChange = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowBoundsChanged { window });
        }
        "WindowMinimized" => {
            let window: WindowLifecycleChange = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowMinimized { window });
        }
        "WindowRestored" => {
            let window: WindowLifecycleChange = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowRestored { window });
        }
        "WindowDestroyed" => {
            let window: WindowLifecycleChange = serde_json::from_value(data.clone())?;
            return Ok(WindowEvent::WindowDestroyed { window });
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
    fn window_content_events_preserve_foreground_or_background_classification() {
        for kind in ["WindowChanged", "WindowUpdated"] {
            let payload = serde_json::json!({
                "type": kind,
                "data": {
                    "app": {"pid": 1234},
                    "windowId": 42,
                    "browser": {"url": "https://example.com/path", "isPrivate": false}
                }
            });
            let event = parse_event(&payload.to_string()).unwrap();
            assert_eq!(event.app().pid, 1234);
            let window = match (kind, event) {
                ("WindowChanged", WindowEvent::WindowChanged { window })
                | ("WindowUpdated", WindowEvent::WindowUpdated { window }) => window,
                _ => panic!("Event classification changed for {kind}"),
            };
            assert_eq!(window.window_id, Some(42));
            assert_eq!(
                window.browser.unwrap().url.as_deref(),
                Some("https://example.com/path")
            );
        }
    }

    #[test]
    fn all_events_accept_partial_metadata_and_preserve_app_identity() {
        for kind in [
            "AppActivated",
            "AppTerminated",
            "WindowChanged",
            "WindowUpdated",
            "WindowBoundsChanged",
            "WindowMinimized",
            "WindowRestored",
            "WindowDestroyed",
        ] {
            let payload = serde_json::json!({"type": kind, "data": {"app": {"pid": 1234}}});
            let event = parse_event(&payload.to_string()).unwrap();
            assert_eq!(event.app().pid, 1234, "{kind}");
            assert!(event.app().bundle_id.is_none(), "{kind}");
        }
    }

    #[test]
    fn rejects_malformed_event_payloads() {
        for payload in [
            "not json",
            r#"{"type":"WindowUpdated","data":{"app":{}}}"#,
            r#"{"type":"WindowUpdated","data":{"app":{"pid":"1234"}}}"#,
            r#"{"type":"WindowBoundsChanged","data":{"app":{"pid":1},"windowId":-1}}"#,
            r#"{"type":"WindowChanged","data":{"app":{"pid":1},"bounds":{"x":0}}}"#,
        ] {
            assert!(
                parse_event(payload).is_err(),
                "Accepted malformed payload: {payload}"
            );
        }
    }

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
    fn parse_window_info_without_browser() {
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
        let bounds = window.bounds.unwrap();
        assert_eq!(bounds.x, 100.0);
        assert_eq!(bounds.y, 200.0);
        assert_eq!(bounds.width, 800.0);
        assert_eq!(bounds.height, 600.0);
        assert_eq!(window.app.pid, 1234);
        assert!(window.browser.is_none());
    }

    #[test]
    fn parse_window_info_with_browser() {
        let json = r#"{
            "title": "GitHub",
            "windowId": 123,
            "bounds": {"x": 100.0, "y": 120.0, "width": 1200.0, "height": 800.0},
            "app": {"pid": 5678, "name": "Chrome", "bundleId": "com.google.Chrome", "processPath": null},
            "browser": {
                "url": "https://github.com",
                "contentBounds": {"x": 100.0, "y": 200.0, "width": 1200.0, "height": 720.0},
                "isPrivate": false,
                "website": null
            }
        }"#;

        let window = parse_window_info(json).unwrap();
        let browser = window.browser.unwrap();
        assert_eq!(browser.url, Some("https://github.com".to_string()));
        assert_eq!(browser.is_private, Some(false));
        assert!(browser.website.is_none());
        let content_bounds = browser.content_bounds.unwrap();
        assert_eq!(content_bounds.x, 100.0);
        assert_eq!(content_bounds.y, 200.0);
        assert_eq!(content_bounds.width, 1200.0);
        assert_eq!(content_bounds.height, 720.0);
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
                "website": {"hostname": "github.com", "favicon": "data:image/png;base64,ABC123", "color": "#24292E"}
            }
        }"##;

        let window = parse_window_info(json).unwrap();
        assert!(window.browser.is_some());
        let browser = window.browser.unwrap();
        assert!(browser.website.is_some());
        let website = browser.website.unwrap();
        assert_eq!(website.hostname, "github.com");
        assert_eq!(
            website.favicon,
            Some("data:image/png;base64,ABC123".to_string())
        );
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
                "website": {"hostname": "github.com", "favicon": null, "color": null}
            }
        }"#;

        let window = parse_window_info(json).unwrap();
        let browser = window.browser.unwrap();
        let website = browser.website.unwrap();
        assert_eq!(website.hostname, "github.com");
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
    fn parse_event_app_terminated() {
        let json = r#"{
            "type": "AppTerminated",
            "data": {
                "app": {"pid": 1234, "name": "Firefox", "bundleId": "org.mozilla.firefox", "processPath": null}
            }
        }"#;

        let event = parse_event(json).unwrap();
        match event {
            WindowEvent::AppTerminated { app } => {
                assert_eq!(app.pid, 1234);
                assert_eq!(app.bundle_id, Some("org.mozilla.firefox".to_string()));
            }
            _ => panic!("Expected AppTerminated event"),
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
    fn parse_event_window_bounds_changed() {
        let json = r#"{
            "type": "WindowBoundsChanged",
            "data": {
                "windowId": 42,
                "bounds": {"x": 120.0, "y": 220.0, "width": 900.0, "height": 700.0},
                "app": {"pid": 1234, "name": "App", "bundleId": null, "processPath": null}
            }
        }"#;

        let event = parse_event(json).unwrap();
        match event {
            WindowEvent::WindowBoundsChanged { window } => {
                assert_eq!(window.window_id, Some(42));
                assert_eq!(window.app.pid, 1234);
                let bounds = window.bounds.unwrap();
                assert_eq!(bounds.x, 120.0);
                assert_eq!(bounds.y, 220.0);
                assert_eq!(bounds.width, 900.0);
                assert_eq!(bounds.height, 700.0);
            }
            _ => panic!("Expected WindowBoundsChanged event"),
        }
    }

    #[test]
    fn parse_event_window_minimized() {
        let event = parse_window_lifecycle_event("WindowMinimized");
        match event {
            WindowEvent::WindowMinimized { window } => {
                assert_eq!(window.window_id, Some(42));
                assert_eq!(window.app.pid, 1234);
            }
            _ => panic!("Expected WindowMinimized event"),
        }
    }

    #[test]
    fn parse_event_window_restored() {
        let event = parse_window_lifecycle_event("WindowRestored");
        match event {
            WindowEvent::WindowRestored { window } => {
                assert_eq!(window.window_id, Some(42));
                assert_eq!(window.app.pid, 1234);
            }
            _ => panic!("Expected WindowRestored event"),
        }
    }

    #[test]
    fn parse_event_window_destroyed() {
        let event = parse_window_lifecycle_event("WindowDestroyed");
        match event {
            WindowEvent::WindowDestroyed { window } => {
                assert_eq!(window.window_id, Some(42));
                assert_eq!(window.app.pid, 1234);
            }
            _ => panic!("Expected WindowDestroyed event"),
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

    fn parse_window_lifecycle_event(event_type: &str) -> WindowEvent {
        let json = format!(
            r#"{{
                "type": "{}",
                "data": {{
                    "windowId": 42,
                    "app": {{"pid": 1234, "name": "App", "bundleId": null, "processPath": null}}
                }}
            }}"#,
            event_type
        );

        return parse_event(&json).unwrap();
    }
}
