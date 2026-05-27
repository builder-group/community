import { describe, expect, it } from 'vitest';
import { degToRad } from './deg-to-rad';

describe('degToRad function', () => {
	it('should convert degrees to radians correctly', () => {
		expect(degToRad(180)).toBe(Math.PI);
		expect(degToRad(90)).toBe(Math.PI / 2);
		expect(degToRad(45)).toBe(Math.PI / 4);
	});

	it('should handle zero correctly', () => {
		expect(degToRad(0)).toBe(0);
	});

	it('should handle negative values correctly', () => {
		expect(degToRad(-180)).toBe(-Math.PI);
		expect(degToRad(-90)).toBe(-Math.PI / 2);
	});
});
