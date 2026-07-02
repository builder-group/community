# Browser Accessibility Extraction

`mado` reads browser metadata through macOS Accessibility without
browser-specific Automation permissions. Browsers expose active-tab URLs and web
content bounds through browser chrome, web content, or both.

Extractors use observed browser signals and should prefer missing metadata over
guessed metadata when a browser shape is unobserved.

## Extraction Signals

`AXTextField` can expose the URL from browser chrome. `AXWebArea.AXURL` can
expose the loaded document URL from web content. `AXWebArea` and `AXDocument`
frames can expose the visible browser content area even when `AXURL` is missing.
Address bar values and `AXWebArea.AXURL` values can differ in canonical form.

`BrowserInfo` stays anchored to an active-tab URL. Content bounds are included
when browser metadata is returned, but mado does not emit browser metadata from
bounds alone.

Nested `AXWebArea` nodes can represent embedded content, not the active tab URL
or viewport. Traversal should stop at the nearest web-content node unless it is
explicitly looking for nested content.

## Probe Notes

The sample URL was:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

Missing values are observations from this probe, not guarantees for every
browser version.

## Probe Environment

- Date: 2026-06-23
- Hardware: MacBook Pro 14-inch, Nov 2023, Apple M3 Pro, 18 GB memory
- macOS: 26.5.1 (25F80)

## Summary

| Browser        | Bundle ID                    | Family     | Browser chrome URL field | Web content `AXURL` |
| -------------- | ---------------------------- | ---------- | ------------------------ | ------------------- |
| Brave          | `com.brave.Browser`          | `chromium` | Found                    | Found               |
| Google Chrome  | `com.google.Chrome`          | `chromium` | Found                    | Not observed        |
| Microsoft Edge | `com.microsoft.edgemac`      | `chromium` | Found                    | Found               |
| Opera          | `com.operasoftware.Opera`    | `chromium` | Found                    | Not observed        |
| Arc            | `company.thebrowser.Browser` | `chromium` | Found                    | Found               |
| Safari         | `com.apple.Safari`           | `safari`   | Found                    | Found               |
| Firefox        | `org.mozilla.firefox`        | `firefox`  | Not observed             | Found               |

## Brave

- Bundle ID: `com.brave.Browser`
- Family: `chromium`
- Version: 1.91.171 (Official Build) (arm64), Chromium 149.0.7827.103

### Browser Chrome URL Field

Found.

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

Observed value:

```text
https://reddit.com/r/rust/search/?q=accessibility&type=link
```

### Web Content AXURL

Found.

```text
AXWindow
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXGroup
> AXWebArea title="accessibility - Reddit Search!"
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

## Google Chrome

- Bundle ID: `com.google.Chrome`
- Family: `chromium`
- Version: 148.0.7778.97 (Official Build) (arm64)

### Browser Chrome URL Field

Found.

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

Observed value:

```text
https://reddit.com/r/rust/search/?q=accessibility&type=link
```

### Web Content AXURL

Not observed.

## Microsoft Edge

- Bundle ID: `com.microsoft.edgemac`
- Family: `chromium`
- Version: 149.0.4022.80 (Official build) (arm64)

### Browser Chrome URL Field

Found.

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

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

### Web Content AXURL

Found.

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
> AXWebArea title="accessibility - Reddit Search!"
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

## Opera

- Bundle ID: `com.operasoftware.Opera`
- Family: `chromium`
- Version: 132.0.5905.73 (arm64)

### Browser Chrome URL Field

Found.

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

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

Opera exposed a parent address-bar text field and a nested text field that held
the URL value.

### Web Content AXURL

Not observed.

## Arc

- Bundle ID: `company.thebrowser.Browser`
- Family: `chromium`
- Version: 1.152.0 (82313), Chromium Engine 149.0.7827.156

### Browser Chrome URL Field

Found.

```text
AXWindow title="Space 1"
> AXTextField placeholder="Search or Enter URL..."
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

### Web Content AXURL

Found.

```text
AXWindow
> AXSplitGroup
> AXWebArea
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

## Safari

- Bundle ID: `com.apple.Safari`
- Family: `safari`
- Version: 26.5 (21624.2.5.11.4)

### Browser Chrome URL Field

Found.

```text
AXWindow
> AXToolbar
> AXGroup
> AXTextField desc="smart search field"
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

### Web Content AXURL

Found.

```text
AXWindow
> AXSplitGroup
> AXTabGroup
> AXGroup
> AXGroup
> AXScrollArea
> AXWebArea desc="accessibility - Reddit Search!"
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

## Firefox

- Bundle ID: `org.mozilla.firefox`
- Family: `firefox`
- Version: 152.0.1 (aarch64)

### Browser Chrome URL Field

Not observed.

### Web Content AXURL

Found.

```text
AXWindow
> AXGroup desc="accessibility - Reddit Search!"
> AXGroup id="tabbrowser-tabpanels"
> AXGroup id="panel-3-1"
> AXScrollArea
> AXWebArea desc="accessibility - Reddit Search!"
```

Observed value:

```text
https://www.reddit.com/r/rust/search/?q=accessibility&type=link
```

Firefox also exposed nested `AXWebArea` nodes for embedded page content:

```text
AXWindow
> AXGroup desc="accessibility - Reddit Search!"
> AXGroup id="tabbrowser-tabpanels"
> AXGroup id="panel-3-1"
> AXScrollArea
> AXWebArea desc="accessibility - Reddit Search!"
> ...
> AXScrollArea id="gsi_..."
> AXWebArea desc="Sign In - Google Accounts"
```
