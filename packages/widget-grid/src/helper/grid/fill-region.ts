import { iterateRegion } from './iterate-region';
import { TGridCell, TGridCellId, TGridCells, TGridRegion } from './types';

/**
 * Fills the specified region with the given ID
 */
export function fillRegion<GGridCellId extends TGridCellId>(
	cells: TGridCells<GGridCellId>,
	targetRegion: TGridRegion,
	value: TGridCell<GGridCellId>
): void {
	iterateRegion(targetRegion, ({ row, col }) => {
		if (cells[row] != null) {
			cells[row][col] = value;
		}
	});
}
