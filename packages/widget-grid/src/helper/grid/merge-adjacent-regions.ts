import { TGridRegion } from './types';

/**
 * Merges adjacent regions into larger regions where possible.
 * Mutates and returns the input array.
 * Regions are merged if they:
 * - Share the same height (for horizontal merging) or width (for vertical merging)
 * - Are directly adjacent (no gaps)
 * - Have matching row positions (for horizontal) or column positions (for vertical)
 */
export function mergeAdjacentRegions(regions: TGridRegion[]): TGridRegion[] {
	if (regions.length <= 1) {
		return regions;
	}

	let didMerge: boolean;
	do {
		didMerge = tryMergeDirection(regions, 'horizontal') || tryMergeDirection(regions, 'vertical');
	} while (didMerge);

	return regions;
}

/**
 * Checks if two regions can be merged in the specified direction
 */
function canMergeRegions(
	region1: TGridRegion,
	region2: TGridRegion,
	direction: TMergeDirection
): boolean {
	switch (direction) {
		case 'horizontal':
			return (
				region1.dimension.rows === region2.dimension.rows &&
				region1.start.row === region2.start.row &&
				(region1.start.col + region1.dimension.cols === region2.start.col ||
					region2.start.col + region2.dimension.cols === region1.start.col)
			);
		case 'vertical':
			return (
				region1.dimension.cols === region2.dimension.cols &&
				region1.start.col === region2.start.col &&
				(region1.start.row + region1.dimension.rows === region2.start.row ||
					region2.start.row + region2.dimension.rows === region1.start.row)
			);
	}
}

/**
 * Merges two adjacent regions into a single region
 */
function mergeRegions(
	region1: TGridRegion,
	region2: TGridRegion,
	direction: TMergeDirection
): TGridRegion {
	switch (direction) {
		case 'horizontal':
			return {
				start: {
					row: region1.start.row,
					col: Math.min(region1.start.col, region2.start.col)
				},
				dimension: {
					rows: region1.dimension.rows,
					cols: region1.dimension.cols + region2.dimension.cols
				}
			};
		case 'vertical':
			return {
				start: {
					row: Math.min(region1.start.row, region2.start.row),
					col: region1.start.col
				},
				dimension: {
					rows: region1.dimension.rows + region2.dimension.rows,
					cols: region1.dimension.cols
				}
			};
	}
}

/**
 * Attempts to merge adjacent regions in the specified direction
 * Returns true if a merge occurred
 */
function tryMergeDirection(regions: TGridRegion[], direction: TMergeDirection): boolean {
	for (let i = 0; i < regions.length; i++) {
		for (let j = i + 1; j < regions.length; j++) {
			const region1 = regions[i];
			const region2 = regions[j];
			if (region1 == null || region2 == null || !canMergeRegions(region1, region2, direction)) {
				continue;
			}

			regions[i] = mergeRegions(region1, region2, direction);
			regions.splice(j, 1);
			return true;
		}
	}

	return false;
}

type TMergeDirection = 'horizontal' | 'vertical';
