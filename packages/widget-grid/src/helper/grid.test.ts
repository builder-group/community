import { describe, expect, it } from 'vitest';
import { Grid, TGridRange } from './grid';

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

	describe('size getter', () => {
		it('should return correct size for empty grid', () => {
			const grid = new Grid();
			expect(grid.size).toEqual({ rows: 1, cols: 0 });
		});

		it('should return correct size for non-empty grid', () => {
			const initialGrid = [
				['1', '2', '3'],
				['4', '5', '6']
			];
			const grid = new Grid(initialGrid);
			expect(grid.size).toEqual({ rows: 2, cols: 3 });
		});

		it('should handle single-row grid', () => {
			const grid = new Grid([['1', '2', '3']]);
			expect(grid.size).toEqual({ rows: 1, cols: 3 });
		});

		it('should handle single-column grid', () => {
			const grid = new Grid([['1'], ['2'], ['3']]);
			expect(grid.size).toEqual({ rows: 3, cols: 1 });
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

	describe('getCellKey', () => {
		it('should generate unique keys for different positions', () => {
			const grid = new Grid();
			expect(grid.getCellKey(0, 0)).toBe('0-0');
			expect(grid.getCellKey(1, 2)).toBe('1-2');
			expect(grid.getCellKey(10, 20)).toBe('10-20');
		});

		it('should handle negative positions', () => {
			const grid = new Grid();
			expect(grid.getCellKey(-1, -2)).toBe('-1--2');
		});
	});

	describe('expandGrid', () => {
		describe('set strategy (default)', () => {
			it('should expand to specified size', () => {
				const grid = new Grid([
					['A', 'A'],
					['B', 'B']
				]);

				grid.expandGrid({ strategy: 'Set', rows: 3, cols: 4 });

				expect(grid.size).toEqual({ rows: 3, cols: 4 });
				expect(grid.cells).toEqual([
					['A', 'A', null, null],
					['B', 'B', null, null],
					[null, null, null, null]
				]);
			});

			it('should not shrink grid', () => {
				const grid = new Grid([
					['A', 'A', 'A'],
					['B', 'B', 'B']
				]);

				grid.expandGrid({ strategy: 'Set', rows: 1, cols: 2 });

				expect(grid.size).toEqual({ rows: 2, cols: 3 });
				expect(grid.cells).toEqual([
					['A', 'A', 'A'],
					['B', 'B', 'B']
				]);
			});
		});

		describe('add strategy', () => {
			it('should add specified rows and cols', () => {
				const grid = new Grid([
					['A', 'A'],
					['B', 'B']
				]);

				grid.expandGrid({ strategy: 'Add', rows: 1, cols: 2 });

				expect(grid.size).toEqual({ rows: 3, cols: 4 });
				expect(grid.cells).toEqual([
					['A', 'A', null, null],
					['B', 'B', null, null],
					[null, null, null, null]
				]);
			});

			it('should work with zero values', () => {
				const grid = new Grid([
					['A', 'A'],
					['B', 'B']
				]);

				grid.expandGrid({ strategy: 'Add', rows: 0, cols: 0 });

				expect(grid.size).toEqual({ rows: 2, cols: 2 });
				expect(grid.cells).toEqual([
					['A', 'A'],
					['B', 'B']
				]);
			});
		});
	});

	describe('trimGrid', () => {
		it('should remove empty rows from bottom', () => {
			const grid = new Grid([
				['A', 'B'],
				[null, null],
				[null, null]
			]);

			const removed = grid.trimGrid();

			expect(grid.cells).toEqual([['A', 'B']]);
			expect(removed).toBe(2);
		});

		it('should not remove rows with content', () => {
			const grid = new Grid([
				['A', null],
				[null, 'B'],
				[null, null]
			]);

			const removed = grid.trimGrid();

			expect(grid.cells).toEqual([
				['A', null],
				[null, 'B']
			]);
			expect(removed).toBe(1);
		});

		it('should keep at least one row', () => {
			const grid = new Grid([
				[null, null],
				[null, null]
			]);

			const removed = grid.trimGrid();

			expect(grid.cells).toEqual([[null, null]]);
			expect(removed).toBe(1);
		});

		it('should do nothing if no empty rows', () => {
			const grid = new Grid([
				['A', 'B'],
				['C', null]
			]);

			const removed = grid.trimGrid();

			expect(grid.cells).toEqual([
				['A', 'B'],
				['C', null]
			]);
			expect(removed).toBe(0);
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

	describe('clearRegion', () => {
		it('should clear a specified region', () => {
			const grid = new Grid([
				['A', 'A', 'B'],
				['A', 'A', 'B'],
				['C', 'C', 'B']
			]);

			grid.clearRegion({
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 2 }
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
					dimension: { cols: 2, rows: 2 }
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

	describe('getBoundingRegion', () => {
		it('should return null for empty regions array', () => {
			const grid = new Grid();
			expect(grid.getBoundingRegion([])).toBeNull();
		});

		it('should return the same region for single region input', () => {
			const grid = new Grid();
			const region = {
				start: { row: 1, col: 1 },
				dimension: { cols: 2, rows: 2 }
			};
			expect(grid.getBoundingRegion([region])).toEqual(region);
		});

		it('should return correct bounding region for multiple regions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } },
				{ start: { row: 1, col: 1 }, dimension: { cols: 2, rows: 2 } }
			];

			expect(grid.getBoundingRegion(regions)).toEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 3, rows: 3 }
			});
		});

		it('should handle overlapping regions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 3 } },
				{ start: { row: 1, col: 1 }, dimension: { cols: 3, rows: 3 } }
			];

			expect(grid.getBoundingRegion(regions)).toEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 4, rows: 4 }
			});
		});
	});

	describe('overrideMove', () => {
		it('should move content to a new region', () => {
			const grid = new Grid([
				['A', 'A', null],
				[null, null, null],
				[null, null, null]
			]);

			const result = grid.overrideMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 1 }
				},
				{ row: 1, col: 0 }
			);

			expect(result).toBe(true);
			expect(grid.cells).toEqual([
				[null, null, null],
				['A', 'A', null],
				[null, null, null]
			]);
		});

		it('should override existing content in target region', () => {
			const grid = new Grid([
				['A', 'A', null],
				['B', 'B', null],
				[null, null, null]
			]);

			const result = grid.overrideMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 1 }
				},
				{ row: 1, col: 0 }
			);

			expect(result).toBe(true);
			expect(grid.cells).toEqual([
				[null, null, null],
				['A', 'A', null],
				[null, null, null]
			]);
		});

		it('should not override existing content in target region if override is false', () => {
			const grid = new Grid([
				['A', 'A', null],
				['B', 'B', null],
				[null, null, null]
			]);

			const result = grid.overrideMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 1 }
				},
				{ row: 1, col: 0 },
				{ override: false }
			);

			expect(result).toBe(false);
			expect(grid.cells).toEqual([
				['A', 'A', null],
				['B', 'B', null],
				[null, null, null]
			]);
		});
	});

	describe('cascadeMove', () => {
		it('should move 1x1 region in east direction and swap with 1x1 region', () => {
			const grid = new Grid([
				['A', 'B', 'C'],
				['D', 'E', 'F'],
				['G', 'H', 'I']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 1 }
				},
				{ row: 0, col: 1 }
			);

			expect(grid.cells).toEqual([
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
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'D', 'E'],
				['F', 'G', 'H']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 0, col: 1 }
			);

			expect(grid.cells).toEqual([
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
			const grid = new Grid([
				['A', 'B', 'B'],
				['A', 'B', 'B'],
				['C', 'D', 'E']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 0, col: 2 }
			);

			expect(grid.cells).toEqual([
				['B', 'B', 'A'],
				['B', 'B', 'A'],
				['C', 'D', 'E']
			]);
			expect(result).toEqual([
				{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } },
				{ id: 'A', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } }
			]);
		});

		it('should move 1x2 region in east direction and trigger cascade', () => {
			const grid = new Grid([
				['A', 'B', 'B'],
				['A', 'B', 'B'],
				['C', 'D', 'E']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 0, col: 1 }
			);

			expect(grid.cells).toEqual([
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

		it('should move 1x2 region in south direction and swap with 1x1 region', () => {
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'D', 'E'],
				['F', 'G', 'H']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 1, col: 0 }
			);

			expect(grid.cells).toEqual([
				['F', 'B', 'C'],
				['A', 'D', 'E'],
				['A', 'G', 'H']
			]);
			expect(result).toEqual([
				{ id: 'F', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: 'A', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 2 } }
			]);
		});

		it('should move 1x2 region in north direction and swap with 1x1 region', () => {
			const grid = new Grid([
				['F', 'B', 'C'],
				['A', 'D', 'E'],
				['A', 'G', 'H']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 1, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 0, col: 0 }
			);

			expect(grid.cells).toEqual([
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
			const grid = new Grid([
				['A', null],
				[null, null]
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 1 }
				},
				{ row: 4, col: 0 }
			);

			expect(grid.cells).toEqual([
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

		it('should not move region out of bounds in east direction', () => {
			const grid = new Grid([
				['A', null],
				[null, null]
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 1 }
				},
				{ row: 0, col: 4 }
			);

			expect(grid.cells).toEqual([
				['A', null],
				[null, null]
			]);
			expect(result).toEqual([]);
		});

		it('[1] should move 1x2 region in south east direction and trigger cascade', () => {
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'D', 'E'],
				['F', 'G', 'H']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 1, col: 1 }
			);

			// expect(grid.cells).toEqual([
			// 	['F', 'B', 'C'],
			// 	[null, 'A', 'E'],
			// 	[null, 'A', 'H'],
			// 	[null, 'D', null],
			// 	[null, 'G', null]
			// ]);
			expect(grid.cells).toEqual([
				['D', 'B', 'C'],
				['F', 'A', 'E'],
				[null, 'A', 'H'],
				[null, 'G', null]
			]);
			expect(result).toEqual([
				{ id: 'D', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: 'G', start: { row: 3, col: 1 }, dimension: { cols: 1, rows: 1 } },
				{ id: 'A', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 2 } },
				{ id: 'F', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }
			]);
		});

		it('[2] should move 1x2 region in south east direction and trigger cascade', () => {
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'D', 'E'],
				['F', 'G', 'H']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 2, col: 1 }
			);

			expect(grid.cells).toEqual([
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
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'B', 'D'],
				['E', 'F', 'G']
			]);

			const result = grid.cascadeMove(
				{
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{ row: 1, col: 1 }
			);

			expect(grid.cells).toEqual([
				['B', 'F', 'C'],
				['B', 'A', 'D'],
				['E', 'A', 'G']
			]);
			expect(result).toEqual([
				{ id: 'B', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } },
				{ id: 'F', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
				{ id: 'A', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 2 } }
			]);
		});
	});

	describe('areRegionsAdjacent', () => {
		const grid = new Grid();

		it('should detect orthogonal adjacency (maxGap = 0)', () => {
			const center = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

			const orthogonalNeighbors = [
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }, // North
				{ start: { row: 2, col: 1 }, dimension: { cols: 1, rows: 1 } }, // South
				{ start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }, // West
				{ start: { row: 1, col: 2 }, dimension: { cols: 1, rows: 1 } } // East
			];

			orthogonalNeighbors.forEach((neighbor) => {
				expect(grid.areRegionsAdjacent(center, neighbor)).toBe(true);
				expect(grid.areRegionsAdjacent(neighbor, center)).toBe(true);
			});
		});

		it('should detect diagonal adjacency (maxGap = 0)', () => {
			const center = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

			const diagonalNeighbors = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }, // NW
				{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }, // NE
				{ start: { row: 2, col: 0 }, dimension: { cols: 1, rows: 1 } }, // SW
				{ start: { row: 2, col: 2 }, dimension: { cols: 1, rows: 1 } } // SE
			];

			diagonalNeighbors.forEach((neighbor) => {
				expect(grid.areRegionsAdjacent(center, neighbor, { includeDiagonal: true })).toBe(true);
				expect(grid.areRegionsAdjacent(center, neighbor, { includeDiagonal: false })).toBe(false);
				expect(grid.areRegionsAdjacent(neighbor, center, { includeDiagonal: true })).toBe(true);
				expect(grid.areRegionsAdjacent(neighbor, center, { includeDiagonal: false })).toBe(false);
			});
		});

		it('should detect orthogonal adjacency with gap (maxGap = 5)', () => {
			const center = { start: { row: 6, col: 6 }, dimension: { cols: 1, rows: 1 } };

			const orthogonalNeighborsWithGap = [
				{ start: { row: 0, col: 6 }, dimension: { cols: 1, rows: 1 } }, // North (gap of 5)
				{ start: { row: 12, col: 6 }, dimension: { cols: 1, rows: 1 } }, // South (gap of 5)
				{ start: { row: 6, col: 0 }, dimension: { cols: 1, rows: 1 } }, // West (gap of 5)
				{ start: { row: 6, col: 12 }, dimension: { cols: 1, rows: 1 } } // East (gap of 5)
			];

			orthogonalNeighborsWithGap.forEach((neighbor) => {
				expect(grid.areRegionsAdjacent(center, neighbor, { maxGap: 5 })).toBe(true);
				expect(grid.areRegionsAdjacent(center, neighbor)).toBe(false);
				expect(grid.areRegionsAdjacent(neighbor, center, { maxGap: 5 })).toBe(true);
				expect(grid.areRegionsAdjacent(neighbor, center)).toBe(false);
			});
		});

		it('should detect diagonal adjacency with gap (maxGap = 5)', () => {
			const center = { start: { row: 6, col: 6 }, dimension: { cols: 1, rows: 1 } };

			const diagonalNeighborsWithGap = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }, // NW (gap of 5)
				{ start: { row: 0, col: 12 }, dimension: { cols: 1, rows: 1 } }, // NE (gap of 5)
				{ start: { row: 12, col: 0 }, dimension: { cols: 1, rows: 1 } }, // SW (gap of 5)
				{ start: { row: 12, col: 12 }, dimension: { cols: 1, rows: 1 } } // SE (gap of 5)
			];

			diagonalNeighborsWithGap.forEach((neighbor) => {
				expect(
					grid.areRegionsAdjacent(center, neighbor, { maxGap: 5, includeDiagonal: true })
				).toBe(true);
				expect(grid.areRegionsAdjacent(center, neighbor, { includeDiagonal: true })).toBe(false);
				expect(
					grid.areRegionsAdjacent(center, neighbor, { maxGap: 5, includeDiagonal: false })
				).toBe(false);
				expect(
					grid.areRegionsAdjacent(neighbor, center, { maxGap: 5, includeDiagonal: true })
				).toBe(true);
				expect(grid.areRegionsAdjacent(neighbor, center, { includeDiagonal: true })).toBe(false);
				expect(
					grid.areRegionsAdjacent(neighbor, center, { maxGap: 5, includeDiagonal: false })
				).toBe(false);
			});
		});

		it('should detect non-adjacency when regions are too far apart', () => {
			const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };
			const region2 = { start: { row: 2, col: 2 }, dimension: { cols: 1, rows: 1 } };

			expect(grid.areRegionsAdjacent(region1, region2)).toBe(false);
			expect(grid.areRegionsAdjacent(region2, region1)).toBe(false);
		});

		it('should handle overlapping regions', () => {
			const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
			const region2 = { start: { row: 1, col: 1 }, dimension: { cols: 2, rows: 2 } };

			expect(grid.areRegionsAdjacent(region1, region2)).toBe(true);
			expect(grid.areRegionsAdjacent(region2, region1)).toBe(true);
		});

		it('should handle regions of different sizes', () => {
			const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } };
			const region2 = { start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } };

			expect(grid.areRegionsAdjacent(region1, region2, { includeDiagonal: true })).toBe(true);
			expect(grid.areRegionsAdjacent(region1, region2, { includeDiagonal: false })).toBe(true);
			expect(grid.areRegionsAdjacent(region2, region1, { includeDiagonal: true })).toBe(true);
			expect(grid.areRegionsAdjacent(region2, region1, { includeDiagonal: false })).toBe(true);
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
					dimension: { cols: 2, rows: 2 }
				},
				{
					start: { row: 0, col: 2 },
					dimension: { cols: 1, rows: 3 }
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

	describe('getRegions', () => {
		it('should handle empty grid', () => {
			const grid = new Grid([]);
			expect(grid.getRegions()).toEqual([]);

			const grid2 = new Grid([[], []]);
			expect(grid2.getRegions()).toEqual([]);
		});

		it('should detect single cell regions with their ids', () => {
			const grid = new Grid([
				['1', '2'],
				['3', '4']
			]);

			expect(grid.getRegions()).toEqual([
				{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: '2', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
				{ id: '3', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: '4', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } }
			]);
		});

		it('should detect rectangular regions with same id', () => {
			const grid = new Grid([
				['1', '1'],
				['1', '1']
			]);

			expect(grid.getRegions()).toEqual([
				{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } }
			]);
		});

		it('should detect multiple rectangular regions with different ids', () => {
			const grid = new Grid([
				['1', '1', '2'],
				['1', '1', '2'],
				['3', '3', '2']
			]);

			expect(grid.getRegions()).toEqual([
				{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } },
				{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 3 } },
				{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 2, rows: 1 } }
			]);
		});

		it('should handle null cells', () => {
			const grid = new Grid([
				['1', null],
				['2', '2']
			]);

			expect(grid.getRegions()).toEqual([
				{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: '2', start: { row: 1, col: 0 }, dimension: { cols: 2, rows: 1 } }
			]);
		});

		it('should handle irregular shapes by finding largest rectangles', () => {
			const grid = new Grid([
				['1', '1', '2'],
				['1', '2', '2'],
				['3', '3', '3']
			]);

			expect(grid.getRegions()).toEqual([
				{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } },
				{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } },
				{ id: '1', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ id: '2', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } },
				{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 3, rows: 1 } }
			]);
		});

		it('should compute regions strictly within range', () => {
			const grid = new Grid([
				['1', '1', '2', '4'],
				['1', '1', '2', '4'],
				['3', '3', '2', '4']
			]);

			const range: TGridRange = {
				start: { row: 0, col: 2 },
				end: { row: 2, col: 4 }
			};

			expect(grid.getRegions(range)).toEqual([
				{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } },
				{ id: '4', start: { row: 0, col: 3 }, dimension: { cols: 1, rows: 2 } }
			]);
		});

		it('should handle range at grid boundaries', () => {
			const grid = new Grid([
				['1', '1', '2'],
				['1', '1', '2'],
				['3', '3', '2']
			]);

			const range: TGridRange = {
				start: { row: 2, col: 0 },
				end: { row: 3, col: 2 }
			};

			expect(grid.getRegions(range)).toEqual([
				{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 2, rows: 1 } }
			]);
		});
	});

	describe('findRegion', () => {
		it('should use default isValidCell to match id at position', () => {
			const grid = new Grid([
				['A', 'A', 'B'],
				['A', 'A', 'B'],
				['C', 'C', 'B']
			]);

			const region = grid.findRegion({ row: 0, col: 0 });

			expect(region).toEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 2 }
			});
		});

		it('should use custom isValidCell when provided', () => {
			const grid = new Grid([
				['1', '2', '3'],
				['4', '5', '6']
			]);

			const region = grid.findRegion(
				{
					row: 0,
					col: 0
				},
				{
					isValidCell: (_, __) => true
				}
			);

			expect(region).toEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 3, rows: 2 }
			});
		});

		describe('direction controls', () => {
			const grid = new Grid([
				['X', 'X', 'X'],
				['X', 'X', 'X'],
				['X', 'X', 'X']
			]);

			it('should expand in all directions by default', () => {
				const region = grid.findRegion({ row: 1, col: 1 });

				expect(region).toEqual({
					start: { row: 0, col: 0 },
					dimension: { cols: 3, rows: 3 }
				});
			});

			it('should not expand when all directions are false', () => {
				const region = grid.findRegion(
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

				expect(region).toEqual({
					start: { row: 1, col: 1 },
					dimension: { cols: 1, rows: 1 }
				});
			});

			it('should respect individual direction controls', () => {
				// Test each direction individually
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
					const region = grid.findRegion(position, {
						directions: {
							up: false,
							down: false,
							left: false,
							right: false,
							[direction]: true
						}
					});

					expect(region).toEqual(expected);
				});
			});
		});

		describe('boundary handling', () => {
			it('should respect grid boundaries', () => {
				const grid = new Grid([
					['A', 'A'],
					['A', 'A']
				]);

				const region = grid.findRegion({ row: 0, col: 0 });

				expect(region).toEqual({
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 2 }
				});
			});

			it('should handle position at grid edges', () => {
				const grid = new Grid([
					['A', 'A'],
					['A', 'A']
				]);

				const region = grid.findRegion({ row: 1, col: 1 });

				expect(region).toEqual({
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 2 }
				});
			});
		});
	});

	describe('getOccupyingRegions', () => {
		it('should return empty array for empty region', () => {
			const grid = new Grid([
				['A', 'B'],
				['C', 'D']
			]);
			const region = { start: { row: 0, col: 0 }, dimension: { cols: 0, rows: 0 } };
			expect(grid.getOccupyingRegions(region)).toEqual([]);
		});

		it('should return single region when only one region occupies the space', () => {
			const grid = new Grid([
				['A', 'A'],
				['A', 'A']
			]);
			const region = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } };
			const occupying = grid.getOccupyingRegions(region);

			expect(occupying).toEqual([
				{
					id: 'A',
					start: { row: 0, col: 0 },
					dimension: { cols: 2, rows: 2 }
				}
			]);
		});

		it('should return multiple regions when space is occupied by different regions', () => {
			const grid = new Grid([
				['A', 'B', 'B'],
				['A', 'C', 'D'],
				['E', 'E', 'E']
			]);
			const region = { start: { row: 0, col: 1 }, dimension: { cols: 2, rows: 2 } };
			const occupying = grid.getOccupyingRegions(region);

			expect(occupying).toEqual([
				{
					id: 'B',
					start: { row: 0, col: 1 },
					dimension: { cols: 2, rows: 1 }
				},
				{
					id: 'C',
					start: { row: 1, col: 1 },
					dimension: { cols: 1, rows: 1 }
				},
				{
					id: 'D',
					start: { row: 1, col: 2 },
					dimension: { cols: 1, rows: 1 }
				}
			]);
		});

		it('should handle regions at grid boundaries', () => {
			const grid = new Grid([
				['A', 'B', 'C'],
				['A', 'B', 'C']
			]);
			const region = { start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } };
			const occupying = grid.getOccupyingRegions(region);

			expect(occupying).toEqual([
				{
					id: 'C',
					start: { row: 0, col: 2 },
					dimension: { cols: 1, rows: 2 }
				}
			]);
		});

		it('should handle null cells', () => {
			const grid = new Grid([
				['A', null, 'B'],
				['A', 'C', 'B']
			]);
			const region = { start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 1 } };
			const occupying = grid.getOccupyingRegions(region);

			expect(occupying).toEqual([
				{
					id: 'A',
					start: { row: 0, col: 0 },
					dimension: { cols: 1, rows: 2 }
				},
				{
					id: 'B',
					start: { row: 0, col: 2 },
					dimension: { cols: 1, rows: 2 }
				}
			]);
		});
	});

	describe('getComplementaryRegions', () => {
		it('should return empty array when regions are the same size', () => {
			const grid = new Grid();
			const region = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
			expect(grid.getComplementaryRegions(region, region)).toEqual([]);
		});

		it('should return all surrounding regions for centered placement', () => {
			const grid = new Grid();
			const container = { start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 3 } };
			const cutout = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

			const complementary = grid.getComplementaryRegions(container, cutout);

			// [
			//   [Y, Y, Y], // Container (Y)
			//   [Y, X, Y], // Cutout (X)
			//   [Y, Y, Y]
			// ]
			// [
			//   [A, A, A], // Top region (A)
			//   [B, X, C], // Left (B), Cutout (X), Right (C)
			//   [D, D, D]  // Bottom region (D)
			// ]
			expect(complementary).toHaveLength(4); // top, left, right, bottom
			expect(complementary).toContainEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 3, rows: 1 }
			}); // top (A)
			expect(complementary).toContainEqual({
				start: { row: 1, col: 0 },
				dimension: { cols: 1, rows: 1 }
			}); // left (B)
			expect(complementary).toContainEqual({
				start: { row: 1, col: 2 },
				dimension: { cols: 1, rows: 1 }
			}); // right (C)
			expect(complementary).toContainEqual({
				start: { row: 2, col: 0 },
				dimension: { cols: 3, rows: 1 }
			}); // bottom (D)
		});

		it('should handle placement at edges', () => {
			const grid = new Grid();
			const container = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
			const cutout = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };

			const complementary = grid.getComplementaryRegions(container, cutout);

			expect(complementary).toHaveLength(2); // right and bottom only
			expect(complementary).toContainEqual({
				start: { row: 0, col: 1 },
				dimension: { cols: 1, rows: 1 }
			}); // right
			expect(complementary).toContainEqual({
				start: { row: 1, col: 0 },
				dimension: { cols: 2, rows: 1 }
			}); // bottom
		});

		it('should return container region when regions do not overlap', () => {
			const grid = new Grid();
			const container = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
			const cutout = { start: { row: 3, col: 3 }, dimension: { cols: 1, rows: 1 } };

			const complementary = grid.getComplementaryRegions(container, cutout);

			// When regions don't overlap, the entire container is available space
			expect(complementary).toEqual([container]);
		});
	});

	describe('mergeAdjacentRegions', () => {
		it('should return empty array for empty input', () => {
			const grid = new Grid();
			expect(grid.mergeAdjacentRegions([])).toEqual([]);
		});

		it('should return same region for single region input', () => {
			const grid = new Grid();
			const region = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };
			expect(grid.mergeAdjacentRegions([region])).toEqual([region]);
		});

		it('should merge horizontally adjacent regions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
			];
			expect(grid.mergeAdjacentRegions(regions)).toEqual([
				{ start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } }
			]);
		});

		it('should merge vertically adjacent regions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }
			];
			expect(grid.mergeAdjacentRegions(regions)).toEqual([
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } }
			]);
		});

		it('should merge multiple regions in sequence', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }
			];
			expect(grid.mergeAdjacentRegions(regions)).toEqual([
				{ start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 1 } }
			]);
		});

		it('should not merge non-adjacent regions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }
			];
			expect(grid.mergeAdjacentRegions(regions)).toEqual(regions);
		});

		it('should not merge regions with different dimensions', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 2 } }
			];
			expect(grid.mergeAdjacentRegions(regions)).toEqual(regions);
		});

		it('should not mutate input array by default', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
			];
			const originalRegions = [...regions];

			grid.mergeAdjacentRegions(regions);
			expect(regions).toEqual(originalRegions);
		});

		it('should mutate input array when mutate option is true', () => {
			const grid = new Grid();
			const regions = [
				{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
				{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }
			];

			const result = grid.mergeAdjacentRegions(regions, { mutate: true });
			expect(result).toBe(regions); // Same array reference
			expect(regions).toHaveLength(1); // Array was mutated
			expect(regions[0]).toEqual({
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			});
		});
	});

	describe('getFreeRegions', () => {
		it('should return empty array for region with no empty cells', () => {
			const grid = new Grid([
				['A', 'A'],
				['B', 'B']
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 2 } };
			expect(grid.getFreeRegions(region)).toEqual([]);
		});

		it('should merge adjacent empty regions vertically', () => {
			const grid = new Grid([
				['A', null],
				['B', null]
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 2 } };
			expect(grid.getFreeRegions(region)).toEqual([
				{ start: { row: 0, col: 1 }, dimension: { rows: 2, cols: 1 } }
			]);
		});

		it('should merge adjacent empty regions horizontally', () => {
			const grid = new Grid([
				['A', null, null],
				['B', 'B', 'B']
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } };
			expect(grid.getFreeRegions(region)).toEqual([
				{ start: { row: 0, col: 1 }, dimension: { rows: 1, cols: 2 } }
			]);
		});

		it('should return multiple regions for non-adjacent empty cells', () => {
			const grid = new Grid([
				['A', null, 'B'],
				['C', 'D', null]
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } };
			expect(grid.getFreeRegions(region)).toEqual([
				{ start: { row: 0, col: 1 }, dimension: { rows: 1, cols: 1 } },
				{ start: { row: 1, col: 2 }, dimension: { rows: 1, cols: 1 } }
			]);
		});

		it('should handle region bounds within grid', () => {
			const grid = new Grid([
				['A', null, 'B'],
				[null, null, 'B'],
				['C', 'C', 'C']
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 2 } };
			expect(grid.getFreeRegions(region)).toEqual([
				{ start: { row: 0, col: 1 }, dimension: { rows: 2, cols: 1 } },
				{ start: { row: 1, col: 0 }, dimension: { rows: 1, cols: 1 } }
			]);
		});

		it('should return entire region if all cells are empty', () => {
			const grid = new Grid([
				[null, null],
				[null, null]
			]);

			const region = { start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 2 } };
			expect(grid.getFreeRegions(region)).toEqual([
				{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 2 } }
			]);
		});
	});
});
