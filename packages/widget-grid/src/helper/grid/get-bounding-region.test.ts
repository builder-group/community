import { describe, expect, it } from 'vitest';
import { getBoundingRegion } from './get-bounding-region';
import { TGridRegion } from './types';

describe('getBoundingRegion', () => {
	it('should return empty region for empty input', () => {
		const regions: TGridRegion[] = [];
		const result = getBoundingRegion(regions);
		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { rows: 0, cols: 0 }
		});
	});

	it('should return same region for single input region', () => {
		const regions: TGridRegion[] = [
			{
				start: { row: 1, col: 2 },
				dimension: { rows: 3, cols: 4 }
			}
		];
		const result = getBoundingRegion(regions);
		expect(result).toEqual({
			start: { row: 1, col: 2 },
			dimension: { rows: 3, cols: 4 }
		});
	});

	it('should find bounding region for multiple adjacent regions', () => {
		const regions: TGridRegion[] = [
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			{
				start: { row: 2, col: 0 },
				dimension: { rows: 2, cols: 2 }
			}
		];
		const result = getBoundingRegion(regions);
		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { rows: 4, cols: 2 }
		});
	});

	it('should find bounding region for overlapping regions', () => {
		const regions: TGridRegion[] = [
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 3, cols: 3 }
			},
			{
				start: { row: 2, col: 2 },
				dimension: { rows: 3, cols: 3 }
			}
		];
		const result = getBoundingRegion(regions);
		expect(result).toEqual({
			start: { row: 1, col: 1 },
			dimension: { rows: 4, cols: 4 }
		});
	});

	it('should find bounding region for non-contiguous regions', () => {
		const regions: TGridRegion[] = [
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 5, col: 5 },
				dimension: { rows: 1, cols: 1 }
			}
		];
		const result = getBoundingRegion(regions);
		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { rows: 6, cols: 6 }
		});
	});
});
