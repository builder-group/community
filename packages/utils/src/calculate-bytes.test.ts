import { describe, expect, it } from 'vitest';

import { calculateBytes } from './calculate-bytes';

describe('calculateBytes function', () => {
	it('should calculate 1 byte for ASCII characters', () => {
		expect(calculateBytes('a')).toBe(1);
		expect(calculateBytes(' ')).toBe(1);
	});

	it('should calculate 2 bytes for characters in the 128-2047 range', () => {
		expect(calculateBytes('ñ')).toBe(2); // ñ is in the 2-byte range
		expect(calculateBytes('ø')).toBe(2); // ø is also in the 2-byte range
	});

	it('should calculate 3 bytes for characters in the 2048-65535 range excluding surrogates', () => {
		expect(calculateBytes('ࠀ')).toBe(3); // U+0800 is the start of the 3-byte range
	});

	it('should calculate 4 bytes for characters beyond the Basic Multilingual Plane', () => {
		expect(calculateBytes('😀')).toBe(4); // 😀 is beyond the BMP and requires 4 bytes
	});

	it('should handle strings with mixed byte lengths correctly', () => {
		expect(calculateBytes('añ😀')).toBe(7); // 1 byte for 'a', 2 bytes for 'ñ', and 4 bytes for '😀'
	});

	it('should handle orphaned surrogate halves by assuming 3 bytes', () => {
		// This is a somewhat contrived example since JavaScript strings shouldn't normally contain orphaned surrogates
		const orphanedSurrogateHalf = String.fromCharCode(0xd800); // High surrogate half without its pair
		expect(calculateBytes(orphanedSurrogateHalf)).toBe(3);
	});
});
