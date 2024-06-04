import type { TRgbaColor, TRgbColor } from './types';

export function rgbToRgba(rgb: TRgbColor, alpha: number): TRgbaColor {
	return [rgb[0], rgb[1], rgb[2], alpha];
}
