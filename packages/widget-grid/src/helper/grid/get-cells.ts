import { expandCells } from './expand-cells';
import { fillRegion } from './fill-region';
import { getBoundingRegion } from './get-bounding-region';
import { TGridCellId, TGridCells, TGridRegionWithId } from './types';

/**
 * Transforms regions into a grid of cells.
 * Later regions in the array will overwrite cells from earlier regions where they overlap.
 */
export function getCells<GGridCellId extends TGridCellId>(
	regions: TGridRegionWithId<GGridCellId>[]
): TGridCells<GGridCellId> {
	if (!regions.length) {
		return [];
	}

	// Get bounding region to determine grid size
	const boundingRegion = getBoundingRegion(regions);
	const cells: TGridCells<GGridCellId> = [];

	// Initialize grid with minimum size
	expandCells(cells, {
		strategy: 'Set',
		rows: boundingRegion.dimension.rows,
		cols: boundingRegion.dimension.cols
	});

	// Fill regions
	for (const region of regions) {
		fillRegion(cells, region, region.id);
	}

	return cells;
}
