import { html } from 'lit';
import '../src/SplitFlapBoard';
import '../src/spools/SplitFlapSpool';
import { fromLines, spoolGrid } from '../src/lib/board';
import { charSpool, colorSpool, numericSpool } from '../src/spools/presets';
import type { TSpool } from '../src/types';

// MARK: - Custom spool showcasing all four flap types

const demoSpool: TSpool = [
	{ type: 'char', value: ' ' },
	{ type: 'char', value: 'A', color: '#fff', bg: '#3b82f6' },
	{ type: 'color', key: 'red', value: '#ef4444' },
	{
		type: 'image',
		key: 'gradient',
		src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%234f46e5'/><stop offset='1' stop-color='%23ec4899'/></linearGradient></defs><rect fill='url(%23g)' width='1' height='1'/></svg>",
		alt: 'gradient'
	},
	{ type: 'custom', key: 'star', top: html`<span>★</span>`, bottom: html`<span>★</span>` }
];

// MARK: - Element refs

const elMinimal = document.querySelector<any>('#minimal')!;
const elRealistic = document.querySelector<any>('#realistic')!;
const elNumeric = document.querySelector<any>('#numeric')!;
const elColor = document.querySelector<any>('#color')!;
const elDemo = document.querySelector<any>('#demo')!;
const elBoard = document.querySelector<any>('#quotes-board')!;

elNumeric.flaps = numericSpool;
elColor.flaps = colorSpool;
elDemo.flaps = demoSpool;

// Shared array used by slider controls to sync CSS vars, speed, visibleSideCount.
// The board is included so all realistic controls apply to it automatically.
const realisticEls: any[] = [elRealistic, elNumeric, elColor, elDemo, elBoard];

// MARK: - Board: quote rotator
//
// Spools are initialised once. Only `grid` changes on each transition so each
// cell steps forward through its chars rather than snapping to a new position.

const BOARD_COLS = 15;
const BOARD_ROWS = 5;
const BOARD_PAUSE_MS = 3000;

const QUOTES: string[][] = [
	['', '  GOD IS IN   ', ' THE DETAILS. ', ' - LUDWIG MIES', ''],
	['', ' STAY HUNGRY  ', ' STAY FOOLISH ', ' - STEVE JOBS ', ''],
	['', 'GOOD DESIGN IS', 'GOOD BUSINESS ', '- THOMAS WATSON', '']
];

// Set once — persists across quote changes so animations stay smooth.
elBoard.spools = spoolGrid(charSpool, BOARD_COLS, BOARD_ROWS);

let quoteIdx = 0;
let boardCharSpool = charSpool; // updated when font size changes

function showQuote(idx: number) {
	const { grid } = fromLines(QUOTES[idx], BOARD_COLS);
	elBoard.grid = grid;
}

elBoard.addEventListener('board-settled', () => {
	setTimeout(() => {
		quoteIdx = (quoteIdx + 1) % QUOTES.length;
		showQuote(quoteIdx);
	}, BOARD_PAUSE_MS);
});

showQuote(0);

// MARK: - Individual spools: auto-cycle

const chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
const colorKeys = colorSpool.map((f) => (f as any).key as string);
const demoKeys = demoSpool.map((f) => ((f as any).key ?? (f as any).value) as string);

let charIdx = 0;
let colorIdx = 0;
let demoIdx = 0;
let charIntervalId: ReturnType<typeof setInterval>;
let digitIntervalId: ReturnType<typeof setInterval>;
let colorIntervalId: ReturnType<typeof setInterval>;
let demoIntervalId: ReturnType<typeof setInterval>;

function restartIntervals(speed: number) {
	clearInterval(charIntervalId);
	clearInterval(digitIntervalId);
	clearInterval(colorIntervalId);
	clearInterval(demoIntervalId);

	// Give the flip animation time to finish before the next step.
	const interval = Math.max(speed + 200, 600);

	charIntervalId = setInterval(() => {
		charIdx = (charIdx + 1) % chars.length;
		elMinimal.value = chars[charIdx];
		elRealistic.value = chars[charIdx];
	}, interval);

	let digit = 0;
	digitIntervalId = setInterval(() => {
		digit = (digit + 1) % 10;
		elNumeric.value = String(digit);
	}, interval);

	colorIntervalId = setInterval(() => {
		colorIdx = (colorIdx + 1) % colorKeys.length;
		elColor.value = colorKeys[colorIdx];
	}, interval);

	demoIntervalId = setInterval(() => {
		demoIdx = (demoIdx + 1) % demoKeys.length;
		elDemo.value = demoKeys[demoIdx];
	}, interval);
}

