import { describe, expect, it } from 'vitest';

import { isRgbColor } from './is-rgb-color';

describe('isRgbColor function', () => {
	it('should return true for valid RGB colors', () => {
		expect(isRgbColor([170, 187, 204])).toBe(true);
		expect(isRgbColor([255, 255, 255])).toBe(true);
		expect(isRgbColor([0, 0, 0])).toBe(true);
		expect(isRgbColor([0, 128, 128])).toBe(true);
	});

	it('should return false for invalid RGB colors', () => {
		expect(isRgbColor([170, 187])).toBe(false); // Not enough elements
		expect(isRgbColor([170, 187, 204, 255])).toBe(false); // Too many elements
		expect(isRgbColor(['170', '187', '204'])).toBe(false); // Non-integer elements
		expect(isRgbColor([170, 187, -1])).toBe(false); // Negative value
		expect(isRgbColor([170, 187, 256])).toBe(false); // Value out of range
	});
});
