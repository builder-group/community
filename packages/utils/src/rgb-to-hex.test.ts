import { describe, expect, it } from 'vitest';

import { rgbToHex } from './rgb-to-hex';

describe('rgbToHex function', () => {
	it('should convert RGB values to hex correctly', () => {
		expect(rgbToHex([170, 187, 204])).toBe('#aabbcc');
		expect(rgbToHex([255, 255, 255])).toBe('#ffffff');
		expect(rgbToHex([0, 0, 0])).toBe('#000000');
		expect(rgbToHex([0, 128, 128])).toBe('#008080');
	});

	it('should handle single digit hex values correctly', () => {
		expect(rgbToHex([1, 2, 3])).toBe('#010203');
		expect(rgbToHex([16, 32, 48])).toBe('#102030');
	});

	it('should handle edge cases correctly', () => {
		expect(rgbToHex([0, 0, 0])).toBe('#000000');
		expect(rgbToHex([255, 255, 255])).toBe('#ffffff');
	});
});
