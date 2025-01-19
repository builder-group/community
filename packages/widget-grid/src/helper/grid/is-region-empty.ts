import { isRegionAllowedCells } from './is-region-allowed-cells';
import { TGridCellId, TGridCells, TGridRegion } from './types';

export function isRegionEmpty<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion
): boolean {
	return isRegionAllowedCells(cells, region, [null]);
}
