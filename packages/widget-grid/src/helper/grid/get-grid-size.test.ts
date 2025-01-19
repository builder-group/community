import { describe, expect, it } from 'vitest';
import { getGridSize } from './get-grid-size';
import { TGridCells } from './types';

describe('getGridSize', () => {
	it('should return dimensions of a non-empty grid', () => {
		const cells = [
			['A', 'B', 'C'],
			['D', 'E', 'F']
		];

		const result = getGridSize(cells);

		expect(result).toEqual({ rows: 2, cols: 3 });
	});

	it('should return dimensions with zero columns for an empty grid', () => {
		const cells: TGridCells<string> = [];

		const result = getGridSize(cells);

		expect(result).toEqual({ rows: 0, cols: 0 });
	});
});
