import { describe, expect, it } from 'vitest';
import { TWidgetRegion } from '../types';
import { rearrangeGrid } from './rearrange-grid';

describe('rearrangeGrid function', () => {
	it('should move a widget to a new region if space is available', () => {
		const grid = [
			['1', '1', '-'],
			['-', '-', '-'],
			['-', '-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 1, col: 0 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion
		});

		expect(result).toBe(true);
		expect(grid).toEqual([
			['-', '-', '-'],
			['1', '1', '-'],
			['-', '-', '-']
		]);
	});

	it('should swap widgets if the target region is occupied', () => {
		const grid = [
			['1', '1', '-'],
			['2', '-', '-'],
			['-', '-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 1, col: 0 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion
		});

		expect(result).toBe(true);
		expect(grid).toEqual([
			['2', '-', '-'],
			['1', '1', '-'],
			['-', '-', '-']
		]);
	});

	it('should expand south when allowed', () => {
		const grid = [
			['1', '1', '-'],
			['-', '-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 2, col: 0 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion,
			expansion: { south: true }
		});

		expect(result).toBe(true);
		expect(grid).toEqual([
			['-', '-', '-'],
			['-', '-', '-'],
			['1', '1', '-']
		]);
	});

	it('should expand east when allowed', () => {
		const grid = [
			['1', '1'],
			['-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 0, col: 1 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion,
			expansion: { east: true }
		});

		expect(result).toBe(true);
		expect(grid).toEqual([
			['-', '1', '1'],
			['-', '-', '-']
		]);
	});

	it('should handle both south and east expansion simultaneously', () => {
		const grid = [
			['1', '1'],
			['-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 2, col: 2 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion,
			expansion: {
				south: true,
				east: true
			}
		});

		expect(result).toBe(true);
		expect(grid).toEqual([
			['-', '-', '-', '-'],
			['-', '-', '-', '-'],
			['-', '-', '1', '1']
		]);
	});

	it('should not allow expansion beyond grid bounds if not enabled', () => {
		const grid = [
			['1', '1', '-'],
			['-', '-', '-']
		];

		const targetRegion: TWidgetRegion = {
			start: { row: 2, col: 0 },
			dimension: { width: 2, height: 1 }
		};

		const result = rearrangeGrid({
			grid,
			widgetId: '1',
			targetRegion
			// no expansion config provided
		});

		expect(result).toBe(false);
		expect(grid).toEqual([
			['1', '1', '-'],
			['-', '-', '-']
		]);
	});
});
