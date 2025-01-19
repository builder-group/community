import { describe, expect, it } from 'vitest';
import { getEmptyCells } from './get-empty-cells';
import { TGridCells } from './types';

describe('getEmptyCells', () => {
	it('should return empty array for region with no empty cells', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};

		const result = getEmptyCells(cells, region);

		expect(result).toEqual([]);
	});

	it('should return all cells as empty for empty region', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 2 }
		};

		const result = getEmptyCells(cells, region);

		expect(result).toEqual([
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 0, col: 1 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 1, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});

	it('should return only empty cells within mixed region', () => {
		const cells: TGridCells<string> = [
			['A', null, 'B'],
			[null, 'C', null],
			['D', 'E', 'F']
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { rows: 2, cols: 3 }
		};

		const result = getEmptyCells(cells, region);

		expect(result).toEqual([
			{
				start: { row: 0, col: 1 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 1, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 1, col: 2 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});

	it('should handle region at non-zero start position', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', null, 'E'],
			['F', null, 'G']
		];
		const region = {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 1 }
		};

		const result = getEmptyCells(cells, region);

		expect(result).toEqual([
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 2, col: 1 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});

	it('should handle region extending beyond grid bounds', () => {
		const cells: TGridCells<string> = [
			['A', null],
			[null, 'B']
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { rows: 3, cols: 3 }
		};

		const result = getEmptyCells(cells, region);

		expect(result).toEqual([
			{
				start: { row: 0, col: 1 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				start: { row: 1, col: 0 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});
});
