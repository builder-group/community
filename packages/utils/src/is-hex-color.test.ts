import { describe, expect, it } from 'vitest';

import { isHexColor } from './is-hex-color';

describe('isHexColor function', () => {
	it('should return true for valid hex colors', () => {
		expect(isHexColor('#abc')).toBe(true);
		expect(isHexColor('#aabbcc')).toBe(true);
		expect(isHexColor('#ABC')).toBe(true);
		expect(isHexColor('#AABBCC')).toBe(true);
	});

	it('should return false for invalid hex colors', () => {
		expect(isHexColor('#abcd')).toBe(false);
		expect(isHexColor('abcd')).toBe(false);
		expect(isHexColor('#12345')).toBe(false);
		expect(isHexColor('12345')).toBe(false);
		expect(isHexColor('#xyz')).toBe(false);
		expect(isHexColor('xyz')).toBe(false);
	});
});
