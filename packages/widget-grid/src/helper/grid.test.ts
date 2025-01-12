import { describe, expect, it } from 'vitest';
import { Grid } from './grid';

describe('Grid class', () => {
	describe('constructor', () => {
		it('should initialize with empty grid by default', () => {
			const grid = new Grid();
			expect(grid.cells).toEqual([[]]);
		});

		it('should initialize with provided grid', () => {
			const initialGrid = [
				['1', '2'],
				['3', '4']
			];
			const grid = new Grid(initialGrid);
			expect(grid.cells).toEqual([
				['1', '2'],
				['3', '4']
			]);
		});
	});

	describe('dimensions', () => {
		it('should return correct dimensions for empty grid', () => {
			const grid = new Grid();
			expect(grid.dimensions).toEqual({ rows: 1, columns: 0 });
		});

		it('should return correct dimensions for non-empty grid', () => {
			const initialGrid = [
				['1', '2', '3'],
				['4', '5', '6']
			];
			const grid = new Grid(initialGrid);
			expect(grid.dimensions).toEqual({ rows: 2, columns: 3 });
		});

		it('should handle single-row grid', () => {
			const grid = new Grid([['1', '2', '3']]);
			expect(grid.dimensions).toEqual({ rows: 1, columns: 3 });
		});

		it('should handle single-column grid', () => {
			const grid = new Grid([['1'], ['2'], ['3']]);
			expect(grid.dimensions).toEqual({ rows: 3, columns: 1 });
		});
	});

	describe('toString', () => {
		it('should return empty string for empty grid', () => {
			const grid = new Grid();
			expect(grid.toString()).toBe('');
		});

		it('should format single row grid correctly', () => {
			const grid = new Grid([['1', '2', '3']]);
			expect(grid.toString()).toBe('1 2 3');
		});

		it('should format multiple row grid correctly', () => {
			const grid = new Grid([
				['1', '2'],
				['3', '4']
			]);
			expect(grid.toString()).toBe('1 2\n3 4');
		});

		it('should handle empty cells', () => {
			const grid = new Grid([
				['1', null],
				[null, '2']
			]);
			expect(grid.toString()).toBe('1 -\n- 2');
		});
	});

	describe('region operations', () => {
		describe('clearRegion', () => {
			it('should clear a specified region', () => {
				const grid = new Grid([
					['A', 'A', 'B'],
					['A', 'A', 'B'],
					['C', 'C', 'B']
				]);

				grid.clearRegion({
					start: { row: 0, col: 0 },
					dimension: { width: 2, height: 2 }
				});

				expect(grid.cells).toEqual([
					[null, null, 'B'],
					[null, null, 'B'],
					['C', 'C', 'B']
				]);
			});
		});

		describe('fillRegion', () => {
			it('should fill a specified region with content', () => {
				const grid = new Grid<string>([
					[null, null, 'B'],
					[null, null, 'B'],
					['C', 'C', 'B']
				]);

				grid.fillRegion(
					{
						start: { row: 0, col: 0 },
						dimension: { width: 2, height: 2 }
					},
					'A'
				);

				expect(grid.cells).toEqual([
					['A', 'A', 'B'],
					['A', 'A', 'B'],
					['C', 'C', 'B']
				]);
			});
		});

		describe('moveRegion', () => {
			it('should move content from one region to another', () => {
				const grid = new Grid([
					['A', 'A', null],
					['A', 'A', null],
					['C', 'C', null]
				]);

				grid.moveRegion(
					{
						start: { row: 0, col: 0 },
						dimension: { width: 2, height: 2 }
					},
					{
						start: { row: 0, col: 1 },
						dimension: { width: 2, height: 2 }
					},
					'A'
				);

				expect(grid.cells).toEqual([
					[null, 'A', 'A'],
					[null, 'A', 'A'],
					['C', 'C', null]
				]);
			});
		});

		describe('swapRegions', () => {
			it('should swap content between two regions while maintaining their original shapes', () => {
				const grid = new Grid([
					['A', 'A', 'B'],
					['A', 'A', 'B'],
					['C', 'C', 'B']
				]);

				grid.swapRegions(
					{
						start: { row: 0, col: 0 },
						dimension: { width: 2, height: 2 }
					},
					{
						start: { row: 0, col: 2 },
						dimension: { width: 1, height: 3 }
					},
					'A',
					'B'
				);

				expect(grid.cells).toEqual([
					['B', 'B', 'A'],
					['B', 'B', 'A'],
					['C', 'C', 'A']
				]);
			});
		});
	});

	describe('cells getter', () => {
		it('should return a copy of the grid', () => {
			const grid = new Grid([
				['A', 'B'],
				['C', 'D']
			]);

			expect(grid.cells).toEqual([
				['A', 'B'],
				['C', 'D']
			]);
		});

		// TODO: Should we or trust the consumer, since making a copy is expensive?
		// it('should return a deep copy that cannot modify original grid', () => {
		// 	const grid = new Grid([
		// 		['A', 'B'],
		// 		['C', 'D']
		// 	]);

		// 	const cells = grid.cells;
		// 	// @ts-expect-error - Testing runtime immutability
		// 	cells[0][0] = 'X';

		// 	expect(grid.cells).toEqual([
		// 		['A', 'B'],
		// 		['C', 'D']
		// 	]);
		// });

		it('should handle null cells', () => {
			const grid = new Grid([
				['A', null],
				[null, 'B']
			]);

			expect(grid.cells).toEqual([
				['A', null],
				[null, 'B']
			]);
		});

		it('should handle empty grid', () => {
			const grid = new Grid();
			expect(grid.cells).toEqual([[]]);
		});
	});
});
