import { getCell } from './get-cell';
import { iterateRegion } from './iterate-region';
import { TGridCell, TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Checks if a region contains all of the specified cells
 */
export function doesRegionContainCells<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion,
	searchCells: TGridCell<GGridCellId>[]
): boolean {
	const foundCells = new Set<TGridCell<GGridCellId>>();
	iterateRegion(region, (pos) => {
		const cell = getCell(cells, pos);
		if (searchCells.includes(cell)) {
			foundCells.add(cell);
		}
		if (foundCells.size === searchCells.length) {
			return false; // Stop iteration, we found all cells
		}
		return;
	});
	return foundCells.size === searchCells.length;
}
