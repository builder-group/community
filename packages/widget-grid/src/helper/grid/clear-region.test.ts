import { describe, expect, it } from 'vitest';
import { clearRegion } from './clear-region';
import { TGridCells } from './types';

describe('clearRegion', () => {
	it('should clear a specified region', () => {
		const cells: TGridCells<string> = [
			['A', 'A', 'B'],
			['A', 'A', 'B'],
			['C', 'C', 'B']
		];

		clearRegion(cells, {
			start: { row: 0, col: 0 },
			dimension: { cols: 2, rows: 2 }
		});

		expect(cells).toEqual([
			[null, null, 'B'],
			[null, null, 'B'],
			['C', 'C', 'B']
		]);
	});
});
