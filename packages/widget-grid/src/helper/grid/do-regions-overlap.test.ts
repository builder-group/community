import { describe, expect, it } from 'vitest';
import { doRegionsOverlap } from './do-regions-overlap';

describe('doRegionsOverlap', () => {
	it('should detect overlapping regions', () => {
		const region1 = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		};
		const region2 = {
			start: { row: 2, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(doRegionsOverlap(region1, region2)).toBe(true);
	});

	it('should detect non-overlapping regions', () => {
		const region1 = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const region2 = {
			start: { row: 2, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(doRegionsOverlap(region1, region2)).toBe(false);
	});

	it('should detect adjacent regions as non-overlapping', () => {
		const region1 = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};
		const region2 = {
			start: { row: 0, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(doRegionsOverlap(region1, region2)).toBe(false);
	});

	it('should detect one region completely inside another', () => {
		const region1 = {
			start: { row: 0, col: 0 },
			dimension: { rows: 4, cols: 4 }
		};
		const region2 = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(doRegionsOverlap(region1, region2)).toBe(true);
	});

	it('should handle zero-dimension regions', () => {
		const region1 = {
			start: { row: 1, col: 1 },
			dimension: { rows: 0, cols: 2 }
		};
		const region2 = {
			start: { row: 1, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};

		expect(doRegionsOverlap(region1, region2)).toBe(false);
	});

	it('should be commutative (order of regions should not matter)', () => {
		const region1 = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		};
		const region2 = {
			start: { row: 2, col: 2 },
			dimension: { rows: 2, cols: 2 }
		};
		expect(doRegionsOverlap(region1, region2)).toBe(doRegionsOverlap(region2, region1));
	});
});
