import { describe, expect, it } from 'vitest';
import { mergeAdjacentRegions } from './merge-adjacent-regions';

describe('mergeAdjacentRegions', () => {
	it('should return empty array for empty input', () => {
		expect(mergeAdjacentRegions([])).toEqual([]);
	});

	it('should return same region for single region input', () => {
		const region = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };
		expect(mergeAdjacentRegions([region])).toEqual([region]);
	});

	it('should merge horizontally adjacent regions', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
		];
		expect(mergeAdjacentRegions(regions)).toEqual([
			{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } }
		]);
	});

	it('should merge vertically adjacent regions', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }
		];
		expect(mergeAdjacentRegions(regions)).toEqual([
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should merge multiple regions in sequence', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }
		];
		expect(mergeAdjacentRegions(regions)).toEqual([
			{ start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 1 } }
		]);
	});

	it('should not merge non-adjacent regions', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }
		];
		expect(mergeAdjacentRegions(regions)).toEqual(regions);
	});

	it('should not merge regions with different dimensions', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } }
		];
		expect(mergeAdjacentRegions(regions)).toEqual(regions);
	});

	it('should not mutate input array by default', () => {
		const regions = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
		];
		const originalRegions = [...regions];

		mergeAdjacentRegions(regions);
		expect(regions).toEqual(originalRegions);
	});
});
