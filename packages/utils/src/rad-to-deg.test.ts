import { describe, expect, it } from 'vitest';

import { radToDeg } from './rad-to-deg';

describe('radToDeg function', () => {
	it('should convert radians to degrees correctly', () => {
		expect(radToDeg(Math.PI)).toBe(180);
		expect(radToDeg(Math.PI / 2)).toBe(90);
		expect(radToDeg(Math.PI / 4)).toBe(45);
	});

	it('should handle zero correctly', () => {
		expect(radToDeg(0)).toBe(0);
	});

	it('should handle negative values correctly', () => {
		expect(radToDeg(-Math.PI)).toBe(-180);
		expect(radToDeg(-Math.PI / 2)).toBe(-90);
	});
});
