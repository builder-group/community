import { html } from 'lit';
import '../src/spools/SplitFlapSpool';
import { charSpool, colorSpool, numericSpool } from '../src/spools/presets';
import type { TSpool } from '../src/types';

// Exercises all four flap types in one spool for visual testing.
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

// MARK: - Demo spools
const minimal = document.querySelector<any>('#minimal')!;
const realistic = document.querySelector<any>('#realistic')!;
const numeric = document.querySelector<any>('#numeric')!;
const color = document.querySelector<any>('#color')!;
const demo = document.querySelector<any>('#demo')!;

numeric.flaps = numericSpool;
color.flaps = colorSpool;
demo.flaps = demoSpool;

const realisticSpools: any[] = [realistic, numeric, color, demo];

// MARK: - Auto-cycle
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

function getCycleInterval(speed: number) {
	// Always give the flip animation time to complete before advancing.
	return Math.max(speed + 200, 600);
}

function restartIntervals(speed: number) {
	clearInterval(charIntervalId);
	clearInterval(digitIntervalId);
	clearInterval(colorIntervalId);
	clearInterval(demoIntervalId);

	const interval = getCycleInterval(speed);

	charIntervalId = setInterval(() => {
		charIdx = (charIdx + 1) % chars.length;
		minimal.value = chars[charIdx];
		realistic.value = chars[charIdx];
	}, interval);

	let digit = 0;
	digitIntervalId = setInterval(() => {
		digit = (digit + 1) % 10;
		numeric.value = String(digit);
	}, interval);

	colorIntervalId = setInterval(() => {
		colorIdx = (colorIdx + 1) % colorKeys.length;
		color.value = colorKeys[colorIdx];
	}, interval);

	demoIntervalId = setInterval(() => {
		demoIdx = (demoIdx + 1) % demoKeys.length;
		demo.value = demoKeys[demoIdx];
	}, interval);
}

restartIntervals(200); // initial speed matches slider default

// MARK: - Slider helpers
function setCssVar(prop: string, value: string) {
	realisticSpools.forEach((el) => el.style.setProperty(prop, value));
}

function formatDeg(value: number) {
	return `${value.toFixed(1).replace(/\.0$/, '')}\u00b0`;
}

function slider(
	id: string,
	valId: string,
	format: (v: number) => string,
	apply: (v: number) => void
) {
	const input = document.getElementById(id) as HTMLInputElement;
	const display = document.getElementById(valId)!;

	function update() {
		const v = Number(input.value);
		display.textContent = format(v);
		apply(v);
	}

	input.addEventListener('input', update);
	update(); // apply initial value on load
}

slider(
	'ctrl-speed',
	'val-speed',
	(v) => `${v}ms`,
	(v) => {
		realisticSpools.forEach((el) => (el.speed = v));
		minimal.speed = v;
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
		if (v <= 0) {
			realisticSpools.forEach((el) => el.style.removeProperty('--sfb-max-step-angle'));
			return;
		}

		setCssVar('--sfb-max-step-angle', `${v}deg`);
	}
);

slider(
	'ctrl-side-count',
	'val-side-count',
	(v) => (v < 0 ? 'auto' : String(v)),
	(v) => {
		realisticSpools.forEach((el) => (el.visibleSideCount = v));
	}
);

slider(
	'ctrl-font-size',
	'val-font-size',
	(v) => `${v}rem`,
	(v) => {
		const fontSize = `${v}rem`;
		const applyFontSize = (spool: TSpool): TSpool =>
			spool.map((f) => (f.type === 'char' ? { ...f, fontSize } : f));

		minimal.flaps = applyFontSize(charSpool);
		realistic.flaps = applyFontSize(charSpool);
		numeric.flaps = applyFontSize(numericSpool);
		color.flaps = applyFontSize(colorSpool);
		demo.flaps = applyFontSize(demoSpool);
	}
);

slider(
	'ctrl-crease',
	'val-crease',
	(v) => `${v}px`,
	(v) => {
		[minimal, ...realisticSpools].forEach((el) => el.style.setProperty('--sfb-crease', `${v}px`));
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
		if (v === 24) {
			[minimal, ...realisticSpools].forEach((el) => el.style.removeProperty(prop));
		} else {
			[minimal, ...realisticSpools].forEach((el) => el.style.setProperty(prop, `${v}px`));
		}
	}
);

slider(
	'ctrl-height',
	'val-height',
	(v) => (v === 24 ? 'auto' : `${v}px`),
	(v) => {
		const prop = '--sfb-spool-height';
		if (v === 24) {
			realisticSpools.forEach((el) => el.style.removeProperty(prop));
		} else {
			realisticSpools.forEach((el) => el.style.setProperty(prop, `${v}px`));
		}
	}
);