restartIntervals(200); // matches slider default

// MARK: - Controls

function setCssVar(prop: string, value: string) {
	realisticEls.forEach((el) => el.style.setProperty(prop, value));
}

function removeCssVar(prop: string) {
	realisticEls.forEach((el) => el.style.removeProperty(prop));
}

function formatDeg(v: number) {
	return `${v.toFixed(1).replace(/\.0$/, '')}\u00b0`;
}

/** Wire up a range slider: calls `apply` immediately on load and on every change. */
function slider(
	id: string,
	valId: string,
	format: (v: number) => string,
	apply: (v: number) => void
) {
	const input = document.getElementById(id) as HTMLInputElement;
	const display = document.getElementById(valId)!;
	const update = () => {
		const v = Number(input.value);
		display.textContent = format(v);
		apply(v);
	};
	input.addEventListener('input', update);
	update();
}

slider(
	'ctrl-speed',
	'val-speed',
	(v) => `${v}ms`,
	(v) => {
		realisticEls.forEach((el) => (el.speed = v));
		elMinimal.speed = v;
		restartIntervals(v);
	}
);

slider(
	'ctrl-radius',
	'val-radius',
	(v) => `${v}px`,
	(v) => {
		setCssVar('--sfb-drum-radius', `${v}px`);
	}
);

slider(
	'ctrl-max-angle',
	'val-max-angle',
	(v) => (v <= 0 ? 'off' : formatDeg(v)),
	(v) => {
		if (v <= 0) removeCssVar('--sfb-max-step-angle');
		else setCssVar('--sfb-max-step-angle', `${v}deg`);
	}
);

slider(
	'ctrl-side-count',
	'val-side-count',
	(v) => (v < 0 ? 'auto' : String(v)),
	(v) => {
		realisticEls.forEach((el) => (el.visibleSideCount = v));
	}
);

slider(
	'ctrl-font-size',
	'val-font-size',
	(v) => `${v}rem`,
	(v) => {
		const fontSize = `${v}rem`;
		const sized = (spool: TSpool): TSpool =>
			spool.map((f) => (f.type === 'char' ? { ...f, fontSize } : f));

		elMinimal.flaps = sized(charSpool);
		elRealistic.flaps = sized(charSpool);
		elNumeric.flaps = sized(numericSpool);
		elColor.flaps = sized(colorSpool);
		elDemo.flaps = sized(demoSpool);

		// Rebuild board spools with new font size, then re-apply the current grid
		// so each cell retargets without losing its current position.
		boardCharSpool = sized(charSpool);
		elBoard.spools = spoolGrid(boardCharSpool, BOARD_COLS, BOARD_ROWS);
		showQuote(quoteIdx);
	}
);

slider(
	'ctrl-crease',
	'val-crease',
	(v) => `${v}px`,
	(v) => {
		[elMinimal, ...realisticEls].forEach((el) => el.style.setProperty('--sfb-crease', `${v}px`));
	}
);

slider(
	'ctrl-rotation',
	'val-rotation',
	(v) => `${v}°`,
	(v) => {
		setCssVar('--sfb-view-transform', v === 0 ? 'none' : `rotateY(-${v}deg)`);
	}
);

slider(
	'ctrl-width',
	'val-width',
	(v) => (v === 24 ? 'auto' : `${v}px`),
	(v) => {
		const prop = '--sfb-spool-width';
		if (v === 24) [elMinimal, ...realisticEls].forEach((el) => el.style.removeProperty(prop));
		else [elMinimal, ...realisticEls].forEach((el) => el.style.setProperty(prop, `${v}px`));
	}
);

slider(
	'ctrl-height',
	'val-height',
	(v) => (v === 24 ? 'auto' : `${v}px`),
	(v) => {
		const prop = '--sfb-spool-height';
		if (v === 24) realisticEls.forEach((el) => el.style.removeProperty(prop));
		else realisticEls.forEach((el) => el.style.setProperty(prop, `${v}px`));
	}
);
