import { describe, expect, it } from 'vitest';
import { areRegionsAdjacent } from './are-regions-adjacent';

describe('areRegionsAdjacent', () => {
	it('should detect orthogonal adjacency (maxGap = 0)', () => {
		const center = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

		const orthogonalNeighbors = [
			{ start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } }, // North
			{ start: { row: 2, col: 1 }, dimension: { cols: 1, rows: 1 } }, // South
			{ start: { row: 1, col: 0 }, dimension: { cols: 1, rows: 1 } }, // West
			{ start: { row: 1, col: 2 }, dimension: { cols: 1, rows: 1 } } // East
		];

		orthogonalNeighbors.forEach((neighbor) => {
			expect(areRegionsAdjacent(center, neighbor)).toBe(true);
			expect(areRegionsAdjacent(neighbor, center)).toBe(true);
		});
	});

	it('should detect diagonal adjacency (maxGap = 0)', () => {
		const center = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

		const diagonalNeighbors = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }, // NW
			{ start: { row: 0, col: 2 }, dimension: { cols: 1, rows: 1 } }, // NE
			{ start: { row: 2, col: 0 }, dimension: { cols: 1, rows: 1 } }, // SW
			{ start: { row: 2, col: 2 }, dimension: { cols: 1, rows: 1 } } // SE
		];

		diagonalNeighbors.forEach((neighbor) => {
			expect(areRegionsAdjacent(center, neighbor, { includeDiagonal: true })).toBe(true);
			expect(areRegionsAdjacent(center, neighbor, { includeDiagonal: false })).toBe(false);
			expect(areRegionsAdjacent(neighbor, center, { includeDiagonal: true })).toBe(true);
			expect(areRegionsAdjacent(neighbor, center, { includeDiagonal: false })).toBe(false);
		});
	});

	it('should detect orthogonal adjacency with gap (maxGap = 5)', () => {
		const center = { start: { row: 6, col: 6 }, dimension: { cols: 1, rows: 1 } };

		const orthogonalNeighborsWithGap = [
			{ start: { row: 0, col: 6 }, dimension: { cols: 1, rows: 1 } }, // North (gap of 5)
			{ start: { row: 12, col: 6 }, dimension: { cols: 1, rows: 1 } }, // South (gap of 5)
			{ start: { row: 6, col: 0 }, dimension: { cols: 1, rows: 1 } }, // West (gap of 5)
			{ start: { row: 6, col: 12 }, dimension: { cols: 1, rows: 1 } } // East (gap of 5)
		];

		orthogonalNeighborsWithGap.forEach((neighbor) => {
			expect(areRegionsAdjacent(center, neighbor, { maxGap: 5 })).toBe(true);
			expect(areRegionsAdjacent(center, neighbor)).toBe(false);
			expect(areRegionsAdjacent(neighbor, center, { maxGap: 5 })).toBe(true);
			expect(areRegionsAdjacent(neighbor, center)).toBe(false);
		});
	});

	it('should detect diagonal adjacency with gap (maxGap = 5)', () => {
		const center = { start: { row: 6, col: 6 }, dimension: { cols: 1, rows: 1 } };

		const diagonalNeighborsWithGap = [
			{ start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } }, // NW (gap of 5)
			{ start: { row: 0, col: 12 }, dimension: { cols: 1, rows: 1 } }, // NE (gap of 5)
			{ start: { row: 12, col: 0 }, dimension: { cols: 1, rows: 1 } }, // SW (gap of 5)
			{ start: { row: 12, col: 12 }, dimension: { cols: 1, rows: 1 } } // SE (gap of 5)
		];

		diagonalNeighborsWithGap.forEach((neighbor) => {
			expect(areRegionsAdjacent(center, neighbor, { maxGap: 5, includeDiagonal: true })).toBe(true);
			expect(areRegionsAdjacent(center, neighbor, { includeDiagonal: true })).toBe(false);
			expect(areRegionsAdjacent(center, neighbor, { maxGap: 5, includeDiagonal: false })).toBe(
				false
			);
			expect(areRegionsAdjacent(neighbor, center, { maxGap: 5, includeDiagonal: true })).toBe(true);
			expect(areRegionsAdjacent(neighbor, center, { includeDiagonal: true })).toBe(false);
			expect(areRegionsAdjacent(neighbor, center, { maxGap: 5, includeDiagonal: false })).toBe(
				false
			);
		});
	});

	it('should detect non-adjacency when regions are too far apart', () => {
		const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };
		const region2 = { start: { row: 2, col: 2 }, dimension: { cols: 1, rows: 1 } };

		expect(areRegionsAdjacent(region1, region2)).toBe(false);
		expect(areRegionsAdjacent(region2, region1)).toBe(false);
	});

	it('should handle overlapping regions', () => {
		const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
		const region2 = { start: { row: 1, col: 1 }, dimension: { cols: 2, rows: 2 } };

		expect(areRegionsAdjacent(region1, region2)).toBe(true);
		expect(areRegionsAdjacent(region2, region1)).toBe(true);
	});

	it('should handle regions of different sizes', () => {
		const region1 = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 2 } };
		const region2 = { start: { row: 0, col: 1 }, dimension: { cols: 1, rows: 1 } };

		expect(areRegionsAdjacent(region1, region2, { includeDiagonal: true })).toBe(true);
		expect(areRegionsAdjacent(region1, region2, { includeDiagonal: false })).toBe(true);
		expect(areRegionsAdjacent(region2, region1, { includeDiagonal: true })).toBe(true);
		expect(areRegionsAdjacent(region2, region1, { includeDiagonal: false })).toBe(true);
	});
});
