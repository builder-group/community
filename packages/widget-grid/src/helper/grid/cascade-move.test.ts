import { describe, expect, it } from 'vitest';
import { cascadeMove } from './cascade-move';
import { TGridCells } from './types';

describe('cascadeMove', () => {
	it('should move 1x1 region in east direction and swap with 1x1 region', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{ row: 0, col: 1 }
		);

		expect(cells).toEqual([
			['B', 'A', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		]);
		expect(result).toEqual([
			{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('should move 1x2 region in east direction and swap with two 1x1 regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 1 }
		);

		expect(cells).toEqual([
			['B', 'A', 'C'],
			['D', 'A', 'E'],
			['F', 'G', 'H']
		]);
		expect(result).toEqual([
			{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'D', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should move 1x2 region in east direction and swap with 2x2 region', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'B', 'B'],
			['C', 'D', 'E']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 2 }
		);

		expect(cells).toEqual([
			['B', 'B', 'A'],
			['B', 'B', 'A'],
			['C', 'D', 'E']
		]);
		expect(result).toEqual([
			{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } },
			{ id: 'A', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should move 1x2 region in east direction and swap with multiple smaller region', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'C', 'D'],
			['E', 'F', 'G']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 2 }
		);

		expect(cells).toEqual([
			['B', 'B', 'A'],
			['C', 'D', 'A'],
			['E', 'F', 'G']
		]);
		// expect(result).toEqual([
		// 	{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } },
		// 	{ id: 'A', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } }
		// ]);
	});

	it('should move 1x2 region in south direction and swap with 1x1 region', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 1, col: 0 }
		);

		expect(cells).toEqual([
			['F', 'B', 'C'],
			['A', 'D', 'E'],
			['A', 'G', 'H']
		]);
		expect(result).toEqual([
			{ id: 'F', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should move 1x1 region in north direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 2, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{ row: 1, col: 0 }
		);

		expect(cells).toEqual([
			[null, 'B', 'C'],
			['F', 'D', 'E'],
			['A', 'G', 'H'],
			['A', null, null]
		]);
		expect(result).toEqual([
			{ id: 'A', start: { row: 2, col: 0 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'F', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('should move 1x2 region in north direction and swap with 1x1 region', () => {
		const cells: TGridCells<string> = [
			['F', 'B', 'C'],
			['A', 'D', 'E'],
			['A', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 1, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 0 }
		);

		expect(cells).toEqual([
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		]);
		expect(result).toEqual([
			{ id: 'F', start: { row: 2, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should move region out of bounds in south direction', () => {
		const cells: TGridCells<string> = [
			['A', null],
			[null, null]
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{ row: 4, col: 0 }
		);

		expect(cells).toEqual([
			[null, null],
			[null, null],
			[null, null],
			[null, null],
			['A', null]
		]);
		expect(result).toEqual([
			{ id: 'A', start: { row: 4, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('should not move 1x1 region out of bounds in east direction', () => {
		const cells: TGridCells<string> = [
			['A', null],
			[null, null]
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{ row: 0, col: 4 }
		);

		expect(cells).toEqual([
			['A', null],
			[null, null]
		]);
		expect(result).toEqual([]);
	});

	it('should not move 2x1 region out of bounds in east direction', () => {
		const cells: TGridCells<string> = [
			['A', 'A'],
			[null, null]
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 0, col: 1 }
		);

		expect(cells).toEqual([
			['A', 'A'],
			[null, null]
		]);
		expect(result).toEqual([]);
	});

	it('should move 1x2 region in west direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'C', 'D'],
			['E', 'F', 'G']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 1 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 0, col: 0 }
		);

		expect(cells).toEqual([
			['B', 'B', 'D'],
			['A', 'C', 'G'],
			['A', 'F', null],
			['E', null, null]
		]);
		expect(result).toEqual([
			{ id: 'E', start: { row: 3, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } },
			{ id: 'D', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'G', start: { row: 1, col: 2 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('[1] should move 1x2 region in east direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'B', 'B'],
			['C', 'D', 'E']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 1 }
		);

		expect(cells).toEqual([
			['C', 'A', null],
			[null, 'A', null],
			[null, 'B', 'B'],
			[null, 'B', 'B'],
			[null, 'D', 'E']
		]);
		expect(result).toEqual([
			{ id: 'D', start: { row: 4, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'E', start: { row: 4, col: 2 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'B', start: { row: 2, col: 1 }, dimension: { cols: 2, rows: 2 } },
			{ id: 'A', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'C', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('[2] should move 1x2 region in east direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'C', 'D'],
			['E', 'F', 'G']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 0, col: 1 }
		);

		expect(cells).toEqual([
			['E', 'A', null],
			[null, 'A', null],
			[null, 'B', 'B'],
			[null, 'C', 'D'],
			[null, 'F', 'G']
		]);
		expect(result).toEqual([
			{ id: 'F', start: { row: 4, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'G', start: { row: 4, col: 2 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'C', start: { row: 3, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'D', start: { row: 3, col: 2 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'B', start: { row: 2, col: 1 }, dimension: { cols: 2, rows: 1 } },
			{ id: 'A', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'E', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('[1] should move 1x2 region in south east direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 1, col: 1 }
		);

		expect(cells).toEqual([
			['F', 'B', 'C'],
			[null, 'A', 'E'],
			[null, 'A', 'H'],
			[null, 'D', null],
			[null, 'G', null]
		]);
		expect(result).toEqual([
			{ id: 'G', start: { row: 4, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'D', start: { row: 3, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'F', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('[2] should move 1x2 region in south east direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E'],
			['F', 'G', 'H']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 2, col: 1 }
		);

		expect(cells).toEqual([
			['F', 'B', 'C'],
			[null, 'D', 'E'],
			[null, 'A', 'H'],
			[null, 'A', null],
			[null, 'G', null]
		]);
		expect(result).toEqual([
			{ id: 'G', start: { row: 4, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 2, col: 1 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'F', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('[3] should move 1x2 region in south east direction and trigger cascade', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'B', 'D'],
			['E', 'F', 'G']
		];

		const result = cascadeMove(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 1, rows: 2 }
			},
			{ row: 1, col: 1 }
		);

		expect(cells).toEqual([
			['B', null, 'C'],
			['B', 'A', 'D'],
			['E', 'A', 'G'],
			[null, 'F', null]
		]);
		expect(result).toEqual([
			{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } },
			{ id: 'F', start: { row: 3, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: 'A', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 2 } }
		]);
	});
});
