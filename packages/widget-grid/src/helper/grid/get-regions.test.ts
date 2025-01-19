import { describe, expect, it } from 'vitest';
import { getRegions } from './get-regions';
import { TGridCells } from './types';

describe('getRegions', () => {
	it('should handle empty grid', () => {
		const cells: TGridCells<string> = [];

		const result = getRegions(cells);

		expect(result).toEqual([]);
	});

	it('should detect single cell regions with their ids', () => {
		const cells: TGridCells<string> = [
			['1', '2'],
			['3', '4']
		];

		const result = getRegions(cells);

		expect(result).toEqual([
			{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: '2', start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: '3', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: '4', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } }
		]);
	});

	it('should detect rectangular regions with same id', () => {
		const cells: TGridCells<string> = [
			['1', '1'],
			['1', '1']
		];

		const result = getRegions(cells);

		expect(result).toEqual([
			{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } }
		]);
	});

	it('should detect multiple rectangular regions with different ids', () => {
		const cells: TGridCells<string> = [
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		];

		const result = getRegions(cells);

		expect(result).toEqual([
			{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } },
			{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 3 } },
			{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 2, rows: 1 } }
		]);
	});

	it('should handle null cells', () => {
		const cells: TGridCells<string> = [
			['1', null],
			['2', '2']
		];

		const result = getRegions(cells);

		expect(result).toEqual([
			{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: '2', start: { row: 1, col: 0 }, dimension: { cols: 2, rows: 1 } }
		]);
	});

	it('should handle irregular shapes by finding largest rectangles', () => {
		const cells: TGridCells<string> = [
			['1', '1', '2'],
			['1', '2', '2'],
			['3', '3', '3']
		];

		const result = getRegions(cells);

		expect(result).toEqual([
			{ id: '1', start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 1 } },
			{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } },
			{ id: '1', start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } },
			{ id: '2', start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } },
			{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 3, rows: 1 } }
		]);
	});

	it('should compute regions strictly within range', () => {
		const cells: TGridCells<string> = [
			['1', '1', '2', '4'],
			['1', '1', '2', '4'],
			['3', '3', '2', '4']
		];

		const result = getRegions(cells, {
			region: {
				start: { row: 0, col: 2 },
				dimension: { cols: 2, rows: 2 }
			}
		});

		expect(result).toEqual([
			{ id: '2', start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 2 } },
			{ id: '4', start: { row: 0, col: 3 }, dimension: { cols: 1, rows: 2 } }
		]);
	});

	it('should handle range at grid boundaries', () => {
		const cells: TGridCells<string> = [
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		];

		const result = getRegions(cells, {
			region: {
				start: { row: 2, col: 0 },
				dimension: { cols: 2, rows: 1 }
			}
		});

		expect(result).toEqual([
			{ id: '3', start: { row: 2, col: 0 }, dimension: { cols: 2, rows: 1 } }
		]);
	});
});
