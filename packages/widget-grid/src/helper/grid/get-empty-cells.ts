import { getCell } from './get-cell';
import { isRegionOutOfBounds } from './is-region-out-of-bounds';
import { iterateRegion } from './iterate-region';
import { posToRegion } from './pos-to-region';
import { TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Returns an array of 1x1 regions representing empty cells within the given region
 */
export function getEmptyCells<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion
): TGridRegion[] {
	const emptyCells: TGridRegion[] = [];

	iterateRegion(region, (pos) => {
		const cellRegion = posToRegion(pos);
		if (getCell(cells, pos) == null && !isRegionOutOfBounds(cells, cellRegion)) {
			emptyCells.push(cellRegion);
		}
	});

	return emptyCells;
}
