import { describe, expect, it } from 'vitest';
import { pushRegions } from './push-regions';
import { TGridCells } from './types';

describe('pushRegions', () => {
	it('should push all regions in affected columns when pushing south', () => {
		const cells: TGridCells<string> = [
			['A', 'A', 'C'],
			['B', 'D', 'C'],
			['E', 'F', 'C']
		];

		const result = pushRegions(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			},
			{
				direction: 'South',
				distance: 1
			}
		);

		expect(cells).toEqual([
			[null, null, 'C'],
			['A', 'A', 'C'],
			['B', 'D', 'C'],
			['E', 'F', null]
		]);
		console.log(result.length);
		expect(result).toEqual([
			{
				id: 'E',
				start: { row: 3, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'F',
				start: { row: 3, col: 1 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'B',
				start: { row: 2, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'D',
				start: { row: 2, col: 1 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'A',
				start: { row: 1, col: 0 },
				dimension: { cols: 2, rows: 1 }
			}
		]);
	});

	it('should handle cascading pushes with spanning regions', () => {
		const cells: TGridCells<string> = [
			['A', 'A', 'X'],
			['B', 'D', 'D'],
			['E', 'F', 'C']
		];

		const result = pushRegions(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			},
			{
				direction: 'South',
				distance: 1
			}
		);

		expect(cells).toEqual([
			[null, null, 'X'],
			['A', 'A', null],
			['B', 'D', 'D'],
			['E', 'F', 'C']
		]);
		expect(result).toEqual([
			{
				id: 'E',
				start: { row: 3, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'F',
				start: { row: 3, col: 1 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'C',
				start: { row: 3, col: 2 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'B',
				start: { row: 2, col: 0 },
				dimension: { cols: 1, rows: 1 }
			},
			{
				id: 'D',
				start: { row: 2, col: 1 },
				dimension: { cols: 2, rows: 1 }
			},
			{
				id: 'A',
				start: { row: 1, col: 0 },
				dimension: { cols: 2, rows: 1 }
			}
		]);
	});

	it('should expand grid when pushing south beyond bounds', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null]
		];

		const result = pushRegions(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			},
			{
				direction: 'South',
				distance: 2,
				allowOutOfBounds: { south: true }
			}
		);

		expect(cells).toEqual([
			[null, null, null],
			[null, null, null],
			['A', 'A', null],
			['B', 'B', null]
		]);
		expect(result).toEqual([
			{
				id: 'B',
				start: { row: 3, col: 0 },
				dimension: { cols: 2, rows: 1 }
			},
			{
				id: 'A',
				start: { row: 2, col: 0 },
				dimension: { cols: 2, rows: 1 }
			}
		]);
	});

	it('should not push if out of bounds and not allowed', () => {
		const cells: TGridCells<string> = [
			['A', 'A', null],
			['B', 'B', null]
		];

		const result = pushRegions(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 2 }
			},
			{
				direction: 'South',
				distance: 2,
				allowOutOfBounds: { south: false }
			}
		);

		expect(cells).toEqual([
			['A', 'A', null],
			['B', 'B', null]
		]);
		expect(result).toEqual([]);
	});
});
