import { TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Creates a deep copy of the cells array.
 * If a region is specified, only copies that region's cells.
 */
export function createCellsSnapshot<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	region?: TGridRegion
): TGridCells<GGridCellId> {
	if (region == null) {
		return cells.map((row) => [...row]);
	}

	const snapshot: TGridCells<GGridCellId> = [];

	for (let row = region.start.row; row < region.start.row + region.dimension.rows; row++) {
		if (snapshot[row] == null) {
			snapshot[row] = [];
		}
		for (let col = region.start.col; col < region.start.col + region.dimension.cols; col++) {
			// @ts-expect-error -- Guranteed to have a row at this point
			snapshot[row][col] = cells[row]?.[col] ?? null;
		}
	}

	return snapshot;
}
