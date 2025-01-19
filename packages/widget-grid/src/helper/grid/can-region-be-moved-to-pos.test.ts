import { describe, expect, it } from 'vitest';
import { canRegionBeMovedToPos } from './can-region-be-moved-to-pos';
import { TGridCells } from './types';

describe('canRegionBeMovedToPos', () => {
	it('should allow moving to empty cells within bounds', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 }
		);
		expect(result).toBe(true);
	});

	it('should not allow moving to occupied cells when override is false', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 },
			{ override: false }
		);
		expect(result).toBe(false);
	});

	it('should allow moving to occupied cells when override is true', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 1, col: 0 },
			{ override: true }
		);
		expect(result).toBe(true);
	});

	it('should block movement south when south boundary is checked', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 3, col: 0 },
			{ outOfBounds: { directionsToCheck: { south: true } } }
		);
		expect(result).toBe(false);
	});

	it('should allow movement south when south boundary is not checked', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 3, col: 0 },
			{ outOfBounds: { directionsToCheck: { north: true, east: true, west: true, south: false } } }
		);
		expect(result).toBe(true);
	});

	it('should respect both override and directional bounds', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		];
		const result = canRegionBeMovedToPos(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{ row: 3, col: 0 },
			{
				override: false,
				outOfBounds: { directionsToCheck: { south: true } }
			}
		);
		expect(result).toBe(false);
	});
});
