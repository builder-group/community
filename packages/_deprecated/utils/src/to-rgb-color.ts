import { hexToRgb } from './hex-to-rgb';
import { isHexColor } from './is-hex-color';
import { isRgbColor } from './is-rgb-color';
import type { TColor, TRgbColor } from './types';

export function toRgbColor(color: TColor): TRgbColor | null {
	if (isRgbColor(color)) {
		return color;
	} else if (isHexColor(color)) {
		return hexToRgb(color);
	}
	return null;
}
