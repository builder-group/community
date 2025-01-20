import { describe, expect, it } from 'vitest';
import { bubbleRegionsUp } from './bubble-regions-up';
import { TGridCells } from './types';

describe('bubbleRegionsUp', () => {
	it('should move regions upward into empty spaces', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, null, null],
			['A', 'A', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'A',
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			}
		]);
	});

	it('should handle multiple regions moving up', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			['A', null, 'B'],
			[null, null, 'B']
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', null, 'B'],
			[null, null, 'B'],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'A',
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				id: 'B',
				start: { row: 0, col: 2 },
				dimension: { rows: 2, cols: 1 }
			}
		]);
	});

	it('should not move regions if there is no space above', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null],
			['C', 'C', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', 'A', null],
			['B', 'B', null],
			['C', 'C', null]
		]);
		expect(result).toEqual([]);
	});

	it('should handle regions that can move multiple rows up', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, null, null],
			['A', 'A', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', 'A', null],
			[null, null, null],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'A',
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			}
		]);
	});

	it('should handle staggered movements', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			['A', null, null],
			[null, 'B', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', 'B', null],
			[null, null, null],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'A',
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				id: 'B',
				start: { row: 0, col: 1 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});

	it('should not move regions at row 0', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			[null, null, null],
			['B', 'B', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			['A', 'A', null],
			['B', 'B', null],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'B',
				start: { row: 1, col: 0 },
				dimension: { rows: 1, cols: 2 }
			}
		]);
	});

	it('should handle empty grid', () => {
		const cells: TGridCells<string> = [
			[null, null],
			[null, null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			[null, null],
			[null, null]
		]);
		expect(result).toEqual([]);
	});

	it('should maintain region shapes while moving', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, 'B', 'B'],
			['A', 'A', null],
			['A', 'A', null]
		];

		const result = bubbleRegionsUp(cells);

		expect(cells).toEqual([
			[null, 'B', 'B'],
			['A', 'A', null],
			['A', 'A', null],
			[null, null, null]
		]);
		expect(result).toEqual([
			{
				id: 'B',
				start: { row: 0, col: 1 },
				dimension: { rows: 1, cols: 2 }
			},
			{
				id: 'A',
				start: { row: 1, col: 0 },
				dimension: { rows: 2, cols: 2 }
			}
		]);
	});

	it('should bubble up regions respecting fixed regions', () => {
		const cells: TGridCells<string> = [
			[null, null, null],
			[null, 'B', null],
			['A', 'A', 'C']
		];

		const result = bubbleRegionsUp(cells, {
			fixedRegionIds: new Set(['B'])
		});

		expect(cells).toEqual([
			[null, null, 'C'],
			[null, 'B', null],
			['A', 'A', null]
		]);

		expect(result).toEqual([
			{
				id: 'C',
				start: { row: 0, col: 2 },
				dimension: { rows: 1, cols: 1 }
			}
		]);
	});
});
