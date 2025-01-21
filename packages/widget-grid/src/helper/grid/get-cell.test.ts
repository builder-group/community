import { describe, expect, it } from 'vitest';
import { getCell } from './get-cell';
import { TGridCells } from './types';

describe('getCell', () => {
	it('should return cell value at specified position', () => {
		const cells: TGridCells<string> = [
			['A', 'B', 'C'],
			['D', 'E', 'F'],
			['G', 'H', 'I']
		];

		expect(getCell(cells, { row: 0, col: 0 })).toBe('A');
		expect(getCell(cells, { row: 1, col: 1 })).toBe('E');
		expect(getCell(cells, { row: 2, col: 2 })).toBe('I');
	});

	it('should return null for out of bounds positions', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];

		expect(getCell(cells, { row: -1, col: 0 })).toBe(null);
		expect(getCell(cells, { row: 0, col: -1 })).toBe(null);
		expect(getCell(cells, { row: 2, col: 0 })).toBe(null);
		expect(getCell(cells, { row: 0, col: 2 })).toBe(null);
	});

	it('should handle null cells', () => {
		const cells: TGridCells<string> = [
			['A', null, 'B'],
			[null, 'C', null]
		];

		expect(getCell(cells, { row: 0, col: 1 })).toBe(null);
		expect(getCell(cells, { row: 1, col: 0 })).toBe(null);
		expect(getCell(cells, { row: 1, col: 2 })).toBe(null);
	});

	it('should handle empty grid', () => {
		const cells: TGridCells<string> = [];

		expect(getCell(cells, { row: 0, col: 0 })).toBe(null);
	});
});
