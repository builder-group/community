# Browser Accessibility Extraction

`mado` reads active-tab URLs and browser content bounds through macOS
Accessibility. It uses explicit browser bundle IDs because sharing a browser
engine does not guarantee the same Accessibility structure.

## Extraction Model

Each supported browser maps to an observed extraction family:

- `chromium`: tries the browser chrome URL field, then top-level web content
- `safari`: reads the URL from top-level web content
- `gecko`: tries the browser chrome URL field, then top-level web content

An `AXTextField` can expose the address bar value. Top-level `AXWebArea.AXURL`
or `AXDocument.AXURL` can expose the loaded document URL. Address bar and
web-content values can differ in canonical form.

Content bounds come from the nearest top-level web-content frame and are
clipped to the browser window. `BrowserInfo` remains anchored to a URL: bounds
alone do not produce browser metadata.

Traversal stops at the nearest web-content node. Nested web areas can represent
embedded pages rather than the active tab or viewport.

## Probe Workflow

Use `https://example.com/` as the probe page. A stable top-level HTTPS page
avoids redirects and embedded application UI.

Run the probe from the repository root:

```bash
cd crates/_deprecated/mado
swift run browser-ax-probe /tmp/mado-browser-ax-probe.md
```

Focus the browser during the three-second delay. The terminal running the probe
needs macOS Accessibility permission.

The generated Markdown records the browser identity, URL fields, top-level web
content, and bounds. Compare those signals with the observations below before
assigning an extraction family. Prefer missing metadata over guessing when a
browser exposes a new structure.

## Summary

| Browser        | Bundle ID                    | Family     | Browser chrome URL field | Web content `AXURL` |
| -------------- | ---------------------------- | ---------- | ------------------------ | ------------------- |
| Brave          | `com.brave.Browser`          | `chromium` | Found                    | Found               |
| Google Chrome  | `com.google.Chrome`          | `chromium` | Found                    | Found               |
| Microsoft Edge | `com.microsoft.edgemac`      | `chromium` | Found                    | Found               |
| Opera          | `com.operasoftware.Opera`    | `chromium` | Found                    | Not observed        |
| Arc            | `company.thebrowser.Browser` | `chromium` | Found                    | Found               |
| Safari         | `com.apple.Safari`           | `safari`   | Found                    | Found               |
| Firefox        | `org.mozilla.firefox`        | `gecko`    | Not observed             | Found               |
| Zen            | `app.zen-browser.zen`        | `gecko`    | Not observed             | Found               |

## Browser Observations

### Brave

- Bundle ID: `com.brave.Browser`
- Extraction family: `chromium`
- Browser version: 1.91.171, Chromium 149.0.7827.103 (arm64)
- Tested: 2026-06-23 on macOS 26.5.1 (25F80)

Browser chrome URL field: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXToolbar
> AXGroup
> AXTextField desc="Address and search bar" placeholder="Search Google or type a URL"
```

Web content `AXURL`: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXWebArea
```

### Google Chrome

- Bundle ID: `com.google.Chrome`
- Extraction family: `chromium`
- Browser version: 151.0.7922.108 (7922.108)
- Tested: 2026-08-08 on macOS 26.5.2 (25F84)

Browser chrome URL field: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXToolbar
> AXGroup
> AXTextField desc="Address and search bar" placeholder="Search Google or type a URL"
```

Web content `AXURL`: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXWebArea
```

### Microsoft Edge

- Bundle ID: `com.microsoft.edgemac`
- Extraction family: `chromium`
- Browser version: 149.0.4022.80 (arm64)
- Tested: 2026-06-23 on macOS 26.5.1 (25F80)

Browser chrome URL field: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXToolbar desc="App bar"
> AXGroup
> AXTextField desc="Address and search bar" placeholder="Search or enter web address"
```

Web content `AXURL`: Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXWebArea
```

### Opera

- Bundle ID: `com.operasoftware.Opera`
- Extraction family: `chromium`
- Browser version: 132.0.5905.73 (arm64)
- Tested: 2026-06-23 on macOS 26.5.1 (25F80)

Browser chrome URL field: Found. Opera exposed a parent address-bar text field
and a nested field containing the URL.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup desc="Browser client"
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup desc="Browser contents"
> AXToolbar desc="Navigation"
> AXGroup
> AXTextField desc="Address bar"
> AXGroup
> AXTextField desc="Address field" placeholder="Enter search or web address"
```

Web content `AXURL`: Not observed.

### Arc

- Bundle ID: `company.thebrowser.Browser`
- Extraction family: `chromium`
- Browser version: 1.152.0 (82313), Chromium 149.0.7827.156
- Tested: 2026-06-23 on macOS 26.5.1 (25F80)

Browser chrome URL field: Found.

```text
AXWindow
> AXTextField placeholder="Search or Enter URL..."
```

Web content `AXURL`: Found.

```text
AXWindow
> AXSplitGroup
> AXWebArea
```

### Safari

- Bundle ID: `com.apple.Safari`
- Extraction family: `safari`
- Browser version: 26.5.2 (21624.2.5.11.8)
- Tested: 2026-08-08 on macOS 26.5.2 (25F84)

Browser chrome URL field: Found.

```text
AXWindow
> AXToolbar
> AXGroup
> AXTextField desc="smart search field"
```

Web content `AXURL`: Found.

```text
AXWindow
> AXSplitGroup
> AXTabGroup
> AXGroup
> AXGroup
> AXScrollArea
> AXWebArea
```

### Firefox

- Bundle ID: `org.mozilla.firefox`
- Extraction family: `gecko`
- Browser version: 153.0.3 (15326.8.3)
- Tested: 2026-08-08 on macOS 26.5.2 (25F84)

Browser chrome URL field: Not observed.

Web content `AXURL`: Found.

```text
AXWindow
> AXGroup
> AXGroup id="tabbrowser-tabpanels"
> AXGroup id="panel-3-1"
> AXScrollArea
> AXWebArea
```

### Zen

- Bundle ID: `app.zen-browser.zen`
- Extraction family: `gecko`
- Browser version: 1.21.12b (126.8.7)
- Tested: 2026-08-08 on macOS 26.5.2 (25F84)

Browser chrome URL field: Not observed.

Web content `AXURL`: Found.

```text
AXWindow
> AXGroup
> AXGroup id="tabbrowser-tabpanels"
> AXGroup id="panel-3-4"
> AXScrollArea
> AXWebArea
```
