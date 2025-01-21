import { describe, expect, it } from 'vitest';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
import { TGridCells } from './types';

describe('isRegionOutOfBounds', () => {
	it('should return true for regions exceeding grid boundaries in any direction', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const testCases = [
			{
				name: 'north',
				region: { start: { row: -1, col: 1 }, dimension: { rows: 2, cols: 2 } }
			},
			{
				name: 'east',
				region: { start: { row: 1, col: 2 }, dimension: { rows: 2, cols: 2 } }
			},
			{
				name: 'south',
				region: { start: { row: 2, col: 1 }, dimension: { rows: 2, cols: 2 } }
			},
			{
				name: 'west',
				region: { start: { row: 1, col: -1 }, dimension: { rows: 2, cols: 2 } }
			}
		];

		testCases.forEach(({ name, region }) => {
			const result = isRegionOutOfBounds(cells, region);
			expect(result, `Region exceeding ${name} boundary should be out of bounds`).toBe(true);
		});
	});

	it('should return true if region is partially out of bounds', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		const testCases = [
			{
				name: 'partially out north-east',
				region: { start: { row: -1, col: 1 }, dimension: { rows: 3, cols: 3 } }
			},
			{
				name: 'partially out south-west',
				region: { start: { row: 1, col: -1 }, dimension: { rows: 3, cols: 3 } }
			},
			{
				name: 'spanning beyond grid width',
				region: { start: { row: 0, col: 1 }, dimension: { rows: 2, cols: 3 } }
			},
			{
				name: 'spanning beyond grid height',
				region: { start: { row: 1, col: 0 }, dimension: { rows: 3, cols: 2 } }
			}
		];

		testCases.forEach(({ name, region }) => {
			const result = isRegionOutOfBounds(cells, region);
			expect(result, `${name} should be out of bounds`).toBe(true);
		});
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

		const testCases = [
			{
				name: 'disabled north and west checks',
				region: { start: { row: -1, col: -1 }, dimension: { rows: 2, cols: 2 } },
				options: { directionsToCheck: { north: false, west: false } },
				expected: false
			},
			{
				name: 'disabled east and south checks',
				region: { start: { row: 1, col: 1 }, dimension: { rows: 3, cols: 3 } },
				options: { directionsToCheck: { east: false, south: false } },
				expected: false
			},
			{
				name: 'only north check enabled',
				region: { start: { row: -1, col: 1 }, dimension: { rows: 2, cols: 1 } },
				options: { directionsToCheck: { north: true, east: false, south: false, west: false } },
				expected: true
			},
			{
				name: 'all checks disabled',
				region: { start: { row: -1, col: -1 }, dimension: { rows: 5, cols: 5 } },
				options: { directionsToCheck: { north: false, east: false, south: false, west: false } },
				expected: false
			},
			{
				name: 'all checks enabled',
				region: { start: { row: -1, col: -1 }, dimension: { rows: 2, cols: 2 } },
				options: { directionsToCheck: { north: true, east: true, south: true, west: true } },
				expected: true
			}
		];

		testCases.forEach(({ name, region, options, expected }) => {
			const result = isRegionOutOfBounds(cells, region, options);
			expect(result, `${name} should be ${expected}`).toBe(expected);
		});
	});
});
