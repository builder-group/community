import { describe, expect, it } from 'vitest';
import { iterateRegion } from './iterate-region';
import { TGridPosition } from './types';

describe('iterateRegion', () => {
	it('should iterate over all cells in the specified region', () => {
		const visitedPositions: TGridPosition[] = [];

		iterateRegion(
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 2, cols: 2 }
			},
			(pos) => {
				visitedPositions.push({ ...pos });
			}
		);

		expect(visitedPositions).toEqual([
			{ row: 0, col: 0 },
			{ row: 0, col: 1 },
			{ row: 1, col: 0 },
			{ row: 1, col: 1 }
		]);
	});

	it('should handle regions with offset starting position', () => {
		const visitedPositions: TGridPosition[] = [];

		iterateRegion(
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 2, cols: 2 }
			},
			(pos) => {
				visitedPositions.push({ ...pos });
			}
		);

		expect(visitedPositions).toEqual([
			{ row: 1, col: 1 },
			{ row: 1, col: 2 },
			{ row: 2, col: 1 },
			{ row: 2, col: 2 }
		]);
	});

	it('should handle single cell regions', () => {
		const visitedPositions: TGridPosition[] = [];

		iterateRegion(
			{
				start: { row: 1, col: 1 },
				dimension: { rows: 1, cols: 1 }
			},
			(pos) => {
				visitedPositions.push({ ...pos });
			}
		);

		expect(visitedPositions).toEqual([{ row: 1, col: 1 }]);
	});

	it('should stop iteration when callback returns false', () => {
		const visitedPositions: TGridPosition[] = [];

		iterateRegion(
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 3, cols: 3 }
			},
			(pos) => {
				visitedPositions.push({ ...pos });
				// Stop after visiting 4 cells
				if (visitedPositions.length === 4) {
					return false;
				}
			}
		);

		expect(visitedPositions).toHaveLength(4);
		expect(visitedPositions).toEqual([
			{ row: 0, col: 0 },
			{ row: 0, col: 1 },
			{ row: 0, col: 2 },
			{ row: 1, col: 0 }
		]);
	});

	it('should handle empty regions (0 dimensions)', () => {
		const visitedPositions: TGridPosition[] = [];

		iterateRegion(
			{
				start: { row: 0, col: 0 },
				dimension: { rows: 0, cols: 0 }
			},
			(pos) => {
				visitedPositions.push({ ...pos });
			}
		);

		expect(visitedPositions).toHaveLength(0);
	});
});
