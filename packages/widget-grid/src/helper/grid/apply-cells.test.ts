import { describe, expect, it } from 'vitest';
import { applyCells } from './apply-cells';
import { TGridCells } from './types';

describe('applyCells', () => {
	it('should apply patch grid onto source grid at specified position', () => {
		const source: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];
		const patch: TGridCells<string> = [
			['X', 'Y'],
			['Z', 'W']
		];

		applyCells(source, patch, { row: 1, col: 1 });

		expect(source).toEqual([
			['A', 'B', null],
			['C', 'X', 'Y'],
			[null, 'Z', 'W']
		]);
	});

	it('should handle empty patch grid', () => {
		const source: TGridCells<string> = [
			['A', 'B'],
			['C', 'D']
		];
		const patch: TGridCells<string> = [];

		applyCells(source, patch, { row: 0, col: 0 });

		expect(source).toEqual([
			['A', 'B'],
			['C', 'D']
		]);
	});

	it('should handle empty source grid', () => {
		const source: TGridCells<string> = [];
		const patch: TGridCells<string> = [
			['X', 'Y'],
			['Z', 'W']
		];

		applyCells(source, patch, { row: 0, col: 0 });

		expect(source).toEqual([
			['X', 'Y'],
			['Z', 'W']
		]);
	});

	it('should expand source grid when patch exceeds bounds', () => {
		const source: TGridCells<string> = [['A']];

		const patch: TGridCells<string> = [
			['X', 'Y'],
			['Z', 'W']
		];

		applyCells(source, patch, { row: 1, col: 1 });

		expect(source).toEqual([
			['A', null, null],
			[null, 'X', 'Y'],
			[null, 'Z', 'W']
		]);
	});
});
