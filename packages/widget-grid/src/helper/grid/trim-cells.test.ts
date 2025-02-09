import { describe, expect, it } from 'vitest';
import { trimCells } from './trim-cells';
import { TGridCells } from './types';

describe('trimCells', () => {
	it('should remove empty rows from bottom', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			[null, null],
			[null, null]
		];

		const result = trimCells(cells);

		expect(cells).toEqual([['A', 'B']]);
		expect(result).toBe(2);
	});

	it('should not remove rows with content', () => {
		const cells: TGridCells<string> = [
			['A', null],
			[null, 'B'],
			[null, null]
		];

		const result = trimCells(cells);

		expect(cells).toEqual([
			['A', null],
			[null, 'B']
		]);
		expect(result).toBe(1);
	});

	it('should remove all empty rows', () => {
		const cells: TGridCells<string> = [
			[null, null],
			[null, null]
		];

		const result = trimCells(cells);

		expect(cells).toEqual([]);
		expect(result).toBe(2);
	});

	it('should do nothing if no empty rows', () => {
		const cells: TGridCells<string> = [
			['A', 'B'],
			['C', null]
		];

		const result = trimCells(cells);

		expect(cells).toEqual([
			['A', 'B'],
			['C', null]
		]);
		expect(result).toBe(0);
	});
});
