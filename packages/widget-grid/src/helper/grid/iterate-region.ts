import { TGridPosition, TGridRegion } from './types';

/**
 * Iterates over each cell in the specified region
 */
export function iterateRegion(
	region: TGridRegion,
	callback: (position: TGridPosition) => boolean | void
): void {
	for (let row = region.start.row; row < region.start.row + region.dimension.rows; row++) {
		for (let col = region.start.col; col < region.start.col + region.dimension.cols; col++) {
			if (callback({ row, col }) === false) {
				return;
			}
		}
	}
}
