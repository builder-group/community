import { TGridCellId, TGridCells } from './types';

/**
 * String representation of the grid, using '-' for empty cells
 */
export function gridToString<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>
): string {
	return cells.map((row) => row.map((cell) => (cell == null ? '-' : cell)).join(' ')).join('\n');
}
