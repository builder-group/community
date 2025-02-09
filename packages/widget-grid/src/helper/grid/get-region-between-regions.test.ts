import { describe, expect, it } from 'vitest';
import { getRegionBetweenRegions } from './get-region-between-regions';
import { TGridRegion } from './types';

describe('getRegionBetweenRegions', () => {
	it('should return null for overlapping regions', () => {
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toBeNull();
		expect(getRegionBetweenRegions(regionB, regionA)).toBeNull();
	});

	it('should return null for adjacent regions', () => {
		// A A
		// A A
		// B B
		// B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 2, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toBeNull();
		expect(getRegionBetweenRegions(regionB, regionA)).toBeNull();
	});

	it('should return single region between vertical regions', () => {
		// A A
		// A A
		// - -  <- This is the region between
		// B B
		// B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 3, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};

		const expected: TGridRegion = {
			start: { row: 2, col: 0 },
			dimension: { rows: 1, cols: 2 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toEqual(expected);
		expect(getRegionBetweenRegions(regionB, regionA)).toEqual(expected);
	});

	it('should return single region between horizontal regions', () => {
		// A A - B B
		// A A - B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 3 },
			dimension: { rows: 2, cols: 2 }
		};

		const expected: TGridRegion = {
			start: { row: 0, col: 2 },
			dimension: { rows: 2, cols: 1 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toEqual(expected);
		expect(getRegionBetweenRegions(regionB, regionA)).toEqual(expected);
	});

	it('should return null for diagonally positioned regions', () => {
		// A A -
		// A A -
		// - - B
		// - - B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 2, col: 2 },
			dimension: { rows: 2, cols: 1 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toBeNull();
		expect(getRegionBetweenRegions(regionB, regionA)).toBeNull();
	});

	it('should handle regions with different sizes', () => {
		// A - B B B
		// A - B B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 2 },
			dimension: { rows: 2, cols: 3 }
		};

		const expected: TGridRegion = {
			start: { row: 0, col: 1 },
			dimension: { rows: 2, cols: 1 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toEqual(expected);
		expect(getRegionBetweenRegions(regionB, regionA)).toEqual(expected);
	});

	it('should handle partially overlapping regions with gap', () => {
		// A A - B
		// A A - B
		// - - - B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 3 },
			dimension: { rows: 3, cols: 1 }
		};

		const expected: TGridRegion = {
			start: { row: 0, col: 2 },
			dimension: { rows: 2, cols: 1 }
		};

		expect(getRegionBetweenRegions(regionA, regionB)).toEqual(expected);
		expect(getRegionBetweenRegions(regionB, regionA)).toEqual(expected);
	});
});
