import { describe, expect, it } from 'vitest';
import { overrideMove } from './override-move';
import { TGridCells } from './types';

describe('overrideMove', () => {
	it('should move content to a new region', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		];

		const result = overrideMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			[null, null, null],
			['A', 'A', null],
			[null, null, null]
		]);
	});

	it('should override existing content in target region', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];

		const result = overrideMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			[null, null, null],
			['A', 'A', null],
			[null, null, null]
		]);
	});

	it('should not override existing content in target region if override is false', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];

		const result = overrideMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 },
			{ override: false }
		);

		expect(result).toBe(false);
		expect(cells).toEqual([
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		]);
	});
});
