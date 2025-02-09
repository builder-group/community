import { describe, expect, it } from 'vitest';
import { getRegionGap } from './get-region-gap';
import { TGridRegion } from './types';

describe('getRegionGap', () => {
	it('should return 0 for overlapping regions', () => {
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(0);
		expect(getRegionGap(regionB, regionA)).toBe(0);
	});

	it('should return 0 for adjacent regions', () => {
		// A A B B
		// A A B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(0);
		expect(getRegionGap(regionB, regionA)).toBe(0);
	});

	it('should return 0 for adjacent regions with different sizes', () => {
		// A
		// A
		// B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 1 },
			dimension: { rows: 2, cols: 1 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(0);
		expect(getRegionGap(regionB, regionA)).toBe(0);
	});

	it('should return correct distance for non-adjacent diagonal regions', () => {
		// A 1 2 3
		// 1 - - 4
		// 2 3 4 B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 1, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 2, col: 3 },
			dimension: { rows: 1, cols: 1 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(4);
		expect(getRegionGap(regionB, regionA)).toBe(4);
	});

	it('should return correct distance for non-adjacent horizontal regions', () => {
		// A 1 2 B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 1, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 3 },
			dimension: { rows: 1, cols: 1 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(2);
		expect(getRegionGap(regionB, regionA)).toBe(2);
	});

	it('should return correct distance for non-adjacent vertical regions', () => {
		// A
		// 1
		// 2
		// B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 1, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 3, col: 0 },
			dimension: { rows: 1, cols: 1 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(2);
		expect(getRegionGap(regionB, regionA)).toBe(2);
	});

	it('should return correct distance for non-adjacent diagonal regions with different sizes', () => {
		// A - - -
		// A - - -
		// A 1 2 -
		// 1 - 3 -
		// 2 3 B -
		// - - B -
		// - - B -
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 3, cols: 1 }
		};
		const regionB: TGridRegion = {
			start: { row: 4, col: 2 },
			dimension: { rows: 1, cols: 3 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(3);
		expect(getRegionGap(regionB, regionA)).toBe(3);
	});

	it('should return correct distance for non-adjacent horizontal regions with different sizes', () => {
		// A A 1 2 B B
		// A A - - B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 0, col: 4 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(2);
		expect(getRegionGap(regionB, regionA)).toBe(2);
	});

	it('should return correct distance for non-adjacent vertical regions with different sizes', () => {
		// A A
		// A A
		// 1 -
		// 2 -
		// B B
		// B B
		const regionA: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const regionB: TGridRegion = {
			start: { row: 4, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(getRegionGap(regionA, regionB)).toBe(2);
		expect(getRegionGap(regionB, regionA)).toBe(2);
	});
});
