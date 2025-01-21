import { doesRegionConsistOfCells } from './does-region-consist-of-cells';
import { TGridCellId, TGridCells, TGridRegion } from './types';

export function isRegionEmpty<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region: TGridRegion
): boolean {
	return doesRegionConsistOfCells(cells, region, [null]);
}
