import { TGridRegion } from './types';

/**
 * Returns an array of regions that represent the remaining regions from the container region
 * when the cutout region is "cut out" from it.
 * @example
 * [
 *   [Y, Y, Y], // Container (Y)
 *   [Y, X, Y], // Cutout (X)
 *   [Y, Y, Y]
 * ]
 * [
 *   [A, A, A], // Top region (A)
 *   [B, X, C], // Left (B), Cutout (X), Right (C)
 *   [D, D, D]  // Bottom region (D)
 * ]
 */
export function getComplementaryRegions(
	containerRegion: TGridRegion,
	cutoutRegion: TGridRegion
): TGridRegion[] {
	// Check if regions overlap at all
	if (
		cutoutRegion.start.row >= containerRegion.start.row + containerRegion.dimension.rows ||
		cutoutRegion.start.row + cutoutRegion.dimension.rows <= containerRegion.start.row ||
		cutoutRegion.start.col >= containerRegion.start.col + containerRegion.dimension.cols ||
		cutoutRegion.start.col + cutoutRegion.dimension.cols <= containerRegion.start.col
	) {
		// If no overlap, return the entire container as available space
		return [containerRegion];
	}

	const complementary: TGridRegion[] = [];

	// Top region (if exists)
	if (cutoutRegion.start.row > containerRegion.start.row) {
		complementary.push({
			start: containerRegion.start,
			dimension: {
				cols: containerRegion.dimension.cols,
				rows: cutoutRegion.start.row - containerRegion.start.row
			}
		});
	}

	// Left region (if exists)
	if (cutoutRegion.start.col > containerRegion.start.col) {
		complementary.push({
			start: {
				row: cutoutRegion.start.row,
				col: containerRegion.start.col
			},
			dimension: {
				cols: cutoutRegion.start.col - containerRegion.start.col,
				rows: cutoutRegion.dimension.rows
			}
		});
	}

	// Right region (if exists)
	const placedEndCol = cutoutRegion.start.col + cutoutRegion.dimension.cols;
	const containerEndCol = containerRegion.start.col + containerRegion.dimension.cols;
	if (placedEndCol < containerEndCol) {
		complementary.push({
			start: {
				row: cutoutRegion.start.row,
				col: placedEndCol
			},
			dimension: {
				cols: containerEndCol - placedEndCol,
				rows: cutoutRegion.dimension.rows
			}
		});
	}

	// Bottom region (if exists)
	const placedEndRow = cutoutRegion.start.row + cutoutRegion.dimension.rows;
	const containerEndRow = containerRegion.start.row + containerRegion.dimension.rows;
	if (placedEndRow < containerEndRow) {
		complementary.push({
			start: {
				row: placedEndRow,
				col: containerRegion.start.col
			},
			dimension: {
				cols: containerRegion.dimension.cols,
				rows: containerEndRow - placedEndRow
			}
		});
	}

	return complementary;
}
