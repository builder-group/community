import { isHexColor } from './is-hex-color';
import { isRgbColor } from './is-rgb-color';
import { rgbToHex } from './rgb-to-hex';
import type { TColor, THexColor } from './types';

export function toHexColor(color: TColor): THexColor | null {
	if (isHexColor(color)) {
		return color;
	} else if (isRgbColor(color)) {
		return rgbToHex(color);
	}
	return null;
}
