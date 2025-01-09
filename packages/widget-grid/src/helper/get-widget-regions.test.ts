import { describe, expect, it } from 'vitest';
import { TGridRange } from '../types';
import { getWidgetRegions } from './get-widget-regions';

describe('getWidgetRegions function', () => {
	it('should handle empty grid', () => {
		expect(getWidgetRegions([])).toEqual([]);
		expect(getWidgetRegions([[], []])).toEqual([]);
	});

	it('should detect single cell widgets', () => {
		const grid = [
			['1', '2'],
			['3', '4']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', start: { row: 0, col: 0 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '2', start: { row: 0, col: 1 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '3', start: { row: 1, col: 0 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '4', start: { row: 1, col: 1 }, dimension: { width: 1, height: 1 } }
		]);
	});

	it('should detect rectangular widgets', () => {
		const grid = [
			['1', '1'],
			['1', '1']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } }
		]);
	});

	it('should handle empty cells marked with "-"', () => {
		const grid = [
			['1', '-'],
			['2', '2']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', start: { row: 0, col: 0 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '2', start: { row: 1, col: 0 }, dimension: { width: 2, height: 1 } }
		]);
	});

	it('should detect multiple rectangular widgets', () => {
		const grid = [
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', start: { row: 0, col: 0 }, dimension: { width: 2, height: 2 } },
			{ widgetId: '2', start: { row: 0, col: 2 }, dimension: { width: 1, height: 3 } },
			{ widgetId: '3', start: { row: 2, col: 0 }, dimension: { width: 2, height: 1 } }
		]);
	});

	it('should handle irregular shapes by finding largest rectangles', () => {
		const grid = [
			['1', '1', '2'],
			['1', '2', '2'],
			['3', '3', '3']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', start: { row: 0, col: 0 }, dimension: { width: 2, height: 1 } },
			{ widgetId: '2', start: { row: 0, col: 2 }, dimension: { width: 1, height: 2 } },
			{ widgetId: '1', start: { row: 1, col: 0 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '2', start: { row: 1, col: 1 }, dimension: { width: 1, height: 1 } },
			{ widgetId: '3', start: { row: 2, col: 0 }, dimension: { width: 3, height: 1 } }
		]);
	});

	it('should compute regions strictly within range', () => {
		const grid = [
			['1', '1', '2', '4'],
			['1', '1', '2', '4'],
			['3', '3', '2', '4']
		];

		const range: TGridRange = {
			start: { row: 0, col: 2 },
			end: { row: 2, col: 4 }
		};

		expect(getWidgetRegions(grid, range)).toEqual([
			{ widgetId: '2', start: { row: 0, col: 2 }, dimension: { width: 1, height: 2 } },
			{ widgetId: '4', start: { row: 0, col: 3 }, dimension: { width: 1, height: 2 } }
		]);
	});

	it('should handle range at grid boundaries', () => {
		const grid = [
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		];

		const range: TGridRange = {
			start: { row: 2, col: 0 },
			end: { row: 3, col: 2 }
		};

		expect(getWidgetRegions(grid, range)).toEqual([
			{ widgetId: '3', start: { row: 2, col: 0 }, dimension: { width: 2, height: 1 } }
		]);
	});
});
