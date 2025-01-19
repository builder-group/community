import { getCell } from './get-cell';
import { iterateRegion } from './iterate-region';
import { TGridCell, TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Checks if a region contains only cells with the specified allowed IDs
 */
export function isRegionAllowedCells<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion,
	allowedCells: TGridCell<GGridCellId>[]
): boolean {
	let isAllowed = true;
	iterateRegion(region, (pos) => {
		const cellValue = getCell(cells, pos);
		if (!allowedCells.includes(cellValue)) {
			isAllowed = false;
			return false; // Stop iteration
		}
		return;
	});
	return isAllowed;
}
