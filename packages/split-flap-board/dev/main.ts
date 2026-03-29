import { html } from 'lit';
import {
	charSpool,
	colorSpool,
	fromLines,
	getFlapKey,
	numericSpool,
	spoolGrid,
	type SplitFlapBoard,
	type SplitFlapSpool,
	type TSpool
} from '../src';

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

const elMinimal = queryRequired<TSpoolElement>('#minimal');
const elRealistic = queryRequired<TSpoolElement>('#realistic');
const elNumeric = queryRequired<TSpoolElement>('#numeric');
const elColor = queryRequired<TSpoolElement>('#color');
const elDemo = queryRequired<TSpoolElement>('#demo');
const elBoard = queryRequired<TBoardElement>('#quotes-board');

elNumeric.flaps = numericSpool;
elColor.flaps = colorSpool;
elDemo.flaps = demoSpool;

const realisticEls: TControlTarget[] = [elRealistic, elNumeric, elColor, elDemo, elBoard];
const sizedEls: TSpoolElement[] = [elMinimal, elRealistic, elNumeric, elColor, elDemo];
const themedEls: HTMLElement[] = [elMinimal, ...realisticEls];

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

function showQuote(idx: number): void {
	const { grid } = fromLines(QUOTES[idx] as string[], BOARD_COLS);
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
const colorKeys = colorSpool.map(getFlapKey);
const demoKeys = demoSpool.map(getFlapKey);

let charIdx = 0;
let colorIdx = 0;
let demoIdx = 0;
let charIntervalId: ReturnType<typeof setInterval>;
let digitIntervalId: ReturnType<typeof setInterval>;
let colorIntervalId: ReturnType<typeof setInterval>;
let demoIntervalId: ReturnType<typeof setInterval>;

function restartIntervals(speed: number): void {
	clearInterval(charIntervalId);
	clearInterval(digitIntervalId);
	clearInterval(colorIntervalId);
	clearInterval(demoIntervalId);

	// Give the flip animation time to finish before the next step.
	const interval = Math.max(speed + 200, 600);

	charIntervalId = setInterval(() => {
		charIdx = (charIdx + 1) % chars.length;
		elMinimal.value = chars[charIdx] as string;
		elRealistic.value = chars[charIdx] as string;
	}, interval);

	let digit = 0;
	digitIntervalId = setInterval(() => {
		digit = (digit + 1) % 10;
		elNumeric.value = String(digit);
	}, interval);

	colorIntervalId = setInterval(() => {
		colorIdx = (colorIdx + 1) % colorKeys.length;
		elColor.value = colorKeys[colorIdx] as string;
	}, interval);

	demoIntervalId = setInterval(() => {
		demoIdx = (demoIdx + 1) % demoKeys.length;
		elDemo.value = demoKeys[demoIdx] as string;
	}, interval);
}

restartIntervals(200); // matches slider default

// MARK: - Controls

/** Wire up a range slider: calls `apply` immediately on load and on every change. */
function slider(
	id: string,
	valId: string,
	format: (v: number) => string,
	apply: (v: number) => void
) {
	const input = queryRequired<HTMLInputElement>(`#${id}`);
	const display = queryRequired<HTMLElement>(`#${valId}`);
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
		setCssVar(realisticEls, '--sfb-drum-radius', `${v}px`);
	}
);

slider(
	'ctrl-max-angle',
	'val-max-angle',
	(v) => (v <= 0 ? 'off' : formatDeg(v)),
	(v) => {
		if (v <= 0) {
			removeCssVar(realisticEls, '--sfb-max-step-angle');
			return;
		}

		setCssVar(realisticEls, '--sfb-max-step-angle', `${v}deg`);
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
		const sizedSpools = [
			withFontSize(charSpool, fontSize),
			withFontSize(charSpool, fontSize),
			withFontSize(numericSpool, fontSize),
			withFontSize(colorSpool, fontSize),
			withFontSize(demoSpool, fontSize)
		] as const;

		sizedEls.forEach((element, index) => {
			element.flaps = sizedSpools[index] ?? charSpool;
		});

		elBoard.spools = spoolGrid(withFontSize(charSpool, fontSize), BOARD_COLS, BOARD_ROWS);
		showQuote(quoteIdx);
	}
);

slider(
	'ctrl-crease',
	'val-crease',
	(v) => `${v}px`,
	(v) => {
		setCssVar(themedEls, '--sfb-crease', `${v}px`);
	}
);

slider(
	'ctrl-rotation',
	'val-rotation',
	(v) => `${v}°`,
	(v) => {
		setCssVar(realisticEls, '--sfb-view-transform', v === 0 ? 'none' : `rotateY(-${v}deg)`);
	}
);

slider(
	'ctrl-width',
	'val-width',
	(v) => (v === 24 ? 'auto' : `${v}px`),
	(v) => {
		const prop = '--sfb-spool-width';
		if (v === 24) {
			removeCssVar(themedEls, prop);
			return;
		}

		setCssVar(themedEls, prop, `${v}px`);
	}
);

slider(
	'ctrl-height',
	'val-height',
	(v) => (v === 24 ? 'auto' : `${v}px`),
	(v) => {
		const prop = '--sfb-spool-height';
		if (v === 24) {
			removeCssVar(realisticEls, prop);
			return;
		}

		setCssVar(realisticEls, prop, `${v}px`);
	}
);

// MARK: - Helpers

type TBoardElement = SplitFlapBoard;
type TSpoolElement = SplitFlapSpool;
type TControlTarget = HTMLElement & { speed: number; visibleSideCount: number };

function queryRequired<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (element == null) {
		throw new Error(`Missing element: ${selector}`);
	}

	return element;
}

function setCssVar(elements: HTMLElement[], prop: string, value: string): void {
	elements.forEach((element) => element.style.setProperty(prop, value));
}

function removeCssVar(elements: HTMLElement[], prop: string): void {
	elements.forEach((element) => element.style.removeProperty(prop));
}

function formatDeg(value: number): string {
	return `${value.toFixed(1).replace(/\.0$/, '')}\u00b0`;
}

function withFontSize(spool: TSpool, fontSize: string): TSpool {
	return spool.map((flap) => (flap.type === 'char' ? { ...flap, fontSize } : flap));
}
