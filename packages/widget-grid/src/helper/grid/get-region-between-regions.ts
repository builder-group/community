import { TGridRegion } from './types';

/**
 * Returns a single rectangular region that lies between two regions.
 * Only considers regions that are directly between in either horizontal or vertical direction.
 * Returns null if regions are adjacent, overlapping, or positioned diagonally.
 */
export function getRegionBetweenRegions(
	regionA: TGridRegion,
	regionB: TGridRegion
): TGridRegion | null {
	const a1 = regionA.start;
	const a2 = {
		row: a1.row + regionA.dimension.rows - 1,
		col: a1.col + regionA.dimension.cols - 1
	};
	const b1 = regionB.start;
	const b2 = {
		row: b1.row + regionB.dimension.rows - 1,
		col: b1.col + regionB.dimension.cols - 1
	};

	// Check for vertical alignment (regions share columns)
	const minCol = Math.max(a1.col, b1.col);
	const maxCol = Math.min(a2.col, b2.col);
	if (minCol <= maxCol) {
		// Regions have overlapping columns, check for vertical gap
		const [top, bottom] =
			a1.row < b1.row ? [{ end: a2.row }, { start: b1.row }] : [{ end: b2.row }, { start: a1.row }];

		if (bottom.start - top.end > 1) {
			return {
				start: { row: top.end + 1, col: minCol },
				dimension: {
					rows: bottom.start - top.end - 1,
					cols: maxCol - minCol + 1
				}
			};
		}
	}

	// Check for horizontal alignment (regions share rows)
	const minRow = Math.max(a1.row, b1.row);
	const maxRow = Math.min(a2.row, b2.row);
	if (minRow <= maxRow) {
		// Regions have overlapping rows, check for horizontal gap
		const [left, right] =
			a1.col < b1.col ? [{ end: a2.col }, { start: b1.col }] : [{ end: b2.col }, { start: a1.col }];

		if (right.start - left.end > 1) {
			return {
				start: { row: minRow, col: left.end + 1 },
				dimension: {
					rows: maxRow - minRow + 1,
					cols: right.start - left.end - 1
				}
			};
		}
	}

	return null;
}
