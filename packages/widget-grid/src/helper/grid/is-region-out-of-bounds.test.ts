import { describe, expect, it } from 'vitest';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
import { TGridCells } from './types';

describe('isRegionOutOfBounds', () => {
	it('should return true if region exceeds grid boundaries to the north', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(cells, {
			start: { row: -1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should return true if region exceeds grid boundaries to the east', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(cells, {
			start: { row: 1, col: 2 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should return true if region exceeds grid boundaries to the south', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(cells, {
			start: { row: 2, col: 1 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should return true if region exceeds grid boundaries to the west', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(cells, {
			start: { row: 1, col: -1 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(true);
	});

	it('should return false if region is completely within grid boundaries', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(cells, {
			start: { row: 1, col: 1 },
			dimension: { rows: 2, cols: 2 }
		});

		expect(result).toBe(false);
	});

	it('should respect the options to disable boundary checks', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(
			cells,
			{
				start: { row: -1, col: -1 },
				dimension: { rows: 2, cols: 2 }
			},
			{ directionsToCheck: { north: false, west: false } }
		);

		expect(result).toBe(false);
	});

	it('should return true if all boundary checks are enabled and region exceeds any boundary', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const result = isRegionOutOfBounds(
			cells,
			{
				start: { row: -1, col: -1 },
				dimension: { rows: 2, cols: 2 }
			},
			{ directionsToCheck: { north: true, west: true } }
		);

		expect(result).toBe(true);
	});
});
