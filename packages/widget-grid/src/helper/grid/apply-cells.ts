import { expandGrid } from './expand-grid';
import { getGridSize } from './get-grid-size';
import { TGridCellId, TGridCells, TGridPosition } from './types';

/**
 * Applies patch grid onto source grid at specified position.
 * Expands source grid if needed to fit the patch.
 */
export function applyCells<GGridCellId extends TGridCellId>(
	source: TGridCells<GGridCellId>,
	patch: TGridCells<GGridCellId>,
	position: TGridPosition
): void {
	if (!patch.length) {
		return;
	}

	const patchSize = getGridSize(patch);
	const sourceSize = getGridSize(source);

	// Calculate required size
	const requiredRows = position.row + patchSize.rows;
	const requiredCols = position.col + patchSize.cols;

	// Expand if needed
	if (requiredRows > sourceSize.rows || requiredCols > sourceSize.cols) {
		expandGrid(source, {
			strategy: 'Set',
			rows: requiredRows,
			cols: requiredCols
		});
	}

	// Apply patch
	for (let row = 0; row < patchSize.rows; row++) {
		for (let col = 0; col < patchSize.cols; col++) {
			// @ts-expect-error -- Patch will always overlap with source (expand grid)
			source[position.row + row][position.col + col] = patch[row]?.[col];
		}
	}
}
