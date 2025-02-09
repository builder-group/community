import { describe, expect, it } from 'vitest';
import { getRegionDirection } from './get-region-direction';
import { TGridRegion } from './types';

describe('getRegionDirection', () => {
	const createRegion = (row: number, col: number): TGridRegion => ({
		start: { row, col },
		dimension: { rows: 1, cols: 1 }
	});

	describe('horizontal direction', () => {
		it('should return west when source is left of target', () => {
			const source = createRegion(0, 0);
			const target = createRegion(0, 1);

			expect(getRegionDirection(source, target).horizontal).toBe('west');
		});

		it('should return east when source is right of target', () => {
			const source = createRegion(0, 1);
			const target = createRegion(0, 0);

			expect(getRegionDirection(source, target).horizontal).toBe('east');
		});

		it('should return same-column when source and target are in same column', () => {
			const source = createRegion(0, 0);
			const target = createRegion(1, 0);

			expect(getRegionDirection(source, target).horizontal).toBe('same-column');
		});
	});

	describe('vertical direction', () => {
		it('should return north when source is above target', () => {
			const source = createRegion(0, 0);
			const target = createRegion(1, 0);

			expect(getRegionDirection(source, target).vertical).toBe('north');
		});

		it('should return south when source is below target', () => {
			const source = createRegion(1, 0);
			const target = createRegion(0, 0);

			expect(getRegionDirection(source, target).vertical).toBe('south');
		});

		it('should return same-row when source and target are in same row', () => {
			const source = createRegion(0, 0);
			const target = createRegion(0, 1);

			expect(getRegionDirection(source, target).vertical).toBe('same-row');
		});
	});

	it('should handle diagonal positions correctly', () => {
		const source = createRegion(0, 0);
		const target = createRegion(1, 1);

		const direction = getRegionDirection(source, target);
		expect(direction).toEqual({
			horizontal: 'west',
			vertical: 'north'
		});
	});
});
