import { describe, expect, it } from 'vitest';
import { getRegionPixels } from './get-region-pixels';
import { TGridRegion } from './types';

describe('getRegionPixels', () => {
	it('should calculate region pixels without gaps', () => {
		const region: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 3, cols: 4 }
		};

		const result = getRegionPixels(region, {
			cell: { width: 10, height: 15 },
			gap: { width: 0, height: 0 }
		});

		expect(result).toEqual({
			x: 0,
			y: 0,
			width: 40,
			height: 45
		});
	});

	it('should calculate region pixels with gaps applied', () => {
		const region: TGridRegion = {
			start: { row: 1, col: 2 },
			dimension: { rows: 2, cols: 3 }
		};

		const result = getRegionPixels(region, {
			cell: { width: 10, height: 20 },
			gap: { width: 5, height: 10 }
		});

		expect(result).toEqual({
			x: 20,
			y: 20,
			width: 40,
			height: 50
		});
	});

	it('should handle a single cell region with gaps applied', () => {
		const region: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 1, cols: 1 }
		};

		const result = getRegionPixels(region, {
			cell: { width: 50, height: 50 },
			gap: { width: 10, height: 10 }
		});

		expect(result).toEqual({
			x: 0,
			y: 0,
			width: 50,
			height: 50
		});
	});

	it('should return zero width and height for an empty region', () => {
		const region: TGridRegion = {
			start: { row: 0, col: 0 },
			dimension: { rows: 0, cols: 0 }
		};

		const result = getRegionPixels(region, {
			cell: { width: 10, height: 15 },
			gap: { width: 5, height: 5 }
		});

		expect(result).toEqual({
			x: 0,
			y: 0,
			width: 0,
			height: 0
		});
	});
});
