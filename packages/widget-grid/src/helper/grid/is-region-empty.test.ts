import { describe, expect, it } from 'vitest';
import { isRegionEmpty } from './is-region-empty';
import { TGridCells } from './types';

describe('isRegionEmpty', () => {
	it('should return true for completely empty region', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
		];

		const result = isRegionEmpty(cells, {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should return false if region contains any non-null cell', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, 'A', null],
			[null, null, null]
		];

		const result = isRegionEmpty(cells, {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(false);
	});

	it('should handle regions with offset starting position', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', null, null],
			['G', null, null]
		];

		const result = isRegionEmpty(cells, {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should handle single cell regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', null, 'F'],
			['G', 'H', 'I']
		];

		expect(
			isRegionEmpty(cells, {
				start: { row: 1, col: 1 },
				dimension: { rows: 1, cols: 1 }
			})
		).toBe(true);

		expect(
			isRegionEmpty(cells, {
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			})
		).toBe(false);
	});

	it('should handle empty regions (0 dimensions)', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];

		const result = isRegionEmpty(cells, {
			start: { row: 0, col: 0 },
			dimension: { rows: 0, cols: 0 }
		});

		expect(result).toBe(true);
	});
});
