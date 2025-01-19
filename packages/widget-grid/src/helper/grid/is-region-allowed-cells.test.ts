import { describe, expect, it } from 'vitest';
import { isRegionAllowedCells } from './is-region-allowed-cells';
import { TGridCells } from './types';

describe('isRegionAllowedCells', () => {
	it('should return true when region contains only allowed cells', () => {
		const cells: TGridCells<string> = [
			['A', 'A', 'B'],
			['A', 'A', 'C'],
			['A', 'A', 'B']
		];

		const result = isRegionAllowedCells(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			['A']
		);

		expect(result).toBe(true);
	});

	it('should return false when region contains disallowed cells', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'B', 'C'],
			['A', 'B', 'C']
		];

		const result = isRegionAllowedCells(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			['A', 'C']
		);

		expect(result).toBe(false);
	});

	it('should treat null as disallowed unless explicitly included', () => {
		const cells: TGridCells<string> = [
			[null, null, 'B'],
			['A', null, 'B'],
			['A', 'A', null]
		];

		// Without null in allowed cells
		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A']
			)
		).toBe(false);

		// With null in allowed cells
		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', null]
			)
		).toBe(true);
	});

	it('should handle regions with offset starting position', () => {
		const cells: TGridCells<string> = [
			['B', 'B', 'B'],
			['B', 'A', 'A'],
			['B', 'A', 'A']
		];

		const result = isRegionAllowedCells(
			cells,
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 2, cols: 2 }
			},
			['A']
		);

		expect(result).toBe(true);
	});

	it('should handle single cell regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'A', 'F'],
			['G', 'H', 'I']
		];

		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 1, col: 1 },
					dimension: { rows: 1, cols: 1 }
				},
				['A', 'B']
			)
		).toBe(true);

		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 0, col: 2 },
					dimension: { rows: 1, cols: 1 }
				},
				['A', 'B']
			)
		).toBe(false);
	});

	it('should handle empty regions (0 dimensions)', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];

		const result = isRegionAllowedCells(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 0, cols: 0 }
			},
			['A', 'B']
		);

		expect(result).toBe(true);
	});

	it('should handle completely empty region only if null is allowed', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
		];

		// Without null in allowed cells
		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', 'B']
			)
		).toBe(false);

		// With null in allowed cells
		expect(
			isRegionAllowedCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', 'B', null]
			)
		).toBe(true);
	});
});
