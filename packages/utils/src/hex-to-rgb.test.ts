import { describe, expect, it } from 'vitest';

import { hexToRgb } from './hex-to-rgb';

describe('hexToRgb function', () => {
	it('should convert 3-digit hex to RGB correctly', () => {
		expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
	});

	it('should convert 6-digit hex to RGB correctly', () => {
		expect(hexToRgb('#aabbcc')).toEqual([170, 187, 204]);
	});

	it('should handle uppercase hex values correctly', () => {
		expect(hexToRgb('#ABC')).toEqual([170, 187, 204]);
		expect(hexToRgb('#AABBCC')).toEqual([170, 187, 204]);
	});

	it('should return null for invalid hex values', () => {
		expect(hexToRgb('#abcd')).toBeNull();
		expect(hexToRgb('#12345')).toBeNull();
		expect(hexToRgb('#xyz')).toBeNull();
	});
});
