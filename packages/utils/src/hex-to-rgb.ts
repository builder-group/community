import { isHexColor } from './is-hex-color';
import type { THexColor, TRgbColor } from './types';

export function hexToRgb(hex: THexColor): TRgbColor | null {
	if (!isHexColor(hex)) {
		return null;
	}

	let r: number;
	let g: number;
	let b: number;

	const hexValue = hex.slice(1);
	if (hexValue.length === 3) {
		// @ts-expect-error -- Covered by above regex check
		r = parseInt(hexValue[0] + hexValue[0], 16);
		// @ts-expect-error -- Covered by above regex check
		g = parseInt(hexValue[1] + hexValue[1], 16);
		// @ts-expect-error -- Covered by above regex check
		b = parseInt(hexValue[2] + hexValue[2], 16);
	} else {
		r = parseInt(hexValue.slice(0, 2), 16);
		g = parseInt(hexValue.slice(2, 4), 16);
		b = parseInt(hexValue.slice(4, 6), 16);
	}

	return [r, g, b];
}
