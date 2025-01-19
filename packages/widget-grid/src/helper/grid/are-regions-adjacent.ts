import { TGridRegion } from '../grid';

/**
 * Checks if two regions are adjacent within specified parameters
 */
export function areRegionsAdjacent(
	region1: TGridRegion,
	region2: TGridRegion,
	options: TAreRegionsAdjacentOptions = {}
): boolean {
	const { maxGap = 0, includeDiagonal = true } = options;
	const maxDistance = maxGap + 1;

	// Calculate horizontal overlap and distance
	const r1Left = region1.start.col;
	const r1Right = region1.start.col + region1.dimension.cols - 1;
	const r2Left = region2.start.col;
	const r2Right = region2.start.col + region2.dimension.cols - 1;

	const sharesHorizontalSpace = !(r1Right < r2Left || r2Right < r1Left);
	const horizontalDistance = sharesHorizontalSpace
		? 0
		: Math.min(Math.abs(r1Left - r2Right), Math.abs(r2Left - r1Right));

	// Calculate vertical overlap and distance
	const r1Top = region1.start.row;
	const r1Bottom = region1.start.row + region1.dimension.rows - 1;
	const r2Top = region2.start.row;
	const r2Bottom = region2.start.row + region2.dimension.rows - 1;

	const sharesVerticalSpace = !(r1Bottom < r2Top || r2Bottom < r1Top);
	const verticalDistance = sharesVerticalSpace
		? 0
		: Math.min(Math.abs(r1Top - r2Bottom), Math.abs(r2Top - r1Bottom));

	// Regions are adjacent if:
	// 1. They are within maxDistance in both directions
	// 2. If includeDiagonal is false, the distances must be different
	return (
		horizontalDistance <= maxDistance &&
		verticalDistance <= maxDistance &&
		(includeDiagonal || horizontalDistance !== verticalDistance)
	);
}

interface TAreRegionsAdjacentOptions {
	maxGap?: number;
	includeDiagonal?: boolean;
}
