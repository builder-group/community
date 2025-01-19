import { describe, expect, it } from 'vitest';
import { fillRegion } from './fill-region';
import { TGridCells } from './types';

describe('fillRegion', () => {
	it('should fill a specified region with content', () => {
		const cells: TGridCells<string> = [
			[null, null, 'B'],
			[null, null, 'B'],
			['C', 'C', 'B']
		];

		fillRegion(
			cells,
			{
				start: { row: 0, col: 0 },
				dimension: { cols: 2, rows: 2 }
			},
			'A'
		);

		expect(cells).toEqual([
			['A', 'A', 'B'],
			['A', 'A', 'B'],
			['C', 'C', 'B']
		]);
	});
});
