import { TGridCellId, TGridCells, TGridDimensions } from './types';

/**
 * Returns the dimensions of the grid
 */
export function getGridSize<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>
): TGridDimensions {
	return {
		rows: cells.length,
		cols: cells[0]?.length ?? 0
	};
}
