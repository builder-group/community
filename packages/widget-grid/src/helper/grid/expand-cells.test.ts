import { describe, expect, it } from 'vitest';
import { expandCells } from './expand-cells';
import { TGridCells } from './types';

describe('expandCells', () => {
	describe('set strategy', () => {
		it('should expand to specified size', () => {
			const cells: TGridCells<string> = [
				['A', 'A'],
				['B', 'B']
			];

			expandCells(cells, { strategy: 'Set', rows: 3, cols: 4 });

			expect(cells).toEqual([
				['A', 'A', null, null],
				['B', 'B', null, null],
				[null, null, null, null]
			]);
		});

		it('should not shrink grid', () => {
			const cells: TGridCells<string> = [
				['A', 'A', 'A'],
				['B', 'B', 'B']
			];

			expandCells(cells, { strategy: 'Set', rows: 1, cols: 2 });

			expect(cells).toEqual([
				['A', 'A', 'A'],
				['B', 'B', 'B']
			]);
		});
	});

	describe('add strategy', () => {
		it('should add specified rows and cols', () => {
			const cells: TGridCells<string> = [
				['A', 'A'],
				['B', 'B']
			];

			expandCells(cells, { strategy: 'Add', rows: 1, cols: 2 });

			expect(cells).toEqual([
				['A', 'A', null, null],
				['B', 'B', null, null],
				[null, null, null, null]
			]);
		});

		it('should work with zero values', () => {
			const cells: TGridCells<string> = [
				['A', 'A'],
				['B', 'B']
			];

			expandCells(cells, { strategy: 'Add', rows: 0, cols: 0 });

			expect(cells).toEqual([
				['A', 'A'],
				['B', 'B']
			]);
		});
	});
});
