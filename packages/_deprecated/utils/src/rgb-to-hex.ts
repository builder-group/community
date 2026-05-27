import type { THexColor, TRgbColor } from './types';

export function rgbToHex(rgb: TRgbColor): THexColor {
	return `#${rgb
		.map((x) => {
			const hex = x.toString(16);
			return hex.length === 1 ? `0${hex}` : hex;
		})
		.join('')}`;
}
