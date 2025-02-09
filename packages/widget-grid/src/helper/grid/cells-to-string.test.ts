import { describe, expect, it } from 'vitest';
import { cellsToString } from './cells-to-string';
import { TGridCells } from './types';

describe('cellsToString', () => {
	it('should return empty string for empty grid', () => {
		const cells: TGridCells<string> = [];

		const result = cellsToString(cells);

		expect(result).toBe('');
	});

	it('should format single row grid correctly', () => {
		const cells: TGridCells<string> = [['1', '2', '3']];

		const result = cellsToString(cells);

		expect(result).toBe('1 2 3');
	});

	it('should format multiple row grid correctly', () => {
		const cells: TGridCells<string> = [
			['1', '2'],
			['3', '4']
		];

		const result = cellsToString(cells);

		expect(result).toBe('1 2\n3 4');
	});

	it('should handle empty cells', () => {
		const cells: TGridCells<string> = [
			['1', null],
			[null, '2']
		];

		const result = cellsToString(cells);

		expect(result).toBe('1 -\n- 2');
	});
});
