import '../src/spools/SplitFlapSpool';

const minimal = document.querySelector<any>('#minimal')!;
const realistic = document.querySelector<any>('#realistic')!;

const chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
let i = 0;

setInterval(() => {
	i = (i + 1) % chars.length;
	minimal.value = chars[i];
	realistic.value = chars[i];
}, 800);
