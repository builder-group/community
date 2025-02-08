import { describe, expect, it } from 'vitest';
import { getCells } from './get-cells';
import { TGridRegionWithId } from './types';

describe('getCells', () => {
	it('should handle empty regions array', () => {
		const regions: TGridRegionWithId<string>[] = [];
		const result = getCells(regions);
		expect(result).toEqual([]);
	});

	it('should convert single region to grid', () => {
		const regions: TGridRegionWithId<string>[] = [
			{
				id: '1',
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			}
		];

		const result = getCells(regions);

		expect(result).toEqual([
			['1', '1'],
			['1', '1']
		]);
	});

	it('should handle multiple non-overlapping regions', () => {
		const regions: TGridRegionWithId<string>[] = [
			{
				id: '1',
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			{
				id: '2',
				start: { row: 0, col: 2 },
				dimension: { rows: 3, cols: 1 }
			},
			{
				id: '3',
				start: { row: 2, col: 0 },
				dimension: { rows: 1, cols: 2 }
			}
		];

		const result = getCells(regions);

		expect(result).toEqual([
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		]);
	});

	it('should handle overlapping regions with later regions taking precedence', () => {
		const regions: TGridRegionWithId<string>[] = [
			{
				id: '1',
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			{
				id: '2',
				start: { row: 1, col: 1 },
				dimension: { rows: 1, cols: 2 }
			}
		];

		const result = getCells(regions);

		expect(result).toEqual([
			['1', '1', null],
			['1', '2', '2']
		]);
	});

	it('should handle regions with gaps', () => {
		const regions: TGridRegionWithId<string>[] = [
			{
				id: '1',
				start: { row: 0, col: 0 },
				dimension: { rows: 1, cols: 1 }
			},
			{
				id: '2',
				start: { row: 0, col: 2 },
				dimension: { rows: 1, cols: 1 }
			}
		];

		const result = getCells(regions);

		expect(result).toEqual([['1', null, '2']]);
	});
});
