import { describe, expect, it } from 'vitest';
import { getOccupyingRegions } from './get-occupying-regions';
import { TGridCells } from './types';

describe('getOccupyingRegions', () => {
	it('should return empty array for empty region', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];
		const region = { start: { row: 0, col: 0 }, dimension: { cols: 0, rows: 0 } };

		const result = getOccupyingRegions(cells, region);

		expect(result).toEqual([]);
	});

	it('should return single region when only one region occupies the space', () => {
		const cells: TGridCells<string> = [
			['A', 'A'],
			['A', 'A']
		];
		const region = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } };

		const result = getOccupyingRegions(cells, region);

		expect(result).toEqual([
			{
				id: 'A',
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 2 }
			}
		]);
	});

	it('should return multiple regions when space is occupied by different regions', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'B'],
			['A', 'C', 'D'],
			['E', 'E', 'E']
		];
		const region = { start: { row: 0, col: 1 }, dimension: { cols: 2, rows: 2 } };

		const result = getOccupyingRegions(cells, region);

		expect(result).toEqual([
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
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['A', 'B', 'C']
		];
		const region = { start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } };

		const result = getOccupyingRegions(cells, region);

		expect(result).toEqual([
			{
				id: 'C',
				start: { row: 0, col: 2 },
				dimension: { cols: 1, rows: 2 }
			}
		]);
	});

	it('should handle null cells', () => {
		const cells: TGridCells<string> = [
			['A', null, 'B'],
			['A', 'C', 'B']
		];
		const region = { start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 1 } };

		const result = getOccupyingRegions(cells, region);

		expect(result).toEqual([
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
