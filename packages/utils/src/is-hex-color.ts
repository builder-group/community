import type { THexColor } from './types';

export function isHexColor(color: unknown): color is THexColor {
	return typeof color === 'string' && /^#?(?:[a-f0-9]{6}|[a-f0-9]{3})$/i.test(color);
}
