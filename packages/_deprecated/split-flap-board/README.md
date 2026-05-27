<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/split-flap-board/.github/banner.svg" alt="split-flap-board banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/split-flap-board">
        <img src="https://img.shields.io/bundlephobia/minzip/split-flap-board.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/split-flap-board">
        <img src="https://img.shields.io/npm/dt/split-flap-board.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

Web component library for split-flap displays, the mechanical boards found in airports and train stations. Built with [Lit](https://lit.dev/), it works in any framework or plain HTML.

- **Simple mental model**: flap -> spool -> board
- **Framework friendly**: works in plain HTML and can be used from React or other frameworks
- **Flexible content**: supports character, color, image, and custom flaps
- **Two built-in looks**: `minimal` and `realistic`

## How a Split-Flap Display Works

> [How a Split-Flap Display Works (YouTube)](https://www.youtube.com/watch?v=UAQJJAQSg_g)

A split-flap display, also called a Solari board, works through a simple mechanical loop:

- A **spool** (drum) holds a series of **flaps** (thin cards), each printed with the top half of one character on the front and the bottom half of another on the back.
- A **stepper motor** rotates the spool precisely. As each flap passes vertical, gravity pulls it down, snapping it against a **backstop** and creating the characteristic clacking sound.
- This reveal happens one flap at a time, so going from `A` to `Z` means cycling through every character in between. The order of the flaps on the spool is fixed.
- A **hall effect sensor** and magnet give the controller a consistent home position, so it always knows which character is showing even after a power cycle.

In code, each `<split-flap-spool>` mirrors that behavior: it holds an ordered sequence of **flaps** and steps forward through them until it reaches a target key.

## Install

```bash
pnpm add split-flap-board
```

## Quick Start

### Board

```html
<script type="module">
  import 'split-flap-board';
</script>

<split-flap-board></split-flap-board>
```

```js
import { fromLines } from 'split-flap-board';

const board = document.querySelector('split-flap-board');
const { spools, grid } = fromLines(['HELLO WORLD'], 11);

board.spools = spools;
board.grid = grid;
```

For most apps, this is the easiest way to start:

1. build `spools` once
2. update `grid` whenever the displayed text changes

### Single Spool

```html
<script type="module">
  import 'split-flap-board';
</script>

<split-flap-spool value="A"></split-flap-spool>
```

```js
const spool = document.querySelector('split-flap-spool');
spool.value = 'Z'; // steps forward: A -> B -> ... -> Z
```

Switch to the realistic look:

```html
<split-flap-spool variant="realistic" value="A"></split-flap-spool>
```

## Core Concepts

### Flap

A flap is one card on the spool, the smallest unit of display content. The library ships with four built-in flap types:

```ts
// Character (default)
{
	type: 'char';
	key?: string;
	value: string;
	color?: string;
	bg?: string;
	fontSize?: string;
	fontFamily?: string;
	fontWeight?: string;
}

// Solid color
{
	type: 'color';
	key?: string;
	value: string;
}

// Image
{
	type: 'image';
	key?: string;
	src: string;
	alt?: string;
}

// Custom, top and bottom halves rendered independently
{
	type: 'custom';
	key: string;
	top: TemplateResult;
	bottom: TemplateResult;
}
```

The `key` field is optional on all types except `custom`. When omitted, the library uses the natural identifier:

- `value` for `char` and `color`
- `src` for `image`

Char flaps can be styled per flap when needed:

```ts
const styledSpool = charSpool.map((flap) =>
  flap.type === 'char' ? { ...flap, fontSize: '3rem', color: '#fff', bg: '#2563eb' } : flap
);

spool.flaps = styledSpool;
```

### Spool

A spool is an ordered array of flaps, the sequence a `<split-flap-spool>` steps through. Define it once and reuse it anywhere.

```ts
type TSpool = TFlap[];
```

The library ships with built-in spools:

```ts
import { charSpool, colorSpool, numericSpool } from 'split-flap-board';

// charSpool    -> [' ', A-Z, 0-9, . - / : ]
// numericSpool -> [' ', 0-9]
// colorSpool   -> named color keys such as 'red', 'green', 'blue'
```

Custom spools are just arrays:

```ts
const statusSpool: TSpool = [
  { type: 'color', value: '#111', key: 'off' },
  { type: 'color', value: '#16a34a', key: 'green' },
  { type: 'color', value: '#dc2626', key: 'red' },
  { type: 'color', value: '#f59e0b', key: 'yellow' }
];
```

You can also mix flap types within a single spool:

```ts
const mixedSpool: TSpool = [
  { type: 'char', value: ' ' },
  { type: 'image', src: '/icons/check.svg', key: 'check' },
  { type: 'color', value: '#16a34a', key: 'green' },
  { type: 'char', value: '!' }
];
```

### Spools Grid vs. Target Grid

A board has two separate grids:

- **`spools`**: a `TSpool[][]` that defines what each cell can show. This is usually set once.
- **`grid`**: a `string[][]` of target keys that defines what each cell should show right now. This is the part you usually update at runtime.

If you are unsure which one to change, use this rule of thumb:

- change `spools` when the available flap set changes
- change `grid` when the displayed content changes

```ts
import { charSpool, spoolGrid } from 'split-flap-board';

// spoolGrid(spool, cols, rows) fills a uniform TSpool[][]
board.spools = spoolGrid(charSpool, 10, 3);

// Per-column: pass an array of spools, one per column. Shorter arrays repeat.
board.spools = spoolGrid([charSpool, charSpool, statusSpool], 3, 2);

// Fully custom: build the 2D array directly.
board.spools = [
  [charSpool, charSpool, statusSpool],
  [charSpool, charSpool, statusSpool]
];

// grid: target keys, updated freely at runtime
board.grid = [
  ['H', 'E', 'green'],
  ['L', 'O', 'red']
];
```

Board dimensions are inferred from `spools`.

## Usage

### Updating at Runtime

For content changes, only `grid` needs to change. Assign a new array reference:

```js
// Refresh content, spools stay the same.
board.grid = [['G', 'O', 'O', 'D', 'B', 'Y', 'E', ' ', ' ', ' ', ' ']];
```

### Multi-Row Board

```js
import { fromLines } from 'split-flap-board';

const { spools, grid } = fromLines(
  ['BA123  LHR  18:30  BOARDING', 'LH456  FRA  19:15  ON TIME ', 'AF789  CDG  19:45  DELAYED '],
  26
);

board.spools = spools;
board.grid = grid;
```

### Custom Spool

```js
const statusSpool = [
  { type: 'color', value: '#111', key: 'off' },
  { type: 'color', value: '#16a34a', key: 'green' },
  { type: 'color', value: '#dc2626', key: 'red' }
];

spool.flaps = statusSpool;
spool.value = 'green';
```

### Mixed Spools per Column

```js
import { charSpool, spoolGrid } from 'split-flap-board';

const statusSpool = [
  { type: 'color', value: '#111', key: 'off' },
  { type: 'color', value: '#16a34a', key: 'green' },
  { type: 'color', value: '#dc2626', key: 'red' }
];

board.spools = spoolGrid([charSpool, charSpool, charSpool, charSpool, statusSpool], 5, 2);

board.grid = [
  ['G', 'A', 'T', 'E', 'green'],
  ['B', '1', '2', '3', 'red']
];
```

### Colored Rows

```js
import { fromLines } from 'split-flap-board';

const { spools, grid } = fromLines(
  [
    { text: 'BA123  LHR  BOARDING', bg: '#16a34a', color: '#fff' },
    { text: 'LH456  FRA  ON TIME ' },
    { text: 'AF789  CDG  DELAYED ', bg: '#dc2626', color: '#fff' }
  ],
  26
);

board.spools = spools;
board.grid = grid;
```

Use row colors when you want text-style boards with a highlighted row, for example boarding status or delays.

### React

```tsx
import { useEffect, useRef } from 'react';
import { fromLines } from 'split-flap-board';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'split-flap-spool': React.HTMLAttributes<HTMLElement> & { value?: string; variant?: string };
      'split-flap-board': React.HTMLAttributes<HTMLElement>;
    }
  }
}

export function DeparturesBoard() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current == null) return;

    const { spools, grid } = fromLines(['DEPARTURES'], 10);
    (ref.current as any).spools = spools;
    (ref.current as any).grid = grid;
  }, []);

  return <split-flap-board ref={ref} />;
}
```

For richer framework integrations, the simplest approach is usually to keep `spools` stable and only update `grid`.

## API Reference

### `<split-flap-spool>`

| Property           | Type                       | Default     | Description                                                                    |
| ------------------ | -------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `variant`          | `'minimal' \| 'realistic'` | `'minimal'` | Which visual variant to render.                                                |
| `value`            | `string`                   | `' '`       | Target flap key. Steps forward through the flaps until it reaches this key.    |
| `flaps`            | `TSpool`                   | `charSpool` | The ordered sequence of flaps this spool holds.                                |
| `speed`            | `number`                   | `60`        | Milliseconds per flap step.                                                    |
| `visibleSideCount` | `number`                   | `-1`        | Realistic variant only. Limits how many flaps render on each side of the drum. |

#### Variants

| Variant       | Element                        | Description                                                      |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| `'minimal'`   | `<split-flap-spool-minimal>`   | Clean card renderer that only draws the active flap.             |
| `'realistic'` | `<split-flap-spool-realistic>` | 3D drum renderer that places multiple flaps around the cylinder. |

The variant elements can also be used directly if you prefer not to use the wrapper.

### `<split-flap-board>`

| Property           | Type                       | Default     | Description                                                                                                                   |
| ------------------ | -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `spools`           | `TSpool[][]`               | `[]`        | 2D spool configuration, one per cell. Board dimensions are inferred from this. Always assign a new array reference to update. |
| `grid`             | `string[][]`               | `[]`        | 2D array of target keys. Always assign a new array reference to trigger a re-render.                                          |
| `speed`            | `number`                   | `60`        | Flip speed in milliseconds forwarded to every child spool.                                                                    |
| `variant`          | `'minimal' \| 'realistic'` | `'minimal'` | Visual variant forwarded to every child spool.                                                                                |
| `visibleSideCount` | `number`                   | `-1`        | Forwarded to child spools. Only affects the `realistic` variant.                                                              |

### Events

#### `<split-flap-spool>`

| Event     | Detail              | Description                                                                       |
| --------- | ------------------- | --------------------------------------------------------------------------------- |
| `settled` | `{ value: string }` | Fired when the spool becomes idle. `value` is the flap key it actually landed on. |

#### `<split-flap-board>`

| Event           | Detail                 | Description                                                           |
| --------------- | ---------------------- | --------------------------------------------------------------------- |
| `board-settled` | `{ grid: string[][] }` | Fired when every rendered spool is idle for the current board inputs. |

```js
const spool = document.querySelector('split-flap-spool');
spool.addEventListener('settled', (e) => console.log('landed on', e.detail.value));
board.addEventListener('board-settled', (e) => console.log('board done', e.detail.grid));
```

### `spoolGrid(spool, cols, rows)`

```ts
function spoolGrid(spool: TSpool | TSpool[], cols: number, rows: number): TSpool[][];
```

Creates a `TSpool[][]` for use with `board.spools`.

```ts
// Uniform, same spool for every cell
spoolGrid(charSpool, 10, 3);

// Per-column, pass an array where index = column. Shorter arrays repeat.
spoolGrid([charSpool, charSpool, statusSpool], 3, 2);
```

### `fromLines(lines, cols)`

```ts
function fromLines(
  lines: (string | { text: string; bg?: string; color?: string })[],
  cols: number
): { spools: TSpool[][]; grid: string[][] };
```

Creates a char `spools` grid and a `grid` of target keys from an array of lines. Each line is uppercased, padded with spaces, or truncated to `cols`. Rows with `bg` or `color` get those values baked into their char flaps.

```ts
const { spools, grid } = fromLines(
  ['HELLO WORLD', { text: 'BOARDING', bg: '#16a34a', color: '#fff' }],
  11
);

board.spools = spools;
board.grid = grid;
```

### CSS Custom Properties

Set these on the board to theme all spools at once, or override them on individual spools via CSS selectors.

```css
/* Board panel */
split-flap-board {
  --sfb-board-bg: #1c1c1c; /* panel and frame background */
  --sfb-board-padding: 10px; /* inset spacing around the cell grid */
  --sfb-board-radius: 8px; /* corner radius of the panel itself */
  --sfb-gap: 3px; /* gap between spool cells */
}

/* Shared flap styles */
split-flap-board {
  --sfb-flap-bg: #111; /* flap background */
  --sfb-flap-color: #f5f0e0; /* flap text color */
  --sfb-flap-radius: 4px; /* corner radius on each flap */
}

/* Minimal variant */
split-flap-board {
  --sfb-spool-width: 1.2em; /* explicit cell width */
  --sfb-spool-height: 2em; /* explicit cell height */
  --sfb-fold-color: #0a0a0a; /* center crease color */
}

/* Realistic variant */
split-flap-board {
  --sfb-spool-width: 1em; /* flap width, defaults to 1x font-size */
  --sfb-spool-height: 2em; /* flap height, defaults to 2x font-size */
  --sfb-drum-radius: 0px; /* cylinder radius, 0 keeps the flip flat */
  --sfb-crease: 1px; /* gap between the two flap halves */
  --sfb-perspective: 400px; /* CSS perspective depth */
  --sfb-view-transform: none; /* e.g. rotateY(-30deg) */
  --sfb-max-step-angle: 1turn; /* per-step angle cap, 8deg tightens small spools */
  --sfb-flap-border: #2a2a2a; /* border on each flap card */
}

/* Per-spool override */
split-flap-spool.highlight {
  --sfb-flap-bg: #16a34a;
  --sfb-flap-color: #fff;
}
```

## Behavior

### Initial State

Before `value` is set, a `<split-flap-spool>` shows the first flap in its sequence. For `charSpool`, that is a space. This mirrors the physical home position a real board establishes on startup.

### Animation

Each flap step plays a fold animation where the top half falls away and reveals the next card underneath. The animation duration is derived from `speed`, so it always fits inside one step interval.

### Unknown Key

If `value` is set to a key that does not exist in `flaps`, the spool does not start a new search and no error is thrown. If this happens during an in-flight animation, the current flip finishes and `settled` reports the flap the spool actually landed on.

### Retargeting During Motion

If `value` changes to another valid key while the spool is already moving, the spool keeps its current forward motion and retargets to the newest valid key. It does not snap backward or restart from the beginning.

### Spool Changes During Motion

If `flaps` changes while the spool is moving, the component remaps the currently visible flap by key into the new spool, clears stale animation bookkeeping, and continues from the new coherent state.

### Grid Size Mismatch

If `grid` has more rows or columns than `spools`, the extra entries are ignored. If `grid` is smaller than `spools`, spools without a matching target key stay on their current flap. No errors are thrown.

### Forward-Only Stepping

Because a spool only rotates forward, the number of steps depends on the distance ahead in the spool, wrapping around if needed.

```
'A' -> 'C'  =  2 steps
'Z' -> 'B'  =  3 steps  (wraps: Z -> ' ' -> A -> B)
```

This applies to all flap types. Keep the order of your spool in mind when designing update sequences. The closer two keys are in the spool, the faster the transition.

## Resources & References

- [How a Split-Flap Display Works (YouTube)](https://www.youtube.com/watch?v=UAQJJAQSg_g)
- [Lit](https://lit.dev/)
- [Scott Bezek's open-source split-flap hardware](https://github.com/scottbez1/splitflap)
