import { isValidU8 } from './is-valid-u8';
import type { TRgbColor } from './types';

export function isRgbColor(color: unknown): color is TRgbColor {
	return Array.isArray(color) && color.length === 3 && color.every(isValidU8);
}
