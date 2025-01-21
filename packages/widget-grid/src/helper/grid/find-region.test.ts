import { describe, expect, it } from 'vitest';
import { findRegion } from './find-region';
import { TGridCells } from './types';

describe('findRegion', () => {
	it('should use default isValidCell to match id at position', () => {
		const cells: TGridCells<string> = [
			['A', 'A', 'B'],
			['A', 'A', 'B'],
			['C', 'C', 'B']
		];

		const result = findRegion(cells, { row: 0, col: 0 });

		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { cols: 2, rows: 2 }
		});
	});

	it('should use custom isValidCell when provided', () => {
		const cells: TGridCells<string> = [
			['1', '2', '3'],
			['4', '5', '6']
		];

		const result = findRegion(
			cells,
			{
				row: 0,
				col: 0
			},
			{
				isValidCell: (_) => true
			}
		);

		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { cols: 3, rows: 2 }
		});
	});

	it('should expand in all directions by default', () => {
		const cells: TGridCells<string> = [
			['X', 'X', 'X'],
			['X', 'X', 'X'],
			['X', 'X', 'X']
		];

		const result = findRegion(cells, { row: 1, col: 1 });

		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { cols: 3, rows: 3 }
		});
	});

	it('should not expand when all directions are false', () => {
		const cells: TGridCells<string> = [
			['X', 'X', 'X'],
			['X', 'X', 'X'],
			['X', 'X', 'X']
		];

		const result = findRegion(
			cells,
			{
				row: 1,
				col: 1
			},
			{
				directions: {
					up: false,
					down: false,
					left: false,
					right: false
				}
			}
		);

		expect(result).toEqual({
			start: { row: 1, col: 1 },
			dimension: { cols: 1, rows: 1 }
		});
	});

	it('should respect individual direction controls', () => {
		const cells: TGridCells<string> = [
			['X', 'X', 'X'],
			['X', 'X', 'X'],
			['X', 'X', 'X']
		];

		const tests = [
			{
				direction: 'right',
				position: { row: 1, col: 0 },
				expected: {
					start: { row: 1, col: 0 },
					dimension: { cols: 3, rows: 1 }
				}
			},
			{
				direction: 'down',
				position: { row: 0, col: 1 },
				expected: {
					start: { row: 0, col: 1 },
					dimension: { cols: 1, rows: 3 }
				}
			},
			{
				direction: 'left',
				position: { row: 1, col: 2 },
				expected: {
					start: { row: 1, col: 0 },
					dimension: { cols: 3, rows: 1 }
				}
			},
			{
				direction: 'up',
				position: { row: 2, col: 1 },
				expected: {
					start: { row: 0, col: 1 },
					dimension: { cols: 1, rows: 3 }
				}
			}
		];

		tests.forEach(({ direction, position, expected }) => {
			const result = findRegion(cells, position, {
				directions: {
					up: false,
					down: false,
					left: false,
					right: false,
					[direction]: true
				}
			});

			expect(result).toEqual(expected);
		});
	});

	it('should respect grid boundaries', () => {
		const cells: TGridCells<string> = [
			['A', 'A'],
			['A', 'A']
		];

		const result = findRegion(cells, { row: 0, col: 0 });

		expect(result).toEqual({
			start: { row: 0, col: 0 },
			dimension: { cols: 2, rows: 2 }
		});
	});
});
