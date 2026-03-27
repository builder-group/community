import '../src/spools/SplitFlapSpool';
import { numericSpool } from '../src/spools/presets';

const minimal = document.querySelector<any>('#minimal')!;
const realistic = document.querySelector<any>('#realistic')!;
const numeric = document.querySelector<any>('#numeric')!;

numeric.flaps = numericSpool;
numeric.speed = 200;

const chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
let i = 0;

setInterval(() => {
	i = (i + 1) % chars.length;
	minimal.value = chars[i];
	realistic.value = chars[i];
}, 800);

let digit = 0;
setInterval(() => {
	digit = (digit + 1) % 10;
	numeric.value = String(digit);
}, 600);

const realisticSpools = [realistic, numeric];

document.getElementById('btn-front')?.addEventListener('click', () => {
	realisticSpools.forEach((el) => {
		el.style.setProperty('--sfb-view-transform', 'none');
	});
});

document.getElementById('btn-side')?.addEventListener('click', () => {
	realisticSpools.forEach((el) => {
		el.style.setProperty('--sfb-view-transform', 'rotateY(-30deg)');
	});
});
