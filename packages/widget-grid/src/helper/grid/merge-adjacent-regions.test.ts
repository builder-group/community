import { describe, expect, it } from 'vitest';
import { mergeAdjacentRegions } from './merge-adjacent-regions';
import { TGridRegion } from './types';

describe('mergeAdjacentRegions', () => {
	it('should return empty array for empty input', () => {
		const regions: TGridRegion[] = [];
		expect(mergeAdjacentRegions(regions)).toBe(regions);
		expect(regions).toEqual([]);
	});

	it('should return same array for single region input', () => {
		const regions: TGridRegion[] = [{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }];
		expect(mergeAdjacentRegions(regions)).toBe(regions);
		expect(regions).toEqual([{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }]);
	});

	it('should merge horizontally adjacent regions', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
		];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual([{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } }]);
	});

	it('should merge vertically adjacent regions', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }
		];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual([{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } }]);
	});

	it('should handle complex merging scenarios', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 1, col: 0 }, dimension: { cols: 2, rows: 1 } }
		];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual([{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } }]);
	});

	it('should not merge non-adjacent regions', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }
		];
		const originalRegions = [...regions];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual(originalRegions);
	});

	it('should not merge regions with different dimensions', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } }
		];
		const originalRegions = [...regions];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual(originalRegions);
	});

	it('should handle regions that can be merged in multiple ways', () => {
		const regions: TGridRegion[] = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } }
		];
		mergeAdjacentRegions(regions);
		expect(regions).toEqual([{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } }]);
	});
});
