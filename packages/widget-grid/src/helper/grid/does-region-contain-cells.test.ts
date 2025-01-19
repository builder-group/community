import { describe, expect, it } from 'vitest';
import { doesRegionContainCells } from './does-region-contain-cells';
import { TGridCells } from './types';

describe('doesRegionContainCells', () => {
	it('should return true when region contains all specified cells', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', 'B', 'D']
			)
		).toBe(true);
	});

	it('should return false when region does not contain all specified cells', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', 'X']
			)
		).toBe(false);
	});

	it('should handle null cells', () => {
		const cells: TGridCells<string> = [
			['A', null, 'B'],
			[null, 'C', null]
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', null]
			)
		).toBe(true);
	});

	it('should handle regions with offset starting position', () => {
		const cells: TGridCells<string> = [
			['X', 'X', 'X'],
			['X', 'A', 'B'],
			['X', 'C', 'D']
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 1, col: 1 },
					dimension: { rows: 2, cols: 2 }
				},
				['A', 'D']
			)
		).toBe(true);
	});

	it('should handle empty search array', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 2, cols: 2 }
				},
				[]
			)
		).toBe(true);
	});

	it('should handle empty regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];

		expect(
			doesRegionContainCells(
				cells,
				{
					start: { row: 0, col: 0 },
					dimension: { rows: 0, cols: 0 }
				},
				['A']
			)
		).toBe(false);
	});
});
