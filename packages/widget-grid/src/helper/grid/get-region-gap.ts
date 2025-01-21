import { TGridRegion } from './types';

/**
 * Calculates the Manhattan distance between two regions.
 * Returns the minimum distance between any two points in the regions.
 */
export function getRegionGap(regionA: TGridRegion, regionB: TGridRegion): number {
	const a1 = regionA.start;
	const a2 = {
		row: regionA.start.row + regionA.dimension.rows - 1,
		col: regionA.start.col + regionA.dimension.cols - 1
	};
	const b1 = regionB.start;
	const b2 = {
		row: regionB.start.row + regionB.dimension.rows - 1,
		col: regionB.start.col + regionB.dimension.cols - 1
	};

	const horizontalDistance = Math.max(0, Math.max(a1.col - b2.col, b1.col - a2.col));
	const verticalDistance = Math.max(0, Math.max(a1.row - b2.row, b1.row - a2.row));

	return Math.max(0, horizontalDistance + verticalDistance - 1);
}
