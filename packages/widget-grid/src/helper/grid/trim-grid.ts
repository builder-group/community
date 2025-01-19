import { TGridCellId, TGridCells } from './types';

/**
 * Removes empty rows from the bottom of the grid.
 * A row is considered empty if all its cells are null.
 * Will not remove rows that contain any non-null cells.
 */
export function trimGrid<GGridCellId extends TGridCellId>(cells: TGridCells<GGridCellId>): number {
	let rowsRemoved = 0;

	// Start from bottom, remove rows until we find non-empty row
	while (cells.length > 0) {
		const lastRow = cells[cells.length - 1];
		if (lastRow?.some((cell) => cell != null)) {
			break;
		}
		cells.pop();
		rowsRemoved++;
	}

	return rowsRemoved;
}
