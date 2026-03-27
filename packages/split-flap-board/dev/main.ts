import '../src/spools/SplitFlapSpool';
import { numericSpool } from '../src/spools/presets';

// ── spools ────────────────────────────────────────────────────────────────
const minimal = document.querySelector<any>('#minimal')!;
const realistic = document.querySelector<any>('#realistic')!;
const numeric = document.querySelector<any>('#numeric')!;

numeric.flaps = numericSpool;

const realisticSpools: any[] = [realistic, numeric];

// ── auto-cycle ────────────────────────────────────────────────────────────
const chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
let charIdx = 0;
let charIntervalId: ReturnType<typeof setInterval>;
let digitIntervalId: ReturnType<typeof setInterval>;

function getCycleInterval(speed: number) {
	// Always give the flip animation time to complete before advancing.
	return Math.max(speed + 200, 600);
}

function restartIntervals(speed: number) {
	clearInterval(charIntervalId);
	clearInterval(digitIntervalId);

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
}

restartIntervals(200); // initial speed matches slider default

// ── helpers ───────────────────────────────────────────────────────────────
function setCssVar(prop: string, value: string) {
	realisticSpools.forEach((el) => el.style.setProperty(prop, value));
}

// ── sliders ───────────────────────────────────────────────────────────────
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

slider('ctrl-speed', 'val-speed', (v) => `${v}ms`, (v) => {
	realisticSpools.forEach((el) => (el.speed = v));
	minimal.speed = v;
	restartIntervals(v);
});

slider('ctrl-radius', 'val-radius', (v) => `${v}px`, (v) => {
	setCssVar('--sfb-drum-radius', `${v}px`);
});

slider('ctrl-side-count', 'val-side-count', (v) => (v < 0 ? 'auto' : String(v)), (v) => {
	realisticSpools.forEach((el) => (el.visibleSideCount = v));
});

slider('ctrl-font-size', 'val-font-size', (v) => `${v}rem`, (v) => {
	[minimal, ...realisticSpools].forEach((el) => el.style.setProperty('--sfb-font-size', `${v}rem`));
});

slider('ctrl-crease', 'val-crease', (v) => `${v}px`, (v) => {
	[minimal, ...realisticSpools].forEach((el) => el.style.setProperty('--sfb-crease', `${v}px`));
});

slider('ctrl-rotation', 'val-rotation', (v) => `${v}°`, (v) => {
	setCssVar('--sfb-view-transform', v === 0 ? 'none' : `rotateY(-${v}deg)`);
});
