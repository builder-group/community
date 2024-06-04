import type { TRgbaColor, TRgbColor } from './types';

export function rgbaToRgb(rgba: TRgbaColor): { rgb: TRgbColor; alpha: number } {
	return { rgb: [rgba[0], rgba[1], rgba[2]], alpha: rgba[3] };
}
