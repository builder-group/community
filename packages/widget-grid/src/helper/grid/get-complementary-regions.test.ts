import { describe, expect, it } from 'vitest';
import { getComplementaryRegions } from './get-complementary-regions';

describe('getComplementaryRegions', () => {
	it('should return empty array when regions are the same size', () => {
		const region = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
		expect(getComplementaryRegions(region, region)).toEqual([]);
	});

	it('should return all surrounding regions for centered placement', () => {
		const container = { start: { row: 0, col: 0 }, dimension: { cols: 3, rows: 3 } };
		const cutout = { start: { row: 1, col: 1 }, dimension: { cols: 1, rows: 1 } };

		const result = getComplementaryRegions(container, cutout);

		// [
		//   [Y, Y, Y], // Container (Y)
		//   [Y, X, Y], // Cutout (X)
		//   [Y, Y, Y]
		// ]
		// [
		//   [A, A, A], // Top region (A)
		//   [B, X, C], // Left (B), Cutout (X), Right (C)
		//   [D, D, D]  // Bottom region (D)
		// ]
		expect(result).toHaveLength(4); // top, left, right, bottom
		expect(result).toContainEqual({
			start: { row: 0, col: 0 },
			dimension: { cols: 3, rows: 1 }
		}); // top (A)
		expect(result).toContainEqual({
			start: { row: 1, col: 0 },
			dimension: { cols: 1, rows: 1 }
		}); // left (B)
		expect(result).toContainEqual({
			start: { row: 1, col: 2 },
			dimension: { cols: 1, rows: 1 }
		}); // right (C)
		expect(result).toContainEqual({
			start: { row: 2, col: 0 },
			dimension: { cols: 3, rows: 1 }
		}); // bottom (D)
	});

	it('should handle placement at edges', () => {
		const container = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
		const cutout = { start: { row: 0, col: 0 }, dimension: { cols: 1, rows: 1 } };

		const result = getComplementaryRegions(container, cutout);

		expect(result).toHaveLength(2); // right and bottom only
		expect(result).toContainEqual({
			start: { row: 0, col: 1 },
			dimension: { cols: 1, rows: 1 }
		}); // right
		expect(result).toContainEqual({
			start: { row: 1, col: 0 },
			dimension: { cols: 2, rows: 1 }
		}); // bottom
	});

	it('should return container region when regions do not overlap', () => {
		const container = { start: { row: 0, col: 0 }, dimension: { cols: 2, rows: 2 } };
		const cutout = { start: { row: 3, col: 3 }, dimension: { cols: 1, rows: 1 } };

		const result = getComplementaryRegions(container, cutout);

		// When regions don't overlap, the entire container is available space
		expect(result).toEqual([container]);
	});
});
