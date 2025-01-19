import { fillRegion } from './fill-region';
import { TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Sets all cells in the specified region to null
 */
export function clearRegion<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion
): void {
	fillRegion(cells, region, null);
}
