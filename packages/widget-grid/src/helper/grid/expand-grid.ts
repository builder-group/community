import { getGridSize } from './get-grid-size';
import { TGridCellId, TGridCells } from './types';

/**
 * Expands the grid using the specified strategy and dimensions
 */
export function expandGrid<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	options: TExpandGridMethodOptions = {}
): void {
	const { strategy = 'Add', rows = 0, cols = 0 } = options;
	const size = getGridSize(cells);

	let targetRows: number;
	let targetColumns: number;

	switch (strategy) {
		case 'Add':
			targetRows = size.rows + rows;
			targetColumns = size.cols + cols;
			break;
		case 'Set':
		default:
			targetRows = Math.max(size.rows, rows);
			targetColumns = Math.max(size.cols, cols);
	}

	// Add rows
	while (cells.length < targetRows) {
		cells.push(new Array(size.cols).fill(null));
	}

	// Add columns
	for (const row of cells) {
		while (row.length < targetColumns) {
			row.push(null);
		}
	}
}

interface TExpandGridMethodOptions {
	strategy?: 'Set' | 'Add';
	rows?: number;
	cols?: number;
}
