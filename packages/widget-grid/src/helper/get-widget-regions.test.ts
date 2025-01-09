import { describe, expect, it } from 'vitest';
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
			{ widgetId: '1', startRow: 0, startCol: 0, width: 1, height: 1 },
			{ widgetId: '2', startRow: 0, startCol: 1, width: 1, height: 1 },
			{ widgetId: '3', startRow: 1, startCol: 0, width: 1, height: 1 },
			{ widgetId: '4', startRow: 1, startCol: 1, width: 1, height: 1 }
		]);
	});

	it('should detect rectangular widgets', () => {
		const grid = [
			['1', '1'],
			['1', '1']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', startRow: 0, startCol: 0, width: 2, height: 2 }
		]);
	});

	it('should handle empty cells marked with "-"', () => {
		const grid = [
			['1', '-'],
			['2', '2']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', startRow: 0, startCol: 0, width: 1, height: 1 },
			{ widgetId: '2', startRow: 1, startCol: 0, width: 2, height: 1 }
		]);
	});

	it('should detect multiple rectangular widgets', () => {
		const grid = [
			['1', '1', '2'],
			['1', '1', '2'],
			['3', '3', '2']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', startRow: 0, startCol: 0, width: 2, height: 2 },
			{ widgetId: '2', startRow: 0, startCol: 2, width: 1, height: 3 },
			{ widgetId: '3', startRow: 2, startCol: 0, width: 2, height: 1 }
		]);
	});

	it('should handle irregular shapes by finding largest rectangles', () => {
		const grid = [
			['1', '1', '2'],
			['1', '2', '2'],
			['3', '3', '3']
		];

		expect(getWidgetRegions(grid)).toEqual([
			{ widgetId: '1', startRow: 0, startCol: 0, width: 2, height: 1 },
			{ widgetId: '2', startRow: 0, startCol: 2, width: 1, height: 2 },
			{ widgetId: '1', startRow: 1, startCol: 0, width: 1, height: 1 },
			{ widgetId: '2', startRow: 1, startCol: 1, width: 1, height: 1 },
			{ widgetId: '3', startRow: 2, startCol: 0, width: 3, height: 1 }
		]);
	});
});
