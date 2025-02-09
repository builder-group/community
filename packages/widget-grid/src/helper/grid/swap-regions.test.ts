import { describe, expect, it } from 'vitest';
import { swapRegions } from './swap-regions';
import { TGridCells } from './types';

describe('swapRegions', () => {
	it('should swap two simple 1x1 regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 0 }, dimension: { rows: 1, cols: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { rows: 1, cols: 1 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['B', 'A', 'C'],
			['D', 'E', 'F']
		]);
	});

	it('should swap regions containing different sized elements', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'D', 'E']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 1 } },
			{ start: { row: 0, col: 1 }, dimension: { rows: 2, cols: 1 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['B', 'A', 'C'],
			['D', 'A', 'E']
		]);
	});

	it('should handle horizontal swaps (west -> east)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'B', 'B'],
			['F', 'G', 'H']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 1 } },
			{ start: { row: 0, col: 2 }, dimension: { rows: 2, cols: 2 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['B', 'B', 'A'],
			['B', 'B', 'A'],
			['F', 'G', 'H']
		]);
	});

	it('should handle horizontal swaps (east -> west)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'B', 'B'],
			['F', 'G', 'H']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 2 }, dimension: { rows: 2, cols: 2 } },
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 1 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['B', 'B', 'A'],
			['B', 'B', 'A'],
			['F', 'G', 'H']
		]);
	});

	it('should handle vertical swaps (north -> south)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['D', 'E', 'F']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } },
			{ start: { row: 2, col: 0 }, dimension: { rows: 2, cols: 3 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['D', 'E', 'F'],
			['D', 'E', 'F'],
			['A', 'B', 'C'],
			['A', 'B', 'C']
		]);
	});

	it('should handle vertical swaps (south -> north)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['D', 'E', 'F']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 2, col: 0 }, dimension: { rows: 2, cols: 3 } },
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['D', 'E', 'F'],
			['D', 'E', 'F'],
			['A', 'B', 'C'],
			['A', 'B', 'C']
		]);
	});

	it('should handle more complex swaps (west -> east)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B', 'C'],
			['A', 'D', 'E', 'C'],
			['F', 'G', 'H', 'I']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } },
			{ start: { row: 0, col: 3 }, dimension: { rows: 2, cols: 1 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['C', 'A', 'B', 'B'],
			['C', 'A', 'D', 'E'],
			['F', 'G', 'H', 'I']
		]);
	});

	it('should handle more complex swaps (east -> west)', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B', 'C'],
			['A', 'D', 'E', 'C'],
			['F', 'G', 'H', 'I']
		];

		const result = swapRegions(
			cells,
			{ start: { row: 0, col: 3 }, dimension: { rows: 2, cols: 1 } },
			{ start: { row: 0, col: 0 }, dimension: { rows: 2, cols: 3 } }
		);

		expect(result).toBe(true);
		expect(cells).toEqual([
			['C', 'A', 'B', 'B'],
			['C', 'A', 'D', 'E'],
			['F', 'G', 'H', 'I']
		]);
	});
});
