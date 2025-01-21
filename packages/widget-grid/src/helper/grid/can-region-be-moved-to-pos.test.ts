import { describe, expect, it } from 'vitest';
import { canRegionBeMovedToPos } from './can-region-be-moved-to-pos';
import { TGridCells } from './types';

describe('canRegionBeMovedToPos', () => {
	it('should correctly handle moves based on boundary checks', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { cols: 2, rows: 1 }
		};

		const testCases = [
			{
				name: 'move within bounds',
				grid: [...cells],
				targetPos: { row: 2, col: 0 },
				options: { allowOutOfBounds: { north: false, east: false, south: false, west: false } },
				expected: true
			},
			{
				name: 'move out of bounds to north',
				grid: [...cells],
				targetPos: { row: -1, col: 0 },
				options: { allowOutOfBounds: { north: false } },
				expected: false
			},
			{
				name: 'move out of bounds to east',
				grid: [...cells],
				targetPos: { row: 0, col: 2 },
				options: { allowOutOfBounds: { east: false } },
				expected: false
			},
			{
				name: 'move out of bounds to south',
				grid: [...cells],
				targetPos: { row: 3, col: 0 },
				options: { allowOutOfBounds: { south: false } },
				expected: false
			},
			{
				name: 'move out of bounds to west',
				grid: [...cells],
				targetPos: { row: 0, col: -1 },
				options: { allowOutOfBounds: { west: false } },
				expected: false
			},
			{
				name: 'allow out of bounds when checks disabled',
				grid: [...cells],
				targetPos: { row: 3, col: 3 },
				options: { allowOutOfBounds: { north: true, east: true, south: true, west: true } },
				expected: true
			}
		];

		testCases.forEach(({ name, grid, targetPos, options, expected }) => {
			const result = canRegionBeMovedToPos(grid, region, targetPos, options);
			expect(result, name).toBe(expected);
		});
	});

	it('should handle cell occupation rules correctly', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];
		const region = {
			start: { row: 0, col: 0 },
			dimension: { cols: 2, rows: 1 }
		};

		const testCases = [
			{
				name: 'move to empty cells',
				grid: [...cells],
				targetPos: { row: 2, col: 0 },
				options: { override: false },
				expected: true
			},
			{
				name: 'move to occupied cells with override disabled',
				grid: [...cells],
				targetPos: { row: 1, col: 0 },
				options: { override: false },
				expected: false
			},
			{
				name: 'move to occupied cells with override enabled',
				grid: [...cells],
				targetPos: { row: 1, col: 0 },
				options: { override: true },
				expected: true
			},
			{
				name: 'move partially over occupied cells',
				grid: [
					['A', 'A', null],
					[null, 'B', null],
					[null, null, null]
				],
				targetPos: { row: 1, col: 0 },
				options: { override: false },
				expected: false
			}
		];

		testCases.forEach(({ name, grid, targetPos, options, expected }) => {
			const result = canRegionBeMovedToPos(grid, region, targetPos, options);
			expect(result, name).toBe(expected);
		});
	});
});
